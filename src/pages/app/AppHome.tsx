import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/app/AppLayout'
import { api, isLoggedIn } from '../../api'

const PAYBACK_ITEMS = [
  { id: 1, emoji: '🥢', name: 'Olive young', amount: '12,300 KRW', state: 'payback' },
  { id: 2, emoji: '🍗', name: 'Kyochon chicken gangnam', amount: '6,300 KRW', state: 'payback' },
  { id: 3, emoji: '🥢', name: 'Olive young', amount: '249,000 KRW', state: 'payback' },
  { id: 4, emoji: '💰', name: 'Top-up reward', amount: '+100,000 KRW', state: 'krw', krw: '1 KRW' },
]

type Modal =
  | { type: 'exchange'; currency: 'KRW' | 'USD' }
  | { type: 'payback-info' }
  | { type: 'review' }
  | { type: 'nfc-scan' }
  | { type: 'nfc-unsupported' }
  | { type: 'nfc-balance' }
  | { type: 'nfc-fail' }
  | { type: 'nfc-settings' }
  | { type: 'nfc-rw' }
  | { type: 'transit-fail' }
  | null

export default function AppHome() {
  const navigate = useNavigate()
  const [modal, setModal] = useState<Modal>(null)
  const [activeCard, setActiveCard] = useState<'pay' | 'transit'>('pay')
  const [exchangeVal, setExchangeVal] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  const [krwBalance, setKrwBalance] = useState(0)
  const [usdBalance, setUsdBalance] = useState(0)
  const payBalance = krwBalance
  const transitBalance = 351850

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return }
    api.balance().then(b => { setKrwBalance(b.krw); setUsdBalance(parseFloat(b.usd)) }).catch(() => {})
  }, [])

  const close = () => setModal(null)

  function handleKeypad(digit: string) {
    if (digit === '⌫') setExchangeVal(v => v.slice(0, -1))
    else setExchangeVal(v => (v + digit).slice(0, 12))
  }

  function handleTransitUpdate() {
    close()
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2500)
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="ah-header">
        <span className="ah-logo">KONDA</span>
        <button className="ah-atm-btn">ATM</button>
      </div>

      {/* Exchange rates */}
      <div className="ah-rates">
        <div className="ah-rate-row" onClick={() => setModal({ type: 'exchange', currency: 'KRW' })}>
          <span className="ah-flag">🇰🇷</span>
          <span className="ah-currency">KRW</span>
          <span className="ah-rate-val">{krwBalance.toLocaleString()}</span>
        </div>
        <div className="ah-rate-row" onClick={() => setModal({ type: 'exchange', currency: 'USD' })}>
          <span className="ah-flag">🇺🇸</span>
          <span className="ah-currency">USD</span>
          <span className="ah-usd-change">0.01 USD ▲</span>
          <span className="ah-rate-val">{usdBalance.toFixed(2)}</span>
        </div>
      </div>

      {/* Card carousel */}
      <div className="ah-card-carousel">
        {/* Pay card */}
        <div className={`ah-card ah-card-pay${activeCard === 'pay' ? ' ah-card-active' : ''}`}
          onClick={() => setActiveCard('pay')}>
          <div className="ah-card-label" onClick={e => { e.stopPropagation(); navigate('/app/activity') }}>
            <span className="ah-card-icon">🪪</span> Pay
            <span className="ah-card-arrow">›</span>
          </div>
          <div className="ah-card-balance">{payBalance.toLocaleString()} KRW</div>
          <div className="ah-card-sub">{(payBalance / 100 * 0.025).toFixed(2)} USD</div>
          <div className="ah-card-actions">
            <button className="ah-card-btn" onClick={e => { e.stopPropagation(); navigate('/app/activity') }}>
              + Top-up
            </button>
            <button className="ah-card-btn" onClick={e => e.stopPropagation()}>
              ↑ Send
            </button>
          </div>
        </div>

        {/* Transit card */}
        <div className={`ah-card ah-card-transit${activeCard === 'transit' ? ' ah-card-active' : ''}`}
          onClick={() => setActiveCard('transit')}>
          <div className="ah-card-label ah-card-label--dark" onClick={e => { e.stopPropagation(); navigate('/app/recharge') }}>
            <span className="ah-card-icon">🚌</span> Transit
            <span className="ah-card-arrow">›</span>
          </div>
          <div className="ah-card-balance ah-balance-dark">{transitBalance.toLocaleString()} KRW</div>
          <div className="ah-card-sub ah-sub-dark">Updated 2 h ago</div>
          <div className="ah-card-actions">
            <button className="ah-card-btn ah-btn-dark"
              onClick={e => { e.stopPropagation(); navigate('/app/recharge') }}>
              + Top-up
            </button>
            <button className="ah-card-btn ah-btn-dark"
              onClick={e => { e.stopPropagation(); setModal({ type: 'nfc-scan' }) }}>
              ↺ update
            </button>
          </div>
        </div>

        {/* Add card */}
        <div className="ah-card ah-card-add">
          <button className="ah-add-card-btn">＋</button>
        </div>
      </div>

      {/* Toast */}
      {toastVisible && (
        <div className="ah-toast">✓ 교통카드 정보가 업데이트 되었습니다</div>
      )}

      {/* Payback */}
      <div className="ah-payback">
        <div className="ah-payback-header">
          <span className="ah-payback-title" style={{cursor:'pointer'}} onClick={() => navigate('/app/activity')}>Payback</span>
          <div className="ah-payback-total">
            <span onClick={() => setModal({ type: 'payback-info' })}>총 20KRW 받았어요</span>
          </div>
        </div>
        {PAYBACK_ITEMS.map(item => (
          <div key={item.id} className="ah-payback-item">
            <div className="ah-payback-emoji">{item.emoji}</div>
            <div className="ah-payback-info">
              <div className="ah-payback-amount">{item.amount}</div>
              <div className="ah-payback-name">{item.name}</div>
            </div>
            {item.state === 'payback' && (
              <button className="ah-payback-btn">Payback</button>
            )}
            {item.state === 'krw' && (
              <span className="ah-payback-krw">{item.krw}</span>
            )}
          </div>
        ))}
      </div>

      {/* Review bottom sheet */}
      {modal?.type === 'review' && (
        <div className="ah-overlay" onClick={close}>
          <div className="ah-sheet" onClick={e => e.stopPropagation()}>
            <div className="ah-sheet-title">리뷰 작성하고 도토리도 받으세요!</div>
            {[1, 2, 3].map(i => (
              <div key={i} className="ah-review-item">
                <span className="ah-review-emoji">🍗</span>
                <div className="ah-review-info">
                  <div>6,300 KRW</div>
                  <div className="ah-review-meta">Kyochon chicken gangnam · 26.01.24 10:50</div>
                </div>
                <button className="ah-review-btn">리뷰 쓰기 🐿</button>
              </div>
            ))}
            <button className="ah-sheet-more" onClick={close}>다른 리뷰 쓰러 가기</button>
          </div>
        </div>
      )}

      {/* Exchange rate modal */}
      {modal?.type === 'exchange' && (
        <div className="ah-overlay" onClick={close}>
          <div className="ah-ex-modal" onClick={e => e.stopPropagation()}>
            <div className="ah-ex-row">
              <span className="ah-flag">🇰🇷</span>
              <span>KRW</span>
              <span className={`ah-ex-val${modal.currency === 'KRW' ? ' ah-ex-selected' : ''}`}>
                {krwBalance.toLocaleString()}
              </span>
            </div>
            <div className="ah-ex-row">
              <span className="ah-flag">🇺🇸</span>
              <span>USD</span>
              <span className="ah-usd-change-sm">0.01 USD ▲</span>
              <span className={`ah-ex-val${modal.currency === 'USD' ? ' ah-ex-selected' : ''}`}>
                {usdBalance.toFixed(2)}
              </span>
            </div>
            <div className="ah-ex-note">해당 환율은 결제시 참고용으로 사용가능합니다</div>
            <div className="ah-ex-change-badge">어제보다 0.01 USD 올랐어요 ▲</div>
            <div className="ah-keypad">
              {['1','2','3','4','5','6','7','8','9','0','⌫'].map(k => (
                <button key={k} className={`ah-key${k === '⌫' ? ' ah-key-del' : ''}`}
                  onClick={() => handleKeypad(k)}>{k}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payback info modal */}
      {modal?.type === 'payback-info' && (
        <div className="ah-overlay" onClick={close}>
          <div className="ah-sheet" onClick={e => e.stopPropagation()}>
            <div className="ah-sheet-title">언제 페이백 받을 수 있나요?</div>
            <div className="ah-info-item">
              <span>🐻</span>
              <div>콘다카드로 결제, 충전할 때 마다 매번 <span style={{color:'#F5C300',fontWeight:700}}>최대 100만원</span>을 돌려드려요</div>
            </div>
            <div className="ah-info-item">
              <div><span style={{color:'#F5C300',fontWeight:700}}>최근 다섯 건</span>에 대해서만 돌려받을 수 있으니 잊지말고 받으세요!</div>
              <span>😤</span>
            </div>
            <button className="ah-confirm-btn" onClick={close}>확인했어요</button>
          </div>
        </div>
      )}

      {/* NFC scan modal */}
      {modal?.type === 'nfc-scan' && (
        <div className="ah-overlay" onClick={close}>
          <div className="ah-sheet ah-sheet-center" onClick={e => e.stopPropagation()}>
            <div className="ah-nfc-title">Ready to NFC scan</div>
            <div className="ah-nfc-sub">Hold your card to the back of your phone <span style={{color:'#ef4444'}}>for 3 seconds</span> to complete loading.</div>
            <div className="ah-nfc-icon">
              <div className="ah-nfc-circle">
                <span style={{fontSize:48}}>📱</span>
              </div>
            </div>
            <button className="ah-confirm-btn ah-confirm-dark" onClick={close}>Cancel</button>
          </div>
        </div>
      )}

      {/* NFC not supported */}
      {modal?.type === 'nfc-unsupported' && (
        <div className="ah-overlay" onClick={close}>
          <div className="ah-alert-modal" onClick={e => e.stopPropagation()}>
            <div className="ah-alert-icon ah-icon-warn">!</div>
            <div className="ah-alert-title">NFC 미지원 기기</div>
            <div className="ah-alert-sub">차단하면 서로의 리뷰를 확인할 수 없습니다.</div>
            <div className="ah-alert-btns">
              <button className="ah-alert-btn-cancel" onClick={close}>취소</button>
              <button className="ah-alert-btn-danger" onClick={close}>차단</button>
            </div>
          </div>
        </div>
      )}

      {/* Insufficient balance */}
      {modal?.type === 'nfc-balance' && (
        <div className="ah-overlay" onClick={close}>
          <div className="ah-alert-modal" onClick={e => e.stopPropagation()}>
            <div className="ah-alert-icon ah-icon-warn">!</div>
            <div className="ah-alert-title">충전잔액 부족</div>
            <div className="ah-alert-sub">교통카드 충전은 5,000KRW 부터 가능합니다. 먼저 콘다카드 충전을 진행해 주세요.</div>
            <div className="ah-alert-btns">
              <button className="ah-alert-btn-cancel" onClick={close}>취소</button>
              <button className="ah-alert-btn-primary" onClick={close}>콘다카드 충전</button>
            </div>
          </div>
        </div>
      )}

      {/* Transit recharge failed */}
      {modal?.type === 'transit-fail' && (
        <div className="ah-overlay" onClick={close}>
          <div className="ah-alert-modal" onClick={e => e.stopPropagation()}>
            <div className="ah-alert-icon ah-icon-error">⚠</div>
            <div className="ah-alert-title">교통카드 충전 실패</div>
            <div className="ah-alert-sub">교통카드 충전이 실패되었습니다 처음부터 다시 시도 해 주세요</div>
            <div className="ah-alert-btns">
              <button className="ah-alert-btn-cancel" onClick={close}>취소</button>
              <button className="ah-alert-btn-danger" onClick={close}>다시 시도</button>
            </div>
          </div>
        </div>
      )}

      {/* NFC settings */}
      {modal?.type === 'nfc-settings' && (
        <div className="ah-overlay" onClick={close}>
          <div className="ah-alert-modal" onClick={e => e.stopPropagation()}>
            <div className="ah-alert-icon ah-icon-warn">!</div>
            <div className="ah-alert-title">NFC 설정 활성화 필요</div>
            <div className="ah-alert-sub">차단하면 서로의 리뷰를 확인할 수 없습니다.</div>
            <div className="ah-alert-btns">
              <button className="ah-alert-btn-cancel" onClick={close}>취소</button>
              <button className="ah-alert-btn-danger" onClick={close}>차단</button>
            </div>
          </div>
        </div>
      )}

      {/* NFC R/W */}
      {modal?.type === 'nfc-rw' && (
        <div className="ah-overlay" onClick={close}>
          <div className="ah-alert-modal" onClick={e => e.stopPropagation()}>
            <div className="ah-alert-icon ah-icon-warn">!</div>
            <div className="ah-alert-title">NFC 읽기/쓰기 활성화 필요</div>
            <div className="ah-alert-sub">NFC 설정을 켜야 서비스 이용이 가능합니다. 읽기 및 쓰기 모두 활성화가 필요합니다.</div>
            <div className="ah-alert-btns">
              <button className="ah-alert-btn-cancel" onClick={close}>취소</button>
              <button className="ah-alert-btn-danger" onClick={close}>차단</button>
            </div>
          </div>
        </div>
      )}

      {/* NFC scan fail */}
      {modal?.type === 'nfc-fail' && (
        <div className="ah-overlay" onClick={close}>
          <div className="ah-alert-modal" onClick={e => e.stopPropagation()}>
            <div className="ah-alert-icon ah-icon-error">⚠</div>
            <div className="ah-alert-title">NFC 스캔 실패</div>
            <div className="ah-alert-sub">다시 시도해 주세요</div>
            <div className="ah-alert-btns">
              <button className="ah-alert-btn-cancel" onClick={close}>취소</button>
              <button className="ah-alert-btn-danger" onClick={close}>다시 시도</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
