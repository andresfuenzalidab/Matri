import { useState, useEffect } from 'react'
import { AppProvider } from '../../context/AppContext'
import { installDemoAdminApi } from '../../utils/demoAdminApi.js'
import InvitationsManager from './InvitationsManager'
import RSVPDashboard from './RSVPDashboard'
import GiftsDashboard from './GiftsDashboard'

const TABS = [
  { id: 'invitations', label: 'Invitaciones' },
  { id: 'rsvp', label: 'RSVP' },
  { id: 'gifts', label: 'Regalos' },
]

/**
 * A fully interactive tour of the admin panel — crear/editar/eliminar
 * invitaciones y regalos, importar/exportar Excel, generar PDF, mandar el
 * WhatsApp (a números ficticios), todo — running the REAL
 * InvitationsManager/RSVPDashboard/GiftsDashboard components completely
 * unmodified, against an in-memory fake backend instead of the genuine
 * one. See `demoAdminApi.js` for how that interception works and why a
 * page refresh is what resets it (deliberately, per feedback — no "reset"
 * button needed).
 *
 * Reached from the demo chooser's own "Ver panel de administración" option
 * (`?demo=admin` too) — not from inside the guest view itself anymore
 * (that FAB button covered other on-page controls and is gone now); this
 * only ever renders standalone, with its own self-sufficient `AppProvider`
 * below, no guest view underneath it.
 *
 * PDF download / "Copiar enlace" / WhatsApp buttons in InvitationsManager
 * need no special handling at all here — they're pure client-side actions
 * (open a print window, build a `wa.me` link from the row's own data) that
 * never call `/api/admin/*`, so they already work against the fake
 * invitations exactly like they would against real ones.
 */
export default function DemoAdminPanel({ onClose }) {
  const [tab, setTab] = useState('invitations')
  // Gates the tabs below, not just a loading flag: React fires a CHILD's
  // effects before its parent's, so if InvitationsManager mounted straight
  // away, its own `load()` effect would fire (against the real, unpatched
  // `fetch`, erroring out — the exact bug this fixes) before the install
  // effect below ever got a chance to run. Not rendering the tabs at all
  // until `ready` is true means they don't mount — and so don't fire their
  // own effects — until the interceptor is already active.
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const uninstall = installDemoAdminApi()
    setReady(true)
    return uninstall
  }, [])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    // Same reserved guest-demo token as the tour itself (see `_auth.js`) —
    // not for auth (every call here is intercepted before it'd matter),
    // just so `AppProvider`'s own `/api/content` fetch (never intercepted,
    // it isn't an `/api/admin/*` call) succeeds and these components see
    // the site's real branding/copy instead of blank defaults.
    <AppProvider token="demo-completa" guest={null} rsvp={null}>
      <div className="admin-overlay">
        <div className="admin-panel" role="dialog" aria-modal="true" aria-label="Demostración del panel de administración">
          <div className="admin-header">
            <h2>Panel de administración (demo)</h2>
            <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Cerrar">✕</button>
          </div>

          <p style={{ fontSize: '0.8rem', opacity: 0.65, padding: '0 1.25rem', margin: '0.5rem 0' }}>
            Estás viendo una demostración con datos de ejemplo — puedes crear, editar y eliminar
            libremente. Nada de esto es real ni queda guardado: se reinicia al recargar la página.
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
            {!ready ? <p className="text-muted">Cargando...</p> : (
              <>
                {tab === 'invitations' && <InvitationsManager />}
                {tab === 'rsvp' && <RSVPDashboard />}
                {tab === 'gifts' && <GiftsDashboard />}
              </>
            )}
          </div>
        </div>
      </div>
    </AppProvider>
  )
}
