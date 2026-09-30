import { channelLabel, toneLabel, type Scenario } from '../data/scenarios'
import type { InferenceSnapshot, ScaleMetrics } from '../engine/momentEngine'
import type { DemoView } from '../hooks/useMomentDemo'
import { PhoneMockup } from './PhoneMockup'
import { SpeakButton } from './SpeakButton'

type Props = {
  scenario: Scenario
  inference: InferenceSnapshot
  scale: ScaleMetrics
  view: DemoView
  setView: (v: DemoView) => void
  showAfter: boolean
  setShowAfter: (v: boolean) => void
  consent: boolean
  setConsent: (v: boolean) => void
  advisorOverride: boolean
  setAdvisorOverride: (v: boolean) => void
  onSelectScenario: (id: string) => void
  onReplay: () => void
  allScenarios: Scenario[]
}

const views: { id: DemoView; label: string }[] = [
  { id: 'overview', label: '1. Engine' },
  { id: 'app', label: '2. Klant-app' },
  { id: 'advisor', label: '3. Adviseur' },
  { id: 'channels', label: '4. Kanalen' },
  { id: 'privacy', label: '5. Privacy' },
  { id: 'scale', label: '6. Schaal' },
]

export function PrototypeDemo(props: Props) {
  const {
    scenario,
    inference,
    scale,
    view,
    setView,
    showAfter,
    setShowAfter,
    consent,
    setConsent,
    advisorOverride,
    setAdvisorOverride,
    onSelectScenario,
    onReplay,
    allScenarios,
  } = props

  const phaseLabel: Record<string, string> = {
    idle: 'Wachten op signalen',
    listening: 'Signalen verzamelen',
    recognizing: 'Situatie herkennen',
    orchestrating: 'Kanalen orkestreren',
    ready: 'Moment actief',
  }

  return (
    <section className="demo" id="demo">
      <div className="section-head">
        <h2>Prototype-demo</h2>
        <p>
          Volledige flow: signalen → herkenning → gepersonaliseerde app →
          adviseursbriefing → kanalen → privacy → schaal.
        </p>
      </div>

      <div className="scenario-picker" role="tablist" aria-label="Scenario">
        {allScenarios.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={s.id === scenario.id}
            className={s.id === scenario.id ? 'scenario-tab active' : 'scenario-tab'}
            onClick={() => onSelectScenario(s.id)}
          >
            {s.title}
          </button>
        ))}
        <button type="button" className="replay" onClick={onReplay}>
          Opnieuw afspelen
        </button>
      </div>

      <div className="consent-bar">
        <label className="toggle">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>Moment-personalisatie consent</span>
        </label>
        {!consent && (
          <span className="consent-warn">
            Zonder consent: geen inferentie, standaard ervaring.
          </span>
        )}
      </div>

      <div className="view-tabs" role="tablist" aria-label="Demo-onderdelen">
        {views.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={view === v.id}
            className={view === v.id ? 'view-tab active' : 'view-tab'}
            onClick={() => setView(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === 'overview' && (
        <div className="demo-grid">
          <aside className="panel">
            <p className="eyebrow">Klant</p>
            <h3>{scenario.customer}</h3>
            <p className="muted">
              {scenario.age} · {scenario.city}
            </p>
            <p className="tagline">{scenario.tagline}</p>

            <div className="phase-chip">{phaseLabel[inference.phase]}</div>

            <div className="inference">
              <div className="inference-row">
                <span>Situatie</span>
                <strong className={inference.situation ? 'in' : ''}>
                  {inference.situation ?? '—'}
                </strong>
              </div>
              <div className="inference-row">
                <span>Gedrag</span>
                <strong className={inference.behavior ? 'in' : ''}>
                  {inference.behavior ?? '—'}
                </strong>
              </div>
              <div className="inference-row">
                <span>Intent</span>
                <strong className={inference.intent ? 'in' : ''}>
                  {inference.intent ?? '—'}
                </strong>
              </div>
              <div className="inference-row">
                <span>Confidence</span>
                <strong className="in">
                  {Math.round(inference.confidence * 100)}%
                </strong>
              </div>
              <div
                className="confidence-bar"
                role="progressbar"
                aria-valuenow={Math.round(inference.confidence * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ width: `${inference.confidence * 100}%` }} />
              </div>
            </div>
          </aside>

          <div className="panel">
            <p className="eyebrow">Signalen</p>
            <h3>Event pipeline</h3>
            <ul className="signal-list">
              {scenario.signals.map((signal) => {
                const shown = inference.signalsSeen.some((s) => s.id === signal.id)
                return (
                  <li key={signal.id} className={shown ? 'signal shown' : 'signal'}>
                    <span className="signal-source">{signal.source}</span>
                    <span className="signal-label">
                      {shown ? signal.label : 'wacht…'}
                    </span>
                    <span className="signal-weight">+{Math.round(signal.weight * 100)}</span>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="panel span-2">
            <p className="eyebrow">Orkestratie</p>
            <h3>Zodra het moment klaar is</h3>
            <p className="muted">
              {inference.ready
                ? scenario.impact
                : 'Kanalen worden pas geactiveerd na voldoende confidence.'}
            </p>
            <div className="action-list compact">
              {scenario.actions.map((action, i) => (
                <article
                  key={action.channel}
                  className={inference.ready ? 'action in' : 'action'}
                  style={{ transitionDelay: inference.ready ? `${i * 80}ms` : '0ms' }}
                >
                  <span className="action-channel">
                    {channelLabel[action.channel]} · {toneLabel[action.tone]}
                  </span>
                  <h4>{action.title}</h4>
                  <p>{action.detail}</p>
                </article>
              ))}
            </div>
            {inference.ready && (
              <div className="next-row">
                <button type="button" className="btn btn-primary" onClick={() => setView('app')}>
                  Bekijk klant-app
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'app' && (
        <div className="split">
          <div className="panel">
            <p className="eyebrow">Adaptatie</p>
            <h3>Wat de klant ziet</h3>
            <p className="muted">
              Zelfde persoon, andere home — gestuurd door het herkende moment.
            </p>
            <div className="scenario-picker tight">
              <button
                type="button"
                className={!showAfter ? 'scenario-tab active' : 'scenario-tab'}
                onClick={() => setShowAfter(false)}
              >
                Voor (standaard)
              </button>
              <button
                type="button"
                className={showAfter ? 'scenario-tab active' : 'scenario-tab'}
                onClick={() => setShowAfter(true)}
                disabled={!inference.ready || !consent}
              >
                Na (moment)
              </button>
            </div>
            <p className="tagline">
              {showAfter && inference.ready && consent
                ? 'Personalisatie actief: checklist, juiste CTA, upsell gedempt waar nodig.'
                : 'Generieke campagnes — product-first, moment-blind.'}
            </p>
          </div>
          <PhoneMockup
            customer={scenario.customer}
            personalized={Boolean(showAfter && inference.ready && consent)}
            screen={
              showAfter && inference.ready && consent
                ? scenario.appAfter
                : scenario.appBefore
            }
          />
        </div>
      )}

      {view === 'advisor' && (
        <div className="split">
          <div className="panel">
            <p className="eyebrow">Mens + machine</p>
            <h3>Adviseursconsole</h3>
            <p className="muted">
              30-seconden briefing vóór het gesprek. Override blijft mogelijk.
            </p>
            <label className="toggle">
              <input
                type="checkbox"
                checked={advisorOverride}
                onChange={(e) => setAdvisorOverride(e.target.checked)}
              />
              <span>Adviseur-override: demp automatische acties</span>
            </label>
            <div className={`briefing ${inference.ready && consent ? 'in' : ''}`}>
              <p>{scenario.advisorScript}</p>
            </div>
            <SpeakButton
              text={scenario.advisorScript}
              enabled={inference.ready && consent && !advisorOverride}
            />
            {advisorOverride && (
              <p className="consent-warn">
                Override aan: automatische orkestratie pauzeert voor deze klant.
              </p>
            )}
          </div>
          <div className="panel">
            <p className="eyebrow">Gespreksklare feiten</p>
            <ul className="fact-list">
              <li>
                <strong>Situatie</strong>
                <span>{scenario.situation}</span>
              </li>
              <li>
                <strong>Intent</strong>
                <span>{scenario.intent}</span>
              </li>
              <li>
                <strong>Gedrag</strong>
                <span>{scenario.behavior}</span>
              </li>
              <li>
                <strong>Confidence</strong>
                <span>{Math.round(scenario.confidence * 100)}%</span>
              </li>
              <li>
                <strong>Niet doen</strong>
                <span>
                  {scenario.actions
                    .filter((a) => a.tone === 'pause')
                    .map((a) => a.title)
                    .join(' · ') || '—'}
                </span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {view === 'channels' && (
        <div className="panel">
          <p className="eyebrow">Cross-channel</p>
          <h3>Eén moment-profiel, vier uitvoeringen</h3>
          <div className="action-list">
            {scenario.actions.map((action, i) => (
              <article
                key={action.channel}
                className={
                  inference.ready && consent && !advisorOverride ? 'action in' : 'action'
                }
                style={{
                  transitionDelay:
                    inference.ready && consent ? `${i * 80}ms` : '0ms',
                }}
              >
                <span className="action-channel">
                  {channelLabel[action.channel]} · {toneLabel[action.tone]}
                </span>
                <h4>{action.title}</h4>
                <p>{action.detail}</p>
              </article>
            ))}
          </div>
          <p className={`impact ${inference.ready ? 'in' : ''}`}>{scenario.impact}</p>
        </div>
      )}

      {view === 'privacy' && (
        <div className="split">
          <div className="panel">
            <p className="eyebrow">Privacy-first</p>
            <h3>Wat mag de engine gebruiken?</h3>
            <p className="tagline">{scenario.privacy.purpose}</p>
            <p className="muted">Retentie: {scenario.privacy.retention}</p>
          </div>
          <div className="panel">
            <div className="privacy-cols">
              <div>
                <h4>Gebruikt</h4>
                <ul>
                  {scenario.privacy.used.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Niet gebruikt</h4>
                <ul>
                  {scenario.privacy.notUsed.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'scale' && (
        <div className="panel">
          <p className="eyebrow">2,3 miljoen klanten</p>
          <h3>Zelfde engine, parallelle momenten</h3>
          <p className="muted">
            Gesimuleerde dagmetrics — event-driven orkestratie i.p.v. batch-campagnes.
          </p>
          <div className="scale-grid">
            <div className="scale-card">
              <strong>{scale.momentsToday.toLocaleString('nl-BE')}</strong>
              <span>Life moments vandaag</span>
            </div>
            <div className="scale-card">
              <strong>{scale.channelsOrchestrated.toLocaleString('nl-BE')}</strong>
              <span>Kanaalacties orkestreren</span>
            </div>
            <div className="scale-card">
              <strong>{scale.mutedCampaigns.toLocaleString('nl-BE')}</strong>
              <span>Campagnes gedempt</span>
            </div>
            <div className="scale-card">
              <strong>{scale.advisorBriefings.toLocaleString('nl-BE')}</strong>
              <span>Adviseursbriefings</span>
            </div>
          </div>
          <ol className="pillars compact">
            <li>
              <strong>Signalen</strong>
              <span>Streams van betalingen, app, productstatus.</span>
            </li>
            <li>
              <strong>Herkenning</strong>
              <span>Situatie + gedrag + intent + confidence.</span>
            </li>
            <li>
              <strong>Adaptatie</strong>
              <span>App-UI en toon schakelen per moment.</span>
            </li>
            <li>
              <strong>Kanalen</strong>
              <span>Eén profiel → app, advies, verzekering, beleggen.</span>
            </li>
            <li>
              <strong>Schaal</strong>
              <span>Override + privacy houden mensen in de loop.</span>
            </li>
          </ol>
        </div>
      )}
    </section>
  )
}
