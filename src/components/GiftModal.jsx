import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { normalizeImageUrl } from '../utils/imageUrl.js'

function formatCLP(n) {
  return `$${Number(n).toLocaleString('es-CL')} CLP`
}

export default function GiftModal({ gift, onClose, onReserved }) {
  const { token, guest, get } = useApp()
  const [confirmed, setConfirmed] = useState(false)
  const [congratsMsg, setCongratsMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const defaultBankMsg = `Regalo Matrimonio Cata y Andrés — ${guest?.name || ''}`

  async function handleConfirm() {
    if (!confirmed || loading) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/gifts/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({
          giftId: gift.id,
          guestName: guest?.name,
          confirmedPayment: 1,
          congratulationsMessage: congratsMsg.trim(),
        }),
      })
      if (res.ok) {
        onReserved(gift.id)
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'No se pudo reservar. Intenta de nuevo.')
      }
    } catch {
      setError('Error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  const giftImage = normalizeImageUrl(gift.imageUrl)

  return (
    <div className="dialog-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true">
        <div className="dialog-title">
          <span>Regalar</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="gift-modal-body">
          {giftImage && (
            <img
              src={giftImage}
              alt={gift.name}
              style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 6, marginBottom: '1rem' }}
              onError={e => e.target.style.display = 'none'}
            />
          )}
          <p className="gift-modal-gift-name">{gift.name}</p>
          {gift.description && (
            <p style={{ fontSize: '0.875rem', opacity: 0.75, marginBottom: '0.5rem' }}>{gift.description}</p>
          )}
          <p className="gift-modal-price">{formatCLP(gift.price)}</p>

          <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: 0 }}>
            Realiza una transferencia con los datos a continuación y confirma tu pago.
          </p>

          <div className="bank-details">
            <div className="bank-row">
              <span className="bank-label">Banco</span>
              <span className="bank-value">{get('bank_name', '—')}</span>
            </div>
            <div className="bank-row">
              <span className="bank-label">Cuenta</span>
              <span className="bank-value">{get('bank_account', '—')}</span>
            </div>
            <div className="bank-row">
              <span className="bank-label">RUT</span>
              <span className="bank-value">{get('bank_rut', '—')}</span>
            </div>
            <div className="bank-row">
              <span className="bank-label">Email</span>
              <span className="bank-value">{get('bank_email', '—')}</span>
            </div>
            <div className="bank-row">
              <span className="bank-label">Monto</span>
              <span className="bank-value">{formatCLP(gift.price)}</span>
            </div>
            <div className="bank-row">
              <span className="bank-label">Comentario</span>
              <span className="bank-value">{defaultBankMsg}</span>
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Mensaje de felicitaciones (opcional)</label>
            <textarea
              className="input"
              rows={2}
              placeholder="Escribe un mensaje para los novios..."
              value={congratsMsg}
              onChange={e => setCongratsMsg(e.target.value)}
            />
          </div>

          <label className="checkbox-row">
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />
            <span>Confirmo que he realizado la transferencia de {formatCLP(gift.price)}.</span>
          </label>

          {error && <p className="form-error">{error}</p>}

          <button
            className="btn btn-primary btn-block"
            style={{ marginTop: '0.75rem' }}
            onClick={handleConfirm}
            disabled={!confirmed || loading}
          >
            {loading ? 'Reservando...' : 'Confirmar regalo'}
          </button>
        </div>
      </div>
    </div>
  )
}
