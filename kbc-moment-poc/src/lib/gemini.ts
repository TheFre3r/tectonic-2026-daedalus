import type { ChatContext } from '../hooks/useSnelhulp'
import { allowRequest, ensureCsrfSession, sanitizeText } from './security'

export type MomentHint = 'verhuizen' | 'eerste-job' | 'zorgmoment' | null

export type MiaReply = {
  reply: string
  suggestions: string[]
  momentHint: MomentHint
  urgency: 'low' | 'medium' | 'high'
}

export type ChatTurn = { role: 'user' | 'model'; text: string }

export function isMiaLivePreferred(): boolean {
  return true
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

function safeContext(context: ChatContext): ChatContext {
  return {
    reason: context.reason,
    category: sanitizeText(context.category, 80) || undefined,
    question: sanitizeText(context.question, 160) || undefined,
    searchQuery: sanitizeText(context.searchQuery, 160) || undefined,
    answers: context.answers.slice(0, 12).map((a) => ({
      question: sanitizeText(a.question, 120),
      answer: sanitizeText(a.answer, 80),
    })),
    tried: context.tried.slice(0, 8).map((t) => sanitizeText(t, 80)),
  }
}

async function askViaSecureProxy(
  context: ChatContext,
  history: ChatTurn[],
): Promise<string> {
  const csrfToken = await ensureCsrfSession()
  const safeHistory = history.slice(-20).map((t) => ({
    role: t.role,
    text: sanitizeText(t.text, 500),
  }))

  const res = await fetch('/api/mia', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({
      context: safeContext(context),
      history: safeHistory,
    }),
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
  if (msg.includes('503') || /unavailable/i.test(msg)) {
    return 'Service tijdelijk onbereikbaar. Lokale modus.'
  }
  if (msg.includes('429') || /Rate limit/i.test(msg)) {
    return 'Te veel verzoeken — even wachten.'
  }
  if (msg.includes('401') || msg.includes('403')) {
    return 'Sessie ongeldig — herlaad de pagina.'
  }
  return 'Assistent tijdelijk offline. Lokale modus.'
}

export async function askMia(
  context: ChatContext,
  history: ChatTurn[],
): Promise<MiaReply> {
  if (!allowRequest('mia-client', 12, 60_000)) {
    const fallback = localFallback(context, history)
    fallback.reply = `${fallback.reply}\n\n(Rate limit: max 12 berichten / minuut.)`
    return fallback
  }

  try {
    const raw = await askViaSecureProxy(context, history)
    return parseMiaReply(raw)
  } catch (err) {
    console.warn('Mia proxy failed', err)
    const fallback = localFallback(context, history)
    fallback.reply = `${fallback.reply}\n\n(${explainFailure(err)})`
    return fallback
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
      'Dit klinkt als mogelijke oplichting of fraude. Blokkeer verdachte kaarten/toegang in de app, bel Card Stop (078 170 170) als er een kaart bij betrokken is, en bewaar screenshots/berichten. Deel nooit codes of itsme-bevestigingen.'
  } else if (context.reason === 'no-results') {
    reply = `Je zocht op “${sanitizeText(context.searchQuery ?? '', 120)}”. Vertel in één zin wat je ziet.`
  } else if (context.tried.length) {
    reply = `Je probeerde al: ${context.tried.join(', ')}. ${
      path ? `Keuzes: ${path}. ` : ''
    }Probeer limieten/check opnieuw. Wat zie je precies?`
  } else {
    reply = `${
      context.question ? `Over “${context.question}”: ` : ''
    }beschrijf kort de foutmelding.`
  }

  if (momentHint) {
    reply += ' Dit lijkt ook op een life moment.'
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
