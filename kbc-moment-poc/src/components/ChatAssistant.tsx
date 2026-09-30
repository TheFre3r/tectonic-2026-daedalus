import { useState, type FormEvent } from 'react'
import { reasonLabel, type ChatContext } from '../hooks/useSnelhulp'

/*
 * Gesimuleerde chatbot. Deze module wordt pas via React.lazy geladen bij
 * escalatie — tot dan: geen bundel, geen sessie, geen tokens.
 */

type Props = {
  context: ChatContext
  onMessage: () => void
  onSolved: () => void
}

type Message = { from: 'bot' | 'user'; text: string }

function openingMessage(ctx: ChatContext): string {
  if (ctx.reason === 'no-results') {
    return `Je zocht op “${ctx.searchQuery}”, maar vond geen passend antwoord. Vertel kort wat er aan de hand is.`
  }
  const parts = [`Ik zie dat het gaat over “${ctx.question}”.`]
  if (ctx.answers.length) {
    parts.push(`Je gaf aan: ${ctx.answers.map((a) => a.answer.toLowerCase()).join(' → ')}.`)
  }
  if (ctx.tried.length) {
    parts.push(`Je probeerde al: ${ctx.tried.join(', ')}. Die sla ik over.`)
  }
  parts.push('Wat zie je precies op je scherm of terminal?')
  return parts.join(' ')
}

const followUps = [
  'Dank je. Op basis daarvan lijkt het een blokkering aan onze kant. Ik heb je kaartinstellingen gecontroleerd en een reset aangevraagd — probeer het binnen 5 minuten opnieuw.',
  'Dit vraagt een medewerker. Je kan meteen een terugbelverzoek doen; die ziet dit hele gesprek, zodat je niets hoeft te herhalen.',
]

export default function ChatAssistant({ context, onMessage, onSolved }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { from: 'bot', text: openingMessage(context) },
  ])
  const [draft, setDraft] = useState('')
  const [callback, setCallback] = useState<'closed' | 'form' | 'sent'>('closed')
  const botTurns = messages.filter((m) => m.from === 'bot').length

  function send(e: FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    onMessage()
    setDraft('')
    const reply = followUps[Math.min(botTurns - 1, followUps.length - 1)]
    setMessages((m) => [...m, { from: 'user', text }, { from: 'bot', text: reply }])
  }

  function requestCallback(e: FormEvent) {
    e.preventDefault()
    setCallback('sent')
  }

  return (
    <div className="sh-chat">
      <details className="sh-context">
        <summary>Context meegegeven aan de chatbot · {reasonLabel[context.reason]}</summary>
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

      <ol className="sh-messages" aria-live="polite">
        {messages.map((m, i) => (
          <li key={i} className={`sh-msg ${m.from}`}>
            {m.text}
          </li>
        ))}
      </ol>

      {callback === 'closed' && (
        <form className="sh-compose" onSubmit={send}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Typ je bericht…"
            aria-label="Bericht"
          />
          <button type="submit" className="btn btn-primary" disabled={!draft.trim()}>
            Stuur
          </button>
        </form>
      )}

      {callback === 'closed' && (
        <div className="sh-actions">
          <button type="button" className="btn btn-ghost" onClick={onSolved}>
            Opgelost
          </button>
          {botTurns >= 2 && (
            <button type="button" className="btn btn-ghost" onClick={() => setCallback('form')}>
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
            <input type="tel" required placeholder="04xx xx xx xx" />
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
          dezelfde context als de chatbot.
        </p>
      )}
    </div>
  )
}
