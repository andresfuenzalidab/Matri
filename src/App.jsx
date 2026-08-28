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
import DecorSlot from './components/DecorSlot'
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
import DemoAdminPanel from './components/admin/DemoAdminPanel'

function getToken() {
  const fromUrl = new URLSearchParams(window.location.search).get('token')
  if (fromUrl) {
    sessionStorage.setItem('inviteToken', fromUrl)
    return fromUrl
  }
  return sessionStorage.getItem('inviteToken') || ''
}

// ── Guest-side demo (`?demo=1`, `?demo=completa`, `?demo=fiesta`) ──
// Reserved tokens the backend (`_auth.js`) recognizes and hands back a
// synthetic guest for, without ever touching the real DB — see there for
// the full read/write split. Deliberately its own tiny flow, not folded
// into `getToken()`/sessionStorage: a demo run shouldn't persist across
// visits or get confused with a real invite token.
const DEMO_TOKENS = { all_in: 'demo-completa', party_only: 'demo-fiesta' }

function getDemoChoiceFromUrl() {
  const v = new URLSearchParams(window.location.search).get('demo')
  if (v === null) return null
  if (v === 'completa' || v === 'all_in') return 'all_in'
  if (v === 'fiesta' || v === 'party_only') return 'party_only'
  return 'choose' // bare `?demo` or `?demo=1`
}

function DemoChooser({ onChoose }) {
  return (
    <div className="access-denied">
      <div className="access-denied-monogram">A & C</div>
      <h1>Demostración del sitio</h1>
      <p>
        Esta es una demostración para mostrar cómo funciona el sitio — nada de lo que hagas aquí se
        guarda de verdad. ¿Qué tipo de invitación quieres ver?
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => onChoose('all_in')}>Invitación completa</button>
        <button className="btn btn-secondary" onClick={() => onChoose('party_only')}>Solo fiesta</button>
      </div>
    </div>
  )
}

/** Persistent reminder while touring the guest-side demo — easy to miss
 *  otherwise that submitting the RSVP / "buying" a gift isn't real. */
function DemoBanner() {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: 'var(--color-accent)', color: 'var(--color-on-accent)',
      textAlign: 'center', padding: '0.5rem 1rem', fontSize: '0.8rem',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.15)',
    }}>
      Estás viendo una demostración — nada de lo que hagas aquí se guarda.
    </div>
  )
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
 * Paper texture + damask side borders, wrapping everything after the hero.
 * A normal (non-fixed) block, not a full-viewport overlay — it starts
 * exactly where `Home` ends and is exactly as tall as its own children, so
 * it never covers the hero video (which is meant to be the only thing
 * showing on that first screen) and its border never needs viewport-height
 * math. Replaces the old repeating vine decoration, which is gone now that
 * this exists.
 */
function StationeryMain({ children }) {
  const { get } = useApp()
  const paper = normalizeImageUrl(get('stationery_paper_texture') || '')
  return (
    <div className="stationery-main" style={{
      '--stationery-paper': paper ? `url(${paper})` : undefined,
      // `--stationery-border` itself is set higher up, on `EditorialMain`
      // (see below) — it inherits down to here same as any custom
      // property, and is ALSO needed there, to fill the green area beside
      // this card on desktop with the same asset instead of an invented
      // flat color (see `.editorial-main` in index.css).
    }}>
      {children}
    </div>
  )
}

/**
 * `<main>` — only sets `--stationery-border` (the admin's green damask
 * art) for inheritance; paints no background of its own. It wraps `Home`
 * too, and a background here was exactly the bug that erased the video
 * outright: `.editorial-main`'s box covers its full height, hero included,
 * so ANY non-transparent background painted directly on it — even meant
 * only for "everything after the hero" — sat behind the video too,
 * covering it completely regardless of Home's own fade. See `PageBody`
 * below for where that fill actually belongs.
 */
