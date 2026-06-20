import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../LangContext'

export default function Guide() {
  const navigate = useNavigate()
  const { t } = useLang()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const STEPS = [
    { icon: '🧳', color: '#FFF3CD', title: t.guideStep1Title, desc: t.guideStep1Desc },
    { icon: '🏪', color: '#D4EDDA', title: t.guideStep2Title, desc: t.guideStep2Desc },
    { icon: '🚇', color: '#D1ECF1', title: t.guideStep3Title, desc: t.guideStep3Desc },
  ]

  const FAQS = [
    { q: t.guideFaq1Q, a: t.guideFaq1A },
    { q: t.guideFaq2Q, a: t.guideFaq2A },
    { q: t.guideFaq3Q, a: t.guideFaq3A },
  ]

  return (
    <div className="guide-page">
      <div className="guide-wrap">
        <h1 className="guide-title">{t.guideTitle}</h1>

        <div className="guide-steps">
          {STEPS.map((step, i) => (
            <div className="guide-step" key={i}>
              <div className="guide-step-icon" style={{ background: step.color }}>
                {step.icon}
              </div>
              <div className="guide-step-body">
                <div className="guide-step-num">0{i + 1}</div>
                <div className="guide-step-title">{step.title}</div>
                <div className="guide-step-desc">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn-black btn-lg guide-cta" onClick={() => navigate('/apply')}>
          {t.guideCta}
        </button>

        <section className="guide-faq">
          <h2 className="guide-faq-title">{t.guideFaqTitle}</h2>
          <p className="guide-faq-sub">{t.guideFaqSub}</p>
          <div className="guide-faq-list">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className={`guide-faq-item${openFaq === i ? ' open' : ''}`}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="guide-faq-q">
                  <span>{faq.q}</span>
                  <span className="guide-faq-arrow">{openFaq === i ? '▲' : '▼'}</span>
                </div>
                {openFaq === i && <div className="guide-faq-a">{faq.a}</div>}
              </div>
            ))}
          </div>
        </section>

        <footer className="footer" style={{ margin: '40px -24px -40px', borderRadius: '0 0 0 0' }}>
          <div className="wrap">
            <div className="footer-card">
              <div className="footer-cols">
                <div className="footer-col">
                  <h4>{t.footerSupport}</h4>
                  <a href="#">{t.footerHelp}</a>
                  <a href="#">{t.footerSafety}</a>
                </div>
                <div className="footer-col">
                  <h4>{t.footerPolicy}</h4>
                  <a href="#">{t.footerTerms}</a>
                  <a href="#">{t.footerPrivacy}</a>
                  <a href="#">{t.footerCookie}</a>
                  <a href="#">{t.footerSitemap}</a>
                </div>
              </div>
              <div className="footer-bottom">
                <span>© 2025 KONDA. All rights reserved.</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
