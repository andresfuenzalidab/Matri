import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useApp } from '../../context/AppContext'
import {
  FLOOR, GRID, SEAT_D, SHAPE_PRESETS, PARTY_COLORS, snap, clamp,
  emptyLayout, normalizeLayout, buildParties, tableGeometry, elementBox, layoutBounds,
  makeTable, makeShape, seatOccupants, countAtTable, unassign, assignToSeat,
  assignGroupToTable, reflowTable, pruneAssign, downloadPlanPng, printPlan, uid,
} from '../../utils/seating.js'
import { collectTags, matchesTags } from '../../utils/tags.js'
import { TagFilter } from './TagControls.jsx'
import '../../styles/seating.css'

const MIN_K = 0.25
const MAX_K = 2.5
const HISTORY_LIMIT = 100
const MAX_SEATS = { round: 20, rect: 30 }

// ── Icons ────────────────────────────────────────────────────────────────

function Icon({ name, size = 20 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  switch (name) {
    case 'round':
      return <svg {...p}><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="3.6" r="1.4" /><circle cx="12" cy="20.4" r="1.4" /><circle cx="3.6" cy="12" r="1.4" /><circle cx="20.4" cy="12" r="1.4" /><circle cx="6" cy="6" r="1.2" /><circle cx="18" cy="6" r="1.2" /><circle cx="6" cy="18" r="1.2" /><circle cx="18" cy="18" r="1.2" /></svg>
    case 'rect':
      return <svg {...p}><rect x="4" y="9" width="16" height="6" rx="1.5" /><circle cx="7.5" cy="5.5" r="1.3" /><circle cx="12" cy="5.5" r="1.3" /><circle cx="16.5" cy="5.5" r="1.3" /><circle cx="7.5" cy="18.5" r="1.3" /><circle cx="12" cy="18.5" r="1.3" /><circle cx="16.5" cy="18.5" r="1.3" /></svg>
    case 'dance':
      return <svg {...p}><circle cx="12" cy="13" r="6" /><path d="M12 3v4M6.5 10.5h11M6.5 15.5h11M12 7v12M8.4 8.2c-1 3-1 6.6 0 9.6M15.6 8.2c1 3 1 6.6 0 9.6" /></svg>
    case 'stage':
      return <svg {...p}><path d="M3 20h18M4 20V8l8-4 8 4v12" /><path d="M9 20v-7M15 20v-7M12 20v-9" /></svg>
    case 'bar':
      return <svg {...p}><path d="M5 4h14l-7 8z" /><path d="M12 12v7M8 20h8" /><path d="M8.5 6.5h7" /></svg>
    case 'buffet':
      return <svg {...p}><path d="M4 17h16" /><path d="M5.5 17a6.5 6.5 0 0 1 13 0" /><path d="M12 8V6.5M10.8 6.5h2.4" /><path d="M3 20h18" /></svg>
    case 'rectangle':
      return <svg {...p}><rect x="3.5" y="6.5" width="17" height="11" rx="1.5" /></svg>
    case 'circle':
      return <svg {...p}><circle cx="12" cy="12" r="8" /></svg>
    case 'pencil':
      return <svg {...p}><path d="M4 20l1-4 11-11 3 3L8 19z" /></svg>
    case 'rectangle':
      return <svg {...p}><rect x="3.5" y="6.5" width="17" height="11" rx="1.5" /></svg>
    case 'circle':
      return <svg {...p}><circle cx="12" cy="12" r="8" /></svg>
    case 'undo':
      return <svg {...p}><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></svg>
    case 'redo':
      return <svg {...p}><path d="m15 14 5-5-5-5" /><path d="M20 9H10a6 6 0 0 0 0 12h3" /></svg>
    case 'fit':
      return <svg {...p}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
    case 'image':
      return <svg {...p}><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5" /></svg>
    case 'print':
      return <svg {...p}><path d="M7 9V3.5h10V9" /><rect x="4" y="9" width="16" height="8" rx="1.5" /><path d="M7 14h10v6.5H7z" /></svg>
    case 'people':
      return <svg {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 5.2a3 3 0 0 1 0 5.6M18 14.4c1.8.9 3 2.7 3 5.6" /></svg>
    case 'trash':
      return <svg {...p}><path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13" /></svg>
    case 'copy':
      return <svg {...p}><rect x="8" y="8" width="12" height="12" rx="1.8" /><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" /></svg>
    case 'grip':
      return <svg {...p} strokeWidth={2.4}><path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" /></svg>
    case 'leaf':
      return <svg {...p}><path d="M5 19c0-9 5-14 14-14 0 9-5 14-14 14z" /><path d="M5 19 13 11" /></svg>
    case 'close':
      return <svg {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>
    default:
      return null
  }
}

// ── Small pieces ─────────────────────────────────────────────────────────

function Stepper({ value, min, max, onChange, label }) {
  return (
    <div className="sp-stepper" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(clamp(value - 1, min, max))} disabled={value <= min} aria-label="Menos">−</button>
      <span>{value}</span>
      <button type="button" onClick={() => onChange(clamp(value + 1, min, max))} disabled={value >= max} aria-label="Más">+</button>
    </div>
  )
}

/** Round initials badge; click it to edit (up to 3 letters, empty = back to the default). */
function InitialsAvatar({ person, onCommit }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState('')
  const cancelled = useRef(false)
  const stop = e => e.stopPropagation() // don't start a drag from the badge

  if (editing) {
    return (
      <input
        autoFocus
        className="sp-avatar sp-avatar-input"
        style={{ background: person.color }}
        value={val}
        maxLength={3}
        aria-label={`Iniciales de ${person.name}`}
        onChange={e => setVal(e.target.value.toUpperCase())}
        onFocus={e => e.target.select()}
        onPointerDown={stop}
        onKeyDown={e => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') { cancelled.current = true; e.currentTarget.blur() }
        }}
        onBlur={() => {
          setEditing(false)
          if (!cancelled.current) onCommit(person.id, val)
          cancelled.current = false
        }}
      />
    )
  }
  return (
    <button
      type="button"
      className="sp-avatar sp-avatar-btn"
      style={{ background: person.color }}
      title="Editar iniciales"
      onPointerDown={stop}
      onClick={() => { setVal(person.initials); setEditing(true) }}
    >
      {person.initials}
    </button>
  )
}

function Segmented({ value, options, onChange }) {
  return (
    <div className="sp-seg" role="group">
      {options.map(o => (
        <button key={o.value} type="button" className={value === o.value ? 'active' : ''} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────

export default function SeatingPlan({ onClose }) {
  const { token } = useApp()
  const headers = useMemo(() => ({ 'X-Invite-Token': token, 'Content-Type': 'application/json' }), [token])

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [invitations, setInvitations] = useState([])
  const [layout, setLayoutState] = useState(emptyLayout)
  const layoutRef = useRef(layout)
  const past = useRef([])
  const future = useRef([])
  const [, setHistoryTick] = useState(0)

  const [selected, setSelected] = useState(null)
  const [view, setViewState] = useState({ x: 0, y: 0, k: 0.5 })
  const viewRef = useRef(view)
  const viewportRef = useRef(null)
  const nameInputRef = useRef(null)

  const [saveState, setSaveState] = useState('saved') // saved | dirty | saving | error
  const dirtyRef = useRef(false)
  const savingRef = useRef(false)
  const pendingRef = useRef(false)
  const loadedRef = useRef(false)

  const [ghost, setGhost] = useState(null)
  const [hover, setHover] = useState(null)
  const [flashId, setFlashId] = useState(null)
  // The seated guest whose "Sacar de la mesa" button is showing (set by clicking their seat).
  const [seatMenu, setSeatMenu] = useState(null)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  const [sideOpen, setSideOpen] = useState(() => typeof window === 'undefined' || window.innerWidth > 820)
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState('all') // all | pending | seated
  const [includePending, setIncludePending] = useState(false)
  const [tagFilter, setTagFilter] = useState([])
  const [tagMode, setTagMode] = useState('all')
  const [showNames, setShowNames] = useState(true)
  const [newSeats, setNewSeats] = useState(8)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [exporting, setExporting] = useState(false)

  const coalesce = useRef({ key: null, at: 0 })

  // ── Derived data ──
  const baseParties = useMemo(() => buildParties(invitations), [invitations])
  // Default initials, overridden by whatever was edited by hand (stored in the layout).
  const parties = useMemo(() => {
    const ov = layout.initials || {}
    return baseParties.map(party => ({
      ...party,
      people: party.people.map(p => (ov[p.id] ? { ...p, defaultInitials: p.initials, initials: ov[p.id] } : { ...p, defaultInitials: p.initials })),
    }))
  }, [baseParties, layout.initials])
  const peopleById = useMemo(() => {
    const m = new Map()
    for (const party of parties) for (const p of party.people) m.set(p.id, p)
    return m
  }, [parties])
  // Guests who haven't answered yet are out of the list (and the totals) unless toggled on.
  const scopeParties = useMemo(() => (includePending ? parties : parties.filter(p => !p.pending)), [parties, includePending])
  const allTags = useMemo(() => collectTags(scopeParties), [scopeParties])
  // With a tag filter on, seats of people who don't match are dimmed on the plan.
  const tagMatchIds = useMemo(() => {
    if (!tagFilter.length) return null
    const ids = new Set()
    for (const party of parties) if (matchesTags(party.tags, tagFilter, tagMode)) for (const p of party.people) ids.add(p.id)
    return ids
  }, [parties, tagFilter, tagMode])
  const partyById = useMemo(() => new Map(parties.map(p => [p.id, p])), [parties])
  const tables = useMemo(() => layout.elements.filter(e => e.type === 'table'), [layout.elements])
  const tablesById = useMemo(() => new Map(tables.map(t => [t.id, t])), [tables])
  const selectedEl = useMemo(() => layout.elements.find(e => e.id === selected) || null, [layout.elements, selected])

  const scopeIds = useMemo(() => new Set(scopeParties.flatMap(p => p.people.map(x => x.id))), [scopeParties])
  const seatedCount = useMemo(
    () => Object.keys(layout.assign).filter(id => scopeIds.has(id)).length,
    [layout.assign, scopeIds],
  )
  const totalPeople = scopeIds.size
  const totalSeats = useMemo(() => tables.reduce((s, t) => s + t.seats, 0), [tables])

  // ── View helpers ──
  const setView = useCallback(v => { viewRef.current = v; setViewState(v) }, [])

  const toWorld = useCallback((cx, cy) => {
    const r = viewportRef.current.getBoundingClientRect()
    const v = viewRef.current
    return { x: (cx - r.left - v.x) / v.k, y: (cy - r.top - v.y) / v.k }
  }, [])

  const fitView = useCallback((els = layoutRef.current.elements) => {
    const node = viewportRef.current
    if (!node) return
    const r = node.getBoundingClientRect()
    if (!els.length) {
      const k = 0.8
      setView({ k, x: r.width / 2 - (FLOOR.w / 2) * k, y: r.height / 2 - (FLOOR.h / 2) * k })
      return
    }
    const b = layoutBounds(els, 90)
    const bw = b.maxX - b.minX
    const bh = b.maxY - b.minY
    const k = clamp(Math.min(r.width / bw, r.height / bh), MIN_K, 1.1)
    setView({ k, x: (r.width - bw * k) / 2 - b.minX * k, y: (r.height - bh * k) / 2 - b.minY * k })
  }, [setView])

  const zoomAt = useCallback((factor, cx, cy) => {
    const node = viewportRef.current
    if (!node) return
    const r = node.getBoundingClientRect()
    const v = viewRef.current
    const k = clamp(v.k * factor, MIN_K, MAX_K)
    const px = (cx ?? r.left + r.width / 2) - r.left
    const py = (cy ?? r.top + r.height / 2) - r.top
    const wx = (px - v.x) / v.k
    const wy = (py - v.y) / v.k
    setView({ k, x: px - wx * k, y: py - wy * k })
  }, [setView])

  const centerOn = useCallback(el => {
    const node = viewportRef.current
    if (!node) return
    const r = node.getBoundingClientRect()
    const v = viewRef.current
    const k = Math.max(v.k, 0.7)
    setView({ k, x: r.width / 2 - el.x * k, y: r.height / 2 - el.y * k })
  }, [setView])

  // ── Toast ──
  const showToast = useCallback((msg, opts = {}) => {
    clearTimeout(toastTimer.current)
    setToast({ msg, ...opts })
    toastTimer.current = setTimeout(() => setToast(null), 4500)
  }, [])
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  // ── Layout state + history ──
  const markDirty = useCallback(() => {
    dirtyRef.current = true
    setSaveState(s => (s === 'saving' ? s : 'dirty'))
  }, [])

  const applyLayout = useCallback(next => {
    layoutRef.current = next
    setLayoutState(next)
    markDirty()
  }, [markDirty])

  /** Push the current layout on the undo stack — call once at the start of a
   *  multi-step gesture (drag, resize), then `update(fn, false)` per move. */
  const beginGesture = useCallback(() => {
    past.current.push(layoutRef.current)
    if (past.current.length > HISTORY_LIMIT) past.current.shift()
    future.current = []
    setHistoryTick(t => t + 1)
  }, [])

  const update = useCallback((fn, record = true) => {
    const prev = layoutRef.current
    const next = fn(prev)
    if (next === prev) return
    if (record) beginGesture()
    applyLayout(next)
  }, [applyLayout, beginGesture])

  /** For text/number edits: consecutive changes to the same field share one undo step. */
  const updateCoalesced = useCallback((key, fn) => {
    const now = Date.now()
    const same = coalesce.current.key === key && now - coalesce.current.at < 1000
    coalesce.current = { key, at: now }
    update(fn, !same)
  }, [update])

  const undo = useCallback(() => {
    const prev = past.current.pop()
    if (!prev) return
    future.current.push(layoutRef.current)
    applyLayout(prev)
    setHistoryTick(t => t + 1)
  }, [applyLayout])

  const redo = useCallback(() => {
    const next = future.current.pop()
    if (!next) return
    past.current.push(layoutRef.current)
    applyLayout(next)
    setHistoryTick(t => t + 1)
  }, [applyLayout])

  const patchEl = (l, id, patch) => ({ ...l, elements: l.elements.map(e => (e.id === id ? { ...e, ...patch } : e)) })

  // ── Load ──
  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [invRes, planRes] = await Promise.all([
        fetch('/api/admin/invitations', { headers }),
        fetch('/api/admin/seating', { headers }),
      ])
      const invData = await invRes.json().catch(() => null)
      if (!invRes.ok || !Array.isArray(invData)) throw new Error('No se pudieron cargar los invitados.')
      const planData = await planRes.json().catch(() => ({}))
      if (!planRes.ok) throw new Error(planData?.error || 'No se pudo cargar el plan.')

      let plan = normalizeLayout(planData.layout)
      const ids = new Set(buildParties(invData).flatMap(p => p.people.map(x => x.id)))
      const { assign, removed } = pruneAssign(plan.assign, ids, plan.elements)
      plan = { ...plan, assign }

      setInvitations(invData)
      // Someone unconfirmed who is already seated must not be invisible in the list.
      const pendingIds = new Set(buildParties(invData).filter(p => p.pending).flatMap(p => p.people.map(x => x.id)))
      if (Object.keys(plan.assign).some(id => pendingIds.has(id))) setIncludePending(true)
      layoutRef.current = plan
      setLayoutState(plan)
      past.current = []
      future.current = []
      loadedRef.current = true
      if (removed > 0) {
        markDirty()
        showToast(`${removed} ${removed === 1 ? 'asignación se quitó' : 'asignaciones se quitaron'} porque ya no coinciden con los RSVP.`)
      }
      requestAnimationFrame(() => fitView(plan.elements))
    } catch (e) {
      setLoadError(e.message || 'Error al cargar.')
    } finally {
      setLoading(false)
    }
  }, [headers, fitView, markDirty, showToast])

  useEffect(() => { load() }, [load])

  // ── Save (debounced autosave) ──
  const save = useCallback(async () => {
    if (savingRef.current) { pendingRef.current = true; return }
    savingRef.current = true
    let failed = false
    do {
      pendingRef.current = false
      dirtyRef.current = false
      setSaveState('saving')
      try {
        const res = await fetch('/api/admin/seating', { method: 'PUT', headers, body: JSON.stringify({ layout: layoutRef.current }) })
        if (!res.ok) throw new Error()
      } catch {
        dirtyRef.current = true
        failed = true
        break
      }
    } while (pendingRef.current)
    savingRef.current = false
    setSaveState(failed ? 'error' : dirtyRef.current ? 'dirty' : 'saved')
  }, [headers])

  useEffect(() => {
    if (!loadedRef.current || !dirtyRef.current) return
    const t = setTimeout(save, 900)
    return () => clearTimeout(t)
  }, [layout, save])

  const handleClose = useCallback(() => {
    if (dirtyRef.current) save()
    onClose()
  }, [save, onClose])

  // ── Element actions ──
  const nextTableNumber = () => {
    const nums = layoutRef.current.elements
      .filter(e => e.type === 'table')
      .map(t => Number((t.name.match(/^Mesa (\d+)$/) || [])[1]) || 0)
    return Math.max(0, ...nums, layoutRef.current.elements.filter(e => e.type === 'table').length) + 1
  }

  const addElement = useCallback((spec, at) => {
    const pos = at || (() => {
      const r = viewportRef.current.getBoundingClientRect()
      const c = toWorld(r.left + r.width / 2, r.top + r.height / 2)
      const n = layoutRef.current.elements.length % 6
      return { x: c.x + n * 24, y: c.y + n * 24 }
    })()
    const x = clamp(snap(pos.x), 0, FLOOR.w)
    const y = clamp(snap(pos.y), 0, FLOOR.h)
    const el = spec.type === 'table'
      ? makeTable({ shape: spec.shape, seats: clamp(newSeats, 2, MAX_SEATS[spec.shape]), x, y, number: nextTableNumber() })
      : makeShape({ preset: spec.preset, round: spec.round, x, y })
    update(l => ({ ...l, elements: [...l.elements, el] }))
    setSelected(el.id)
    setConfirmDelete(false)
  }, [newSeats, toWorld, update]) // eslint-disable-line react-hooks/exhaustive-deps

  const deleteElement = useCallback(id => {
    const el = layoutRef.current.elements.find(e => e.id === id)
    if (!el) return
    const freed = el.type === 'table' ? countAtTable(layoutRef.current.assign, id) : 0
    update(l => {
      const assign = Object.fromEntries(Object.entries(l.assign).filter(([, a]) => a.t !== id))
      return { ...l, elements: l.elements.filter(e => e.id !== id), assign }
    })
    setSelected(null)
    setConfirmDelete(false)
    showToast(
      freed ? `Mesa eliminada — ${freed} ${freed === 1 ? 'invitado volvió' : 'invitados volvieron'} a la lista.` : 'Elemento eliminado.',
      { undo: true },
    )
  }, [update, showToast])

  const duplicateElement = useCallback(id => {
    const el = layoutRef.current.elements.find(e => e.id === id)
    if (!el) return
    const copy = { ...el, id: uid(), x: clamp(el.x + 50, 0, FLOOR.w), y: clamp(el.y + 50, 0, FLOOR.h) }
    if (el.type === 'table') copy.name = `Mesa ${nextTableNumber()}`
    update(l => ({ ...l, elements: [...l.elements, copy] }))
    setSelected(copy.id)
  }, [update]) // eslint-disable-line react-hooks/exhaustive-deps

  const setSeats = useCallback((table, n) => {
    const seats = clamp(n, 2, MAX_SEATS[table.shape])
    if (seats === table.seats) return
    let dropped = 0
    updateCoalesced(`seats-${table.id}`, l => {
      const t2 = { ...table, seats }
      const r = reflowTable(l.assign, t2)
      dropped = r.dropped
      return { ...patchEl(l, table.id, { seats }), assign: r.assign }
    })
    if (dropped > 0) showToast(`${dropped} ${dropped === 1 ? 'invitado volvió' : 'invitados volvieron'} a la lista por falta de sillas.`)
  }, [updateCoalesced, showToast])

  const setTableShape = useCallback((table, shape) => {
    if (shape === table.shape) return
    const seats = Math.min(table.seats, MAX_SEATS[shape])
    let dropped = 0
    update(l => {
      const r = reflowTable(l.assign, { ...table, seats })
      dropped = r.dropped
      return { ...patchEl(l, table.id, { shape, seats }), assign: r.assign }
    })
    if (dropped > 0) showToast(`${dropped} ${dropped === 1 ? 'invitado volvió' : 'invitados volvieron'} a la lista por falta de sillas.`)
  }, [update, showToast])

  const emptyTable = useCallback(id => {
    update(l => ({ ...l, assign: Object.fromEntries(Object.entries(l.assign).filter(([, a]) => a.t !== id)) }))
  }, [update])

  const removeFromSeat = useCallback((personId, tableName) => {
    const person = peopleById.get(personId)
    update(l => ({ ...l, assign: unassign(l.assign, [personId]) }))
    setSeatMenu(null)
    showToast(`${person?.name || 'El invitado'} salió de ${tableName || 'la mesa'}.`, { undo: true })
  }, [peopleById, update, showToast])

  const setInitials = useCallback((id, raw) => {
    const person = peopleById.get(id)
    if (!person) return
    const v = String(raw).trim().toUpperCase().slice(0, 3)
    const next = !v || v === person.defaultInitials ? null : v
    update(l => {
      const cur = l.initials || {}
      if ((cur[id] || null) === next) return l
      const initials = { ...cur }
      if (next) initials[id] = next
      else delete initials[id]
      return { ...l, initials }
    })
  }, [peopleById, update])

  const focusTable = useCallback((id, flash = true) => {
    const el = layoutRef.current.elements.find(e => e.id === id)
    if (!el) return
    setSelected(id)
    setConfirmDelete(false)
    centerOn(el)
    if (flash) {
      setFlashId(id)
      setTimeout(() => setFlashId(f => (f === id ? null : f)), 1400)
    }
  }, [centerOn])

  // ── Pointer gestures ──
  function trackPointer(e, { onMove, onUp, threshold = 4 }) {
    const sx = e.clientX
    const sy = e.clientY
    let moved = false
    const move = ev => {
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < threshold) return
      moved = true
      onMove(ev, { sx, sy })
    }
    const finish = ev => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', finish)
      onUp?.(ev, moved, ev.type === 'pointercancel')
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', finish)
  }

  function hitTest(cx, cy) {
    const n = document.elementFromPoint(cx, cy)
    if (!n) return null
    const seat = n.closest('[data-seat]')
    if (seat) return { zone: 'seat', tableId: seat.dataset.table, seat: Number(seat.dataset.seat) }
    const table = n.closest('[data-el][data-type="table"]')
    if (table) return { zone: 'table', tableId: table.dataset.el }
    if (n.closest('[data-sidebar]')) return { zone: 'sidebar' }
    if (n.closest('[data-viewport]')) return { zone: 'canvas' }
    return null
  }

  function startElementDrag(e, id) {
    const el = layoutRef.current.elements.find(x => x.id === id)
    if (!el) return
    const start = toWorld(e.clientX, e.clientY)
    let began = false
    trackPointer(e, {
      threshold: 3,
      onMove: ev => {
        if (!began) { beginGesture(); began = true }
        const p = toWorld(ev.clientX, ev.clientY)
        const x = clamp(snap(el.x + p.x - start.x), 0, FLOOR.w)
        const y = clamp(snap(el.y + p.y - start.y), 0, FLOOR.h)
        update(l => patchEl(l, id, { x, y }), false)
      },
    })
  }

  function startHandleDrag(e, kind, id) {
    const el = layoutRef.current.elements.find(x => x.id === id)
    if (!el) return
    let began = false
    trackPointer(e, {
      threshold: 2,
      onMove: ev => {
        if (!began) { beginGesture(); began = true }
        const p = toWorld(ev.clientX, ev.clientY)
        const dx = p.x - el.x
        const dy = p.y - el.y
        if (kind === 'rotate') {
          let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90
          if (!ev.altKey) deg = Math.round(deg / 15) * 15
          deg = Math.round(((deg % 360) + 360) % 360)
          update(l => patchEl(l, id, { rot: deg }), false)
        } else {
          const rad = (-(el.rot || 0) * Math.PI) / 180
          const lx = dx * Math.cos(rad) - dy * Math.sin(rad)
          const ly = dx * Math.sin(rad) + dy * Math.cos(rad)
          const w = clamp(snap(2 * Math.abs(lx)), 40, 1200)
          const h = clamp(snap(2 * Math.abs(ly)), 40, 1200)
          update(l => patchEl(l, id, { w, h }), false)
        }
      },
    })
  }

  function startPan(e) {
    const v0 = viewRef.current
    trackPointer(e, {
      threshold: 3,
      onMove: ev => setView({ ...v0, x: v0.x + ev.clientX - e.clientX, y: v0.y + ev.clientY - e.clientY }),
      onUp: (_, moved) => { if (!moved) { setSelected(null); setConfirmDelete(false) } },
    })
  }

  function drop(payload, hit) {
    if (!hit) return
    if (payload.kind === 'new') {
      if (hit.zone === 'sidebar') return
      addElement(payload.spec, toWorld(payload.x, payload.y))
      return
    }
    const ids = payload.ids
    if (hit.zone === 'sidebar') {
      if (ids.some(id => layoutRef.current.assign[id])) update(l => ({ ...l, assign: unassign(l.assign, ids) }))
      return
    }
    const table = tablesById.get(hit.tableId)
    if (!table) return
    if (hit.zone === 'seat' && ids.length === 1) {
      // Dropping on an occupied chair swaps the two; if the dragged person
      // wasn't seated there's no chair to hand over, so the occupant goes back to the list.
      const cur = layoutRef.current.assign
      const occupantId = Object.keys(cur).find(pid => cur[pid].t === table.id && cur[pid].s === hit.seat && pid !== ids[0])
      const displaced = occupantId && !cur[ids[0]] ? peopleById.get(occupantId) : null
      update(l => ({ ...l, assign: assignToSeat(l.assign, ids[0], table.id, hit.seat) }))
      if (displaced) showToast(`${displaced.name} volvió a la lista.`)
      return
    }
    let result
    update(l => {
      result = assignGroupToTable(l.assign, table, ids)
      return result.assign === l.assign || (!result.placed) ? l : { ...l, assign: result.assign }
    })
    if (result?.overflow > 0) {
      showToast(result.placed
        ? `${table.name} se llenó: ${result.overflow} ${result.overflow === 1 ? 'invitado quedó' : 'invitados quedaron'} sin ubicar.`
        : `${table.name} está llena.`)
    }
  }

  function startPayloadDrag(e, payload) {
    if (e.button && e.button !== 0) return
    if (e.pointerType === 'touch' && payload.needGrip && !e.target.closest('[data-grip]')) return
    trackPointer(e, {
      onMove: ev => {
        setGhost({ ...payload, x: ev.clientX, y: ev.clientY })
        setHover(hitTest(ev.clientX, ev.clientY))
      },
      onUp: (ev, moved, cancelled) => {
        setGhost(null)
        setHover(null)
        if (cancelled) return
        if (!moved) { payload.onClick?.(); return }
        drop({ ...payload, x: ev.clientX, y: ev.clientY }, hitTest(ev.clientX, ev.clientY))
      },
    })
  }

  function onCanvasPointerDown(e) {
    if (e.button && e.button !== 0) return
    const t = e.target
    // The "Sacar de la mesa" button handles its own click; anything else closes it.
    if (t.closest('[data-seat-menu]')) return
    setSeatMenu(null)
    const handle = t.closest('[data-handle]')
    if (handle) {
      startHandleDrag(e, handle.dataset.handle, handle.closest('[data-el]').dataset.el)
      return
    }
    const node = t.closest('[data-el]')
    if (!node) { startPan(e); return }
    const id = node.dataset.el
    const seatNode = t.closest('[data-seat][data-pid]')
    if (seatNode) {
      const person = peopleById.get(seatNode.dataset.pid)
      if (person) {
        startPayloadDrag(e, {
          kind: 'people', ids: [person.id], label: person.name, color: person.color, count: 1,
          onClick: () => {
            const seat = Number(seatNode.dataset.seat)
            setSeatMenu(m => (m && m.tableId === id && m.seat === seat ? null : { tableId: id, seat }))
            setSelected(id)
            setConfirmDelete(false)
          },
        })
        return
      }
    }
    setSelected(id)
    setConfirmDelete(false)
    startElementDrag(e, id)
  }

  // The plan owns the whole screen: freeze the page behind it so the only
  // scrolling left is inside the guest list and the inspector.
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prev = { html: html.style.overflow, body: body.style.overflow }
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => { html.style.overflow = prev.html; body.style.overflow = prev.body }
  }, [])

  // Wheel zoom needs a non-passive listener to be able to preventDefault.
  useEffect(() => {
    const node = viewportRef.current
    if (!node) return
    const onWheel = ev => {
      ev.preventDefault()
      zoomAt(Math.exp(-ev.deltaY * 0.0015), ev.clientX, ev.clientY)
    }
    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  }, [zoomAt, loading])

  // Keep the fitted view when the window is resized.
  useEffect(() => {
    const onResize = () => { if (!layoutRef.current.elements.length) fitView([]) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [fitView])

  // ── Keyboard ──
  useEffect(() => {
    function onKey(e) {
      const tag = e.target?.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
      const mod = e.ctrlKey || e.metaKey
      if (mod && !typing && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return }
      if (mod && !typing && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return }
      if (typing) return
      if (mod && e.key.toLowerCase() === 'd' && selected) { e.preventDefault(); duplicateElement(selected); return }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected) { e.preventDefault(); deleteElement(selected); return }
      if (e.key === 'Escape') { setSelected(null); setSeatMenu(null) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, undo, redo, duplicateElement, deleteElement])

  // ── Sidebar data ──
  const assign = layout.assign
  const visibleParties = useMemo(() => {
    const q = query.trim().toLowerCase()
    const out = []
    for (const party of scopeParties) {
      if (!matchesTags(party.tags, tagFilter, tagMode)) continue
      const partyMatches = q && party.label.toLowerCase().includes(q)
      const people = party.people.filter(p => {
        const seated = !!assign[p.id]
        if (mode === 'pending' && seated) return false
        if (mode === 'seated' && !seated) return false
        return !q || partyMatches || p.name.toLowerCase().includes(q)
      })
      if (people.length) out.push({ party, people })
    }
    return out
  }, [scopeParties, assign, query, mode, tagFilter, tagMode])

  // ── Export ──
  async function exportPng() {
    setExporting(true)
    try {
      await downloadPlanPng(layoutRef.current, peopleById)
    } catch (e) {
      showToast(e.message || 'No se pudo exportar.')
    } finally {
      setExporting(false)
    }
  }
  function exportPrint() {
    if (!printPlan(layoutRef.current, parties, peopleById, { includePending })) showToast('El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes.')
  }

  // ── Render ──
  const sortedEls = useMemo(
    () => [...layout.elements.filter(e => e.type === 'shape'), ...layout.elements.filter(e => e.type === 'table')],
    [layout.elements],
  )
  const dragFromSeat = ghost?.kind === 'people' && ghost.ids.some(id => assign[id])
  const pct = totalPeople ? Math.round((seatedCount / totalPeople) * 100) : 0

  const saveLabel = { saved: 'Guardado', dirty: 'Cambios sin guardar…', saving: 'Guardando…', error: 'Error al guardar' }[saveState]

  // Portaled to <body>: inside the admin overlay (a blurred, scrollable layer)
  // `position: fixed` is anchored to that layer and scrolls away with it.
  return createPortal(
    <div className="sp-root" role="dialog" aria-modal="true" aria-label="Seating plan">
      {/* ── Top bar ── */}
      <header className="sp-top">
        <div className="sp-title">
          <span className="sp-kicker">Distribución de mesas</span>
          <h2>Seating plan</h2>
        </div>

        <div className="sp-stats">
          <span><b>{tables.length}</b> mesas</span>
          <span><b>{totalSeats}</b> sillas</span>
          <span><b>{seatedCount}</b>/{totalPeople} sentados</span>
        </div>

        <div className="sp-top-actions">
          <span className={`sp-save sp-save-${saveState}`} role="status">
            <i />{saveLabel}
            {saveState === 'error' && <button type="button" onClick={save}>Reintentar</button>}
          </span>
          <button type="button" className="sp-tool" onClick={undo} disabled={!past.current.length} title="Deshacer (Ctrl+Z)" aria-label="Deshacer"><Icon name="undo" size={18} /></button>
          <button type="button" className="sp-tool" onClick={redo} disabled={!future.current.length} title="Rehacer (Ctrl+Y)" aria-label="Rehacer"><Icon name="redo" size={18} /></button>
          <span className="sp-sep" />
          <button type="button" className="btn btn-secondary sp-btn" onClick={exportPng} disabled={exporting || !layout.elements.length}><Icon name="image" size={16} /> Imagen</button>
          <button type="button" className="btn btn-secondary sp-btn" onClick={exportPrint} disabled={!layout.elements.length}><Icon name="print" size={16} /> Imprimir / PDF</button>
          <button type="button" className="btn btn-primary sp-btn" onClick={handleClose}>Listo</button>
        </div>
      </header>

      <div className="sp-body">
        {/* ── Guest list ── */}
        <aside className={`sp-side ${sideOpen ? '' : 'is-closed'} ${hover?.zone === 'sidebar' && dragFromSeat ? 'is-drop' : ''}`} data-sidebar>
          <div className="sp-side-inner">
            <div className="sp-side-head">
              <h3>{includePending ? 'Invitados' : 'Invitados confirmados'}</h3>
              <div className="sp-progress" aria-label={`${pct}% sentados`}>
                <div style={{ width: `${pct}%` }} />
              </div>
              <p className="sp-progress-label"><b>{seatedCount}</b> de {totalPeople} con mesa {totalPeople - seatedCount > 0 && <>· faltan <b>{totalPeople - seatedCount}</b></>}</p>
              <input className="input sp-search" type="search" placeholder="Buscar invitado…" value={query} onChange={e => setQuery(e.target.value)} />
              <Segmented value={mode} onChange={setMode} options={[{ value: 'all', label: 'Todos' }, { value: 'pending', label: 'Sin mesa' }, { value: 'seated', label: 'Sentados' }]} />
              {parties.some(p => p.pending) && (
                <label className="sp-check"><input type="checkbox" checked={includePending} onChange={e => setIncludePending(e.target.checked)} /> Mostrar invitados no confirmados</label>
              )}
              <TagFilter className="sp-tags" tags={allTags} selected={tagFilter} onChange={setTagFilter} mode={tagMode} onMode={setTagMode} />
            </div>

            <div className="sp-list">
              {loading ? null : visibleParties.length === 0 ? (
                <p className="sp-empty-note">
                  {totalPeople === 0 ? 'Aún no hay invitados que hayan confirmado su asistencia.' : 'Nadie coincide con este filtro.'}
                </p>
              ) : visibleParties.map(({ party, people }) => (
                <div key={party.id} className="sp-party" style={{ '--pc': party.color }}>
                  <div
                    className="sp-party-head"
                    onPointerDown={e => startPayloadDrag(e, {
                      kind: 'people', ids: party.people.map(p => p.id), label: party.label, color: party.color, count: party.people.length, needGrip: true,
                    })}
                    title={party.people.length > 1 ? 'Arrastra para sentar a todo el grupo junto' : 'Arrastra a una mesa'}
                  >
                    <span className="sp-grip" data-grip><Icon name="grip" size={16} /></span>
                    <span className="sp-party-name">{party.label}</span>
                    {party.pending && <span className="sp-mini-tag">Sin confirmar</span>}
                    {party.dietary && <span className="sp-diet" title={party.dietary}><Icon name="leaf" size={13} /></span>}
                    {party.people.length > 1 && <span className="sp-party-count">{party.people.length}</span>}
                  </div>
                  {people.map(p => {
                    const a = assign[p.id]
                    const tbl = a && tablesById.get(a.t)
                    return (
                      <div
                        key={p.id}
                        className={`sp-person ${a ? 'is-seated' : ''}`}
                        onPointerDown={e => startPayloadDrag(e, {
                          kind: 'people', ids: [p.id], label: p.name, color: p.color, count: 1, needGrip: true,
                          onClick: () => tbl && focusTable(tbl.id),
                        })}
                      >
                        <span className="sp-grip" data-grip><Icon name="grip" size={14} /></span>
                        <InitialsAvatar person={p} onCommit={setInitials} />
                        <span className="sp-person-name">{p.name}</span>
                        <span className={`sp-where ${tbl ? '' : 'is-none'}`}>{tbl ? `${tbl.name} · ${a.s + 1}` : 'sin mesa'}</span>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
            <div className="sp-side-drop">Suelta aquí para quitar de la mesa</div>
          </div>
        </aside>

        {/* ── Canvas ── */}
        <main className="sp-stage">
          <button type="button" className="sp-side-toggle" onClick={() => setSideOpen(o => !o)} aria-label={sideOpen ? 'Ocultar invitados' : 'Mostrar invitados'} title={sideOpen ? 'Ocultar invitados' : 'Mostrar invitados'}>
            <Icon name="people" size={18} />
          </button>

          <div
            ref={viewportRef}
            className="sp-viewport"
            data-viewport
            onPointerDown={onCanvasPointerDown}
          >
            <div
              className={`sp-world ${view.k < 0.55 || !showNames ? 'hide-names' : ''}`}
              style={{
                width: FLOOR.w, height: FLOOR.h,
                transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
                '--inv-k': Math.min(2.4, 1 / view.k),
                '--grid': `${GRID * 4}px`,
              }}
            >
              <div className="sp-floor-mark" aria-hidden="true">Salón</div>

              {sortedEls.map(el => {
                const { w, h } = elementBox(el)
                const isSel = el.id === selected
                const boxStyle = { left: el.x - w / 2, top: el.y - h / 2, width: w, height: h, transform: `rotate(${el.rot || 0}deg)` }
                const counter = { transform: `rotate(${-(el.rot || 0)}deg)` }

                if (el.type === 'shape') {
                  return (
                    <div
                      key={el.id}
                      className={`sp-el sp-shape sp-shape-${el.preset} ${el.round ? 'is-round' : ''} ${isSel ? 'is-selected' : ''}`}
                      data-el={el.id} data-type="shape"
                      style={el.preset === 'custom' ? { ...boxStyle, '--fill': el.color || PARTY_COLORS[0] } : boxStyle}
                    >
                      <div className="sp-shape-label" style={counter}>
                        {el.preset !== 'custom' && <Icon name={el.preset} size={Math.round(clamp(Math.min(w, h) * 0.22, 18, 34))} />}
                        <span>{el.label}</span>
                      </div>
                      {isSel && (
                        <>
                          <div className="sp-rot-line" />
                          <div className="sp-handle sp-handle-rot" data-handle="rotate" title="Rotar (Alt = libre)" />
                          <div className="sp-handle sp-handle-size" data-handle="resize" title="Cambiar tamaño" />
                        </>
                      )}
                    </div>
                  )
                }

                const g = tableGeometry(el)
                const occ = seatOccupants(assign, el.id)
                const filled = Object.keys(occ).filter(s => peopleById.has(occ[s])).length
                const full = filled >= el.seats
                const dropTarget = ghost?.kind === 'people' && hover && hover.tableId === el.id
                return (
                  <div
                    key={el.id}
                    className={`sp-el sp-table sp-table-${el.shape} ${isSel ? 'is-selected' : ''} ${dropTarget ? 'is-drop' : ''} ${full ? 'is-full' : ''} ${flashId === el.id ? 'is-flash' : ''}`}
                    data-el={el.id} data-type="table"
                    style={boxStyle}
                    onDoubleClick={() => setTimeout(() => nameInputRef.current?.select(), 30)}
                  >
                    <div className="sp-table-top" style={{ left: (w - g.tw) / 2, top: (h - g.th) / 2, width: g.tw, height: g.th }}>
                      <div className="sp-table-label" style={counter}>
                        <strong>{el.name}</strong>
                        <small>{full ? '✓ ' : ''}{filled}/{el.seats}</small>
                      </div>
                    </div>

                    {g.seats.map((s, i) => {
                      const person = peopleById.get(occ[i])
                      const cx = w / 2 + s.x
                      const cy = h / 2 + s.y
                      return (
                        <div key={i}>
                          <div
                            className={`sp-seat ${person ? 'is-filled' : ''} ${dropTarget && hover.seat === i ? (person && ghost.ids.length === 1 && !ghost.ids.includes(person.id) ? 'is-drop is-swap' : 'is-drop') : ''} ${person && tagMatchIds && !tagMatchIds.has(person.id) ? 'is-dim' : ''}`}
                            data-seat={i} data-table={el.id} data-pid={person ? person.id : undefined}
                            style={{ left: cx - SEAT_D / 2, top: cy - SEAT_D / 2, width: SEAT_D, height: SEAT_D, ...(person ? { '--pc': person.color } : null) }}
                            title={person ? person.name : `Silla ${i + 1}`}
                          >
                            <span style={person && person.initials.length > 2 ? { ...counter, fontSize: 9 } : counter}>{person ? person.initials : i + 1}</span>
                          </div>
                          {person && (
                            <span className="sp-seat-name" style={{ left: cx + s.ox * 30, top: cy + s.oy * 24, ...counter }}>
                              {person.name.split(/\s+/)[0]}
                            </span>
                          )}
                          {person && seatMenu && seatMenu.tableId === el.id && seatMenu.seat === i && (
                            <button
                              type="button"
                              className="sp-seat-menu"
                              data-seat-menu
                              style={{ left: cx + s.ox * 52, top: cy + s.oy * 44, ...counter }}
                              title={`Sacar a ${person.name} de ${el.name}`}
                              onClick={() => removeFromSeat(person.id, el.name)}
                            >
                              <Icon name="close" size={12} /> Sacar de la mesa
                            </button>
                          )}
                        </div>
                      )
                    })}

                    {isSel && (
                      <>
                        <div className="sp-rot-line" />
                        <div className="sp-handle sp-handle-rot" data-handle="rotate" title="Rotar (Alt = libre)" />
                      </>
                    )}
                  </div>
                )
              })}
            </div>

            {!loading && !layout.elements.length && (
              <div className="sp-empty">
                <div className="sp-empty-card">
                  <h3>Arma tu salón</h3>
                  <p>Agrega mesas y figuras desde la barra de arriba, arrástralas donde quieras y luego lleva a tus invitados desde la lista a cada silla.</p>
                  <div className="sp-empty-actions">
                    <button type="button" className="btn btn-primary" onClick={() => addElement({ type: 'table', shape: 'round' })}><Icon name="round" size={16} /> Mesa redonda</button>
                    <button type="button" className="btn btn-secondary" onClick={() => addElement({ type: 'table', shape: 'rect' })}><Icon name="rect" size={16} /> Mesa rectangular</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Palette */}
          <div className="sp-palette" role="toolbar" aria-label="Agregar al plano">
            <div className="sp-palette-group">
              <span className="sp-palette-label">Mesas</span>
              <button type="button" className="sp-add" onPointerDown={e => startPayloadDrag(e, { kind: 'new', spec: { type: 'table', shape: 'round' }, label: 'Mesa redonda', color: 'var(--color-accent)', count: 0, onClick: () => addElement({ type: 'table', shape: 'round' }) })}>
                <Icon name="round" /> <span>Redonda</span>
              </button>
              <button type="button" className="sp-add" onPointerDown={e => startPayloadDrag(e, { kind: 'new', spec: { type: 'table', shape: 'rect' }, label: 'Mesa rectangular', color: 'var(--color-accent)', count: 0, onClick: () => addElement({ type: 'table', shape: 'rect' }) })}>
                <Icon name="rect" /> <span>Rectangular</span>
              </button>
              <div className="sp-palette-seats">
                <span>Sillas</span>
                <Stepper value={newSeats} min={2} max={MAX_SEATS.rect} onChange={setNewSeats} label="Sillas de la nueva mesa" />
              </div>
            </div>
            <span className="sp-sep sp-sep-v" />
            <div className="sp-palette-group">
              <span className="sp-palette-label">Figuras</span>
              {Object.entries(SHAPE_PRESETS).filter(([key]) => key !== 'custom').map(([key, p]) => (
                <button key={key} type="button" className="sp-add" onPointerDown={e => startPayloadDrag(e, { kind: 'new', spec: { type: 'shape', preset: key }, label: p.label, color: 'var(--color-accent)', count: 0, onClick: () => addElement({ type: 'shape', preset: key }) })}>
                  <Icon name={key} /> <span>{p.label}</span>
                </button>
              ))}
              <span className="sp-sep sp-sep-v" />
              <button type="button" className="sp-add" title="Rectángulo personalizable (mesa de decoración, mesón de postres…)" onPointerDown={e => startPayloadDrag(e, { kind: 'new', spec: { type: 'shape', preset: 'custom', round: false }, label: 'Rectángulo', color: 'var(--color-accent)', count: 0, onClick: () => addElement({ type: 'shape', preset: 'custom', round: false }) })}>
                <Icon name="rectangle" /> <span>Rectángulo</span>
              </button>
              <button type="button" className="sp-add" title="Círculo personalizable (cabina de fotos, mesa de regalos…)" onPointerDown={e => startPayloadDrag(e, { kind: 'new', spec: { type: 'shape', preset: 'custom', round: true }, label: 'Círculo', color: 'var(--color-accent)', count: 0, onClick: () => addElement({ type: 'shape', preset: 'custom', round: true }) })}>
                <Icon name="circle" /> <span>Círculo</span>
              </button>
            </div>
          </div>

          {/* Zoom */}
          <div className="sp-zoom">
            <button type="button" className={`sp-zoom-names ${showNames ? 'active' : ''}`} onClick={() => setShowNames(s => !s)} title="Mostrar nombres junto a cada silla">Aa</button>
            <span className="sp-sep sp-sep-v" />
            <button type="button" onClick={() => zoomAt(1 / 1.25)} aria-label="Alejar">−</button>
            <span className="sp-zoom-pct">{Math.round(view.k * 100)}%</span>
            <button type="button" onClick={() => zoomAt(1.25)} aria-label="Acercar">+</button>
            <button type="button" onClick={() => fitView()} aria-label="Ajustar a la pantalla" title="Ajustar a la pantalla"><Icon name="fit" size={16} /></button>
          </div>
          <p className="sp-hint">Rueda: zoom · Arrastra el fondo: mover · Clic en un invitado sentado: opciones · Supr: borrar mesa</p>

          {/* Inspector */}
          <aside className="sp-inspector">
            {!selectedEl ? (
              <>
                <h3>Resumen de mesas</h3>
                {tables.length === 0 ? (
                  <p className="sp-empty-note">Todavía no hay mesas. Agrega la primera con los botones de arriba.</p>
                ) : (
                  <ul className="sp-table-list">
                    {tables.map(t => {
                      const n = countAtTable(assign, t.id)
                      return (
                        <li key={t.id}>
                          <button type="button" onClick={() => focusTable(t.id)}>
                            <span className="sp-tl-name">{t.name}</span>
                            <span className={`sp-tl-count ${n >= t.seats ? 'is-full' : ''}`}>{n}/{t.seats}</span>
                            <span className="sp-tl-bar"><i style={{ width: `${Math.min(100, (n / t.seats) * 100)}%` }} /></span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </>
            ) : selectedEl.type === 'table' ? (
              <TableInspector
                table={selectedEl}
                assign={assign}
                peopleById={peopleById}
                partyById={partyById}
                nameInputRef={nameInputRef}
                confirmDelete={confirmDelete}
                setConfirmDelete={setConfirmDelete}
                onRename={name => updateCoalesced(`name-${selectedEl.id}`, l => patchEl(l, selectedEl.id, { name }))}
                onSeats={n => setSeats(selectedEl, n)}
                onShape={s => setTableShape(selectedEl, s)}
                onOneSide={v => update(l => patchEl(l, selectedEl.id, { oneSide: v }))}
                onRotate={rot => updateCoalesced(`rot-${selectedEl.id}`, l => patchEl(l, selectedEl.id, { rot }))}
                onUnseat={id => update(l => ({ ...l, assign: unassign(l.assign, [id]) }))}
                onInitials={setInitials}
                onEmpty={() => emptyTable(selectedEl.id)}
                onDuplicate={() => duplicateElement(selectedEl.id)}
                onDelete={() => deleteElement(selectedEl.id)}
                onClose={() => setSelected(null)}
              />
            ) : (
              <ShapeInspector
                shape={selectedEl}
                confirmDelete={confirmDelete}
                setConfirmDelete={setConfirmDelete}
                onLabel={label => updateCoalesced(`label-${selectedEl.id}`, l => patchEl(l, selectedEl.id, { label }))}
                onSize={(w, h) => updateCoalesced(`size-${selectedEl.id}`, l => patchEl(l, selectedEl.id, { w, h }))}
                onRound={round => update(l => patchEl(l, selectedEl.id, { round }))}
                onColor={color => updateCoalesced(`color-${selectedEl.id}`, l => patchEl(l, selectedEl.id, { color }))}
                onRotate={rot => updateCoalesced(`rot-${selectedEl.id}`, l => patchEl(l, selectedEl.id, { rot }))}
                onDuplicate={() => duplicateElement(selectedEl.id)}
                onDelete={() => deleteElement(selectedEl.id)}
                onClose={() => setSelected(null)}
              />
            )}
          </aside>

          {toast && (
            <div className="sp-toast" role="status">
              <span>{toast.msg}</span>
              {toast.undo && <button type="button" onClick={() => { undo(); setToast(null) }}>Deshacer</button>}
            </div>
          )}
        </main>
      </div>

      {/* Drag ghost */}
      {ghost && (
        <div className={`sp-ghost ${ghost.kind === 'new' ? 'is-new' : ''}`} style={{ left: ghost.x, top: ghost.y, '--pc': ghost.color }}>
          {ghost.kind === 'people' && <span className="sp-avatar" style={{ background: ghost.color }}>{ghost.count > 1 ? ghost.count : ghost.label.slice(0, 1)}</span>}
          <span>{ghost.label}</span>
        </div>
      )}

      {(loading || loadError) && (
        <div className="sp-overlay">
          {loading ? (
            <p>Cargando invitados y plano…</p>
          ) : (
            <div className="sp-error">
              <p>{loadError}</p>
              <div>
                <button type="button" className="btn btn-primary" onClick={load}>Reintentar</button>
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cerrar</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>,
    document.body,
  )
}

// ── Inspectors ───────────────────────────────────────────────────────────

function InspectorHead({ kicker, onClose }) {
  return (
    <div className="sp-insp-head">
      <span className="sp-kicker">{kicker}</span>
      <button type="button" className="sp-tool sp-tool-sm" onClick={onClose} aria-label="Cerrar panel"><Icon name="close" size={14} /></button>
    </div>
  )
}

function DeleteButton({ confirmDelete, setConfirmDelete, onDelete, warning }) {
  return confirmDelete ? (
    <div className="sp-confirm">
      <p>{warning}</p>
      <div>
        <button type="button" className="btn btn-primary sp-danger" onClick={onDelete}>Sí, eliminar</button>
        <button type="button" className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>Cancelar</button>
      </div>
    </div>
  ) : (
    <button type="button" className="btn btn-secondary sp-btn sp-danger-ghost" onClick={() => (warning ? setConfirmDelete(true) : onDelete())}>
      <Icon name="trash" size={15} /> Eliminar
    </button>
  )
}

function RotateField({ value, onChange }) {
  return (
    <div className="sp-field">
      <label>Rotación <b>{value || 0}°</b></label>
      <input type="range" min="0" max="345" step="15" value={value || 0} onChange={e => onChange(Number(e.target.value))} />
    </div>
  )
}

function TableInspector({
  table, assign, peopleById, partyById, nameInputRef, confirmDelete, setConfirmDelete,
  onRename, onSeats, onShape, onOneSide, onRotate, onUnseat, onInitials, onEmpty, onDuplicate, onDelete, onClose,
}) {
  const occ = seatOccupants(assign, table.id)
  const seatedRows = Object.keys(occ).map(Number).sort((a, b) => a - b)
  return (
    <>
      <InspectorHead kicker="Mesa" onClose={onClose} />
      <div className="sp-field">
        <label htmlFor="sp-name">Nombre</label>
        <input id="sp-name" ref={nameInputRef} className="input" value={table.name} maxLength={40} onChange={e => onRename(e.target.value)} placeholder="Ej. Familia Fuenzalida" />
      </div>
      <div className="sp-field">
        <label>Forma</label>
        <Segmented value={table.shape} onChange={onShape} options={[{ value: 'round', label: 'Redonda' }, { value: 'rect', label: 'Rectangular' }]} />
      </div>
      <div className="sp-field sp-field-row">
        <label>Sillas</label>
        <Stepper value={table.seats} min={2} max={MAX_SEATS[table.shape]} onChange={onSeats} label="Cantidad de sillas" />
      </div>
      {table.shape === 'rect' && (
        <label className="sp-check"><input type="checkbox" checked={!!table.oneSide} onChange={e => onOneSide(e.target.checked)} /> Sillas de un solo lado (mesa principal)</label>
      )}
      <RotateField value={table.rot} onChange={onRotate} />

      <div className="sp-field">
        <label>Sentados <b>{seatedRows.length}/{table.seats}</b></label>
        {seatedRows.length === 0 ? (
          <p className="sp-empty-note">Arrastra invitados desde la lista hasta esta mesa.</p>
        ) : (
          <ul className="sp-seated">
            {seatedRows.map(s => {
              const p = peopleById.get(occ[s])
              if (!p) return null
              const party = partyById.get(p.partyId)
              return (
                <li key={s}>
                  <span className="sp-seat-num">{s + 1}</span>
                  <InitialsAvatar person={p} onCommit={onInitials} />
                  <span className="sp-person-name">{p.name}{party?.dietary && <span className="sp-diet" title={party.dietary}><Icon name="leaf" size={12} /></span>}</span>
                  <button type="button" className="sp-x" onClick={() => onUnseat(p.id)} aria-label={`Quitar a ${p.name}`}><Icon name="close" size={12} /></button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="sp-insp-actions">
        <button type="button" className="btn btn-secondary sp-btn" onClick={onEmpty} disabled={!seatedRows.length}>Vaciar</button>
        <button type="button" className="btn btn-secondary sp-btn" onClick={onDuplicate}><Icon name="copy" size={15} /> Duplicar</button>
        <DeleteButton
          confirmDelete={confirmDelete}
          setConfirmDelete={setConfirmDelete}
          onDelete={onDelete}
          warning={seatedRows.length ? `Sus ${seatedRows.length} invitados volverán a la lista.` : ''}
        />
      </div>
    </>
  )
}

function ShapeInspector({ shape, confirmDelete, setConfirmDelete, onLabel, onSize, onRound, onColor, onRotate, onDuplicate, onDelete, onClose }) {
  const num = (v, fallback) => (Number.isFinite(v) ? clamp(Math.round(v), 40, 1200) : fallback)
  return (
    <>
      <InspectorHead kicker={SHAPE_PRESETS[shape.preset]?.label || 'Figura'} onClose={onClose} />
      <div className="sp-field">
        <label htmlFor="sp-label">Etiqueta</label>
        <input id="sp-label" className="input" value={shape.label} maxLength={40} onChange={e => onLabel(e.target.value)} />
      </div>
      <div className="sp-field sp-field-2">
        <div>
          <label htmlFor="sp-w">Ancho</label>
          <input id="sp-w" className="input" type="number" min="40" max="1200" step="10" value={shape.w} onChange={e => onSize(num(e.target.valueAsNumber, shape.w), shape.h)} />
        </div>
        <div>
          <label htmlFor="sp-h">Alto</label>
          <input id="sp-h" className="input" type="number" min="40" max="1200" step="10" value={shape.h} onChange={e => onSize(shape.w, num(e.target.valueAsNumber, shape.h))} />
        </div>
      </div>
      <div className="sp-field">
        <label>Forma</label>
        <Segmented value={shape.round ? 'round' : 'rect'} onChange={v => onRound(v === 'round')} options={[{ value: 'rect', label: 'Rectángulo' }, { value: 'round', label: 'Óvalo' }]} />
      </div>
      {shape.preset === 'custom' && (
        <div className="sp-field">
          <label>Color</label>
          <div className="sp-swatches">
            {PARTY_COLORS.map(c => (
              <button key={c} type="button" className={(shape.color || PARTY_COLORS[0]) === c ? 'active' : ''} style={{ background: c }} onClick={() => onColor(c)} aria-label={`Color ${c}`} />
            ))}
            <input type="color" value={/^#[0-9a-f]{6}$/i.test(shape.color || '') ? shape.color : PARTY_COLORS[0]} onChange={e => onColor(e.target.value)} aria-label="Color personalizado" title="Otro color" />
          </div>
        </div>
      )}
      <RotateField value={shape.rot} onChange={onRotate} />
      <p className="sp-empty-note">Arrastra la esquina para cambiar el tamaño y el punto de arriba para rotar.</p>
      <div className="sp-insp-actions">
        <button type="button" className="btn btn-secondary sp-btn" onClick={onDuplicate}><Icon name="copy" size={15} /> Duplicar</button>
        <DeleteButton confirmDelete={confirmDelete} setConfirmDelete={setConfirmDelete} onDelete={onDelete} warning="" />
      </div>
    </>
  )
}
