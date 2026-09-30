import { PrototypeDemo } from './components/PrototypeDemo'
import { useMomentDemo } from './hooks/useMomentDemo'
import './App.css'

export default function App() {
  const demo = useMomentDemo()

  return (
    <div className="page">
      <header className="nav">
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          <span className="brand-name">KBC Moment</span>
        </div>
        <span className="nav-meta">Tectonic · Team Daedalus · Prototype</span>
      </header>

      <section className="hero">
        <p className="hero-brand">KBC Moment</p>
        <h1 className="hero-title">
          Begrijp het moment.
          <br />
          Niet alleen het product.
        </h1>
        <p className="hero-lead">
          Werkend prototype: signalen binnenhalen, intent herkennen,
          klant-app aanpassen, adviseur briefen, kanalen orkestreren — privacy-first
          en schaalbaar naar miljoenen klanten.
        </p>
        <div className="hero-cta">
          <a className="btn btn-primary" href="#demo">
            Start prototype-demo
          </a>
          <a className="btn btn-ghost" href="#visie">
            Visie
          </a>
        </div>
        <div className="hero-atmosphere" aria-hidden />
      </section>

      <PrototypeDemo
        allScenarios={demo.scenarios}
        scenario={demo.scenario}
        inference={demo.inference}
        scale={demo.scale}
        view={demo.view}
        setView={demo.setView}
        showAfter={demo.showAfter}
        setShowAfter={demo.setShowAfter}
        consent={demo.consent}
        setConsent={demo.setConsent}
        advisorOverride={demo.advisorOverride}
        setAdvisorOverride={demo.setAdvisorOverride}
        onSelectScenario={demo.selectScenario}
        onReplay={demo.replay}
      />

      <section className="vision" id="visie">
        <div className="section-head">
          <h2>Wat dit prototype bewijst</h2>
          <p>
            Geen losse feature — een herbruikbare manier om klanten te begrijpen
            en te begeleiden op schaal.
          </p>
        </div>
        <ol className="pillars">
          <li>
            <strong>Signalen</strong>
            <span>Event pipeline met gewichten die confidence opbouwen.</span>
          </li>
          <li>
            <strong>Herkenning</strong>
            <span>Situatie, gedrag en intent verschijnen progressief.</span>
          </li>
          <li>
            <strong>Adaptatie</strong>
            <span>Voor/na klant-app: zelfde persoon, andere ervaring.</span>
          </li>
          <li>
            <strong>Kanalen</strong>
            <span>App, adviseur, verzekering en beleggen delen één moment.</span>
          </li>
          <li>
            <strong>Schaal + privacy</strong>
            <span>Consent, retentie, override en dagmetrics voor 2,3M klanten.</span>
          </li>
        </ol>
      </section>

      <footer className="footer">
        <p>KBC Moment prototype · Tectonic Hackathon · Team Daedalus</p>
        <p className="muted">
          Fictieve scenario’s. Geen echte klantdata. Voice via browser Speech API.
        </p>
      </footer>
    </div>
  )
}
