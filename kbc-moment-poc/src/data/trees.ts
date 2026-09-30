/*
 * Beslisbomen voor Snelhulp. Pure data: een nieuwe boom of tak toevoegen
 * vraagt geen codewijziging. Geen klantdata nodig — enkel de keuzes die de
 * klant zelf aanklikt.
 */

export type TreeOption = {
  label: string
  next: string
}

export type TreeNode =
  | { kind: 'question'; id: string; text: string; hint?: string; options: TreeOption[] }
  | {
      kind: 'solution'
      id: string
      title: string
      steps: string[]
      /* Volgende poging als dit niet helpt; zonder alt → escaleren. */
      alt?: string
    }
  /* Doodlopende tak: hier stopt zelfbediening, chatbot neemt over. */
  | { kind: 'dead-end'; id: string; text: string }

export type Tree = {
  id: string
  question: string
  keywords: string[]
  start: string
  nodes: Record<string, TreeNode>
}

export type Category = {
  id: string
  label: string
  trees: Tree[]
}

function nodes(list: TreeNode[]): Record<string, TreeNode> {
  return Object.fromEntries(list.map((n) => [n.id, n]))
}

const cardDeclined: Tree = {
  id: 'kaart-geweigerd',
  question: 'Mijn kaartbetaling werd geweigerd',
  keywords: ['geweigerd', 'weigert', 'betaling', 'kaart', 'declined', 'terminal', 'lukt niet'],
  start: 'waar',
  nodes: nodes([
    {
      kind: 'question',
      id: 'waar',
      text: 'Waar werd je betaling geweigerd?',
      options: [
        { label: 'In een winkel', next: 'winkel' },
        { label: 'Online', next: 'online' },
        { label: 'In het buitenland', next: 'buitenland' },
        { label: 'Iets anders', next: 'anders' },
      ],
    },

    // — Winkel
    {
      kind: 'question',
      id: 'winkel',
      text: 'Welke melding zag je op de terminal?',
      options: [
        { label: 'Foute pincode', next: 'winkel-pin' },
        { label: 'Saldo of limiet overschreden', next: 'winkel-limiet' },
        { label: 'Geen melding / “geweigerd”', next: 'winkel-algemeen' },
      ],
    },
    {
      kind: 'solution',
      id: 'winkel-pin',
      title: 'Pincode opnieuw proberen of opvragen',
      steps: [
        'Na 3 foute pogingen blokkeert je pincode tijdelijk. Wacht tot middernacht, dan kan je opnieuw.',
        'Pincode vergeten? Vraag ze opnieuw aan via app → Kaarten → Pincode tonen.',
      ],
    },
    {
      kind: 'solution',
      id: 'winkel-limiet',
      title: 'Bestedingslimiet tijdelijk verhogen',
      steps: [
        'Open app → Kaarten → Limieten.',
        'Verhoog je dag- of weeklimiet tijdelijk (tot 7 dagen).',
        'Probeer de betaling daarna opnieuw.',
      ],
      alt: 'winkel-algemeen',
    },
    {
      kind: 'solution',
      id: 'winkel-algemeen',
      title: 'Kaart controleren',
      steps: [
        'Controleer de vervaldatum op je kaart.',
        'Probeer met chip i.p.v. contactloos (na 5 contactloze betalingen vraagt de terminal je pincode).',
        'Kijk in app → Kaarten of je kaart niet tijdelijk geblokkeerd staat.',
      ],
    },

    // — Online
    {
      kind: 'question',
      id: 'online',
      text: 'Wat gebeurde er bij het afrekenen?',
      options: [
        { label: 'Ik kreeg geen bevestigingsmelding', next: 'online-3ds' },
        { label: 'Ik bevestigde, maar toch geweigerd', next: 'online-instelling' },
        { label: 'Webshop buiten Europa', next: 'online-geo' },
      ],
    },
    {
      kind: 'solution',
      id: 'online-3ds',
      title: 'Online bevestiging activeren',
      steps: [
        'Open app → Instellingen → Meldingen en zet “Bevestig online betalingen” aan.',
        'Start de betaling opnieuw en bevestig binnen 5 minuten in de app.',
      ],
      alt: 'online-instelling',
    },
    {
      kind: 'solution',
      id: 'online-instelling',
      title: 'Online betalingen toestaan',
      steps: [
        'Open app → Kaarten → Gebruik en zet “Online betalen” aan.',
        'Controleer je limiet voor online aankopen.',
      ],
    },
    {
      kind: 'solution',
      id: 'online-geo',
      title: 'Gebruik buiten Europa toestaan',
      steps: [
        'Open app → Kaarten → Regio’s en kies “Wereldwijd”.',
        'Probeer de aankoop opnieuw.',
      ],
      alt: 'online-instelling',
    },

    // — Buitenland
    {
      kind: 'question',
      id: 'buitenland',
      text: 'Waar ben je en wat probeerde je?',
      options: [
        { label: 'Betalen binnen Europa', next: 'bl-europa' },
        { label: 'Betalen buiten Europa', next: 'bl-wereld' },
        { label: 'Geld afhalen aan een automaat', next: 'bl-atm' },
      ],
    },
    {
      kind: 'solution',
      id: 'bl-europa',
      title: 'Kaart en limiet controleren',
      steps: [
        'Binnen Europa werkt je kaart standaard.',
        'Check app → Kaarten → Limieten; buitenlandse hotels en autoverhuur blokkeren vaak een hoger bedrag.',
      ],
      alt: 'bl-wereld',
    },
    {
      kind: 'solution',
      id: 'bl-wereld',
      title: 'Wereldwijd gebruik aanzetten',
      steps: [
        'Open app → Kaarten → Regio’s en kies “Wereldwijd” voor de duur van je reis.',
        'De wijziging is binnen 1 minuut actief.',
      ],
    },
    {
      kind: 'solution',
      id: 'bl-atm',
      title: 'Geldautomaat in het buitenland',
      steps: [
        'Zet “Geld afhalen buitenland” aan in app → Kaarten → Gebruik.',
        'Kies bij de automaat altijd voor afrekenen in lokale munt.',
        'Probeer een automaat van een andere bank; sommige weigeren buitenlandse kaarten.',
      ],
      alt: 'bl-wereld',
    },

    {
      kind: 'dead-end',
      id: 'anders',
      text: 'Deze situatie staat niet in de beslisboom.',
    },
  ]),
}

