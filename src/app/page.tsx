'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/components/LanguageContext'
import UploadZone from '@/components/UploadZone'
import IdentifyingAnimation from '@/components/IdentifyingAnimation'
import { Upload, Image as ImageIcon, Sparkles } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const { lang, t } = useLanguage()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isIdentifying, setIsIdentifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (file: File) => {
    // Read file as data URL once (for preview AND sessionStorage)
    const readFileAsDataURL = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    }

    setIsIdentifying(true)
    setError(null)

    try {
      // Parallel: read file as data URL + call API
      const [imageData, response] = await Promise.all([
        readFileAsDataURL(file),
        fetch('/api/identify', {
          method: 'POST',
          body: (() => {
            const formData = new FormData()
            formData.append('image', file)
            return formData
          })(),
        })
      ])

      const data = await response.json()

      // Show preview
      setSelectedImage(imageData)

      if (data.success && data.species) {
        // Store image in sessionStorage to avoid URL length issues
        const imageKey = `uploaded_image_${Date.now()}`
        sessionStorage.setItem(imageKey, imageData)

        // Store species data in sessionStorage too (7 encyclopedia sections make JSON too large for URL)
        const dataKey = `species_data_${Date.now()}`
        sessionStorage.setItem(dataKey, JSON.stringify(data))

        // Navigate to result page with keys only (keeps URL short)
        const params = new URLSearchParams({
          dataKey: dataKey,
          imageKey: imageKey
        })
        router.push(`/species?${params}`)
      } else {
        // Low confidence or failure
        const imageKey = `uploaded_image_${Date.now()}`
        sessionStorage.setItem(imageKey, imageData)

        const params = new URLSearchParams({
          fallback: 'true',
          name: data.species?.name || '',
          imageKey: imageKey
        })
        router.push(`/species?${params}`)
      }
    } catch (err) {
      setError(lang === 'zh' ? '识别服务暂时不可用，请稍后重试' : 'Identification service unavailable, please try again')
      setIsIdentifying(false)
    }
  }, [router, lang])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items)
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          handleFileSelect(file)
          break
        }
      }
    }
  }, [handleFileSelect])

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-sage-400 to-sage-600 rounded-3xl mb-6 shadow-lg">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-sage-800 mb-4 font-chinese-title">
            {t('upload.title')}
          </h1>
          <p className="text-lg text-sage-600 max-w-md mx-auto">
            {t('upload.subtitle')}
          </p>
        </div>

        {/* Upload Zone */}
        {isIdentifying ? (
          <div className="card p-12">
            <IdentifyingAnimation />
            <p className="text-center text-sage-600 mt-6">
              {t('identify.title')}
            </p>
            <p className="text-center text-sm text-sage-400 mt-2">
              {t('identify.tip')}
            </p>
          </div>
        ) : selectedImage ? (
          <div className="card p-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden mb-4">
              <img
                src={selectedImage}
                alt="Selected"
                className="w-full h-full object-contain bg-sage-50"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedImage(null)}
                className="btn-secondary flex-1"
              >
                {lang === 'zh' ? '重新选择' : 'Reselect'}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary flex-1"
              >
                <Upload className="w-4 h-4 inline mr-2" />
                {lang === 'zh' ? '上传新图片' : 'Upload New'}
              </button>
            </div>
          </div>
        ) : (
          <div
            onPaste={handlePaste}
            className="card p-8"
          >
            <UploadZone onFileSelect={handleFileSelect} />
            <p className="text-center text-sm text-sage-400 mt-4">
              {t('upload.paste')}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-center">
            {error}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileSelect(file)
          }}
        />

        {/* Tips Section */}
        <div className="mt-12">
          <p className="text-sm text-sage-500 mb-4 text-center">
            {lang === 'zh' ? '💡 识别小贴士' : '💡 Tips for better results'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { emoji: '📸', text: lang === 'zh' ? '对准主体，避免背景杂乱' : 'Focus on subject, avoid clutter' },
              { emoji: '🔍', text: lang === 'zh' ? '近距离拍摄，看清细节特征' : 'Get close for clear detail shots' },
              { emoji: '🌿', text: lang === 'zh' ? '拍叶子/花朵/全身效果最好' : 'Leaves, flowers, full body work best' },
            ].map((tip, i) => (
              <div key={i} className="card p-4 text-center">
                <span className="text-2xl">{tip.emoji}</span>
                <p className="text-sm text-sage-600 mt-2">{tip.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Common Species */}
        <div className="mt-8 text-center">
          <p className="text-sm text-sage-500 mb-4">
            {lang === 'zh' ? '常见可识别物种' : 'Common identifiable species'}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {(lang === 'zh'
              ? ['金斑蝶', '蒲公英', '瓢虫', '赤狐', '荷花', '银杏', '蜜蜂', '蜻蜓']
              : ['Monarch', 'Dandelion', 'Ladybug', 'Red Fox', 'Lotus', 'Ginkgo', 'Honeybee', 'Dragonfly']
            ).map((name) => (
              <span
                key={name}
                className="px-3 py-1.5 bg-sage-100 text-sage-600 rounded-full text-sm hover:bg-sage-200 transition-colors"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
