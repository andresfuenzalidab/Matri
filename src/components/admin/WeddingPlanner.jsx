import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useApp } from '../../context/AppContext'
import {
  MESES, DIAS, ESTADOS, toISO, parse, addDays, diffDays, hoyISO, diaSemana, fechaCorta,
  uid, ahora, clone, iniciales, semilla, esPlanValido, fusionar,
  linkGoogle, linkOutlook, generarICS,
} from '../../utils/planner.js'
import '../../styles/planner.css'

const SAVE_DELAY = 700
const POLL_MS = 20000
const VISTAS = [['timeline', 'Timeline'], ['calendario', 'Calendario'], ['lista', 'Lista'], ['ajustes', 'Ajustes']]

function descargar(texto, archivo, mime) {
  const url = URL.createObjectURL(new Blob([texto], { type: mime }))
  const a = document.createElement('a')
  a.href = url; a.download = archivo
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

// ── Small pieces ─────────────────────────────────────────────────────────

function Avatars({ doc, h }) {
  const rs = h.responsables.map(id => doc.responsables.find(r => r.id === id)).filter(Boolean)
  return (
    <span className="wp-avs">
      {rs.map(r => <span key={r.id} className="wp-av" style={{ '--c': r.color }} title={r.nombre}>{iniciales(r.nombre)}</span>)}
    </span>
  )
}

function cuando(h) {
  if (!h.fecha) return 'Por definir'
  return fechaCorta(h.fecha) + (h.fechaFin ? ' → ' + fechaCorta(h.fechaFin) : '') + (h.hora ? ' · ' + h.hora : '')
}

const atrasado = h => h.tipo === 'tarea' && h.estado !== 'listo' && h.fecha && (h.fechaFin || h.fecha) < hoyISO()

function Meta({ doc, h, conFecha }) {
  const ev = doc.eventos.find(e => e.id === h.eventoId) || { nombre: 'Sin evento', color: '#8A8C78' }
  const hoy = hoyISO()
  let rel = null
  if (atrasado(h)) rel = <span className="wp-chip wp-warn"><i />Atrasado</span>
  else if (h.fecha && h.estado !== 'listo' && h.fecha >= hoy) {
    const n = diffDays(hoy, h.fecha)
    rel = <span className="wp-chip wp-plain">{n === 0 ? 'Hoy' : n === 1 ? 'Mañana' : `En ${n} días`}</span>
  }
  return (
    <div className="wp-meta">
      <Avatars doc={doc} h={h} />
      <span className="wp-chip" style={{ '--c': ev.color }}><i />{ev.nombre}</span>
      {h.categoria && <span className="wp-chip wp-plain">{h.categoria}</span>}
      {conFecha
        ? <span className="wp-chip wp-plain">{cuando(h)}</span>
        : (h.fechaFin || h.hora) && <span className="wp-chip wp-plain">{h.fechaFin ? 'hasta ' + fechaCorta(h.fechaFin) : h.hora}</span>}
      {h.estado === 'en_curso' && <span className="wp-chip" style={{ '--c': 'var(--color-accent)' }}><i />En curso</span>}
      {rel}
      {h.sugerido && <span className="wp-chip wp-sug"><i />Sugerido</span>}
    </div>
  )
}

function Check({ h, onToggle }) {
  return (
    <input
      type="checkbox" className="wp-chk" checked={h.estado === 'listo'}
      onChange={e => onToggle(h.id, e.target.checked)}
      aria-label={`Marcar listo: ${h.titulo}`}
    />
  )
}

function Fila({ doc, h, onToggle, onEdit, drag }) {
  const ev = doc.eventos.find(e => e.id === h.eventoId)
  return (
    <div
      className={`wp-row ${h.estado}`} style={{ '--ev': ev?.color || '#8A8C78' }}
      draggable={!!drag} onDragStart={drag ? e => { e.dataTransfer.setData('text/plain', h.id); e.dataTransfer.effectAllowed = 'move' } : undefined}
    >
      <Check h={h} onToggle={onToggle} />
      <div className="wp-row-main">
        <button className="wp-ttl" onClick={() => onEdit(h.id)}>{h.titulo}</button>
        <Meta doc={doc} h={h} />
        {h.notas && <p className="wp-notes">{h.notas}</p>}
      </div>
      <div className={`wp-when ${atrasado(h) ? 'wp-warn-txt' : ''}`}>{cuando(h)}</div>
    </div>
  )
}

// ── Views ────────────────────────────────────────────────────────────────

function Timeline({ doc, items, onToggle, onEdit }) {
  if (!items.length) return <p className="wp-empty">No hay hitos con estos filtros.</p>
  const hoy = hoyISO()
  const fechados = items.filter(h => h.fecha)
  const sin = items.filter(h => !h.fecha)

  // Group by month, dropping the "today" marker at the first task on/after today.
  const meses = []
  for (const h of fechados) {
    const m = h.fecha.slice(0, 7)
    let g = meses[meses.length - 1]
    if (!g || g.m !== m) { g = { m, hs: [] }; meses.push(g) }
    g.hs.push(h)
  }
  const primeroHoy = fechados.find(h => h.fecha >= hoy)
  const hoyAlFinal = !primeroHoy && fechados.length > 0
  const hoyRow = <li className="wp-today" key="hoy"><span className="wp-today-lbl">Hoy</span><span className="wp-today-dot" /><hr /></li>

  return (
    <>
      {meses.map(g => {
        const d = parse(g.hs[0].fecha)
        let prev = ''
        return (
          <div key={g.m}>
            <div className="wp-month"><h2>{MESES[d.getMonth()]} {d.getFullYear()}</h2><span>{g.hs.length} {g.hs.length === 1 ? 'hito' : 'hitos'}</span></div>
            <ol className="wp-tl">
              {g.hs.flatMap(h => {
                const ev = doc.eventos.find(e => e.id === h.eventoId)
                const same = prev === h.fecha
                prev = h.fecha
                const out = []
                if (primeroHoy && h.id === primeroHoy.id) out.push(hoyRow)
                out.push(
                  <li key={h.id} className={`wp-tl-item ${h.tipo} ${h.estado} ${same ? 'same' : ''}`} style={{ '--ev': ev?.color || '#8A8C78' }}>
                    <div className="wp-tl-date"><b>{parse(h.fecha).getDate()}</b><span>{diaSemana(h.fecha)}</span></div>
                    <div className="wp-tl-node" />
                    <article className="wp-tl-card">
                      <div className="wp-tl-head">
                        {h.tipo === 'tarea' && <Check h={h} onToggle={onToggle} />}
                        <div className="wp-row-main">
                          <button className="wp-ttl" onClick={() => onEdit(h.id)}>{h.titulo}</button>
                          <Meta doc={doc} h={h} />
                          {h.notas && <p className="wp-notes">{h.notas}</p>}
                        </div>
                      </div>
                    </article>
                  </li>
                )
                return out
              })}
              {hoyAlFinal && g === meses[meses.length - 1] && hoyRow}
            </ol>
          </div>
        )
      })}
      {sin.length > 0 && (
        <div className="wp-tbd">
          <h2>Por definir fecha</h2>
          <div className="wp-tbd-list">{sin.map(h => <Fila key={h.id} doc={doc} h={h} onToggle={onToggle} onEdit={onEdit} />)}</div>
        </div>
      )}
    </>
  )
}

function Calendario({ doc, items, ui, setUi, onToggle, onEdit, onNew, onMove }) {
  const hoy = hoyISO()
  const first = parse(ui.mes)
  const start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7))
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0)
  const semanas = Math.ceil((((first.getDay() + 6) % 7) + last.getDate()) / 7)
  const enDia = s => items.filter(h => h.fecha && h.fecha <= s && (h.fechaFin || h.fecha) >= s)
  const [drop, setDrop] = useState(null)
  const colorEv = id => doc.eventos.find(e => e.id === id)?.color || '#8A8C78'

  const celdas = []
  for (let i = 0; i < semanas * 7; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i)
    const s = toISO(d)
    const band = doc.eventos.find(e => e.fecha && e.fecha <= s && (e.fechaFin || e.fecha) >= s)
    const hs = enDia(s).sort((a, b) => (a.tipo === 'clave' ? -1 : 1) - (b.tipo === 'clave' ? -1 : 1))
    const label = band && (band.fecha === s || i % 7 === 0 || d.getDate() === 1) ? band.nombre : ''
    celdas.push(
      <div
        key={s} role="button" tabIndex={0} aria-label={`${fechaCorta(s)}, ${hs.length} hitos`}
        className={`wp-cell ${d.getMonth() !== first.getMonth() ? 'out' : ''} ${s === hoy ? 'hoy' : ''} ${ui.dia === s ? 'sel' : ''} ${band ? 'band' : ''} ${drop === s ? 'drop' : ''}`}
        style={band ? { '--band': band.color } : undefined}
        onClick={() => setUi(u => ({ ...u, dia: u.dia === s ? null : s }))}
        onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setUi(u => ({ ...u, dia: u.dia === s ? null : s })) } }}
        onDragOver={e => { e.preventDefault(); setDrop(s) }}
        onDragLeave={() => setDrop(v => (v === s ? null : v))}
        onDrop={e => { e.preventDefault(); setDrop(null); onMove(e.dataTransfer.getData('text/plain'), s) }}
      >
        <div className="wp-num"><span>{d.getDate()}</span>{label && <em>{label}</em>}</div>
        {hs.slice(0, 3).map(h => (
          <div
            key={h.id} title={h.titulo} draggable
            className={`wp-ci ${h.tipo} ${h.estado} ${atrasado(h) ? 'warn' : ''}`} style={{ '--ev': colorEv(h.eventoId) }}
            onDragStart={e => { e.stopPropagation(); e.dataTransfer.setData('text/plain', h.id); e.dataTransfer.effectAllowed = 'move' }}
            onClick={e => { e.stopPropagation(); onEdit(h.id) }}
          >{h.titulo}</div>
        ))}
        {hs.length > 3 && <div className="wp-more">+{hs.length - 3} más</div>}
        <div className="wp-dots">{hs.slice(0, 6).map(h => <i key={h.id} style={{ '--ev': colorEv(h.eventoId) }} />)}</div>
      </div>
    )
  }

  const irMes = n => setUi(u => {
    if (n === 0) { const h = new Date(); return { ...u, mes: toISO(new Date(h.getFullYear(), h.getMonth(), 1)), dia: hoyISO() } }
    const m = parse(u.mes)
    return { ...u, mes: toISO(new Date(m.getFullYear(), m.getMonth() + n, 1)) }
  })
  const sin = items.filter(h => !h.fecha)
  const delDia = ui.dia ? enDia(ui.dia) : []

  return (
    <>
      <div className="wp-cal-head">
        <h2>{MESES[first.getMonth()]} {first.getFullYear()}</h2>
        <button className="btn btn-secondary wp-small" onClick={() => irMes(-1)} aria-label="Mes anterior">‹</button>
        <button className="btn btn-secondary wp-small" onClick={() => irMes(0)}>Hoy</button>
        <button className="btn btn-secondary wp-small" onClick={() => irMes(1)} aria-label="Mes siguiente">›</button>
        <span className="wp-sp" />
        <span className="wp-hint">Toca un día para ver o agregar. Arrastra un hito para cambiarlo de fecha.</span>
      </div>
      <div className="wp-cal-wrap">
        <div className="wp-cal">
          {DIAS.map(d => <div key={d} className="wp-dow">{d}</div>)}
          {celdas}
        </div>
      </div>
      {ui.dia && (
        <div className="wp-day-panel">
          <div className="wp-cal-head" style={{ margin: 0 }}>
            <h3>{fechaCorta(ui.dia)}</h3>
            <button className="btn btn-secondary wp-small" onClick={() => onNew(ui.dia)}>+ Agregar este día</button>
          </div>
          {delDia.length
            ? <div className="wp-rows">{delDia.map(h => <Fila key={h.id} doc={doc} h={h} onToggle={onToggle} onEdit={onEdit} drag />)}</div>
            : <p className="wp-hint">Nada este día.</p>}
        </div>
      )}
      {sin.length > 0 && (
        <div className="wp-day-panel">
          <h3>Por definir fecha</h3>
          <p className="wp-hint">Arrástralos a un día del calendario para agendarlos.</p>
          <div className="wp-rows">{sin.map(h => <Fila key={h.id} doc={doc} h={h} onToggle={onToggle} onEdit={onEdit} drag />)}</div>
        </div>
      )}
    </>
  )
}