const cardLost: Tree = {
  id: 'kaart-kwijt',
  question: 'Ik ben mijn kaart kwijt',
  keywords: ['kwijt', 'verloren', 'gestolen', 'blokkeren', 'diefstal'],
  start: 'waar',
  nodes: nodes([
    {
      kind: 'question',
      id: 'waar',
      text: 'Denk je dat iemand je kaart kan gebruiken?',
      options: [
        { label: 'Ja, mogelijk gestolen', next: 'blokkeer' },
        { label: 'Nee, gewoon kwijt', next: 'tijdelijk' },
      ],
    },
    {
      kind: 'solution',
      id: 'blokkeer',
      title: 'Kaart definitief blokkeren',
      steps: [
        'Blokkeer meteen via app → Kaarten → Blokkeren, of bel Card Stop: 078 170 170 (24/7).',
        'Een nieuwe kaart wordt automatisch opgestuurd.',
      ],
    },
    {
      kind: 'solution',
      id: 'tijdelijk',
      title: 'Kaart tijdelijk bevriezen',
      steps: [
        'Zet je kaart op pauze via app → Kaarten → Tijdelijk blokkeren.',
        'Teruggevonden? Zet ze met één tik terug aan.',
      ],
      alt: 'blokkeer',
    },
  ]),
}

