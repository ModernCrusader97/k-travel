import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isLoggedIn } from '../api'
import { useLang } from '../LangContext'
import type { Lang } from '../i18n'

export default function Header() {
  const navigate = useNavigate()
  const { lang, t, setLang, labels } = useLang()
  const [langOpen, setLangOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <header className="header">
      <div className="wrap header-inner">
        <Link to="/" className="logo"><img src="/logo.png" alt="KONDA" className="logo-img" data-edit="로고이미지" data-edit-type="image" /></Link>

        {/* Desktop nav */}
        <nav className="nav desktop-nav">
          <a href="#">{t.navDownload}</a>
          <Link to="/apply">{t.navCard}</Link>
          <Link to="/guide">{t.navGuide}</Link>
          <button className="btn btn-sm" style={{ fontWeight: 600 }} onClick={() => navigate(isLoggedIn() ? '/my' : '/login')}>{isLoggedIn() ? t.navMy : t.navLogin}</button>
        </nav>

        {/* Language dropdown */}
        <div className="lang-wrap" ref={langRef} style={{ position: 'relative' }}>
          <button className="btn-lang" onClick={() => setLangOpen(v => !v)}>
            {labels[lang]} ▾
          </button>
          {langOpen && (
            <div className="lang-dropdown">
              {(Object.keys(labels) as Lang[]).map(l => (
                <button
                  key={l}
                  className={`lang-option${l === lang ? ' lang-option--active' : ''}`}
                  onClick={() => { setLang(l); setLangOpen(false) }}
                >
                  {labels[l]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile right side */}
        <div className="mobile-nav">
          <button className="btn-lang" onClick={() => setLangOpen(v => !v)}>{labels[lang]} ▾</button>
          <button className="hamburger" onClick={() => setMobileOpen(v => !v)}>☰</button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="mobile-menu">
          <a href="#" onClick={() => setMobileOpen(false)}>{t.navDownload}</a>
          <Link to="/apply" onClick={() => setMobileOpen(false)}>{t.navCard}</Link>
          <Link to="/guide" onClick={() => setMobileOpen(false)}>{t.navGuide}</Link>
          <button onClick={() => { setMobileOpen(false); navigate(isLoggedIn() ? '/my' : '/login') }}>{isLoggedIn() ? t.navMy : t.navLogin}</button>
        </div>
      )}
    </header>
  )
}
