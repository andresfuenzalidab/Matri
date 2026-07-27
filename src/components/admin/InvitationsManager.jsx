import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { downloadInvitationPDF } from '../../utils/invitationPdf.js'
import { downloadCSV } from '../../utils/exportCsv.js'

export default function InvitationsManager() {
  const { token, content } = useApp()
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newNickname, setNewNickname] = useState('')
  const [newIsAdmin, setNewIsAdmin] = useState(false)
  const [newWelcomeMsg, setNewWelcomeMsg] = useState('')
  const [newMaxGuests, setNewMaxGuests] = useState('0')
  const [newInvType, setNewInvType] = useState('all_in')
  const [newNotes, setNewNotes] = useState('')
  const [creating, setCreating] = useState(false)

  const [createdInv, setCreatedInv] = useState(null)

  // Inline edit
  const [editId, setEditId] = useState(null)
  const [editWelcomeMsg, setEditWelcomeMsg] = useState('')
  const [editMaxGuests, setEditMaxGuests] = useState('')
  const [editInvType, setEditInvType] = useState('all_in')
  const [editNotes, setEditNotes] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editNickname, setEditNickname] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const [copiedId, setCopiedId] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/invitations', { headers: { 'X-Invite-Token': token } })
      if (res.ok) setInvitations(await res.json())
      else setError('No se pudieron cargar las invitaciones.')
    } catch { setError('Error de conexión.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim(),
          phone: newPhone.trim(),
          nickname: newNickname.trim(),
          isAdmin: newIsAdmin,
          welcomeMessage: newWelcomeMsg.trim(),
          maxAdditionalGuests: newMaxGuests !== '' ? Number(newMaxGuests) : null,
          invitationType: newInvType,
          notes: newNotes.trim(),
        }),
      })
      if (res.ok) {
        const inv = await res.json()
        setInvitations(prev => [inv, ...prev])
        setCreatedInv({ ...inv, welcome_message: newWelcomeMsg.trim() || null })
        setNewName(''); setNewEmail(''); setNewPhone(''); setNewNickname('')
        setNewIsAdmin(false); setNewWelcomeMsg('')
        setNewMaxGuests(''); setNewInvType('all_in'); setNewNotes('')
        setShowCreate(false)
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'Error al crear invitación.')
      }
    } catch { setError('Error de conexión.') }
    finally { setCreating(false) }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar esta invitación? Se borrará también su RSVP y reserva de regalo.')) return
    try {
      const res = await fetch(`/api/admin/invitations?id=${id}`, {
        method: 'DELETE', headers: { 'X-Invite-Token': token }
      })
      if (res.ok) setInvitations(prev => prev.filter(i => i.id !== id))
    } catch { setError('Error al eliminar.') }
  }

  async function handleResetRsvp(id) {
    if (!window.confirm('¿Borrar la respuesta RSVP de esta invitación?')) return
    try {
      const res = await fetch(`/api/admin/reset-rsvp?id=${id}`, {
        method: 'DELETE', headers: { 'X-Invite-Token': token }
      })
      if (res.ok) setInvitations(prev => prev.map(i => i.id === id ? { ...i, attending: null, num_guests: null, companion_name: null } : i))
    } catch { setError('Error al resetear RSVP.') }
  }

  async function handleResetGifts(id) {
    if (!window.confirm('¿Borrar las reservas de regalo de esta invitación?')) return
    try {
      const res = await fetch(`/api/admin/reset-gifts?id=${id}`, {
        method: 'DELETE', headers: { 'X-Invite-Token': token }
      })
      if (res.ok) setInvitations(prev => prev.map(i => i.id === id ? { ...i, gifts: [] } : i))
    } catch { setError('Error al resetear regalos.') }
  }

  function getLink(inv) {
    const base = (content.site_url || '').trim() || window.location.origin
    return `${base}/?token=${inv.token}`
  }

  function copyLink(inv) {
    navigator.clipboard.writeText(getLink(inv)).then(() => {
      setCopiedId(inv.id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  function openWhatsApp(phone) {
    const digits = phone.replace(/\D/g, '')
    window.open(`https://wa.me/${digits}`, '_blank', 'noopener')
  }

  async function toggleSent(inv) {
    const newVal = !inv.invitation_sent
    setInvitations(prev => prev.map(i => i.id === inv.id ? { ...i, invitation_sent: newVal } : i))
    try {
      await fetch('/api/admin/invitations-sent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({ id: inv.id, invitation_sent: newVal }),
      })
    } catch {
      setInvitations(prev => prev.map(i => i.id === inv.id ? { ...i, invitation_sent: !newVal } : i))
    }
  }

  function startEdit(inv) {
    setEditId(inv.id)
    setEditWelcomeMsg(inv.welcome_message || '')
    setEditMaxGuests(inv.max_additional_guests != null ? String(inv.max_additional_guests) : '')
    setEditInvType(inv.invitation_type || 'all_in')
    setEditNotes(inv.notes || '')
    setEditPhone(inv.phone || '')
    setEditNickname(inv.nickname || '')
  }

  async function saveEdit(id) {
    setEditSaving(true)
    try {
      const res = await fetch('/api/admin/invitations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({
          id,
          welcomeMessage: editWelcomeMsg.trim(),
          maxAdditionalGuests: editMaxGuests !== '' ? Number(editMaxGuests) : null,
          invitationType: editInvType,
          notes: editNotes.trim(),
          phone: editPhone.trim(),
          nickname: editNickname.trim(),
        }),
      })
      if (res.ok) {
        setInvitations(prev => prev.map(i => i.id === id ? {
          ...i,
          welcome_message: editWelcomeMsg.trim() || null,
          max_additional_guests: editMaxGuests !== '' ? Number(editMaxGuests) : null,
          invitation_type: editInvType,
          notes: editNotes.trim() || null,
          phone: editPhone.trim() || null,
          nickname: editNickname.trim() || null,
        } : i))
        setEditId(null)
      } else { setError('Error al guardar.') }
    } catch { setError('Error de conexión.') }
    finally { setEditSaving(false) }
  }

  const total = invitations.length
  const admins = invitations.filter(i => i.is_admin).length

  return (
    <div>
      {createdInv && (
        <div className="inv-success-overlay" onClick={e => e.target === e.currentTarget && setCreatedInv(null)}>
          <div className="inv-success-card">
            <div className="inv-success-header">
              <div>
                <div className="inv-success-check">✓</div>
                <h3>¡Invitación creada!</h3>
                <p style={{ opacity: 0.65, fontSize: '0.875rem' }}>Para <strong>{createdInv.name}</strong></p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setCreatedInv(null)}>✕</button>
            </div>
            <div className="inv-success-link-box">
              <div className="inv-success-link-label">Enlace personalizado</div>
              <div className="inv-success-link-url">{getLink(createdInv)}</div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }}
                onClick={() => { navigator.clipboard.writeText(getLink(createdInv)); setCopiedId('new'); setTimeout(() => setCopiedId(null), 2000) }}>
                {copiedId === 'new' ? '✓ Copiado' : 'Copiar enlace'}
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }}
                onClick={() => downloadInvitationPDF(createdInv, content)}>
                Descargar PDF
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', opacity: 0.5, textAlign: 'center', marginTop: '0.5rem' }}>
              El PDF se abrirá en una nueva pestaña — guárdalo con "Imprimir → Guardar como PDF"
            </p>
          </div>
        </div>
      )}

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-number">{total}</span>
          <span className="stat-label">Invitados</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{admins}</span>
          <span className="stat-label">Admins</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{invitations.filter(i => i.attending !== null && i.attending !== undefined).length}</span>
          <span className="stat-label">Con RSVP</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '1rem' }}>
        <button
          className="btn btn-ghost"
          onClick={() => downloadCSV('invitaciones.csv',
            invitations.map(inv => {
              const rsvp = inv.attending === null || inv.attending === undefined ? '' : inv.attending ? 'Sí' : 'No'
              const giftNames = inv.gifts?.map(g => g.quantity > 1 ? `${g.name} ×${g.quantity}` : g.name).join(' | ') || ''
              const giftTotal = inv.gifts?.reduce((s, g) => s + (g.price || 0) * (g.quantity || 1), 0) || 0
              return [
                inv.name,
                inv.nickname || '',
                inv.email || '',
                inv.phone || '',
                inv.invitation_type === 'party_only' ? 'Solo fiesta' : 'Completa',
                rsvp,
                inv.attending ? inv.num_guests : '',
                giftNames,
                giftTotal > 0 ? giftTotal : '',
                inv.token,
              ]
            }),
            ['Nombre', 'Apodo', 'Email', 'Teléfono', 'Tipo', 'RSVP', 'N° personas', 'Regalos', 'Total regalos (CLP)', 'Token']
          )}
        >
          Exportar CSV
        </button>
        <button className="btn btn-primary" onClick={() => setShowCreate(s => !s)}>
          {showCreate ? 'Cancelar' : '+ Nueva invitación'}
        </button>
      </div>

      {showCreate && (
        <form className="create-form" onSubmit={handleCreate}>
          <div className="create-form-title">Nueva invitación</div>
          <div className="create-form-fields">
            <input className="input" placeholder="Nombre formal *" value={newName} onChange={e => setNewName(e.target.value)} required />
            <input className="input" placeholder="Apodo (nombre informal, opcional)" value={newNickname} onChange={e => setNewNickname(e.target.value)} />
            <input className="input" placeholder="Email (opcional)" value={newEmail} onChange={e => setNewEmail(e.target.value)} type="email" />
            <input className="input" placeholder="Teléfono (opcional)" value={newPhone} onChange={e => setNewPhone(e.target.value)} type="tel" />
            <label className="admin-checkbox-label">
              <input type="checkbox" checked={newIsAdmin} onChange={e => setNewIsAdmin(e.target.checked)} />
              Admin
            </label>
          </div>
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label className="form-label">Mensaje de bienvenida personalizado (opcional)</label>
              <textarea className="input" rows={2}
                placeholder="ej. ¡Familia querida! Los esperamos con mucho amor..."
                value={newWelcomeMsg} onChange={e => setNewWelcomeMsg(e.target.value)} />
            </div>
            <div style={{ minWidth: 140 }}>
              <label className="form-label">Máx. acompañantes (0 = solo, 1 = con pareja)</label>
              <input className="input" type="number" min="0" max="20"
                placeholder="Sin límite"
                value={newMaxGuests} onChange={e => setNewMaxGuests(e.target.value)}
                style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <label className="form-label">Tipo de invitación</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.3rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input type="radio" name="newInvType" value="all_in" checked={newInvType === 'all_in'} onChange={() => setNewInvType('all_in')} />
                Completa (ceremonia + fiesta)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input type="radio" name="newInvType" value="party_only" checked={newInvType === 'party_only'} onChange={() => setNewInvType('party_only')} />
                Solo fiesta
              </label>
            </div>
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <label className="form-label">Nota interna (solo visible en admin)</label>
            <input className="input" placeholder="ej. Amigos del novio - lado Fuenzalida"
              value={newNotes} onChange={e => setNewNotes(e.target.value)} />
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <button className="btn btn-primary" type="submit" disabled={creating || !newName.trim()}>
              {creating ? 'Creando...' : 'Crear y ver enlace'}
            </button>
          </div>
        </form>
      )}

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p className="text-muted">Cargando...</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre / Apodo</th>
                <th>Contacto</th>
                <th>Tipo</th>
                <th>RSVP</th>
                <th>Regalos</th>
                <th>Personalización</th>
                <th>Enlace</th>
                <th>Enviado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invitations.map(inv => (
                <tr key={inv.id}>
                  <td>
                    <strong>{inv.name}</strong>
                    {inv.nickname && (
                      <div style={{ fontSize: '0.75rem', opacity: 0.6, fontStyle: 'italic' }}>"{inv.nickname}"</div>
                    )}
                    {inv.is_admin && <span className="tag tag-accent" style={{ fontSize: '0.65rem', marginTop: 2 }}>Admin</span>}
                  </td>
                  <td style={{ opacity: 0.7, fontSize: '0.8rem' }}>
                    <div>{inv.email || '—'}</div>
                    {inv.phone && <div>{inv.phone}</div>}
                  </td>
                  <td>
                    <span className={`tag ${inv.invitation_type === 'party_only' ? 'tag-neutral' : 'tag-accent'}`} style={{ fontSize: '0.65rem' }}>
                      {inv.invitation_type === 'party_only' ? 'Solo fiesta' : 'Completa'}
                    </span>
                  </td>
                  <td>
                    {inv.attending === null || inv.attending === undefined
                      ? <span style={{ opacity: 0.4 }}>Sin respuesta</span>
                      : inv.attending
                        ? <span className="tag tag-accent">Asiste ({inv.num_guests})</span>
                        : <span className="tag tag-neutral">No asiste</span>}
                  </td>
                  <td style={{ fontSize: '0.78rem', maxWidth: 220 }}>
                    {inv.gifts?.length > 0 ? (() => {
                      const total = inv.gifts.reduce((s, g) => s + (g.price || 0) * (g.quantity || 1), 0)
                      const messages = inv.gifts.map(g => g.message).filter(Boolean)
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <span style={{ opacity: 0.75 }}>
                            {inv.gifts.map(g => g.quantity > 1 ? `${g.name} ×${g.quantity}` : g.name).join(', ')}
                          </span>
                          {total > 0 && (
                            <strong style={{ color: 'var(--color-accent)' }}>
                              ${Number(total).toLocaleString('es-CL')} CLP
                            </strong>
                          )}
                          {messages.length > 0 && (
                            <span style={{ opacity: 0.6, fontStyle: 'italic', fontSize: '0.72rem' }}>
                              "{messages.join(' / ')}"
                            </span>
                          )}
                        </div>
                      )
                    })() : <span style={{ opacity: 0.4 }}>—</span>}
                  </td>
                  <td>
                    {editId === inv.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: 220 }}>
                        <input className="input" style={{ fontSize: '0.8rem' }}
                          placeholder="Apodo / nombre informal"
                          value={editNickname} onChange={e => setEditNickname(e.target.value)} />
                        <input className="input" style={{ fontSize: '0.8rem' }}
                          placeholder="Teléfono"
                          value={editPhone} onChange={e => setEditPhone(e.target.value)} />
                        <textarea className="input" rows={2} style={{ fontSize: '0.8rem' }}
                          placeholder="Mensaje de bienvenida..."
                          value={editWelcomeMsg} onChange={e => setEditWelcomeMsg(e.target.value)} />
                        <input className="input" type="number" min="0" max="20"
                          placeholder="Máx. acompañantes (0 = solo, 1 = pareja)"
                          style={{ fontSize: '0.8rem' }}
                          value={editMaxGuests} onChange={e => setEditMaxGuests(e.target.value)} />
                        <input className="input" placeholder="Nota interna"
                          style={{ fontSize: '0.8rem' }}
                          value={editNotes} onChange={e => setEditNotes(e.target.value)} />
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', cursor: 'pointer' }}>
                            <input type="radio" name={`invType_${inv.id}`} value="all_in" checked={editInvType === 'all_in'} onChange={() => setEditInvType('all_in')} />
                            Completa
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', cursor: 'pointer' }}>
                            <input type="radio" name={`invType_${inv.id}`} value="party_only" checked={editInvType === 'party_only'} onChange={() => setEditInvType('party_only')} />
                            Solo fiesta
                          </label>
                        </div>
                        <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.25rem' }}>
                          <button className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '3px 8px' }} onClick={() => saveEdit(inv.id)} disabled={editSaving}>
                            {editSaving ? '...' : 'Guardar'}
                          </button>
                          <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '3px 8px' }} onClick={() => setEditId(null)}>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {inv.max_additional_guests != null && (
                            <span style={{ fontSize: '0.72rem', opacity: 0.55 }}>
                              máx {inv.max_additional_guests} acomp.
                            </span>
                          )}
                          <button className="btn btn-ghost" style={{ fontSize: '0.7rem', padding: '2px 6px' }} onClick={() => startEdit(inv)}>
                            Editar
                          </button>
                        </div>
                        {inv.welcome_message && (
                          <span style={{ fontSize: '0.72rem', opacity: 0.55 }}>✓ Mensaje personalizado</span>
                        )}
                        {inv.notes && (
                          <span style={{ fontSize: '0.72rem', opacity: 0.65, fontStyle: 'italic' }}>{inv.notes}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="token-cell">
                      <span className="token-badge">{inv.token}</span>
                      <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '2px 6px' }}
                        onClick={() => copyLink(inv)} title="Copiar enlace">
                        {copiedId === inv.id ? '✓' : 'Copiar'}
                      </button>
                      <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '2px 6px' }}
                        onClick={() => downloadInvitationPDF(inv, content)} title="Descargar PDF">
                        PDF
                      </button>
                      {inv.phone && (
                        <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '2px 6px', color: '#25D366' }}
                          onClick={() => openWhatsApp(inv.phone)} title="Abrir WhatsApp">
                          WA
                        </button>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(inv.invitation_sent)}
                      onChange={() => toggleSent(inv)}
                      title={inv.invitation_sent ? 'Enviado' : 'Marcar como enviado'}
                      style={{ width: 16, height: 16, accentColor: 'var(--color-accent)', cursor: 'pointer' }}
                    />
                  </td>
                  <td>
                    <button className="btn btn-ghost" style={{ color: '#c0392b', fontSize: '0.75rem' }}
                      onClick={() => handleDelete(inv.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {invitations.length === 0 && (
            <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>
              No hay invitaciones aún. Crea la primera.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
