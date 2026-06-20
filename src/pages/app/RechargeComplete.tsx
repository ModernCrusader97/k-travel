import { useNavigate, useLocation } from 'react-router-dom'

export default function RechargeComplete() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const amount: number = state?.amount ?? 50000
  const after: number = state?.after ?? 50000

  function fmt(n: number) { return n.toLocaleString() }

  return (
    <div className="rcc-page">
      <div className="rcc-check-wrap">
        <div className="rcc-check-circle">✓</div>
      </div>

      <div className="rcc-content">
        <div className="rcc-title">You've successfully recharged</div>
        <div className="rcc-amount">{fmt(amount)} KRW</div>
        <div className="rcc-note">
          The recharged amount cannot be transferred to your K.ONDA prepaid card balance.
        </div>

        <div className="rcc-info-box">
          <div className="rcc-info-row">
            <span>Recharge amount</span>
            <span>{fmt(amount)} KRW</span>
          </div>
          <div className="rcc-info-row">
            <span>Balance after recharge</span>
            <span>{fmt(after)} KRW</span>
          </div>
        </div>

        <button className="rcc-done-btn" onClick={() => navigate('/app')}>Done</button>
      </div>
    </div>
  )
}
