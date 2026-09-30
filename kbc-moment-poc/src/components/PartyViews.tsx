import { useState } from 'react'
import type { useCustomerSession } from '../hooks/useCustomerSession'
import { channelLabel, toneLabel } from '../data/scenarios'

type Session = ReturnType<typeof useCustomerSession>
type Party = 'adviseur' | 'verzekering' | 'beleggen' | 'ops'

const parties: { id: Party; label: string }[] = [
  { id: 'adviseur', label: 'Adviseur' },
  { id: 'verzekering', label: 'Verzekering' },
  { id: 'beleggen', label: 'Beleggen' },
  { id: 'ops', label: 'Support ops' },
]

export function PartyViews({ session }: { session: Session }) {
  const [party, setParty] = useState<Party>('adviseur')
  const ready = session.momentActive
  const action = session.scenario.actions.find((a) => a.channel === party)

  return (
    <aside className="party-views">
      <p className="eyebrow">Andere partijen</p>
      <h3>Zelfde moment, ander scherm</h3>
      <p className="muted">
        Geïntegreerd met jouw klant-sessie — geen aparte demo.
      </p>

      <div className="party-tabs" role="tablist" aria-label="Partij">
        {parties.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={party === p.id}
            className={party === p.id ? 'active' : ''}
            onClick={() => setParty(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {!ready && (
        <div className="party-card muted-card">
          <p>
            Nog geen moment. Zodra confidence hoog genoeg is, vullen deze
            views zich automatisch — alsof alle silo’s hetzelfde profiel delen.
          </p>
        </div>
      )}

      {ready && party === 'adviseur' && (
        <div className="party-card">
          <span className="party-tag">Kantoor / chat</span>
          <h4>Briefing klaar in 30s</h4>
          <p>{session.scenario.advisorScript}</p>
          <ul className="plain-list">
            <li>Confidence {Math.round(session.scenario.confidence * 100)}%</li>
            <li>Override mogelijk (mens blijft baas)</li>
            <li>
              Niet doen:{' '}
              {session.scenario.actions
                .filter((a) => a.tone === 'pause')
                .map((a) => a.title)
                .join(' · ') || '—'}
            </li>
          </ul>
        </div>
      )}

      {ready && party === 'verzekering' && action && (
        <div className="party-card">
          <span className="party-tag">
            {channelLabel.verzekering} · {toneLabel[action.tone]}
          </span>
          <h4>{action.title}</h4>
          <p>{action.detail}</p>
          <p className="hint">
            Timing volgt: voorstel pas wanneer notaristraject/context klopt —
            niet weken te vroeg.
          </p>
        </div>
      )}

      {ready && party === 'beleggen' && (
        <div className="party-card">
          <span className="party-tag">Beleggen & sparen</span>
          <h4>
            {session.scenario.actions.find((a) => a.channel === 'beleggen')?.title}
          </h4>
          <p>
            {session.scenario.actions.find((a) => a.channel === 'beleggen')?.detail}
          </p>
          <p className="hint">
            Personaliseren = soms dempen. Minder campagnes, meer vertrouwen.
          </p>
        </div>
      )}

      {ready && party === 'ops' && (
        <div className="party-card">
          <span className="party-tag">Support orchestration</span>
          <h4>Resource-routing voor deze klant</h4>
          <ol className="plain-list">
            <li>1. Self-serve boom / checklist (goedkoop, schaalbaar)</li>
            <li>2. Mia alleen bij escalatie of fraude-signalen</li>
            <li>3. Menselijke adviseur met briefing — niet cold start</li>
            <li>
              4. Capacity free door dempen van irrelevante outbound campagnes
            </li>
          </ol>
          <p className="hint">
            Zo voelt support “unlimited”, terwijl dure expertise spaarzaam
            wordt ingezet.
          </p>
        </div>
      )}
    </aside>
  )
}
