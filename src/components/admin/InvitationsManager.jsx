import { useState, useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { downloadInvitationPDF, inviteLink } from '../../utils/invitationPdf.js'
import { downloadCSV } from '../../utils/exportCsv.js'
import { parseCSV, cell } from '../../utils/parseCsv.js'
import { totalInvitedHeadcount } from '../../utils/inviteCount.js'
import { guestDisplayName, isPairInvite, pick } from '../../utils/guestName.js'

// The single source of truth for the invitations CSV shape — used for both
// export and import, so a file downloaded here always re-imports cleanly.
// The RSVP/Regalos columns are guest-driven data: exported for context, but
// read-only — importing never writes them back.
const INVITATION_HEADERS = [
  'Token', 'Nombre', 'Apodo', 'Acompañante', 'Email', 'Teléfono', 'Tipo',
  'Máx acompañantes', 'Admin', 'Mensaje de bienvenida', 'Nota interna', 'Enviado',
  'Creada',
  'RSVP Asistencia', 'RSVP N° personas', 'RSVP Asistentes', 'RSVP Email',
  'RSVP Restricción alimenticia', 'RSVP Mensaje', 'RSVP Fecha respuesta',
  'Regalos', 'Total regalos (CLP)', 'Regalos mensajes',
]

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
  const [newCompanion, setNewCompanion] = useState('')
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
  const [editCompanion, setEditCompanion] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const [copiedId, setCopiedId] = useState(null)
  const [selected, setSelected] = useState(() => new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // CSV import/export
  const importFileRef = useRef(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)

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
          companionName: newCompanion.trim(),
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
        setNewCompanion(''); setNewIsAdmin(false); setNewWelcomeMsg('')
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
      if (res.ok) {
        setInvitations(prev => prev.filter(i => i.id !== id))
        setSelected(prev => { const next = new Set(prev); next.delete(id); return next })
      }
    } catch { setError('Error al eliminar.') }
  }

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelected(prev =>
      prev.size === invitations.length ? new Set() : new Set(invitations.map(i => i.id))
    )
  }

  async function handleBulkDelete() {
    const ids = Array.from(selected)
    if (!ids.length) return
    if (!window.confirm(`¿Eliminar ${ids.length} invitación${ids.length > 1 ? 'es' : ''}? Se borrará también su RSVP y reserva de regalo.`)) return
    setBulkDeleting(true)
    try {
      const res = await fetch(`/api/admin/invitations?ids=${ids.join(',')}`, {
        method: 'DELETE', headers: { 'X-Invite-Token': token }
      })
      if (res.ok) {
        setInvitations(prev => prev.filter(i => !selected.has(i.id)))
        setSelected(new Set())
      } else {
        setError('No se pudieron eliminar las invitaciones seleccionadas.')
      }
    } catch { setError('Error al eliminar.') }
    finally { setBulkDeleting(false) }
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
    return inviteLink(inv, content)
  }

  function copyLink(inv) {
    navigator.clipboard.writeText(getLink(inv)).then(() => {
      setCopiedId(inv.id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  // Draft message for the WhatsApp send below — edit the pieces here to
  // change the wording for everyone at once.
  //
  // `inv` from this admin list is shaped with the DB's own snake_case
  // columns (`companion_name`), not the camelCase `companionName` these
  // helpers (shared with the RSVP/cover greeting logic) expect — adapted
  // inline in `whatsappMessage` below rather than duplicating the
  // nickname/singular-vs-plural rules here a second time.
  function whatsappMessage(inv) {
    const guest = { name: inv.name, companionName: inv.companion_name, nickname: inv.nickname }
    const name = guestDisplayName(guest) // nickname if set, else the formal name(s)
    const pair = isPairInvite(guest)
    const p = (singular, plural) => pick(guest, singular, plural)

    return `¡Hola ${name}! 💛\n\n` +
      `Con mucha alegría ${p('te', 'les')} compartimos la invitación a nuestro matrimonio. ` +
      `${p('Te', 'Les')} dejamos el PDF adjunto para que ${p('lo guardes', 'lo guarden')}, ` +
      `y aquí ${p('puedes', 'pueden')} ver todos los detalles y confirmar ${p('tu', 'su')} asistencia:\n\n` +
      `${getLink(inv)}\n\n` +
      `¡Esperamos poder celebrar este día tan especial ${p('contigo', 'con ustedes')}!\n\n` +
      `Con cariño,\nCata & Andrés`
  }

  // Pre-fills the message (name + their own link) so there's nothing left
  // to type by hand — just attach the PDF (already downloaded via the
  // button next to this one) and hit send. WhatsApp's own share links
  // can't attach a file for you; that one step still has to be manual.
  function openWhatsApp(inv) {
    const digits = (inv.phone || '').replace(/\D/g, '')
    const text = encodeURIComponent(whatsappMessage(inv))
    window.open(`https://wa.me/${digits}?text=${text}`, '_blank', 'noopener')
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

  function exportInvitations() {
    downloadCSV('invitaciones.csv', invitations.map(inv => {
      const rsvp = inv.attending === null || inv.attending === undefined ? '' : inv.attending ? 'Sí' : 'No'
      const giftNames = inv.gifts?.map(g => g.quantity > 1 ? `${g.name} ×${g.quantity}` : g.name).join(' | ') || ''
      const giftTotal = inv.gifts?.reduce((s, g) => s + (g.price || 0) * (g.quantity || 1), 0) || 0
      const giftMessages = inv.gifts?.map(g => g.message).filter(Boolean).join(' | ') || ''
      return [
        inv.token,
        inv.name,
        inv.nickname || '',
        inv.companion_name || '',
        inv.email || '',
        inv.phone || '',
        inv.invitation_type === 'party_only' ? 'Solo fiesta' : 'Completa',
        inv.max_additional_guests ?? '',
        inv.is_admin ? 'Sí' : 'No',
        inv.welcome_message || '',
        inv.notes || '',
        inv.invitation_sent ? 'Sí' : 'No',
        inv.created_at || '',
        rsvp,
        inv.attending ? inv.num_guests : '',
        inv.rsvp_companion_name || '',
        inv.rsvp_email || '',
        inv.dietary_restriction || '',
        inv.rsvp_message || '',
        inv.submitted_at || '',
        giftNames,
        giftTotal > 0 ? giftTotal : '',
        giftMessages,
      ]
    }), INVITATION_HEADERS)
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)
    setError('')
    try {
      const text = await file.text()
      const parsed = parseCSV(text)
      const rows = parsed.map(r => ({
        token: cell(r, 'Token'),
        name: cell(r, 'Nombre'),
        nickname: cell(r, 'Apodo'),
        companionName: cell(r, 'Acompañante'),
        email: cell(r, 'Email'),
        phone: cell(r, 'Teléfono'),
        invitationType: cell(r, 'Tipo'),
        maxAdditionalGuests: cell(r, 'Máx acompañantes'),
        isAdmin: cell(r, 'Admin'),
        welcomeMessage: cell(r, 'Mensaje de bienvenida'),
        notes: cell(r, 'Nota interna'),
        invitationSent: cell(r, 'Enviado'),
      }))
      const res = await fetch('/api/admin/invitations-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({ rows }),
      })
      if (res.ok) {
        const result = await res.json()
        setImportResult(result)
        await load()
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'Error al importar el archivo.')
      }
    } catch {
      setError('No se pudo leer el archivo CSV.')
    } finally {
      setImporting(false)
      if (importFileRef.current) importFileRef.current.value = ''
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
    setEditCompanion(inv.companion_name || '')
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
          companionName: editCompanion.trim(),
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
          companion_name: editCompanion.trim() || null,
        } : i))
        setEditId(null)
      } else { setError('Error al guardar.') }
    } catch { setError('Error de conexión.') }
    finally { setEditSaving(false) }
  }

  // People invited, companions included — not just invitation rows.
  const total = totalInvitedHeadcount(invitations)
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

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {selected.size > 0 && (
          <button
            className="btn btn-ghost"
            style={{ color: '#c0392b', borderColor: 'rgba(192,57,43,0.4)' }}
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
          >
            {bulkDeleting ? 'Eliminando...' : `Eliminar seleccionados (${selected.size})`}
          </button>
        )}
        <button className="btn btn-ghost" onClick={exportInvitations}>
          Exportar CSV
        </button>
        <label className="btn btn-ghost" style={{ cursor: importing ? 'wait' : 'pointer' }}>
          {importing ? 'Importando...' : 'Importar CSV'}
          <input ref={importFileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }}
            onChange={handleImportFile} disabled={importing} />
        </label>
        <button className="btn btn-primary" onClick={() => setShowCreate(s => !s)}>
          {showCreate ? 'Cancelar' : '+ Nueva invitación'}
        </button>
      </div>

      {importResult && (
        <div className="create-form" style={{ marginBottom: '1rem' }}>
          <div className="create-form-title">Resultado de la importación</div>
          <p style={{ fontSize: '0.875rem', margin: 0 }}>
            {importResult.created} creada(s), {importResult.updated} actualizada(s)
            {importResult.errors.length > 0 ? `, ${importResult.errors.length} con error` : ''}.
          </p>
          {importResult.errors.length > 0 && (
            <ul style={{ fontSize: '0.8rem', color: '#c0392b', marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
              {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
          <button className="btn btn-ghost" style={{ marginTop: '0.5rem' }} onClick={() => setImportResult(null)}>Cerrar</button>
        </div>
      )}

      {showCreate && (
        <form className="create-form" onSubmit={handleCreate}>
          <div className="create-form-title">Nueva invitación</div>
          <div className="create-form-fields">
            <input className="input" placeholder="Nombre formal *" value={newName} onChange={e => setNewName(e.target.value)} required />
            <input className="input" placeholder="Nombre formal del acompañante (opcional)" value={newCompanion} onChange={e => setNewCompanion(e.target.value)} />
            <input className="input" placeholder="Apodo global (ej. Andrés y Cata)" value={newNickname} onChange={e => setNewNickname(e.target.value)} />
            <input className="input" placeholder="Email (opcional)" value={newEmail} onChange={e => setNewEmail(e.target.value)} type="email" />
            <input className="input" placeholder="Teléfono (opcional)" value={newPhone} onChange={e => setNewPhone(e.target.value)} type="tel" />
            <label className="admin-checkbox-label">
              <input type="checkbox" checked={newIsAdmin} onChange={e => setNewIsAdmin(e.target.checked)} />
              Admin
            </label>
          </div>
          <p style={{ fontSize: '0.72rem', opacity: 0.55, marginTop: '0.5rem', lineHeight: 1.6 }}>
            El <strong>apodo global</strong> se usa tal cual en todos los mensajes personalizados — escríbelo
            cubriendo a las dos personas si van juntas. Si lo dejas vacío se usan los nombres formales unidos con
            «y». El <strong>acompañante</strong> es lo que hace que los textos hablen en plural.
          </p>
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
                <th style={{ width: 32 }}>
                  <input
                    type="checkbox"
                    checked={invitations.length > 0 && selected.size === invitations.length}
                    ref={el => { if (el) el.indeterminate = selected.size > 0 && selected.size < invitations.length }}
                    onChange={toggleSelectAll}
                    title="Seleccionar todo"
                    style={{ width: 16, height: 16, accentColor: 'var(--color-accent)', cursor: 'pointer' }}
                  />
                </th>
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
                <tr key={inv.id} style={selected.has(inv.id) ? { background: 'rgba(182,130,53,0.08)' } : undefined}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(inv.id)}
                      onChange={() => toggleSelect(inv.id)}
                      style={{ width: 16, height: 16, accentColor: 'var(--color-accent)', cursor: 'pointer' }}
                    />
                  </td>
                  <td>
                    <strong>{inv.name}</strong>
                    {inv.nickname && (
                      <div style={{ fontSize: '0.75rem', opacity: 0.6, fontStyle: 'italic' }}>"{inv.nickname}"</div>
                    )}
                    {inv.companion_name && (
                      <div style={{ fontSize: '0.72rem', opacity: 0.6 }}>+ {inv.companion_name}</div>
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
                          placeholder="Apodo global (ej. Andrés y Cata)"
                          value={editNickname} onChange={e => setEditNickname(e.target.value)} />
                        <input className="input" style={{ fontSize: '0.8rem' }}
                          placeholder="Nombre formal del acompañante"
                          value={editCompanion} onChange={e => setEditCompanion(e.target.value)} />
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
                          onClick={() => openWhatsApp(inv)} title="Abrir WhatsApp con el mensaje y el link ya listos">
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