const transferMissing: Tree = {
  id: 'overschrijving',
  question: 'Mijn overschrijving is niet aangekomen',
  keywords: ['overschrijving', 'niet aangekomen', 'transfer', 'geld', 'storting', 'iban'],
  start: 'naar',
  nodes: nodes([
    {
      kind: 'question',
      id: 'naar',
      text: 'Naar welke rekening stuurde je het geld?',
      options: [
        { label: 'Binnen dezelfde bank', next: 'intern' },
        { label: 'Andere Belgische bank', next: 'extern' },
        { label: 'Buitenlandse rekening', next: 'buitenland' },
      ],
    },
    {
      kind: 'solution',
      id: 'intern',
      title: 'Status controleren',
      steps: [
        'Interne overschrijvingen zijn meteen zichtbaar.',
        'Kijk in app → Verrichtingen of de status “Uitgevoerd” is en of het rekeningnummer klopt.',
      ],
    },
    {
      kind: 'solution',
      id: 'extern',
      title: 'Verwerkingstijd afwachten',
      steps: [
        'Gewone overschrijvingen zijn binnen 1 werkdag op de rekening; instant binnen 10 seconden.',
        'Na het weekend of een feestdag kan het een werkdag langer duren.',
      ],
    },
    {
      kind: 'dead-end',
      id: 'buitenland',
      text: 'Internationale betalingen vragen een opzoeking per geval.',
    },
  ]),
}

const loginProblem: Tree = {
  id: 'inloggen',
  question: 'Ik kan niet inloggen in de app',
  keywords: ['inloggen', 'login', 'aanmelden', 'app', 'itsme', 'wachtwoord', 'pincode app'],
  start: 'hoe',
  nodes: nodes([
    {
      kind: 'question',
      id: 'hoe',
      text: 'Wat loopt er mis?',
      options: [
        { label: 'Pincode van de app vergeten', next: 'pin' },
        { label: 'itsme werkt niet', next: 'itsme' },
        { label: 'App crasht of laadt niet', next: 'crash' },
      ],
    },
    {
      kind: 'solution',
      id: 'pin',
      title: 'App opnieuw activeren',
      steps: [
        'Tik op “Pincode vergeten” op het inlogscherm.',
        'Activeer opnieuw met itsme of je kaartlezer en kies een nieuwe pincode.',
      ],
    },
    {
      kind: 'solution',
      id: 'itsme',
      title: 'Inloggen zonder itsme',
      steps: [
        'Kies “Andere manier” en log in met je kaartlezer.',
        'Controleer daarna in de itsme-app of je account nog actief is.',
      ],
    },
    {
      kind: 'solution',
      id: 'crash',
      title: 'App herstellen',
      steps: [
        'Update de app via de App Store of Play Store.',
        'Nog steeds problemen? Verwijder de app en installeer opnieuw (je gegevens blijven bewaard).',
      ],
    },
  ]),
}

const fraud: Tree = {
  id: 'fraude',
  question: 'Ik zie een betaling die ik niet herken',
  keywords: ['fraude', 'phishing', 'onbekend', 'herken', 'oplichting', 'verdacht', 'link'],
  start: 'wat',
  nodes: nodes([
    {
      kind: 'question',
      id: 'wat',
      text: 'Wat is er gebeurd?',
      options: [
        { label: 'Onbekende betaling op mijn rekening', next: 'onbekend' },
        { label: 'Ik klikte op een verdachte link', next: 'phishing' },
      ],
    },
    {
      kind: 'solution',
      id: 'onbekend',
      title: 'Eerst checken, dan blokkeren',
      steps: [
        'Bekijk de handelaarsnaam in de detailweergave; die verschilt soms van de winkelnaam.',
        'Echt onbekend? Blokkeer je kaart in de app en bel Card Stop: 078 170 170.',
      ],
    },
    {
      kind: 'dead-end',
      id: 'phishing',
      text: 'Bij mogelijke phishing helpt een medewerker je meteen verder.',
    },
  ]),
}

export const categories: Category[] = [
  { id: 'kaarten', label: 'Kaarten', trees: [cardDeclined, cardLost] },
  { id: 'betalen', label: 'Betalen & overschrijven', trees: [transferMissing] },
  { id: 'app', label: 'App & inloggen', trees: [loginProblem] },
  { id: 'veiligheid', label: 'Fraude & veiligheid', trees: [fraud] },
]

export function searchTrees(query: string): { category: Category; tree: Tree }[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return categories.flatMap((category) =>
    category.trees
      .filter(
        (tree) =>
          tree.question.toLowerCase().includes(q) ||
          tree.keywords.some((k) => k.includes(q) || q.includes(k)),
      )
      .map((tree) => ({ category, tree })),
  )
}
