import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/app/AppLayout'
import { api, isLoggedIn, clearToken } from '../../api'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:  { label: '검토 중', color: '#f59e0b' },
  approved: { label: '승인됨', color: '#10b981' },
  rejected: { label: '거절됨', color: '#ef4444' },
}

const CARD_COLOR_MAP: Record<string, string> = {
  black:  '#1a1a1a',
  white:  '#f0f0f0',
  yellow: '#F5C300',
  blue:   '#2563eb',
  red:    '#dc2626',
}

export default function MyPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<{ email: string; name: string | null } | null>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return }
    Promise.all([api.me(), api.cardApplications()])
      .then(([me, apps]) => { setUser(me); setApplications(apps) })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = () => {
    clearToken()
    navigate('/')
  }

  return (
    <AppLayout>
      <div className="my-page">
        {/* 프로필 */}
        <div className="my-profile">
          <div className="my-avatar">{user?.name?.[0] ?? user?.email?.[0] ?? '?'}</div>
          <div>
            <div className="my-name">{loading ? '...' : (user?.name ?? '이름 없음')}</div>
            <div className="my-email">{loading ? '' : user?.email}</div>
          </div>
        </div>

        {/* 카드 예약 내역 */}
        <div className="my-section-title">카드 예약 내역</div>

        {loading ? (
          <div className="my-empty">불러오는 중...</div>
        ) : applications.length === 0 ? (
          <div className="my-empty">
            <div style={{ fontSize: 36, marginBottom: 8 }}>💳</div>
            <div>카드 예약 내역이 없어요</div>
            <button className="btn btn-black" style={{ marginTop: 20, padding: '10px 24px', borderRadius: 12 }}
              onClick={() => navigate('/apply')}>카드 예약하기</button>
          </div>
        ) : (
          <div className="my-cards">
            {applications.map(app => {
              const st = STATUS_LABEL[app.status] ?? { label: app.status, color: '#999' }
              const bgColor = CARD_COLOR_MAP[app.color] ?? '#1a1a1a'
              const isLight = ['white', 'yellow'].includes(app.color)
              return (
                <div key={app.id} className="my-card-item">
                  <div className="my-card-preview" style={{ background: bgColor }}>
                    <span className="my-card-type-label" style={{ color: isLight ? '#1a1a1a' : '#fff' }}>
                      KONDA
                    </span>
                    <span className="my-card-color-dot" style={{ background: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)' }} />
                  </div>
                  <div className="my-card-info">
                    <div className="my-card-type">{app.card_type} 카드</div>
                    <div className="my-card-color-name">{app.color} 색상</div>
                    <div className="my-card-date">{new Date(app.submitted_at).toLocaleDateString('ko-KR')}</div>
                  </div>
                  <div className="my-card-status" style={{ color: st.color }}>
                    <div className="my-card-status-dot" style={{ background: st.color }} />
                    {st.label}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 로그아웃 */}
        <button className="my-logout-btn" onClick={handleLogout}>로그아웃</button>
      </div>
    </AppLayout>
  )
}
