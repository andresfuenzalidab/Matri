import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import GiftModal from '../GiftModal'
import { normalizeImageUrl } from '../../utils/imageUrl.js'

function formatCLP(n) {
  if (n == null) return 'Próximamente'
  return `$${Number(n).toLocaleString('es-CL')} CLP`
}

export default function Gifts({ initialReservation }) {
  const { token, get, guest } = useApp()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [cartGift, setCartGift] = useState(null)
  const [modalGift, setModalGift] = useState(null)
  const [reservation, setReservation] = useState(initialReservation)

  useEffect(() => {
    fetch('/api/gifts', { headers: { 'X-Invite-Token': token } })
      .then(r => r.json())
      .then(data => { setTrips(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  function handleReserved(giftId) {
    setReservation({ giftId })
    setTrips(prev => prev.map(t => ({
      ...t,
      gifts: t.gifts.map(g => g.id === giftId ? { ...g, status: 'reserved-by-you' } : g),
    })))
    setCartGift(null)
    setModalGift(null)
  }

  function addToCart(gift) {
    setCartGift(gift)
    // Scroll to cart bar smoothly
    setTimeout(() => document.getElementById('gift-cart')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100)
  }

  if (loading) return (
    <section id="regalos" className="section">
      <p className="text-muted">Cargando lista de regalos...</p>
    </section>
  )

  const myGift = trips.flatMap(t => t.gifts).find(g => g.status === 'reserved-by-you')

  return (
    <section id="regalos" className="section">
      <div className="gifts-hero">
        <p className="gifts-hero-label">{get('gifts_section_label', 'Luna de Miel')}</p>
        <h2 className="gifts-hero-title">{get('gifts_section_title', 'Regala un pedacito de nuestro viaje')}</h2>
        <p className="gifts-hero-intro">
          {get('gifts_intro', 'El mejor regalo es tu presencia. Pero si deseas hacernos un obsequio, aquí van algunas ideas para nuestra luna de miel.')}
        </p>
      </div>

      {myGift && (
        <div className="card gifts-already-reserved">
          <span className="tag tag-accent">♡ Tu regalo</span>
          <span style={{ fontSize: '0.9rem' }}><strong>{myGift.name}</strong> — {formatCLP(myGift.price)}</span>
          <span style={{ fontSize: '0.8rem', opacity: 0.65 }}>¡Gracias por tu generosidad!</span>
        </div>
      )}

      {trips.map(trip => (
        <div key={trip.id} className="trip-section">
          {normalizeImageUrl(trip.imageUrl) && (
            <img
              src={normalizeImageUrl(trip.imageUrl)}
              alt={trip.name}
              style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8, marginBottom: '1.25rem' }}
              onError={e => e.target.style.display = 'none'}
            />
          )}
          <div className="trip-title">{trip.name}</div>
          <div className="gifts-grid">
            {trip.gifts.map(gift => {
              const byMe = gift.status === 'reserved-by-you'
              const byOther = gift.status === 'reserved'
              const inCart = cartGift?.id === gift.id
              const canAdd = !reservation && !byOther && !byMe && gift.price != null

              return (
                <div
                  key={gift.id}
                  className={`card gift-card ${byOther ? 'gift-unavailable' : ''} ${inCart ? 'gift-in-cart' : ''}`}
                >
                  {normalizeImageUrl(gift.imageUrl) && (
                    <img
                      src={normalizeImageUrl(gift.imageUrl)}
                      alt={gift.name}
                      style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 4, marginBottom: '0.25rem' }}
                      onError={e => e.target.style.display = 'none'}
                    />
                  )}
                  <div className="gift-name">{gift.name}</div>
                  {gift.description && (
                    <div style={{ fontSize: '0.8rem', opacity: 0.65, lineHeight: 1.5 }}>{gift.description}</div>
                  )}
                  <div className="gift-price">{formatCLP(gift.price)}</div>
                  <div className="gift-action">
                    {byMe && <span className="tag tag-accent">Tu regalo ♡</span>}
                    {byOther && <span className="tag tag-neutral">Reservado</span>}
                    {gift.price == null && !byMe && !byOther && <span className="tag tag-neutral">Próximamente</span>}
                    {canAdd && !inCart && (
                      <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => addToCart(gift)}>
                        Seleccionar
                      </button>
                    )}
                    {canAdd && inCart && (
                      <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setCartGift(null)}>
                        ✓ Seleccionado
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Cart bar */}
      {cartGift && !reservation && (
        <div id="gift-cart" className="gift-cart-bar">
          <div className="gift-cart-info">
            <span className="gift-cart-label">Tu selección</span>
            <span className="gift-cart-name">{cartGift.name}</span>
            <span className="gift-cart-price">{formatCLP(cartGift.price)}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-ghost" onClick={() => setCartGift(null)}>Quitar</button>
            <button className="btn btn-primary" onClick={() => setModalGift(cartGift)}>
              Regalar →
            </button>
          </div>
        </div>
      )}

      {modalGift && (
        <GiftModal
          gift={modalGift}
          onClose={() => setModalGift(null)}
          onReserved={handleReserved}
        />
      )}
    </section>
  )
}
