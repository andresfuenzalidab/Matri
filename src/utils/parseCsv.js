/**
 * Parses CSV text into an array of row objects keyed by header, the mirror
 * image of `downloadCSV` (comma-delimited, double-quoted fields, `""` escapes
 * embedded quotes, UTF-8 with a BOM). Handles quoted fields that themselves
 * contain commas, quotes or newlines — Excel and Google Sheets both export
 * that shape, so a naive `split(',')` breaks on the first "Nombre, Apellido"
 * style cell.
 *
 * Headers are matched loosely (trimmed, case/accent-insensitive) so a column
 * re-ordered or re-cased by a spreadsheet app still lines up.
 */
export function parseCSV(text) {
  // Strip a UTF-8 BOM if present (downloadCSV writes one for Excel).
  const src = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text

  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field); field = ''
    } else if (c === '\r') {
      // swallow — \n (bare or in \r\n) ends the row
    } else if (c === '\n') {
      row.push(field); field = ''
      rows.push(row); row = []
    } else {
      field += c
    }
  }
  // Last field/row, if the file doesn't end with a newline.
  if (field.length || row.length) { row.push(field); rows.push(row) }

  const nonEmpty = rows.filter(r => r.some(cell => cell.trim() !== ''))
  if (!nonEmpty.length) return []

  const headers = nonEmpty[0].map(h => h.trim())
  return nonEmpty.slice(1).map(cells => {
    const obj = {}
    headers.forEach((h, i) => { obj[h] = (cells[i] ?? '').trim() })
    return obj
  })
}

function normalizeKey(s) {
  return s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** Reads a row's value by header name, ignoring accents/case/whitespace. */
export function cell(row, name) {
  const target = normalizeKey(name)
  const key = Object.keys(row).find(k => normalizeKey(k) === target)
  return key ? row[key] : ''
}
