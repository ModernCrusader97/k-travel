import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const QUICK = [5000, 10000, 50000, 90000]
const MAX_BALANCE = 120000
const RECHARGE_MIN = 5000

type ErrorKind = 'max-balance' | 'max-topup' | 'minimum' | null

function fmt(n: number) {
  return n.toLocaleString()
}

export default function RechargePage() {
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<ErrorKind>(null)

  const numAmount = parseInt(amount || '0', 10)
  const currentBalance = 0
  const afterRecharge = currentBalance + numAmount
  const rechargeableAmount = MAX_BALANCE - currentBalance

  function validate(val: number): ErrorKind {
    if (val > rechargeableAmount) return 'max-balance'
    if (val > 300000) return 'max-topup'
    if (val > 0 && val < RECHARGE_MIN) return 'minimum'
    return null
  }

  function handleKey(k: string) {
    if (k === '⌫') {
      const next = amount.slice(0, -1)
      setAmount(next)
      setError(validate(parseInt(next || '0', 10)))
      return
    }
    const raw = k === '00' ? amount + '00' : amount + k
    if (raw.length > 9) return
    const next = String(parseInt(raw, 10) || 0)
    setAmount(next === '0' ? '' : next)
    setError(validate(parseInt(next, 10)))
  }

  function handleQuick(v: number) {
    setAmount(String(v))
    setError(validate(v))
  }

  const canRecharge = numAmount >= RECHARGE_MIN && !error

  return (
    <div className="rch-page">
      <div className="rch-header">
        <button className="rch-back" onClick={() => navigate('/app')}>‹</button>
        <span className="rch-title">Transit card recharge</span>
      </div>

      <div className="rch-body">
        <div className={`rch-amount-display${error ? ' rch-amount-error' : ''}`}>
          {amount
            ? <><span className="rch-amount-num">{fmt(numAmount)}</span><span className="rch-amount-unit">KRW</span></>
            : <span className="rch-amount-placeholder">How much to top up?</span>
          }
        </div>

        {error === 'max-balance' && (
          <div className="rch-error-text">Insufficient available balance for recharge.</div>
        )}
        {error === 'minimum' && (
          <div className="rch-error-text">Minimum recharge amount is ₩5,000.</div>
        )}
        {error === 'max-topup' && (
          <div className="rch-error-text">Exceeds maximum top-up amount.</div>
        )}

        <div className="rch-rows">
          <div className="rch-row">
            <span>Current balance</span>
            <span className="rch-row-val">₩ {fmt(currentBalance)}</span>
          </div>
          <div className="rch-row">
            <span>After {amount ? 'recharge' : 'top up'}</span>
            <span className={`rch-row-val${numAmount > 0 ? ' rch-row-after' : ''}`}>
              ₩ {fmt(afterRecharge)}
            </span>
          </div>
        </div>

        <div className="rch-note">The transferred amount cannot be restored.</div>

        <div className="rch-rechargeable">
          <span>Rechargeable amount <span className="rch-help">ⓘ</span></span>
          <span>₩ {fmt(rechargeableAmount)}</span>
        </div>

        <div className="rch-quick-row">
          {QUICK.map(v => (
            <button
              key={v}
              className={`rch-quick-btn${numAmount === v ? ' rch-quick-active' : ''}`}
              onClick={() => handleQuick(v)}
            >
              ₩ {fmt(v)}
            </button>
          ))}
        </div>
      </div>

      <div className="rch-keypad-wrap">
        <div className="rch-keypad">
          {['1','2','3','4','5','6','7','8','9','00','0','⌫'].map(k => (
            <button key={k} className={`rch-key${k === '⌫' ? ' rch-key-del' : ''}`} onClick={() => handleKey(k)}>
              {k}
            </button>
          ))}
        </div>
        <button
          className={`rch-recharge-btn${canRecharge ? ' rch-recharge-active' : ''}`}
          disabled={!canRecharge}
          onClick={() => navigate('/app/recharge/complete', { state: { amount: numAmount, after: afterRecharge } })}
        >
          Recharge
        </button>
      </div>
    </div>
  )
}
