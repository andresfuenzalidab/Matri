import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../../context/AppContext'
import { downloadXLSX } from '../../utils/spreadsheet.js'
import { totalInvitedHeadcount, invitedHeadcount } from '../../utils/inviteCount.js'
import { useInvitationFilters, compareByResponseRecency } from '../../hooks/useInvitationFilters.js'
import InvitationFilterBar from './InvitationFilterBar.jsx'
import RsvpEditor from './RsvpEditor.jsx'
import { guestPeople } from '../../utils/guestList.js'

const answered = i => i.attending !== null && i.attending !== undefined

/**
 * Splits a list of invitations into headcounts, not row counts — per
 * feedback, "confirman/no asisten/sin respuesta" must count PEOPLE
 * (companions included), and an invitation row can't just be assigned to
 * one bucket wholesale: a couple where only one half confirmed needs to
 * split across "confirman" (the one who is) and "no asisten" (the one who
 * isn't), not disappear or get double-counted. Every invited person lands
 * in exactly one bucket, so `confirming + notComing + noResponse` always
 * equals `totalInvitedHeadcount(list)`.
 */
function headcountBuckets(list) {
  let confirming = 0, notComing = 0, noResponse = 0
  for (const inv of list) {
    const capacity = invitedHeadcount(inv)
    if (!answered(inv)) {
      noResponse += capacity
    } else if (inv.attending) {
      // `num_guests` is the actually-confirmed count (partial-couple
      // RSVPs set this correctly, see RSVP.jsx) — whatever capacity is
      // left over is a companion who was never confirmed, which belongs
      // in "no asisten", not silently dropped from every count.
      const coming = inv.num_guests || 1
      confirming += coming
      notComing += Math.max(0, capacity - coming)
    } else {
      // A decline is for the whole party — RSVP.jsx doesn't have a
      // partial-decline path, so the full invited capacity isn't coming.
      notComing += capacity
    }
  }
  return { confirming, notComing, noResponse }
}

