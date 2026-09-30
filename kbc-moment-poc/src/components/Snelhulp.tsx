import { lazy, Suspense } from 'react'
import { MAX_BACKS, MAX_NOT_SOLVED, reasonLabel, useSnelhulp } from '../hooks/useSnelhulp'
import './Snelhulp.css'

/* Code-split: de chatbot-bundel wordt pas opgehaald bij de eerste escalatie. */
const ChatAssistant = lazy(() => import('./ChatAssistant'))

export function Snelhulp() {
  const s = useSnelhulp()

  const total = s.stats.selfServed + s.stats.withChat
  const selfShare = total ? Math.round((s.stats.selfServed / total) * 100) : 0
  const searching = s.query.trim().length > 0

  return (
    <section className="snelhulp" id="snelhulp">
      <div className="sh-head">
        <p className="sh-eyebrow">Snelhulp</p>
        <h1>Waarmee kunnen we helpen?</h1>
        <p>
          Kies je vraag en beantwoord een paar korte vragen. <strong>Mia</strong> — onze
          Gemini-assistent — komt tussen als de boom stokt, of wanneer jij haar
          rechtstreeks aanspreekt.
        </p>
      </div>

      <div className="sh-layout">
        <aside className="sh-nav">
          <input
            className="sh-search"
            type="search"
            value={s.query}
            onChange={(e) => s.setQuery(e.target.value)}
            placeholder="Zoek, bv. “geweigerd”"
            aria-label="Zoek een vraag"
          />

          {!searching && (
            <div className="sh-cats" role="tablist" aria-label="Rubriek">
              {s.categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={c.id === s.category.id}
                  className={c.id === s.category.id ? 'sh-cat active' : 'sh-cat'}
                  onClick={() => s.selectCategory(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          <ul className="sh-questions">
            {(searching ? s.results.map((r) => r.tree) : s.category.trees).map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className={t.id === s.tree?.id ? 'sh-q active' : 'sh-q'}
                  onClick={() => s.openTree(t)}
                >
                  {t.question}
                </button>
              </li>
            ))}
          </ul>

          {searching && s.results.length === 0 && (
            <div className="sh-empty">
              <p>Geen vraag gevonden voor “{s.query.trim()}”.</p>
              <button type="button" className="btn btn-ghost" onClick={s.escalateFromSearch}>
                Stel je vraag aan de assistent
              </button>
            </div>
          )}
        </aside>

        <div className="sh-panel">
          {s.resolved ? (
            <div className="sh-done">
              <p className="sh-step-title">Fijn, je vraag is opgelost.</p>
              <button type="button" className="btn btn-primary" onClick={s.reset}>
                Nog een vraag
              </button>
            </div>
          ) : s.escalation ? (
            <>
              <div className="sh-escalated">
                <span className="sh-badge">Escalatie</span>
                <span>{reasonLabel[s.escalation.reason]}</span>
              </div>
              <Suspense fallback={<p className="sh-note">Chatassistent laden…</p>}>
                <ChatAssistant
                  key={`${s.escalation.reason}:${s.escalation.question ?? s.escalation.searchQuery}`}
                  context={s.escalation}
                  onMessage={s.countChatMessage}
                  onSolved={s.chatSolved}
                />
              </Suspense>
            </>
          ) : s.node && s.tree ? (
            <div className="sh-tree">
              <div className="sh-crumbs">
                <span>{s.treeCategory?.label}</span>
                <span aria-hidden>›</span>
                <span>{s.tree.question}</span>
              </div>

              {s.node.kind === 'question' && (
                <>
                  <p className="sh-step-title">{s.node.text}</p>
                  <div className="sh-options">
                    {s.node.options.map((o) => (
                      <button
                        key={o.next}
                        type="button"
                        className="sh-option"
                        onClick={() => s.choose(o.label, o.next)}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {s.node.kind === 'solution' && (
                <>
                  <p className="sh-step-title">{s.node.title}</p>
                  <ol className="sh-steps">
                    {s.node.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                  <div className="sh-actions">
                    <button type="button" className="btn btn-primary" onClick={s.markSolved}>
                      Opgelost
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={s.markNotSolved}>
                      Lost het niet op
                    </button>
                  </div>
                </>
              )}

              <div className="sh-tree-foot">
                <button
                  type="button"
                  className="sh-back"
                  onClick={s.back}
                  disabled={s.depth <= 1}
                >
                  ← Terug
                </button>
                <span className="sh-meter">
                  Niet opgelost {s.notSolved}/{MAX_NOT_SOLVED} · Terug {s.backs}/{MAX_BACKS}
                </span>
              </div>
            </div>
          ) : (
            <div className="sh-idle">
              <p className="sh-step-title">Kies een vraag om te starten.</p>
              <p className="sh-note">
                Geen login, geen klantprofiel: de beslisboom werkt met wat je aanklikt.
                Probeer ook de nieuwe rubriek <strong>Life moments</strong>.
              </p>
              <div className="sh-idle-actions">
                <button type="button" className="btn btn-primary" onClick={s.askMiaDirect}>
                  Praat met Mia
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    const life = s.categories.find((c) => c.id === 'leven')
                    if (life) s.selectCategory(life.id)
                  }}
                >
                  Toon life moments
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="sh-stats" aria-label="Prototype-teller">
          <p className="sh-eyebrow">Prototype-teller</p>
          <div className="sh-stat">
            <strong>{s.stats.selfServed}</strong>
            <span>opgelost zonder chatbot</span>
          </div>
          <div className="sh-stat">
            <strong>{s.stats.withChat}</strong>
            <span>opgelost met chatbot</span>
          </div>
          <div className="sh-bar" aria-hidden>
            <span style={{ width: `${selfShare}%` }} />
          </div>
          <p className="sh-note">
            {total ? `${selfShare}% zelf opgelost` : 'Nog geen vragen afgerond'} ·{' '}
            {s.stats.chatMessages} chatberichten
          </p>
          <p className={s.chatLoaded ? 'sh-module on' : 'sh-module'}>
            Chat-module: {s.chatLoaded ? 'geladen' : 'niet geladen'}
          </p>
          <button type="button" className="btn btn-ghost sh-ask-mia" onClick={s.askMiaDirect}>
            Vraag het aan Mia
          </button>
        </aside>
      </div>
    </section>
  )
}
