import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'

export default function Home() {
  const navigate = useNavigate()
  const { t } = useLang()

  return (
    <main>
      {/* Hero */}
      <section className="hero-section">
        <div className="wrap hero-inner">
          <div className="hero-img">
            <img src="/hero-character.svg" alt="K-travel" className="hero-char-img" data-edit="히어로이미지" data-edit-type="image" />
          </div>
          <div className="hero-text" data-edit="히어로텍스트" data-edit-type="text">
            <h1>{t.heroTitle.split('\n').map((line, i) => <span key={i}>{line}{i < t.heroTitle.split('\n').length - 1 && <br />}</span>)}</h1>
          </div>
        </div>
      </section>

      {/* Promo bar */}
      <div className="promo-bar-wrap">
        <div className="wrap">
          <div className="promo-bar">
            <div className="promo-bar-texts">
              <div className="promo-title" data-edit="프로모제목" data-edit-type="text">{t.promoTitle}</div>
              <div className="promo-sub" data-edit="프로모부제목" data-edit-type="text">{t.promoSub}</div>
            </div>
            <button className="promo-btn" onClick={() => navigate('/apply')}>{t.promoBtn}</button>
          </div>
        </div>
      </div>

      {/* Cards */}
      <section className="cards-section">
        <div className="wrap">
          <h2 className="section-title" data-edit="카드섹션제목" data-edit-type="text">{t.cardsSectionTitle}</h2>
        </div>
        <div className="cards-fan">
          <div className="fan-card" data-edit="블랙카드" data-edit-type="card" style={{ left: '-2.4%',  transform: 'rotate(6.0deg)', zIndex: 1 }}>
            <img src="/cards/card-black.svg" alt="Black" className="fan-card-img" />
          </div>
          <div className="fan-card" data-edit="화이트카드" data-edit-type="card" style={{ left: '21.9%',  transform: 'rotate(2deg)', zIndex: 2 }}>
            <img src="/cards/card-white.svg" alt="White" className="fan-card-img" />
          </div>
          <div className="fan-card" data-edit="옐로우카드" data-edit-type="card" style={{ left: '40%', transform: 'rotate(0deg)', zIndex: 5 }}>
            <img src="/cards/card-yellow.svg" alt="Yellow" className="fan-card-img" />
          </div>
          <div className="fan-card" data-edit="레드카드" data-edit-type="card" style={{ left: '63%',  transform: 'rotate(0deg)', zIndex: 1 }}>
            <img src="/cards/card-red.svg" alt="Red" className="fan-card-img" />
          </div>
          <div className="fan-card" data-edit="블루카드" data-edit-type="card" style={{ left: '85.1%',  transform: 'rotate(6.0deg)', zIndex: 3 }}>
            <img src="/cards/card-blue.svg" alt="Blue" className="fan-card-img" />
          </div>
        </div>
      </section>

      {/* App */}
      <section className="app-section">
        <div className="wrap app-inner">
          <div className="app-text" data-edit="앱섹션텍스트" data-edit-type="text">
            <h2>{t.appTitle.split('\n').map((line, i) => <span key={i}>{line}{i < t.appTitle.split('\n').length - 1 && <br />}</span>)}</h2>
          </div>
          <div className="app-phones">
            <img src="/app/phones-mockup.png" alt="KONDA App" className="app-mockup-img" data-edit="앱이미지" data-edit-type="image" />
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="reviews-section">
        <div className="wrap">
          <h2 className="reviews-title">{t.reviewsTitle}</h2>
          <div className="reviews-grid">
            <div className="review-card review-card--pink">
              <div className="review-inner">
                <div className="review-card-header">
                  <div className="review-avatar">🐻</div>
                  <div>
                    <div className="review-name">{t.review1Name}</div>
                    <div className="review-date">2025.09.25</div>
                  </div>
                </div>
                <div className="review-text">{t.review1Text}</div>
                <div className="review-likes">❤ 121</div>
              </div>
            </div>
            <div className="review-card review-card--photo" style={{backgroundImage:"url('/app/review-photo-1.svg')"}}>
              <div className="review-inner">
                <div className="review-card-header">
                  <div className="review-avatar">🐯</div>
                  <div>
                    <div className="review-name">{t.review2Name}</div>
                    <div className="review-date">2025.09.25</div>
                  </div>
                </div>
                <div className="review-text">{t.review2Text}</div>
                <div className="review-likes">❤ 121</div>
              </div>
            </div>
            <div className="review-card review-card--blue">
              <div className="review-inner">
                <div className="review-card-header">
                  <div className="review-avatar">🦊</div>
                  <div>
                    <div className="review-name">{t.review3Name}</div>
                    <div className="review-date">2025.09.25</div>
                  </div>
                </div>
                <div className="review-text">{t.review3Text}</div>
                <div className="review-likes">❤ 121</div>
              </div>
            </div>
            <div className="review-card review-card--photo" style={{backgroundImage:"url('/app/review-photo-2.svg')"}}>
              <div className="review-inner">
                <div className="review-card-header">
                  <div className="review-avatar">🐼</div>
                  <div>
                    <div className="review-name">{t.review4Name}</div>
                    <div className="review-date">2025.09.25</div>
                  </div>
                </div>
                <div className="review-text">{t.review4Text}</div>
                <div className="review-likes">❤ 121</div>
              </div>
            </div>
            <div className="review-card" style={{background:'#ffd447'}}>
              <div className="review-inner">
                <div className="review-card-header">
                  <div className="review-avatar">🐨</div>
                  <div>
                    <div className="review-name">{t.review5Name}</div>
                    <div className="review-date">2025.09.25</div>
                  </div>
                </div>
                <div className="review-text">{t.review5Text}</div>
                <div className="review-likes">❤ 121</div>
              </div>
            </div>
            <div className="review-card review-card--photo" style={{backgroundImage:"url('/app/review-photo-3.svg')"}}>
              <div className="review-inner">
                <div className="review-card-header">
                  <div className="review-avatar">🦁</div>
                  <div>
                    <div className="review-name">{t.review6Name}</div>
                    <div className="review-date">2025.09.25</div>
                  </div>
                </div>
                <div className="review-text">{t.review6Text}</div>
                <div className="review-likes">❤ 121</div>
              </div>
            </div>
          </div>
          <div className="reviews-cta-wrap">
            <button className="reviews-cta">
              <img src="/app/btn-stories.png" alt="stories" className="reviews-cta-img" />
            </button>
          </div>
        </div>
      </section>

      {/* Chat Features */}
      <section className="chat-section">
        <div className="wrap">
          <h2 className="chat-section-title">{t.chatTitle}</h2>
          <div className="chat-list">
            <div className="chat-row chat-row--left">
              <div className="chat-bubble">
                <img src="/app/char-bear.svg" alt="bear" className="chat-avatar" />
                <div className="chat-bubble-text">
                  {t.chat1a}<br />
                  <strong>{t.chat1b}</strong>
                </div>
              </div>
            </div>
            <div className="chat-row chat-row--right">
              <div className="chat-bubble">
                <div className="chat-bubble-text">
                  {t.chat2a}<br />
                  <strong>{t.chat2b}</strong>
                </div>
                <img src="/app/char-tiger.svg" alt="tiger" className="chat-avatar" />
              </div>
            </div>
            <div className="chat-row chat-row--left">
              <div className="chat-bubble">
                <img src="/app/char-bear.svg" alt="bear" className="chat-avatar" />
                <div className="chat-bubble-text">
                  <strong>{t.chat3a}</strong><br />
                  {t.chat3b}
                </div>
              </div>
            </div>
            <div className="chat-row chat-row--right">
              <div className="chat-bubble">
                <div className="chat-bubble-text">
                  {t.chat4a}<br />
                  <strong>{t.chat4b}</strong>
                </div>
                <img src="/app/char-tiger.svg" alt="tiger" className="chat-avatar" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="wrap">
          <div className="footer-card">
            <div className="footer-cols">
              <div className="footer-col">
                <h4 data-edit="푸터지원제목" data-edit-type="text">{t.footerSupport}</h4>
                <a href="#" data-edit="푸터도움말" data-edit-type="text">{t.footerHelp}</a>
                <a href="#" data-edit="푸터안전정보" data-edit-type="text">{t.footerSafety}</a>
              </div>
              <div className="footer-col">
                <h4 data-edit="푸터정책제목" data-edit-type="text">{t.footerPolicy}</h4>
                <a href="#" data-edit="푸터이용약관" data-edit-type="text">{t.footerTerms}</a>
                <a href="#" data-edit="푸터개인정보" data-edit-type="text">{t.footerPrivacy}</a>
                <a href="#" data-edit="푸터쿠키" data-edit-type="text">{t.footerCookie}</a>
                <a href="#" data-edit="푸터사이트맵" data-edit-type="text">{t.footerSitemap}</a>
              </div>
            </div>
            <div className="footer-bottom">
              <span data-edit="푸터저작권" data-edit-type="text">© 2025 KONDA. All rights reserved.</span>
              <div className="footer-socials">
                <a href="#" className="social-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.5 6H14c-.552 0-1 .448-1 1v1.5h2.5l-.5 2.5H13V20h-2.5v-7H9V10.5h1.5V9a3 3 0 013-3h2V8z"/></svg>
                </a>
                <a href="#" className="social-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="#" className="social-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.348-.79-.981-1.458-1.845-1.94-.22 1.377-.698 2.552-1.417 3.386-.902 1.04-2.157 1.598-3.637 1.616-1.249-.012-2.294-.44-3.027-1.238-.682-.745-1.036-1.748-1.036-2.903 0-2.506 1.576-4.139 4.005-4.139 1.245 0 2.238.424 2.982 1.266.602.686.985 1.65 1.136 2.76.43.16.838.36 1.215.597.945.595 1.637 1.423 2.005 2.276.91 2.073.64 4.964-1.716 7.258-1.854 1.826-4.153 2.725-7.037 2.745z"/></svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
