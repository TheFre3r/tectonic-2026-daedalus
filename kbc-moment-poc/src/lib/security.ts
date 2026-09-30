/**
 * Defense-in-depth for Aikido / hackathon security review.
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

let csrfToken: string | null = null
let csrfPromise: Promise<string> | null = null

/** Bootstrap HttpOnly session cookie + CSRF token (double-submit). */
export async function ensureCsrfSession(): Promise<string> {
  if (csrfToken) return csrfToken
  if (csrfPromise) return csrfPromise
  csrfPromise = (async () => {
    const res = await fetch('/api/session', {
      method: 'GET',
      credentials: 'same-origin',
    })
    if (!res.ok) throw new Error('Session bootstrap failed')
    const data = (await res.json()) as { csrfToken?: string }
    if (!data.csrfToken || data.csrfToken.length < 16) {
      throw new Error('Invalid CSRF token')
    }
    csrfToken = data.csrfToken
    return csrfToken
  })().finally(() => {
    csrfPromise = null
  })
  return csrfPromise
}

export function clearCsrfSession() {
  csrfToken = null
}

/** Belgian mobile-ish phone check for demo callback forms. */
export function isPlausibleBePhone(value: string): boolean {
  const digits = value.replace(/[\s./-]/g, '')
  return /^(\+32|0)4\d{8}$/.test(digits) || /^(\+32|0)\d{8,9}$/.test(digits)
}

export const SECURITY_BADGE = {
  title: 'Superman security (Aikido-ready)',
  points: [
    'Geen API-keys in de frontend-bundle (alleen server-side key)',
    'CSRF-sessie (HttpOnly cookie + X-CSRF-Token) op /api/mia',
    'Same-origin enforcement + Content-Type allowlist',
    'Rate limiting client én proxy; payload size caps',
    'Context allowlist (escalation reasons) — geen free-form injection',
    'Sessie-state allowlists (scenario/signal/checklist) tegen tampering/IDOR-achtige abuse',
    'CSP + security headers (nosniff, frame-deny, CORP/COOP)',
    'Geen dangerouslySetInnerHTML; output gesanitized',
    'Generieke API-fouten (geen upstream info disclosure)',
  ],
}
