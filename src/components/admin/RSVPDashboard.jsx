import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { downloadCSV } from '../../utils/exportCsv.js'

export default function RSVPDashboard() {
  const { token } = useApp()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/rsvp', { headers: { 'X-Invite-Token': token } })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError('Error al cargar.'); setLoading(false) })
  }, [token])

  if (loading) return <p className="text-muted">Cargando...</p>
  if (error) return <p className="form-error">{error}</p>

  const { responses = [], summary = {} } = data || {}
  const noResponse = (summary.total || 0) - (summary.attending || 0) - (summary.declined || 0)

  return (
    <div>
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-number">{summary.total ?? 0}</span>
          <span className="stat-label">Invitados</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{summary.attending ?? 0}</span>
          <span className="stat-label">Confirman</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{summary.totalGuests ?? 0}</span>
          <span className="stat-label">Total personas</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{summary.declined ?? 0}</span>
          <span className="stat-label">No asisten</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{noResponse}</span>
          <span className="stat-label">Sin respuesta</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
        <button
          className="btn btn-ghost"
          onClick={() => downloadCSV('rsvp.csv',
            responses.map(r => [
              r.guest_name,
              r.attending ? 'Sí' : 'No',
              r.attending ? r.num_guests : '',
              r.companion_name || '',
              r.dietary_restriction || '',
              r.message || '',
              r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('es-CL') : '',
            ]),
            ['Nombre', 'Asistencia', 'N° invitados', 'Acompañante', 'Restricción alimenticia', 'Mensaje', 'Enviado']
          )}
        >
          Exportar CSV
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Asistencia</th>
              <th>Invitados</th>
              <th>Mensaje</th>
              <th>Restricción dieta</th>
              <th>Enviado</th>
            </tr>
          </thead>
          <tbody>
            {responses.map(r => (
              <tr key={r.id}>
                <td><strong>{r.guest_name}</strong></td>
                <td>
                  {r.attending
                    ? <span className="tag tag-accent">Sí</span>
                    : <span className="tag tag-neutral">No</span>}
                </td>
                <td>{r.attending ? r.num_guests : '—'}</td>
                <td style={{ maxWidth: 200, opacity: 0.75 }}>{r.message || '—'}</td>
                <td style={{ opacity: 0.75 }}>{r.dietary_restriction || '—'}</td>
                <td style={{ opacity: 0.55, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                  {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('es-CL') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {responses.length === 0 && (
          <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>
            Todavía no hay respuestas de RSVP.
          </p>
        )}
      </div>
    </div>
  )
}
