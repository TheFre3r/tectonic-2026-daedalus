export type Channel = 'app' | 'adviseur' | 'verzekering' | 'beleggen'

export type Signal = {
  id: string
  source: string
  label: string
  delayMs: number
}

export type Action = {
  channel: Channel
  title: string
  detail: string
}

export type Scenario = {
  id: string
  title: string
  customer: string
  age: number
  city: string
  tagline: string
  situation: string
  intent: string
  confidence: number
  signals: Signal[]
  actions: Action[]
  impact: string
}

export const scenarios: Scenario[] = [
  {
    id: 'verhuizen',
    title: 'Verhuizen',
    customer: 'Lien Vermeulen',
    age: 29,
    city: 'Gent',
    tagline: 'Van huurder naar eigenaar — op het juiste moment.',
    situation: 'Koopt eerste woning · notaristrajet gestart',
    intent: 'Hypotheek afronden · bescherming woning · liquiditeit behouden',
    confidence: 0.91,
    signals: [
      { id: 's1', source: 'Betalingen', label: 'Notariskosten + €1.850', delayMs: 400 },
      { id: 's2', source: 'App', label: 'Zoekt “woonlening simulatie” 3×', delayMs: 1100 },
      { id: 's3', source: 'Verzekering', label: 'Geen brandverzekering actief', delayMs: 1800 },
      { id: 's4', source: 'Gedrag', label: 'Spaarrekening −€12.400 (voorschot)', delayMs: 2500 },
      { id: 's5', source: 'Context', label: 'Adreswijziging aangevraagd', delayMs: 3200 },
    ],
    actions: [
      {
        channel: 'app',
        title: 'Woontraject-hub',
        detail:
          'Gepersonaliseerde checklist: dossierstatus, documenten, verwachte volgende stap — geen generieke banner.',
      },
      {
        channel: 'adviseur',
        title: 'Briefing voor kantoor',
        detail:
          'Adviseurs zien: “eerste woning, hoge intent, brandpolis ontbreekt” — gesprek klaar in 30 seconden.',
      },
      {
        channel: 'verzekering',
        title: 'Bescherming op maat',
        detail:
          'Brand + inboedel voorgesteld wanneer notaristraject bevestigd is — niet weken te vroeg.',
      },
      {
        channel: 'beleggen',
        title: 'Liquiditeit bewaren',
        detail:
          'Geen agressieve beleggingspush; wel bufferplan na storting van het voorschot.',
      },
    ],
    impact:
      'Eén life moment stuurt 4 kanalen tegelijk — zonder 4 aparte campagnes.',
  },
  {
    id: 'eerste-job',
    title: 'Eerste job',
    customer: 'Amir Benali',
    age: 23,
    city: 'Antwerpen',
    tagline: 'Van student naar starter — begeleiden, niet verkopen.',
    situation: 'Eerste vaste loon · studentenkrediet loopt af',
    intent: 'Budget begrijpen · spaardoel · eenvoudige bescherming',
    confidence: 0.87,
    signals: [
      { id: 's1', source: 'Inkomsten', label: 'Eerste salaris +€2.340', delayMs: 400 },
      { id: 's2', source: 'App', label: 'Opent “budget” 5× deze week', delayMs: 1000 },
      { id: 's3', source: 'Krediet', label: 'Studentenkrediet eindigt over 45 dagen', delayMs: 1700 },
      { id: 's4', source: 'Gedrag', label: 'Geen spaardoel ingesteld', delayMs: 2400 },
      { id: 's5', source: 'Context', label: 'Leeftijd 23 · starter-segment', delayMs: 3000 },
    ],
    actions: [
      {
        channel: 'app',
        title: 'Starter-coach',
        detail:
          '3-stappen onboarding: loonverdeling, automatisch sparen €50, overzicht vaste kosten.',
      },
      {
        channel: 'adviseur',
        title: 'Lichte touch',
        detail:
          'Optioneel 15-min digitaal gesprek — geen full product pitch, wel antwoorden op “wat nu?”.',
      },
      {
        channel: 'verzekering',
        title: 'Hospitalisatie-check',
        detail:
          'Alleen tonen als er geen dekking via werkgever is gedetecteerd.',
      },
      {
        channel: 'beleggen',
        title: 'Micro-beleggen later',
        detail:
          'Eerst buffer van 1 maand loon; pas daarna zachte intro tot beleggen.',
      },
    ],
    impact:
      'Bouwt vertrouwen bij 100.000+ starters per jaar — relatie vóór product.',
  },
  {
    id: 'zorgmoment',
    title: 'Zorg voor ouder',
    customer: 'Sofie Declercq',
    age: 47,
    city: 'Brugge',
    tagline: 'Een stil moment — herkennen zonder opdringerig te zijn.',
    situation: 'Zorgt voor ouder · cashflow onder druk',
    intent: 'Overzicht + ruimte · geen schuldgevoel · praktische hulp',
    confidence: 0.84,
    signals: [
      { id: 's1', source: 'Betalingen', label: 'Terugkerende zorgkosten +€620/m', delayMs: 500 },
      { id: 's2', source: 'App', label: 'Zoekt “uitstel afbetaling”', delayMs: 1200 },
      { id: 's3', source: 'Gedrag', label: 'Spaarbuffer −38% in 4 maanden', delayMs: 1900 },
      { id: 's4', source: 'Verzekering', label: 'Hospitalisatie ouder via gezin', delayMs: 2600 },
      { id: 's5', source: 'Context', label: 'Geen recente product-clicks', delayMs: 3300 },
    ],
    actions: [
      {
        channel: 'app',
        title: 'Rust-modus',
        detail:
          'UI schakelt naar “overzicht & ademruimte”: cashflow, mogelijke herstructurering, geen upsell-tiles.',
      },
      {
        channel: 'adviseur',
        title: 'Empathische briefing',
        detail:
          '“Mogelijke zorgcontext — start met luisteren.” Producten pas na expliciete vraag.',
      },
      {
        channel: 'verzekering',
        title: 'Bestaande dekking',
        detail:
          'Toont wat al gedekt is — voorkomt onnodige angst of dubbele polissen.',
      },
      {
        channel: 'beleggen',
        title: 'Pauze signaleren',
        detail:
          'Beleggingscommunicatie tijdelijk dempen; focus op liquiditeit.',
      },
    ],
    impact:
      'Personaliseren is soms minder pushen — dat schaalt ook naar miljoenen.',
  },
]

export const channelLabel: Record<Channel, string> = {
  app: 'KBC Mobile',
  adviseur: 'Kantoor / Bolero / chat',
  verzekering: 'Verzekeringen',
  beleggen: 'Beleggen & sparen',
}
