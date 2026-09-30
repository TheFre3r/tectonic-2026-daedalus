# KBC Moment — app prototype

Vite + React + TypeScript demo voor de **KBC-challenge** (Tectonic Hackathon · Team Daedalus).

Banken zien transacties. Klanten beleven life moments. Dit prototype laat zien hoe signalen (met consent) een moment vormen — en hoe home, hulp en interne views zich aanpassen.

---

## Routes

| Route | Inhoud |
| --- | --- |
| `/` | Concept-uitleg · 4 stappen · support-flowchart · security · link naar demo |
| `/app` | Klant-prototype: persona, acties, moment-home, Chat hulp, live why, partij-views |

---

## Starten

```bash
cp .env.example .env   # optioneel voor live Mia
npm install
npm run dev
```

| Commando | Doel |
| --- | --- |
| `npm run dev` | Dev-server (proxy `/api/session` + `/api/mia`) |
| `npm run build` | Typecheck + productiebuild |
| `npm run preview` | Preview van `dist/` |
| `npm run lint` | Oxlint |

Open http://127.0.0.1:5173/ of `/app`.

---

## Personas & flow

1. Kies een scenario (verhuizen, eerste job, zorgmoment) en consent.
2. Doe acties in Betalen / Zoeken / checklist — elke actie ontgrendelt een signaal.
3. Bij genoeg signalen wordt het **moment** actief: home en tips veranderen.
4. Bekijk **Live why** en views voor adviseur, verzekering, beleggen, ops.
5. **Chat hulp:** beslisboom eerst; bij escalatie **Mia** (Gemini of lokale fallback).

Sessie-state zit in `sessionStorage` en is allowlisted (scenario / signalen / checklist) tegen manipulatie.

---

## Mia (Gemini) — veilig

1. Key: https://aistudio.google.com/apikey  
2. Alleen in `.env` (gitignored):

```bash
GEMINI_API_KEY=jouw_key
```

3. Browser → same-origin **`POST /api/mia`** (CSRF + rate limits). Key komt **niet** in de frontend-bundle.

Zonder key: lokale Mia blijft bruikbaar voor de demo.

Details: [SECURITY.md](./SECURITY.md).

---

## Security (kort)

- Server-only API-key (geen `VITE_`-secrets)
- CSRF (HttpOnly cookie + `X-CSRF-Token`) + same-origin
- Context- en sessie-allowlists
- CSP + security headers; sanitization; rate limits; geen `dangerouslySetInnerHTML`

---

## Presentatie

Video-script (±3 min): [PRESENTATIE-3MIN.md](./PRESENTATIE-3MIN.md)

---

## Stack

React 19 · React Router · Vite 8 · TypeScript · Gemini via server-proxy
