import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { downloadInvitationPDF } from '../../utils/invitationPdf.js'

export default function InvitationsManager() {
  const { token, content } = useApp()
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newIsAdmin, setNewIsAdmin] = useState(false)
  const [newWelcomeMsg, setNewWelcomeMsg] = useState('')
  const [newMaxGuests, setNewMaxGuests] = useState('')
  const [creating, setCreating] = useState(false)

  // Success state after creating an invitation
  const [createdInv, setCreatedInv] = useState(null)

  // Inline edit for personalization
  const [editId, setEditId] = useState(null)
  const [editWelcomeMsg, setEditWelcomeMsg] = useState('')
  const [editMaxGuests, setEditMaxGuests] = useState('')
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
          isAdmin: newIsAdmin,
          welcomeMessage: newWelcomeMsg.trim(),
          maxAdditionalGuests: newMaxGuests !== '' ? Number(newMaxGuests) : null,
        }),
      })
      if (res.ok) {
        const inv = await res.json()
        setInvitations(prev => [inv, ...prev])
        setCreatedInv({ ...inv, welcome_message: newWelcomeMsg.trim() || null })
        setNewName(''); setNewEmail(''); setNewIsAdmin(false)
        setNewWelcomeMsg(''); setNewMaxGuests(''); setShowCreate(false)
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

  function getLink(inv) {
    return `${window.location.origin}/?token=${inv.token}`
  }

  function copyLink(inv) {
    navigator.clipboard.writeText(getLink(inv)).then(() => {
      setCopiedId(inv.id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  function startEdit(inv) {
    setEditId(inv.id)
    setEditWelcomeMsg(inv.welcome_message || '')
    setEditMaxGuests(inv.max_additional_guests != null ? String(inv.max_additional_guests) : '')
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
        }),
      })
      if (res.ok) {
        setInvitations(prev => prev.map(i => i.id === id
          ? { ...i, welcome_message: editWelcomeMsg.trim() || null, max_additional_guests: editMaxGuests !== '' ? Number(editMaxGuests) : null }
          : i
        ))
        setEditId(null)
      } else { setError('Error al guardar.') }
    } catch { setError('Error de conexión.') }
    finally { setEditSaving(false) }
  }

  const total = invitations.length
  const admins = invitations.filter(i => i.is_admin).length

  return (
    <div>
      {/* Success modal after creation */}
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
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  navigator.clipboard.writeText(getLink(createdInv))
                  setCopiedId('new')
                  setTimeout(() => setCopiedId(null), 2000)
                }}
              >
                {copiedId === 'new' ? '✓ Copiado' : 'Copiar enlace'}
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => downloadInvitationPDF(createdInv, content)}
              >
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

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="btn btn-primary" onClick={() => setShowCreate(s => !s)}>
          {showCreate ? 'Cancelar' : '+ Nueva invitación'}
        </button>
      </div>

      {showCreate && (
        <form className="create-form" onSubmit={handleCreate}>
          <div className="create-form-title">Nueva invitación</div>
          <div className="create-form-fields">
            <input className="input" placeholder="Nombre *" value={newName} onChange={e => setNewName(e.target.value)} required />
            <input className="input" placeholder="Email (opcional)" value={newEmail} onChange={e => setNewEmail(e.target.value)} type="email" />
            <label className="admin-checkbox-label">
              <input type="checkbox" checked={newIsAdmin} onChange={e => setNewIsAdmin(e.target.checked)} />
              Admin
            </label>
          </div>
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label className="form-label">Mensaje de bienvenida personalizado (opcional)</label>
              <textarea
                className="input" rows={2}
                placeholder="ej. ¡Familia querida! Los esperamos con mucho amor..."
                value={newWelcomeMsg}
                onChange={e => setNewWelcomeMsg(e.target.value)}
              />
            </div>
            <div style={{ minWidth: 140 }}>
              <label className="form-label">Máx. acompañantes (opcional)</label>
              <input
                className="input" type="number" min="0" max="20"
                placeholder="Sin límite"
                value={newMaxGuests}
                onChange={e => setNewMaxGuests(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
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
                <th>Nombre</th>
                <th>Email</th>
                <th>Tipo</th>
                <th>RSVP</th>
                <th>Personalización</th>
                <th>Enlace</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invitations.map(inv => (
                <tr key={inv.id}>
                  <td><strong>{inv.name}</strong></td>
                  <td style={{ opacity: 0.7 }}>{inv.email || '—'}</td>
                  <td>
                    {inv.is_admin
                      ? <span className="tag tag-accent">Admin</span>
                      : <span className="tag tag-neutral">Invitado</span>}
                  </td>
                  <td>
                    {inv.attending === null || inv.attending === undefined
                      ? <span style={{ opacity: 0.4 }}>Sin respuesta</span>
                      : inv.attending
                        ? <span className="tag tag-accent">Asiste ({inv.num_guests})</span>
                        : <span className="tag tag-neutral">No asiste</span>}
                  </td>
                  <td>
                    {editId === inv.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: 220 }}>
                        <textarea
                          className="input" rows={2} style={{ fontSize: '0.8rem' }}
                          placeholder="Mensaje de bienvenida..."
                          value={editWelcomeMsg}
                          onChange={e => setEditWelcomeMsg(e.target.value)}
                        />
                        <input
                          className="input" type="number" min="0" max="20"
                          placeholder="Máx. acompañantes (vacío = sin límite)"
                          style={{ fontSize: '0.8rem' }}
                          value={editMaxGuests}
                          onChange={e => setEditMaxGuests(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          <button className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '3px 8px' }} onClick={() => saveEdit(inv.id)} disabled={editSaving}>
                            {editSaving ? '...' : 'Guardar'}
                          </button>
                          <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '3px 8px' }} onClick={() => setEditId(null)}>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.75rem', opacity: inv.welcome_message ? 1 : 0.35 }}>
                          {inv.welcome_message ? '✓ Personalizada' : 'Estándar'}
                          {inv.max_additional_guests != null ? ` · máx ${inv.max_additional_guests}` : ''}
                        </span>
                        <button className="btn btn-ghost" style={{ fontSize: '0.7rem', padding: '2px 6px' }} onClick={() => startEdit(inv)}>
                          Editar
                        </button>
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="token-cell">
                      <span className="token-badge">{inv.token}</span>
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: '0.75rem', padding: '2px 6px' }}
                        onClick={() => copyLink(inv)}
                        title="Copiar enlace"
                      >
                        {copiedId === inv.id ? '✓' : 'Copiar'}
                      </button>
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: '0.75rem', padding: '2px 6px' }}
                        onClick={() => downloadInvitationPDF(inv, content)}
                        title="Descargar PDF"
                      >
                        PDF
                      </button>
                    </div>
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost"
                      style={{ color: '#c0392b', fontSize: '0.75rem' }}
                      onClick={() => handleDelete(inv.id)}
                    >
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
