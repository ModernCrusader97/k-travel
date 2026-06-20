import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { useLang } from '../LangContext'

export default function Complete() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLang()
  const state = (location.state as any) || {}
  const card = state.card
  const dateStr = state.dateStr || '—'
  const loc = state.location
  const qty = state.qty || 1
  const payMethod = state.payMethod === 'paypal' ? 'PayPal' : t.completeCreditCard

  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#F5C300', '#000000', '#ffffff', '#ff6b6b', '#4dabf7'],
    })
  }, [])

  return (
    <div className="complete-page">
      <div className="complete-box">
        <h1 className="complete-title">{t.completeTitle}</h1>

        <div className="complete-card-img">
          {card ? (
            <img src={card.img} alt={card.name} />
          ) : (
            <img src="/cards/card-yellow.svg" alt="KONDA" />
          )}
          {card && <div style={{ fontSize: 13, color: '#666', marginTop: 8 }}>{card.name}</div>}
        </div>

        <div className="complete-steps">
          {/* Step 1 */}
          <div className="cstep cstep--done">
            <div className="cstep-dot cstep-dot--done">✓</div>
            <div className="cstep-body">
              <div className="cstep-label">{t.completeStep1Label}</div>
              <div className="cstep-detail">{qty}개</div>
              <div className="cstep-detail">{(qty * 5000).toLocaleString()}원</div>
              <div className="cstep-detail">{payMethod}</div>
            </div>
          </div>

          <div className="cstep-line" />

          {/* Step 2 */}
          <div className="cstep cstep--active">
            <div className="cstep-dot cstep-dot--active">2</div>
            <div className="cstep-body">
              <div className="cstep-label">{t.completeStep2Label}</div>
              <div className="cstep-detail">{t.completeStep2a}</div>
              <div className="cstep-detail">{t.completeStep2b}</div>
              <button className="cstep-btn">{t.completeStep2Btn}</button>
            </div>
          </div>

          <div className="cstep-line" />

          {/* Step 3 */}
          <div className="cstep cstep--pending">
            <div className="cstep-dot cstep-dot--pending">3</div>
            <div className="cstep-body">
              <div className="cstep-label">{t.completeStep3Label}</div>
              <div className="cstep-detail">{dateStr}</div>
              {loc && <div className="cstep-detail">{loc.label} · {loc.sub}</div>}
            </div>
          </div>

          <div className="cstep-line" />

          {/* Step 4 */}
          <div className="cstep cstep--pending">
            <div className="cstep-dot cstep-dot--pending">✓</div>
            <div className="cstep-body">
              <div className="cstep-label">{t.completeStep4Label}</div>
            </div>
          </div>
        </div>

        <button className="btn btn-black btn-full btn-lg" onClick={() => navigate('/my')}>
          {t.completeViewHistory}
        </button>

        <footer className="complete-footer">
          <div className="complete-footer-cols">
            <div className="complete-footer-col">
              <div className="complete-footer-head">{t.footerSupport}</div>
              <a href="#">{t.footerHelp}</a>
              <a href="#">{t.footerSafety}</a>
              <a href="#">{t.footerCookie}</a>
              <a href="#">{t.footerSitemap}</a>
            </div>
            <div className="complete-footer-col">
              <div className="complete-footer-head">{t.footerPolicy}</div>
              <a href="#">{t.footerTerms}</a>
              <a href="#">{t.footerPrivacy}</a>
              <a href="#">{t.footerCookie}</a>
              <a href="#">{t.footerSitemap}</a>
            </div>
          </div>
          <div className="complete-footer-copy">© 2025 KONDA. All rights reserved.</div>
        </footer>
      </div>
    </div>
  )
}
