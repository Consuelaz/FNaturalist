'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from './LanguageContext'
import { Leaf, BookOpen, Info, Globe } from 'lucide-react'

export default function Navigation() {
  const pathname = usePathname()
  const { lang, toggleLanguage, t } = useLanguage()

  const navItems = [
    { href: '/', label: t('nav.home'), icon: Leaf },
    { href: '/journal', label: t('nav.journal'), icon: BookOpen },
    { href: '/about', label: t('nav.about'), icon: Info },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-cream/80 backdrop-blur-md border-b border-sage-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-sage-500 rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-sage-800 font-chinese-title">
              自然笔记
            </span>
          </Link>

          {/* Nav Items */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl transition-colors
                    ${isActive
                      ? 'bg-sage-100 text-sage-700'
                      : 'text-sage-600 hover:bg-sage-50'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                       bg-sage-100 text-sage-700 hover:bg-sage-200 transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium uppercase">{lang}</span>
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden border-t border-sage-100">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center gap-1 px-4 py-2
                  ${isActive ? 'text-sage-700' : 'text-sage-500'}
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
