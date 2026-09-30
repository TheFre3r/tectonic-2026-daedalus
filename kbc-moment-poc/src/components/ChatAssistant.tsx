import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { askMia, getGeminiApiKey, type MiaReply } from '../lib/gemini'
import { reasonLabel, type ChatContext } from '../hooks/useSnelhulp'

type Props = {
  context: ChatContext
  onMessage: () => void
  onSolved: () => void
}

type Message = {
  from: 'bot' | 'user' | 'system'
  text: string
  urgency?: MiaReply['urgency']
}

const momentCopy: Record<
  NonNullable<MiaReply['momentHint']>,
  { title: string; blurb: string }
> = {
  verhuizen: {
    title: 'Life moment: verhuizen?',
    blurb: 'Mia denkt dat je richting een woning gaat. Bekijk hoe KBC Moment je app zou aanpassen.',
  },
  'eerste-job': {
    title: 'Life moment: eerste job?',
    blurb: 'Mia pikte starter-signalen op. Speel het klant-prototype als Amir.',
  },
  zorgmoment: {
    title: 'Life moment: zorgdruk?',
    blurb: 'Mia merkt mogelijke druk op cashflow. In rust-modus dempt de app upsell.',
  },
}

function openingFor(ctx: ChatContext, live: boolean): string {
  const mode = live ? 'Mia (Gemini)' : 'Mia (lokale slimme modus)'
  if (ctx.reason === 'no-results') {
    return `Hallo, ik ben ${mode}. Je zocht op “${ctx.searchQuery}” zonder treffer. Vertel kort wat er speelt — ik help gericht verder.`
  }
  const bits = [`Hallo, ik ben ${mode}.`]
  if (ctx.question) bits.push(`Ik zie je traject rond “${ctx.question}”.`)
  if (ctx.answers.length) {
    bits.push(`Je koos: ${ctx.answers.map((a) => a.answer.toLowerCase()).join(' → ')}.`)
  }
  if (ctx.tried.length) bits.push(`Al geprobeerd: ${ctx.tried.join(', ')}.`)
  bits.push('Wat is de volgende detail dat ik moet weten?')
  return bits.join(' ')
}

