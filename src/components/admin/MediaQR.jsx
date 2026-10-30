import { useState, useEffect, useMemo } from 'react'
import QRCode from 'qrcode'
import { useApp } from '../../context/AppContext'
import AlbumConfig from './AlbumConfig.jsx'
import AlbumManager from './AlbumManager.jsx'

const KEY_STORAGE = 'matri-media-key'

function readKey() {
  try { return localStorage.getItem(KEY_STORAGE) || '' } catch { return '' }
}

/**
 * Admin tab: builds the album link + QR code for the guests, and checks that
 * the Google Drive connection works. The "clave" is the MEDIA_KEY secret set
 * in Cloudflare (optional — leave empty if you didn't set one).
 */
export default function MediaQR() {
  const { token } = useApp()
  const [configKey, setConfigKey] = useState(0) // bumped after a contest reset so the form reloads its values
  const [key, setKey] = useState(readKey)
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState(false)
  const [health, setHealth] = useState({ state: 'checking' }) // checking | ok | error

  const link = useMemo(() => `${window.location.origin}/fotos${key.trim() ? `?k=${encodeURIComponent(key.trim())}` : ''}`, [key])

  useEffect(() => {
    try { localStorage.setItem(KEY_STORAGE, key) } catch { /* storage blocked */ }
  }, [key])

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(link, { errorCorrectionLevel: 'H', margin: 2, width: 1024, color: { dark: '#3a4430', light: '#ffffff' } })
      .then(url => { if (!cancelled) setQr(url) })
      .catch(() => { if (!cancelled) setQr('') })
    return () => { cancelled = true }
  }, [link])

  useEffect(() => {
    let cancelled = false
    setHealth({ state: 'checking' })
    const t = setTimeout(() => {
      fetch(`/api/media${key.trim() ? `?k=${encodeURIComponent(key.trim())}` : ''}`)
        .then(async r => {
          const d = await r.json().catch(() => ({}))
          if (cancelled) return
          setHealth(r.ok ? { state: 'ok', count: d.items?.length ?? 0, more: !!d.nextPageToken } : { state: 'error', message: d?.error || 'Error desconocido.' })
        })
        .catch(() => { if (!cancelled) setHealth({ state: 'error', message: 'No se pudo conectar.' }) })
    }, 400)
    return () => { cancelled = true; clearTimeout(t) }
  }, [key])

  async function copy() {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { /* clipboard blocked */ }
  }

  function download() {
    const a = document.createElement('a')
    a.href = qr; a.download = 'qr-album.png'
    document.body.appendChild(a); a.click(); a.remove()
  }

  function print() {
    const w = window.open('', '_blank', 'width=720,height=900')
    if (!w) return
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>QR álbum</title>
      <style>
        @page { size: A5; margin: 0 }
        body { margin: 0; height: 100vh; display: grid; place-items: center; font-family: 'Cormorant Garamond', Georgia, serif; color: #3a4430; background: #f7f3ea; text-align: center }
        .card { padding: 36px 40px; max-width: 420px }
        h1 { font-size: 46px; font-weight: 600; margin: 0 0 6px; color: #b68235 }
        p { font-size: 20px; margin: 0 0 22px; line-height: 1.35 }
        img { width: 300px; height: 300px; border: 10px solid #fff; border-radius: 8px; box-shadow: 0 4px 18px rgba(0,0,0,.15) }
        small { display: block; margin-top: 18px; font-size: 15px; letter-spacing: .12em; text-transform: uppercase }
      </style></head><body><div class="card">
        <h1>Nuestro álbum</h1>
        <p>Escanea el código para ver y subir tus fotos y videos del matrimonio</p>
        <img src="${qr}" alt="QR">
        <small>Andrés &amp; Catalina</small>
      </div><script>window.onload=function(){setTimeout(function(){window.print()},250)}<\/script></body></html>`)
    w.document.close()
  }

  const status = {
    checking: { cls: '', text: 'Comprobando la conexión con Google Drive…' },
    ok: { cls: 'ok', text: health.state === 'ok' ? `Conectado a Drive · ${health.count}${health.more ? '+' : ''} archivos en el álbum` : '' },
    error: { cls: 'err', text: health.message },
  }[health.state]

  return (
    <div style={{ display: 'grid', gap: '1.5rem', maxWidth: 820 }}>
      <div>
        <h3 style={{ margin: '0 0 0.25rem' }}>Álbum de fotos y videos</h3>
        <p style={{ margin: 0, opacity: 0.75 }}>
          Los invitados escanean el QR, ven todo lo que hay en la carpeta de Google Drive y suben lo suyo. Lo que suban aparece en la carpeta.
        </p>
      </div>

      <div
        role="status"
        style={{
          padding: '0.6rem 0.9rem', borderRadius: 8, fontSize: '0.9rem',
          border: `1px solid ${health.state === 'error' ? '#b03e2c' : health.state === 'ok' ? '#4d7a3a' : 'var(--color-divider)'}`,
          color: health.state === 'error' ? '#b03e2c' : 'inherit',
        }}
      >
        {status.text}
        {health.state === 'error' && <> — revisa <code>MEDIA_SETUP.md</code>.</>}
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ width: 240, height: 240, background: '#fff', borderRadius: 10, padding: 8, boxShadow: 'var(--shadow-md)', flex: 'none' }}>
          {qr ? <img src={qr} alt="Código QR del álbum" style={{ width: '100%', height: '100%', display: 'block' }} /> : null}
        </div>
        <div style={{ flex: '1 1 260px', display: 'grid', gap: '0.9rem', minWidth: 0 }}>
          <label style={{ display: 'grid', gap: 4, fontSize: '0.85rem' }}>
            Clave del álbum (MEDIA_KEY, opcional)
            <input
              value={key} onChange={e => setKey(e.target.value)} placeholder="Déjalo vacío si no configuraste una"
              style={{ padding: '8px 10px', border: '1px solid var(--color-divider)', borderRadius: 6, font: 'inherit', background: 'transparent', color: 'inherit' }}
            />
          </label>
          <div style={{ fontSize: '0.85rem', wordBreak: 'break-all', opacity: 0.8 }}>{link}</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={download} disabled={!qr}>Descargar PNG</button>
            <button className="btn btn-secondary" onClick={print} disabled={!qr}>Imprimir tarjeta</button>
            <button className="btn btn-secondary" onClick={copy}>{copied ? '¡Copiado!' : 'Copiar enlace'}</button>
            <a className="btn btn-secondary" href={link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>Abrir álbum</a>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.65 }}>
            Prueba el QR con tu teléfono antes de imprimirlo. Para borrar fotos o reiniciar votos usa «Archivos y votos» más abajo.
          </p>
        </div>
      </div>
      <AlbumConfig key={configKey} token={token} />
      <AlbumManager token={token} mediaKey={key.trim()} onReset={() => setConfigKey(k => k + 1)} />
    </div>
  )
}
