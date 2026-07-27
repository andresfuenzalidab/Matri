export function downloadCSV(filename, rows, headers) {
  const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))]
  const encoder = new TextEncoder()
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF])
  const content = encoder.encode(lines.join('\n'))
  const blob = new Blob([bom, content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
