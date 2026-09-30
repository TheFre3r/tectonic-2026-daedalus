import { useEffect, useRef, useState, type FormEvent } from 'react'
import { searchTrees } from '../data/trees'
import { askMia, isMiaLivePreferred } from '../lib/gemini'
import { isPlausibleBePhone, sanitizeText } from '../lib/security'
import { reasonLabel, useSnelhulp, type ChatContext } from '../hooks/useSnelhulp'

type Bubble = {
  id: string
  from: 'bot' | 'user'
  text: string
}

function openingAfterEscalate(ctx: ChatContext, live: boolean): string {
  const who = live ? 'Mia (Gemini)' : 'Mia (lokale modus)'
  if (ctx.reason === 'no-results') {
    return `Hallo, ik ben ${who}. Je zocht op “${ctx.searchQuery}” zonder treffer. Vertel kort wat er speelt.`
  }
  if (ctx.reason === 'ask-mia') {
    return `Hallo, ik ben ${who}. Waarmee kan ik helpen?`
  }
  const parts = [`Hallo, ik ben ${who}.`]
  if (ctx.question) parts.push(`Ik zie je traject rond “${ctx.question}”.`)
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
  const live = isMiaLivePreferred()
  const [draft, setDraft] = useState('')
  const [extra, setExtra] = useState<Bubble[]>([])
  const [botTurns, setBotTurns] = useState(0)
  const [busy, setBusy] = useState(false)
  const [callback, setCallback] = useState<'closed' | 'form' | 'sent'>('closed')
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState<string | null>(null)
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
          text: openingAfterEscalate(s.escalation, live),
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
      setBusy(false)
    }
  }, [escalatedKey, s.escalation, live])

  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [s.depth, s.answers, s.node, s.resolved, extra, callback, busy])

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
    const text = sanitizeText(draft, 500)
    if (!text || busy) return
    setDraft('')

    if (s.resolved) {
      const hits = searchTrees(text)
      if (hits[0]) s.openTree(hits[0].tree)
      else s.escalateFromSearchWithQuery(text)
      return
    }

    if (s.escalation) {
      void (async () => {
        s.countChatMessage()
        const userBubble: Bubble = { id: `u-${Date.now()}`, from: 'user', text }
        setExtra((m) => [...m, userBubble])
        setBusy(true)
        try {
          const history = [...extra, userBubble]
            .filter((b) => b.from === 'user' || b.from === 'bot')
            .map((b) => ({
              role: (b.from === 'user' ? 'user' : 'model') as 'user' | 'model',
              text: b.text,
            }))
          const mia = await askMia(s.escalation!, history)
          setExtra((m) => [
            ...m,
            { id: `b-${Date.now()}`, from: 'bot', text: mia.reply },
          ])
          setBotTurns((n) => n + 1)
        } catch {
          setExtra((m) => [
            ...m,
            {
              id: `b-${Date.now()}`,
              from: 'bot',
              text: 'Even geen verbinding met Mia. Probeer opnieuw of vraag een terugbelverzoek.',
            },
          ])
        } finally {
          setBusy(false)
        }
      })()
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
    if (!isPlausibleBePhone(phone)) {
      setPhoneError('Gebruik een Belgisch nummer (bv. 04xx xx xx xx)')
      return
    }
    setPhoneError(null)
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
          <strong>Chat hulp · Mia</strong>
          <span>
            {s.escalation
              ? `${live ? 'Gemini live' : 'Lokale Mia'} · ${reasonLabel[s.escalation.reason]}`
              : 'Beslisboom eerst · Mia bij escalatie'}
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

        {busy && (
          <div className="cust-hulp-bubble bot">Mia denkt na…</div>
        )}

        {suggestions.length > 0 && !busy && (
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
              <input
                type="tel"
                required
                placeholder="04xx xx xx xx"
                maxLength={20}
                autoComplete="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
            {phoneError && <p role="alert">{phoneError}</p>}
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
            onChange={(e) => setDraft(e.target.value.slice(0, 500))}
            maxLength={500}
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
          <button type="submit" className="btn btn-primary" disabled={!draft.trim() || busy}>
            {busy ? '…' : 'Stuur'}
          </button>
        </form>
      )}

      <p className="cust-hulp-note">
        Prototype. Eerst vaste stappen; daarna Mia
        {live ? ' via beveiligde Gemini-proxy' : ' (lokale modus — server key ontbreekt)'}.
        {!s.escalation && s.tree ? ` · Terug ${s.backs}/3` : null}
      </p>
    </div>
  )
}
