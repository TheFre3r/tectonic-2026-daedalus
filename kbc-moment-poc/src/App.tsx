import { useEffect, useState } from 'react'
import {
  channelLabel,
  scenarios,
  type Scenario,
  type Signal,
} from './data/scenarios'
import './App.css'

function useSignalStream(scenario: Scenario, epoch: number) {
  const [visible, setVisible] = useState<Signal[]>([])

  useEffect(() => {
    setVisible([])
    const timers = scenario.signals.map((signal) =>
      window.setTimeout(() => {
        setVisible((prev) =>
          prev.some((s) => s.id === signal.id) ? prev : [...prev, signal],
        )
      }, signal.delayMs),
    )
    return () => timers.forEach(clearTimeout)
  }, [scenario, epoch])

  return visible
}

export default function App() {
  const [scenarioId, setScenarioId] = useState(scenarios[0].id)
  const [epoch, setEpoch] = useState(0)

  const scenario = scenarios.find((s) => s.id === scenarioId) ?? scenarios[0]
  const signals = useSignalStream(scenario, epoch)
  const ready = signals.length >= scenario.signals.length

  function selectScenario(id: string) {
    setScenarioId(id)
    setEpoch((e) => e + 1)
  }

  function replay() {
    setEpoch((e) => e + 1)
  }

  return (
    <div className="page">
      <header className="nav">
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          <span className="brand-name">KBC Moment</span>
        </div>
        <span className="nav-meta">Tectonic · Team Daedalus · PoC</span>
      </header>

      <section className="hero">
        <p className="hero-brand">KBC Moment</p>
        <h1 className="hero-title">
          Begrijp het moment.
          <br />
          Niet alleen het product.
        </h1>
        <p className="hero-lead">
          Een schaalbare personalisatielaag die life moments herkent uit
          signalen — en KBC op het juiste moment laat steunen, over alle
          kanalen heen.
        </p>
        <div className="hero-cta">
          <a className="btn btn-primary" href="#demo">
            Bekijk de PoC
          </a>
          <a className="btn btn-ghost" href="#visie">
            Visie
          </a>
        </div>
        <div className="hero-atmosphere" aria-hidden />
      </section>

      <section className="demo" id="demo">
        <div className="section-head">
          <h2>Live scenario</h2>
          <p>
            Kies een life moment. Signalen stromen binnen, intent wordt
            herkend, ervaring past zich aan — over app, advies, verzekering en
            beleggen.
          </p>
        </div>

        <div className="scenario-picker" role="tablist" aria-label="Scenario">
          {scenarios.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={s.id === scenarioId}
              className={
                s.id === scenarioId ? 'scenario-tab active' : 'scenario-tab'
              }
              onClick={() => selectScenario(s.id)}
            >
              {s.title}
            </button>
          ))}
          <button type="button" className="replay" onClick={replay}>
            Opnieuw afspelen
          </button>
        </div>

        <div className="demo-grid">
          <aside className="panel customer">
            <p className="eyebrow">Klant</p>
            <h3>{scenario.customer}</h3>
            <p className="muted">
              {scenario.age} · {scenario.city}
            </p>
            <p className="tagline">{scenario.tagline}</p>

            <div className="inference">
              <div className="inference-row">
                <span>Situatie</span>
                <strong className={ready ? 'in' : ''}>
                  {ready ? scenario.situation : 'Signalen verzamelen…'}
                </strong>
              </div>
              <div className="inference-row">
                <span>Intent</span>
                <strong className={ready ? 'in' : ''}>
                  {ready ? scenario.intent : '—'}
                </strong>
              </div>
              <div className="inference-row">
                <span>Confidence</span>
                <strong className={ready ? 'in' : ''}>
                  {ready
                    ? `${Math.round(scenario.confidence * 100)}%`
                    : `${Math.min(99, Math.round((signals.length / scenario.signals.length) * 100))}%`}
                </strong>
              </div>
              <div
                className="confidence-bar"
                role="progressbar"
                aria-valuenow={Math.round(
                  (signals.length / scenario.signals.length) *
                    scenario.confidence *
                    100,
                )}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span
                  style={{
                    width: `${(signals.length / scenario.signals.length) * scenario.confidence * 100}%`,
                  }}
                />
              </div>
            </div>
          </aside>

          <div className="panel signals">
            <p className="eyebrow">Signalen</p>
            <h3>Wat KBC ziet (privacy-first)</h3>
            <ul className="signal-list">
              {scenario.signals.map((signal) => {
                const shown = signals.some((s) => s.id === signal.id)
                return (
                  <li
                    key={signal.id}
                    className={shown ? 'signal shown' : 'signal'}
                  >
                    <span className="signal-source">{signal.source}</span>
                    <span className="signal-label">
                      {shown ? signal.label : '…'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="panel actions">
            <p className="eyebrow">Aangepaste ervaring</p>
            <h3>Eén moment → alle kanalen</h3>
            <div className="action-list">
              {scenario.actions.map((action, i) => (
                <article
                  key={action.channel}
                  className={
                    ready ? 'action in' : 'action'
                  }
                  style={{ transitionDelay: ready ? `${i * 90}ms` : '0ms' }}
                >
                  <span className="action-channel">
                    {channelLabel[action.channel]}
                  </span>
                  <h4>{action.title}</h4>
                  <p>{action.detail}</p>
                </article>
              ))}
            </div>
            <p className={`impact ${ready ? 'in' : ''}`}>{scenario.impact}</p>
          </div>
        </div>
      </section>

      <section className="vision" id="visie">
        <div className="section-head">
          <h2>Visie voor 2,3 miljoen klanten</h2>
          <p>
            Geen nieuwe feature. Een manier van werken: momenten herkennen,
            intent afleiden, ervaring orkestreren.
          </p>
        </div>

        <ol className="pillars">
          <li>
            <strong>Signalen</strong>
            <span>
              Transacties, app-gedrag, productstatus en context — geaggregeerd,
              geminimaliseerd, uitlegbaar.
            </span>
          </li>
          <li>
            <strong>Herkenning</strong>
            <span>
              Situatie + gedrag + intent → confidence score. Geen black box
              zonder adviesbriefing.
            </span>
          </li>
          <li>
            <strong>Adaptatie</strong>
            <span>
              UI, timing en toon passen zich aan. Soms pushen, soms dempen.
            </span>
          </li>
          <li>
            <strong>Kanalen</strong>
            <span>
              App, kantoor, verzekering, beleggen delen één moment-profiel —
              niet vier silo’s.
            </span>
          </li>
          <li>
            <strong>Schaal</strong>
            <span>
              Event-driven engine: miljoenen momenten parallel, met
              menselijke override waar nodig.
            </span>
          </li>
        </ol>
      </section>

      <footer className="footer">
        <p>
          Voorbeeld-PoC voor de KBC-challenge · Tectonic Hackathon · Team
          Daedalus
        </p>
        <p className="muted">
          Geen echte klantdata. Demo-scenario’s ter illustratie van de
          aanpak.
        </p>
      </footer>
    </div>
  )
}
