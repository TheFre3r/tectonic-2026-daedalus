# KBC Moment — Prototype demo

Werkend prototype voor de **KBC-challenge** (Tectonic Hackathon · Team Daedalus).

## Routes

| Route | Inhoud |
| --- | --- |
| `/` | Snelhulp (+ **Mia** Gemini-chat) · uitleg · Moment-engine |
| `/app` | Klant-prototype (life moments beleven) |

## Mia — live chatbot (Google AI Studio)

1. Maak een gratis key: https://aistudio.google.com/apikey  
2. In `kbc-moment-poc/`:

```bash
cp .env.example .env
# plak je key achter VITE_GEMINI_API_KEY=
```

3. Herstart `npm run dev`

Zonder key werkt Mia in **slimme lokale modus** (context-aware fallback).  
Met key: echte Gemini-antwoorden, suggestie-chips, urgency, en life-moment detectie → link naar `/app`.

> Prototype-note: een `VITE_` key zit in de frontend-bundle. Beperk de key in Google AI Studio (referrer) of vervang later door een kleine backend-proxy.

## Snelhulp

- Beslisboom eerst (kaarten, betalen, app, fraude, **life moments**)
- Escalaties óf knop **Praat met Mia**
- Chat lazy-loaded; telt self-serve vs chat

## Klant-prototype (`/app`)

Persona → acties → moment-home → adviseursbericht.

## Starten

```bash
cd kbc-moment-poc
npm install
npm run dev
```

## Stack

Vite · React · TypeScript · React Router · Gemini API (Google AI Studio)
