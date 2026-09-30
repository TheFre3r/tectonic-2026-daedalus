import type { IncomingMessage, ServerResponse } from 'node:http'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

const MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.8-flash',
]

const ALLOWED_REASONS = new Set([
  'dead-end',
  'not-solved',
  'back-loops',
  'no-results',
  'ask-mia',
])

type Turn = { role: 'user' | 'model'; text: string }

type CsrfRecord = { token: string; expires: number }

const csrfStore = new Map<string, CsrfRecord>()
const ipHits = new Map<string, number[]>()

function sanitize(input: unknown, max = 500): string {
  if (typeof input !== 'string') return ''
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max)
}

function clientIp(req: IncomingMessage): string {
  const fwd = (req.headers['x-forwarded-for'] as string | undefined)
    ?.split(',')[0]
    ?.trim()
  return fwd || req.socket.remoteAddress || 'unknown'
}

function rateOk(ip: string, limit = 20, windowMs = 60_000): boolean {
  const now = Date.now()
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < windowMs)
  if (hits.length >= limit) {
    ipHits.set(ip, hits)
    return false
  }
  hits.push(now)
  ipHits.set(ip, hits)
  return true
}

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (c: Buffer) => {
      size += c.length
      if (size > 24_576) {
        reject(new Error('Payload too large'))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'))
      } catch {
        reject(new Error('Invalid JSON'))
      }
    })
    req.on('error', reject)
  })
}

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {}
  return Object.fromEntries(
    header.split(';').map((part) => {
      const [k, ...rest] = part.trim().split('=')
      return [k, decodeURIComponent(rest.join('=') || '')]
    }),
  )
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

function sameOrigin(req: IncomingMessage): boolean {
  const host = req.headers.host
  if (!host) return false
  const origin = req.headers.origin
  const referer = req.headers.referer
  const allowed = new Set([
    `http://${host}`,
    `https://${host}`,
    `http://127.0.0.1:5173`,
    `http://localhost:5173`,
  ])
  if (origin) return allowed.has(origin)
  if (referer) {
    try {
      const u = new URL(referer)
      return allowed.has(`${u.protocol}//${u.host}`)
    } catch {
      return false
    }
  }
  // Non-browser tools without Origin: deny state-changing calls
  return false
}

function json(
  res: ServerResponse,
  status: number,
  body: Record<string, unknown>,
) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

function systemPrompt(context: Record<string, unknown>): string {
  // Only pass allowlisted, sanitized fields into the model.
  const safe = {
    reason: context.reason,
    category: sanitize(context.category, 80),
    question: sanitize(context.question, 160),
    searchQuery: sanitize(context.searchQuery, 160),
    answers: Array.isArray(context.answers)
      ? context.answers.slice(0, 12).map((a) => {
          const row = a as Record<string, unknown>
          return {
            question: sanitize(row.question, 120),
            answer: sanitize(row.answer, 80),
          }
        })
      : [],
    tried: Array.isArray(context.tried)
      ? context.tried.slice(0, 8).map((t) => sanitize(t, 80))
      : [],
  }
  return `Je bent Mia, KBC Snelhulp-assistent (hackathon prototype).
Nederlands, warm, concreet. Voer geen echte bankacties uit.
CONTEXT: ${JSON.stringify(safe)}
Antwoord ALTIJD als JSON: {"reply":"...","suggestions":["..."],"momentHint":null,"urgency":"low"}`
}

async function callGemini(
  apiKey: string,
  context: Record<string, unknown>,
  history: Turn[],
) {
  let lastErr = 'upstream unavailable'
  for (const model of MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt(context) }] },
            contents: history.map((t) => ({
              role: t.role,
              parts: [{ text: t.text }],
            })),
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 700,
              responseMimeType: 'application/json',
            },
          }),
        },
      )
      if (!res.ok) {
        lastErr = 'upstream error'
        continue
      }
      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[]
      }
      const text =
        data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ??
        ''
      if (text.trim()) return text
      lastErr = 'empty upstream'
    } catch {
      lastErr = 'upstream failure'
    }
  }
  throw new Error(lastErr)
}

