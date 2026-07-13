import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'

function formatCLP(n) {
  if (n == null) return '—'
  return `$${Number(n).toLocaleString('es-CL')}`
}

export default function GiftsDashboard() {
  const { token } = useApp()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/gifts', { headers: { 'X-Invite-Token': token } })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError('Error al cargar.'); setLoading(false) })
  }, [token])

  if (loading) return <p className="text-muted">Cargando...</p>
  if (error) return <p className="form-error">{error}</p>

  const { gifts = [], summary = {} } = data || {}

  return (
    <div>
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
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Regalo</th>
              <th>Destino</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Reservado por</th>
              <th>Pago</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {gifts.map(g => (
              <tr key={g.gift_id}>
                <td><strong>{g.gift_name}</strong></td>
                <td style={{ opacity: 0.7 }}>{g.trip_name}</td>
                <td style={{ color: 'var(--color-accent)' }}>{formatCLP(g.price)}</td>
                <td>
                  {g.reservation_id
                    ? <span className="tag tag-accent">Reservado</span>
                    : <span className="tag tag-neutral">Disponible</span>}
                </td>
                <td>{g.guest_name || '—'}</td>
                <td>
                  {g.reservation_id
                    ? g.confirmed_payment
                      ? <span title="Pago confirmado">✓</span>
                      : <span style={{ opacity: 0.4 }}>—</span>
                    : '—'}
                </td>
                <td style={{ opacity: 0.55, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                  {g.reserved_at ? new Date(g.reserved_at).toLocaleDateString('es-CL') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
