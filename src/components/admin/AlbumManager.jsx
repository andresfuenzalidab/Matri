import { useState, useEffect, useMemo, useCallback } from 'react'
import '../../styles/album-admin.css'

const CHUNK = 15 // matches the server cap per delete call

/**
 * Admin cleanup of the guest album: browse every upload, delete the ones you
 * don't want (they go to the Drive trash), and reset the vote ranking.
 * `mediaKey` is only needed to draw thumbnails when MEDIA_KEY is set.
 */
export default function AlbumManager({ token, mediaKey }) {
  const headers = useMemo(() => ({ 'X-Invite-Token': token, 'Content-Type': 'application/json' }), [token])
  const [items, setItems] = useState([])
  const [next, setNext] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState('')
  const [loadingMore, setLoadingMore] = useState(false)
  const [counts, setCounts] = useState({})
  const [totals, setTotals] = useState({ image: 0, video: 0 })
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(() => new Set())
  const [busy, setBusy] = useState('') // message while deleting
  const [arm, setArm] = useState('') // two-step confirmations: 'delete' | 'reset-all' | 'reset-image' | 'reset-video'
  const [note, setNote] = useState('')

  const listUrl = useCallback(pageToken => {
    const p = new URLSearchParams()
    if (mediaKey) p.set('k', mediaKey)
    if (pageToken) p.set('pageToken', pageToken)
    return `/api/media${p.toString() ? `?${p}` : ''}`
  }, [mediaKey])

  const loadCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/media', { headers })
      const d = await res.json().catch(() => ({}))
      if (res.ok) { setCounts(d.counts || {}); setTotals(d.totals || { image: 0, video: 0 }) }
    } catch { /* counts are optional decoration */ }
  }, [headers])

  const loadFirst = useCallback(async () => {
    setStatus('loading'); setError('')
    try {
      const res = await fetch(listUrl())
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error || 'No se pudo cargar el álbum.')
      setItems(d.items); setNext(d.nextPageToken); setSelected(new Set()); setStatus('ready')
    } catch (e) { setError(e.message); setStatus('error') }
    loadCounts()
  }, [listUrl, loadCounts])
  useEffect(() => { const t = setTimeout(loadFirst, 300); return () => clearTimeout(t) }, [loadFirst])

  async function loadMore() {
    if (!next || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await fetch(listUrl(next))
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error || 'No se pudo cargar más.')
      setItems(cur => { const seen = new Set(cur.map(i => i.id)); return [...cur, ...d.items.filter(i => !seen.has(i.id))] })
      setNext(d.nextPageToken)
    } catch (e) { setError(e.message) }
    setLoadingMore(false)
  }

  const shown = items.filter(i => filter === 'all' || i.type === (filter === 'photos' ? 'image' : 'video'))
  const toggle = id => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const allShownSelected = shown.length > 0 && shown.every(i => selected.has(i.id))
  const selectAll = () => setSelected(allShownSelected ? new Set() : new Set(shown.map(i => i.id)))

  async function deleteSelected() {
    if (arm !== 'delete') { setArm('delete'); return }
    setArm(''); setError(''); setNote('')
    const ids = [...selected]
    const gone = new Set(); let failed = 0
    for (let i = 0; i < ids.length; i += CHUNK) {
      setBusy(`Eliminando ${Math.min(i + CHUNK, ids.length)} de ${ids.length}…`)
      try {
        const res = await fetch('/api/admin/media', { method: 'POST', headers, body: JSON.stringify({ action: 'delete', ids: ids.slice(i, i + CHUNK) }) })
        const d = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(d?.error || 'Error al eliminar.')
        d.deleted.forEach(id => gone.add(id)); failed += d.failed.length
      } catch (e) { setError(e.message); failed += ids.slice(i, i + CHUNK).length }
    }
    setBusy('')
    setItems(cur => cur.filter(i => !gone.has(i.id)))
    setSelected(new Set())
    setNote(`${gone.size} eliminado${gone.size === 1 ? '' : 's'}${failed ? `, ${failed} con error` : ''}. Quedan en la papelera de Drive.`)
    loadCounts()
  }

  async function resetVotes(category) {
    const key = `reset-${category || 'all'}`
    if (arm !== key) { setArm(key); return }
    setArm(''); setError(''); setNote('')
    try {
      const res = await fetch('/api/admin/media', { method: 'POST', headers, body: JSON.stringify({ action: 'reset-votes', category }) })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error || 'No se pudo reiniciar.')
      setNote('Votos reiniciados.')
      loadCounts()
    } catch (e) { setError(e.message) }
  }

  const Confirm = ({ id, children, onClick, danger = true, disabled }) => (
    <button className={`btn ${danger ? 'btn-secondary' : 'btn-primary'}`} disabled={disabled} onClick={onClick} onBlur={() => setArm(a => (a === id ? '' : a))}
      style={arm === id ? { background: '#b03e2c', borderColor: '#b03e2c', color: '#fff' } : danger ? { color: '#b03e2c' } : undefined}>
      {arm === id ? '¿Seguro? Confirmar' : children}
    </button>
  )

  return (
    <div className="create-form" style={{ display: 'grid', gap: '0.8rem' }}>
      <div className="create-form-title">Archivos y votos</div>
      <p style={{ margin: 0, fontSize: '0.82rem', opacity: 0.7 }}>
        Toca las miniaturas para seleccionarlas y elimínalas (van a la papelera de Drive, se pueden recuperar desde ahí).
        Votos hasta ahora: <strong>{totals.image}</strong> en fotos · <strong>{totals.video}</strong> en videos.
      </p>

      <div className="aa-toolbar">
        <div className="aa-seg" role="tablist">
          {[['all', 'Todo'], ['photos', 'Fotos'], ['videos', 'Videos']].map(([k, label]) => (
            <button key={k} role="tab" aria-selected={filter === k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{label}</button>
          ))}
        </div>
        <button className="btn btn-secondary" onClick={selectAll} disabled={!shown.length}>{allShownSelected ? 'Quitar selección' : `Seleccionar todo (${shown.length})`}</button>
        <Confirm id="delete" onClick={deleteSelected} disabled={!selected.size || !!busy}>Eliminar seleccionados ({selected.size})</Confirm>
        <span style={{ flex: 1 }} />
        <Confirm id="reset-image" onClick={() => resetVotes('image')}>Reiniciar votos de fotos</Confirm>
        <Confirm id="reset-video" onClick={() => resetVotes('video')}>Reiniciar votos de videos</Confirm>
        <Confirm id="reset-all" onClick={() => resetVotes()}>Reiniciar todos los votos</Confirm>
      </div>

      {busy && <p style={{ margin: 0, fontSize: '0.85rem' }} role="status">{busy}</p>}
      {note && <p style={{ margin: 0, fontSize: '0.85rem', color: '#4d7a3a' }} role="status">{note}</p>}
      {error && <p className="form-error" role="alert" style={{ margin: 0 }}>{error}</p>}

      {status === 'loading' && <p className="text-muted">Cargando archivos…</p>}
      {status === 'error' && <button className="btn btn-secondary" onClick={loadFirst}>Reintentar</button>}
      {status === 'ready' && shown.length === 0 && <p style={{ opacity: 0.6, textAlign: 'center', padding: '1rem' }}>No hay archivos {filter === 'all' ? 'en el álbum' : 'de este tipo'}.</p>}
      {status === 'ready' && shown.length > 0 && (
        <div className="aa-grid">
          {shown.map(it => {
            const on = selected.has(it.id)
            return (
              <div key={it.id} className={`aa-tile ${on ? 'on' : ''}`}>
                <button type="button" className="aa-pick" onClick={() => toggle(it.id)} aria-pressed={on} aria-label={`${on ? 'Quitar' : 'Seleccionar'} ${it.name}`}>
                  <img src={it.thumb} alt="" loading="lazy" />
                  <span className="aa-check" aria-hidden="true">{on ? '✓' : ''}</span>
                  {it.type === 'video' && <span className="aa-kind">▶ video</span>}
                  {counts[it.id] > 0 && <span className="aa-votes">♥ {counts[it.id]}</span>}
                </button>
                <a className="aa-open" href={it.src} target="_blank" rel="noopener noreferrer" aria-label="Abrir en pestaña nueva" title="Abrir">↗</a>
              </div>
            )
          })}
        </div>
      )}
      {next && status === 'ready' && <button className="btn btn-secondary" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Cargando…' : 'Cargar más'}</button>}
    </div>
  )
}
