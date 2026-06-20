import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'

type SignupStep = 'email' | 'verify' | 'password' | 'done'

const TERMS = [
  { title: 'Card Usage Agreement', required: true },
  { title: 'Consent to Personal Data Collection & Third-Party Provision', required: true },
  { title: 'Consent to Personal Data Collection & Third-Party Provision', required: true },
]

export default function Signup() {
  const navigate = useNavigate()
  const { t } = useLang()
  const [step, setStep] = useState<SignupStep>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [agreed, setAgreed] = useState([false, false, false])

  const agreeAll = agreed.every(Boolean)
  const toggleAll = () => { const v = !agreeAll; setAgreed([v, v, v]) }
  const toggleTerm = (i: number) => setAgreed(prev => prev.map((v, idx) => idx === i ? !v : v))

  return (
    <div className="auth-page">
      <button className="auth-back-btn" onClick={() => navigate(-1)}>‹</button>
      <div className="auth-right">

        {step === 'email' && (
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
            <button className="btn btn-black btn-full btn-lg" style={{ marginTop: 24 }} disabled={!email || !agreeAll} onClick={() => setStep('verify')}>
              Create your account
            </button>
          </>
        )}

        {step === 'verify' && (
          <>
            <div className="auth-title">{t.signupEmailVerifyTitle}</div>
            <div className="auth-sub">{email}{t.signupVerifySub}</div>
            <div className="form-group">
              <label>{t.signupCodeLabel}</label>
              <input className="form-input" placeholder="000000" maxLength={6} value={code} onChange={e => setCode(e.target.value)} style={{ letterSpacing: 8, textAlign: 'center', fontSize: 22 }} />
            </div>
            <button className="btn btn-black btn-full btn-lg" disabled={code.length < 6} onClick={() => setStep('password')}>
              {t.signupVerifyBtn}
            </button>
            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
              {t.signupNoCode}{' '}
              <a href="#" style={{ color: 'var(--black)', fontWeight: 700 }}>{t.signupResend}</a>
            </div>
          </>
        )}

        {step === 'password' && (
          <>
            <div className="auth-title">{t.signupPasswordTitle}</div>
            <div className="auth-sub">{t.signupPasswordSub}</div>
            <div className="form-group">
              <label>{t.signupPasswordLabel}</label>
              <input className="form-input" type="password" placeholder={t.signupPasswordPlaceholder} value={pw} onChange={e => setPw(e.target.value)} />
            </div>
            <div className="form-group">
              <label>{t.signupPasswordConfirmLabel}</label>
              <input className="form-input" type="password" placeholder={t.signupPasswordConfirmPlaceholder} value={pw2} onChange={e => setPw2(e.target.value)} />
            </div>
            {pw2 && pw !== pw2 && (
              <div style={{ fontSize: 13, color: '#E02020', marginBottom: 12 }}>{t.signupPasswordMismatch}</div>
            )}
            <button className="btn btn-black btn-full btn-lg" disabled={!pw || pw !== pw2} onClick={() => setStep('done')}>
              {t.signupCompleteBtn}
            </button>
          </>
        )}

        {step === 'done' && (
          <>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 72, marginBottom: 24 }}>🎉</div>
              <div className="auth-title">{t.signupDoneTitle}</div>
              <div className="auth-sub" style={{ marginTop: 8 }}>{t.signupDoneSub}</div>
            </div>
            <button className="btn btn-yellow btn-full btn-lg" onClick={() => navigate('/')}>
              {t.signupGoHome}
            </button>
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
