import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isLoggedIn, api } from '../api'
import { useLang } from '../LangContext'

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function Calendar({ year, month, selected, onSelect }: {
  year: number; month: number; selected: number | null; onSelect: (d: number) => void
}) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = Array(firstDay).fill(null)
  for (let i = 1; i <= daysInMonth; i++) cells.push(i)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="cal">
      <div className="cal-grid cal-head">
        {DAYS.map(d => <div key={d} className="cal-cell cal-day-label">{d}</div>)}
      </div>
      <div className="cal-grid">
        {cells.map((d, i) => (
          <div
            key={i}
            className={`cal-cell cal-day${d === null ? ' cal-empty' : ''}${d !== null && d === selected ? ' cal-selected' : ''}${d !== null && d < new Date().getDate() && year <= new Date().getFullYear() && month <= new Date().getMonth() ? ' cal-past' : ''}`}
            onClick={() => d && onSelect(d)}
          >
            {d}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CardApply() {
  const navigate = useNavigate()
  const { t } = useLang()

  const LOCATIONS = [
    { id: 'ICN-T1', label: '인천공항 T1', sub: t.applyLocationNote.split('.')[0] || '공항 내 편의점 수령' },
    { id: 'MYEONGDONG', label: '명동', sub: '' },
    { id: 'ICN-T2', label: '인천공항 T2', sub: '' },
    { id: 'EULJIRO', label: '을지로', sub: '' },
    { id: 'GMP', label: '김포공항', sub: '' },
    { id: 'HONGDAE', label: '홍대', sub: '' },
  ]

  const CARDS = [
    { id: 1, img: '/cards/card-dark.png', name: t.cardStreet, soldOut: false, card_type: 'street', color: 'dark' },
    { id: 2, img: '/cards/card-navy.png', name: t.cardNavy, soldOut: false, card_type: 'navy', color: 'navy' },
    { id: 3, img: '/cards/card-black.png', name: t.cardBlack, soldOut: true, card_type: 'black', color: 'black' },
    { id: 4, img: '/cards/card-white.png', name: t.cardWhite, soldOut: false, card_type: 'white', color: 'white' },
    { id: 5, img: '/cards/card-yellow.png', name: t.cardStandard, soldOut: true, card_type: 'standard', color: 'yellow' },
    { id: 6, img: '/cards/card-red.png', name: t.cardRed, soldOut: true, card_type: 'red', color: 'red' },
  ]

  const now = new Date()
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [location, setLocation] = useState('ICN-T1')
  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const [qty, setQty] = useState(1)
  const [payMethod, setPayMethod] = useState<'paypal' | 'card'>('card')
  const [agree1, setAgree1] = useState(false)
  const [agree2, setAgree2] = useState(false)
  const [showLoginAlert, setShowLoginAlert] = useState(false)

  const selectedLoc = LOCATIONS.find(l => l.id === location)
  const dateStr = selectedDay
    ? `${calYear}.${String(calMonth + 1).padStart(2, '0')}.${String(selectedDay).padStart(2, '0')}`
    : '—'

  const isCurrentMonth = calYear === now.getFullYear() && calMonth === now.getMonth()

  function prevMonth() {
    if (isCurrentMonth) return
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }

  const canPay = selectedDay && selectedCard && agree1 && agree2

  return (
    <div className="ca-page">
      <div className="wrap">
        <div className="ca-layout">
          {/* LEFT */}
          <div className="ca-left">
            {/* Date */}
            <div className="ca-section">
              <h2 className="ca-section-title">{t.applyDateQ}</h2>
              <div className="ca-month-nav">
                <button onClick={prevMonth} disabled={isCurrentMonth} style={isCurrentMonth ? {opacity:0.3,cursor:'default'} : {}}>‹</button>
                <span>{calYear}. {String(calMonth + 1).padStart(2, '0')}</span>
                <button onClick={nextMonth}>›</button>
              </div>
              <Calendar year={calYear} month={calMonth} selected={selectedDay} onSelect={setSelectedDay} />
            </div>

            {/* Location */}
            <div className="ca-section">
              <h2 className="ca-section-title">{t.applyLocQ}</h2>
              <div className="ca-loc-grid">
                {LOCATIONS.map(l => (
                  <button
                    key={l.id}
                    className={`ca-loc-btn${location === l.id ? ' active' : ''}`}
                    onClick={() => setLocation(l.id)}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <p className="ca-loc-note">{t.applyLocationNote}</p>
            </div>

            {/* Card */}
            <div className="ca-section">
              <h2 className="ca-section-title">{t.applyCardQ}</h2>
              <div className="ca-card-grid">
                {CARDS.map(c => (
                  <div
                    key={c.id}
                    className={`ca-card-item${selectedCard === c.id ? ' active' : ''}${c.soldOut ? ' sold-out' : ''}`}
                    onClick={() => !c.soldOut && setSelectedCard(c.id)}
                  >
                    <img src={c.img} alt={c.name} className="ca-card-img" />
                    {c.soldOut && <div className="ca-sold-badge">Sold out</div>}
                    <div className="ca-card-dot">
                      <div className={`ca-dot${selectedCard === c.id ? ' active' : ''}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT sidebar */}
          <aside className="ca-sidebar">
            <div className="ca-sidebar-card">
              <h3 className="ca-sidebar-title">{t.applyAgree1}</h3>

              <div className="ca-sb-row">
                <span>{t.applyAgree2}</span>
                <strong>{(qty * 5000).toLocaleString()} KRW</strong>
              </div>

              <div className="ca-sb-row">
                <span>{t.applyArrivalDate}</span>
                <span className="ca-sb-val-muted">{dateStr}</span>
              </div>

              <div className="ca-sb-row ca-sb-row--top">
                <span>{t.applyPickupSpot}</span>
                <div className="ca-sb-loc">
                  <div>{selectedLoc?.label}</div>
                </div>
              </div>

              <div className="ca-sb-label">{t.applyPayment}</div>
              <div className="ca-pay-btns">
                <button
                  className={`ca-pay-btn${payMethod === 'paypal' ? ' active' : ''}`}
                  onClick={() => setPayMethod('paypal')}
                >
                  PayPal
                </button>
                <button
                  className={`ca-pay-btn${payMethod === 'card' ? ' active' : ''}`}
                  onClick={() => setPayMethod('card')}
                >
                  {t.applyCreditCard}
                </button>
              </div>

              <label className="ca-check">
                <input type="checkbox" checked={agree1} onChange={e => setAgree1(e.target.checked)} />
                {t.applyCheck1}
              </label>
              <label className="ca-check">
                <input type="checkbox" checked={agree2} onChange={e => setAgree2(e.target.checked)} />
                {t.applyCheck2}
              </label>

              <button
                className={`ca-pay-cta${canPay ? ' active' : ''}`}
                disabled={!canPay}
                onClick={async () => {
                  if (!isLoggedIn()) { setShowLoginAlert(true); return }
                  const card = CARDS.find(c => c.id === selectedCard)
                  if (!card) return
                  try {
                    await api.applyCard(card.card_type, card.color)
                  } catch {}
                  navigate('/complete', { state: { card, dateStr, location: selectedLoc, qty, payMethod } })
                }}
              >
                {t.applyPayBtn}
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Login required alert */}
      {showLoginAlert && (
        <div className="ca-alert-overlay" onClick={() => setShowLoginAlert(false)}>
          <div className="ca-alert-box" onClick={e => e.stopPropagation()}>
            <div className="ca-alert-icon">🔒</div>
            <div className="ca-alert-title">{t.applyLoginRequired}</div>
            <div className="ca-alert-sub">{t.applyLoginRequiredSub}</div>
            <div className="ca-alert-btns">
              <button className="ca-alert-cancel" onClick={() => setShowLoginAlert(false)}>{t.applyCancel}</button>
              <button className="ca-alert-confirm" onClick={() => navigate('/login', { state: { from: '/apply' } })}>{t.applyLoginBtn}</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="ca-footer">
        <div className="wrap ca-footer-inner">
          <div className="ca-footer-cols">
            <div className="ca-footer-col">
              <h4>{t.footerSupport}</h4>
              <a href="#">{t.footerHelp}</a>
              <a href="#">{t.footerSafety}</a>
            </div>
            <div className="ca-footer-col">
              <h4>{t.footerPolicy}</h4>
              <a href="#">{t.footerTerms}</a>
              <a href="#">{t.footerPrivacy}</a>
              <a href="#">{t.footerCookie}</a>
              <a href="#">{t.footerSitemap}</a>
            </div>
          </div>
          <div className="ca-footer-bottom">
            <span>© 2025 KONDA. All rights reserved.</span>
            <div className="ca-footer-socials">
              <a href="#">📘</a>
              <a href="#">📷</a>
              <a href="#">🐦</a>
              <a href="#">▶</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
