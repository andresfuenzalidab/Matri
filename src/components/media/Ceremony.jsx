import { useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import '../../styles/ceremony.css'

// Interactive awards ceremony: each category is revealed from third place up to
// the winner, one tap at a time. Used by the guest album once voting is over and,
// for rehearsing the flow, by the admin panel (any time, with the current ranking).

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Pinyon+Script&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&display=swap'
const CATS = [['image', 'foto', 'la mejor foto'], ['video', 'video', 'el mejor video']]
const PLACE_LABEL = { 1: 'Primer lugar', 2: 'Segundo lugar', 3: 'Tercer lugar' }
const COLORS = ['#d9b25f', '#b68235', '#c2415a', '#ffffff', '#f1dfae', '#e7a5b4']

function buildSteps(ranking) {
  const steps = [{ kind: 'welcome' }]
  for (const [cat] of CATS) {
    const list = (ranking?.[cat] || []).slice(0, 3)
    if (!list.length) { steps.push({ kind: 'empty', cat }); continue }
    steps.push({ kind: 'intro', cat })
    list.map((item, i) => ({ kind: 'place', cat, item, place: i + 1 })).reverse().forEach(s => steps.push(s))
  }
  steps.push({ kind: 'end' })
  return steps
}

function Icon({ d, size = 24 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
}
const TROPHY = 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4'
const CLOSE = 'M6 6l12 12M18 6 6 18'

function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 64 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 1.2,
    dur: 2.8 + Math.random() * 2.4,
    size: 6 + Math.random() * 8,
    rot: Math.random() * 360,
    color: COLORS[i % COLORS.length],
    round: i % 3 === 0,
  })), [])
  return (
    <div className="cer-confetti" aria-hidden="true">
      {pieces.map(p => (
        <i key={p.id} style={{
          left: `${p.left}%`, width: p.size, height: p.round ? p.size : p.size * 0.5, background: p.color,
          borderRadius: p.round ? '50%' : 2, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, transform: `rotate(${p.rot}deg)`,
        }} />
      ))}
    </div>
  )
}

function Media({ item }) {
  return item.type === 'video'
    ? <video src={item.src} poster={item.thumb} controls playsInline preload="metadata" />
    : <img src={item.src} alt="" />
}

function PlaceStep({ step, cfg, names, onNext, last }) {
  const { item, place, cat } = step
  const [phase, setPhase] = useState('sealed') // sealed -> counting (winner only) -> revealed
  const [count, setCount] = useState(3)

  useEffect(() => {
    if (phase !== 'counting') return
    if (count <= 0) { setPhase('revealed'); return }
    const t = setTimeout(() => setCount(c => c - 1), 750)
    return () => clearTimeout(t)
  }, [phase, count])

  const reveal = () => {
    if (phase !== 'sealed') return
    if (place === 1) { setCount(3); setPhase('counting') } else setPhase('revealed')
  }

  const prize = cat === 'image' ? cfg.album_prize_photo : cfg.album_prize_video
  const who = item.uploader || names?.[item.id]

  if (phase !== 'revealed') {
    return (
      <div className="cer-step" key="sealed">
        <small className="cer-kicker">{cat === 'image' ? 'Mejor foto' : 'Mejor video'}</small>
        {phase === 'counting' ? (
          <div className="cer-count" key={count} aria-live="assertive">{count > 0 ? count : '🏆'}</div>
        ) : (
          <button type="button" className={`cer-seal cer-seal-${place}`} onClick={reveal} aria-label={`Revelar ${PLACE_LABEL[place].toLowerCase()}`}>
            <span>{place}°</span>
          </button>
        )}
        <h2 className="cer-title">{PLACE_LABEL[place]}</h2>
        <p className="cer-hint">{phase === 'counting' ? '…y el ganador es…' : 'Toca el sello para revelar'}</p>
      </div>
    )
  }

  return (
    <div className="cer-step cer-reveal" key="revealed">
      {place === 1 && <Confetti />}
      <small className="cer-kicker">{cat === 'image' ? 'Mejor foto' : 'Mejor video'}</small>
      <h2 className="cer-title">{PLACE_LABEL[place]}</h2>
      <div className={`cer-card cer-card-${place}`}>
        <div className="cer-media"><Media item={item} /></div>
        <div className="cer-card-info">
          <span className="cer-votes">{item.votes} {item.votes === 1 ? 'voto' : 'votos'}</span>
          {who && <span className="cer-who">Subió: <b>{who}</b></span>}
          {place === 1 && prize && <span className="cer-prize"><Icon d={TROPHY} size={16} /> {prize}</span>}
        </div>
      </div>
      <button type="button" className="cer-btn" onClick={onNext}>{last ? 'Terminar' : 'Siguiente'}</button>
    </div>
  )
}

