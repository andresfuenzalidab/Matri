import { useState } from 'react'

/**
 * Read-only tour of the admin panel, entirely self-contained — canned mock
 * data, no fetches, no token, no real auth. Reachable via `?demo_admin=1`
 * (see App.jsx), completely separate from the guest-side demo
 * (`?demo=completa`/`?demo=fiesta`) and from the real admin panel, which
 * still requires a real admin invitation to open.
 *
 * Deliberately NOT the real InvitationsManager/RSVPDashboard/GiftsDashboard
 * — those fetch and mutate real data internally, and reusing them here
 * would mean either wiring a parallel mock-data-injection path through
 * every one of them (a lot of surface for something that's read-only by
 * design) or risking a real network call slipping through on a public,
 * no-auth route. A smaller dedicated view, restyled with the same classes,
 * has neither risk.
 */

const DEMO_INVITATIONS = [
  { id: 1, name: 'María González', nickname: '', companion: '', type: 'Completa', admin: false, rsvp: 'Asiste (2)', gifts: '$45.000' },
  { id: 2, name: 'Juan Pérez', nickname: 'Juan y Sofía', companion: 'Sofía Pérez', type: 'Completa', admin: false, rsvp: 'Asiste (2)', gifts: '—' },
  { id: 3, name: 'Pedro Martínez', nickname: '', companion: '', type: 'Solo fiesta', admin: false, rsvp: 'No asiste', gifts: '—' },
  { id: 4, name: 'Andrés Fuenzalida', nickname: '', companion: '', type: 'Completa', admin: true, rsvp: 'Asiste (2)', gifts: '$120.000' },
  { id: 5, name: 'Camila Rojas', nickname: '', companion: '', type: 'Completa', admin: false, rsvp: 'Sin respuesta', gifts: '—' },
  { id: 6, name: 'Diego Soto', nickname: 'Diego y Valentina', companion: 'Valentina Soto', type: 'Solo fiesta', admin: false, rsvp: 'Asiste (2)', gifts: '$80.000' },
]

const DEMO_RESPONSES = DEMO_INVITATIONS.filter(i => i.rsvp !== 'Sin respuesta').map(i => ({
  name: i.nickname || i.name,
  attending: i.rsvp.startsWith('Asiste'),
  numGuests: i.rsvp.startsWith('Asiste') ? 2 : '—',
  companion: i.companion || '—',
  message: i.id === 1 ? '¡Los queremos mucho, no nos lo perderíamos!' : '—',
}))

const DEMO_GIVERS = [
  { name: 'Diego Soto', items: 'Cena romántica en Roma', total: '$80.000', message: '¡Que lo pasen increíble!' },
  { name: 'Andrés Fuenzalida', items: 'Buceo en Patagonia ×2', total: '$120.000', message: '' },
  { name: 'María González', items: 'Clase de cocina italiana', total: '$45.000', message: 'Con mucho cariño ♡' },
]

const DEMO_TRIPS = [
  { name: 'Luna de miel en Italia', gifts: [
    { name: 'Cena romántica en Roma', price: '$80.000', status: 'Reservado' },
    { name: 'Clase de cocina italiana', price: '$45.000', status: 'Reservado' },
    { name: 'Tour en góndola, Venecia', price: '$60.000', status: 'Disponible' },
  ] },
  { name: 'Aventura en Patagonia', gifts: [
    { name: 'Buceo en Patagonia ×2', price: '$120.000', status: 'Reservado' },
    { name: 'Trekking Torres del Paine', price: '$95.000', status: 'Disponible' },
  ] },
]

const totalPeople = DEMO_INVITATIONS.reduce((s, i) => s + (i.companion ? 2 : 1), 0)
const admins = DEMO_INVITATIONS.filter(i => i.admin).length
const withRsvp = DEMO_RESPONSES.length
const attending = DEMO_RESPONSES.filter(r => r.attending).length
const declined = DEMO_RESPONSES.filter(r => !r.attending).length

const TABS = [
  { id: 'invitations', label: 'Invitaciones' },
  { id: 'rsvp', label: 'RSVP' },
  { id: 'gifts', label: 'Regalos' },
]

