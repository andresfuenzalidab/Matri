import { useState, useEffect, useMemo, useCallback } from 'react'
import Ceremony from '../media/Ceremony.jsx'
import '../../styles/album-admin.css'

const CHUNK = 15 // matches the server cap per delete call

/**
 * Admin cleanup of the guest album: browse every upload, delete the ones you
 * don't want (they go to the Drive trash), and reset the vote ranking.
 * `mediaKey` is only needed to draw thumbnails when MEDIA_KEY is set.
 */
export default function AlbumManager({ token, mediaKey, onReset }) {
  const headers = useMemo(() => ({ 'X-Invite-Token': token, 'Content-Type': 'application/json' }), [token])
  const [items, setItems] = useState([])
  const [next, setNext] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState('')
  const [loadingMore, setLoadingMore] = useState(false)
  const [counts, setCounts] = useState({})
  const [totals, setTotals] = useState({ image: 0, video: 0 })
  const [uploaders, setUploaders] = useState({}) // fileId -> who uploaded it (private)
  const [ranking, setRanking] = useState({ image: [], video: [] })
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(() => new Set())
  const [busy, setBusy] = useState('') // message while deleting
  const [arm, setArm] = useState('') // two-step confirmations: 'delete' | 'reset-all' | 'reset-image' | 'reset-video'
  const [note, setNote] = useState('')
  const [preview, setPreview] = useState(null) // { cfg } while the ceremony rehearsal is open
  const [confirmText, setConfirmText] = useState('')
  const [resetting, setResetting] = useState('') // progress message while resetting the whole contest

  const listUrl = useCallback(pageToken => {
    const p = new URLSearchParams()
    if (mediaKey) p.set('k', mediaKey)
    if (pageToken) p.set('pageToken', pageToken)
    return `/api/media${p.toString() ? `?${p}` : ''}`
  }, [mediaKey])

  const loadCounts = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/media${mediaKey ? `?k=${encodeURIComponent(mediaKey)}` : ''}`, { headers })
      const d = await res.json().catch(() => ({}))
      if (res.ok) {
        setCounts(d.counts || {}); setTotals(d.totals || { image: 0, video: 0 })
        setUploaders(d.uploaders || {}); setRanking(d.ranking || { image: [], video: [] })
      }
    } catch { /* counts are optional decoration */ }
  }, [headers, mediaKey])

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

  // Rehearse the awards with the current ranking (works with voting still open).
  async function openPreview() {
    setError('')
    try {
      const res = await fetch('/api/media/config', { headers })
      const cfg = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(cfg?.error || 'No se pudo cargar la configuración.')
      await loadCounts()
      setPreview({ cfg })
    } catch (e) { setError(e.message) }
  }

  // Full reset for dress rehearsals: every file to the Drive trash, every vote gone,
  // deadline removed, voting reopened. Texts and prizes are kept.
  async function resetContest() {
    setError(''); setNote('')
    const call = async body => {
      const res = await fetch('/api/admin/media', { method: 'POST', headers, body: JSON.stringify(body) })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d?.error || 'Error al reiniciar.')
      return d
    }
    try {
      let total = 0
      for (let guard = 0; guard < 500; guard++) {
        setResetting(total ? `Eliminando archivos… (${total})` : 'Eliminando archivos…')
        const d = await call({ action: 'trash-batch' })
        total += d.deleted
        if (!d.remaining) break
      }
      setResetting('Reiniciando votos y plazo…')
      await call({ action: 'reset-votes' })
      const res = await fetch('/api/media/config', { method: 'PUT', headers, body: JSON.stringify({ values: { album_voting_deadline: '', album_voting_open: '1' } }) })
      if (!res.ok) throw new Error('Se borró todo, pero no se pudo reabrir las votaciones: revísalo en «Mensaje, premios y votaciones».')
      setNote(`Concurso reiniciado: ${total} archivo${total === 1 ? '' : 's'} a la papelera de Drive, votos en cero y votaciones abiertas.`)
      setConfirmText('')
      onReset?.()
      await loadFirst()
    } catch (e) { setError(e.message); loadFirst() }
    setResetting('')
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

      <div className="aa-awards">
        <div className="aa-awards-title">Premiación (ranking actual)</div>
        {[['image', 'Mejores fotos'], ['video', 'Mejores videos']].map(([cat, title]) => (
          <div key={cat} className="aa-award">
            <strong>{title}</strong>
            {ranking[cat].length === 0 ? <span style={{ opacity: 0.55, fontSize: '0.82rem' }}>Aún sin votos</span> : (
              <ol>
                {ranking[cat].slice(0, 3).map((it, i) => (
                  <li key={it.id}>
                    <a href={it.src} target="_blank" rel="noopener noreferrer" className="aa-award-thumb" title="Abrir"><img src={it.thumb} alt="" /></a>
                    <span><b>{i + 1}.</b> {it.votes} {it.votes === 1 ? 'voto' : 'votos'}<br /><span className="aa-who">{uploaders[it.id] ? `Subió: ${uploaders[it.id]}` : 'Sin nombre registrado'}</span></span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        ))}
      </div>

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
                  {uploaders[it.id] && <span className="aa-name" title={`Subió: ${uploaders[it.id]}`}>{uploaders[it.id]}</span>}
                </button>
                <a className="aa-open" href={it.src} target="_blank" rel="noopener noreferrer" aria-label="Abrir en pestaña nueva" title="Abrir">↗</a>
              </div>
            )
          })}
        </div>
      )}
      {next && status === 'ready' && <button className="btn btn-secondary" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Cargando…' : 'Cargar más'}</button>}

      <div className="aa-test">
        <div className="aa-awards-title">Pruebas del concurso</div>
        <p style={{ margin: 0, fontSize: '0.82rem', opacity: 0.75 }}>
          <strong>Probar la premiación</strong> muestra la ceremonia con el ranking de ahora mismo, sin cerrar nada: úsala para ensayar.
          Para ver el cierre real, pon un plazo de unos minutos más adelante arriba y espera la cuenta regresiva.
        </p>
        <div><button className="btn btn-primary" onClick={openPreview}>Probar la premiación</button></div>

        <hr style={{ border: 0, borderTop: '1px solid var(--color-divider)', width: '100%', margin: '0.25rem 0' }} />
        <p style={{ margin: 0, fontSize: '0.82rem', opacity: 0.75 }}>
          <strong style={{ color: '#b03e2c' }}>Reiniciar el concurso</strong> deja todo como nuevo para repetir la prueba: elimina <strong>todas</strong> las fotos y videos
          (van a la papelera de Drive), borra todos los votos, quita la fecha de cierre y reabre las votaciones. Los textos y premios se mantienen.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="input" style={{ maxWidth: 200 }} placeholder="Escribe REINICIAR" value={confirmText} onChange={e => setConfirmText(e.target.value)} disabled={!!resetting} aria-label="Escribe REINICIAR para confirmar" />
          <button className="btn btn-secondary" style={{ color: '#b03e2c', borderColor: '#b03e2c' }} onClick={resetContest} disabled={confirmText.trim().toUpperCase() !== 'REINICIAR' || !!resetting}>
            {resetting || 'Limpiar todo y reiniciar'}
          </button>
        </div>
      </div>

      {preview && <Ceremony ranking={ranking} cfg={preview.cfg} names={uploaders} onClose={() => setPreview(null)} />}
    </div>
  )
}
