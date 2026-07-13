import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import GiftModal from '../GiftModal'

function formatCLP(n) {
  if (n == null) return 'Próximamente'
  return `$${Number(n).toLocaleString('es-CL')} CLP`
}

export default function Gifts({ initialReservation }) {
  const { token } = useApp()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedGift, setSelectedGift] = useState(null)
  const [reservation, setReservation] = useState(initialReservation)

  useEffect(() => {
    fetch('/api/gifts', { headers: { 'X-Invite-Token': token } })
      .then(r => r.json())
      .then(data => { setTrips(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  function handleReserved(giftId) {
    setReservation({ giftId })
    setTrips(prev =>
      prev.map(trip => ({
        ...trip,
        gifts: trip.gifts.map(g =>
          g.id === giftId ? { ...g, status: 'reserved-by-you' } : g
        ),
      }))
    )
    setSelectedGift(null)
  }

  if (loading) {
    return (
      <section id="regalos" className="section">
        <p className="text-muted">Cargando lista de regalos...</p>
      </section>
    )
  }

  return (
    <section id="regalos" className="section">
      <h2 className="section-title">Lista de Regalos</h2>
      <p className="section-subtitle">
        El mejor regalo es tu presencia. Pero si deseas hacernos un obsequio,
        aquí van algunas ideas para nuestra luna de miel.
      </p>

      {reservation && (
        <div className="card gifts-already-reserved">
          <span className="tag tag-accent">✓ Ya reservaste un regalo</span>
          <span style={{ fontSize: '0.875rem', opacity: 0.75 }}>
            ¡Gracias por tu generoso regalo! Solo se puede reservar uno por invitado.
          </span>
        </div>
      )}

      {trips.map(trip => (
        <div key={trip.id} className="trip-section">
          <div className="trip-title">{trip.name}</div>
          <div className="gifts-grid">
            {trip.gifts.map(gift => {
              const byMe = gift.status === 'reserved-by-you'
              const byOther = gift.status === 'reserved'
              const unavailable = byOther || byMe || gift.price == null
              const canReserve = !reservation && !unavailable

              return (
                <div
                  key={gift.id}
                  className={`card gift-card ${unavailable ? 'gift-unavailable' : ''}`}
                  onClick={() => canReserve && setSelectedGift(gift)}
                  role={canReserve ? 'button' : undefined}
                  tabIndex={canReserve ? 0 : undefined}
                  onKeyDown={e => { if (e.key === 'Enter' && canReserve) setSelectedGift(gift) }}
                >
                  <div className="gift-name">{gift.name}</div>
                  <div className="gift-price">{formatCLP(gift.price)}</div>
                  <div className="gift-action">
                    {byMe && <span className="tag tag-accent">Reservado por ti ♡</span>}
                    {byOther && <span className="tag tag-neutral">Reservado</span>}
                    {gift.price == null && !byMe && !byOther && (
                      <span className="tag tag-neutral">Próximamente</span>
                    )}
                    {canReserve && (
                      <button className="btn btn-secondary" style={{ width: '100%' }} tabIndex={-1}>
                        Reservar
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {selectedGift && (
        <GiftModal
          gift={selectedGift}
          onClose={() => setSelectedGift(null)}
          onReserved={handleReserved}
        />
      )}
    </section>
  )
}