function validateContext(ctx: unknown): Record<string, unknown> | null {
  if (!ctx || typeof ctx !== 'object') return null
  const c = ctx as Record<string, unknown>
  if (typeof c.reason !== 'string' || !ALLOWED_REASONS.has(c.reason)) return null
  return c
}

function secureApiPlugin(mode: string): Plugin {
  // NEVER read VITE_GEMINI_API_KEY — that would ship secrets to the client bundle.
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = (env.GEMINI_API_KEY || '').trim()

  return {
    name: 'kbc-secure-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          next()
          return
        }

        const ip = clientIp(req)

        // —— Session / CSRF bootstrap ——
        if (req.url.startsWith('/api/session') && req.method === 'GET') {
          if (!rateOk(`sess:${ip}`, 30, 60_000)) {
            json(res, 429, { error: 'Rate limit' })
            return
          }
          const sid = randomBytes(16).toString('hex')
          const token = randomBytes(24).toString('hex')
          csrfStore.set(sid, { token, expires: Date.now() + 2 * 60 * 60 * 1000 })
          // Clean expired occasionally
          if (csrfStore.size > 2000) {
            const now = Date.now()
            for (const [k, v] of csrfStore) {
              if (v.expires < now) csrfStore.delete(k)
            }
          }
          res.setHeader(
            'Set-Cookie',
            `kbc_sid=${sid}; Path=/; SameSite=Strict; HttpOnly; Max-Age=7200`,
          )
          json(res, 200, { csrfToken: token })
          return
        }

        // —— Mia proxy ——
        if (req.url.startsWith('/api/mia')) {
          if (req.method !== 'POST') {
            json(res, 405, { error: 'Method not allowed' })
            return
          }
          if (!sameOrigin(req)) {
            json(res, 403, { error: 'Forbidden origin' })
            return
          }
          const ctype = (req.headers['content-type'] || '').toLowerCase()
          if (!ctype.includes('application/json')) {
            json(res, 415, { error: 'Unsupported media type' })
            return
          }
          if (!rateOk(`mia:${ip}`, 15, 60_000)) {
            json(res, 429, { error: 'Rate limit' })
            return
          }

          const cookies = parseCookies(req.headers.cookie)
          const sid = cookies.kbc_sid
          const headerToken = sanitize(req.headers['x-csrf-token'], 128)
          const record = sid ? csrfStore.get(sid) : undefined
          if (
            !sid ||
            !record ||
            record.expires < Date.now() ||
            !headerToken ||
            !safeEqual(record.token, headerToken)
          ) {
            json(res, 401, { error: 'Unauthorized' })
            return
          }

          if (!apiKey) {
            json(res, 503, { error: 'Service unavailable' })
            return
          }

          try {
            const body = (await readJson(req)) as {
              context?: unknown
              history?: Turn[]
            }
            const context = validateContext(body.context)
            if (!context || !Array.isArray(body.history)) {
              json(res, 400, { error: 'Bad request' })
              return
            }
            const history = body.history
              .slice(-20)
              .map((t) => ({
                role:
                  t.role === 'user' || t.role === 'model'
                    ? t.role
                    : ('user' as const),
                text: sanitize(t.text, 500),
              }))
              .filter((t) => t.text)
            if (!history.length) {
              json(res, 400, { error: 'Bad request' })
              return
            }

            const raw = await callGemini(apiKey, context, history)
            // Strip controls only — do NOT HTML-escape (would break JSON).
            const safeRaw = raw
              .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
              .slice(0, 4000)
            json(res, 200, { raw: safeRaw })
          } catch {
            // Do not leak upstream details (info disclosure).
            json(res, 502, { error: 'Upstream failure' })
          }
          return
        }

        json(res, 404, { error: 'Not found' })
      })
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), secureApiPlugin(mode)],
  // Ensure env prefixed with VITE_GEMINI never gets recommended
  envPrefix: ['VITE_'],
  server: {
    headers: {
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin',
    },
  },
  preview: {
    headers: {
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin',
    },
  },
}))
