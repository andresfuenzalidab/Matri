import { useState, useEffect } from 'react'
import { AppProvider } from './context/AppContext'
import Nav from './components/Nav'
import WelcomeModal from './components/WelcomeModal'
import MusicPlayer from './components/MusicPlayer'
import Home from './components/sections/Home'
import WeddingInfo from './components/sections/WeddingInfo'
import OurStory from './components/sections/OurStory'
import RSVP from './components/sections/RSVP'
import Gifts from './components/sections/Gifts'
import AdminPanel from './components/admin/AdminPanel'

function getToken() {
  const fromUrl = new URLSearchParams(window.location.search).get('token')
  if (fromUrl) {
    sessionStorage.setItem('inviteToken', fromUrl)
    return fromUrl
  }
  return sessionStorage.getItem('inviteToken') || ''
}

export default function App() {
  const [status, setStatus] = useState('loading')
  const [guest, setGuest] = useState(null)
  const [rsvp, setRsvp] = useState(null)
  const [giftReservation, setGiftReservation] = useState(null)
  const [adminOpen, setAdminOpen] = useState(false)
  const [welcomed, setWelcomed] = useState(() => sessionStorage.getItem('welcomed') === '1')
  const token = getToken()

  useEffect(() => {
    if (!token) { setStatus('invalid'); return }
    fetch('/api/validate', { headers: { 'X-Invite-Token': token } })
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          setGuest(data.guest)
          setRsvp(data.rsvp)
          setGiftReservation(data.giftReservation)
          setStatus('valid')
        } else {
          setStatus('invalid')
        }
      })
      .catch(() => setStatus('invalid'))
  }, [token])

  function handleWelcomed() {
    sessionStorage.setItem('welcomed', '1')
    setWelcomed(true)
  }

  if (status === 'loading') {
    return <div className="loading"><span>Cargando...</span></div>
  }

  if (status === 'invalid') {
    return (
      <div className="access-denied">
        <div className="access-denied-monogram">A & C</div>
        <h1>Enlace no válido</h1>
        <p>Este enlace de invitación no es válido o ha expirado.<br />Contacta a los novios para recibir tu invitación.</p>
      </div>
    )
  }

  return (
    <AppProvider token={token} guest={guest} rsvp={rsvp} giftReservation={giftReservation}>
      {!welcomed && (
        <WelcomeModal guest={guest} onEnter={handleWelcomed} />
      )}

      <div style={{ opacity: welcomed ? 1 : 0, transition: 'opacity 0.4s ease', pointerEvents: welcomed ? 'auto' : 'none' }}>
        <Nav />
        <main>
          <Home />
          <WeddingInfo />
          <OurStory />
          <RSVP initialRsvp={rsvp} />
          <Gifts initialReservation={giftReservation} />
        </main>
        {guest?.isAdmin && (
          <>
            <div className="admin-fab">
              <button className="btn btn-primary" onClick={() => setAdminOpen(true)}>⚙ Admin</button>
            </div>
            {adminOpen && <AdminPanel onClose={() => setAdminOpen(false)} />}
          </>
        )}
        <MusicPlayer welcomed={welcomed} />
      </div>
    </AppProvider>
  )
}
