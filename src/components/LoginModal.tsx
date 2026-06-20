import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LoginModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const navigate = useNavigate()

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">로그인</div>
        <div className="modal-sub">KONDA 계정으로 로그인하세요</div>

        <div className="form-group">
          <label>이메일</label>
          <input className="form-input" type="email" placeholder="이메일 입력" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label>비밀번호</label>
          <input className="form-input" type="password" placeholder="비밀번호 입력" value={pw} onChange={e => setPw(e.target.value)} />
        </div>
        <button className="btn btn-black btn-full btn-lg" style={{ marginTop: 8 }} onClick={onClose}>
          로그인
        </button>
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
          계정이 없으신가요?{' '}
          <a onClick={() => { onClose(); navigate('/signup') }} style={{ color: 'var(--black)', fontWeight: 700, cursor: 'pointer' }}>
            회원가입
          </a>
        </div>
      </div>
    </div>
  )
}
