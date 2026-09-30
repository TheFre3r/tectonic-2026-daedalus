# KBC Moment — presentatievideo (± 3 minuten)

**Team:** Daedalus · Tectonic Hackathon · KBC-challenge  
**Lengte:** ± 3:00 · rustig tempo (~420–450 woorden)  
**Vorm:** face-cam optioneel · hoofdbeeld = live prototype

---

## Structuur (overview)

| Tijd | Blok | Scherm |
| --- | --- | --- |
| 0:00–0:20 | Intro + probleem | Hero `/` |
| 0:20–0:50 | Hoe het werkt | 4 stappen + signaalvoorbeelden |
| 0:50–1:45 | Live klant-demo | `/app` persona → acties → home |
| 1:45–2:15 | Multi-party “why” | Live why / partij-views |
| 2:15–2:40 | Support op schaal | Chat hulp + flowchart |
| 2:40–3:00 | Vertrouwen + close | Security → merk |

---

## Shot list + voice-over

### 0:00 – 0:20 · Intro
**Scherm:** `/` hero — merk **KBC Moment**, Team Daedalus  
**Zeg:**  
> Hallo, wij zijn Team Daedalus.  
> Onze challenge: KBC. Ons project: **KBC Moment**.  
>  
> Banken zien transacties en app-gedrag. Klanten beleven life moments — verhuizen, eerste job, zorgdruk.  
> Vandaag tonen we hoe die twee elkaar kunnen vinden: personalisatie met consent, zonder te gokken.

### 0:20 – 0:50 · Concept: signalen → moment
**Scherm:** Sectie “Hoe werkt het?” (4 stappen); kort “Hoe zou KBC weten…” (verhuizen/eerste job)  
**Zeg:**  
> Het werkt in vier stappen.  
> Eén: er gebeurt iets in je leven — notarisbetaling, eerste loon, zoeken op uitstel.  
> Twee: dat wordt een **signaal**. De bank ziet geen bordje “ik verhuis”, wel patronen die ze met toestemming mag gebruiken.  
> Drie: signalen samen vormen een **moment** — een inschatting met zekerheid, geen absolute waarheid.  
> Vier: de ervaring past zich aan — checklist i.p.v. reclame, briefing voor de adviseur, hulp van verzekering, soms juist demping bij beleggen.

### 0:50 – 1:45 · Live demo als klant
**Scherm:** Open `/app` → kies persona (bv. verhuizen of eerste job) → consent aan → doe 3–4 acties (betalen, zoeken, checklist) → home die omslaat  
**Zeg:**  
> Dit is geen echte bank-app om in te loggen of te betalen. Het is een speelbaar prototype: jij bent de klant.  
>  
> We kiezen een scenario en zetten personalisatie aan.  
> Elke actie die je doet — een betaling, een zoekopdracht, een checklist-item — ontgrendelt een signaal.  
>  
> Kijk: na genoeg signalen wordt het moment actief. De home verandert. Je ziet wat relevant is *nu*, niet een generieke feed.  
> Zo voelt life-moment personalisatie: stil, uitlegbaar, en onder controle van de klant.

### 1:45 – 2:15 · Voor de bank, niet alleen de app
**Scherm:** Live why / views adviseur · verzekering · beleggen · ops  
**Zeg:**  
> Een moment is niet alleen een mooiere home.  
> Dezelfde signalen geven elke partij een andere lens:  
> de adviseur een korte briefing, verzekering gerichte hulp, beleggen die weet wanneer *niet* te pushen, operations die ziet wat er speelt.  
> Eén waarheid — meerdere views. Dat is hoe je personalisatie intern ook werkbaar maakt.

### 2:15 – 2:40 · Support: beslisboom eerst, Mia als vangnet
**Scherm:** Support-flowchart op `/`, daarna tab **Chat hulp** in `/app` — boom → escalatie naar Mia  
**Zeg:**  
> Hulp bij miljoenen klanten mag niet starten met “alles door een chatbot”.  
> Wij doen: eerst vaste opties — een beslisboom. Snel, voorspelbaar, goedkoop.  
> Pas als de boom vastloopt, komt **Mia** — met de context van wat de klant al koos.  
> Opties eerst, zelfredzaamheid, AI als last resort. Schaalbaar én betaalbaar.

### 2:40 – 3:00 · Vertrouwen + afsluiter
**Scherm:** Security-sectie (punten kort scannen) → terug naar merk / team  
**Zeg:**  
> En omdat dit over bankgegevens gaat: security hoort erbij.  
> Geen API-keys in de browser. Same-origin API. Sessie-bescherming. Allowlists tegen manipulatie. CSP en sanitization.  
> Privacy by design — ook in een hackathon-demo.  
>  
> Dit is **KBC Moment**: life moments begrijpen, de app aanpassen, de bank meenemen — mét consent.  
> Team Daedalus. Bedankt.

---

## Teleprompter (één doorlopende tekst)

Hallo, wij zijn Team Daedalus. Onze challenge: KBC. Ons project: KBC Moment.

Banken zien transacties en app-gedrag. Klanten beleven life moments — verhuizen, eerste job, zorgdruk. Wij tonen hoe die twee elkaar vinden: personalisatie met consent, zonder te gokken.

Het werkt in vier stappen. Er gebeurt iets in je leven. Dat wordt een signaal — geen bordje “ik verhuis”, wel patronen met toestemming. Signalen samen vormen een moment: een inschatting, geen absolute waarheid. Daarna past de ervaring zich aan: checklist in plaats van reclame, briefing voor de adviseur, hulp van verzekering, soms demping bij beleggen.

Dit is geen echte bank-app. Het is een speelbaar prototype. We kiezen een scenario, zetten personalisatie aan, en elke actie ontgrendelt een signaal. Zodra het moment klaar is, verandert de home. Zo voelt life-moment personalisatie: stil, uitlegbaar, onder controle van de klant.

Een moment is niet alleen een mooiere home. Dezelfde signalen geven adviseur, verzekering, beleggen en ops elk een eigen lens. Eén waarheid — meerdere views.

Hulp bij schaal start niet met een chatbot. Eerst een beslisboom: snel en voorspelbaar. Pas bij escalatie komt Mia, met context. Opties eerst, AI als vangnet — schaalbaar en betaalbaar.

Security hoort erbij: geen keys in de browser, sessie-bescherming, allowlists, CSP. Privacy by design.

Dit is KBC Moment. Team Daedalus. Bedankt.

---

## Opnamechecklist

**Vooraf**
- [ ] `npm run dev` → tabs klaar: `/` en `/app`
- [ ] Persona “verhuizen” (of eerste job) één keer droog oefenen tot home omslaat
- [ ] Chat hulp: boom tot escalatie + 1 Mia-bericht klaarzetten of live doen
- [ ] Licht/dark: kies één thema voor heel de video
- [ ] Microfoon test · schermresolutie 1080p · browser zoom 100–110%

**Tijdens**
- Muisbewegingen traag en doelgericht; geen scroll-race
- Bij demo: 2–3 seconden stilte op “home veranderd” zodat het landt
- Geen interne tool- of vendor-namen in voice-over of overlays

**Montage (optioneel)**
- Soft jump-cuts tussen blokken als je pauzeert om te klikken
- Lower-third: `KBC Moment · Team Daedalus` (eerste 8s + slot)
- Eindkaart 3s: logo/merk + “Tectonic Hackathon”

**Duur check**
- Lees teleprompter hardop met timer; mik op 2:45–3:05  
- Te lang → schrap één partij-view of één support-zin  
- Te kort → houd langer shot op omslaande home + één extra actie
