/**
 * Defense-in-depth helpers for the hackathon prototype.
 * Not a substitute for a real bank security program — but hardens the demo.
 */

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
const HTML_SPECIAL: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function sanitizeText(input: unknown, maxLen = 500): string {
  if (typeof input !== 'string') return ''
  return input
    .replace(CONTROL_CHARS, '')
    .replace(/[<>&"']/g, (c) => HTML_SPECIAL[c] ?? c)
    .trim()
    .slice(0, maxLen)
}

export function isSafeHttpUrl(url: string): boolean {
  try {
    const u = new URL(url, window.location.origin)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

type Bucket = { timestamps: number[] }

const buckets = new Map<string, Bucket>()

/** Sliding-window rate limit (client + mirrored on proxy). */
export function allowRequest(
  key: string,
  limit = 12,
  windowMs = 60_000,
): boolean {
  const now = Date.now()
  const bucket = buckets.get(key) ?? { timestamps: [] }
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs)
  if (bucket.timestamps.length >= limit) {
    buckets.set(key, bucket)
    return false
  }
  bucket.timestamps.push(now)
  buckets.set(key, bucket)
  return true
}

export function validateChatPayload(body: unknown): {
  ok: true
  context: Record<string, unknown>
  history: { role: 'user' | 'model'; text: string }[]
} | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid body' }
  const b = body as Record<string, unknown>
  if (!b.context || typeof b.context !== 'object') {
    return { ok: false, error: 'Missing context' }
  }
  if (!Array.isArray(b.history)) return { ok: false, error: 'Missing history' }
  if (b.history.length > 24) return { ok: false, error: 'History too long' }

  const history: { role: 'user' | 'model'; text: string }[] = []
  for (const turn of b.history) {
    if (!turn || typeof turn !== 'object') continue
    const t = turn as Record<string, unknown>
    const role = t.role === 'user' || t.role === 'model' ? t.role : null
    const text = sanitizeText(t.text, 500)
    if (!role || !text) continue
    history.push({ role, text })
  }
  if (history.length === 0) return { ok: false, error: 'Empty history' }

  return {
    ok: true,
    context: b.context as Record<string, unknown>,
    history,
  }
}

export const SECURITY_BADGE = {
  title: 'Superman security (prototype)',
  points: [
    'Gemini-key blijft op de server (Vite proxy) — niet in de browser-bundle',
    'CSP: default-src self; scripts alleen same-origin',
    'Input sanitization + max lengte op alle chatberichten',
    'Rate limiting (client + proxy) tegen flood/abuse',
    'Geen dangerouslySetInnerHTML; React escapt output',
    'Sessie alleen in sessionStorage (tab-scoped), geen tokens in localStorage',
    'Strict allowlist van scenario-IDs en vaste actieknoppen',
  ],
}
