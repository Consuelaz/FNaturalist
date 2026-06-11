import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { LanguageProvider } from '@/components/LanguageContext'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: '自然笔记 - 徒步博物识别',
  description: '在徒步中识别物种，记录自然之美，开启亲子英语启蒙之旅',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8403146902177842"
          crossorigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-screen bg-cream">
        <LanguageProvider>
          <Navigation />
          <main className="pt-20 pb-12">
            {children}
          </main>
        </LanguageProvider>
      </body>
    </html>
  )
}
