import type { ChatContext } from '../hooks/useSnelhulp'
import { allowRequest, sanitizeText } from './security'

export type MomentHint = 'verhuizen' | 'eerste-job' | 'zorgmoment' | null

export type MiaReply = {
  reply: string
  suggestions: string[]
  momentHint: MomentHint
  urgency: 'low' | 'medium' | 'high'
}

export type ChatTurn = { role: 'user' | 'model'; text: string }

/** Live preferred via server proxy (key not in browser). */
export function isMiaLivePreferred(): boolean {
  return true
}

export function getGeminiApiKey(): string | null {
  // Deprecated client key — only last-resort for static previews.
  const key = import.meta.env.VITE_GEMINI_API_KEY
  if (typeof key === 'string' && key.trim().length > 8) return key.trim()
  return null
}

function systemPrompt(context: ChatContext): string {
  return `Je bent Mia, de slimme KBC Snelhulp-assistent in een hackathon-prototype (Team Daedalus).
Spreek Nederlands (Belgisch), warm, helder, concreet. Geen corporate blabla.
Je helpt klanten met bankvragen: kaarten, betalingen, app, fraude, oplichting.
Je bent GEEN echte bankmedewerker: zeg nooit dat je een betaling uitvoert of een kaart écht blokkeert.
Geef wel praktische stappen die iemand in een echte app zou doen.

CONTEXT VAN DE BESLISBOOM:
- Escalatie: ${context.reason}
- Rubriek: ${context.category ?? '—'}
- Vraag: ${context.question ?? '—'}
- Zoekopdracht: ${context.searchQuery ?? '—'}
- Antwoorden: ${
    context.answers.length
      ? context.answers.map((a) => `${a.question} → ${a.answer}`).join(' | ')
      : '—'
  }
- Al geprobeerd: ${context.tried.length ? context.tried.join(', ') : '—'}

momentHint: verhuizen | eerste-job | zorgmoment | null
Antwoord ALTIJD als JSON:
{"reply":"...","suggestions":["..."],"momentHint":null,"urgency":"low"}
urgency = high bij fraude/oplichting.`
}

function parseMiaReply(raw: string): MiaReply {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
  try {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    const json = JSON.parse(cleaned.slice(start, end + 1)) as Partial<MiaReply>
    const hint = json.momentHint
    const momentHint: MomentHint =
      hint === 'verhuizen' || hint === 'eerste-job' || hint === 'zorgmoment'
        ? hint
        : null
    return {
      reply: sanitizeText(String(json.reply ?? raw), 1200),
      suggestions: Array.isArray(json.suggestions)
        ? json.suggestions.map((s) => sanitizeText(s, 80)).filter(Boolean).slice(0, 3)
        : [],
      momentHint,
      urgency:
        json.urgency === 'high' || json.urgency === 'medium' ? json.urgency : 'low',
    }
  } catch {
    return {
      reply: sanitizeText(cleaned, 1200) || 'Er ging iets mis bij het parsen.',
      suggestions: ['Leg het anders uit', 'Ik wil een medewerker'],
      momentHint: null,
      urgency: 'low',
    }
  }
}

async function askViaSecureProxy(
  context: ChatContext,
  history: ChatTurn[],
): Promise<string> {
  const safeHistory = history.slice(-24).map((t) => ({
    role: t.role,
    text: sanitizeText(t.text, 500),
  }))

  const res = await fetch('/api/mia', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context, history: safeHistory }),
  })
  const data = (await res.json().catch(() => ({}))) as {
    raw?: string
    error?: string
  }
  if (!res.ok) throw new Error(data.error || `Proxy ${res.status}`)
  if (!data.raw?.trim()) throw new Error('Empty proxy response')
  return data.raw
}

function explainFailure(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg.includes('503') || /high demand|UNAVAILABLE|not configured/i.test(msg)) {
    return 'Gemini tijdelijk onbereikbaar of niet geconfigureerd. Lokale modus.'
  }
  if (msg.includes('429') || /Rate limit/i.test(msg)) {
    return 'Te veel verzoeken — even wachten (rate limit).'
  }
  if (msg.includes('400') || msg.includes('401') || msg.includes('403')) {
    return 'Request geweigerd door security-laag of API.'
  }
  return 'Gemini reageerde niet. Lokale modus.'
}

