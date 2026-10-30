import { useState, useEffect, useCallback, useMemo } from 'react'
import AdminModal from './AdminModal'

const formatCLP = n => (n == null ? '—' : `$${Number(n).toLocaleString('es-CL')}`)

/**
 * Manual gift ledger: every reservation — confirmed or not — with controls to
 * add one, correct it, flip its payment status or delete it. For when a
 * payment never registered, or a gift needs fixing by hand.
 */
export default function GiftRecords({ token, trips, invitations, onChanged }) {
  const headers = useMemo(() => ({ 'X-Invite-Token': token, 'Content-Type': 'application/json' }), [token])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [onlyPending, setOnlyPending] = useState(false)
  const [editing, setEditing] = useState(null) // row | {} (new)
  const [armDelete, setArmDelete] = useState(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/gift-reservations', { headers })
      const data = await res.json().catch(() => null)
      if (!res.ok || !Array.isArray(data)) throw new Error(data?.error || 'No se pudieron cargar los registros.')
      setRows(data); setError('')
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [headers])
  useEffect(() => { if (open) load() }, [open, load])

  async function call(method, body, url = '/api/admin/gift-reservations') {
    const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error || 'No se pudo guardar.')
    return data
  }
  async function refresh() { await load(); onChanged?.() }

  async function toggleConfirmed(r) {
    try { await call('PUT', { id: r.id, confirmed_payment: !r.confirmed_payment }); await refresh() } catch (e) { setError(e.message) }
  }
  async function remove(r) {
    if (armDelete !== r.id) { setArmDelete(r.id); return }
    try { await call('DELETE', null, `/api/admin/gift-reservations?id=${r.id}`); setArmDelete(null); await refresh() } catch (e) { setError(e.message) }
  }

  const pendingCount = rows.filter(r => !r.confirmed_payment).length
  const q = query.trim().toLowerCase()
  const visible = rows.filter(r =>
    (!onlyPending || !r.confirmed_payment) &&
    (!q || `${r.guest_name} ${r.invitation_name} ${r.gift_name} ${r.congratulations_message}`.toLowerCase().includes(q)))

  return (
    <div className="create-form" style={{ marginBottom: '1.5rem' }}>
      <button
        type="button" className="create-form-title" aria-expanded={open} onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 0, padding: 0, width: '100%', textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit', display: 'flex', justifyContent: 'space-between' }}
      >
        <span>Registros de regalos — editar a mano {open && rows.length > 0 && `(${rows.length}${pendingCount ? `, ${pendingCount} sin confirmar` : ''})`}</span>
        <span aria-hidden="true">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.75rem' }}>
          <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7 }}>
            Aquí aparecen todos los regalos, también los sin confirmar. Si un pago no quedó registrado, agrégalo o márcalo como confirmado; solo los confirmados cuentan en los totales.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input className="input" style={{ maxWidth: 240 }} type="search" placeholder="Buscar invitado o regalo…" value={query} onChange={e => setQuery(e.target.value)} />
            <label style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', fontSize: '0.85rem' }}>
              <input type="checkbox" checked={onlyPending} onChange={e => setOnlyPending(e.target.checked)} /> Solo sin confirmar
            </label>
            <span style={{ flex: 1 }} />
            <button className="btn btn-primary" onClick={() => setEditing({})}>+ Registrar regalo</button>
          </div>

          {error && <p className="form-error" style={{ margin: 0 }}>{error}</p>}
          {loading ? <p className="text-muted">Cargando…</p> : (
            <div className="admin-table-wrap" style={{ maxHeight: 360, overflow: 'auto' }}>
              <table className="admin-table">
                <thead><tr><th>Invitado</th><th>Regalo</th><th>Cant.</th><th>Estado</th><th>Mensaje</th><th></th></tr></thead>
                <tbody>
                  {visible.map(r => (
                    <tr key={r.id}>
                      <td><strong>{r.guest_name || r.invitation_name || '—'}</strong>
                        <div style={{ fontSize: '0.72rem', opacity: 0.55 }}>{r.reserved_at ? new Date(r.reserved_at.replace(' ', 'T') + 'Z').toLocaleDateString('es-CL') : ''}</div></td>
                      <td>{r.gift_name}<div style={{ fontSize: '0.72rem', opacity: 0.55 }}>{formatCLP((r.gift_price || 0) * (r.quantity || 1))}</div></td>
                      <td>{r.quantity}</td>
                      <td>
                        <button className={`tag ${r.confirmed_payment ? 'tag-accent' : 'tag-neutral'}`} style={{ cursor: 'pointer', border: 0 }} onClick={() => toggleConfirmed(r)} title="Cambiar estado del pago">
                          {r.confirmed_payment ? 'Confirmado' : 'Sin confirmar'}
                        </button>
                      </td>
                      <td style={{ maxWidth: 180, opacity: 0.75, fontSize: '0.8rem' }}>{r.congratulations_message || '—'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }} onClick={() => setEditing(r)}>Editar</button>
                        <button className="btn btn-ghost" style={{ fontSize: '0.8rem', color: '#b03e2c' }} onClick={() => remove(r)} onBlur={() => setArmDelete(null)}>
                          {armDelete === r.id ? '¿Seguro?' : 'Eliminar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visible.length === 0 && <p style={{ textAlign: 'center', padding: '1.25rem', opacity: 0.5 }}>{rows.length ? 'Nada coincide con el filtro.' : 'Todavía no hay regalos registrados.'}</p>}
            </div>
          )}
        </div>
      )}

      {editing && (
        <RecordForm
          record={editing} trips={trips} invitations={invitations} call={call}
          onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await refresh() }}
        />
      )}
    </div>
  )
}

