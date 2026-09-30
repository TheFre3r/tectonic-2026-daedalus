import type { IncomingMessage, ServerResponse } from 'node:http'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

const MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.8-flash',
]

type Turn = { role: 'user' | 'model'; text: string }

function sanitize(input: unknown, max = 500): string {
  if (typeof input !== 'string') return ''
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max)
}

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (c: Buffer) => {
      size += c.length
      if (size > 32_000) {
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

const ipHits = new Map<string, number[]>()

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

function systemPrompt(context: Record<string, unknown>): string {
  return `Je bent Mia, KBC Snelhulp-assistent (hackathon prototype, Team Daedalus).
Nederlands, warm, concreet. Geen echte bankacties uitvoeren.
CONTEXT: ${JSON.stringify(context).slice(0, 1500)}
Antwoord ALTIJD als JSON: {"reply":"...","suggestions":["..."],"momentHint":null,"urgency":"low"}
urgency high bij fraude/oplichting. momentHint: verhuizen|eerste-job|zorgmoment|null.`
}

async function callGemini(
  apiKey: string,
  context: Record<string, unknown>,
  history: Turn[],
) {
  let lastErr = 'No model'
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
        lastErr = `${model} ${res.status}`
        continue
      }
      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[]
      }
      const text =
        data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ??
        ''
      if (text.trim()) return text
      lastErr = `${model} empty`
    } catch (e) {
      lastErr = e instanceof Error ? e.message : 'fetch failed'
    }
  }
  throw new Error(lastErr)
}

function miaProxyPlugin(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = (env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || '').trim()

  return {
    name: 'mia-secure-proxy',
    configureServer(server) {
      server.middlewares.use(
        async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          if (!req.url?.startsWith('/api/mia') || req.method !== 'POST') {
            next()
            return
          }

          res.setHeader('X-Content-Type-Options', 'nosniff')
          res.setHeader('Cache-Control', 'no-store')

          const ip =
            (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
            req.socket.remoteAddress ||
            'unknown'

          if (!rateOk(ip)) {
            res.statusCode = 429
            res.end(JSON.stringify({ error: 'Rate limit' }))
            return
          }

          if (!apiKey) {
            res.statusCode = 503
            res.end(JSON.stringify({ error: 'API key not configured on server' }))
            return
          }

          try {
            const body = (await readJson(req)) as {
              context?: Record<string, unknown>
              history?: Turn[]
            }
            if (!body.context || !Array.isArray(body.history)) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Bad request' }))
              return
            }
            const history = body.history
              .slice(-24)
              .map((t) => ({
                role:
                  t.role === 'user' || t.role === 'model' ? t.role : ('user' as const),
                text: sanitize(t.text, 500),
              }))
              .filter((t) => t.text)
            if (!history.length) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Empty history' }))
              return
            }

            const raw = await callGemini(apiKey, body.context, history)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ raw }))
          } catch (e) {
            res.statusCode = 502
            res.end(
              JSON.stringify({
                error: e instanceof Error ? e.message : 'Upstream failure',
              }),
            )
          }
        },
      )
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), miaProxyPlugin(mode)],
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin',
    },
  },
}))
