import { useState, useEffect } from 'react'
import InvitationsManager from './InvitationsManager'
import RSVPDashboard from './RSVPDashboard'
import GiftsDashboard from './GiftsDashboard'
import ContentEditor from './ContentEditor'
import StoryManager from './StoryManager'
import VenuePhotosManager from './VenuePhotosManager'

const TABS = [
  { id: 'invitations', label: 'Invitaciones' },
  { id: 'rsvp', label: 'RSVP' },
  { id: 'gifts', label: 'Regalos' },
  { id: 'story', label: 'Historia' },
  { id: 'venue', label: 'Lugar' },
  { id: 'content', label: 'Contenido' },
]

export default function AdminPanel({ onClose }) {
  const [tab, setTab] = useState('invitations')

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="admin-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="admin-panel" role="dialog" aria-modal="true" aria-label="Panel de administración">
        <div className="admin-header">
          <h2>Panel de administración</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

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
          {tab === 'invitations' && <InvitationsManager />}
          {tab === 'rsvp' && <RSVPDashboard />}
          {tab === 'gifts' && <GiftsDashboard />}
          {tab === 'story' && <StoryManager />}
          {tab === 'venue' && <VenuePhotosManager />}
          {tab === 'content' && <ContentEditor />}
        </div>
      </div>
    </div>
  )
}
