import { useApp } from '../../context/AppContext'

const MapPinIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

export default function WeddingInfo() {
  const { get } = useApp()

  return (
    <section id="boda" className="section">
      <h2 className="section-title">La Boda</h2>
      <p className="section-subtitle">{get('hero_date', '6 de noviembre de 2026')}</p>

      <div className="wedding-cards">
        <div className="card wedding-event-card">
          <div className="wedding-event-type">Ceremonia</div>
          <div className="wedding-event-time">{get('ceremony_time', '17:00')}</div>
          <div className="wedding-event-name">{get('venue_name', 'Altos del Paico')}</div>
        </div>
        <div className="card wedding-event-card">
          <div className="wedding-event-type">Recepción</div>
          <div className="wedding-event-time">{get('reception_time', '19:30')}</div>
          <div className="wedding-event-name">{get('venue_name', 'Altos del Paico')}</div>
        </div>
      </div>

      <div className="card venue-card">
        <div className="venue-card-header">
          <MapPinIcon />
          <h3>{get('venue_name', 'Altos del Paico')}</h3>
        </div>
        {get('venue_address') && (
          <p className="venue-address">{get('venue_address')}</p>
        )}
        {get('venue_description') && (
          <p className="venue-description">{get('venue_description')}</p>
        )}
      </div>
    </section>
  )
}
