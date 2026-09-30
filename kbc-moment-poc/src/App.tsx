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
        <span className="nav-meta">Klikbaar prototype · Team Daedalus</span>
      </header>

      <section className="hero">
        <p className="hero-kicker">Wat is dit?</p>
        <p className="hero-brand">KBC Moment</p>
        <h1 className="hero-title">
          Een demo van hoe een bank
          <br />
          je leven kan begrijpen — zonder te gokken.
        </h1>
        <p className="hero-lead">
          Dit is <strong>geen echte bank-app</strong> om te betalen of in te
          loggen. Het is een <strong>klikbaar prototype</strong>: je speelt na
          hoe KBC zou merken dat er iets speelt (verhuizen, eerste job, zorg)
          en dan de app + adviseur daarop aanpast.
        </p>
        <div className="hero-cta">
          <a className="btn btn-primary" href="#hoe-werkt-het">
            Hoe werkt het?
          </a>
          <a className="btn btn-ghost" href="#demo">
            Direct de demo
          </a>
        </div>
        <div className="hero-atmosphere" aria-hidden />
      </section>

      <section className="explain" id="hoe-werkt-het">
        <div className="section-head">
          <h2>Hoe werkt het? (simpel)</h2>
          <p>
            Denk niet aan “een nieuwe knop”. Denk aan een slimme laag achter de
            bank die 4 stappen doet.
          </p>
        </div>

        <ol className="flow-steps">
          <li>
            <strong>1. Er gebeurt iets in je leven</strong>
            <span>
              Je betaalt een notaris, krijgt je eerste loon, of zoekt “uitstel
              afbetaling” in de app.
            </span>
          </li>
          <li>
            <strong>2. Dat wordt een signaal</strong>
            <span>
              De bank ziet geen bordje “IK VERHUIS”. Wel betalingen, app-gedrag
              en productstatus die ze al (met toestemming) mag zien.
            </span>
          </li>
          <li>
            <strong>3. Signalen samen = een “moment”</strong>
            <span>
              Eén signaal is zwak. Meerdere samen maken een inschatting: “dit
              lijkt op eerste woning” — met een % zekerheid, geen absolute
              waarheid.
            </span>
          </li>
          <li>
            <strong>4. Alles past zich aan</strong>
            <span>
              De app toont een checklist i.p.v. reclame. De adviseur krijgt een
              korte briefing. Verzekering helpt. Beleggen wordt soms juist
              gedempt.
            </span>
          </li>
        </ol>
      </section>

      <section className="explain know" id="hoe-weet-kbc">
        <div className="section-head">
          <h2>Hoe zou KBC weten of je verhuist of een eerste job start?</h2>
          <p>
            Kort antwoord: ze “weten” het niet zeker. Ze <em>schatten</em> het
            in uit patronen — zoals hieronder.
          </p>
        </div>

        <div className="know-grid">
          <article className="panel">
            <p className="eyebrow">Voorbeeld · Verhuizen</p>
            <h3>Signalen die samen “eerste woning” suggereren</h3>
            <ul className="plain-list">
              <li>Betaling aan notaris of makelaar</li>
              <li>Zoeken op “woonlening” in de app</li>
              <li>Groot bedrag van spaargeld weg (voorschot)</li>
              <li>Adreswijziging aangevraagd</li>
              <li>Nog geen brandverzekering</li>
            </ul>
            <p className="callout">
              Eén daarvan = misschien. Vijf samen = waarschijnlijk. Daarom zie
              je later een <strong>confidence %</strong>.
            </p>
          </article>

          <article className="panel">
            <p className="eyebrow">Voorbeeld · Eerste job</p>
            <h3>Signalen die samen “starter” suggereren</h3>
            <ul className="plain-list">
              <li>Eerste terugkerende loonstorting</li>
              <li>Vaak het budget-scherm openen</li>
              <li>Studentenkrediet dat bijna afloopt</li>
              <li>Nog geen spaardoel</li>
              <li>Jong starter-profiel</li>
            </ul>
            <p className="callout">
              Bij twijfel: zachte hulp (“Wil je een checklist?”), geen harde
              aanname. Een adviseur kan het altijd corrigeren.
            </p>
          </article>
        </div>
      </section>

      <section className="explain what-not">
        <div className="what-not-box">
          <div>
            <h3>Dit is wél</h3>
            <ul className="plain-list">
              <li>Een klikbaar prototype / demo</li>
              <li>Uitleg van het concept met echte interactie</li>
              <li>Fictieve personages (Lien, Amir, Sofie)</li>
            </ul>
          </div>
          <div>
            <h3>Dit is níet</h3>
            <ul className="plain-list">
              <li>Een echte KBC-login of betaal-app</li>
              <li>Echte klantdata</li>
              <li>Een af product klaar voor productie</li>
            </ul>
          </div>
        </div>
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
          <h2>Waarom dit telt</h2>
          <p>
            Banken pushen vaak producten. Mensen leven in momenten. Dit
            prototype toont hoe je van “campagne” naar “begrijpen & begeleiden”
            gaat — voor miljoenen klanten, mét privacy.
          </p>
        </div>
        <ol className="pillars">
          <li>
            <strong>Signalen</strong>
            <span>Dingen die de bank al mag zien, gebundeld tot een verhaal.</span>
          </li>
          <li>
            <strong>Inschatting</strong>
            <span>Situatie + gedrag + intent, met een % zekerheid.</span>
          </li>
          <li>
            <strong>Andere app-ervaring</strong>
            <span>Zelfde persoon: eerst reclame, daarna checklist op maat.</span>
          </li>
          <li>
            <strong>Ook de adviseur</strong>
            <span>Korte briefing: wat wél en wat níet zeggen vandaag.</span>
          </li>
          <li>
            <strong>Soms minder pushen</strong>
            <span>Personaliseren = soms beleggingsreclame dempen.</span>
          </li>
        </ol>
      </section>

      <footer className="footer">
        <p>KBC Moment · klikbaar prototype · Tectonic Hackathon · Team Daedalus</p>
        <p className="muted">
          Geen echte klantdata. Spraakbriefing via je browser. Scroll omhoog naar
          “Hoe werkt het?” als je de uitleg opnieuw wilt.
        </p>
      </footer>
    </div>
  )
}
