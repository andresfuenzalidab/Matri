import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ALBUM_DEFAULTS } from '../../utils/albumConfig.js'
import '../../styles/media.css'

// Guest-facing album, opened from the QR code (`/fotos?k=...`). No invitation
// token needed — access is the optional shared key `k` in the link.
// Look follows the printed card guests scan it from: ornate frame, script title.

const KEY = new URLSearchParams(window.location.search).get('k') || ''
const POLL_MS = 30000
const RANK_POLL_MS = 8000
const MAX_PARALLEL = 3
const VOTER_STORAGE = 'matri-voter'
const NAME_STORAGE = 'matri-uploader'
const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Pinyon+Script&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&display=swap'

const qs = (extra = '') => {
  const p = new URLSearchParams(extra)
  if (KEY) p.set('k', KEY)
  const s = p.toString()
  return s ? `?${s}` : ''
}

async function apiJson(url, init) {
  const res = await fetch(url, init)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || 'Algo salió mal. Inténtalo de nuevo.')
  return data
}

// Anonymous voter id, kept in localStorage; the server also pins it to a cookie,
// so clearing only one of the two doesn't give a second vote.
function loadVoterId() {
  try {
    const cur = localStorage.getItem(VOTER_STORAGE)
    if (cur && /^[\w-]{16,64}$/.test(cur)) return cur
    const id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`).replace(/-/g, '')
    localStorage.setItem(VOTER_STORAGE, id)
    return id
  } catch { return `v${Date.now().toString(16)}${Math.random().toString(16).slice(2, 12)}`.padEnd(16, '0') }
}

function fmtDuration(ms) {
  if (!ms) return ''
  const s = Math.round(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
function fmtSize(b) {
  if (b > 1024 ** 3) return `${(b / 1024 ** 3).toFixed(1)} GB`
  if (b > 1024 ** 2) return `${(b / 1024 ** 2).toFixed(1)} MB`
  return `${Math.max(1, Math.round(b / 1024))} KB`
}

// Width/height, clamped so one very tall panorama can't take over a column.
const ratio = it => (it.width && it.height ? Math.min(2, Math.max(0.55, it.width / it.height)) : 4 / 3)

function useColumnCount() {
  const calc = () => (window.innerWidth >= 1100 ? 4 : window.innerWidth >= 700 ? 3 : 2)
  const [n, setN] = useState(calc)
  useEffect(() => {
    const on = () => setN(calc())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return n
}

// ── Icons & ornaments ────────────────────────────────────────────────────

const Icon = ({ d, size = 22, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
)
const ICONS = {
  upload: 'M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3',
  camera: 'M4 8a1 1 0 0 1 1-1h2.5l1.3-2h6.4l1.3 2H19a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  video: 'M3.5 7.5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1zM15.5 10.5l5-3v9l-5-3',
  close: 'M6 6l12 12M18 6 6 18',
  prev: 'm15 5-7 7 7 7',
  next: 'm9 5 7 7-7 7',
  download: 'M12 4v12M7 11l5 5 5-5M4 20h16',
  trash: 'M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13',
  play: 'M8 5v14l11-7z',
  check: 'm5 12 5 5 9-10',
  heart: 'M12 20.5s-7.5-4.7-7.5-10.4A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7.5 2.5c0 5.7-7.5 10.4-7.5 10.4z',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4',
}

/** Little flowering branch for the frame corners. */
function Sprig({ className }) {
  const leaf = 'M0 0C-5-7-5-16 0-24C5-16 5-7 0 0Z'
  const along = [[25, 84, 12], [25, 84, 102], [47, 67, 3], [47, 67, 93], [69, 43, -6], [69, 43, 84]]
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden="true">
      <path d="M6 94C30 84 62 60 92 10" />
      {along.map(([x, y, r], i) => <path key={i} d={leaf} transform={`translate(${x} ${y}) rotate(${r})`} fill="currentColor" fillOpacity=".14" />)}
      {[0, 60, 120, 180, 240, 300].map(r => <path key={r} d={leaf} transform={`translate(92 10) rotate(${r}) scale(.62)`} fill="currentColor" fillOpacity=".14" />)}
      <circle cx="92" cy="10" r="2" fill="currentColor" />
    </svg>
  )
}

function Divider() {
  return (
    <svg className="mp-divider" viewBox="0 0 200 20" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" aria-hidden="true">
      <path d="M2 10H82M118 10H198" />
      <path d="M100 3.5 106.5 10 100 16.5 93.5 10Z" fill="currentColor" fillOpacity=".15" />
      <path d="M86 10c-4-5-9-5-12-2M114 10c4-5 9-5 12-2" />
    </svg>
  )
}

// ── Upload ───────────────────────────────────────────────────────────────

function putFile(uploadUrl, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl)
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(e.loaded / e.total) }
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Google rechazó el archivo.')))
    xhr.onerror = () => reject(new Error('Se cortó la conexión.'))
    xhr.send(file)
  })
}

async function uploadOne(file, uploader, onProgress) {
  const { uploadUrl } = await apiJson(`/api/media/upload-session${qs()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: file.name, mimeType: file.type, size: file.size, uploader }),
  })
  await putFile(uploadUrl, file, onProgress)
}