function Lista({ doc, items, ui, setUi, onToggle, onEdit }) {
  const a = ui.agrupar
  let grupos
  if (a === 'evento') grupos = doc.eventos.map(e => ({ t: e.nombre, c: e.color, hs: items.filter(h => h.eventoId === e.id) }))
  else if (a === 'responsable') {
    grupos = doc.responsables.map(r => ({ t: r.nombre, c: r.color, hs: items.filter(h => h.responsables.includes(r.id)) }))
    grupos.push({ t: 'Sin responsable', hs: items.filter(h => !h.responsables.length) })
  } else if (a === 'estado') grupos = Object.entries(ESTADOS).map(([k, v]) => ({ t: v, hs: items.filter(h => h.estado === k) }))
  else if (a === 'categoria') {
    const cats = [...new Set([...doc.categorias, ...items.map(h => h.categoria)])]
    grupos = cats.map(c => ({ t: c || 'Sin categoría', hs: items.filter(h => h.categoria === c) }))
  } else grupos = [{ t: 'Todos', hs: items }]
  grupos = grupos.filter(g => g.hs.length)

  return (
    <>
      <div className="wp-list-head">
        <label className="wp-hint" htmlFor="wp-agrupar">Agrupar por</label>
        <select id="wp-agrupar" className="wp-field" style={{ width: 'auto' }} value={a} onChange={e => setUi(u => ({ ...u, agrupar: e.target.value }))}>
          <option value="evento">Evento</option><option value="responsable">Responsable</option><option value="estado">Estado</option>
          <option value="categoria">Categoría</option><option value="nada">Sin agrupar</option>
        </select>
      </div>
      {grupos.length ? grupos.map(g => (
        <section key={g.t} className="wp-grp">
          <h2 style={{ '--c': g.c || 'var(--color-neutral-500)' }}>{g.c && <i />}{g.t} <small>{g.hs.filter(h => h.estado === 'listo').length}/{g.hs.length}</small></h2>
          <div className="wp-rows">{g.hs.map(h => <Fila key={h.id} doc={doc} h={h} onToggle={onToggle} onEdit={onEdit} />)}</div>
        </section>
      )) : <p className="wp-empty">No hay hitos con estos filtros.</p>}
    </>
  )
}

