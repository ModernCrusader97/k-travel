import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import T, { LANG_LABELS } from './i18n'
import type { Lang, Translations } from './i18n'

type LangCtx = {
  lang: Lang
  t: Translations
  setLang: (l: Lang) => void
  labels: typeof LANG_LABELS
}

const LangContext = createContext<LangCtx>({
  lang: 'ko', t: T.ko, setLang: () => {}, labels: LANG_LABELS,
})

export function LangProvider({ children }: { children: ReactNode }) {
  const saved = (localStorage.getItem('konda_lang') as Lang) || 'ko'
  const [lang, setLangState] = useState<Lang>(saved)

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('konda_lang', l)
  }

  return (
    <LangContext.Provider value={{ lang, t: T[lang], setLang, labels: LANG_LABELS }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() { return useContext(LangContext) }
