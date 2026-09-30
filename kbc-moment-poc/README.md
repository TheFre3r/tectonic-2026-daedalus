# KBC Moment — Prototype demo

Werkend prototype voor de **KBC-challenge** (Tectonic Hackathon · Team Daedalus).

## Routes

| Route | Inhoud |
| --- | --- |
| `/` | Uitleg · **support resource flowchart** · Moment-engine · security |
| `/app` | **Klant-prototype** + live why + views voor adviseur/verzekering/beleggen/ops |

## Mia (Gemini) — veilig

1. Key van https://aistudio.google.com/apikey  
2. In `kbc-moment-poc/.env` (**niet** committen):

```bash
GEMINI_API_KEY=jouw_key
```

3. `npm run dev` — browser praat met **`/api/mia`** (key blijft op de server)

Zie [SECURITY.md](./SECURITY.md) voor Aikido-gerichte hardening.

## Security (Aikido-ready)

- Server-only `GEMINI_API_KEY` (geen `VITE_`-secrets in de bundle)
- CSRF (HttpOnly cookie + `X-CSRF-Token`) + same-origin op `/api/mia`
- Context- en sessie-allowlists (anti-tampering / IDOR-achtig)
- CSP + security headers; sanitization; rate limits; geen `dangerouslySetInnerHTML`

## Starten

```bash
cd kbc-moment-poc
npm install
npm run dev
```
