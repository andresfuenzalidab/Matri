import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'

export default function InvitationsManager() {
  const { token } = useApp()
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newIsAdmin, setNewIsAdmin] = useState(false)
  const [creating, setCreating] = useState(false)

  // Copy feedback
  const [copiedId, setCopiedId] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/invitations', {
        headers: { 'X-Invite-Token': token }
      })
      if (res.ok) setInvitations(await res.json())
      else setError('No se pudieron cargar las invitaciones.')
    } catch {
      setError('Error de conexión.')
    } finally {
      setLoading(false)
    }
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
        body: JSON.stringify({ name: newName.trim(), email: newEmail.trim(), isAdmin: newIsAdmin }),
      })
      if (res.ok) {
        const inv = await res.json()
        setInvitations(prev => [inv, ...prev])
        setNewName(''); setNewEmail(''); setNewIsAdmin(false); setShowCreate(false)
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'Error al crear invitación.')
      }
    } catch {
      setError('Error de conexión.')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar esta invitación? Se borrará también su RSVP y reserva de regalo.')) return
    try {
      const res = await fetch(`/api/admin/invitations?id=${id}`, {
        method: 'DELETE',
        headers: { 'X-Invite-Token': token }
      })
      if (res.ok) setInvitations(prev => prev.filter(i => i.id !== id))
    } catch {
      setError('Error al eliminar.')
    }
  }

  function copyLink(inv) {
    const url = `${window.location.origin}/?token=${inv.token}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(inv.id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const total = invitations.length
  const admins = invitations.filter(i => i.is_admin).length

  return (
    <div>
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
            <input
              className="input" placeholder="Nombre *" value={newName}
              onChange={e => setNewName(e.target.value)} required
            />
            <input
              className="input" placeholder="Email (opcional)" value={newEmail}
              onChange={e => setNewEmail(e.target.value)} type="email"
            />
            <label className="admin-checkbox-label">
              <input type="checkbox" checked={newIsAdmin} onChange={e => setNewIsAdmin(e.target.checked)} />
              Admin
            </label>
            <button className="btn btn-primary" type="submit" disabled={creating || !newName.trim()}>
              {creating ? 'Creando...' : 'Crear'}
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
