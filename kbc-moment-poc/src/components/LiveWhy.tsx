import type { useCustomerSession } from '../hooks/useCustomerSession'
import type { AppTab } from '../hooks/useCustomerSession'

type Session = ReturnType<typeof useCustomerSession>

const whyByTab: Record<AppTab, { title: string; body: string }> = {
  home: {
    title: 'Waarom een slimme home?',
    body: 'De home is het moment waarop KBC “aanwezig” is zonder te storen. Zonder moment: generieke campagnes. Met moment: checklist en demping van irrelevante push.',
  },
  betalen: {
    title: 'Waarom betalingen als signaal?',
    body: 'Een notariskost of zorgfactuur is sterker dan een marketingklik. Signalen uit betalingen maken life moments herkenbaar — mét consent.',
  },
  zoeken: {
    title: 'Waarom zoekgedrag telt?',
    body: '“Woonlening” of “uitstel” toont intent. Samen met andere signalen stijgt de confidence — één zoekactie alleen is nooit genoeg.',
  },
  hulp: {
    title: 'Waarom beslisboom vóór Mia?',
    body: 'Eerst goedkope, deterministische stappen. Pas bij vastlopen of fraude: AI. Zo lijkt support “unlimited” terwijl dure resources spaarzaam zijn.',
  },
  berichten: {
    title: 'Waarom een adviseursnote?',
    body: 'Mens + machine: de adviseur krijgt context in 30 seconden, zodat het gesprek start waar de klant is — niet bij nul.',
  },
  ik: {
    title: 'Waarom consent hier?',
    body: 'Personalisatie is een privilege, geen default. Zonder toestemming stopt inferentie — privacy-by-design, niet als bijzaak.',
  },
}

export function LiveWhy({ session }: { session: Session }) {
  const tabWhy = whyByTab[session.tab]
  const signals = session.inference.signalsSeen.length
  const total = session.scenario.signals.length
  const ready = session.momentActive

  return (
    <aside className="live-why" aria-live="polite">
      <p className="eyebrow">Live uitleg</p>
      <h3>{tabWhy.title}</h3>
      <p>{tabWhy.body}</p>

      <div className="live-why-meter">
        <span>
          Signalen {signals}/{total}
        </span>
        <div className="confidence-bar" aria-hidden>
          <span style={{ width: `${(signals / Math.max(total, 1)) * 100}%` }} />
        </div>
        <strong>
          {ready
            ? `Moment actief · ${Math.round(session.inference.confidence * 100)}%`
            : session.state.consent
              ? 'Nog verzamelen…'
              : 'Consent uit — geen inferentie'}
        </strong>
      </div>

      {ready ? (
        <ul className="plain-list">
          <li>
            <strong>Situatie:</strong> {session.scenario.situation}
          </li>
          <li>
            <strong>Intent:</strong> {session.scenario.intent}
          </li>
          <li>
            <strong>Impact:</strong> {session.scenario.impact}
          </li>
        </ul>
      ) : (
        <p className="hint">
          Doe acties in Betalen/Zoeken. Rechts zie je meteen wat andere partijen
          zouden zien zodra het moment rond is.
        </p>
      )}
    </aside>
  )
}
