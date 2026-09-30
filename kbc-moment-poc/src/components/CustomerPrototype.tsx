import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { AppScreen } from '../data/scenarios'
import type { CustomerAction } from '../data/customerActions'
import type { AppTab } from '../hooks/useCustomerSession'
import { useCustomerSession } from '../hooks/useCustomerSession'
import { SpeakButton } from './SpeakButton'
import { ThemeToggle } from './ThemeToggle'

type Session = ReturnType<typeof useCustomerSession>

function balanceFor(scenarioId: string) {
  if (scenarioId === 'eerste-job') return '€186'
  if (scenarioId === 'zorgmoment') return '€940'
  return '€2.140'
}

function ActionButton({
  action,
  done,
  onRun,
}: {
  action: CustomerAction
  done: boolean
  onRun: (a: CustomerAction) => void
}) {
  return (
    <button
      type="button"
      className={done ? 'cust-action done' : 'cust-action'}
      disabled={done}
      onClick={() => onRun(action)}
    >
      <strong>{action.label}</strong>
      <span>{done ? 'Al gedaan' : action.detail}</span>
    </button>
  )
}

function HomeTab({ session }: { session: Session }) {
  const screen: AppScreen = session.momentActive
    ? session.scenario.appAfter
    : session.scenario.appBefore

  const remaining = session.actions.filter(
    (a) => !session.state.unlockedSignalIds.includes(a.unlocksSignalId),
  )

  return (
    <div className="cust-screen">
      <p className="cust-mode">{screen.modeLabel}</p>
      <h2 className="cust-hello">{screen.headline}</h2>
      <p className="cust-sub">{screen.sub}</p>
      <div className="cust-balance">
        <span>Zichtrekening</span>
        <strong>{balanceFor(session.scenario.id)}</strong>
      </div>

      <button type="button" className="cust-cta">
        {screen.primaryCta}
      </button>

      {session.momentActive && screen.checklist.length > 0 && (
        <ul className="cust-check">
          {screen.checklist.map((item) => {
            const done =
              item.done || session.state.checkedItems.includes(item.label)
            return (
              <li key={item.label}>
                <button
                  type="button"
                  className={done ? 'check-row done' : 'check-row'}
                  onClick={() => session.toggleCheck(item.label)}
                >
                  <span className="check-box" aria-hidden>
                    {done ? '✓' : ''}
                  </span>
                  {item.label}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="cust-tiles">
        {screen.tiles.map((tile) => (
          <div
            key={tile.title}
            className={tile.muted ? 'cust-tile muted-tile' : 'cust-tile'}
          >
            <strong>{tile.title}</strong>
            <span>{tile.meta}</span>
          </div>
        ))}
      </div>

      {!session.momentActive && remaining.length > 0 && (
        <div className="cust-hint-card">
          <strong>Wat kun je doen?</strong>
          <p>
            Gebruik <em>Betalen</em> of <em>Zoeken</em> om dingen te doen die in
            het echt ook signalen zouden geven. Na genoeg acties past je home
            zich aan.
          </p>
          {remaining
            .filter((a) => a.tab === 'home')
            .map((action) => (
              <ActionButton
                key={action.id}
                action={action}
                done={false}
                onRun={session.runAction}
              />
            ))}
        </div>
      )}

      {session.momentActive && (
        <div className="cust-hint-card success">
          <strong>Moment herkend</strong>
          <p>
            De bank schat in: {session.scenario.situation} (
            {Math.round(session.inference.confidence * 100)}% zeker). Check ook
            je berichten — er is een note van je adviseur.
          </p>
        </div>
      )}
    </div>
  )
}

function ActionsTab({
  session,
  tab,
  title,
  lead,
}: {
  session: Session
  tab: 'betalen' | 'zoeken'
  title: string
  lead: string
}) {
  const list = session.actions.filter((a) => a.tab === tab)
  return (
    <div className="cust-screen">
      <h2 className="cust-hello">{title}</h2>
      <p className="cust-sub">{lead}</p>
      <div className="cust-action-list">
        {list.map((action) => (
          <ActionButton
            key={action.id}
            action={action}
            done={session.state.unlockedSignalIds.includes(action.unlocksSignalId)}
            onRun={session.runAction}
          />
        ))}
        {list.length === 0 && (
          <p className="muted">Geen acties op dit tabblad voor dit scenario.</p>
        )}
      </div>
      {!session.state.consent && (
        <p className="consent-warn">
          Personalisatie staat uit — acties gebeuren wel, maar je home past zich
          niet aan.
        </p>
      )}
    </div>
  )
}

function MessagesTab({ session }: { session: Session }) {
  if (!session.momentActive) {
    return (
      <div className="cust-screen">
        <h2 className="cust-hello">Berichten</h2>
        <p className="cust-sub">Nog geen nieuwe berichten.</p>
        <div className="cust-hint-card">
          <p>
            Als de bank genoeg signalen heeft, verschijnt hier een korte note
            van je adviseur (gesimuleerd).
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="cust-screen">
      <h2 className="cust-hello">Berichten</h2>
      <article
        className={
          session.state.advisorRead ? 'cust-message' : 'cust-message unread'
        }
      >
        <header>
          <strong>Je KBC-adviseur</strong>
          <span>Zojuist · gesimuleerd</span>
        </header>
        <p>{session.scenario.advisorScript}</p>
        <div className="cust-message-actions">
          <SpeakButton text={session.scenario.advisorScript} enabled />
          {!session.state.advisorRead && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={session.markAdvisorRead}
            >
              Markeer als gelezen
            </button>
          )}
        </div>
      </article>
    </div>
  )
}

function ProfileTab({ session }: { session: Session }) {
  return (
    <div className="cust-screen">
      <h2 className="cust-hello">Profiel</h2>
      <p className="cust-sub">
        {session.scenario.customer} · {session.scenario.age} ·{' '}
        {session.scenario.city}
      </p>

      <label className="toggle cust-toggle">
        <input
          type="checkbox"
          checked={session.state.consent}
          onChange={(e) => session.setConsent(e.target.checked)}
        />
        <span>Toestemming personalisatie</span>
      </label>

      <div className="cust-hint-card">
        <strong>Voortgang signalen</strong>
        <p>
          {session.state.unlockedSignalIds.length} /{' '}
          {session.scenario.signals.length} aanwijzingen verzameld
          {session.momentActive ? ' · moment actief' : ''}.
        </p>
        <ul className="plain-list">
          {session.scenario.signals.map((s) => (
            <li key={s.id}>
              {session.state.unlockedSignalIds.includes(s.id) ? '✓' : '○'}{' '}
              {s.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="cust-profile-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={session.resetSession}
        >
          Opnieuw beginnen (andere persona)
        </button>
        <Link className="btn btn-primary" to="/">
          Terug naar uitlegpagina
        </Link>
      </div>
    </div>
  )
}

function Onboarding({ session }: { session: Session }) {
  const [scenarioId, setScenarioId] = useState(session.scenarios[0].id)
  const [consent, setConsent] = useState(true)

  return (
    <div className="cust-onboard">
      <p className="eyebrow">Klant-prototype</p>
      <h1>Stap in als klant</h1>
      <p className="cust-sub">
        Geen echte login. Kies een persona en doe bankzaken — de app past zich
        aan als er genoeg signalen zijn. Advisor & backend zijn gesimuleerd.
      </p>

      <div className="cust-persona-grid">
        {session.scenarios.map((s) => (
          <button
            key={s.id}
            type="button"
            className={
              scenarioId === s.id ? 'cust-persona active' : 'cust-persona'
            }
            onClick={() => setScenarioId(s.id)}
          >
            <strong>{s.customer}</strong>
            <span>
              {s.title} · {s.city}
            </span>
            <em>{s.tagline}</em>
          </button>
        ))}
      </div>

      <label className="toggle cust-toggle">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>Ik geef toestemming voor moment-personalisatie</span>
      </label>

      <button
        type="button"
        className="btn btn-primary"
        onClick={() => session.startSession(scenarioId, consent)}
      >
        Open mijn KBC-app
      </button>
      <div className="cust-onboard-footer">
        <ThemeToggle />
        <Link className="text-link" to="/">
          ← Terug naar de uitleg
        </Link>
      </div>
      <p className="security-note">
        Prototype-veiligheid (basis): geen echte wachtwoorden of klantdata,
        sessie alleen in deze browsertab (sessionStorage), alleen vaste knoppen
        (geen vrije tekstinvoer).
      </p>
    </div>
  )
}

export function CustomerPrototype() {
  const session = useCustomerSession()

  if (!session.state.onboarded) {
    return (
      <div className="cust-page">
        <Onboarding session={session} />
      </div>
    )
  }

  const tabs: { id: AppTab; label: string; badge?: boolean }[] = [
    { id: 'home', label: 'Home' },
    { id: 'betalen', label: 'Betalen' },
    { id: 'zoeken', label: 'Zoeken' },
    { id: 'berichten', label: 'Berichten', badge: session.unreadAdvisor },
    { id: 'ik', label: 'Ik' },
  ]

  return (
    <div className="cust-page">
      <header className="cust-top">
        <div>
          <strong>KBC Moment</strong>
          <span>Klant-prototype</span>
        </div>
        <div className="cust-top-actions">
          <ThemeToggle />
          <Link to="/" className="text-link">
            Uitleg
          </Link>
        </div>
      </header>

      <div className="cust-phone-frame">
        <div className="cust-status">
          <span>09:41</span>
          <span>{session.momentActive ? 'Moment actief' : 'Standaard'}</span>
        </div>

        <main className="cust-main">
          {session.tab === 'home' && <HomeTab session={session} />}
          {session.tab === 'betalen' && (
            <ActionsTab
              session={session}
              tab="betalen"
              title="Betalen"
              lead="Simuleer betalingen die in het echt ook zichtbaar zouden zijn."
            />
          )}
          {session.tab === 'zoeken' && (
            <ActionsTab
              session={session}
              tab="zoeken"
              title="Zoeken"
              lead="Simuleer zoekgedrag in de app — dat zijn ook signalen."
            />
          )}
          {session.tab === 'berichten' && <MessagesTab session={session} />}
          {session.tab === 'ik' && <ProfileTab session={session} />}
        </main>

        <nav className="cust-nav" aria-label="Hoofdmenu">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={session.tab === t.id ? 'active' : ''}
              onClick={() => session.setTab(t.id)}
            >
              {t.label}
              {t.badge ? <i className="badge" aria-label="nieuw" /> : null}
            </button>
          ))}
        </nav>
      </div>

      {session.toast && <div className="cust-toast">{session.toast}</div>}
    </div>
  )
}
