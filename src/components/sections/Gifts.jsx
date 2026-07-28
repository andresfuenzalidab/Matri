import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import GiftModal from '../GiftModal'
import { normalizeImageUrl } from '../../utils/imageUrl.js'

function formatCLP(n) {
  if (n == null) return 'Próximamente'
  return `$${Number(n).toLocaleString('es-CL')} CLP`
}

function sortGifts(gifts, sortBy) {
  if (!sortBy || sortBy === 'none') return gifts
  return [...gifts].sort((a, b) => {
    if (sortBy === 'price-asc') return (a.price ?? Infinity) - (b.price ?? Infinity)
    if (sortBy === 'price-desc') return (b.price ?? -1) - (a.price ?? -1)
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name, 'es')
    if (sortBy === 'name-desc') return b.name.localeCompare(a.name, 'es')
    return 0
  })
}

export default function Gifts() {
  const { token, get, guest } = useApp()
  const giftKey = `purchasedGifts_${token}`
  const pendingKey = `pendingMPCart_${token}`

  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState(new Map())
  const [modalOpen, setModalOpen] = useState(false)
  const [sortBy, setSortBy] = useState('none')
  const [purchased, setPurchased] = useState(() => {
    const t = sessionStorage.getItem('inviteToken') || ''
    try { return !!JSON.parse(localStorage.getItem(`purchasedGifts_${t}`) || 'null') } catch { return false }
  })
  const [purchasedGifts, setPurchasedGifts] = useState(() => {
    const t = sessionStorage.getItem('inviteToken') || ''
    try { return JSON.parse(localStorage.getItem(`purchasedGifts_${t}`) || 'null') || [] } catch { return [] }
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('status') || params.get('collection_status')
    const paymentId = params.get('payment_id') || params.get('collection_id')

    if (paymentId) {
      window.history.replaceState({}, '', window.location.pathname)
      if (status === 'approved') {
        try {
          const raw = localStorage.getItem(pendingKey)
          if (raw) {
            localStorage.removeItem(pendingKey)
            const items = JSON.parse(raw)
            const reserved = items.map(({ gift, quantity }) => ({ ...gift, quantity }))
            localStorage.setItem(giftKey, JSON.stringify(reserved))
            setPurchasedGifts(reserved)
            setPurchased(true)
          }
        } catch {}
      } else {
        localStorage.removeItem(pendingKey)
      }
      sessionStorage.setItem('scrollToGifts', '1')
    }
  }, [giftKey, pendingKey])

  useEffect(() => {
    if (!loading && (purchased || sessionStorage.getItem('scrollToGifts'))) {
      sessionStorage.removeItem('scrollToGifts')
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100)
    }
  }, [loading, purchased])

  useEffect(() => {
    fetch('/api/gifts', { headers: { 'X-Invite-Token': token } })
      .then(r => r.json())
      .then(data => { setTrips(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  function addToCart(gift) {
    setCart(prev => {
      const next = new Map(prev)
      if (next.has(gift.id)) {
        next.set(gift.id, { gift, quantity: next.get(gift.id).quantity + 1 })
      } else {
        next.set(gift.id, { gift, quantity: 1 })
      }
      return next
    })
  }

  function removeFromCart(giftId) {
    setCart(prev => { const next = new Map(prev); next.delete(giftId); return next })
  }

  function updateCartQty(giftId, qty) {
    if (qty < 1) { removeFromCart(giftId); return }
    setCart(prev => {
      const next = new Map(prev)
      if (next.has(giftId)) next.set(giftId, { ...next.get(giftId), quantity: qty })
      return next
    })
  }

  function handleReserved(cartItems) {
    const reserved = cartItems.map(({ gift, quantity }) => ({ ...gift, quantity }))
    try { localStorage.setItem(giftKey, JSON.stringify(reserved)) } catch {}
    setPurchasedGifts(reserved)
    setCart(new Map())
    setModalOpen(false)
    setPurchased(true)
  }

  if (loading) return (
    <section id="regalos" className="section">
      <p className="text-muted">Cargando lista de regalos...</p>
    </section>
  )

  const cartItems = Array.from(cart.values())
  const cartTotal = cartItems.reduce((sum, { gift, quantity }) => sum + (gift.price || 0) * quantity, 0)
  const thanksMsg = get('gifts_thanks_message', '¡Gracias!')
  const displayName = guest?.nickname || guest?.name

  if (purchased) {
    const purchasedTotal = purchasedGifts.reduce((sum, g) => sum + (g.price || 0) * (g.quantity || 1), 0)
    return (
      <section id="regalos" className="section-compact">
        <div className="card" style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', color: 'var(--color-accent)', marginBottom: '0.5rem' }}>♡</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>
            {thanksMsg.replace('{nombre}', displayName)}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem' }}>
            {purchasedGifts.map((g, i) => (
              <span key={i} style={{ fontSize: '0.9rem' }}>
                <strong>{g.name}</strong>
                {(g.quantity || 1) > 1 ? ` ×${g.quantity}` : ''}
                {g.price != null ? ` — ${formatCLP(g.price * (g.quantity || 1))}` : ''}
              </span>
            ))}
          </div>
          {purchasedTotal > 0 && (
            <div style={{ borderTop: '1px solid var(--color-divider)', paddingTop: '0.5rem', marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.95rem' }}>
              Total: {formatCLP(purchasedTotal)}
            </div>
          )}
          <p style={{ fontSize: '0.8rem', opacity: 0.6, margin: 0 }}>
            Tu(s) regalo(s) ha(n) quedado reservado(s). ¡Nos hace muy felices!
          </p>
        </div>
      </section>
    )
  }

  return (
    <section id="regalos" className="section">
      <div className="gifts-hero reveal-on-scroll">
        <p className="gifts-hero-label">{get('gifts_section_label', 'Luna de Miel')}</p>
        <h2 className="gifts-hero-title">{get('gifts_section_title', 'Regala un pedacito de nuestro viaje')}</h2>
        <p className="gifts-hero-intro">
          {get('gifts_intro', 'El mejor regalo es tu presencia. Pero si deseas hacernos un obsequio, aquí van algunas ideas para nuestra luna de miel.')}
        </p>
      </div>

      {/* Sort filter */}
      <div className="gift-filter-bar reveal-on-scroll">
        <span className="gift-filter-label">Ordenar por</span>
        {[
          ['none', 'Por defecto'],
          ['price-asc', 'Precio ↑'],
          ['price-desc', 'Precio ↓'],
          ['name-asc', 'A → Z'],
          ['name-desc', 'Z → A'],
        ].map(([val, label]) => (
          <button
            key={val}
            className={`btn btn-ghost gift-filter-btn ${sortBy === val ? 'active' : ''}`}
            onClick={() => setSortBy(val)}
          >
            {label}
          </button>
        ))}
      </div>

      {trips.map(trip => (
        <div key={trip.id} className="trip-section reveal-on-scroll">
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
            {sortGifts(trip.gifts, sortBy).map(gift => {
              const inCart = cart.has(gift.id)
              const canAdd = gift.price != null

              return (
                <div
                  key={gift.id}
                  className={`card gift-card ${inCart ? 'gift-in-cart' : ''}`}
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
                    {!canAdd && <span className="tag tag-neutral">Próximamente</span>}
                    {canAdd && !inCart && (
                      <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => addToCart(gift)}>
                        Seleccionar
                      </button>
                    )}
                    {canAdd && inCart && (
                      <div className="gift-qty-control">
                        <button className="btn btn-ghost gift-qty-btn"
                          onClick={() => updateCartQty(gift.id, cart.get(gift.id).quantity - 1)}>
                          −
                        </button>
                        <span className="gift-qty-value">{cart.get(gift.id).quantity}</span>
                        <button className="btn btn-ghost gift-qty-btn"
                          onClick={() => updateCartQty(gift.id, cart.get(gift.id).quantity + 1)}>
                          +
                        </button>
                        <button className="btn btn-ghost gift-qty-remove"
                          onClick={() => removeFromCart(gift.id)}
                          title="Quitar">✕</button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Cart bar */}
      {cartItems.length > 0 && (
        <div id="gift-cart" className="gift-cart-bar">
          <div className="gift-cart-info">
            <span className="gift-cart-label">Tu selección</span>
            <span className="gift-cart-name">
              {cartItems.map(({ gift, quantity }) =>
                quantity > 1 ? `${gift.name} ×${quantity}` : gift.name
              ).join(', ')}
            </span>
            {cartTotal > 0 && (
              <span className="gift-cart-price">{formatCLP(cartTotal)}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-ghost" onClick={() => setCart(new Map())}>Quitar todo</button>
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
              Regalar →
            </button>
          </div>
        </div>
      )}

      {modalOpen && (
        <GiftModal
          cartItems={cartItems}
          onClose={() => setModalOpen(false)}
          onReserved={handleReserved}
        />
      )}
    </section>
  )
}
