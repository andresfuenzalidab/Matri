import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import '../../styles/media.css'

// Guest-facing album, opened from the QR code (`/fotos?k=...`). No invitation
// token needed — access is the optional shared key `k` in the link.

const KEY = new URLSearchParams(window.location.search).get('k') || ''
const POLL_MS = 30000
const MAX_PARALLEL = 3

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

const Icon = ({ d, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
)
const ICONS = {
  upload: 'M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3',
  close: 'M6 6l12 12M18 6 6 18',
  prev: 'm15 5-7 7 7 7',
  next: 'm9 5 7 7-7 7',
  download: 'M12 4v12M7 11l5 5 5-5M4 20h16',
  trash: 'M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13',
  play: 'M8 5v14l11-7z',
  check: 'm5 12 5 5 9-10',
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

async function uploadOne(file, onProgress) {
  const { uploadUrl } = await apiJson(`/api/media/upload-session${qs()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: file.name, mimeType: file.type, size: file.size }),
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
        <b>{working ? `Subiendo ${done + 1 > queue.length ? queue.length : done + 1} de ${queue.length}…` : `${done} de ${queue.length} subidos`}</b>
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

// ── Lightbox ─────────────────────────────────────────────────────────────

function Lightbox({ items, index, onIndex, onClose, isAdmin, onDelete }) {
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
      <div className="mp-lb-foot">{new Date(item.createdAt).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })} · {fmtSize(item.size)}</div>
    </div>
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
  const [open, setOpen] = useState(-1)
  const [queue, setQueue] = useState([])
  const [dragging, setDragging] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const inputRef = useRef(null)
  const sentinel = useRef(null)
  const filesRef = useRef(new Map())
  const runningRef = useRef(0)
  const dragDepth = useRef(0)

  const fetchPage = useCallback(pageToken => apiJson(`/api/media${qs(pageToken ? `pageToken=${encodeURIComponent(pageToken)}` : '')}`), [])

  const loadFirst = useCallback(async () => {
    try {
      const d = await fetchPage()
      setItems(d.items); setNext(d.nextPageToken); setStatus('ready')
    } catch (e) { setError(e.message); setStatus('error') }
  }, [fetchPage])
  useEffect(() => { loadFirst() }, [loadFirst])

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
      uploadOne(filesRef.current.get(w.id), p => patch(w.id, { progress: p }))
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

  const addFiles = useCallback(fileList => {
    const files = [...fileList].filter(f => /^(image|video)\//.test(f.type))
    if (!files.length) { setError('Solo se pueden subir fotos y videos.'); return }
    setError('')
    const entries = files.map(f => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      filesRef.current.set(id, f)
      return { id, name: f.name, state: 'queued', progress: 0, error: '', preview: f.type.startsWith('image/') && f.size < 25 * 1024 ** 2 ? URL.createObjectURL(f) : null }
    })
    setQ(q => [...q.filter(x => x.state !== 'done'), ...entries])
    pump()
  }, [pump, setQ])

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
      setOpen(-1)
    } catch (e) { setError(e.message) }
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

  return (
    <div className="mp-root">
      <header className="mp-hero">
        <div className="mp-eyebrow">Andrés &amp; Catalina · 6 de noviembre de 2026</div>
        <h1>Nuestro álbum</h1>
        <p>Cada foto y cada video de hoy es un regalo. Sube los tuyos y mira los de todos los que celebraron con nosotros.</p>
        <button className="mp-cta" onClick={() => inputRef.current?.click()}><Icon d={ICONS.upload} /> Subir fotos y videos</button>
        <input ref={inputRef} type="file" accept="image/*,video/*" multiple hidden onChange={e => { addFiles(e.target.files); e.target.value = '' }} />
        {error && <p className="mp-error" role="alert">{error}</p>}
      </header>

      <nav className="mp-filters" aria-label="Filtrar">
        {[['all', 'Todo', items.length], ['photos', 'Fotos', nPhotos], ['videos', 'Videos', nVideos]].map(([k, label, n]) => (
          <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{label}{status === 'ready' && <small>{n}{next ? '+' : ''}</small>}</button>
        ))}
      </nav>

      <main className="mp-main">
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
                  <button key={it.id} className="mp-tile" style={{ aspectRatio: ratio(it) }} onClick={() => setOpen(i)} aria-label={`Abrir ${it.type === 'video' ? 'video' : 'foto'} ${i + 1}`}>
                    <img src={it.thumb} alt="" loading="lazy" decoding="async" />
                    {it.type === 'video' && <span className="mp-badge"><Icon d={ICONS.play} size={14} />{fmtDuration(it.duration)}</span>}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
        <div ref={sentinel} className="mp-sentinel">{loadingMore && 'Cargando más…'}</div>
      </main>

      <UploadTray queue={queue} onRetry={retry} onDismiss={dismissTray} />
      {dragging && <div className="mp-drop"><div><Icon d={ICONS.upload} size={40} /><p>Suelta para subir</p></div></div>}
      {open >= 0 && <Lightbox items={shown} index={open} onIndex={setOpen} onClose={() => setOpen(-1)} isAdmin={isAdmin} onDelete={remove} />}
    </div>
  )
}
