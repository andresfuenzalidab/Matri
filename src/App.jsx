import { useState, useEffect, useRef } from 'react'
import { AppProvider } from './context/AppContext'
import { useScrollReveal } from './utils/useScrollReveal'
import Nav from './components/Nav'
import WelcomeModal from './components/WelcomeModal'
import MusicPlayer from './components/MusicPlayer'
import BackgroundVideoOverlay from './components/BackgroundVideoOverlay'
import Home from './components/sections/Home'
import CountdownSection from './components/sections/CountdownSection'
import WeddingInfo from './components/sections/WeddingInfo'
import OurStory from './components/sections/OurStory'
import RSVP from './components/sections/RSVP'
import Gifts from './components/sections/Gifts'
import Contact from './components/sections/Contact'
import AdminPanel from './components/admin/AdminPanel'

function getToken() {
  const fromUrl = new URLSearchParams(window.location.search).get('token')
  if (fromUrl) {
    sessionStorage.setItem('inviteToken', fromUrl)
    return fromUrl
  }
  return sessionStorage.getItem('inviteToken') || ''
}

function MainApp({ token, guest, rsvp, giftReservations }) {
  const [adminOpen, setAdminOpen] = useState(false)
  const [welcomed, setWelcomed] = useState(() => sessionStorage.getItem('welcomed') === '1')
  const musicPlayerRef = useRef(null)

  useScrollReveal(welcomed)

  function handleWelcomed() {
    sessionStorage.setItem('welcomed', '1')
    setWelcomed(true)
    musicPlayerRef.current?.tryPlay()
  }

  return (
    <AppProvider token={token} guest={guest} rsvp={rsvp} giftReservations={giftReservations}>
      {!welcomed && (
        <WelcomeModal guest={guest} onEnter={handleWelcomed} />
      )}

      <div style={{ opacity: welcomed ? 1 : 0, transition: 'opacity 0.5s ease', pointerEvents: welcomed ? 'auto' : 'none' }}>
        <Nav />
        <main>
          <Home />
          <CountdownSection />
          <WeddingInfo />
          <OurStory />
          <RSVP initialRsvp={rsvp} />
          <Gifts initialReservations={giftReservations} />
          <Contact />
        </main>
        {guest?.isAdmin && (
          <>
            <div className="admin-fab">
              <button className="btn btn-primary" onClick={() => setAdminOpen(true)}>⚙ Admin</button>
            </div>
            {adminOpen && <AdminPanel onClose={() => setAdminOpen(false)} />}
          </>
        )}
        <MusicPlayer welcomed={welcomed} playerRef={musicPlayerRef} />
        <BackgroundVideoOverlay />
      </div>
    </AppProvider>
  )
}

export default function App() {
  const [status, setStatus] = useState('loading')
  const [guest, setGuest] = useState(null)
  const [rsvp, setRsvp] = useState(null)
  const [giftReservations, setGiftReservations] = useState([])
  const token = getToken()

  useEffect(() => {
    if (!token) { setStatus('invalid'); return }
    fetch('/api/validate', { headers: { 'X-Invite-Token': token } })
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          setGuest(data.guest)
          setRsvp(data.rsvp)
          setGiftReservations(data.giftReservations || [])
          setStatus('valid')
        } else {
          setStatus('invalid')
        }
      })
      .catch(() => setStatus('invalid'))
  }, [token])

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
    <MainApp
      token={token}
      guest={guest}
      rsvp={rsvp}
      giftReservations={giftReservations}
    />
  )
}
