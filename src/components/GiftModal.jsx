import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../context/AppContext'

function formatCLP(n) {
  return `$${Number(n).toLocaleString('es-CL')} CLP`
}

function CopyAllButton({ values }) {
  const [copied, setCopied] = useState(false)

  function copyAll() {
    const text = Object.entries(values)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <button onClick={copyAll} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: '0.4rem', width: '100%', marginTop: '1rem', padding: '0.9rem',
      background: copied ? 'var(--color-accent)' : 'transparent',
      border: `1.5px solid ${copied ? 'var(--color-accent)' : 'var(--color-divider)'}`,
      borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s',
      color: copied ? '#fff' : 'var(--color-text)',
    }}>
      {copied ? (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
      <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
        {copied ? '¡Copiado!' : 'Copiar datos de transferencia'}
      </span>
    </button>
  )
}

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(() => {
    navigator.clipboard.writeText(String(value)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }, [value])

  return (
    <button
      onClick={copy}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '0 0 0 0.4rem', color: copied ? 'var(--color-accent)' : 'rgba(0,0,0,0.35)',
        fontSize: '0.75rem', fontFamily: 'inherit', whiteSpace: 'nowrap',
        transition: 'color 0.2s',
      }}
      title="Copiar"
    >
      {copied ? '✓ Copiado' : 'Copiar'}
    </button>
  )
}

