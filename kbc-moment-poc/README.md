# KBC Moment — Prototype demo

Werkend prototype voor de **KBC-challenge** (Tectonic Hackathon · Team Daedalus).

## Wat het doet

Volledige flow van het idee “life moments i.p.v. productcampagnes”:

1. **Engine** — signalen stromen binnen met gewichten → situatie / gedrag / intent + confidence
2. **Klant-app** — voor/na mockup (standaard campagnes vs. moment-hub)
3. **Adviseur** — briefing + voice (browser Speech API) + override
4. **Kanalen** — app, advies, verzekering, beleggen met toon (begeleiden / beschermen / dempen)
5. **Privacy** — consent, wat wel/niet gebruikt wordt, retentie
6. **Schaal** — gesimuleerde dagmetrics voor miljoenen parallelle momenten

Drie scenario’s: Verhuizen · Eerste job · Zorg voor ouder.

## Starten

```bash
npm install
npm run dev
```

Open de URL van Vite (bv. `http://127.0.0.1:5173`).

## Demo-script (~2 min)

1. Kies scenario **Verhuizen** — laat signalen binnenkomen
2. Toon confidence + intent op tab **Engine**
3. Tab **Klant-app** — schakel Voor → Na
4. Tab **Adviseur** — speel briefing
5. Tab **Kanalen** / **Privacy** / **Schaal** — orkestratie & schaalbaarheid
6. Zet consent uit: engine stopt (privacy-by-design)

## Stack

Vite · React · TypeScript · CSS (geen backend; fictieve data)
