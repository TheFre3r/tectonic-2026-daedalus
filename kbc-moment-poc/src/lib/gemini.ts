import type { ChatContext } from '../hooks/useSnelhulp'

export type MomentHint = 'verhuizen' | 'eerste-job' | 'zorgmoment' | null

export type MiaReply = {
  reply: string
  suggestions: string[]
  momentHint: MomentHint
  urgency: 'low' | 'medium' | 'high'
}

export type ChatTurn = { role: 'user' | 'model'; text: string }

const MODEL_CANDIDATES = [
  import.meta.env.VITE_GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-flash-latest',
  'gemini-1.5-flash',
].filter(Boolean) as string[]

export function getGeminiApiKey(): string | null {
  const key = import.meta.env.VITE_GEMINI_API_KEY
  if (typeof key === 'string' && key.trim().length > 8) return key.trim()
  return null
}

function systemPrompt(context: ChatContext): string {
  return `Je bent Mia, de slimme KBC Snelhulp-assistent in een hackathon-prototype (Team Daedalus).
Spreek Nederlands (Belgisch), warm, helder, concreet. Geen corporate blabla.
Je helpt klanten met bankvragen: kaarten, betalingen, app, fraude.
Je bent GEEN echte bankmedewerker: zeg nooit dat je een betaling uitvoert of een kaart écht blokkeert.
Geef wel praktische stappen die iemand in een echte app zou doen.

CONTEXT VAN DE BESLISBOOM (gebruik dit actief, herhaal niet klakkeloos):
- Escalatie: ${context.reason}
- Rubriek: ${context.category ?? '—'}
- Vraag: ${context.question ?? '—'}
- Zoekopdracht: ${context.searchQuery ?? '—'}
- Antwoorden van de klant: ${
    context.answers.length
      ? context.answers.map((a) => `${a.question} → ${a.answer}`).join(' | ')
      : '—'
  }
- Al geprobeerd: ${context.tried.length ? context.tried.join(', ') : '—'}

KBC MOMENT (extra intelligentie):
Als de klant hints geeft over een life moment, zet momentHint:
- verhuizen: huis kopen, notaris, hypotheek, adreswijziging
- eerste-job: eerste loon, starter, studentenkrediet, budget leren
- zorgmoment: zorgkosten, uitstel, cashflow-druk, ouder helpen
Anders momentHint = null.

Antwoord ALTIJD als JSON-object (geen markdown fences):
{
  "reply": "tekst aan de klant, max ~120 woorden, mag korte opsommingen",
  "suggestions": ["korte snelle reply 1", "snelle reply 2", "snelle reply 3"],
  "momentHint": null,
  "urgency": "low"
}
urgency = high bij fraude/phishing/gestolen kaart; medium bij blokkades; low anders.
suggestions: 2-3 korte zinnen die de klant kan aantikken als volgend bericht.`
}

function parseMiaReply(raw: string): MiaReply {
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim()
  try {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    const json = JSON.parse(cleaned.slice(start, end + 1)) as Partial<MiaReply>
    const hint = json.momentHint
    const momentHint: MomentHint =
      hint === 'verhuizen' || hint === 'eerste-job' || hint === 'zorgmoment' ? hint : null
    return {
      reply: String(json.reply ?? raw).trim() || 'Sorry, ik kon daar geen antwoord op formuleren.',
      suggestions: Array.isArray(json.suggestions)
        ? json.suggestions.map(String).filter(Boolean).slice(0, 3)
        : [],
      momentHint,
      urgency: json.urgency === 'high' || json.urgency === 'medium' ? json.urgency : 'low',
    }
  } catch {
    return {
      reply: cleaned || 'Er ging iets mis bij het parsen van mijn antwoord. Probeer opnieuw.',
      suggestions: ['Leg het anders uit', 'Ik wil een medewerker'],
      momentHint: null,
      urgency: 'low',
    }
  }
}