export default function GiftModal({ cartItems, onClose, onReserved }) {
  const { token, guest, get } = useApp()
  const mpEnabled = get('mp_enabled') === 'si'
  const [step, setStep] = useState(mpEnabled ? 'choose' : 'transfer')
  const [confirmed, setConfirmed] = useState(false)
  const [congratsMsg, setCongratsMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const total = cartItems.reduce((sum, { gift, quantity }) => sum + (gift.price || 0) * quantity, 0)
  const defaultBankMsg = `Regalo Matrimonio Cata y Andrés — ${guest?.name || ''}`

  async function handleTransferConfirm() {
    if (!confirmed || loading) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/gifts/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({
          gifts: cartItems.map(({ gift, quantity }) => ({ id: gift.id, quantity })),
          guestName: guest?.name,
          confirmedPayment: 1,
          congratulationsMessage: congratsMsg.trim(),
        }),
      })
      if (res.ok) {
        onReserved(cartItems)
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

  async function handleCardPay() {
    if (loading) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/gifts/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Invite-Token': token },
        body: JSON.stringify({
          gifts: cartItems.map(({ gift, quantity }) => ({ id: gift.id, quantity })),
          guestName: guest?.name,
          congratulationsMessage: congratsMsg.trim(),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        try { localStorage.setItem(`pendingMPCart_${token}`, JSON.stringify(cartItems)) } catch {}
        window.location.href = data.init_point
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'No se pudo iniciar el pago. Intenta con transferencia.')
      }
    } catch {
      setError('Error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  function goBack() {
    setError('')
    setConfirmed(false)
    setStep('choose')
  }

  const giftList = (
    <div className="gift-modal-items">
      {cartItems.map(({ gift, quantity }) => (
        <div key={gift.id} className="gift-modal-item">
          <div className="gift-modal-item-info">
            <span className="gift-name" style={{ fontSize: '1rem' }}>{gift.name}</span>
            {gift.description && (
              <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{gift.description}</span>
            )}
          </div>
          <div className="gift-modal-item-price">
            {quantity > 1 && <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{quantity}×</span>}
            <span style={{ color: 'var(--color-accent)' }}>{formatCLP(gift.price * quantity)}</span>
          </div>
        </div>
      ))}
      {cartItems.length > 1 && (
        <div className="gift-modal-total">
          <span>Total</span>
          <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{formatCLP(total)}</span>
        </div>
      )}
    </div>
  )

  return (
    <div className="dialog-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true">
        <div className="dialog-title">
          <span>Confirmar regalos</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="gift-modal-body">
          {giftList}

          {step === 'choose' && (
            <>
              <p style={{ fontSize: '0.875rem', opacity: 0.8, margin: '1.25rem 0 0.75rem', fontWeight: 500 }}>
                ¿Cómo quieres pagar?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button className="btn btn-secondary btn-block" onClick={() => setStep('transfer')}>
                  Transferencia bancaria — sin comisión
                </button>
                <button className="btn btn-primary btn-block" onClick={() => setStep('card')}>
                  Tarjeta de crédito — MercadoPago
                </button>
              </div>
            </>
          )}

          {step === 'transfer' && (
            <>
              {mpEnabled && (
                <button className="btn btn-ghost" style={{ marginTop: '0.75rem', fontSize: '0.8rem', padding: '0.25rem 0' }}
                  onClick={goBack}>
                  ← Cambiar método de pago
                </button>
              )}
              <p style={{ fontSize: '0.875rem', opacity: 0.8, margin: '1rem 0 0' }}>
                Realiza una transferencia con los datos a continuación y confirma tu pago.
              </p>
              <CopyAllButton values={{
                Nombre: get('bank_holder', ''),
                Banco: get('bank_name', ''),
                Tipo: get('bank_type', ''),
                Cuenta: get('bank_account', ''),
                RUT: get('bank_rut', ''),
                Email: get('bank_email', ''),
              }} />
              <div className="bank-details">
                <div className="bank-row"><span className="bank-label">Nombre</span><span className="bank-value">{get('bank_holder', '—')}<CopyButton value={get('bank_holder', '')} /></span></div>
                <div className="bank-row"><span className="bank-label">Banco</span><span className="bank-value">{get('bank_name', '—')}<CopyButton value={get('bank_name', '')} /></span></div>
                {get('bank_type') && <div className="bank-row"><span className="bank-label">Tipo</span><span className="bank-value">{get('bank_type')}<CopyButton value={get('bank_type')} /></span></div>}
                <div className="bank-row"><span className="bank-label">Cuenta</span><span className="bank-value">{get('bank_account', '—')}<CopyButton value={get('bank_account', '')} /></span></div>
                <div className="bank-row"><span className="bank-label">RUT</span><span className="bank-value">{get('bank_rut', '—')}<CopyButton value={get('bank_rut', '')} /></span></div>
                <div className="bank-row"><span className="bank-label">Email</span><span className="bank-value">{get('bank_email', '—')}<CopyButton value={get('bank_email', '')} /></span></div>
                <div className="bank-row"><span className="bank-label">Monto</span><span className="bank-value">{formatCLP(total)}<CopyButton value={total} /></span></div>
                <div className="bank-row"><span className="bank-label">Comentario</span><span className="bank-value">{defaultBankMsg}</span></div>
              </div>
              <div className="form-field">
                <label className="form-label">Mensaje de felicitaciones (opcional)</label>
                <textarea className="input" rows={2}
                  placeholder="Escribe un mensaje para los novios..."
                  value={congratsMsg} onChange={e => setCongratsMsg(e.target.value)} />
              </div>
              <label className="checkbox-row">
                <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />
                <span>Confirmo que he realizado la transferencia de {formatCLP(total)}.</span>
              </label>
              {error && <p className="form-error">{error}</p>}
              <button className="btn btn-primary btn-block" style={{ marginTop: '0.75rem' }}
                onClick={handleTransferConfirm} disabled={!confirmed || loading}>
                {loading ? 'Reservando...' : 'Confirmar regalo'}
              </button>
            </>
          )}

          {step === 'card' && (
            <>
              <button className="btn btn-ghost" style={{ marginTop: '0.75rem', fontSize: '0.8rem', padding: '0.25rem 0' }}
                onClick={goBack}>
                ← Cambiar método de pago
              </button>
              <div className="form-field" style={{ marginTop: '1rem' }}>
                <label className="form-label">Mensaje de felicitaciones (opcional)</label>
                <textarea className="input" rows={2}
                  placeholder="Escribe un mensaje para los novios..."
                  value={congratsMsg} onChange={e => setCongratsMsg(e.target.value)} />
              </div>
              <p style={{ fontSize: '0.8rem', opacity: 0.6, margin: '0.5rem 0 0' }}>
                Serás redirigido a MercadoPago para pagar {formatCLP(total)} con tarjeta de crédito.
              </p>
              {error && <p className="form-error">{error}</p>}
              <button className="btn btn-primary btn-block" style={{ marginTop: '0.75rem' }}
                onClick={handleCardPay} disabled={loading}>
                {loading ? 'Iniciando pago...' : `Pagar ${formatCLP(total)} con MercadoPago →`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
