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
  { id: 'overview', label: '1. Wat de bank ziet' },
  { id: 'app', label: '2. Wat jij ziet' },
  { id: 'advisor', label: '3. Adviseur' },
  { id: 'channels', label: '4. Alle kanalen' },
  { id: 'privacy', label: '5. Privacy' },
  { id: 'scale', label: '6. Voor miljoenen' },
]

const viewGuide: Record<DemoView, string> = {
  overview:
    'Kijk hoe signalen binnenkomen. Rechts zie je losse feiten. Links bouwt de bank een inschatting op (situatie → intent → % zekerheid). Dit is geen zekerheid — wel een slimme gok.',
  app:
    'Zelfde klant, twee homescreens. “Voor” = klassieke reclame. “Na” = de bank snapt het moment (checklist, minder push). Schakel heen en weer.',
  advisor:
    'Alsof je de bankier bent: je krijgt een 30-seconden briefing. Speel hem af. Met override blijf jij baas over automatische acties.',
  channels:
    'Eén conclusie stuurt app, advies, verzekering én beleggen tegelijk — soms helpt dempen meer dan verkopen.',
  privacy:
    'Personalisatie alleen mét toestemming. Hier zie je wat wél en niet gebruikt mag worden.',
  scale:
    'Zelfde logica voor miljoenen klanten tegelijk (gesimuleerde cijfers). Geen handwerk per persoon.',
}

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
    idle: 'Nog geen signalen',
    listening: 'Signalen verzamelen…',
    recognizing: 'Inschatting maken…',
    orchestrating: 'Hulp klaarzetten…',
    ready: 'Moment herkend',
  }

  return (
    <section className="demo" id="demo">
      <div className="section-head">
        <h2>Probeer het zelf</h2>
        <p>
          Kies een levensverhaal hieronder. Speel het af als een korte film:
          eerst ziet de bank signalen, dan verandert de app.
        </p>
      </div>

      <div className="guide-box">
        <strong>Zo speel je de demo</strong>
        <ol>
          <li>Kies een scenario (start met <em>Verhuizen</em>).</li>
          <li>Wacht tot de signalen rechts groen/zichtbaar worden.</li>
          <li>Open tab <em>2. Wat jij ziet</em> → klik <em>Voor</em> en dan <em>Na</em>.</li>
          <li>Optioneel: tab Adviseur → speel de briefing.</li>
        </ol>
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

      <p className="scenario-blurb">
        Nu speel je: <strong>{scenario.customer}</strong> — {scenario.tagline}
      </p>

      <div className="consent-bar">
        <label className="toggle">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>Klant geeft toestemming voor personalisatie</span>
        </label>
        {!consent && (
          <span className="consent-warn">
            Toestemming uit = bank mag geen moment inschatten → standaard app.
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

      <p className="view-guide">{viewGuide[view]}</p>

      {view === 'overview' && (
        <div className="demo-grid">
          <aside className="panel">
            <p className="eyebrow">Inschatting van de bank</p>
            <h3>{scenario.customer}</h3>
            <p className="muted">
              {scenario.age} jaar · {scenario.city}
            </p>
            <p className="tagline">{scenario.tagline}</p>

            <div className="phase-chip">{phaseLabel[inference.phase]}</div>

            <div className="inference">
              <div className="inference-row">
                <span>Wat speelt er? (situatie)</span>
                <strong className={inference.situation ? 'in' : ''}>
                  {inference.situation ?? 'Nog te weinig signalen…'}
                </strong>
              </div>
              <div className="inference-row">
                <span>Hoe gedraagt de klant zich?</span>
                <strong className={inference.behavior ? 'in' : ''}>
                  {inference.behavior ?? '—'}
                </strong>
              </div>
              <div className="inference-row">
                <span>Wat heeft die nodig? (intent)</span>
                <strong className={inference.intent ? 'in' : ''}>
                  {inference.intent ?? '—'}
                </strong>
              </div>
              <div className="inference-row">
                <span>Hoe zeker is de bank?</span>
                <strong className="in">
                  {Math.round(inference.confidence * 100)}% confidence
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
              <p className="hint">
                +XX rechts bij elk signaal = hoeveel dat bijdraagt aan de
                zekerheid. Geen magie: optelsom van aanwijzingen.
              </p>
            </div>
          </aside>

          <div className="panel">
            <p className="eyebrow">Losse aanwijzingen</p>
            <h3>Signalen die binnenkomen</h3>
            <p className="muted small">
              Dit zijn dingen die een bank kán zien (met toestemming) — geen
              afluisteren van je privéleven.
            </p>
            <ul className="signal-list">
              {scenario.signals.map((signal) => {
                const shown = inference.signalsSeen.some((s) => s.id === signal.id)
                return (
                  <li key={signal.id} className={shown ? 'signal shown' : 'signal'}>
                    <span className="signal-source">{signal.source}</span>
                    <span className="signal-label">
                      {shown ? signal.label : 'wacht…'}
                    </span>
                    <span className="signal-weight">
                      +{Math.round(signal.weight * 100)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="panel span-2">
            <p className="eyebrow">Gevolg</p>
            <h3>Als het moment “rond” is, past alles mee</h3>
            <p className="muted">
              {inference.ready
                ? scenario.impact
                : 'Nog even wachten tot genoeg signalen binnen zijn…'}
            </p>
            <div className="action-list compact">
              {scenario.actions.map((action, i) => (
                <article
                  key={action.channel}
                  className={inference.ready ? 'action in' : 'action'}
                  style={{
                    transitionDelay: inference.ready ? `${i * 80}ms` : '0ms',
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
            {inference.ready && (
              <div className="next-row">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setView('app')}
                >
                  Volgende: bekijk wat jij in de app ziet →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'app' && (
        <div className="split">
          <div className="panel">
            <p className="eyebrow">Het verschil dat je voelt</p>
            <h3>Zelfde persoon, andere home</h3>
            <p className="muted">
              Links leggen we uit wat je ziet. Rechts is een nagemaakte
              telefoon — geen echte KBC-app.
            </p>
            <div className="scenario-picker tight">
              <button
                type="button"
                className={!showAfter ? 'scenario-tab active' : 'scenario-tab'}
                onClick={() => setShowAfter(false)}
              >
                Voor (blind)
              </button>
              <button
                type="button"
                className={showAfter ? 'scenario-tab active' : 'scenario-tab'}
                onClick={() => setShowAfter(true)}
                disabled={!inference.ready || !consent}
              >
                Na (snapt het moment)
              </button>
            </div>
            <p className="tagline">
              {showAfter && inference.ready && consent
                ? 'Nu: hulp die past bij het moment. Reclame die niet past, is gedempt.'
                : 'Nu: generieke campagnes. De bank snapt het moment (nog) niet.'}
            </p>
            {!inference.ready && (
              <p className="hint">
                Tip: ga eerst naar tab 1 tot de signalen klaar zijn, of klik
                “Opnieuw afspelen”.
              </p>
            )}
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
            <p className="eyebrow">Mens blijft nodig</p>
            <h3>Wat de adviseur te horen krijgt</h3>
            <p className="muted">
              Digitaal én kantoor: dezelfde inschatting, zodat niemand naast de
              kwestie begint.
            </p>
            <label className="toggle">
              <input
                type="checkbox"
                checked={advisorOverride}
                onChange={(e) => setAdvisorOverride(e.target.checked)}
              />
              <span>Ik ben adviseur: zet automatische acties stil</span>
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
                Override aan: de machine volgt, jij beslist.
              </p>
            )}
          </div>
          <div className="panel">
            <p className="eyebrow">Op één scherm</p>
            <ul className="fact-list">
              <li>
                <strong>Situatie</strong>
                <span>{scenario.situation}</span>
              </li>
              <li>
                <strong>Nodig</strong>
                <span>{scenario.intent}</span>
              </li>
              <li>
                <strong>Gedrag</strong>
                <span>{scenario.behavior}</span>
              </li>
              <li>
                <strong>Zekerheid</strong>
                <span>{Math.round(scenario.confidence * 100)}%</span>
              </li>
              <li>
                <strong>Liever níet vandaag</strong>
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
          <p className="eyebrow">Niet vier losse campagnes</p>
          <h3>Eén moment → vier plekken</h3>
          <p className="muted">
            App, adviseur, verzekering en beleggen delen dezelfde conclusie.
          </p>
          <div className="action-list">
            {scenario.actions.map((action, i) => (
              <article
                key={action.channel}
                className={
                  inference.ready && consent && !advisorOverride
                    ? 'action in'
                    : 'action'
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
            <p className="eyebrow">Zonder vertrouwen werkt dit niet</p>
            <h3>Wat mag gebruikt worden?</h3>
            <p className="tagline">{scenario.privacy.purpose}</p>
            <p className="muted">Hoe lang bewaard: {scenario.privacy.retention}</p>
            <p className="hint">
              Zet bovenaan de toestemming uit: dan stopt de inschatting meteen.
              Dat is privacy-by-design, niet een bijzaak.
            </p>
          </div>
          <div className="panel">
            <div className="privacy-cols">
              <div>
                <h4>Wel gebruikt</h4>
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
          <p className="eyebrow">Waarom geen handwerk?</p>
          <h3>Zelfde logica voor miljoenen klanten</h3>
          <p className="muted">
            Cijfers hieronder zijn een simulatie — om te tonen dat dit geen
            “één adviseur per klant”-verhaal is, maar een herhaalbaar systeem.
          </p>
          <div className="scale-grid">
            <div className="scale-card">
              <strong>{scale.momentsToday.toLocaleString('nl-BE')}</strong>
              <span>Herkennde momenten vandaag</span>
            </div>
            <div className="scale-card">
              <strong>{scale.channelsOrchestrated.toLocaleString('nl-BE')}</strong>
              <span>Acties over kanalen</span>
            </div>
            <div className="scale-card">
              <strong>{scale.mutedCampaigns.toLocaleString('nl-BE')}</strong>
              <span>× reclame gedempt</span>
            </div>
            <div className="scale-card">
              <strong>{scale.advisorBriefings.toLocaleString('nl-BE')}</strong>
              <span>Briefings voor adviseurs</span>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
