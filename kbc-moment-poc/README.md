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

## Security (superman-laag)

- Server-side Gemini proxy + rate limits  
- CSP + security headers  
- Input sanitization / max length  
- Geen secrets in de frontend-bundle (als je `VITE_`-key weglaat)  
- sessionStorage only, vaste actie-allowlists  

## Starten

```bash
cd kbc-moment-poc
npm install
npm run dev
```
