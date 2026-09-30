import { useMemo, useState } from 'react'

type NodeId =
  | 'start'
  | 'faq'
  | 'tree'
  | 'mia'
  | 'human'
  | 'fraud'
  | 'done-self'
  | 'done-mia'
  | 'done-human'

type Node = {
  id: NodeId
  title: string
  detail: string
  cost: '€' | '€€' | '€€€'
  capacity: string
  options?: { label: string; next: NodeId }[]
}

const nodes: Record<NodeId, Node> = {
  start: {
    id: 'start',
    title: 'Klant stelt vraag',
    detail: 'Inbound via app, zoek, of moment-signaal.',
    cost: '€',
    capacity: '∞ digitaal',
    options: [
      { label: 'Standaard / FAQ-match', next: 'faq' },
      { label: 'Complex / multi-step', next: 'tree' },
      { label: 'Fraude / oplichting', next: 'fraud' },
    ],
  },
  faq: {
    id: 'faq',
    title: 'FAQ / vaste content',
    detail: 'Goedkoopste laag: artikels & snelle antwoorden.',
    cost: '€',
    capacity: 'Miljoenen parallel',
    options: [
      { label: 'Opgelost', next: 'done-self' },
      { label: 'Niet genoeg → beslisboom', next: 'tree' },
    ],
  },
  tree: {
    id: 'tree',
    title: 'Beslisboom (Snelhulp)',
    detail: 'Deterministisch pad. Geen tokens, wel structuur.',
    cost: '€',
    capacity: 'Zeer hoog',
    options: [
      { label: 'Opgelost zonder chat', next: 'done-self' },
      { label: 'Vastgelopen / 2× niet opgelost', next: 'mia' },
    ],
  },
  mia: {
    id: 'mia',
    title: 'Mia (Gemini) — lazy',
    detail: 'Alleen laden bij escalatie. Context uit de boom meegeven.',
    cost: '€€',
    capacity: 'Beperkt (quotum) → rate limits',
    options: [
      { label: 'Opgelost met Mia', next: 'done-mia' },
      { label: 'Nog nodig: mens', next: 'human' },
    ],
  },
  fraud: {
    id: 'fraud',
    title: 'Fraude-fast lane',
    detail: 'Hoge urgency → Mia + snelle doorverwijzing Card Stop / mens.',
    cost: '€€',
    capacity: 'Geprioriteerd',
    options: [
      { label: 'Gestabiliseerd digitaal', next: 'done-mia' },
      { label: 'Terugbel / specialist', next: 'human' },
    ],
  },
  human: {
    id: 'human',
    title: 'Adviseur / medewerker',
    detail: 'Duurste resource — krijgt briefing zodat geen herhaling.',
    cost: '€€€',
    capacity: 'Eindig → alleen last resort',
    options: [{ label: 'Gesprek afgerond', next: 'done-human' }],
  },
  'done-self': {
    id: 'done-self',
    title: 'Klaar · self-serve',
    detail: '0 mensminuten. Schaal = “unlimited” gevoel.',
    cost: '€',
    capacity: '∞',
  },
  'done-mia': {
    id: 'done-mia',
    title: 'Klaar · Mia',
    detail: 'AI-minuten i.p.v. callcenter. Mensen blijven vrij voor zware cases.',
    cost: '€€',
    capacity: 'Hoog',
  },
  'done-human': {
    id: 'done-human',
    title: 'Klaar · mens',
    detail: 'Ingezet waar het telt. Briefing spaart herhaaltijd.',
    cost: '€€€',
    capacity: 'Beschermd',
  },
}

export function ResourceFlowchart() {
  const [path, setPath] = useState<NodeId[]>(['start'])
  const current = nodes[path[path.length - 1]]
  const stats = useMemo(() => {
    const self = path.includes('done-self') ? 1 : 0
    const mia = path.includes('done-mia') ? 1 : 0
    const human = path.includes('done-human') ? 1 : 0
    return { self, mia, human }
  }, [path])

  function choose(next: NodeId) {
    setPath((p) => [...p, next])
  }

  function reset() {
    setPath(['start'])
  }

  function back() {
    setPath((p) => (p.length > 1 ? p.slice(0, -1) : p))
  }

  return (
    <section className="resource-flow" id="resources">
      <div className="section-head">
        <h2>Support die “unlimited” aanvoelt</h2>
        <p>
          Slimme verdeling: goedkope lagen eerst, dure expertise last. Klik door
          de decision tree — zo schaal je naar miljoenen klanten zonder
          miljoenen adviseurs.
        </p>
      </div>

      <div className="rf-layout">
        <div className="rf-trail" aria-label="Pad">
          {path.map((id, i) => (
            <span key={`${id}-${i}`} className="rf-crumb">
              {nodes[id].title}
              {i < path.length - 1 ? ' → ' : ''}
            </span>
          ))}
        </div>

        <article className="rf-node">
          <div className="rf-meta">
            <span className="rf-cost">Kost {current.cost}</span>
            <span className="rf-cap">{current.capacity}</span>
          </div>
          <h3>{current.title}</h3>
          <p>{current.detail}</p>

          {current.options && (
            <div className="rf-options">
              {current.options.map((o) => (
                <button
                  key={o.next + o.label}
                  type="button"
                  className="rf-option"
                  onClick={() => choose(o.next)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}

          <div className="rf-nav">
            <button type="button" className="btn btn-ghost" onClick={back} disabled={path.length <= 1}>
              ← Terug
            </button>
            <button type="button" className="btn btn-ghost" onClick={reset}>
              Reset pad
            </button>
          </div>
        </article>

        <aside className="rf-side">
          <p className="eyebrow">Waarom dit werkt</p>
          <ol className="pillars compact">
            <li>
              <strong>Filter eerst</strong>
              <span>FAQ + boom vangen 80%+ af (prototype-teller).</span>
            </li>
            <li>
              <strong>AI lazy</strong>
              <span>Mia laadt pas bij escalatie — tokens ≠ default.</span>
            </li>
            <li>
              <strong>Mens last</strong>
              <span>Met briefing: minder herhaaltijd, hogere kwaliteit.</span>
            </li>
            <li>
              <strong>Moment dempt ruis</strong>
              <span>Minder nutteloze campagnes = meer capaciteit elders.</span>
            </li>
          </ol>
          <div className="rf-stats">
            <div>
              <strong>{stats.self ? '✓' : '·'}</strong>
              <span>Self-serve eind</span>
            </div>
            <div>
              <strong>{stats.mia ? '✓' : '·'}</strong>
              <span>Mia eind</span>
            </div>
            <div>
              <strong>{stats.human ? '✓' : '·'}</strong>
              <span>Mens eind</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