export async function askMia(
  context: ChatContext,
  history: ChatTurn[],
): Promise<MiaReply> {
  if (!allowRequest('mia-client', 12, 60_000)) {
    const fallback = localFallback(context, history)
    fallback.reply = `${fallback.reply}\n\n(Rate limit: max 12 Mia-berichten / minuut.)`
    return fallback
  }

  try {
    const raw = await askViaSecureProxy(context, history)
    return parseMiaReply(raw)
  } catch (proxyErr) {
    const apiKey = getGeminiApiKey()
    if (!apiKey) {
      console.warn('Mia proxy failed', proxyErr)
      const fallback = localFallback(context, history)
      fallback.reply = `${fallback.reply}\n\n(${explainFailure(proxyErr)})`
      return fallback
    }
    try {
      const contents = history.map((turn) => ({
        role: turn.role,
        parts: [{ text: sanitizeText(turn.text, 500) }],
      }))
      const res = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent',
        {
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
        },
      )
      if (!res.ok) throw new Error(`Gemini ${res.status}`)
      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[]
      }
      const text =
        data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ??
        ''
      return parseMiaReply(text)
    } catch (err) {
      console.warn('Mia all paths failed', err)
      const fallback = localFallback(context, history)
      fallback.reply = `${fallback.reply}\n\n(${explainFailure(err)})`
      return fallback
    }
  }
}

function localFallback(context: ChatContext, history: ChatTurn[]): MiaReply {
  const lastUser =
    [...history].reverse().find((h) => h.role === 'user')?.text.toLowerCase() ??
    ''
  const blob =
    `${context.question ?? ''} ${context.searchQuery ?? ''} ${lastUser} ${context.tried.join(' ')}`.toLowerCase()

  let momentHint: MomentHint = null
  if (/verhuis|hypotheek|notaris|woning|woonlening/.test(blob))
    momentHint = 'verhuizen'
  else if (/eerste (job|loon)|starter|studentenkrediet|salaris/.test(blob))
    momentHint = 'eerste-job'
  else if (/zorg|uitstel|ouder|cashflow|buffer/.test(blob))
    momentHint = 'zorgmoment'

  let urgency: MiaReply['urgency'] = 'low'
  if (
    /fraude|phishing|gestolen|card stop|onbekende betaling|opgelicht|oplichting|scam/.test(
      blob,
    )
  ) {
    urgency = 'high'
  } else if (/geweigerd|geblokkeerd|lukt niet/.test(blob)) {
    urgency = 'medium'
  }

  const path = context.answers.map((a) => a.answer).join(' → ')
  let reply: string

  if (urgency === 'high') {
    reply =
      'Dit klinkt als mogelijke oplichting of fraude. Blokkeer verdachte kaarten/toegang in de app, bel Card Stop (078 170 170) als er een kaart bij betrokken is, en bewaar screenshots/berichten. Deel nooit codes of itsme-bevestigingen. In deze demo blokkeer ik niets écht — wel loods ik je door de stappen. Wat is er precies gebeurd (app, betaling, bericht)?'
  } else if (context.reason === 'no-results') {
    reply = `Je zocht op “${sanitizeText(context.searchQuery ?? '', 120)}”. Vertel in één zin wat je ziet (foutmelding, scherm, bedrag). Dan geef ik gerichte stappen.`
  } else if (context.tried.length) {
    reply = `Ik zie dat je al probeerde: ${context.tried.join(', ')}. ${
      path ? `Op basis van (${path}) ` : ''
    }probeer: herstart de app, check limieten, wacht 10 minuten. Wat zie je daarna?`
  } else {
    reply = `${
      context.question ? `Over “${context.question}”: ` : ''
    }beschrijf kort de foutmelding — hoe concreter, hoe scherper mijn advies.`
  }

  if (momentHint) {
    reply +=
      ' Dit lijkt ook op een life moment — bekijk het klant-prototype voor de aangepaste home.'
  }

  return {
    reply,
    suggestions:
      urgency === 'high'
        ? ['Kaart blokkeren', 'Ik deelde een code / itsme', 'Onbekende betaling melden']
        : ['Dit is de foutmelding…', 'Ik wil een medewerker', 'Het is opgelost'],
    momentHint,
    urgency,
  }
}
