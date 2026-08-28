import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { downloadXLSX } from '../../utils/spreadsheet.js'
import { totalInvitedHeadcount } from '../../utils/inviteCount.js'
import { useInvitationFilters } from '../../hooks/useInvitationFilters.js'
import InvitationFilterBar from './InvitationFilterBar.jsx'

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

  useEffect(() => {
    fetch('/api/admin/invitations', { headers: { 'X-Invite-Token': token } })
      .then(r => r.json())
      .then(d => { setInvitations(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => { setError('Error al cargar.'); setLoading(false) })
  }, [token])

  const filters = useInvitationFilters(invitations)
  const visible = filters.visible

  if (loading) return <p className="text-muted">Cargando...</p>
  if (error) return <p className="form-error">{error}</p>

  const answered = i => i.attending !== null && i.attending !== undefined
  // Every stat below is computed from `visible` — the filtered set — so
  // each one moves as the filters change, per feedback ("el contador de
  // cada cosa cambie"). "Invitados" is a HEADCOUNT (companions included via
  // `totalInvitedHeadcount`), not a row count — a couple sharing one
  // invitation is 2 people, not 1.
  const totalPeople = totalInvitedHeadcount(visible)
  const admins = visible.filter(i => i.is_admin).length
  const withRsvp = visible.filter(answered).length
  const attending = visible.filter(i => answered(i) && i.attending).length
  const declined = visible.filter(i => answered(i) && !i.attending).length
  const noResponse = visible.length - withRsvp
  // Headcount of people actually coming, not invitation rows — same
  // "considerando los +1" distinction as Invitados above, but against
  // confirmed attendance (`num_guests`, filled in when they RSVP) instead
  // of the invitation's own cap.
  const totalGuests = visible.filter(i => answered(i) && i.attending).reduce((sum, i) => sum + (i.num_guests || 1), 0)

  // The table itself stays scoped to people who've actually responded —
  // this tab is a log of RSVP answers, not a second copy of the
  // invitations list — filtered the same way everything else above is.
  const responses = visible.filter(answered)

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
          <span className="stat-number">{totalGuests}</span>
          <span className="stat-label">Total personas</span>
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
          {filters.filtersActive ? `${responses.length} de ${invitations.filter(answered).length} respuestas` : `${responses.length} respuestas`}
        </span>
        <button
          className="btn btn-ghost"
          onClick={() => downloadXLSX('rsvp.xlsx',
            // Full (unfiltered) set of responses, deliberately — same "no
            // accidental partial export" choice as the other admin tabs.
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
              <th>Enviado</th>
            </tr>
          </thead>
          <tbody>
            {responses.map(i => (
              <tr key={i.id}>
                <td><strong>{i.name}</strong></td>
                <td>
                  {i.attending
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
              </tr>
            ))}
          </tbody>
        </table>
        {invitations.filter(answered).length === 0 && (
          <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>
            Todavía no hay respuestas de RSVP.
          </p>
        )}
        {invitations.filter(answered).length > 0 && responses.length === 0 && (
          <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>
            Ningún resultado coincide con los filtros. <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }} onClick={filters.clearFilters}>Limpiar filtros</button>
          </p>
        )}
      </div>
    </div>
  )
}
