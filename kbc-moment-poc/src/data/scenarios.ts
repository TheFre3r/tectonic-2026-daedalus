export type Channel = 'app' | 'adviseur' | 'verzekering' | 'beleggen'

export type Signal = {
  id: string
  source: string
  label: string
  weight: number
  delayMs: number
}

export type Action = {
  channel: Channel
  title: string
  detail: string
  tone: 'guide' | 'protect' | 'pause' | 'offer'
}

export type AppScreen = {
  modeLabel: string
  headline: string
  sub: string
  primaryCta: string
  checklist: { label: string; done: boolean }[]
  tiles: { title: string; meta: string; muted?: boolean }[]
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
  behavior: string
  signals: Signal[]
  actions: Action[]
  impact: string
  appBefore: AppScreen
  appAfter: AppScreen
  advisorScript: string
  privacy: {
    purpose: string
    used: string[]
    notUsed: string[]
    retention: string
  }
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
    behavior: 'Hoge research-intensiteit · grote cash-out · adreswijziging',
    confidence: 0.91,
    signals: [
      { id: 's1', source: 'Betalingen', label: 'Notariskosten + €1.850', weight: 0.22, delayMs: 500 },
      { id: 's2', source: 'App', label: 'Zoekt “woonlening simulatie” 3×', weight: 0.2, delayMs: 1200 },
      { id: 's3', source: 'Verzekering', label: 'Geen brandverzekering actief', weight: 0.18, delayMs: 1900 },
      { id: 's4', source: 'Gedrag', label: 'Spaarrekening −€12.400 (voorschot)', weight: 0.2, delayMs: 2600 },
      { id: 's5', source: 'Context', label: 'Adreswijziging aangevraagd', weight: 0.11, delayMs: 3300 },
    ],
    actions: [
      {
        channel: 'app',
        title: 'Woontraject-hub',
        detail: 'Checklist, dossierstatus en volgende stap — geen generieke banner.',
        tone: 'guide',
      },
      {
        channel: 'adviseur',
        title: 'Briefing voor kantoor',
        detail: '“Eerste woning, hoge intent, brandpolis ontbreekt.” Gesprek klaar in 30s.',
        tone: 'guide',
      },
      {
        channel: 'verzekering',
        title: 'Bescherming op maat',
        detail: 'Brand + inboedel pas wanneer notaristraject bevestigd is.',
        tone: 'protect',
      },
      {
        channel: 'beleggen',
        title: 'Liquiditeit bewaren',
        detail: 'Geen agressieve beleggingspush; wel bufferplan na voorschot.',
        tone: 'pause',
      },
    ],
    impact: 'Eén life moment stuurt 4 kanalen tegelijk — zonder 4 aparte campagnes.',
    appBefore: {
      modeLabel: 'Standaard home',
      headline: 'Goedemorgen, Lien',
      sub: 'Saldo zichtrekening €2.140',
      primaryCta: 'Ontdek beleggingsfondsen',
      checklist: [],
      tiles: [
        { title: 'Beleggen vanaf €25', meta: 'Campagne · breed publiek' },
        { title: 'Nieuwe kredietkaart', meta: 'Aanbieding' },
        { title: 'Verzekeringen browsen', meta: 'Catalogus' },
      ],
    },
    appAfter: {
      modeLabel: 'Moment: eerste woning',
      headline: 'Je woontraject',
      sub: 'We zien dat je richting aankoop gaat. Dit helpt je verder.',
      primaryCta: 'Open dossierstatus',
      checklist: [
        { label: 'Hypotheeksimulatie bekeken', done: true },
        { label: 'Documenten voor dossier', done: false },
        { label: 'Brandverzekering regelen', done: false },
        { label: 'Buffer na voorschot plannen', done: false },
      ],
      tiles: [
        { title: 'Volgende stap: documenten', meta: 'Persoonlijk · vandaag' },
        { title: 'Woning beschermen', meta: 'Brand + inboedel' },
        { title: 'Beleggingsaanbiedingen', meta: 'Gepauzeerd tijdens aankoop', muted: true },
      ],
    },
    advisorScript:
      'Lien Vermeulen, 29, Gent. Waarschijnlijk eerste woning: notariskosten, zoekgedrag woonlening, groot voorschot van spaargeld, adreswijziging. Brandverzekering ontbreekt nog. Start met dossierstatus en bescherming van de woning. Geen beleggingspitch vandaag.',
    privacy: {
      purpose: 'Life-moment herkennen om begeleiding te orkestreren — niet om te verkopen zonder context.',
      used: ['Geaggregeerde betalingstypen', 'App-zoekintent (categorie)', 'Productstatus verzekering', 'Adreswijzigings-event'],
      notUsed: ['Chat-inhoud 1:1', 'Locatie continu', 'Data van derden zonder consent'],
      retention: 'Moment-profiel 90 dagen of tot moment gesloten; daarna alleen anonieme metrics.',
    },
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
    behavior: 'Herhaald budget-gebruik · geen spaardoel · starter-profiel',
    confidence: 0.87,
    signals: [
      { id: 's1', source: 'Inkomsten', label: 'Eerste salaris +€2.340', weight: 0.24, delayMs: 500 },
      { id: 's2', source: 'App', label: 'Opent “budget” 5× deze week', weight: 0.2, delayMs: 1100 },
      { id: 's3', source: 'Krediet', label: 'Studentenkrediet eindigt over 45 dagen', weight: 0.18, delayMs: 1800 },
      { id: 's4', source: 'Gedrag', label: 'Geen spaardoel ingesteld', weight: 0.15, delayMs: 2500 },
      { id: 's5', source: 'Context', label: 'Leeftijd 23 · starter-segment', weight: 0.1, delayMs: 3100 },
    ],
    actions: [
      {
        channel: 'app',
        title: 'Starter-coach',
        detail: '3 stappen: loonverdeling, auto-sparen €50, vaste kosten.',
        tone: 'guide',
      },
      {
        channel: 'adviseur',
        title: 'Lichte touch',
        detail: 'Optioneel 15-min digitaal gesprek — antwoorden op “wat nu?”.',
        tone: 'guide',
      },
      {
        channel: 'verzekering',
        title: 'Hospitalisatie-check',
        detail: 'Alleen tonen als er geen dekking via werkgever is.',
        tone: 'protect',
      },
      {
        channel: 'beleggen',
        title: 'Micro-beleggen later',
        detail: 'Eerst buffer van 1 maand loon; daarna zachte intro.',
        tone: 'pause',
      },
    ],
    impact: 'Bouwt vertrouwen bij 100.000+ starters per jaar — relatie vóór product.',
    appBefore: {
      modeLabel: 'Standaard home',
      headline: 'Hallo Amir',
      sub: 'Saldo €186',
      primaryCta: 'Start met beleggen',
      checklist: [],
      tiles: [
        { title: 'Beleggingsrekening openen', meta: 'Campagne starters' },
        { title: 'Premium kaart', meta: 'Upsell' },
        { title: 'Alle producten', meta: 'Catalogus' },
      ],
    },
    appAfter: {
      modeLabel: 'Moment: eerste job',
      headline: 'Je starter-coach',
      sub: 'Eerste loon ontvangen. We helpen je rustig opbouwen.',
      primaryCta: 'Start 3-stappenplan',
      checklist: [
        { label: 'Loon verdelen (vast / flex / spaar)', done: false },
        { label: 'Auto-sparen €50/maand', done: false },
        { label: 'Studentenkrediet afronden', done: false },
      ],
      tiles: [
        { title: 'Budget deze maand', meta: 'Persoonlijk' },
        { title: 'Dekking via werkgever?', meta: 'Korte check' },
        { title: 'Beleggen', meta: 'Beschikbaar na buffer', muted: true },
      ],
    },
    advisorScript:
      'Amir Benali, 23, Antwerpen. Eerste salaris binnengekomen, vaak in budget-schermen, studentenkrediet eindigt binnenkort, nog geen spaardoel. Houd het licht: coach op budget en buffer. Geen premium push.',
    privacy: {
      purpose: 'Onboarding naar financiële zelfredzaamheid bij life transition.',
      used: ['Inkomens-event (salaris)', 'Feature-gebruik budget', 'Krediet-einddatum', 'Leeftijdssegment'],
      notUsed: ['Werkgevernaam in marketingcopy', 'Social media', 'Gedetailleerde merchantlijsten in briefing'],
      retention: 'Starter-moment tot 6 maanden na eerste salaris of tot coach afgerond.',
    },
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
    behavior: 'Zoekt uitstel · buffer daalt · geen productinteresse',
    confidence: 0.84,
    signals: [
      { id: 's1', source: 'Betalingen', label: 'Terugkerende zorgkosten +€620/m', weight: 0.22, delayMs: 500 },
      { id: 's2', source: 'App', label: 'Zoekt “uitstel afbetaling”', weight: 0.2, delayMs: 1200 },
      { id: 's3', source: 'Gedrag', label: 'Spaarbuffer −38% in 4 maanden', weight: 0.2, delayMs: 1900 },
      { id: 's4', source: 'Verzekering', label: 'Hospitalisatie ouder via gezin', weight: 0.14, delayMs: 2600 },
      { id: 's5', source: 'Context', label: 'Geen recente product-clicks', weight: 0.08, delayMs: 3300 },
    ],
    actions: [
      {
        channel: 'app',
        title: 'Rust-modus',
        detail: 'Overzicht & ademruimte: cashflow, opties — geen upsell-tiles.',
        tone: 'pause',
      },
      {
        channel: 'adviseur',
        title: 'Empathische briefing',
        detail: '“Mogelijke zorgcontext — start met luisteren.” Producten pas op vraag.',
        tone: 'guide',
      },
      {
        channel: 'verzekering',
        title: 'Bestaande dekking',
        detail: 'Toont wat al gedekt is — voorkomt dubbele polissen.',
        tone: 'protect',
      },
      {
        channel: 'beleggen',
        title: 'Pauze signaleren',
        detail: 'Beleggingscommunicatie dempen; focus op liquiditeit.',
        tone: 'pause',
      },
    ],
    impact: 'Personaliseren is soms minder pushen — dat schaalt ook naar miljoenen.',
    appBefore: {
      modeLabel: 'Standaard home',
      headline: 'Welkom Sofie',
      sub: '3 nieuwe aanbiedingen',
      primaryCta: 'Bekijk beleggingskansen',
      checklist: [],
      tiles: [
        { title: 'Beleggingsboost', meta: 'Campagne' },
        { title: 'Verzekering upgraden', meta: 'Cross-sell' },
        { title: 'Extra kaart', meta: 'Upsell' },
      ],
    },
    appAfter: {
      modeLabel: 'Moment: rust-modus',
      headline: 'Overzicht & ruimte',
      sub: 'We merken druk op je cashflow. Geen verkooppraatje — wel helderheid.',
      primaryCta: 'Bekijk ademruimte-opties',
      checklist: [
        { label: 'Cashflow deze maand', done: true },
        { label: 'Mogelijke herschikking bekijken', done: false },
        { label: 'Gesprek plannen (optioneel)', done: false },
      ],
      tiles: [
        { title: 'Wat al gedekt is', meta: 'Gezin · hospitalisatie' },
        { title: 'Hulp zonder druk', meta: 'Adviseursbriefing klaar' },
        { title: 'Beleggen / upsell', meta: 'Tijdelijk gedempt', muted: true },
      ],
    },
    advisorScript:
      'Sofie Declercq, 47, Brugge. Mogelijke zorgcontext: terugkerende zorgkosten, zoekgedrag rond uitstel, spaarbuffer sterk gedaald, geen productclicks. Start met luisteren. Toon bestaande dekking. Geen upsell tenzij zij erom vraagt.',
    privacy: {
      purpose: 'Kwetsbare momenten herkennen om druk te verlagen, niet te verhogen.',
      used: ['Terugkerende kostencategorieën', 'App-zoekintent (uitstel)', 'Buffertrend', 'Afwezigheid van productintent'],
      notUsed: ['Medische diagnoses', 'Naam van zorgontvanger in marketing', 'Schuld-shaming scores'],
      retention: 'Rust-modus max. 120 dagen; manuele override door adviseur mogelijk.',
    },
  },
]

export const channelLabel: Record<Channel, string> = {
  app: 'KBC Mobile',
  adviseur: 'Kantoor / chat',
  verzekering: 'Verzekeringen',
  beleggen: 'Beleggen & sparen',
}

export const toneLabel: Record<Action['tone'], string> = {
  guide: 'Begeleiden',
  protect: 'Beschermen',
  pause: 'Dempen',
  offer: 'Aanbieden',
}
