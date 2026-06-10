'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Language = 'zh' | 'en'

interface LanguageContextType {
  lang: Language
  toggleLanguage: () => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const translations: Record<string, Record<Language, string>> = {
  'nav.home': { zh: '首页', en: 'Home' },
  'nav.journal': { zh: '打卡本', en: 'Journal' },
  'nav.about': { zh: '关于', en: 'About' },
  'upload.title': { zh: '上传自然发现', en: 'Share Your Discovery' },
  'upload.subtitle': { zh: '拍摄或上传照片，让 AI 帮你识别物种', en: 'Take or upload a photo to identify species' },
  'upload.drag': { zh: '拖拽图片到这里', en: 'Drag image here' },
  'upload.or': { zh: '或', en: 'or' },
  'upload.browse': { zh: '浏览文件', en: 'Browse Files' },
  'upload.paste': { zh: '也可以直接粘贴图片', en: 'or paste image directly' },
  'identify.title': { zh: '正在辨识自然...', en: 'Identifying...' },
  'identify.tip': { zh: '首次识别可能需要几秒钟', en: 'First identification may take a few seconds' },
  'result.species': { zh: '物种信息', en: 'Species Info' },
  'result.classification': { zh: '分类', en: 'Classification' },
  'result.images': { zh: '图集', en: 'Gallery' },
  'result.videos': { zh: '科普视频', en: 'Educational Videos' },
  'result.lifecycle': { zh: '生长周期', en: 'Life Cycle' },
  'result.humanities': { zh: '趣味人文', en: 'Cultural Stories' },
  'result.learning': { zh: '一周英语启蒙计划', en: '5-Day English Immersion Plan' },
  'journal.title': { zh: '自然打卡本', en: 'Nature Journal' },
  'journal.empty': { zh: '还没有记录，开始你的第一次发现吧', en: 'No records yet. Start your first discovery!' },
  'about.title': { zh: '关于自然笔记', en: 'About Naturalist' },
  'error.low_confidence': { zh: '识别置信度较低', en: 'Low confidence' },
  'error.try_again': { zh: '要不再靠近一点试试？', en: 'Try getting closer!' },
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('zh')

  useEffect(() => {
    const saved = localStorage.getItem('naturalist-lang')
    if (saved === 'zh' || saved === 'en') {
      setLang(saved)
    }
  }, [])

  const toggleLanguage = () => {
    const newLang = lang === 'zh' ? 'en' : 'zh'
    setLang(newLang)
    localStorage.setItem('naturalist-lang', newLang)
  }

  const t = (key: string): string => {
    return translations[key]?.[lang] || key
  }

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
