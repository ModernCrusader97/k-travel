import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/app/AppLayout'

type TxItem = {
  id: number
  type: string
  time: string
  merchant?: string
  amount: string
  positive: boolean
  action?: 'review-now' | 'view-review'
}

type TxGroup = { date: string; items: TxItem[] }

const TRANSACTIONS: TxGroup[] = [
  {
    date: 'Today',
    items: [
      { id: 1, type: 'Payback', time: '10:38', amount: '+1 KRW', positive: true },
      { id: 2, type: 'Payment', time: '12:05', merchant: 'Oliveyoung', amount: '- 23,500 KRW', positive: false, action: 'review-now' },
      { id: 3, type: 'Payment', time: '12:05', merchant: 'Oliveyoung', amount: '- 23,500 KRW', positive: false, action: 'review-now' },
      { id: 4, type: 'Transit Recharge', time: '10:38', amount: '- 50,000 KRW', positive: false },
      { id: 5, type: 'Top-up', time: '10:38', amount: '+ 500,000 KRW', positive: true },
      { id: 6, type: 'Top-up', time: '10:38', amount: '+ 500,000 KRW', positive: true },
    ],
  },
  {
    date: 'Sunday, 23',
    items: [
      { id: 7, type: 'Payment', time: '12:05', merchant: 'Oliveyoung', amount: '- 23,500 KRW', positive: false, action: 'review-now' },
      { id: 8, type: 'Payment', time: '12:05', merchant: 'Oliveyoung', amount: '- 23,500 KRW', positive: false, action: 'view-review' },
      { id: 9, type: 'Top-up', time: '10:38', amount: '+ 500,000 KRW', positive: true },
      { id: 10, type: 'Top-up', time: '10:38', amount: '+ 500,000 KRW', positive: true },
      { id: 11, type: 'Card Issuance Fee', time: '10:38', amount: '- 50,000 KRW', positive: false },
    ],
  },
]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function ActivityPage() {
  const navigate = useNavigate()
  const [monthIdx, setMonthIdx] = useState(2)

  return (
    <AppLayout>
      <div className="act-header">
        <button className="act-back" onClick={() => navigate('/app')}>‹</button>
        <span className="act-title">All activity</span>
      </div>

      <div className="act-month-row">
        <button className="act-month-btn" onClick={() => setMonthIdx(i => Math.max(0, i - 1))}>‹</button>
        <span className="act-month">{MONTHS[monthIdx]}</span>
        <button className="act-month-btn" onClick={() => setMonthIdx(i => Math.min(11, i + 1))}>›</button>
        <button className="act-filter">⚙</button>
      </div>

      <div className="act-list">
        {TRANSACTIONS.map(group => (
          <div key={group.date}>
            <div className="act-date-label">{group.date}</div>
            {group.items.map(item => (
              <div key={item.id} className="act-item-wrap">
                <div className="act-item">
                  <div className="act-item-icon">🪪</div>
                  <div className="act-item-info">
                    <div className="act-item-type">{item.type}</div>
                    <div className="act-item-meta">
                      {item.time}{item.merchant && ` · ${item.merchant}`}
                    </div>
                  </div>
                  <div className={`act-item-amount${item.positive ? ' act-amount-pos' : ''}`}>
                    {item.amount}
                  </div>
                </div>
                {item.action === 'review-now' && (
                  <button className="act-action-btn">✏ Review now</button>
                )}
                {item.action === 'view-review' && (
                  <button className="act-action-btn">✓ View my review</button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </AppLayout>
  )
}
