import { useState, useEffect, useRef, forwardRef } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { useScrollReveal } from './utils/useScrollReveal'
import { normalizeImageUrl } from './utils/imageUrl.js'
import { useImagesReady, usePageAssetsReady } from './utils/useAssetsReady'
import Nav from './components/Nav'
import Loader from './components/Loader'
import ThemeInjector from './components/ThemeInjector'
import WelcomeModal from './components/WelcomeModal'
import MusicPlayer from './components/MusicPlayer'
import SectionDivider from './components/SectionDivider'
import Home from './components/sections/Home'
import DateSection from './components/sections/DateSection'
import CountdownSection from './components/sections/CountdownSection'
import WeddingInfo from './components/sections/WeddingInfo'
import OurStory from './components/sections/OurStory'
import RSVP from './components/sections/RSVP'
import Gifts from './components/sections/Gifts'
import Contact from './components/sections/Contact'
import FAQ from './components/sections/FAQ'
import AdminPanel from './components/admin/AdminPanel'

function getToken() {
  const fromUrl = new URLSearchParams(window.location.search).get('token')
  if (fromUrl) {
    sessionStorage.setItem('inviteToken', fromUrl)
    return fromUrl
  }
  return sessionStorage.getItem('inviteToken') || ''
}

// Rendered inside AppProvider so it can access useApp()
const SharedHeroVideo = forwardRef(function SharedHeroVideo({ onCanPlay, onError }, ref) {
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
      onError={onError}
    />
  )
})

/**
 * Paper texture + damask side borders, reaching the real screen edges —
 * `fixed`, not scoped to any one section, so it reads as one continuous
 * surface behind the whole page instead of a per-section "card". Replaces
 * the old repeating vine decoration, which is gone now that this exists.
 */
function StationeryBackdrop() {
  const { get } = useApp()
  const paper = normalizeImageUrl(get('stationery_paper_texture') || '')
  const border = normalizeImageUrl(get('stationery_side_border') || '')
  if (!paper && !border) return null

  return (
    <>
      {paper && (
        <div className="stationery-backdrop-paper" aria-hidden="true"
          style={{ backgroundImage: `url(${paper})` }} />
      )}
      {border && (
        <>
          <div className="stationery-backdrop-border stationery-backdrop-border--left" aria-hidden="true"
            style={{ backgroundImage: `url(${border})` }} />
          <div className="stationery-backdrop-border stationery-backdrop-border--right" aria-hidden="true"
            style={{ backgroundImage: `url(${border})` }} />
        </>
      )}
    </>
  )
}

function FlowerFooter() {
  const { get } = useApp()
  // Only its own key: the footer shows the uploaded image as it is, so falling
  // back to the tall side-vine art would render it sideways and stretched.
  const img = normalizeImageUrl(get('flower_footer') || '')
  if (!img) return null
  return (
    <div className="flower-footer" aria-hidden="true">
      <img src={img} alt="" className="flower-footer-img"
        onError={e => { e.target.style.display = 'none' }} />
    </div>
  )
}

/**
 * Holds the spinner until the cover's own art is in, then shows the cover.
 * Lives inside AppProvider so it can see which images the cover actually uses.
 */
function CoverLayer({ guest, onEnter }) {
  const { get, contentLoaded } = useApp()
  const logo = normalizeImageUrl(get('envelope_logo_image') || '')
  const seal = normalizeImageUrl(get('envelope_seal_image') || '')
  const artReady = useImagesReady([logo, seal], contentLoaded)

  if (!contentLoaded || !artReady) return <Loader />
  return <WelcomeModal guest={guest} onEnter={onEnter} />
}

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

  // Images and webfonts of the page behind the cover.
  const pageAssetsReady = usePageAssetsReady(welcomed)
  const pageReady = videoReady && pageAssetsReady

  useScrollReveal(welcomed)

  // A hero video that never fires `canplay` (offline, bad encode) must not
  // strand the guest on the spinner.
  useEffect(() => {
    const t = setTimeout(() => setVideoReady(true), 9000)
    return () => clearTimeout(t)
  }, [])

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
      {/* Admin's site-wide colors/fonts, applied as a CSS override */}
      <ThemeInjector />

      {/* Single hero video — always in DOM, loads once */}
      <SharedHeroVideo
        ref={heroVideoRef}
        onCanPlay={handleVideoReady}
        onError={() => setVideoReady(true)}
      />

      {/* Spinner over the page until its video, images and fonts are in */}
      {welcomed && !pageReady && <Loader />}

      {/* Before that, the cover — itself behind a spinner until its art is in */}
      {!welcomed && (
        <CoverLayer guest={guest} onEnter={handleWelcomed} />
      )}

      <div style={{
        position: 'relative', zIndex: 1,
        opacity: welcomed ? 1 : 0,
        transition: 'opacity 0.5s ease',
        pointerEvents: welcomed ? 'auto' : 'none',
        isolation: 'isolate',
      }}>
        <Nav />
        <StationeryBackdrop />

        <main className="editorial-main">
          {/* ── Ambient warm glows ── */}
          <div className="ambient-glow" style={{ top: 900, left: '8%' }} aria-hidden="true"/>
          <div className="ambient-glow" style={{ top: 2200, right: '6%', left: 'auto' }} aria-hidden="true"/>
          <div className="ambient-glow" style={{ top: 3600, left: '12%' }} aria-hidden="true"/>
          <div className="ambient-glow" style={{ top: 5000, right: '8%', left: 'auto' }} aria-hidden="true"/>

          {/* ── Content ── */}
          <Home />
          <SectionDivider />
          <DateSection />
          <SectionDivider />
          <CountdownSection />
          <SectionDivider />
          <WeddingInfo />
          <SectionDivider />
          <OurStory />
          <SectionDivider />
          <RSVP initialRsvp={rsvp} />
          <SectionDivider />
          <Gifts />
          <SectionDivider />
          <FAQ />
          <SectionDivider />
          {/* Closing note — the last thing on the page */}
          <Contact />
          <FlowerFooter />
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
    return <Loader />
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
