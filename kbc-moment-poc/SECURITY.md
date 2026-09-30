# Security

Hackathon PoC hardened against common vulnerability classes: secrets in client,
authn/authz gaps, IDOR-style tampering, injection, XSS, CSRF, info disclosure,
and missing headers.

## Secrets

| Item | Status |
| --- | --- |
| `GEMINI_API_KEY` | Server-only via `loadEnv` in `vite.config.ts` — **never** `VITE_` |
| Client bundle | Talks only to same-origin `/api/mia` |
| `.env` | Gitignored; `.env.example` has empty placeholders only |

## Authn / CSRF / origin

- `GET /api/session` → HttpOnly `kbc_sid` + CSRF token (double-submit)
- `POST /api/mia` requires matching `X-CSRF-Token`, same-origin Origin/Referer, `application/json`
- Timing-safe token compare; expired sessions rejected
- Generic 4xx/5xx bodies (no upstream leak)

## Authorization / IDOR-style

- Escalation `reason` allowlist on the proxy
- Session state: scenario / signal / checklist IDs validated against known data
- `runAction` only unlocks signals tied to the current persona’s allowlisted actions
- Tabs limited to a fixed set

## Injection / XSS / abuse

- No `dangerouslySetInnerHTML`
- Sanitize + length caps on chat, context, and toast text
- Proxy payload size cap (~24 KB), history capped
- Client + server rate limits
- Phone fields: Belgian format check (demo forms never leave the browser)
- CSP + `X-Frame-Options: DENY`, nosniff, COOP/CORP, Permissions-Policy

## What this PoC deliberately is not

Not a real bank backend: no real PII persistence, no payments, no production IAM.
Treat as a secure **demo surface**, not production banking.

## Verify locally

```bash
cd kbc-moment-poc
npm run build
# confirm dist has no API key strings:
grep -R "AIza" dist || echo "OK — no secrets in bundle"
```