function Ajustes({ doc, mutate, adapterName, onExportICS, onExportJSON, onImport, onReset }) {
  const [nuevaCat, setNuevaCat] = useState('')
  const [armReset, setArmReset] = useState(false)
  const fileRef = useRef(null)
  const cfg = (fn) => mutate(fn, true)
  const setResp = (id, k, v) => cfg(d => { const r = d.responsables.find(x => x.id === id); if (r) r[k] = v })
  const setEv = (id, k, v) => cfg(d => { const e = d.eventos.find(x => x.id === id); if (e) e[k] = (k === 'fecha' || k === 'fechaFin') ? (v || null) : v })

  function delResp(id) {
    cfg(d => {
      d.responsables = d.responsables.filter(r => r.id !== id)
      d.hitos.forEach(h => { if (h.responsables.includes(id)) { h.responsables = h.responsables.filter(x => x !== id); h.updatedAt = ahora() } })
    })
  }
  function delEv(id) {
    if (doc.eventos.length <= 1) return
    cfg(d => {
      d.eventos = d.eventos.filter(e => e.id !== id)
      const destino = (d.eventos.find(e => e.id === 'general') || d.eventos[0]).id
      d.hitos.forEach(h => { if (h.eventoId === id) { h.eventoId = destino; h.updatedAt = ahora() } })
    })
  }
  function addCat() {
    const v = nuevaCat.trim()
    if (!v || doc.categorias.includes(v)) return
    cfg(d => { d.categorias.push(v) }); setNuevaCat('')
  }

  return (
    <div className="wp-set">
      <section>
        <h2>Portada</h2>
        <div className="wp-set-row" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)' }}>
          <input className="wp-field" value={doc.meta.titulo} aria-label="Título" onChange={e => cfg(d => { d.meta.titulo = e.target.value })} />
          <input className="wp-field" value={doc.meta.subtitulo || ''} aria-label="Subtítulo" onChange={e => cfg(d => { d.meta.subtitulo = e.target.value })} />
        </div>
        <p>Usa «&amp;» entre los nombres para que salga destacado.</p>
      </section>

      <section>
        <h2>Responsables</h2>
        <p>Cada hito puede tener uno o varios. Si agregas el correo, el botón de Google Calendar lo deja invitado al evento.</p>
        {doc.responsables.map(r => (
          <div key={r.id} className="wp-set-row wp-set-resp">
            <input type="color" value={r.color} aria-label={`Color de ${r.nombre}`} onChange={e => setResp(r.id, 'color', e.target.value)} />
            <input className="wp-field" value={r.nombre} aria-label="Nombre" onChange={e => setResp(r.id, 'nombre', e.target.value)} />
            <input className="wp-field" type="email" value={r.email || ''} placeholder="correo (para invitar en Google Calendar)" aria-label="Correo" onChange={e => setResp(r.id, 'email', e.target.value)} />
            <button className="btn btn-secondary wp-small wp-danger" onClick={() => delResp(r.id)}>Quitar</button>
          </div>
        ))}
        <div><button className="btn btn-secondary wp-small" onClick={() => cfg(d => { d.responsables.push({ id: uid('r'), nombre: 'Nueva persona', color: '#6E7FA8', email: '' }) })}>+ Agregar responsable</button></div>
      </section>

      <section>
        <h2>Eventos</h2>
        <p>Agrupan los hitos y aparecen en la cuenta regresiva y como franja de color en el calendario.</p>
        {doc.eventos.map(e => (
          <div key={e.id} className="wp-set-row">
            <input type="color" value={e.color} aria-label={`Color de ${e.nombre}`} onChange={ev => setEv(e.id, 'color', ev.target.value)} />
            <input className="wp-field" value={e.nombre} aria-label="Nombre del evento" onChange={ev => setEv(e.id, 'nombre', ev.target.value)} />
            <input className="wp-field" type="date" value={e.fecha || ''} aria-label="Fecha" onChange={ev => setEv(e.id, 'fecha', ev.target.value)} />
            <input className="wp-field" type="date" value={e.fechaFin || ''} aria-label="Hasta (opcional)" onChange={ev => setEv(e.id, 'fechaFin', ev.target.value)} />
            <input className="wp-field" value={e.lugar || ''} placeholder="Lugar" aria-label="Lugar" onChange={ev => setEv(e.id, 'lugar', ev.target.value)} />
            <button className="btn btn-secondary wp-small wp-danger" onClick={() => delEv(e.id)}>Quitar</button>
          </div>
        ))}
        <div><button className="btn btn-secondary wp-small" onClick={() => cfg(d => { d.eventos.push({ id: uid('e'), nombre: 'Nuevo evento', fecha: null, fechaFin: null, lugar: '', color: '#A0784C' }) })}>+ Agregar evento</button></div>
      </section>

      <section>
        <h2>Categorías</h2>
        <div className="wp-cats">
          {doc.categorias.map((c, i) => (
            <span key={c} className="wp-chip wp-cat">{c}<button aria-label={`Quitar ${c}`} onClick={() => cfg(d => { d.categorias.splice(i, 1) })}>×</button></span>
          ))}
          <input className="wp-field" style={{ width: 180 }} placeholder="Nueva categoría" value={nuevaCat} onChange={e => setNuevaCat(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addCat() }} />
          <button className="btn btn-secondary wp-small" onClick={addCat}>Agregar</button>
        </div>
      </section>

      <section>
        <h2>Calendarios</h2>
        <p>Descarga un archivo .ics e impórtalo en Google Calendar, Apple Calendar u Outlook. También puedes agregar hitos uno a uno desde el detalle de cada hito. Las tareas pendientes traen un recordatorio a las 9:00 del día anterior.</p>
        <div className="wp-btns">
          <button className="btn btn-secondary" onClick={() => onExportICS('')}>Calendario completo (.ics)</button>
          {doc.responsables.map(r => <button key={r.id} className="btn btn-secondary" onClick={() => onExportICS(r.id)}>Solo {r.nombre} (.ics)</button>)}
        </div>
      </section>

      <section>
        <h2>Datos</h2>
        <div className="wp-conn">Guardado en: <b>{adapterName}</b> — ambos administradores ven y editan el mismo plan; los cambios se combinan hito por hito.</div>
        <div className="wp-btns">
          <button className="btn btn-secondary" onClick={onExportJSON}>Exportar respaldo</button>
          <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>Importar respaldo</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={e => { onImport(e.target.files[0]); e.target.value = '' }} />
          <button className="btn btn-secondary wp-danger" onClick={() => { if (!armReset) setArmReset(true); else { setArmReset(false); onReset() } }}>
            {armReset ? 'Confirmar: borrar todo y restaurar' : 'Restaurar hitos de ejemplo'}
          </button>
        </div>
      </section>
    </div>
  )
}

