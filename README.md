# KBC Moment · Team Daedalus

**Tectonic Hackathon 2026** · KBC-challenge

Life-moment personalisatie voor banking: van losse signalen (betalingen, zoeken, checklist) naar één herkenbaar moment — mét consent — en een app die zich daarop aanpast.

Dit is een **demo-prototype**, geen echte bank-app.

---

## Wat zit erin

| Onderdeel | Wat je ziet |
| --- | --- |
| **Moment-engine** | Signalen → moment-inschatting → aangepaste home & checklist |
| **Klant-prototype** (`/app`) | Speel verhuizen / eerste job / zorgmoment als klant |
| **Multi-party views** | Live why voor klant, adviseur, verzekering, beleggen, ops |
| **Chat hulp + Mia** | Eerst beslisboom; Gemini-assistent pas bij escalatie |
| **Support-flowchart** | Hoe resources schalen: opties → zelfhulp → AI → mens |
| **Security** | Server-only API-key, CSRF, allowlists, CSP — zie [SECURITY.md](kbc-moment-poc/SECURITY.md) |

---

## Snel starten

```bash
cd kbc-moment-poc
cp .env.example .env   # optioneel: vul GEMINI_API_KEY in voor live Mia
npm install
npm run dev
```

Open:

- **Uitleg + concept:** http://127.0.0.1:5173/
- **Klant-prototype:** http://127.0.0.1:5173/app

Zonder Gemini-key werkt alles lokaal; Mia valt terug op een slimme offline modus.

---

## Mia (Gemini)

1. Key aanmaken: [Google AI Studio](https://aistudio.google.com/apikey)
2. Zet in `kbc-moment-poc/.env` (niet committen):

```bash
GEMINI_API_KEY=jouw_key
```

3. Herstart `npm run dev` — de browser praat alleen met **`/api/mia`**; de key blijft op de server.

---

## Repo-structuur

```
tectonic-2026-daedalus/
├── README.md                 ← jij bent hier
└── kbc-moment-poc/           ← Vite + React + TypeScript app
    ├── README.md             ← app-details
    ├── SECURITY.md
    ├── PRESENTATIE-3MIN.md   ← script presentatievideo (~3 min)
    └── src/
```

---

## Presentatie

Script voor de projectvideo (±3 minuten): [kbc-moment-poc/PRESENTATIE-3MIN.md](kbc-moment-poc/PRESENTATIE-3MIN.md)

---

## Team

**Daedalus** · Tectonic Hackathon 2026 · Challenge KBC