function EditorialMain({ children }) {
  const { get } = useApp()
  const border = normalizeImageUrl(get('stationery_side_border') || '')
  return (
    <main className="editorial-main" style={{ '--stationery-border': border ? `url(${border})` : undefined }}>
      {children}
    </main>
  )
}

/**
 * Wraps everything AFTER the hero (`StationeryMain` onward) — deliberately
 * NOT the same element as `EditorialMain`, and deliberately NOT wrapping
 * `Home` too. Structurally, not just visually: its box starts exactly
 * where the hero ends, so its own opaque fill (the same green damask art
 * as the side borders, tiled — the "everything outside the capped mobile-
 * width card" background) can never paint over the video above it, no
 * matter how that fill is implemented later.
 */
function PageBody({ children }) {
  return <div className="page-body">{children}</div>
}

/** One customizable horizontal image between two top-level sections. */
function ClosingSeparator({ contentKey, label }) {
  const { get } = useApp()
  return (
    <div className="closing-separator">
      <DecorSlot url={get(contentKey)} label={label}
        aspectRatio="7" className="timeline-separator full-bleed" style={{ margin: 0 }} />
    </div>
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
  // The cover is one background image now (see WelcomeModal.jsx) — this
  // used to wait on the old logo/seal fields, which it no longer renders
  // at all, so the modal could flash in before its actual art was ready.
  const coverBg = normalizeImageUrl(get('envelope_background_image') || '') || '/welcome-cover-bg.png'
  const artReady = useImagesReady([coverBg], contentLoaded)

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

        <EditorialMain>
          {/* ── Ambient warm glows ── */}
          <div className="ambient-glow" style={{ top: 900, left: '8%' }} aria-hidden="true"/>
          <div className="ambient-glow" style={{ top: 2200, right: '6%', left: 'auto' }} aria-hidden="true"/>
          <div className="ambient-glow" style={{ top: 3600, left: '12%' }} aria-hidden="true"/>
          <div className="ambient-glow" style={{ top: 5000, right: '8%', left: 'auto' }} aria-hidden="true"/>

          {/* ── Hero — outside the paper/border skin below, so the video
              stays the only thing showing on this first screen ── */}
          <Home />

          {/* ── Everything after the hero, on the paper + damask skin ── */}
          <PageBody>
            <StationeryMain>
              <DateSection />
              <CountdownSection />
              <WeddingInfo />
              <OurStory />
              <RSVP initialRsvp={rsvp} />
              <Gifts />
              <ClosingSeparator contentKey="gifts_closing_separator_image" label="Separador (regalos → dudas)" />
              <FAQ />
              {/* Closing note — the last thing on the page */}
              <Contact />
              <FlowerFooter />
            </StationeryMain>
          </PageBody>
        </EditorialMain>
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
      {guest?.isDemo && <DemoBanner />}
    </AppProvider>
  )
}

export default function App() {
  // `?demo_admin=1` — the read-only admin tour, entirely separate from
  // everything below: no token, no `/api/validate`, no real auth at all,
  // so it can't be gated behind or confused with a real login. A plain
  // const, not a conditional early return before the hooks below — those
  // still need to run unconditionally on every render of this component.
  const isDemoAdmin = new URLSearchParams(window.location.search).has('demo_admin')

  const [status, setStatus] = useState('loading')
  const [guest, setGuest] = useState(null)
  const [rsvp, setRsvp] = useState(null)
  const [demoChoice, setDemoChoice] = useState(getDemoChoiceFromUrl)
  const token = demoChoice && demoChoice !== 'choose' ? DEMO_TOKENS[demoChoice] : getToken()

  useEffect(() => {
    if (isDemoAdmin || demoChoice === 'choose') return // handled by the branches below instead
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
  }, [token, isDemoAdmin, demoChoice])

  if (isDemoAdmin) {
    return <DemoAdminPanel />
  }

  if (demoChoice === 'choose') {
    return <DemoChooser onChoose={setDemoChoice} />
  }

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