// ── Task modal ───────────────────────────────────────────────────────────

function HitoModal({ doc, hito, fecha, filtros, onSave, onDelete, onClose }) {
  const nuevo = !hito
  const [f, setF] = useState(() => hito ? { ...hito, sinFecha: !hito.fecha } : {
    titulo: '', fecha: fecha || '', fechaFin: '', hora: '', tipo: 'tarea', estado: 'pendiente', sinFecha: false,
    eventoId: filtros.fEvento || doc.eventos[0]?.id || '', categoria: doc.categorias[0] || '',
    responsables: filtros.fResp && filtros.fResp !== '_sin' ? [filtros.fResp] : doc.responsables.map(r => r.id), notas: '',
  })
  const [error, setError] = useState('')
  const [armDel, setArmDel] = useState(false)
  const set = (k, v) => setF(x => ({ ...x, [k]: v }))
  const cats = [...new Set([...doc.categorias, f.categoria].filter(Boolean))]

  function submit(e) {
    e.preventDefault()
    const titulo = f.titulo.trim()
    const fechaOk = f.sinFecha ? null : (f.fecha || null)
    const fin = fechaOk && f.fechaFin ? f.fechaFin : null
    if (!titulo) return setError('Ponle un título al hito.')
    if (!f.sinFecha && !fechaOk) return setError('Elige una fecha o marca «Fecha por definir».')
    if (fin && fin < fechaOk) return setError('La fecha «hasta» no puede ser anterior a la de inicio.')
    onSave({
      titulo, fecha: fechaOk, fechaFin: fin, hora: fechaOk && f.hora ? f.hora : null, tipo: f.tipo, estado: f.estado,
      eventoId: f.eventoId, categoria: f.categoria, responsables: f.responsables, notas: (f.notas || '').trim(),
    })
  }

  const puedeExportar = !nuevo && hito.fecha

  return (
    <div className="wp-modal-wrap" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="wp-modal" role="dialog" aria-modal="true" aria-label={nuevo ? 'Nuevo hito' : 'Editar hito'}>
        <h2>{nuevo ? 'Nuevo hito' : 'Editar hito'}</h2>
        <form className="wp-form" onSubmit={submit} noValidate>
          <label className="wp-full">Título<input autoFocus value={f.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Ej: Reunión con la fotógrafa" /></label>
          <label>Tipo
            <select value={f.tipo} onChange={e => set('tipo', e.target.value)}>
              <option value="tarea">Tarea o plazo</option><option value="clave">Hito clave (ceremonia, viaje)</option>
            </select></label>
          <label>Estado
            <select value={f.estado} onChange={e => set('estado', e.target.value)}>
              {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select></label>
          <label>Fecha<input type="date" value={f.fecha || ''} disabled={f.sinFecha} onChange={e => set('fecha', e.target.value)} /></label>
          <label>Hasta (opcional)<input type="date" value={f.fechaFin || ''} disabled={f.sinFecha} onChange={e => set('fechaFin', e.target.value)} /></label>
          <label>Hora (opcional)<input type="time" value={f.hora || ''} disabled={f.sinFecha} onChange={e => set('hora', e.target.value)} /></label>
          <div className="wp-inline" style={{ alignSelf: 'end', paddingBottom: 8 }}>
            <label><input type="checkbox" checked={f.sinFecha} onChange={e => set('sinFecha', e.target.checked)} /> Fecha por definir</label>
          </div>
          <label>Evento
            <select value={f.eventoId} onChange={e => set('eventoId', e.target.value)}>
              {doc.eventos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select></label>
          <label>Categoría
            <select value={f.categoria} onChange={e => set('categoria', e.target.value)}>
              <option value="">Sin categoría</option>{cats.map(c => <option key={c} value={c}>{c}</option>)}
            </select></label>
          <fieldset className="wp-full"><legend>Responsables</legend>
            <div className="wp-inline">
              {doc.responsables.map(r => (
                <label key={r.id}><input type="checkbox" checked={f.responsables.includes(r.id)}
                  onChange={e => set('responsables', e.target.checked ? [...f.responsables, r.id] : f.responsables.filter(x => x !== r.id))} /> {r.nombre}</label>
              ))}
            </div></fieldset>
          <label className="wp-full">Notas<textarea rows={3} value={f.notas} onChange={e => set('notas', e.target.value)} placeholder="Detalles, contactos, links…" /></label>
          {error && <div className="wp-full wp-err" role="alert">{error}</div>}
          {puedeExportar && (
            <div className="wp-full wp-ext"><span>Agregar a mi calendario</span>
              <a className="btn btn-secondary wp-small" href={linkGoogle(hito, doc)} target="_blank" rel="noopener noreferrer">Google</a>
              <a className="btn btn-secondary wp-small" href={linkOutlook(hito, doc)} target="_blank" rel="noopener noreferrer">Outlook</a>
              <button type="button" className="btn btn-secondary wp-small" onClick={() => descargar(generarICS([hito], doc, hito.titulo), 'hito.ics', 'text/calendar')}>Apple / .ics</button>
            </div>
          )}
          <div className="wp-full wp-actions">
            {!nuevo && <button type="button" className="btn btn-secondary wp-danger" onClick={() => { if (!armDel) setArmDel(true); else onDelete() }}>{armDel ? '¿Seguro? Eliminar' : 'Eliminar'}</button>}
            <span className="wp-sp" />
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────

export default function WeddingPlanner({ onClose }) {
  const { token } = useApp()
  const headers = useMemo(() => ({ 'X-Invite-Token': token, 'Content-Type': 'application/json' }), [token])

  const [doc, setDoc] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [saveState, setSaveState] = useState('saved') // saved | dirty | saving | error
  const [toast, setToast] = useState('')
  const [modal, setModal] = useState(null) // { id?, fecha? }
  const [ui, setUi] = useState(() => {
    const h = new Date()
    let vista = 'timeline'
    try { vista = localStorage.getItem('wp-vista') || vista } catch { /* storage blocked */ }
    return { vista, fResp: '', fEvento: '', fEstado: '', q: '', agrupar: 'evento', mes: `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-01`, dia: null }
  })

  const docRef = useRef(null)
  const dirtyRef = useRef(false)
  const savingRef = useRef(false)
  const timerRef = useRef(null)
  const toastRef = useRef(null)
  docRef.current = doc

  const showToast = useCallback(msg => {
    setToast(msg)
    clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(''), 2600)
  }, [])

  // Initial load (an empty database gets the starter plan).
  const load = useCallback(async () => {
    setLoadError('')
    try {
      const res = await fetch('/api/admin/planner', { headers })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'No se pudo cargar el plan.')
      if (esPlanValido(data.plan)) setDoc(data.plan)
      else { setDoc(semilla()); dirtyRef.current = true; setSaveState('dirty') }
    } catch (e) { setLoadError(e.message) }
  }, [headers])
  useEffect(() => { load() }, [load])

  const save = useCallback(async () => {
    if (savingRef.current || !dirtyRef.current || !docRef.current) return
    savingRef.current = true
    try {
      do {
        dirtyRef.current = false
        setSaveState('saving')
        const res = await fetch('/api/admin/planner', { method: 'PUT', headers, body: JSON.stringify({ plan: docRef.current }) })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || 'No se pudo guardar.')
        // The server returns the plan merged with the other admin's edits.
        if (esPlanValido(data.plan)) setDoc(cur => fusionar(cur, data.plan))
      } while (dirtyRef.current)
      setSaveState('saved')
    } catch (e) {
      dirtyRef.current = true
      setSaveState('error')
      showToast(e.message)
    } finally { savingRef.current = false }
  }, [headers, showToast])

  const schedule = useCallback(() => {
    dirtyRef.current = true
    setSaveState(s => (s === 'saving' ? s : 'dirty'))
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(save, SAVE_DELAY)
  }, [save])

  // Flush pending edits when leaving.
  useEffect(() => () => { clearTimeout(timerRef.current) }, [])
  const cerrar = useCallback(async () => {
    clearTimeout(timerRef.current)
    await save()
    onClose()
  }, [save, onClose])

  // Pick up the other admin's changes.
  useEffect(() => {
    const t = setInterval(async () => {
      if (dirtyRef.current || savingRef.current || document.hidden) return
      try {
        const res = await fetch('/api/admin/planner', { headers })
        const data = await res.json().catch(() => ({}))
        if (res.ok && esPlanValido(data.plan) && !dirtyRef.current) setDoc(cur => fusionar(cur, data.plan))
      } catch { /* try again next tick */ }
    }, POLL_MS)
    return () => clearInterval(t)
  }, [headers])

  useEffect(() => {
    function onKey(e) {
      if (e.key !== 'Escape') return
      if (modal) setModal(null)
      else cerrar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modal, cerrar])

  // Apply an edit to a copy of the plan. `config` bumps the config timestamp
  // so the whole configuration (people, events, categories) wins a merge.
  const mutate = useCallback((fn, config) => {
    const next = clone(docRef.current)
    fn(next)
    next.updatedAt = ahora()
    if (config) next.configUpdatedAt = ahora()
    docRef.current = next
    setDoc(next)
    schedule()
  }, [schedule])

  const onToggle = useCallback((id, listo) => {
    mutate(d => { const h = d.hitos.find(x => x.id === id); if (h) { h.estado = listo ? 'listo' : 'pendiente'; h.updatedAt = ahora() } })
  }, [mutate])

  const onMove = useCallback((id, nueva) => {
    const h = docRef.current.hitos.find(x => x.id === id)
    if (!h) return
    mutate(d => {
      const t = d.hitos.find(x => x.id === id)
      if (t.fechaFin && t.fecha) t.fechaFin = addDays(nueva, diffDays(t.fecha, t.fechaFin))
      t.fecha = nueva; t.updatedAt = ahora()
    })
    showToast(`${h.titulo} → ${fechaCorta(nueva)}`)
  }, [mutate, showToast])

  const visibles = useMemo(() => {
    if (!doc) return []
    const { fResp, fEvento, fEstado, q } = ui
    const qq = q.trim().toLowerCase()
    return doc.hitos.filter(h => !h.deleted).filter(h =>
      (!fResp || (fResp === '_sin' ? !h.responsables.length : h.responsables.includes(fResp))) &&
      (!fEvento || h.eventoId === fEvento) &&
      (!fEstado || (fEstado === 'atrasado' ? atrasado(h) : h.estado === fEstado)) &&
      (!qq || `${h.titulo} ${h.notas} ${h.categoria}`.toLowerCase().includes(qq))
    ).sort((a, b) =>
      (a.fecha || '9999').localeCompare(b.fecha || '9999') ||
      (a.tipo === 'clave' ? -1 : 0) - (b.tipo === 'clave' ? -1 : 0) ||
      a.titulo.localeCompare(b.titulo))
  }, [doc, ui])

  function guardarHito(datos) {
    const id = modal.id
    mutate(d => {
      if (id) Object.assign(d.hitos.find(x => x.id === id), datos, { updatedAt: ahora() })
      else d.hitos.push({ id: uid(), sugerido: false, ...datos, updatedAt: ahora() })
    })
    setModal(null)
    showToast(id ? 'Hito actualizado' : 'Hito agregado')
  }
  function borrarHito() {
    mutate(d => { Object.assign(d.hitos.find(x => x.id === modal.id), { deleted: true, updatedAt: ahora() }) })
    setModal(null)
    showToast('Hito eliminado')
  }

  function exportICS(respId) {
    const r = respId ? doc.responsables.find(x => x.id === respId) : null
    const lista = doc.hitos.filter(h => !h.deleted && (!r || h.responsables.includes(r.id)))
    const nombre = r ? `${doc.meta.subtitulo || 'Matrimonio'} · ${r.nombre}` : doc.meta.subtitulo || 'Plan del matrimonio'
    const archivo = `matrimonio${r ? '-' + r.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-') : ''}.ics`
    descargar(generarICS(lista, doc, nombre), archivo, 'text/calendar')
    showToast(`${lista.filter(h => h.fecha).length} hitos exportados`)
  }
  function exportJSON() { descargar(JSON.stringify(doc, null, 2), 'plan-matrimonio.json', 'application/json') }
  function importar(file) {
    if (!file) return
    const rd = new FileReader()
    rd.onload = () => {
      try {
        const d = JSON.parse(rd.result)
        if (!esPlanValido(d)) throw new Error('formato')
        // Import replaces the plan: stamp everything as "now" so it wins the merge.
        d.configUpdatedAt = ahora(); d.updatedAt = ahora()
        d.hitos.forEach(h => { h.updatedAt = ahora() })
        // Tasks that existed before but are not in the file must be marked deleted
        const ids = new Set(d.hitos.map(h => h.id))
        docRef.current.hitos.forEach(h => { if (!ids.has(h.id)) d.hitos.push({ ...h, deleted: true, updatedAt: ahora() }) })
        docRef.current = d; setDoc(d); schedule(); showToast('Respaldo importado')
      } catch { showToast('Ese archivo no es un respaldo del plan.') }
    }
    rd.readAsText(file)
  }
  function restaurar() {
    const s = semilla()
    s.configUpdatedAt = ahora()
    s.hitos.forEach(h => { h.updatedAt = ahora() })
    docRef.current.hitos.forEach(h => { s.hitos.push({ ...h, deleted: true, updatedAt: ahora() }) })
    docRef.current = s; setDoc(s); schedule(); showToast('Plan restaurado')
  }

  const cambiarVista = v => {
    setUi(u => ({ ...u, vista: v }))
    try { localStorage.setItem('wp-vista', v) } catch { /* storage blocked */ }
  }

  if (loadError) {
    return (
      <div className="wp-root">
        <div className="wp-center">
          <p>{loadError}</p>
          <div className="wp-btns"><button className="btn btn-primary" onClick={load}>Reintentar</button><button className="btn btn-secondary" onClick={onClose}>Cerrar</button></div>
        </div>
      </div>
    )
  }
  if (!doc) return <div className="wp-root"><div className="wp-center"><p>Cargando el plan…</p></div></div>

  const hoy = hoyISO()
  const vivos = doc.hitos.filter(h => !h.deleted)
  const tareas = vivos.filter(h => h.tipo === 'tarea')
  const listos = tareas.filter(h => h.estado === 'listo').length
  const atras = tareas.filter(atrasado).length
  const pct = tareas.length ? Math.round(listos / tareas.length * 100) : 0
  const [t1, t2] = doc.meta.titulo.split('&')
  const saveLabel = { saved: 'Guardado', dirty: 'Cambios sin guardar…', saving: 'Guardando…', error: 'Error al guardar' }[saveState]

  return (
    <div className="wp-root">
      <div className="wp-scroll">
        <div className="wp-app">
          <header className="wp-hd">
            <div className="wp-hd-top">
              <div>
                <div className="wp-eyebrow">{doc.meta.subtitulo || 'Plan del matrimonio'}</div>
                <h1>{t2 !== undefined ? <>{t1.trim()}<span className="wp-amp">&amp;</span>{t2.trim()}</> : doc.meta.titulo}</h1>
              </div>
              <div className="wp-prog">
                <div className="wp-prog-txt"><b>{listos}</b> de {tareas.length} tareas listas{atras > 0 && <> · <span className="wp-warn-txt">{atras} atrasada{atras > 1 ? 's' : ''}</span></>}</div>
                <div className="wp-prog-bar"><i style={{ width: `${pct}%` }} /></div>
              </div>
            </div>
            <div className="wp-cd">
              {doc.eventos.filter(e => e.fecha).map(e => {
                const n = diffDays(hoy, e.fecha)
                const enCurso = e.fechaFin && hoy >= e.fecha && hoy <= e.fechaFin
                return (
                  <div key={e.id} className="wp-cd-item" style={{ '--ev': e.color }}>
                    <span className="wp-cd-name"><i />{e.nombre}</span>
                    <span className="wp-cd-n">{enCurso ? 'Ahora' : n > 0 ? <>{n}<small>{n === 1 ? 'día' : 'días'}</small></> : n === 0 ? 'Hoy' : '✓'}</span>
                    <span className="wp-cd-sub">{enCurso ? `hasta el ${fechaCorta(e.fechaFin)}` : `${fechaCorta(e.fecha)}${e.fechaFin ? ' al ' + fechaCorta(e.fechaFin) : ''}${e.lugar ? ' · ' + e.lugar : ''}`}</span>
                  </div>
                )
              })}
            </div>
          </header>

          <div className="wp-bar">
            <div className="wp-bar-row">
              <div className="wp-tabs" role="tablist">
                {VISTAS.map(([v, t]) => <button key={v} role="tab" aria-selected={ui.vista === v} className="wp-tab" onClick={() => cambiarVista(v)}>{t}</button>)}
              </div>
              <span className="wp-sp" />
              <span className={`wp-save wp-save-${saveState}`} role="status"><i />{saveLabel}{saveState === 'error' && <button onClick={save}>Reintentar</button>}</span>
              <button className="btn btn-primary" onClick={() => setModal({})}>+ Nuevo hito</button>
              <button className="btn btn-ghost btn-icon" onClick={cerrar} aria-label="Cerrar planificación">✕</button>
            </div>
            {ui.vista !== 'ajustes' && (
              <div className="wp-filters">
                <select aria-label="Responsable" value={ui.fResp} onChange={e => setUi(u => ({ ...u, fResp: e.target.value }))}>
                  <option value="">Todos los responsables</option>
                  {doc.responsables.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                  <option value="_sin">Sin responsable</option>
                </select>
                <select aria-label="Evento" value={ui.fEvento} onChange={e => setUi(u => ({ ...u, fEvento: e.target.value }))}>
                  <option value="">Todos los eventos</option>
                  {doc.eventos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
                <select aria-label="Estado" value={ui.fEstado} onChange={e => setUi(u => ({ ...u, fEstado: e.target.value }))}>
                  <option value="">Cualquier estado</option>
                  {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  <option value="atrasado">Atrasados</option>
                </select>
                <input type="search" placeholder="Buscar…" aria-label="Buscar" value={ui.q} onChange={e => setUi(u => ({ ...u, q: e.target.value }))} />
              </div>
            )}
          </div>

          <div className="wp-view">
            {ui.vista === 'timeline' && <Timeline doc={doc} items={visibles} onToggle={onToggle} onEdit={id => setModal({ id })} />}
            {ui.vista === 'calendario' && <Calendario doc={doc} items={visibles} ui={ui} setUi={setUi} onToggle={onToggle} onEdit={id => setModal({ id })} onNew={fecha => setModal({ fecha })} onMove={onMove} />}
            {ui.vista === 'lista' && <Lista doc={doc} items={visibles} ui={ui} setUi={setUi} onToggle={onToggle} onEdit={id => setModal({ id })} />}
            {ui.vista === 'ajustes' && <Ajustes doc={doc} mutate={mutate} adapterName="la base de datos del sitio (compartida)" onExportICS={exportICS} onExportJSON={exportJSON} onImport={importar} onReset={restaurar} />}
          </div>
        </div>
      </div>

      {modal && (
        <HitoModal
          key={modal.id || 'nuevo'} doc={doc} hito={modal.id ? doc.hitos.find(h => h.id === modal.id) : null}
          fecha={modal.fecha} filtros={ui} onSave={guardarHito} onDelete={borrarHito} onClose={() => setModal(null)}
        />
      )}
      <div className={`wp-toast ${toast ? 'on' : ''}`} role="status" aria-live="polite">{toast}</div>
    </div>
  )
}
