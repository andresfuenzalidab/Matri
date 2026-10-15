// Wedding planner: pure helpers shared by the admin UI (WeddingPlanner.jsx)
// and the API (functions/api/admin/planner.js, which merges concurrent edits).
// No DOM or React in here on purpose — the worker imports it too.

export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
export const DIAS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']
export const ESTADOS = { pendiente: 'Pendiente', en_curso: 'En curso', listo: 'Listo' }

const pad = n => String(n).padStart(2, '0')
export const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
export const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return toISO(d) }
export const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 864e5)
export const hoyISO = () => toISO(new Date())
export const diaSemana = s => DIAS[(parse(s).getDay() + 6) % 7]
export const fechaCorta = s => { const d = parse(s); return `${diaSemana(s)} ${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}` }
export const uid = p => (p || 'h') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
export const ahora = () => new Date().toISOString()
export const clone = o => JSON.parse(JSON.stringify(o))
export const iniciales = n => (n || '?').trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase()

/** Pre-loaded plan, used the first time the planner is opened. */
export function semilla() {
  const A = ['andres'], AP = ['andres', 'pareja']
  const h = (titulo, fecha, eventoId, categoria, responsables, extra = {}) => ({
    id: uid(), titulo, fecha, fechaFin: null, hora: null, tipo: 'tarea', eventoId, categoria,
    responsables, estado: 'pendiente', notas: '', sugerido: false, updatedAt: '2026-10-15T00:00:00.000Z', ...extra,
  })
  return {
    version: 1,
    updatedAt: ahora(),
    configUpdatedAt: '2026-10-15T00:00:00.000Z',
    meta: { titulo: 'Andrés & Catalina', subtitulo: 'Plan del matrimonio' },
    responsables: [
      { id: 'andres', nombre: 'Andrés', color: '#2F7A68', email: '' },
      { id: 'pareja', nombre: 'Catalina', color: '#B25A82', email: '' },
    ],
    eventos: [
      { id: 'civil', nombre: 'Civil', fecha: '2026-10-17', fechaFin: null, lugar: 'Laguna de Aculeo', color: '#3B8A73' },
      { id: 'simbolico', nombre: 'Simbólico', fecha: '2026-11-06', fechaFin: null, lugar: 'Altos del Paico', color: '#B35C86' },
      { id: 'luna', nombre: 'Luna de miel', fecha: '2026-11-09', fechaFin: '2026-12-06', lugar: 'Seychelles', color: '#2E84A8' },
      { id: 'general', nombre: 'General', fecha: null, fechaFin: null, lugar: '', color: '#8A8C78' },
    ],
    categorias: ['Música', 'Invitados', 'Banquete', 'Ceremonia', 'Decoración', 'Proveedores', 'Vestuario', 'Trámites', 'Viaje', 'Otros'],
    hitos: [
      h('Definir música final y dinámicas (Thunderstruck, Shrek, etc.)', '2026-09-29', 'simbolico', 'Música', AP, { notas: 'Llevar la lista cerrada a la reunión con el DJ del 29 de octubre.' }),
      h('Sacar licencia internacional de conducir', '2026-09-30', 'luna', 'Viaje', A, { notas: 'Deadline fines de septiembre.' }),
      h('Contratar seguros de viaje y ponerse las vacunas', '2026-09-30', 'luna', 'Viaje', AP, { notas: 'Deadline fines de septiembre. El seguro debe cubrir del 9 nov al 6 dic.' }),
      h('Confirmar invitados final', '2026-10-01', 'simbolico', 'Invitados', AP),
      h('Armar mesas', '2026-10-01', 'simbolico', 'Invitados', AP, { fechaFin: '2026-10-07', notas: 'Primera semana de octubre.' }),
      h('Degustación', '2026-10-02', 'simbolico', 'Banquete', AP),
      h('Definir menú post degustación', '2026-10-02', 'simbolico', 'Banquete', AP),
      h('Definir estructura de la ceremonia', '2026-10-09', 'simbolico', 'Ceremonia', AP, { notas: 'Plazo.' }),
      h('Manifestación en el Registro Civil', '2026-10-14', 'civil', 'Trámites', AP),
      h('Preparar documentos de participación en los gananciales', '2026-10-14', 'civil', 'Trámites', AP),
      h('Coordinar testigos', '2026-10-14', 'civil', 'Trámites', AP),
      h('Pedirse el día en el trabajo', '2026-10-14', 'civil', 'Trámites', AP),
      h('Reunión con videógrafos', '2026-10-15', 'simbolico', 'Proveedores', AP),
      h('Ceremonia civil', '2026-10-17', 'civil', 'Ceremonia', AP, { tipo: 'clave', notas: 'Laguna de Aculeo.' }),
      h('Pedir certificado de matrimonio en línea', '2026-10-19', 'civil', 'Trámites', A, { sugerido: true, notas: 'Gratis en registrocivil.cl. Guardarlo en PDF para el viaje.' }),
      h('Revisar vigencia de pasaportes', '2026-10-20', 'luna', 'Viaje', AP, { sugerido: true, notas: 'Deben estar vigentes al menos 6 meses después del 6 de diciembre.' }),
      h('Reunión con DJ', '2026-10-29', 'simbolico', 'Música', AP, { notas: 'Repasar música final y dinámicas.' }),
      h('Sacar permiso de viaje a Seychelles', '2026-10-30', 'luna', 'Viaje', AP, { notas: 'Sacarlo el 30 de octubre.' }),
      h('Prueba final de vestido y traje', '2026-10-31', 'simbolico', 'Vestuario', AP, { sugerido: true }),
      h('Escribir los votos', '2026-10-31', 'simbolico', 'Ceremonia', AP, { sugerido: true }),
      h('Timeline del día hora a hora y compartirlo con proveedores', '2026-11-01', 'simbolico', 'Proveedores', AP, { sugerido: true }),
      h('Definir extras de la ceremonia: arco completo o no', '2026-11-02', 'simbolico', 'Decoración', AP, { notas: 'Plazo.' }),
      h('Definir luces del cóctel: solas o con pelotitas', '2026-11-02', 'simbolico', 'Decoración', AP, { notas: 'Plazo.' }),
      h('Pagos finales a proveedores y sobres de propina', '2026-11-04', 'simbolico', 'Proveedores', AP, { sugerido: true }),
      h('Armar maletas de la luna de miel', '2026-11-05', 'luna', 'Viaje', AP, { sugerido: true, notas: 'Antes del simbólico, para no correr el fin de semana.' }),
      h('Matrimonio simbólico', '2026-11-06', 'simbolico', 'Ceremonia', AP, { tipo: 'clave', notas: 'Altos del Paico.' }),
      h('Check-in online de los vuelos', '2026-11-08', 'luna', 'Viaje', AP, { sugerido: true }),
      h('Luna de miel en Seychelles', '2026-11-09', 'luna', 'Viaje', AP, { tipo: 'clave', fechaFin: '2026-12-06' }),
      h('Última reunión con la banquetera', null, 'simbolico', 'Banquete', AP, { notas: 'Explicarles lo que escribimos en el Excel.' }),
      h('Reunión con la fotógrafa', null, 'simbolico', 'Proveedores', AP),
      h('Cotizar extras (cervezas, vinos, cotillón, etc.)', null, 'simbolico', 'Banquete', AP),
    ],
  }
}

