import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { normalizeImageUrl } from '../../utils/imageUrl.js'
import { downloadCSV } from '../../utils/exportCsv.js'

function formatCLP(n) {
  if (n == null) return '—'
  return `$${Number(n).toLocaleString('es-CL')}`
}

const EMPTY_GIFT = { name: '', price: '', description: '', image_url: '' }
const EMPTY_TRIP = { name: '', description: '', image_url: '' }

export default function GiftsDashboard() {
  const { token } = useApp()
  const [trips, setTrips] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Trip state
  const [editTripId, setEditTripId] = useState(null)
  const [editTrip, setEditTrip] = useState(EMPTY_TRIP)
  const [tripSaving, setTripSaving] = useState(false)
  const [showNewTrip, setShowNewTrip] = useState(false)
  const [newTrip, setNewTrip] = useState(EMPTY_TRIP)
  const [newTripSaving, setNewTripSaving] = useState(false)

  // Gift state
  const [editGiftId, setEditGiftId] = useState(null)
  const [editGift, setEditGift] = useState(EMPTY_GIFT)
  const [editGiftTripId, setEditGiftTripId] = useState('')
  const [giftSaving, setGiftSaving] = useState(false)
  const [newGiftTripId, setNewGiftTripId] = useState(null)
  const [newGift, setNewGift] = useState(EMPTY_GIFT)
  const [newGiftSaving, setNewGiftSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/gifts', { headers: { 'X-Invite-Token': token } })
      if (res.ok) {
        const d = await res.json()
        setTrips(d.trips || [])
        setSummary(d.summary || {})
      } else {
        setError('No se pudieron cargar los datos.')
      }
    } catch {
      setError('Error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // ── Trip actions ──────────────────────────────────────────

  async function createTrip(e) {
    e.preventDefault()
    if (!newTrip.name.trim()) return
    setNewTripSaving(true)
    try {
      const res = await fetch('/api/admin/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify(newTrip),
      })
      if (res.ok) {
        const t = await res.json()
        setTrips(prev => [...prev, { ...t, gifts: [] }])
        setNewTrip(EMPTY_TRIP)
        setShowNewTrip(false)
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'Error al crear destino.')
      }
    } catch { setError('Error de conexión.') }
    finally { setNewTripSaving(false) }
  }

  async function saveTrip(trip) {
    setTripSaving(true)
    try {
      const res = await fetch('/api/admin/trips', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({ id: trip.id, ...editTrip, order_idx: trip.order_idx }),
      })
      if (res.ok) {
        setTrips(prev => prev.map(t => t.id === trip.id ? { ...t, ...editTrip } : t))
        setEditTripId(null)
      } else { setError('Error al guardar.') }
    } catch { setError('Error de conexión.') }
    finally { setTripSaving(false) }
  }

  async function deleteTrip(trip) {
    const giftCount = trip.gifts.length
    const confirmedGifts = trip.gifts.filter(g => g.confirmed_count > 0).length
    const reservedGifts = trip.gifts.filter(g => g.reservation_count > 0).length
    const confirmedTotal = trip.gifts.reduce(
      (sum, g) => sum + (g.confirmed_count > 0 ? (g.price || 0) * g.confirmed_quantity : 0), 0
    )

    const msg = giftCount > 0
      ? `"${trip.name}" tiene ${giftCount} regalo(s)${reservedGifts > 0 ? `, ${reservedGifts} con reserva` : ''}.\n\n¿Eliminar el destino de todas formas? Esto también eliminará sus regalos${reservedGifts > 0 ? ' y cancelará sus reservas' : ''}.`
      : `¿Eliminar el destino "${trip.name}"?`
    if (!window.confirm(msg)) return

    try {
      const res = await fetch(`/api/admin/trips?id=${trip.id}`, {
        method: 'DELETE', headers: { 'X-Invite-Token': token },
      })
      if (res.ok) {
        setTrips(prev => prev.filter(t => t.id !== trip.id))
        setSummary(s => ({
          ...s,
          total: Math.max(0, (s.total || 0) - giftCount),
          reserved: Math.max(0, (s.reserved || 0) - confirmedGifts),
          available: Math.max(0, (s.available || 0) - (giftCount - confirmedGifts)),
          totalReceived: Math.max(0, (s.totalReceived || 0) - confirmedTotal),
        }))
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'No se pudo eliminar.')
      }
    } catch { setError('Error de conexión.') }
  }

  async function moveTrip(idx, dir) {
    const list = [...trips]
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= list.length) return
    ;[list[idx], list[swapIdx]] = [list[swapIdx], list[idx]]
    setTrips(list)
    await Promise.all([
      fetch('/api/admin/trips', {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({ ...list[idx], order_idx: idx }),
      }),
      fetch('/api/admin/trips', {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({ ...list[swapIdx], order_idx: swapIdx }),
      }),
    ])
  }

  // ── Gift actions ──────────────────────────────────────────

  async function createGift(e, tripId) {
    e.preventDefault()
    if (!newGift.name.trim()) return
    setNewGiftSaving(true)
    try {
      const res = await fetch('/api/admin/gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({ ...newGift, trip_id: tripId }),
      })
      if (res.ok) {
        const g = await res.json()
        setTrips(prev => prev.map(t => t.id === tripId
          ? { ...t, gifts: [...t.gifts, g] }
          : t
        ))
        setNewGift(EMPTY_GIFT)
        setNewGiftTripId(null)
        setSummary(s => ({ ...s, total: (s.total || 0) + 1, available: (s.available || 0) + 1 }))
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'Error al crear regalo.')
      }
    } catch { setError('Error de conexión.') }
    finally { setNewGiftSaving(false) }
  }

  async function saveGift(gift) {
    setGiftSaving(true)
    try {
      const res = await fetch('/api/admin/gifts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({ id: gift.id, ...editGift, trip_id: editGiftTripId, order_idx: gift.order_idx }),
      })
      if (res.ok) {
        const updatedGift = { ...gift, ...editGift, trip_id: editGiftTripId }
        setTrips(prev => {
          const removed = prev.map(t => ({ ...t, gifts: t.gifts.filter(g => g.id !== gift.id) }))
          return removed.map(t => t.id === editGiftTripId
            ? { ...t, gifts: [...t.gifts, updatedGift].sort((a, b) => (a.order_idx ?? 0) - (b.order_idx ?? 0)) }
            : t
          )
        })
        setEditGiftId(null)
      } else { setError('Error al guardar.') }
    } catch { setError('Error de conexión.') }
    finally { setGiftSaving(false) }
  }

  async function deleteGift(gift, tripId) {
    const msg = gift.reservation_count > 0
      ? `"${gift.name}" tiene ${gift.reservation_count} reserva(s).\n\n¿Eliminar de todas formas? Esto también cancelará sus reservas.`
      : `¿Eliminar "${gift.name}"?`
    if (!window.confirm(msg)) return
    try {
      const res = await fetch(`/api/admin/gifts?id=${gift.id}`, {
        method: 'DELETE', headers: { 'X-Invite-Token': token },
      })
      if (res.ok) {
        setTrips(prev => prev.map(t => t.id === tripId
          ? { ...t, gifts: t.gifts.filter(g => g.id !== gift.id) }
          : t
        ))
        setSummary(s => ({ ...s, total: Math.max(0, (s.total || 1) - 1), available: Math.max(0, (s.available || 1) - 1) }))
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'No se pudo eliminar.')
      }
    } catch { setError('Error de conexión.') }
  }

  async function moveGift(tripId, idx, dir) {
    const trip = trips.find(t => t.id === tripId)
    if (!trip) return
    const list = [...trip.gifts]
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= list.length) return
    ;[list[idx], list[swapIdx]] = [list[swapIdx], list[idx]]
    setTrips(prev => prev.map(t => t.id === tripId ? { ...t, gifts: list } : t))
    await Promise.all([
      fetch('/api/admin/gifts', {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({ ...list[idx], order_idx: idx }),
      }),
      fetch('/api/admin/gifts', {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({ ...list[swapIdx], order_idx: swapIdx }),
      }),
    ])
  }

  if (loading) return <p className="text-muted">Cargando...</p>

  return (
    <div>
      {error && <p className="form-error" onClick={() => setError('')} style={{ cursor: 'pointer' }}>{error} ✕</p>}

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-number">{summary.total ?? 0}</span>
          <span className="stat-label">Total regalos</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{summary.reserved ?? 0}</span>
          <span className="stat-label">Reservados</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{summary.available ?? 0}</span>
          <span className="stat-label">Disponibles</span>
        </div>
        <div className="stat-card">
          <span className="stat-number" style={{ fontSize: '0.95rem' }}>{formatCLP(summary.totalReceived ?? 0)}</span>
          <span className="stat-label">Total recibido</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', gap: '0.75rem' }}>
        <button
          className="btn btn-ghost"
          onClick={() => downloadCSV('regalos.csv',
            trips.flatMap(trip =>
              trip.gifts.map(gift => [
                trip.name,
                gift.name,
                gift.price ?? '',
                gift.confirmed_count > 0 ? 'Confirmado' : (gift.reservation_count > 0 ? 'Pendiente' : 'No'),
                gift.total_quantity || 0,
              ])
            ),
            ['Destino', 'Regalo', 'Precio', 'Reservado', 'Cantidad total reservada']
          )}
        >
          Exportar CSV
        </button>
        {/* New trip form */}
        <button className="btn btn-primary" onClick={() => { setShowNewTrip(s => !s); setNewTrip(EMPTY_TRIP) }}>
          {showNewTrip ? 'Cancelar' : '+ Nuevo destino'}
        </button>
      </div>

      {showNewTrip && (
        <form className="create-form" onSubmit={createTrip} style={{ marginBottom: '1.5rem' }}>
          <div className="create-form-title">Nuevo destino</div>
          <div className="form-field">
            <label className="form-label">Nombre *</label>
            <input className="input" value={newTrip.name} onChange={e => setNewTrip(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="form-field">
            <label className="form-label">URL de imagen de portada</label>
            <input className="input" placeholder="https://... o Google Drive" value={newTrip.image_url} onChange={e => setNewTrip(f => ({ ...f, image_url: e.target.value }))} />
            {normalizeImageUrl(newTrip.image_url) && (
              <img src={normalizeImageUrl(newTrip.image_url)} alt="" style={{ height: 70, objectFit: 'cover', borderRadius: 4, marginTop: 6, width: '100%' }} onError={e => e.target.style.display = 'none'} />
            )}
          </div>
          <button className="btn btn-primary" type="submit" disabled={newTripSaving || !newTrip.name.trim()}>
            {newTripSaving ? 'Creando...' : 'Crear destino'}
          </button>
        </form>
      )}

      {/* Trip list */}
      {trips.length === 0 && !showNewTrip && (
        <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>No hay destinos. Crea el primero.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {trips.map((trip, tripIdx) => (
          <div key={trip.id} style={{ border: '1px solid var(--color-divider)', borderRadius: 8, overflow: 'hidden' }}>

            {/* Trip header */}
            {editTripId === trip.id ? (
              <div style={{ padding: '1rem', background: 'var(--color-neutral-100)' }}>
                <div className="form-field">
                  <label className="form-label">Nombre del destino</label>
                  <input className="input" value={editTrip.name} onChange={e => setEditTrip(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="form-label">URL imagen de portada</label>
                  <input className="input" placeholder="https://... o Google Drive" value={editTrip.image_url} onChange={e => setEditTrip(f => ({ ...f, image_url: e.target.value }))} />
                  {normalizeImageUrl(editTrip.image_url) && (
                    <img src={normalizeImageUrl(editTrip.image_url)} alt="" style={{ height: 60, objectFit: 'cover', borderRadius: 4, marginTop: 4, width: '100%' }} onError={e => e.target.style.display = 'none'} />
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-primary" onClick={() => saveTrip(trip)} disabled={tripSaving}>{tripSaving ? 'Guardando...' : 'Guardar'}</button>
                  <button className="btn btn-ghost" onClick={() => setEditTripId(null)}>Cancelar</button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '0.75rem 1rem', background: 'var(--color-neutral-100)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {normalizeImageUrl(trip.image_url) && (
                  <img src={normalizeImageUrl(trip.image_url)} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />
                )}
                <strong style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', flex: 1 }}>{trip.name}</strong>
                <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{trip.gifts.length} regalos</span>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button className="btn btn-ghost" style={{ padding: '2px 6px' }} onClick={() => moveTrip(tripIdx, -1)} disabled={tripIdx === 0}>↑</button>
                  <button className="btn btn-ghost" style={{ padding: '2px 6px' }} onClick={() => moveTrip(tripIdx, 1)} disabled={tripIdx === trips.length - 1}>↓</button>
                  <button className="btn btn-ghost" style={{ fontSize: '0.75rem' }} onClick={() => { setEditTripId(trip.id); setEditTrip({ name: trip.name, image_url: trip.image_url || '', description: trip.description || '' }) }}>Editar</button>
                  <button className="btn btn-ghost" style={{ color: '#c0392b', fontSize: '0.75rem' }} onClick={() => deleteTrip(trip)}>Eliminar</button>
                </div>
              </div>
            )}

            {/* Gift list */}
            <div style={{ padding: '0.5rem 0' }}>
              {trip.gifts.length === 0 && (
                <p style={{ padding: '0.75rem 1rem', opacity: 0.4, fontSize: '0.85rem', margin: 0 }}>Sin regalos.</p>
              )}
              {trip.gifts.map((gift, giftIdx) => (
                <div key={gift.id} style={{ padding: '0.6rem 1rem', borderTop: '1px solid var(--color-neutral-200)' }}>
                  {editGiftId === gift.id ? (
                    <div>
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 2, minWidth: 160 }}>
                          <label className="form-label">Nombre *</label>
                          <input className="input" value={editGift.name} onChange={e => setEditGift(f => ({ ...f, name: e.target.value }))} />
                        </div>
                        <div style={{ flex: 1, minWidth: 100 }}>
                          <label className="form-label">Precio (CLP)</label>
                          <input className="input" type="number" placeholder="Sin precio" value={editGift.price} onChange={e => setEditGift(f => ({ ...f, price: e.target.value }))} />
                        </div>
                        <div style={{ flex: 1, minWidth: 140 }}>
                          <label className="form-label">Destino</label>
                          <select className="input" value={editGiftTripId} onChange={e => setEditGiftTripId(e.target.value)}>
                            {trips.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="form-field" style={{ marginTop: '0.6rem' }}>
                        <label className="form-label">URL de imagen</label>
                        <input className="input" placeholder="https://... o Google Drive" value={editGift.image_url} onChange={e => setEditGift(f => ({ ...f, image_url: e.target.value }))} />
                        {normalizeImageUrl(editGift.image_url) && (
                          <img src={normalizeImageUrl(editGift.image_url)} alt="" style={{ height: 60, objectFit: 'cover', borderRadius: 4, marginTop: 4 }} onError={e => e.target.style.display = 'none'} />
                        )}
                      </div>
                      <div className="form-field">
                        <label className="form-label">Descripción</label>
                        <textarea className="input" rows={2} value={editGift.description} onChange={e => setEditGift(f => ({ ...f, description: e.target.value }))} />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-primary" onClick={() => saveGift(gift)} disabled={giftSaving}>{giftSaving ? 'Guardando...' : 'Guardar'}</button>
                        <button className="btn btn-ghost" onClick={() => setEditGiftId(null)}>Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {normalizeImageUrl(gift.image_url) && (
                        <img src={normalizeImageUrl(gift.image_url)} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{gift.name}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-accent)', marginLeft: '0.5rem' }}>{formatCLP(gift.price)}</span>
                        {gift.confirmed_count > 0 && (
                          <span className="tag tag-accent" style={{ marginLeft: '0.4rem', fontSize: '0.65rem' }}>
                            Confirmado{gift.confirmed_quantity > 1 ? ` ×${gift.confirmed_quantity}` : ''}
                          </span>
                        )}
                        {(gift.reservation_count - (gift.confirmed_count || 0)) > 0 && (
                          <span className="tag tag-neutral" style={{ marginLeft: '0.4rem', fontSize: '0.65rem' }}>
                            Pendiente
                          </span>
                        )}
                        {gift.description && (
                          <p style={{ fontSize: '0.75rem', opacity: 0.55, margin: '2px 0 0', lineHeight: 1.3 }}>{gift.description.substring(0, 60)}{gift.description.length > 60 ? '…' : ''}</p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.2rem', flexShrink: 0 }}>
                        <button className="btn btn-ghost" style={{ padding: '2px 5px' }} onClick={() => moveGift(trip.id, giftIdx, -1)} disabled={giftIdx === 0}>↑</button>
                        <button className="btn btn-ghost" style={{ padding: '2px 5px' }} onClick={() => moveGift(trip.id, giftIdx, 1)} disabled={giftIdx === trip.gifts.length - 1}>↓</button>
                        <button
                          className="btn btn-ghost"
                          style={{ fontSize: '0.72rem' }}
                          onClick={() => {
                            setEditGiftId(gift.id)
                            setEditGiftTripId(gift.trip_id || trip.id)
                            setEditGift({ name: gift.name || '', price: gift.price ?? '', description: gift.description || '', image_url: gift.image_url || '' })
                          }}
                        >
                          Editar
                        </button>
                        <button className="btn btn-ghost" style={{ color: '#c0392b', fontSize: '0.72rem' }} onClick={() => deleteGift(gift, trip.id)}>Eliminar</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add gift form */}
              {newGiftTripId === trip.id ? (
                <form onSubmit={e => createGift(e, trip.id)} style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--color-divider)', background: 'var(--color-neutral-100)' }}>
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <input className="input" style={{ flex: 2, minWidth: 140 }} placeholder="Nombre del regalo *" value={newGift.name} onChange={e => setNewGift(f => ({ ...f, name: e.target.value }))} required />
                    <input className="input" type="number" style={{ flex: 1, minWidth: 100 }} placeholder="Precio CLP" value={newGift.price} onChange={e => setNewGift(f => ({ ...f, price: e.target.value }))} />
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <input className="input" placeholder="URL de imagen (opcional)" value={newGift.image_url} onChange={e => setNewGift(f => ({ ...f, image_url: e.target.value }))} />
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <input className="input" placeholder="Descripción (opcional)" value={newGift.description} onChange={e => setNewGift(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="btn btn-primary" type="submit" disabled={newGiftSaving || !newGift.name.trim()}>{newGiftSaving ? 'Creando...' : 'Agregar regalo'}</button>
                    <button className="btn btn-ghost" type="button" onClick={() => { setNewGiftTripId(null); setNewGift(EMPTY_GIFT) }}>Cancelar</button>
                  </div>
                </form>
              ) : (
                <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid var(--color-neutral-200)' }}>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: '0.8rem', width: '100%', textAlign: 'left' }}
                    onClick={() => { setNewGiftTripId(trip.id); setNewGift(EMPTY_GIFT) }}
                  >
                    + Agregar regalo a {trip.name}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
