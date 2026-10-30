import { useEffect } from 'react'
import { createPortal } from 'react-dom'

/**
 * Small centered dialog for the admin panel's edit forms. Portaled to <body>
 * (the admin overlay is a scrolling, blurred layer, so a `fixed` child would
 * be anchored to it). Escape closes it — and is swallowed so it doesn't also
 * close the admin panel underneath.
 */
export default function AdminModal({ title, onClose, children }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key !== 'Escape') return
      e.stopImmediatePropagation()
      onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  return createPortal(
    <div
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'grid', placeItems: 'center', padding: '1rem', background: 'rgba(20, 18, 14, 0.5)' }}
    >
      <div
        role="dialog" aria-modal="true" aria-label={title}
        style={{ background: 'var(--paper)', color: 'var(--color-text)', border: '1px solid var(--color-divider)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', width: 'min(520px, 100%)', maxHeight: '100%', overflow: 'auto', padding: '1.25rem' }}
      >
        <h3 style={{ margin: '0 0 1rem', fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--color-accent)' }}>{title}</h3>
        {children}
      </div>
    </div>,
    document.body,
  )
}
