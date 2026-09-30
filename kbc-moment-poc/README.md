# KBC Moment — PoC (Team Daedalus)

Voorbeeld voor de **KBC-challenge** op de Tectonic Hackathon.

## Wat KBC vraagt (kort)

Geen “nog een feature”, maar een **visie + proof of concept** voor schaalbare personalisatie:

1. Welke **signalen** tonen wat een klant nodig heeft?
2. Hoe herken je **situatie, gedrag en intent**?
3. Hoe past de ervaring zich **automatisch** aan?
4. Hoe werkt dat **over producten en kanalen**?
5. Hoe schaal je dat naar **2,3M+ klanten**?

## Ons voorbeeldantwoord: KBC Moment

**Idee:** KBC denkt in *life moments* (verhuizen, eerste job, zorg voor ouder…), niet in losse productcampagnes.

| Laag | Wat de PoC toont |
| --- | --- |
| Signalen | Live feed van betalingen, app-gedrag, verzekeringsstatus, context |
| Herkenning | Situatie + intent + confidence score |
| Adaptatie | App / adviseur / verzekering / beleggen krijgen elk een andere, passende actie |
| Schaal | Zelfde moment-engine voor elk scenario — event-driven, herbruikbaar |

Dit is een **demo-UI** met fictieve scenario’s. Geen echte klantdata.

## Starten

```bash
cd kbc-moment-poc
npm install
npm run dev
```

Open de URL die Vite toont (meestal `http://localhost:5173`).

## Wat judges willen zien

Volgens de guide scoren ze op:

1. **Creativity** — originele visie (moments i.p.v. features)
2. **Technical ability** — werkende demo
3. **Fit** — lost de challenge-vragen op
4. **Security** — Aikido-audit op jullie repo (10%)

Inzending via Builderbase: korte beschrijving, demovideo (<3 min), GitHub-link, Aikido before/after screenshots.

## Volgende stappen voor het echte hackathon-werk

- Echte (gesimuleerde) API / event pipeline achter de signalen
- Privacy & consent expliciet maken in de UI
- ElevenLabs: voice briefing voor de adviseur
- Aikido AI Code Audit draaien en findings fixen
- Demo-script (<3 min) opnemen