async function callModel(
  model: string,
  apiKey: string,
  context: ChatContext,
  history: ChatTurn[],
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  const contents = history.map((turn) => ({
    role: turn.role,
    parts: [{ text: turn.text }],
  }))

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt(context) }] },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 700,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Gemini ${model} ${res.status}: ${body.slice(0, 200)}`)
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
  if (!text.trim()) throw new Error(`Lege response van ${model}`)
  return text
}

export async function askMia(
  context: ChatContext,
  history: ChatTurn[],
): Promise<MiaReply> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    return localFallback(context, history)
  }

  let lastError: unknown
  for (const model of MODEL_CANDIDATES) {
    try {
      const raw = await callModel(model, apiKey, context, history)
      return parseMiaReply(raw)
    } catch (err) {
      lastError = err
    }
  }

  console.warn('Mia Gemini failed, using local fallback', lastError)
  const fallback = localFallback(context, history)
  fallback.reply = `${fallback.reply}\n\n(Offline-modus: Gemini reageerde niet. Check je API-key of quotum.)`
  return fallback
}

/** Slimme lokale fallback zonder API-key — nog steeds context-aware. */
function localFallback(context: ChatContext, history: ChatTurn[]): MiaReply {
  const lastUser = [...history].reverse().find((h) => h.role === 'user')?.text.toLowerCase() ?? ''
  const blob = `${context.question ?? ''} ${context.searchQuery ?? ''} ${lastUser} ${context.tried.join(' ')}`.toLowerCase()

  let momentHint: MomentHint = null
  if (/verhuis|hypotheek|notaris|woning|woonlening/.test(blob)) momentHint = 'verhuizen'
  else if (/eerste (job|loon)|starter|studentenkrediet|salaris/.test(blob)) momentHint = 'eerste-job'
  else if (/zorg|uitstel|ouder|cashflow|buffer/.test(blob)) momentHint = 'zorgmoment'

  let urgency: MiaReply['urgency'] = 'low'
  if (/fraude|phishing|gestolen|gestolen|card stop|onbekende betaling/.test(blob)) urgency = 'high'
  else if (/geweigerd|geblokkeerd|lukt niet/.test(blob)) urgency = 'medium'

  const path = context.answers.map((a) => a.answer).join(' → ')
  let reply: string

  if (urgency === 'high') {
    reply =
      'Dit klinkt urgent. Blokkeer je kaart meteen in de app (Kaarten → Blokkeren) en bel Card Stop op 078 170 170. Bewaar verdachte berichten/screenshots. Ik kan hier in de demo niets écht blokkeren — wel je door de stappen loodsen.'
  } else if (context.reason === 'no-results') {
    reply = `Je zocht op “${context.searchQuery}”. Vertel in één zin wat je ziet (foutmelding, scherm, bedrag). Dan geef ik gerichte stappen — of ik wijs je naar de juiste checklist.`
  } else if (context.tried.length) {
    reply = `Ik zie dat je al probeerde: ${context.tried.join(', ')}. Die sla ik over. ${
      path ? `Op basis van je keuzes (${path}) ` : ''
    }probeer dit: herstart de app, check limieten onder Kaarten, en wacht 10 minuten na een wijziging. Wat zie je daarna precies?`
  } else {
    reply = `${
      context.question ? `Over “${context.question}”: ` : ''
    }ik help je stap voor stap. Beschrijf kort de foutmelding of wat er misloopt — hoe concreter, hoe scherper mijn advies.`
  }

  if (momentHint) {
    reply +=
      ' Tussen haakjes: dit lijkt ook op een life moment. Je kunt in het klant-prototype zien hoe KBC Moment je home daarop zou aanpassen.'
  }

  return {
    reply,
    suggestions:
      urgency === 'high'
        ? ['Kaart is geblokkeerd', 'Hoe bel ik Card Stop?', 'Onbekende betaling melden']
        : ['Dit is de foutmelding…', 'Ik wil een medewerker', 'Het is opgelost'],
    momentHint,
    urgency,
  }
}