function Stat({ number, label }) {
  return (
    <div className="stat-card">
      <span className="stat-number">{number}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

export default function DemoAdminPanel() {
  const [tab, setTab] = useState('invitations')

  return (
    <div className="admin-overlay">
      <div className="admin-panel" role="dialog" aria-modal="true" aria-label="Demostración del panel de administración">
        <div className="admin-header">
          <h2>Panel de administración (demo)</h2>
          <a className="btn btn-ghost btn-icon" href={window.location.pathname} aria-label="Salir de la demo">✕</a>
        </div>

        <p style={{ fontSize: '0.8rem', opacity: 0.65, padding: '0 1.25rem', margin: '0.5rem 0' }}>
          Estás viendo una demostración con datos de ejemplo, en modo solo lectura — nada de esto es real
          ni se puede editar aquí.
        </p>

        <div className="admin-tabs" role="tablist">
          {TABS.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`admin-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="admin-body">
          {tab === 'invitations' && (
            <div>
              <div className="stats-row">
                <Stat number={totalPeople} label="Invitados" />
                <Stat number={admins} label="Admins" />
                <Stat number={withRsvp} label="Con RSVP" />
                <Stat number="$245.000" label="Recibido (CLP)" />
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Nombre / Apodo</th>
                      <th>Tipo</th>
                      <th>RSVP</th>
                      <th>Regalos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_INVITATIONS.map(i => (
                      <tr key={i.id}>
                        <td>
                          <strong>{i.name}</strong>
                          {i.nickname && <div style={{ fontSize: '0.75rem', opacity: 0.6, fontStyle: 'italic' }}>"{i.nickname}"</div>}
                          {i.admin && <span className="tag tag-accent" style={{ fontSize: '0.65rem' }}>Admin</span>}
                        </td>
                        <td><span className={`tag ${i.type === 'Solo fiesta' ? 'tag-neutral' : 'tag-accent'}`} style={{ fontSize: '0.65rem' }}>{i.type}</span></td>
                        <td>{i.rsvp === 'Sin respuesta' ? <span style={{ opacity: 0.4 }}>{i.rsvp}</span> : i.rsvp}</td>
                        <td>{i.gifts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'rsvp' && (
            <div>
              <div className="stats-row">
                <Stat number={totalPeople} label="Invitados" />
                <Stat number={withRsvp} label="Con RSVP" />
                <Stat number={attending} label="Confirman" />
                <Stat number={declined} label="No asisten" />
                <Stat number={DEMO_INVITATIONS.length - withRsvp} label="Sin respuesta" />
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Asistencia</th>
                      <th>Quiénes asisten</th>
                      <th>Mensaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_RESPONSES.map((r, i) => (
                      <tr key={i}>
                        <td><strong>{r.name}</strong></td>
                        <td>{r.attending ? <span className="tag tag-accent">Sí</span> : <span className="tag tag-neutral">No</span>}</td>
                        <td style={{ opacity: 0.75 }}>{r.companion}</td>
                        <td style={{ opacity: 0.75, maxWidth: 220 }}>{r.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'gifts' && (
            <div>
              <div className="stats-row">
                <Stat number="5" label="Total regalos" />
                <Stat number="3" label="Reservados" />
                <Stat number="2" label="Disponibles" />
                <Stat number="$245.000" label="Total recibido" />
              </div>

              <div className="create-form" style={{ marginBottom: '1.5rem' }}>
                <div className="create-form-title">Quién ha regalado ({DEMO_GIVERS.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {DEMO_GIVERS.map((g, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', paddingBottom: '0.6rem', borderBottom: '1px solid var(--color-neutral-200)' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: '0.9rem' }}>{g.name}</strong>
                        <div style={{ fontSize: '0.78rem', opacity: 0.7 }}>{g.items}</div>
                        {g.message && <div style={{ fontSize: '0.75rem', opacity: 0.6, fontStyle: 'italic', marginTop: '0.15rem' }}>"{g.message}"</div>}
                      </div>
                      <strong style={{ color: 'var(--color-accent)', whiteSpace: 'nowrap', fontSize: '0.9rem' }}>{g.total}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {DEMO_TRIPS.map((trip, i) => (
                  <div key={i} style={{ border: '1px solid var(--color-divider)', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ padding: '0.75rem 1rem', background: 'var(--color-neutral-100)' }}>
                      <strong style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem' }}>{trip.name}</strong>
                    </div>
                    <div>
                      {trip.gifts.map((g, gi) => (
                        <div key={gi} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 1rem', borderTop: '1px solid var(--color-neutral-200)' }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{g.name}</span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--color-accent)', marginLeft: '0.5rem' }}>{g.price}</span>
                          </div>
                          <span className={`tag ${g.status === 'Reservado' ? 'tag-accent' : 'tag-neutral'}`} style={{ fontSize: '0.65rem' }}>{g.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
