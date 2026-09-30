# KBC Moment — Prototype demo

Werkend prototype voor de **KBC-challenge** (Tectonic Hackathon · Team Daedalus).

## Twee pagina’s

| Route | Inhoud |
| --- | --- |
| `/` | Uitleg: concept, hoe KBC signalen inziet, interactieve engine-demo |
| `/app` | **Klant-prototype**: jij speelt de klant (betalen/zoeken → home past aan → advisor-bericht) |

## Klant-prototype (`/app`)

1. Kies persona (Lien / Amir / Sofie) + consent  
2. Doe acties onder **Betalen** / **Zoeken** / home  
3. Na genoeg signalen: home schakelt naar moment-modus + checklist  
4. **Berichten**: gesimuleerde adviseursbriefing (optioneel voice)  
5. **Ik**: consent, voortgang, reset  

Vereenvoudigingen: geen echte bank-API, geen login, advisor is gesimuleerd, sessie in `sessionStorage`.

Security (licht, prototype): geen geheimen/wachtwoorden, geen vrije tekstinvoer, geen echte klantdata, tab-scoped storage.

## Starten

```bash
npm install
npm run dev
```

- Uitleg: http://127.0.0.1:5173/  
- Klant-app: http://127.0.0.1:5173/app  

## Stack

Vite · React · TypeScript · React Router · CSS
