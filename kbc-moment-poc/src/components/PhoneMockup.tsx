import type { AppScreen } from '../data/scenarios'

type Props = {
  screen: AppScreen
  customer: string
  personalized: boolean
}

export function PhoneMockup({ screen, customer, personalized }: Props) {
  return (
    <div className={`phone ${personalized ? 'personalized' : 'generic'}`}>
      <div className="phone-notch" aria-hidden />
      <div className="phone-status">
        <span>09:41</span>
        <span>KBC</span>
      </div>
      <p className="phone-mode">{screen.modeLabel}</p>
      <h3 className="phone-title">{screen.headline}</h3>
      <p className="phone-sub">{screen.sub}</p>
      <button type="button" className="phone-cta">
        {screen.primaryCta}
      </button>

      {screen.checklist.length > 0 && (
        <ul className="phone-check">
          {screen.checklist.map((item) => (
            <li key={item.label} className={item.done ? 'done' : ''}>
              <span className="check-box" aria-hidden>
                {item.done ? '✓' : ''}
              </span>
              {item.label}
            </li>
          ))}
        </ul>
      )}

      <div className="phone-tiles">
        {screen.tiles.map((tile) => (
          <div
            key={tile.title}
            className={tile.muted ? 'phone-tile muted-tile' : 'phone-tile'}
          >
            <strong>{tile.title}</strong>
            <span>{tile.meta}</span>
          </div>
        ))}
      </div>

      <p className="phone-foot">Voor {customer}</p>
    </div>
  )
}
