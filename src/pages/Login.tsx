import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../api'
import { useLang } from '../LangContext'

const TERMS = [
  { title: 'Card Usage Agreement', required: true },
  { title: 'Consent to Personal Data Collection & Third-Party Provision', required: true },
  { title: 'Consent to Personal Data Collection & Third-Party Provision', required: true },
]

type Mode = 'login' | 'email' | 'verify-modal' | 'name' | 'password' | 'done' | 'find-email' | 'reset-password'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLang()
  const from = (location.state as any)?.from || '/app'
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPw, setLoginPw] = useState('')
  const [agreed, setAgreed] = useState([false, false, false])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmPw, setConfirmPw] = useState('')
  const [findName, setFindName] = useState('')
  const [foundEmail, setFoundEmail] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [resetPw, setResetPw] = useState('')
  const [resetConfirmPw, setResetConfirmPw] = useState('')
  const [resetDone, setResetDone] = useState(false)
  const [signupName, setSignupName] = useState('')

  const agreeAll = agreed.every(Boolean)
  const toggleAll = () => { const v = !agreeAll; setAgreed([v, v, v]) }
  const toggleTerm = (i: number) => setAgreed(prev => prev.map((v, idx) => idx === i ? !v : v))

  const hasLetters = /[a-zA-Z]/.test(pw)
  const hasNumbers = /[0-9]/.test(pw)
  const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(pw)
  const hasLength = pw.length >= 8 && pw.length <= 32
  const pwValid = hasLetters && hasNumbers && hasSymbols && hasLength
  const pwMatch = pw === confirmPw

  const handleLogin = async () => {
    setError(''); setLoading(true)
    try {
      await api.login(loginEmail, loginPw)
      navigate(from)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleSignup = async () => {
    setError(''); setLoading(true)
    try {
      await api.signup(email, pw, signupName)
      setMode('done')
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleFindEmail = async () => {
    setError(''); setLoading(true)
    try {
      const d = await api.findEmail(findName)
      setFoundEmail(d.maskedEmail)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleResetPassword = async () => {
    setError(''); setLoading(true)
    try {
      await api.resetPassword(resetEmail, resetPw)
      setResetDone(true)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const goBack = () => {
    if (mode === 'login') navigate(-1)
    else if (mode === 'email') setMode('login')
    else if (mode === 'verify-modal') setMode('email')
    else if (mode === 'name') setMode('email')
    else if (mode === 'password') setMode('name')
    else if (mode === 'done') navigate('/')
    else if (mode === 'find-email') { setFindName(''); setFoundEmail(''); setError(''); setMode('login') }
    else if (mode === 'reset-password') { setResetEmail(''); setResetPw(''); setResetConfirmPw(''); setResetDone(false); setError(''); setMode('login') }
  }

  return (
    <div className="auth-page">
      {mode !== 'done' && (
        <button className="auth-back-btn" onClick={goBack}>‹</button>
      )}

      <div className={`auth-right${mode === 'login' ? '' : ' auth-right--top'}`}>

        {mode === 'login' && (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, gap: 0 }}>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, marginBottom: 6, display: 'block' }}>{t.loginEmailLabel}</label>
              <input className="form-input" type="email" placeholder={t.loginEmailPlaceholder} value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 28 }}>
              <label style={{ fontSize: 13, marginBottom: 6, display: 'block' }}>{t.loginPasswordLabel}</label>
              <input className="form-input" type="password" placeholder={t.loginPasswordPlaceholder} value={loginPw} onChange={e => setLoginPw(e.target.value)} />
            </div>
            {error && <div style={{ color: 'red', fontSize: 13, marginBottom: 8 }}>{error}</div>}
            <button className="btn btn-black btn-full btn-lg" style={{ marginBottom: 12 }} onClick={handleLogin} disabled={loading}>{loading ? '...' : t.loginBtn}</button>
            <button className="btn btn-outline btn-full btn-lg" style={{ marginBottom: 20 }} onClick={() => setMode('email')}>{t.signupBtn}</button>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 13, color: 'var(--text-muted)' }}>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', padding: 0 }} onClick={() => setMode('find-email')}>{t.loginFindEmail}</button>
              <span>|</span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', padding: 0 }} onClick={() => setMode('reset-password')}>{t.loginFindPassword}</button>
            </div>
          </div>
        )}

        {(mode === 'email' || mode === 'verify-modal') && (
          <>
            <h1 className="signup-title">Enter the email<br />you want to use as your ID</h1>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <input className="form-input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="signup-terms">
              <div className="signup-agree-all" onClick={toggleAll}>
                <div className={`signup-check${agreeAll ? ' signup-check--on' : ''}`}>✓</div>
                <span>Agree to all</span>
              </div>
              <hr className="signup-divider" />
              {TERMS.map((term, i) => (
                <div key={i} className="signup-term-row" onClick={() => toggleTerm(i)}>
                  <div className={`signup-check${agreed[i] ? ' signup-check--on' : ''}`}>✓</div>
                  <div className="signup-term-text">
                    <div className="signup-term-title">{term.title}</div>
                    <div className="signup-term-sub">{term.required ? 'Required' : 'Optional'}</div>
                  </div>
                  <span className="signup-term-arrow">›</span>
                </div>
              ))}
            </div>
            <button className="btn btn-black btn-full btn-lg" style={{ marginTop: 'auto', flexShrink: 0 }}
              disabled={!email || !agreeAll}
              onClick={() => setMode('verify-modal')}>
              Create your account
            </button>

            {mode === 'verify-modal' && (
              <div className="verify-overlay">
                <div className="verify-modal">
                  <div className="verify-icon">✓</div>
                  <div className="verify-title">Verification email sent</div>
                  <div className="verify-sub">Check your inbox and tap Verify email to continue.</div>
                  <button className="btn btn-outline btn-full btn-lg" onClick={() => setMode('name')}>{t.loginContinue}</button>
                </div>
              </div>
            )}
          </>
        )}

        {mode === 'name' && (
          <>
            <h1 className="signup-title" style={{ marginBottom: 6 }}>{t.loginNameTitle}</h1>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>{t.loginNameSub}</div>
            <div className="form-group" style={{ marginBottom: 28 }}>
              <input className="form-input" type="text" placeholder={t.loginNamePlaceholder} value={signupName} onChange={e => setSignupName(e.target.value)} onKeyDown={e => e.key === 'Enter' && signupName.trim() && setMode('password')} autoFocus />
            </div>
            <button className="btn btn-black btn-full btn-lg" style={{ marginTop: 'auto', flexShrink: 0 }}
              disabled={!signupName.trim()}
              onClick={() => setMode('password')}>
              {t.loginNext}
            </button>
          </>
        )}

        {mode === 'password' && (
          <>
            <h1 className="signup-title" style={{ marginBottom: 6 }}>Create a password</h1>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>{email}</div>
            <div className="form-group">
              <input className="form-input" type="password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} />
            </div>
            <div className="form-group">
              <input className="form-input" type="password" placeholder="Confirm password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
            </div>
            {confirmPw && !pwMatch && <div style={{ color: 'red', fontSize: 13, marginBottom: 8 }}>{t.loginPasswordMismatch}</div>}
            {error && <div style={{ color: 'red', fontSize: 13, marginBottom: 8 }}>{error}</div>}
            <div className="pw-rules">
              <div className={`pw-rule${hasLetters ? ' pw-rule--ok' : ''}`}>Contains letters</div>
              <div className={`pw-rule${hasNumbers ? ' pw-rule--ok' : ''}`}>Contains numbers</div>
              <div className={`pw-rule${hasSymbols ? ' pw-rule--ok' : ''}`}>Contains symbols</div>
              <div className={`pw-rule${hasLength ? ' pw-rule--ok' : ''}`}>8-32 characters</div>
            </div>
            <button className="btn btn-black btn-full btn-lg" style={{ marginTop: 'auto', flexShrink: 0 }}
              disabled={!pwValid || !pwMatch || loading}
              onClick={handleSignup}>
              {loading ? '...' : 'Sign up'}
            </button>
          </>
        )}

        {mode === 'find-email' && (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{t.loginFindEmailTitle}</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>{t.loginFindEmailSub}</p>
            {!foundEmail ? (
              <>
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, marginBottom: 6, display: 'block' }}>{t.loginNamePlaceholder}</label>
                  <input className="form-input" type="text" placeholder={t.loginNamePlaceholder} value={findName} onChange={e => setFindName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleFindEmail()} />
                </div>
                {error && <div style={{ color: 'red', fontSize: 13, marginBottom: 8 }}>{error}</div>}
                <button className="btn btn-black btn-full btn-lg" onClick={handleFindEmail} disabled={loading || !findName}>{loading ? '...' : t.loginFindEmailBtn}</button>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ background: '#f5f5f5', borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>{t.loginFoundEmail}</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{foundEmail}</div>
                </div>
                <button className="btn btn-black btn-full btn-lg" onClick={() => { setMode('login'); setFindName(''); setFoundEmail('') }}>{t.loginGoLogin}</button>
              </div>
            )}
          </div>
        )}

        {mode === 'reset-password' && (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{t.loginResetTitle}</h2>
            {!resetDone ? (
              <>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>{t.loginResetSub}</p>
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, marginBottom: 6, display: 'block' }}>{t.loginEmailLabel}</label>
                  <input className="form-input" type="email" placeholder={t.loginEmailPlaceholder} value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, marginBottom: 6, display: 'block' }}>{t.loginNewPasswordLabel}</label>
                  <input className="form-input" type="password" placeholder={t.loginNewPasswordPlaceholder} value={resetPw} onChange={e => setResetPw(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 13, marginBottom: 6, display: 'block' }}>{t.loginConfirmPasswordLabel}</label>
                  <input className="form-input" type="password" placeholder={t.loginConfirmPasswordPlaceholder} value={resetConfirmPw} onChange={e => setResetConfirmPw(e.target.value)} />
                </div>
                <div className="pw-rules" style={{ marginBottom: 20 }}>
                  <div className={`pw-rule${/[a-zA-Z]/.test(resetPw) ? ' pw-rule--ok' : ''}`}>{t.loginPwRuleLetters}</div>
                  <div className={`pw-rule${/[0-9]/.test(resetPw) ? ' pw-rule--ok' : ''}`}>{t.loginPwRuleNumbers}</div>
                  <div className={`pw-rule${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(resetPw) ? ' pw-rule--ok' : ''}`}>{t.loginPwRuleSymbols}</div>
                  <div className={`pw-rule${resetPw.length >= 8 && resetPw.length <= 32 ? ' pw-rule--ok' : ''}`}>{t.loginPwRuleLength}</div>
                </div>
                {resetConfirmPw && resetPw !== resetConfirmPw && <div style={{ color: 'red', fontSize: 13, marginBottom: 8 }}>{t.loginPasswordMismatch}</div>}
                {error && <div style={{ color: 'red', fontSize: 13, marginBottom: 8 }}>{error}</div>}
                <button className="btn btn-black btn-full btn-lg"
                  disabled={loading || !resetEmail || !resetPw || resetPw !== resetConfirmPw}
                  onClick={handleResetPassword}>{loading ? '...' : t.loginChangePasswordBtn}</button>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{t.loginPasswordChanged}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>{t.loginPasswordChangedSub}</div>
                <button className="btn btn-black btn-full btn-lg" onClick={() => { setMode('login'); setResetEmail(''); setResetPw(''); setResetConfirmPw(''); setResetDone(false) }}>{t.loginGoLogin}</button>
              </div>
            )}
          </div>
        )}

        {mode === 'done' && (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div className="signup-title">Sign up completed</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 40 }}>Welcome to konda!</div>
              <button className="btn btn-black btn-full btn-lg" onClick={() => navigate('/app')}>{t.loginGoHome}</button>
            </div>
          </>
        )}

      </div>

      <div className="auth-left">
        <div className="auth-left-inner">
          <img src="/logo.png?v=2" alt="KONDA" />
          <img src="/hero-character.png?v=2" alt="KONDA" />
        </div>
      </div>
    </div>
  )
}
