import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, isLoggedIn, clearToken } from '../api'
import { useLang } from '../LangContext'

export default function MyPage() {
  const navigate = useNavigate()
  const { t } = useLang()
  const [user, setUser] = useState<{ email: string; name: string | null } | null>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    pending:  { label: t.myStatusPending, color: '#f59e0b' },
    approved: { label: t.myStatusApproved, color: '#10b981' },
    rejected: { label: t.myStatusRejected, color: '#ef4444' },
  }

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login', { state: { from: '/my' } }); return }
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
    <div className="pc-my-page">
      <div className="wrap">
        <div className="pc-my-layout">

          <aside className="pc-my-sidebar">
            <div className="pc-my-avatar">{user?.name?.[0] ?? user?.email?.[0] ?? '?'}</div>
            <div className="pc-my-name">{loading ? '...' : (user?.name ?? t.myNoName)}</div>
            <div className="pc-my-email">{loading ? '' : user?.email}</div>
            <button className="pc-my-logout" onClick={handleLogout}>{t.myLogout}</button>
          </aside>

          <main className="pc-my-main">
            <h2 className="pc-my-section-title">{t.myCardHistory}</h2>

            {loading ? (
              <div className="pc-my-empty">...</div>
            ) : applications.length === 0 ? (
              <div className="pc-my-empty">
                <div style={{ fontSize: 48, marginBottom: 12 }}>💳</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{t.myNoCard}</div>
                <button className="btn btn-black" style={{ padding: '12px 28px', borderRadius: 12 }}
                  onClick={() => navigate('/apply')}>{t.myApplyCard}</button>
              </div>
            ) : (
              <div className="pc-my-card-list">
                {applications.map(app => {
                  const st = STATUS_LABEL[app.status] ?? { label: app.status, color: '#999' }
                  return (
                    <div key={app.id} className="pc-my-card-row">
                      <img
                        src={`/cards/card-${app.color}.png`}
                        alt={app.card_type}
                        className="pc-my-card-img"
                        onError={e => { (e.target as HTMLImageElement).src = '/cards/card-yellow.svg' }}
                      />
                      <div className="pc-my-card-info">
                        <div className="pc-my-card-type">{app.card_type}{t.myEditionSuffix}</div>
                        <div className="pc-my-card-color">{app.color}{t.myColorSuffix}</div>
                        <div className="pc-my-card-date">{t.myAppliedDatePrefix}{new Date(app.submitted_at).toLocaleDateString()}</div>
                      </div>
                      <div className="pc-my-card-status" style={{ color: st.color }}>
                        <span className="pc-my-status-dot" style={{ background: st.color }} />
                        {st.label}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </main>

        </div>
      </div>
    </div>
  )
}
