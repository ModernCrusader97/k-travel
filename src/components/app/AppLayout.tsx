import { Link, useLocation } from 'react-router-dom'

const NAV = [
  { path: '/app', label: 'Home', icon: '⊙' },
  { path: '/app/mission', label: 'Mission', icon: '◎' },
  { path: '/app/place', label: 'Place', icon: '◈' },
  { path: '/app/my', label: 'My', icon: '◉' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()

  return (
    <div className="app-frame">
      <div className="app-screen">
        <div className="app-content">{children}</div>
        <nav className="app-bottom-nav">
          {NAV.map(n => (
            <Link key={n.path} to={n.path} className={`app-nav-item${pathname === n.path ? ' active' : ''}`}>
              <span className="app-nav-icon">{n.icon}</span>
              <span className="app-nav-label">{n.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
