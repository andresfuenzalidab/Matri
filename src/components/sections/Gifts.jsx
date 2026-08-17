import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import GiftModal from '../GiftModal'
import ThanksCard from '../ThanksCard'
import { normalizeImageUrl } from '../../utils/imageUrl.js'
import { guestDisplayName } from '../../utils/guestName.js'

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
  const pendingKey = `pendingMPCart_${token}`

  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState(new Map())
  const [modalOpen, setModalOpen] = useState(false)
  const [sortBy, setSortBy] = useState('price-asc')
  const [purchased, setPurchased] = useState(false)
  const [purchasedGifts, setPurchasedGifts] = useState([])

  useEffect(() => {
    async function load() {
      const params = new URLSearchParams(window.location.search)
      const status = params.get('status') || params.get('collection_status')
      const paymentId = params.get('payment_id') || params.get('collection_id')

      if (paymentId) {
        window.history.replaceState({}, '', window.location.pathname)
        localStorage.removeItem(pendingKey)
        if (status === 'approved') {
          await fetch('/api/gifts/confirm-payment', {
            method: 'POST',
            headers: { 'X-Invite-Token': token },
          }).catch(() => {})
        }
        sessionStorage.setItem('scrollToGifts', '1')
      }

      try {
        const r = await fetch('/api/gifts', { headers: { 'X-Invite-Token': token } })
        const data = await r.json()
        setTrips(data.trips || [])
        if (data.purchased) {
          setPurchased(true)
          setPurchasedGifts(data.purchasedGifts || [])
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [token, pendingKey])

  useEffect(() => {
    if (!loading && (purchased || sessionStorage.getItem('scrollToGifts'))) {
      sessionStorage.removeItem('scrollToGifts')
      // The gifts section itself, not the bottom of the page — on the MP
      // redirect this used to land past FAQ/Contact instead of showing the
      // gift(s) that were just confirmed.
      setTimeout(() => document.getElementById('regalos')?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [loading, purchased])

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
  const displayName = guestDisplayName(guest)
  // Flattened so the sort applies across every destino at once, with the
  // destino kept only as a label on the card, not a grouping section.
  const allGifts = trips.flatMap(trip => trip.gifts.map(gift => ({ ...gift, tripName: trip.name })))

  if (purchased) {
    const purchasedTotal = purchasedGifts.reduce((sum, g) => sum + (g.price || 0) * (g.quantity || 1), 0)
    return (
      <section id="regalos" className="section-compact">
        <ThanksCard symbol="♡" title={thanksMsg.replace(/\{nombre\}/gi, displayName)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem' }}>
            {purchasedGifts.map((g, i) => (
              <span key={i} style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: 'clamp(1rem, 2.5vw, 1.15rem)', fontWeight: 400 }}>
                {g.name}
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
          <p className="thanks-message" style={{ margin: 0 }}>
            Tu(s) regalo(s) ha(n) quedado reservado(s). ¡Nos hace muy felices!
          </p>
        </ThanksCard>
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

      {/* Sort filter — always applied to the single unified list below, so
          "Precio ↑" (the default) genuinely orders every gift regardless of
          which destino it belongs to, not just within each one's section. */}
      <div className="gift-filter-bar reveal-on-scroll">
        <span className="gift-filter-label">Ordenar por</span>
        {[
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

      {/* One flat list — the destino becomes a small label on the card
          instead of a section header, so sorting can mix gifts from every
          destino together. */}
      <div className="gifts-grid reveal-on-scroll">
        {sortGifts(allGifts, sortBy).map(gift => {
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
                  className="gift-card-img"
                  onError={e => e.target.style.display = 'none'}
                />
              )}
              {gift.tripName && <span className="kicker gift-card-category">{gift.tripName}</span>}
              <div className="gift-name">{gift.name}</div>
              {gift.description && (
                <div style={{ fontSize: '0.8rem', opacity: 0.65, lineHeight: 1.5 }}>{gift.description}</div>
              )}
              <div className="gift-price">{formatCLP(gift.price)}</div>
              <div className="gift-action">
                {!canAdd && <span className="tag tag-neutral">Próximamente</span>}
                {canAdd && !inCart && (
                  <button className="btn btn-ghost" style={{ width: '100%', letterSpacing: '0.08em', fontSize: '0.78rem', textTransform: 'uppercase' }} onClick={() => addToCart(gift)}>
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

      {/* Cart bar — steps aside while the payment dialog is open, and comes
          back if the guest closes it without paying. */}
      {cartItems.length > 0 && !modalOpen && (
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
          <div className="gift-cart-actions">
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
