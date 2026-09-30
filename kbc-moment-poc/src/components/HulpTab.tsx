import { useEffect, useRef, useState, type FormEvent } from 'react'
import { searchTrees } from '../data/trees'
import { reasonLabel, useSnelhulp, type ChatContext } from '../hooks/useSnelhulp'

type Bubble = {
  id: string
  from: 'bot' | 'user'
  text: string
}

const followUps = [
  'Dank je. Op basis daarvan lijkt het een blokkering aan onze kant. Ik heb je kaartinstellingen gecontroleerd en een reset aangevraagd — probeer het binnen 5 minuten opnieuw.',
  'Dit vraagt een medewerker. Je kan meteen een terugbelverzoek doen; die ziet dit hele gesprek, zodat je niets hoeft te herhalen.',
]

function openingAfterEscalate(ctx: ChatContext): string {
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
  parts.push('Wat zie je precies op je scherm?')
  return parts.join(' ')
}

/**
 * Chat hulp als berichten-thread: beslisboom via bubbels + chips,
 * vrije chat pas na escalatie — zelfde compose-balk als berichten.
 */
export function HulpTab() {
  const s = useSnelhulp()
  const [draft, setDraft] = useState('')
  const [extra, setExtra] = useState<Bubble[]>([])
  const [botTurns, setBotTurns] = useState(0)
  const [callback, setCallback] = useState<'closed' | 'form' | 'sent'>('closed')
  const logRef = useRef<HTMLDivElement>(null)
  const escalatedKey = s.escalation
    ? `${s.escalation.reason}:${s.escalation.question ?? s.escalation.searchQuery}`
    : null
  const prevEscalated = useRef<string | null>(null)

  useEffect(() => {
    if (escalatedKey && escalatedKey !== prevEscalated.current && s.escalation) {
      prevEscalated.current = escalatedKey
      setExtra([
        {
          id: `esc-${escalatedKey}`,
          from: 'bot',
          text: openingAfterEscalate(s.escalation),
        },
      ])
      setBotTurns(1)
      setCallback('closed')
    }
    if (!escalatedKey) {
      prevEscalated.current = null
      setExtra([])
      setBotTurns(0)
      setCallback('closed')
    }
  }, [escalatedKey, s.escalation])

  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [s.depth, s.answers, s.node, s.resolved, extra, callback])

  const thread: Bubble[] = []
  thread.push({
    id: 'welcome',
    from: 'bot',
    text: 'Hoi! Stuur je vraag of kies een suggestie hieronder. Meestal kom je er zonder medewerker uit.',
  })

  if (s.tree) {
    thread.push({ id: `q-${s.tree.id}`, from: 'user', text: s.tree.question })
    for (let i = 0; i < s.answers.length; i++) {
      const a = s.answers[i]
      thread.push({ id: `bq-${i}`, from: 'bot', text: a.question })
      thread.push({ id: `ua-${i}`, from: 'user', text: a.answer })
    }
    if (!s.escalation && s.node?.kind === 'question') {
      thread.push({ id: `n-${s.node.id}`, from: 'bot', text: s.node.text })
    }
    if (!s.escalation && s.node?.kind === 'solution') {
      thread.push({
        id: `s-${s.node.id}`,
        from: 'bot',
        text: `${s.node.title}\n\n${s.node.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}`,
      })
    }
    if (!s.escalation && s.node?.kind === 'dead-end') {
      thread.push({ id: `d-${s.node.id}`, from: 'bot', text: s.node.text })
    }
  }

  if (s.escalation && !s.tree) {
    thread.push({
      id: 'search-user',
      from: 'user',
      text: s.escalation.searchQuery ?? 'Geen passende vraag gevonden',
    })
  }

  for (const m of extra) thread.push(m)

  if (s.resolved) {
    thread.push({
      id: 'done',
      from: 'bot',
      text: 'Fijn, je vraag is opgelost. Stuur gerust een nieuwe vraag als je nog iets nodig hebt.',
    })
  }

  const suggestions: { label: string; onPick: () => void }[] = []

  if (!s.resolved && !s.escalation && !s.tree) {
    for (const t of s.category.trees.slice(0, 4)) {
      suggestions.push({ label: t.question, onPick: () => s.openTree(t) })
    }
  } else if (!s.resolved && !s.escalation && s.node?.kind === 'question') {
    for (const o of s.node.options) {
      suggestions.push({ label: o.label, onPick: () => s.choose(o.label, o.next) })
    }
  } else if (!s.resolved && !s.escalation && s.node?.kind === 'solution') {
    suggestions.push({ label: 'Opgelost', onPick: () => s.markSolved() })
    suggestions.push({ label: 'Lost het niet op', onPick: () => s.markNotSolved() })
  } else if (!s.resolved && s.escalation && callback === 'closed') {
    if (botTurns >= 2) {
      suggestions.push({
        label: 'Bel me terug',
        onPick: () => setCallback('form'),
      })
    }
    suggestions.push({ label: 'Opgelost', onPick: () => s.chatSolved() })
  }

  function send(e: FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    setDraft('')

    if (s.resolved) {
      const hits = searchTrees(text)
      if (hits[0]) s.openTree(hits[0].tree)
      else s.escalateFromSearchWithQuery(text)
      return
    }

    if (s.escalation) {
      s.countChatMessage()
      const reply = followUps[Math.min(botTurns - 1, followUps.length - 1)]
      setExtra((m) => [
        ...m,
        { id: `u-${Date.now()}`, from: 'user', text },
        { id: `b-${Date.now()}`, from: 'bot', text: reply },
      ])
      setBotTurns((n) => n + 1)
      return
    }

    if (s.node?.kind === 'question') {
      const lower = text.toLowerCase()
      const match = s.node.options.find((o) => o.label.toLowerCase() === lower)
      if (match) {
        s.choose(match.label, match.next)
        return
      }
      const soft = s.node.options.find(
        (o) =>
          o.label.toLowerCase().includes(lower) ||
          lower.includes(o.label.toLowerCase()),
      )
      if (soft) {
        s.choose(soft.label, soft.next)
        return
      }
      setExtra((m) => [
        ...m,
        { id: `u-${Date.now()}`, from: 'user', text },
        {
          id: `b-${Date.now()}`,
          from: 'bot',
          text: 'Kies een van de suggesties hieronder — zo blijft de beslisboom op het juiste pad.',
        },
      ])
      return
    }

    if (s.node?.kind === 'solution') {
      const lower = text.toLowerCase()
      if (lower.includes('opgelost') || lower === 'ja' || lower === 'ok') {
        s.markSolved()
        return
      }
      if (lower.includes('niet') || lower.includes('nee')) {
        s.markNotSolved()
        return
      }
    }

    const hits = searchTrees(text)
    if (hits[0]) {
      s.openTree(hits[0].tree)
      return
    }

    s.escalateFromSearchWithQuery(text)
  }

  function requestCallback(e: FormEvent) {
    e.preventDefault()
    setCallback('sent')
    setExtra((m) => [
      ...m,
      {
        id: `cb-${Date.now()}`,
        from: 'bot',
        text: 'Terugbelverzoek genoteerd (demo — er wordt niets verstuurd). De medewerker krijgt dezelfde context als dit gesprek.',
      },
    ])
  }

  return (
    <div className="cust-screen cust-hulp cust-hulp-chat">
      <header className="cust-hulp-head">
        <div className="cust-hulp-avatar" aria-hidden>
          K
        </div>
        <div>
          <strong>Chat hulp</strong>
          <span>
            {s.escalation
              ? `Assistent · ${reasonLabel[s.escalation.reason]}`
              : 'Beslisboom · antwoorden uit vaste stappen'}
          </span>
        </div>
      </header>

      <div className="cust-hulp-log" ref={logRef} aria-live="polite">
        {thread.map((m) => (
          <div key={m.id} className={`cust-hulp-bubble ${m.from}`}>
            {m.text.split('\n').map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </div>
        ))}

        {suggestions.length > 0 && (
          <div className="cust-hulp-chips" aria-label="Suggesties">
            {suggestions.map((c) => (
              <button key={c.label} type="button" onClick={c.onPick}>
                {c.label}
              </button>
            ))}
          </div>
        )}

        {!s.tree && !s.escalation && !s.resolved && (
          <div className="cust-hulp-cats" role="tablist" aria-label="Rubriek">
            {s.categories.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={c.id === s.category.id}
                className={c.id === s.category.id ? 'active' : ''}
                onClick={() => s.selectCategory(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {callback === 'form' && (
          <form className="cust-hulp-callback" onSubmit={requestCallback}>
            <p>Laatste stap: een medewerker belt je terug</p>
            <label>
              Telefoonnummer
              <input type="tel" required placeholder="04xx xx xx xx" />
            </label>
            <button type="submit" className="btn btn-primary">
              Bel mij terug
            </button>
          </form>
        )}
      </div>

      {callback !== 'form' && (
        <form className="cust-hulp-compose" onSubmit={send}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              s.escalation
                ? 'Typ je bericht…'
                : s.node?.kind === 'question'
                  ? 'Of typ je keuze…'
                  : 'Typ je vraag, bv. “kaart geweigerd”'
            }
            aria-label="Bericht"
            autoComplete="off"
          />
          <button type="submit" className="btn btn-primary" disabled={!draft.trim()}>
            Stuur
          </button>
        </form>
      )}

      <p className="cust-hulp-note">
        Prototype. Eerst vaste stappen; vrije chat pas als de boom vastloopt.
        {!s.escalation && s.tree ? ` · Terug ${s.backs}/3` : null}
      </p>
    </div>
  )
}