export default function RSVPDashboard() {
  const { token } = useApp()
  // Same full invitation list InvitationsManager uses (not the narrower
  // `/api/admin/rsvp`, which only ever returned people who'd already
  // responded) — needed so the filters (tipo, nota interna, enviado...) and
  // stats like "Sin respuesta" / "Admins" have something to filter/count
  // against for EVERY invitation, not just the ones with a submitted RSVP.
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Invitation being edited by hand (confirm / cancel on someone's behalf).
  const [editing, setEditing] = useState(null)
  // Export one row per person (a confirmation for 2 becomes 2 rows) instead of one per invitation.
  const [perPerson, setPerPerson] = useState(false)
  const [exporting, setExporting] = useState(false)

  const load = useCallback(() => {
    return fetch('/api/admin/invitations', { headers: { 'X-Invite-Token': token } })
      .then(r => r.json())
      .then(d => { setInvitations(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => { setError('Error al cargar.'); setLoading(false) })
  }, [token])
  useEffect(() => { load() }, [load])

  // Default order here is response recency (most recent first, no-response
  // last) — not the shared "preserve server order" InvitationsManager uses
  // — per feedback that this tab specifically should default to that, not
  // just offer it as one dropdown option among others.
  const filters = useInvitationFilters(invitations, { defaultSort: compareByResponseRecency })
  const visible = filters.visible

  if (loading) return <p className="text-muted">Cargando...</p>
  if (error) return <p className="form-error">{error}</p>

  // Every stat below is computed from `visible` — the filtered set — so
  // each one moves as the filters change, per feedback ("el contador de
  // cada cosa cambie"), and every one is a HEADCOUNT (companions included),
  // not an invitation-row count — per feedback, "hablar de invitación tipo
  // fila" isn't useful here. "Invitados" itself is the one exception in
  // spirit only: it's already been a headcount since it was introduced.
  const totalPeople = totalInvitedHeadcount(visible)
  const admins = visible.filter(i => i.is_admin).length
  const { confirming: attending, notComing: declined, noResponse } = headcountBuckets(visible)
  const withRsvp = attending + declined

  // The table shows every filtered invitation now, answered or not — it
  // used to only show responses, which meant applying, say, the "nota
  // interna" search here would silently hide anyone who hadn't RSVPed yet
  // instead of showing them as pending. `filters.visible` already carries
  // the response-recency-first, no-response-last order by default.
  const totalCount = invitations.length

  // "Apellido + Nombre" / "N° mesa" per confirmed person, table taken from the seating plan.
  async function exportPeople() {
    setExporting(true)
    try {
      let layout = null
      try {
        const res = await fetch('/api/admin/seating', { headers: { 'X-Invite-Token': token } })
        if (res.ok) layout = (await res.json()).layout
      } catch { /* no seating plan yet: tables stay empty */ }
      const { people } = guestPeople(invitations, layout)
      await downloadXLSX('rsvp-por-persona.xlsx',
        people.map(p => [p.name, p.tableText, p.party, p.dietary]),
        ['Apellido + Nombre', 'N° mesa', 'Invitación', 'Restricción alimenticia'])
    } finally { setExporting(false) }
  }

  return (
    <div>
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-number">{totalPeople}</span>
          <span className="stat-label">Invitados</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{admins}</span>
          <span className="stat-label">Admins</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{withRsvp}</span>
          <span className="stat-label">Con RSVP</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{attending}</span>
          <span className="stat-label">Confirman</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{declined}</span>
          <span className="stat-label">No asisten</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{noResponse}</span>
          <span className="stat-label">Sin respuesta</span>
        </div>
      </div>

      <InvitationFilterBar {...filters} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>
          {filters.filtersActive ? `${visible.length} de ${totalCount} invitaciones` : `${totalCount} invitaciones`}
        </span>
        <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.8rem', marginLeft: 'auto' }}
          title="Una fila por persona confirmada (si confirma por 2, salen 2 filas), con Apellido + Nombre y N° de mesa">
          <input type="checkbox" checked={perPerson} onChange={e => setPerPerson(e.target.checked)} /> Una fila por persona
        </label>
        <button
          className="btn btn-ghost"
          disabled={exporting}
          onClick={() => perPerson ? exportPeople() : downloadXLSX('rsvp.xlsx',
            // Full (unfiltered) set, deliberately — same "no accidental
            // partial export" choice as the other admin tabs. Still only
            // actual responses, not every invitation — this export is a
            // log of answers, same as it always was.
            invitations.filter(answered).map(i => [
              i.name,
              i.attending ? 'Sí' : 'No',
              i.attending ? i.num_guests : '',
              i.rsvp_companion_name || '',
              i.dietary_restriction || '',
              i.rsvp_message || '',
              i.submitted_at ? new Date(i.submitted_at).toLocaleDateString('es-CL') : '',
            ]),
            ['Nombre', 'Asistencia', 'N° invitados', 'Quiénes asisten', 'Restricción alimenticia', 'Mensaje', 'Enviado']
          )}
        >
          Exportar Excel
        </button>
      </div>

      {editing && (
        <RsvpEditor
          invitation={editing} token={token}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Asistencia</th>
              <th>Invitados</th>
              <th>Quiénes asisten</th>
              <th>Mensaje</th>
              <th>Restricción dieta</th>
              <th>Respondido</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map(i => (
              <tr key={i.id}>
                <td><strong>{i.name}</strong></td>
                <td>
                  {!answered(i)
                    ? <span style={{ opacity: 0.4 }}>Sin respuesta</span>
                    : i.attending
                      ? <span className="tag tag-accent">Sí</span>
                      : <span className="tag tag-neutral">No</span>}
                </td>
                <td>{i.attending ? i.num_guests : '—'}</td>
                <td style={{ opacity: 0.75 }}>{i.rsvp_companion_name || '—'}</td>
                <td style={{ maxWidth: 200, opacity: 0.75 }}>{i.rsvp_message || '—'}</td>
                <td style={{ opacity: 0.75 }}>{i.dietary_restriction || '—'}</td>
                <td style={{ opacity: 0.55, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                  {i.submitted_at ? new Date(i.submitted_at).toLocaleDateString('es-CL') : '—'}
                </td>
                <td>
                  <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }} onClick={() => setEditing(i)}>Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalCount === 0 && (
          <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>
            Todavía no hay invitaciones.
          </p>
        )}
        {totalCount > 0 && visible.length === 0 && (
          <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>
            Ningún resultado coincide con los filtros. <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }} onClick={filters.clearFilters}>Limpiar filtros</button>
          </p>
        )}
      </div>
    </div>
  )
}