export default function ChatAssistant({ context, onMessage, onSolved }: Props) {
  const live = Boolean(getGeminiApiKey())
  const [messages, setMessages] = useState<Message[]>([
    { from: 'bot', text: openingFor(context, live) },
  ])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([
    'Dit is de fout die ik zie…',
    'Wat moet ik nu doen?',
    'Ik wil een medewerker',
  ])
  const [momentHint, setMomentHint] = useState<MiaReply['momentHint']>(null)
  const [callback, setCallback] = useState<'closed' | 'form' | 'sent'>('closed')
  const [error, setError] = useState<string | null>(null)
  const listRef = useRef<HTMLOListElement>(null)
  const botTurns = messages.filter((m) => m.from === 'bot').length

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  async function converse(userText: string) {
    const trimmed = userText.trim()
    if (!trimmed || busy) return

    onMessage()
    setError(null)
    setDraft('')
    setBusy(true)
    setMessages((m) => [...m, { from: 'user', text: trimmed }])

    const history = [...messages, { from: 'user' as const, text: trimmed }]
      .filter((m) => m.from === 'user' || m.from === 'bot')
      .map((m) => ({
        role: (m.from === 'user' ? 'user' : 'model') as 'user' | 'model',
        text: m.text,
      }))

    try {
      const mia = await askMia(context, history)
      setSuggestions(mia.suggestions.length ? mia.suggestions : suggestions)
      if (mia.momentHint) setMomentHint(mia.momentHint)
      setMessages((m) => [
        ...m,
        { from: 'bot', text: mia.reply, urgency: mia.urgency },
      ])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Onbekende fout'
      setError(msg)
      setMessages((m) => [
        ...m,
        {
          from: 'bot',
          text: 'Even geen verbinding met Mia. Probeer opnieuw of vraag een terugbelverzoek.',
        },
      ])
    } finally {
      setBusy(false)
    }
  }

  function send(e: FormEvent) {
    e.preventDefault()
    void converse(draft)
  }

  function requestCallback(e: FormEvent) {
    e.preventDefault()
    setCallback('sent')
  }

  return (
    <div className="sh-chat">
      <div className={`sh-mia-banner ${live ? 'live' : 'local'}`}>
        <strong>{live ? 'Live · Google AI Studio (Gemini)' : 'Lokale modus'}</strong>
        <span>
          {live
            ? 'Antwoorden via gratis Gemini API met jouw boom-context.'
            : 'Zet VITE_GEMINI_API_KEY in .env voor live Mia. Nu: slimme offline fallback.'}
        </span>
      </div>

      <details className="sh-context">
        <summary>
          Context meegegeven aan Mia · {reasonLabel[context.reason]}
        </summary>
        <dl>
          {context.category && (
            <>
              <dt>Rubriek</dt>
              <dd>{context.category}</dd>
            </>
          )}
          {context.question && (
            <>
              <dt>Vraag</dt>
              <dd>{context.question}</dd>
            </>
          )}
          {context.searchQuery && (
            <>
              <dt>Zoekopdracht</dt>
              <dd>{context.searchQuery}</dd>
            </>
          )}
          {context.answers.length > 0 && (
            <>
              <dt>Gekozen antwoorden</dt>
              <dd>{context.answers.map((a) => a.answer).join(' → ')}</dd>
            </>
          )}
          {context.tried.length > 0 && (
            <>
              <dt>Al geprobeerd</dt>
              <dd>{context.tried.join(', ')}</dd>
            </>
          )}
        </dl>
      </details>

      <ol className="sh-messages" aria-live="polite" ref={listRef}>
        {messages.map((m, i) => (
          <li
            key={i}
            className={`sh-msg ${m.from}${m.urgency === 'high' ? ' urgent' : ''}`}
          >
            {m.text}
          </li>
        ))}
        {busy && (
          <li className="sh-msg bot typing" aria-label="Mia typt">
            <span />
            <span />
            <span />
          </li>
        )}
      </ol>

      {momentHint && (
        <aside className="sh-moment-card">
          <strong>{momentCopy[momentHint].title}</strong>
          <p>{momentCopy[momentHint].blurb}</p>
          <Link className="btn btn-primary" to="/app">
            Open klant-prototype →
          </Link>
        </aside>
      )}

      {callback === 'closed' && suggestions.length > 0 && !busy && (
        <div className="sh-suggestions" aria-label="Snelle antwoorden">
          {suggestions.map((s) => (
            <button key={s} type="button" className="sh-chip" onClick={() => void converse(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {callback === 'closed' && (
        <form className="sh-compose" onSubmit={send}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 500))}
            placeholder="Typ je bericht… (max 500 tekens)"
            aria-label="Bericht"
            disabled={busy}
            maxLength={500}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!draft.trim() || busy}
          >
            {busy ? '…' : 'Stuur'}
          </button>
        </form>
      )}

      {error && <p className="sh-error">{error}</p>}

      {callback === 'closed' && (
        <div className="sh-actions">
          <button type="button" className="btn btn-ghost" onClick={onSolved} disabled={busy}>
            Opgelost
          </button>
          {botTurns >= 2 && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setCallback('form')}
              disabled={busy}
            >
              Nog niet opgelost → terugbelverzoek
            </button>
          )}
        </div>
      )}

      {callback === 'form' && (
        <form className="sh-callback" onSubmit={requestCallback}>
          <p className="sh-step-title">Laatste stap: een medewerker belt je terug</p>
          <label>
            Telefoonnummer
            <input type="tel" required placeholder="04xx xx xx xx" maxLength={20} />
          </label>
          <label>
            Moment
            <select defaultValue="vandaag">
              <option value="vandaag">Vandaag, zo snel mogelijk</option>
              <option value="morgen-vm">Morgen voormiddag</option>
              <option value="morgen-nm">Morgen namiddag</option>
            </select>
          </label>
          <button type="submit" className="btn btn-primary">
            Bel mij terug
          </button>
        </form>
      )}

      {callback === 'sent' && (
        <p className="sh-note">
          Terugbelverzoek genoteerd (demo — er wordt niets verstuurd). De medewerker krijgt
          dezelfde boom-context + dit chatgesprek.
        </p>
      )}
    </div>
  )
}