function RecordForm({ record, trips, invitations, call, onClose, onSaved }) {
  const isNew = !record.id
  const [invitationId, setInvitationId] = useState(record.invitation_id ?? '')
  const [giftId, setGiftId] = useState(record.gift_id ?? '')
  const [quantity, setQuantity] = useState(record.quantity ?? 1)
  const [confirmed, setConfirmed] = useState(isNew ? true : !!record.confirmed_payment)
  const [message, setMessage] = useState(record.congratulations_message || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const people = useMemo(() => [...invitations].sort((a, b) => a.name.localeCompare(b.name, 'es')), [invitations])

  async function submit(e) {
    e.preventDefault()
    if (!invitationId || !giftId) { setError('Elige un invitado y un regalo.'); return }
    setSaving(true); setError('')
    try {
      const body = { invitation_id: Number(invitationId), gift_id: giftId, quantity, confirmed_payment: confirmed, congratulations_message: message }
      if (isNew) await call('POST', body)
      else await call('PUT', { id: record.id, gift_id: giftId, quantity, confirmed_payment: confirmed, congratulations_message: message })
      await onSaved()
    } catch (err) { setError(err.message); setSaving(false) }
  }

  return (
    <AdminModal title={isNew ? 'Registrar regalo' : 'Editar regalo'} onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'grid', gap: '0.9rem' }}>
        <div>
          <label className="form-label" htmlFor="gr-inv">Invitado</label>
          <select id="gr-inv" className="input" value={invitationId} onChange={e => setInvitationId(e.target.value)} disabled={!isNew}>
            <option value="">Elige…</option>
            {people.map(p => <option key={p.id} value={p.id}>{p.name}{p.companion_name ? ` y ${p.companion_name}` : ''}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label" htmlFor="gr-gift">Regalo</label>
          <select id="gr-gift" className="input" value={giftId} onChange={e => setGiftId(e.target.value)}>
            <option value="">Elige…</option>
            {trips.map(t => (
              <optgroup key={t.id} label={t.name}>
                {t.gifts.map(g => <option key={g.id} value={g.id}>{g.name} {g.price != null ? `· ${formatCLP(g.price)}` : ''}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label className="form-label" htmlFor="gr-qty">Cantidad</label>
            <input id="gr-qty" className="input" type="number" min="1" max="99" style={{ width: 90 }} value={quantity} onChange={e => setQuantity(e.target.value)} />
          </div>
          <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', paddingBottom: '0.5rem' }}>
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} /> Pago confirmado
          </label>
        </div>
        <div>
          <label className="form-label" htmlFor="gr-msg">Mensaje de felicitación (opcional)</label>
          <textarea id="gr-msg" className="input" rows={2} value={message} onChange={e => setMessage(e.target.value)} />
        </div>
        {error && <p className="form-error" role="alert" style={{ margin: 0 }}>{error}</p>}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </AdminModal>
  )
}