function UploadTray({ queue, onRetry, onDismiss }) {
  if (!queue.length) return null
  const done = queue.filter(q => q.state === 'done').length
  const working = queue.some(q => q.state === 'uploading' || q.state === 'queued')
  return (
    <div className="mp-tray" role="status" aria-live="polite">
      <div className="mp-tray-head">
        <b>{working ? `Subiendo ${Math.min(done + 1, queue.length)} de ${queue.length}…` : `${done} de ${queue.length} subidos`}</b>
        {!working && <button onClick={onDismiss} aria-label="Cerrar"><Icon d={ICONS.close} size={18} /></button>}
      </div>
      <ul>
        {queue.map(q => (
          <li key={q.id} className={`mp-up mp-up-${q.state}`}>
            <span className="mp-up-thumb" style={q.preview ? { backgroundImage: `url(${q.preview})` } : undefined}>{!q.preview && <Icon d={ICONS.play} size={14} />}</span>
            <span className="mp-up-main">
              <span className="mp-up-name">{q.name}</span>
              <span className="mp-up-bar"><i style={{ width: `${q.state === 'done' ? 100 : Math.round(q.progress * 100)}%` }} /></span>
              {q.state === 'error' && <span className="mp-up-err">{q.error} <button onClick={() => onRetry(q.id)}>Reintentar</button></span>}
            </span>
            {q.state === 'done' && <span className="mp-up-ok"><Icon d={ICONS.check} size={18} /></span>}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Voting pieces ────────────────────────────────────────────────────────

const catWord = (type, plural) => (type === 'video' ? (plural ? 'videos' : 'video') : (plural ? 'fotos' : 'foto'))

function VoteButton({ item, mine, open, onVote, big }) {
  if (!open) return null
  const voted = mine[item.type].includes(item.id)
  return (
    <button
      type="button"
      className={`mp-vote ${voted ? 'on' : ''} ${big ? 'mp-vote-big' : ''}`}
      onClick={e => { e.stopPropagation(); onVote(item) }}
      aria-pressed={voted}
      aria-label={voted ? 'Quitar mi voto' : `Votar esta ${item.type === 'video' ? 'video' : 'foto'}`}
      title={voted ? 'Tu voto — toca para quitarlo' : 'Votar'}
    >
      <Icon d={ICONS.heart} size={big ? 22 : 18} fill={voted ? 'currentColor' : 'none'} />
      {big && <span>{voted ? 'Tu voto' : `Votar esta ${item.type === 'video' ? 'video' : 'foto'}`}</span>}
    </button>
  )
}

function Ranking({ votes, cat, setCat, onOpen, mine, hasPrize, onPrize }) {
  const list = (votes?.ranking?.[cat] || []).slice(0, 5)
  const top = list[0]?.votes || 1
  const closed = votes && !votes.open
  return (
    <section className="mp-rank" aria-labelledby="mp-rank-title">
      <div className="mp-rank-head">
        <h2 id="mp-rank-title"><Icon d={ICONS.trophy} size={22} /> {closed ? 'Ganadores' : 'Ranking en vivo'}</h2>
        {!closed && <span className="mp-live"><i />En vivo</span>}
      </div>
      {hasPrize(cat) && (
        <button type="button" className="mp-prize-link" onClick={() => onPrize(cat)}>
          <Icon d={ICONS.trophy} size={16} /> Ver el premio a {cat === 'image' ? 'la mejor foto' : 'el mejor video'}
        </button>
      )}
      <div className="mp-rank-tabs" role="tablist">
        {[['image', 'Fotos'], ['video', 'Videos']].map(([k, label]) => (
          <button key={k} role="tab" aria-selected={cat === k} className={cat === k ? 'on' : ''} onClick={() => setCat(k)}>
            {label}{votes && <small>{votes.totals?.[k] || 0} {votes.totals?.[k] === 1 ? 'voto' : 'votos'}</small>}
          </button>
        ))}
      </div>
      {!votes ? <p className="mp-rank-empty">Cargando…</p> : list.length === 0 ? (
        <p className="mp-rank-empty">{closed ? 'No hubo votos.' : `Aún no hay votos para ${cat === 'image' ? 'fotos' : 'videos'}. ¡Sé la primera persona en votar!`}</p>
      ) : (
        <ol className="mp-rank-list">
          {list.map((it, i) => (
            <li key={it.id} className={`mp-rank-item ${i === 0 ? 'first' : ''}`}>
              <button type="button" className="mp-rank-open" onClick={() => onOpen(list, i)} aria-label={`Abrir puesto ${i + 1}`}>
                <span className="mp-rank-pos">{i + 1}</span>
                <span className="mp-rank-thumb"><img src={it.thumb} alt="" loading="lazy" />{it.type === 'video' && <em><Icon d={ICONS.play} size={12} /></em>}</span>
                <span className="mp-rank-info">
                  <b>{it.votes} {it.votes === 1 ? 'voto' : 'votos'}{mine[it.type].includes(it.id) && <span className="mp-yours"> · tu voto</span>}</b>
                  <span className="mp-rank-bar"><i style={{ width: `${Math.max(6, (it.votes / top) * 100)}%` }} /></span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

// ── Lightbox ─────────────────────────────────────────────────────────────

function Lightbox({ items, index, onIndex, onClose, isAdmin, onDelete, mine, open, onVote }) {
  const item = items[index]
  const touch = useRef(null)
  const go = useCallback(d => onIndex(i => Math.min(items.length - 1, Math.max(0, i + d))), [items.length, onIndex])

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [go, onClose])

  // Warm the neighbours so swiping feels instant.
  useEffect(() => {
    for (const n of [items[index + 1], items[index - 1]]) {
      if (n?.type === 'image') { const im = new Image(); im.src = n.src }
    }
  }, [index, items])

  if (!item) return null
  return (
    <div
      className="mp-lb" role="dialog" aria-modal="true" aria-label="Visor"
      onTouchStart={e => { touch.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        if (touch.current == null) return
        const dx = e.changedTouches[0].clientX - touch.current
        touch.current = null
        if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1)
      }}
    >
      <div className="mp-lb-top">
        <span className="mp-lb-count">{index + 1} / {items.length}</span>
        <span className="mp-sp" />
        {isAdmin && <button onClick={() => onDelete(item)} aria-label="Eliminar"><Icon d={ICONS.trash} /></button>}
        <a href={item.download} aria-label="Descargar" download><Icon d={ICONS.download} /></a>
        <button onClick={onClose} aria-label="Cerrar"><Icon d={ICONS.close} /></button>
      </div>
      <div className="mp-lb-stage" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        {item.type === 'video'
          ? <video key={item.id} src={item.src} poster={item.thumb} controls autoPlay playsInline preload="metadata" />
          : <img key={item.id} src={item.src} alt={item.name} />}
      </div>
      {index > 0 && <button className="mp-lb-nav mp-lb-prev" onClick={() => go(-1)} aria-label="Anterior"><Icon d={ICONS.prev} size={28} /></button>}
      {index < items.length - 1 && <button className="mp-lb-nav mp-lb-next" onClick={() => go(1)} aria-label="Siguiente"><Icon d={ICONS.next} size={28} /></button>}
      <div className="mp-lb-foot">
        <VoteButton item={item} mine={mine} open={open} onVote={onVote} big />
        <span>{item.votes != null ? `${item.votes} ${item.votes === 1 ? 'voto' : 'votos'} · ` : ''}{new Date(item.createdAt).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })} · {fmtSize(item.size)}</span>
      </div>
    </div>
  )
}

// ── Dialogs ──────────────────────────────────────────────────────────────

function Dialog({ label, onClose, children }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="mp-modal-wrap" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="mp-modal" role="dialog" aria-modal="true" aria-label={label}>{children}</div>
    </div>
  )
}

function PrizeDialog({ cat, cfg, onClose }) {
  const isPhoto = cat === 'image'
  const name = isPhoto ? cfg.album_prize_photo : cfg.album_prize_video
  const detail = isPhoto ? cfg.album_prize_photo_detail : cfg.album_prize_video_detail
  return (
    <Dialog label={`Premio a ${isPhoto ? 'la mejor foto' : 'el mejor video'}`} onClose={onClose}>
      <div className="mp-modal-icon"><Icon d={ICONS.trophy} size={30} /></div>
      <small className="mp-modal-kicker">{isPhoto ? 'Premio a la mejor foto' : 'Premio al mejor video'}</small>
      {name && <h2>{name}</h2>}
      {detail ? <p className="mp-modal-detail">{detail}</p> : !name && <p className="mp-modal-detail">Pronto sabrás más.</p>}
      <button className="mp-cta" onClick={onClose}>Entendido</button>
    </Dialog>
  )
}

// Asked before every upload: the name is for the awards only — it is stored
// privately with the file and never shown to other guests.
function NameDialog({ count, initial, onConfirm, onClose }) {
  const [name, setName] = useState(initial)
  const [error, setError] = useState('')
  function submit(e) {
    e.preventDefault()
    const v = name.replace(/\s+/g, ' ').trim()
    if (v.length < 2) { setError('Escribe tu nombre para continuar.'); return }
    onConfirm(v)
  }
  return (
    <Dialog label="¿Quién sube esto?" onClose={onClose}>
      <form onSubmit={submit}>
        <h2>¿Quién sube {count === 1 ? 'este archivo' : `estos ${count} archivos`}?</h2>
        <p className="mp-modal-detail">Solo lo usamos para entregar el premio a la mejor foto y video. No se muestra a otros invitados.</p>
        <input
          className="mp-input" autoFocus value={name} onChange={e => { setName(e.target.value); setError('') }}
          placeholder="Tu nombre y apellido" maxLength={60} autoComplete="name" aria-label="Tu nombre"
        />
        {error && <p className="mp-modal-error" role="alert">{error}</p>}
        <div className="mp-modal-actions">
          <button type="button" className="mp-cta mp-cta-alt" onClick={onClose}>Cancelar</button>
          <button type="submit" className="mp-cta">Subir {count === 1 ? '' : `(${count})`}</button>
        </div>
      </form>
    </Dialog>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function MediaPage() {
  const [items, setItems] = useState([])
  const [next, setNext] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState('')
  const [loadingMore, setLoadingMore] = useState(false)
  const [filter, setFilter] = useState('all')
  const [viewer, setViewer] = useState(null) // { list, index }
  const [queue, setQueue] = useState([])
  const [dragging, setDragging] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [cfg, setCfg] = useState(ALBUM_DEFAULTS)
  const [votes, setVotes] = useState(null) // { open, ranking, mine: {image:[ids], video:[ids]}, totals, limit }
  const [prizeOpen, setPrizeOpen] = useState(null) // 'image' | 'video' | null
  const [pendingFiles, setPendingFiles] = useState(null) // files waiting for the uploader's name
  const [rankCat, setRankCat] = useState('image')
  const [toast, setToast] = useState('')
  const inputRef = useRef(null)
  const photoRef = useRef(null)
  const videoRef = useRef(null)
  const sentinel = useRef(null)
  const filesRef = useRef(new Map())
  const runningRef = useRef(0)
  const dragDepth = useRef(0)
  const toastTimer = useRef(null)
  const voterRef = useRef(null)
  if (!voterRef.current) voterRef.current = loadVoterId()

  const say = useCallback(msg => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2800)
  }, [])

  // Script font for the title (only this page loads it).
  useEffect(() => {
    if (document.getElementById('mp-fonts')) return
    const l = document.createElement('link')
    l.id = 'mp-fonts'; l.rel = 'stylesheet'; l.href = FONT_HREF
    document.head.appendChild(l)
  }, [])

  const fetchPage = useCallback(pageToken => apiJson(`/api/media${qs(pageToken ? `pageToken=${encodeURIComponent(pageToken)}` : '')}`), [])

  const loadFirst = useCallback(async () => {
    try {
      const d = await fetchPage()
      setItems(d.items); setNext(d.nextPageToken); setStatus('ready')
    } catch (e) { setError(e.message); setStatus('error') }
  }, [fetchPage])
  useEffect(() => { loadFirst() }, [loadFirst])

  // Texts and prizes the admin set.
  const loadConfig = useCallback(() => {
    apiJson(`/api/media/config${qs()}`).then(c => setCfg({ ...ALBUM_DEFAULTS, ...c })).catch(() => {})
  }, [])
  useEffect(() => { loadConfig(); const t = setInterval(loadConfig, 60000); return () => clearInterval(t) }, [loadConfig])

  // Live ranking + this voter's picks.
  const loadVotes = useCallback(() => {
    apiJson(`/api/media/votes${qs(`voter=${voterRef.current}`)}`).then(setVotes).catch(() => {})
  }, [])
  useEffect(() => {
    loadVotes()
    const t = setInterval(() => { if (!document.hidden) loadVotes() }, RANK_POLL_MS)
    return () => clearInterval(t)
  }, [loadVotes])

  const mine = votes?.mine || { image: [], video: [] }
  const votingOpen = votes ? votes.open : true
  const limit = votes?.limit || 3
  const hasPrize = cat => !!(cat === 'image' ? cfg.album_prize_photo || cfg.album_prize_photo_detail : cfg.album_prize_video || cfg.album_prize_video_detail)
  const left = { image: Math.max(0, limit - mine.image.length), video: Math.max(0, limit - mine.video.length) }

  async function vote(item) {
    if (!votingOpen) { say('Las votaciones están cerradas.'); return }
    const same = mine[item.type].includes(item.id)
    if (!same && mine[item.type].length >= limit) {
      say(`Ya usaste tus ${limit} votos de ${catWord(item.type, true)}. Quita uno para votar otro.`)
      return
    }
    const before = votes
    // Optimistic: the heart responds instantly, the server answer then replaces it.
    setVotes(v => v && { ...v, mine: { ...v.mine, [item.type]: same ? v.mine[item.type].filter(id => id !== item.id) : [...v.mine[item.type], item.id] } })
    try {
      const d = await apiJson(`/api/media/vote${qs()}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterId: voterRef.current, fileId: item.id, remove: same }),
      })
      if (d.voterId && d.voterId !== voterRef.current) {
        voterRef.current = d.voterId
        try { localStorage.setItem(VOTER_STORAGE, d.voterId) } catch { /* storage blocked */ }
      }
      setVotes(d)
      const rest = Math.max(0, (d.limit || limit) - d.mine[item.type].length)
      say(same ? 'Voto retirado' : rest ? `¡Voto registrado! Te quedan ${rest} de ${catWord(item.type, true)}.` : `¡Voto registrado! Ya usaste todos tus votos de ${catWord(item.type, true)}.`)
    } catch (e) { setVotes(before); say(e.message) }
  }

  const loadMore = useCallback(async () => {
    if (!next || loadingMore) return
    setLoadingMore(true)
    try {
      const d = await fetchPage(next)
      setItems(cur => { const seen = new Set(cur.map(i => i.id)); return [...cur, ...d.items.filter(i => !seen.has(i.id))] })
      setNext(d.nextPageToken)
    } catch { /* the sentinel retries when it scrolls into view again */ }
    setLoadingMore(false)
  }, [next, loadingMore, fetchPage])

  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver(es => { if (es[0].isIntersecting) loadMore() }, { rootMargin: '600px' })
    io.observe(el)
    return () => io.disconnect()
  }, [loadMore, status])

  // New uploads from other guests appear on their own.
  useEffect(() => {
    const t = setInterval(async () => {
      if (document.hidden) return
      try {
        const d = await fetchPage()
        setItems(cur => { const seen = new Set(cur.map(i => i.id)); const fresh = d.items.filter(i => !seen.has(i.id)); return fresh.length ? [...fresh, ...cur] : cur })
      } catch { /* next tick */ }
    }, POLL_MS)
    return () => clearInterval(t)
  }, [fetchPage])

  // A signed-in admin (invite token from the main site) can remove files.
  useEffect(() => {
    const token = sessionStorage.getItem('inviteToken')
    if (!token) return
    fetch('/api/validate', { headers: { 'X-Invite-Token': token } })
      .then(r => r.json()).then(d => setIsAdmin(!!d?.guest?.isAdmin)).catch(() => {})
  }, [])

  // ── Uploads: a small pool so a big batch doesn't open 40 connections.
  // The queue lives in a ref (source of truth for the pump) and is mirrored
  // into state for rendering — the pump must never start work from inside a
  // state updater, which React may run twice.
  const queueRef = useRef([])
  const setQ = useCallback(fn => { queueRef.current = fn(queueRef.current); setQueue(queueRef.current) }, [])
  const patch = useCallback((id, p) => setQ(q => q.map(x => (x.id === id ? { ...x, ...p } : x))), [setQ])

  const pump = useCallback(() => {
    for (const w of queueRef.current.filter(x => x.state === 'queued')) {
      if (runningRef.current >= MAX_PARALLEL) break
      runningRef.current++
      patch(w.id, { state: 'uploading' })
      uploadOne(filesRef.current.get(w.id), w.uploader, p => patch(w.id, { progress: p }))
        .then(() => { filesRef.current.delete(w.id); patch(w.id, { state: 'done', progress: 1 }) })
        .catch(e => patch(w.id, { state: 'error', error: e.message })) // file kept for "Reintentar"
        .finally(() => { runningRef.current--; pump() })
    }
  }, [patch])

  // When a batch finishes, refresh so the new files show up in the grid.
  const wasWorking = useRef(false)
  useEffect(() => {
    const working = queue.some(q => q.state === 'queued' || q.state === 'uploading')
    if (wasWorking.current && !working && queue.some(q => q.state === 'done')) loadFirst()
    wasWorking.current = working
  }, [queue, loadFirst])

  // Picking or dropping files only stages them: the uploader's name is asked first.
  const addFiles = useCallback(fileList => {
    const files = [...fileList].filter(f => /^(image|video)\//.test(f.type))
    if (!files.length) { say('Solo se pueden subir fotos y videos.'); return }
    setPendingFiles(files)
  }, [say])

  const startUpload = useCallback(uploader => {
    try { localStorage.setItem(NAME_STORAGE, uploader) } catch { /* storage blocked */ }
    const entries = pendingFiles.map(f => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      filesRef.current.set(id, f)
      return { id, name: f.name, uploader, state: 'queued', progress: 0, error: '', preview: f.type.startsWith('image/') && f.size < 25 * 1024 ** 2 ? URL.createObjectURL(f) : null }
    })
    setPendingFiles(null)
    setQ(q => [...q.filter(x => x.state !== 'done'), ...entries])
    pump()
  }, [pendingFiles, pump, setQ])

  const retry = id => {
    patch(id, { state: 'queued', progress: 0, error: '' })
    pump()
  }

  const dismissTray = () => {
    queueRef.current.forEach(q => q.preview && URL.revokeObjectURL(q.preview))
    setQ(() => [])
  }

  // Drag files anywhere on the page.
  useEffect(() => {
    const has = e => [...(e.dataTransfer?.types || [])].includes('Files')
    const enter = e => { if (has(e)) { dragDepth.current++; setDragging(true) } }
    const leave = e => { if (has(e) && --dragDepth.current <= 0) { dragDepth.current = 0; setDragging(false) } }
    const over = e => { if (has(e)) e.preventDefault() }
    const drop = e => { if (!has(e)) return; e.preventDefault(); dragDepth.current = 0; setDragging(false); addFiles(e.dataTransfer.files) }
    window.addEventListener('dragenter', enter); window.addEventListener('dragleave', leave)
    window.addEventListener('dragover', over); window.addEventListener('drop', drop)
    return () => { window.removeEventListener('dragenter', enter); window.removeEventListener('dragleave', leave); window.removeEventListener('dragover', over); window.removeEventListener('drop', drop) }
  }, [addFiles])

  async function remove(item) {
    if (!window.confirm('¿Eliminar este archivo del álbum? Quedará en la papelera de Drive.')) return
    try {
      await apiJson(`/api/media?id=${item.id}`, { method: 'DELETE', headers: { 'X-Invite-Token': sessionStorage.getItem('inviteToken') || '' } })
      setItems(cur => cur.filter(i => i.id !== item.id))
      setViewer(null)
      loadVotes()
    } catch (e) { say(e.message) }
  }

  const shown = useMemo(() => (filter === 'all' ? items : items.filter(i => i.type === (filter === 'photos' ? 'image' : 'video'))), [items, filter])
  const nCols = useColumnCount()
  // Masonry: each tile goes to the currently shortest column, so appending
  // more items never moves the ones already on screen.
  const columns = useMemo(() => {
    const cols = Array.from({ length: nCols }, () => ({ h: 0, list: [] }))
    shown.forEach((it, i) => {
      const c = cols.reduce((a, b) => (b.h < a.h ? b : a))
      c.list.push({ it, i }); c.h += 1 / ratio(it)
    })
    return cols.map(c => c.list)
  }, [shown, nCols])
  const nPhotos = items.filter(i => i.type === 'image').length
  const nVideos = items.length - nPhotos

  const pick = ref => e => { addFiles(e.target.files); e.target.value = '' }

  return (
    <div className="mp-root">
      <header className="mp-hero">
        <div className="mp-arch">
          <Sprig className="mp-sprig mp-sprig-l" />
          <Sprig className="mp-sprig mp-sprig-r" />
          {cfg.album_eyebrow && <div className="mp-eyebrow">{cfg.album_eyebrow}</div>}
          <h1>{cfg.album_title}</h1>
          {cfg.album_subtitle && <p className="mp-subtitle">{cfg.album_subtitle}</p>}
          <Divider />
          <div className="mp-actions">
            <button className="mp-cta" onClick={() => photoRef.current?.click()}><Icon d={ICONS.camera} /> Tomar foto</button>
            <button className="mp-cta" onClick={() => videoRef.current?.click()}><Icon d={ICONS.video} /> Grabar video</button>
            <button className="mp-cta mp-cta-alt" onClick={() => inputRef.current?.click()}><Icon d={ICONS.upload} /> Elegir de la galería</button>
          </div>
          {/* `capture` opens the camera directly on phones; desktops ignore it and show the file picker. */}
          <input ref={photoRef} type="file" accept="image/*" capture="environment" hidden onChange={pick()} />
          <input ref={videoRef} type="file" accept="video/*" capture="environment" hidden onChange={pick()} />
          <input ref={inputRef} type="file" accept="image/*,video/*" multiple hidden onChange={pick()} />
        </div>

        {(cfg.album_note || hasPrize('image') || hasPrize('video')) && (
          <div className="mp-prizes">
            {cfg.album_note && <p className="mp-pd"><span>Pd:</span> {cfg.album_note}</p>}
            {(hasPrize('image') || hasPrize('video')) && (
              <div className="mp-prize-cards">
                {[['image', 'Mejor foto', cfg.album_prize_photo, cfg.album_prize_photo_detail], ['video', 'Mejor video', cfg.album_prize_video, cfg.album_prize_video_detail]]
                  .filter(([cat]) => hasPrize(cat))
                  .map(([cat, label, name, detail]) => (
                    <div key={cat} className="mp-prize">
                      <Icon d={ICONS.trophy} size={20} /><small>{label}</small>
                      {name && <b>{name}</b>}
                      {detail && <button type="button" className="mp-prize-btn" onClick={() => setPrizeOpen(cat)}>Ver detalle del premio</button>}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </header>

      <main className="mp-main">
        <Ranking votes={votes} cat={rankCat} setCat={setRankCat} mine={mine} onOpen={(list, index) => setViewer({ list, index })} hasPrize={hasPrize} onPrize={setPrizeOpen} />

        {votingOpen && (
          <p className="mp-howto">
            Toca el <span aria-hidden="true">♡</span> para votar por tus favoritos: hasta <b>{limit}</b> fotos y, aparte, hasta <b>{limit}</b> videos.
            <span className="mp-left">
              <span className={left.image ? '' : 'out'}>Fotos: te {left.image === 1 ? 'queda' : 'quedan'} {left.image}</span>
              <span className={left.video ? '' : 'out'}>Videos: te {left.video === 1 ? 'queda' : 'quedan'} {left.video}</span>
            </span>
          </p>
        )}

        <nav className="mp-filters" aria-label="Filtrar">
          {[['all', 'Todo', items.length], ['photos', 'Fotos', nPhotos], ['videos', 'Videos', nVideos]].map(([k, label, n]) => (
            <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{label}{status === 'ready' && <small>{n}{next ? '+' : ''}</small>}</button>
          ))}
        </nav>

        {status === 'loading' && <div className="mp-grid">{Array.from({ length: 10 }, (_, i) => <div key={i} className="mp-skel" style={{ aspectRatio: i % 3 === 0 ? '3/4' : i % 3 === 1 ? '1/1' : '4/3' }} />)}</div>}
        {status === 'error' && (
          <div className="mp-state"><p>{error || 'No pudimos cargar el álbum.'}</p><button className="mp-ghost" onClick={() => { setStatus('loading'); loadFirst() }}>Reintentar</button></div>
        )}
        {status === 'ready' && shown.length === 0 && (
          <div className="mp-state">
            <h2>{items.length ? 'Nada por aquí' : 'Aún no hay fotos'}</h2>
            <p>{items.length ? 'Prueba con otro filtro.' : 'Sé la primera persona en subir una.'}</p>
          </div>
        )}
        {status === 'ready' && shown.length > 0 && (
          <div className="mp-masonry">
            {columns.map((col, c) => (
              <div key={c} className="mp-col">
                {col.map(({ it, i }) => (
                  <div key={it.id} className="mp-tile-wrap">
                    <button className="mp-tile" style={{ aspectRatio: ratio(it) }} onClick={() => setViewer({ list: shown, index: i })} aria-label={`Abrir ${it.type === 'video' ? 'video' : 'foto'} ${i + 1}`}>
                      <img src={it.thumb} alt="" loading="lazy" decoding="async" />
                      {it.type === 'video' && <span className="mp-badge"><Icon d={ICONS.play} size={14} />{fmtDuration(it.duration)}</span>}
                    </button>
                    <VoteButton item={it} mine={mine} open={votingOpen} onVote={vote} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        <div ref={sentinel} className="mp-sentinel">{loadingMore && 'Cargando más…'}</div>
      </main>

      <UploadTray queue={queue} onRetry={retry} onDismiss={dismissTray} />
      {dragging && <div className="mp-drop"><div><Icon d={ICONS.upload} size={40} /><p>Suelta para subir</p></div></div>}
      {viewer && (
        <Lightbox
          items={viewer.list} index={viewer.index}
          onIndex={fn => setViewer(v => v && { ...v, index: typeof fn === 'function' ? fn(v.index) : fn })}
          onClose={() => setViewer(null)} isAdmin={isAdmin} onDelete={remove}
          mine={mine} open={votingOpen} onVote={vote}
        />
      )}
      {prizeOpen && <PrizeDialog cat={prizeOpen} cfg={cfg} onClose={() => setPrizeOpen(null)} />}
      {pendingFiles && (
        <NameDialog
          count={pendingFiles.length}
          initial={(() => { try { return localStorage.getItem(NAME_STORAGE) || '' } catch { return '' } })()}
          onConfirm={startUpload} onClose={() => setPendingFiles(null)}
        />
      )}
      <div className={`mp-toast ${toast ? 'on' : ''}`} role="status" aria-live="polite">{toast}</div>
    </div>
  )
}
