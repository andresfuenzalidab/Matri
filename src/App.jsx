import { useState, useEffect, useRef, forwardRef } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { useScrollReveal } from './utils/useScrollReveal'
import Nav from './components/Nav'
import WelcomeModal from './components/WelcomeModal'
import MusicPlayer from './components/MusicPlayer'
import Home from './components/sections/Home'
import CountdownSection from './components/sections/CountdownSection'
import WeddingInfo from './components/sections/WeddingInfo'
import OurStory from './components/sections/OurStory'
import RSVP from './components/sections/RSVP'
import Gifts from './components/sections/Gifts'
import Contact from './components/sections/Contact'
import AdminPanel from './components/admin/AdminPanel'
import { BotanicalDivider, FloralFooter, SmallRoseSpray } from './components/Botanical'

function getToken() {
  const fromUrl = new URLSearchParams(window.location.search).get('token')
  if (fromUrl) {
    sessionStorage.setItem('inviteToken', fromUrl)
    return fromUrl
  }
  return sessionStorage.getItem('inviteToken') || ''
}

// Rendered inside AppProvider so it can access useApp()
const SharedHeroVideo = forwardRef(function SharedHeroVideo({ onCanPlay }, ref) {
  const { get } = useApp()
  const src = get('hero_video') || '/hero.mp4'
  return (
    <video
      ref={ref}
      muted loop playsInline
      src={src}
      style={{
        position: 'fixed', inset: 0,
        width: '100%', height: '100%',
        objectFit: 'cover',
        zIndex: 0,
      }}
      onCanPlay={onCanPlay}
    />
  )
})

function MainApp({ token, guest, rsvp }) {
  const [adminOpen, setAdminOpen] = useState(false)
  const [welcomed, setWelcomed] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const isMpReturn = params.has('payment_id') || params.has('collection_id')
    const already = sessionStorage.getItem('welcomed') === '1' || isMpReturn
    if (already) {
      document.documentElement.classList.add('skip-reveal')
      sessionStorage.setItem('welcomed', '1')
    }
    return already
  })
  const [videoReady, setVideoReady] = useState(false)
  const heroVideoRef = useRef(null)
  const musicPlayerRef = useRef(null)

  useScrollReveal(welcomed)

  function handleVideoReady() {
    if (welcomed) heroVideoRef.current?.play().catch(() => {})
    setVideoReady(true)
  }

  function handleWelcomed() {
    sessionStorage.setItem('welcomed', '1')
    setWelcomed(true)
    heroVideoRef.current?.play().catch(() => {})
    musicPlayerRef.current?.tryPlay()
  }

  return (
    <AppProvider token={token} guest={guest} rsvp={rsvp}>
      {/* Single hero video — always in DOM, loads once */}
      <SharedHeroVideo ref={heroVideoRef} onCanPlay={handleVideoReady} />

      {/* Spinner until video is ready */}
      {!videoReady && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'var(--color-bg, #faf8f5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 36, height: 36,
            border: '3px solid rgba(0,0,0,0.1)',
            borderTopColor: 'var(--color-accent)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      )}

      {/* WelcomeModal — shown only once video is ready, no video inside */}
      {!welcomed && videoReady && (
        <WelcomeModal guest={guest} onEnter={handleWelcomed} />
      )}

      <div style={{
        position: 'relative', zIndex: 1,
        opacity: welcomed ? 1 : 0,
        transition: 'opacity 0.5s ease',
        pointerEvents: welcomed ? 'auto' : 'none',
      }}>
        <Nav />
        <main className="editorial-main">
          <Home />
          <div className="botanical-bridge">
            <BotanicalDivider style={{ margin: '0 auto' }}/>
          </div>
          <CountdownSection shouldPlay={welcomed} />
          <div className="botanical-bridge">
            <BotanicalDivider flip style={{ margin: '0 auto' }}/>
          </div>
          <WeddingInfo shouldPlay={welcomed} />
          <div className="botanical-bridge">
            <BotanicalDivider style={{ margin: '0 auto' }}/>
          </div>
          <OurStory />
          <div className="botanical-bridge">
            <BotanicalDivider flip style={{ margin: '0 auto' }}/>
          </div>
          <RSVP initialRsvp={rsvp} />
          <div className="botanical-bridge">
            <BotanicalDivider style={{ margin: '0 auto' }}/>
          </div>
          <Gifts />
          <div className="botanical-bridge">
            <FloralFooter style={{ margin: '0 auto' }}/>
          </div>
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
      </div>
    </AppProvider>
  )
}

export default function App() {
  const [status, setStatus] = useState('loading')
  const [guest, setGuest] = useState(null)
  const [rsvp, setRsvp] = useState(null)
  const token = getToken()

  useEffect(() => {
    if (!token) { setStatus('invalid'); return }
    fetch('/api/validate', { headers: { 'X-Invite-Token': token } })
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          setGuest(data.guest)
          setRsvp(data.rsvp)
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

  return <MainApp token={token} guest={guest} rsvp={rsvp} />
}