export default function Ceremony({ ranking, cfg, names, onClose }) {
  const steps = useMemo(() => buildSteps(ranking), [ranking])
  const [i, setI] = useState(0)
  const step = steps[i]
  const next = useCallback(() => setI(n => Math.min(steps.length - 1, n + 1)), [steps.length])

  useEffect(() => {
    if (!document.getElementById('mp-fonts')) {
      const l = document.createElement('link')
      l.id = 'mp-fonts'; l.rel = 'stylesheet'; l.href = FONT_HREF
      document.head.appendChild(l)
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose])

  const catName = c => (c === 'image' ? 'la mejor foto' : 'el mejor video')
  let body = null
  if (step.kind === 'welcome') {
    body = (
      <div className="cer-step">
        <div className="cer-trophy"><Icon d={TROPHY} size={44} /></div>
        <h1 className="cer-script">La premiación</h1>
        <p className="cer-lead">Los invitados votaron. Es hora de conocer a los ganadores de <b>la mejor foto</b> y <b>el mejor video</b>.</p>
        <button type="button" className="cer-btn" onClick={next}>Comenzar</button>
      </div>
    )
  } else if (step.kind === 'intro') {
    const prize = step.cat === 'image' ? cfg.album_prize_photo : cfg.album_prize_video
    body = (
      <div className="cer-step">
        <div className="cer-trophy"><Icon d={TROPHY} size={44} /></div>
        <h2 className="cer-script">{step.cat === 'image' ? 'La mejor foto' : 'El mejor video'}</h2>
        {prize && <p className="cer-lead">Premio: <b>{prize}</b></p>}
        <p className="cer-hint">Empezamos por el tercer lugar</p>
        <button type="button" className="cer-btn" onClick={next}>Vamos</button>
      </div>
    )
  } else if (step.kind === 'empty') {
    body = (
      <div className="cer-step">
        <h2 className="cer-script">{step.cat === 'image' ? 'La mejor foto' : 'El mejor video'}</h2>
        <p className="cer-lead">No hubo votos para {catName(step.cat)}.</p>
        <button type="button" className="cer-btn" onClick={next}>Siguiente</button>
      </div>
    )
  } else if (step.kind === 'place') {
    const nextStep = steps[i + 1]
    body = <PlaceStep key={i} step={step} cfg={cfg} names={names} onNext={next} last={!nextStep || nextStep.kind === 'end'} />
  } else {
    body = (
      <div className="cer-step">
        <Confetti />
        <h2 className="cer-script">¡Gracias por participar!</h2>
        <div className="cer-podium">
          {CATS.map(([cat, , label]) => {
            const list = (ranking?.[cat] || []).slice(0, 3)
            return (
              <div key={cat} className="cer-pod">
                <small className="cer-kicker">{cat === 'image' ? 'Fotos' : 'Videos'}</small>
                {list.length === 0 ? <span className="cer-hint">Sin votos</span> : (
                  <ol>
                    {list.map((it, idx) => (
                      <li key={it.id}>
                        <span className="cer-pod-n">{idx + 1}</span>
                        <img src={it.thumb} alt="" />
                        <span>{it.votes} {it.votes === 1 ? 'voto' : 'votos'}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )
          })}
        </div>
        <button type="button" className="cer-btn" onClick={onClose}>Cerrar</button>
      </div>
    )
  }

  // Portaled to <body>: the admin panel is a blurred layer, and `position: fixed`
  // inside it would be anchored to that layer instead of the screen.
  return createPortal(
    <div className="cer" role="dialog" aria-modal="true" aria-label="Premiación">
      <button type="button" className="cer-close" onClick={onClose} aria-label="Cerrar premiación"><Icon d={CLOSE} size={22} /></button>
      <div className="cer-progress" aria-hidden="true"><i style={{ width: `${(i / (steps.length - 1)) * 100}%` }} /></div>
      <div className="cer-stage">{body}</div>
    </div>,
    document.body,
  )
}