/** Is it a plan document we can work with? */
export function esPlanValido(doc) {
  return !!doc && typeof doc === 'object' && Array.isArray(doc.hitos) && Array.isArray(doc.eventos) && Array.isArray(doc.responsables)
}

/**
 * Merges two versions of the plan: the newer configuration wins as a whole
 * (people, events, categories, cover), tasks are merged one by one so two
 * people editing different tasks never overwrite each other. Used on the
 * server (so concurrent saves combine) and on the client (so a save that
 * returns merged data refreshes the screen).
 */
export function fusionar(local, remoto) {
  if (!local) return remoto
  if (!remoto) return local
  const base = (remoto.configUpdatedAt || '') > (local.configUpdatedAt || '') ? remoto : local
  const out = clone(base)
  const mapa = new Map()
  for (const h of [...(local.hitos || []), ...(remoto.hitos || [])]) {
    const prev = mapa.get(h.id)
    if (!prev || (h.updatedAt || '') > (prev.updatedAt || '')) mapa.set(h.id, h)
  }
  out.hitos = [...mapa.values()]
  out.updatedAt = (local.updatedAt || '') > (remoto.updatedAt || '') ? local.updatedAt : remoto.updatedAt
  return out
}

/* ---------- calendarios externos ---------- */

const ymd = s => s.replace(/-/g, '')

