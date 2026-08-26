// `xlsx` is a big library (~400kB) and only admin ever touches it — every
// call site below `await`s a dynamic `import('xlsx')` instead of a static
// top-level one, so Vite splits it into its own chunk that's fetched only
// when an admin actually clicks Export/Import, never bundled into the
// guest-facing site every wedding guest's phone loads on the homepage.

/**
 * Downloads rows as a real .xlsx workbook — one sheet, headers in row 1.
 * Same call shape as the old `downloadCSV(filename, rows, headers)` it
 * replaces, so every call site only needed its filename extension and
 * import swapped. Excel/Sheets open this natively with correct types and
 * accents, no delimiter/encoding guessing the way a CSV needs.
 */
export async function downloadXLSX(filename, rows, headers) {
  const XLSX = await import('xlsx')
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  // Rough auto-width per column so an admin doesn't have to hand-resize
  // every column on open — widest of the header or any cell in that column,
  // capped so one long note/message field doesn't blow out the whole sheet.
  ws['!cols'] = headers.map((h, col) => {
    const width = rows.reduce((max, r) => Math.max(max, String(r[col] ?? '').length), String(h).length)
    return { wch: Math.min(Math.max(width + 2, 10), 60) }
  })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Hoja1')
  XLSX.writeFile(wb, filename)
}

/**
 * Reads an uploaded workbook's first sheet into an array of row objects
 * keyed by header — the mirror image of `downloadXLSX`, and the replacement
 * for the old `parseCSV(text)`. Takes the `File` itself (not its text) since
 * .xlsx is a binary/zip format, not plain text.
 */
export async function parseXLSXFile(file) {
  const [XLSX, buf] = await Promise.all([import('xlsx'), file.arrayBuffer()])
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) return []
  return XLSX.utils.sheet_to_json(ws, { defval: '' })
}

function normalizeKey(s) {
  return s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/**
 * Reads a row's value by header name, ignoring accents/case/whitespace so a
 * column re-ordered or re-cased by a spreadsheet app still lines up — same
 * contract as the old `parseCsv.js` `cell()`. Coerced to a trimmed string
 * regardless of the cell's underlying type (Excel hands back real numbers
 * for numeric cells, not text), so every caller downstream that expects a
 * string (then does its own `Number(...)` where it needs one) keeps working
 * unchanged.
 */
export function cell(row, name) {
  const target = normalizeKey(name)
  const key = Object.keys(row).find(k => normalizeKey(k) === target)
  const v = key ? row[key] : ''
  return v == null ? '' : String(v).trim()
}
