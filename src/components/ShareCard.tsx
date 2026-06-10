'use client'

import { useState, useRef, useEffect } from 'react'
import { useLanguage } from './LanguageContext'
import { getShareStats } from '@/lib/journal-storage'
import { toPng } from 'html-to-image'
import { Download, X, Loader2, Share2 } from 'lucide-react'

interface ShareCardProps {
  trigger?: React.ReactNode
}

const categoryIcons: Record<string, string> = {
  insect: '🐛',
  plant: '🌿',
  animal: '🦊',
  marine: '🐠',
  fungus: '🍄'
}

export default function ShareCard({ trigger }: ShareCardProps) {
  const { lang } = useLanguage()
  const [stats, setStats] = useState<any>(null)
  const [generating, setGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState('')

  useEffect(() => {
    if (showPreview) {
      loadStats()
      // Generate local QR code
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://fieldnaturalist.fun'
      setQrCodeUrl(`/api/qrcode?url=${encodeURIComponent(baseUrl)}&size=160`)
    }
  }, [showPreview])

  const loadStats = async () => {
    const s = await getShareStats()
    setStats(s)
  }

  const handleGenerate = async () => {
    if (!cardRef.current) return
    setGenerating(true)
    try {
      const dataUrl = await toPng(cardRef.current, {
        backgroundColor: '#f0fdf4',
        pixelRatio: 2,
        cacheBust: true,
        width: 750,
        height: cardRef.current.scrollHeight * 2
      })

      // Download
      const link = document.createElement('a')
      link.download = `naturalist-share-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Failed to generate share image:', err)
    }
    setGenerating(false)
  }

  const handleShare = async () => {
    if (!cardRef.current) return
    try {
      const dataUrl = await toPng(cardRef.current, {
        backgroundColor: '#f0fdf4',
        pixelRatio: 2
      })
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], 'naturalist-share.png', { type: 'image/png' })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: lang === 'zh' ? '自然笔记 · 我的探索之旅' : 'Naturalist · My Nature Journey',
          files: [file]
        })
      } else {
        // Fallback: download
        handleGenerate()
      }
    } catch (err) {
      console.error('Share failed:', err)
      handleGenerate()
    }
  }

  return (
    <>
      {/* Trigger */}
      {trigger ? (
        <div onClick={() => setShowPreview(true)}>{trigger}</div>
      ) : (
        <button
          onClick={() => setShowPreview(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105 text-sm font-medium"
        >
          <Share2 className="w-4 h-4" />
          {lang === 'zh' ? '分享海报' : 'Share Card'}
        </button>
      )}

      {/* Preview Modal */}
      {showPreview && stats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-3xl max-w-sm w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <div className="sticky top-0 z-10 flex justify-between items-center p-4 bg-white/90 backdrop-blur-sm rounded-t-3xl border-b border-sage-100">
              <h3 className="font-semibold text-sage-800">
                {lang === 'zh' ? '分享海报' : 'Share Card'}
              </h3>
              <button onClick={() => setShowPreview(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-sage-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Share Card (rendered for capture) */}
            <div className="p-5 bg-gradient-to-b from-green-50 to-emerald-50/50">
              <div ref={cardRef} className="bg-gradient-to-b from-green-50 to-white rounded-3xl overflow-hidden" style={{ width: '100%' }}>
                {/* Header */}
                <div className="relative text-center py-8 px-6" style={{ background: 'linear-gradient(135deg, #1a3a2a 0%, #2d5a3e 100%)' }}>
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-3xl">🌿</span>
                  </div>
                  <h2 className="text-xl font-bold text-white font-chinese-title">
                    {lang === 'zh' ? '自然笔记' : 'Naturalist'}
                  </h2>
                  <p className="text-sm text-white/80 mt-1">
                    {lang === 'zh' ? 'AI 物种识别 · 亲子英语启蒙' : 'AI Species ID · Kids English Learning'}
                  </p>
                </div>

                {/* Stats */}
                <div className="px-6 -mt-4 relative z-10">
                  <div className="bg-white rounded-2xl shadow-lg p-5">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-3xl font-bold text-green-700">{stats.uniqueSpecies}</p>
                        <p className="text-xs text-green-500 mt-1">
                          {lang === 'zh' ? '种物种' : 'Species'}
                        </p>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-amber-600">{stats.totalDiscoveries}</p>
                        <p className="text-xs text-amber-500 mt-1">
                          {lang === 'zh' ? '次探索' : 'Explorations'}
                        </p>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-blue-600">{stats.streakDays}</p>
                        <p className="text-xs text-blue-500 mt-1">
                          {lang === 'zh' ? '天连续' : 'Day Streak'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Species */}
                {stats.recentSpecies && stats.recentSpecies.length > 0 && (
                  <div className="px-6 mt-4">
                    <div className="bg-white rounded-2xl shadow-sm p-4">
                      <h4 className="text-sm font-semibold text-sage-700 mb-3">
                        {lang === 'zh' ? '🌱 最近发现' : '🌱 Recent Finds'}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {stats.recentSpecies.map((s: any, i: number) => (
                          <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-sage-50 rounded-xl">
                            <span>{categoryIcons[s.category] || '🌱'}</span>
                            <span className="text-xs font-medium text-sage-700">
                              {lang === 'zh' ? s.chineseName : s.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* QR Code + CTA */}
                <div className="px-6 mt-4 mb-6">
                  <div className="bg-gradient-to-r from-green-700 to-emerald-700 rounded-2xl p-5 text-white text-center">
                    <p className="text-sm font-medium mb-2">
                      {lang === 'zh' ? '📱 扫码开始你的自然探索' : '📱 Scan to start exploring nature'}
                    </p>
                    {qrCodeUrl && (
                      <div className="mx-auto w-24 h-24 bg-white rounded-xl flex items-center justify-center p-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={qrCodeUrl}
                          alt="QR Code"
                          className="w-full h-full rounded-lg"
                        />
                      </div>
                    )}
                    <p className="text-xs mt-2 opacity-70">
                      {typeof window !== 'undefined' ? window.location.origin : 'naturalist.example.com'}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center pb-4">
                  <p className="text-xs text-sage-400">
                    {lang === 'zh' ? '自然笔记 — 让每次户外探索都成为学习之旅' : 'Naturalist — Every outdoor adventure is a learning journey'}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 flex gap-3 border-t border-sage-100">
              <button
                onClick={handleShare}
                disabled={generating}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-colors font-medium text-sm"
              >
                <Share2 className="w-4 h-4" />
                {lang === 'zh' ? '分享' : 'Share'}
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-sage-100 text-sage-700 rounded-2xl hover:bg-sage-200 transition-colors font-medium text-sm"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {lang === 'zh' ? '保存图片' : 'Save Image'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Helper: Download function
function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