function rangoHora(h) {
  const [hh, mm] = h.hora.split(':').map(Number)
  const ini = parse(h.fecha); ini.setHours(hh, mm)
  const fin = new Date(ini.getTime() + 60 * 60 * 1000)
  const f = d => `${toISO(d).replace(/-/g, '')}T${pad(d.getHours())}${pad(d.getMinutes())}00`
  return [f(ini), f(fin)]
}

function descripcion(h, doc) {
  const resp = h.responsables.map(id => (doc.responsables.find(r => r.id === id) || {}).nombre).filter(Boolean).join(', ')
  const ev = doc.eventos.find(e => e.id === h.eventoId)
  return [h.notas, resp && 'Responsables: ' + resp, ev && 'Evento: ' + ev.nombre, 'Estado: ' + ESTADOS[h.estado]].filter(Boolean).join('\n')
}

function lugar(h, doc) {
  const ev = doc.eventos.find(e => e.id === h.eventoId)
  return h.tipo === 'clave' && ev ? ev.lugar || '' : ''
}

export function linkGoogle(h, doc) {
  const p = new URLSearchParams({ action: 'TEMPLATE', text: h.titulo, details: descripcion(h, doc) })
  if (h.hora) { const [a, b] = rangoHora(h); p.set('dates', `${a}/${b}`); p.set('ctz', 'America/Santiago') }
  else p.set('dates', `${ymd(h.fecha)}/${ymd(addDays(h.fechaFin || h.fecha, 1))}`)
  const l = lugar(h, doc); if (l) p.set('location', l)
  const mails = h.responsables.map(id => (doc.responsables.find(r => r.id === id) || {}).email).filter(Boolean)
  if (mails.length) p.set('add', mails.join(','))
  return 'https://calendar.google.com/calendar/render?' + p.toString()
}

export function linkOutlook(h, doc) {
  const p = new URLSearchParams({ path: '/calendar/action/compose', rru: 'addevent', subject: h.titulo, body: descripcion(h, doc) })
  if (h.hora) {
    p.set('startdt', `${h.fecha}T${h.hora}:00`)
    const [, b] = rangoHora(h)
    p.set('enddt', `${b.slice(0, 4)}-${b.slice(4, 6)}-${b.slice(6, 8)}T${b.slice(9, 11)}:${b.slice(11, 13)}:00`)
  } else {
    p.set('startdt', h.fecha); p.set('enddt', addDays(h.fechaFin || h.fecha, 1)); p.set('allday', 'true')
  }
  const l = lugar(h, doc); if (l) p.set('location', l)
  return 'https://outlook.live.com/calendar/0/deeplink/compose?' + p.toString()
}

export function generarICS(hitos, doc, nombreCal) {
  const e = s => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1')
  const fold = l => { const out = []; while (l.length > 74) { out.push(l.slice(0, 74)); l = ' ' + l.slice(74) } out.push(l); return out.join('\r\n') }
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Plan Matrimonio//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:' + e(nombreCal), 'X-WR-TIMEZONE:America/Santiago']
  for (const h of hitos) {
    if (!h.fecha) continue
    L.push('BEGIN:VEVENT', 'UID:' + h.id + '@plan-matrimonio', 'DTSTAMP:' + stamp)
    if (h.hora) { const [a, b] = rangoHora(h); L.push('DTSTART:' + a, 'DTEND:' + b) }
    else L.push('DTSTART;VALUE=DATE:' + ymd(h.fecha), 'DTEND;VALUE=DATE:' + ymd(addDays(h.fechaFin || h.fecha, 1)))
    L.push('SUMMARY:' + e((h.estado === 'listo' ? '✓ ' : '') + h.titulo), 'DESCRIPTION:' + e(descripcion(h, doc)))
    const l = lugar(h, doc); if (l) L.push('LOCATION:' + e(l))
    if (h.tipo === 'tarea' && h.estado !== 'listo') L.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + e(h.titulo), 'TRIGGER:-PT15H', 'END:VALARM')
    L.push('END:VEVENT')
  }
  L.push('END:VCALENDAR')
  return L.map(fold).join('\r\n')
}
