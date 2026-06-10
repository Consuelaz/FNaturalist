'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLanguage } from '@/components/LanguageContext'
import SpeciesCard from '@/components/SpeciesCard'
import ImageGallery from '@/components/ImageGallery'
import VideoSection from '@/components/VideoSection'
import HumanitiesSection from '@/components/HumanitiesSection'
import LearningPlan from '@/components/LearningPlan'
import SpeciesFallback from '@/components/SpeciesFallback'
import { Species } from '@/types'
import { saveJournalRecord } from '@/lib/journal-storage'
import { ArrowLeft, Leaf, Check, Bookmark, Share2 } from 'lucide-react'
import Link from 'next/link'
import ShareCard from '@/components/ShareCard'

function SpeciesPageContent() {
  const searchParams = useSearchParams()
  const { lang, t } = useLanguage()
  const [species, setSpecies] = useState<Species | null>(null)
  const [loading, setLoading] = useState(true)
  const [fallback, setFallback] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [showSaveToast, setShowSaveToast] = useState(false)

  useEffect(() => {
    const dataKey = searchParams.get('dataKey')
    const fallbackParam = searchParams.get('fallback')
    const nameParam = searchParams.get('name')
    const imageKey = searchParams.get('imageKey')

    // Try to load image from sessionStorage
    if (imageKey) {
      const imgData = sessionStorage.getItem(imageKey)
      if (imgData) {
        setImageUrl(imgData)
        sessionStorage.removeItem(imageKey)
      }
    }

    if (fallbackParam === 'true') {
      setFallback(true)
      setLoading(false)
      return
    }

    // Load species data from sessionStorage (avoids URL length issues with large JSON)
    if (dataKey) {
      const storedData = sessionStorage.getItem(dataKey)
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData)
          if (parsed.success && parsed.species) {
            setSpecies(parsed.species)
          }
          sessionStorage.removeItem(dataKey)
        } catch (e) {
          console.error('Failed to parse species data from sessionStorage:', e)
          setFallback(true)
        }
      }
    }
    setLoading(false)
  }, [searchParams])

  const handleSaveToJournal = async () => {
    if (!species) return
    const recordImgUrl = imageUrl || ''
    await saveJournalRecord(species, recordImgUrl)
    setSaved(true)
    setShowSaveToast(true)
    setTimeout(() => setShowSaveToast(false), 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-sage-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (fallback) {
    return <SpeciesFallback name={searchParams.get('name') || ''} imageUrl={imageUrl} />
  }

  if (!species) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <Leaf className="w-16 h-16 text-sage-300 mb-4" />
        <p className="text-sage-500">{lang === 'zh' ? '未找到物种信息' : 'Species not found'}</p>
        <Link href="/" className="btn-primary mt-6">
          <ArrowLeft className="w-4 h-4 inline mr-2" />
          {lang === 'zh' ? '返回首页' : 'Back to Home'}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sage-600 hover:text-sage-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{lang === 'zh' ? '继续探索' : 'Continue Exploring'}</span>
      </Link>

      {/* Species Card */}
      <section className="mb-12">
        <SpeciesCard species={species} />
      </section>

      {/* Image Gallery */}
      <section className="mb-12">
        <h2 className="section-title flex items-center gap-2">
          <span className="text-2xl">📷</span>
          {t('result.images')}
        </h2>
        <ImageGallery
          speciesName={species.name}
          latinName={species.latinName}
          chineseName={species.chineseName}
          category={species.category}
        />
      </section>

      {/* Videos */}
      <section className="mb-12">
        <h2 className="section-title flex items-center gap-2">
          <span className="text-2xl">🎬</span>
          {t('result.videos')}
        </h2>
        <VideoSection
          speciesName={species.name}
          latinName={species.latinName}
          chineseName={species.chineseName}
          lang={lang}
        />
      </section>

      {/* Humanities Section */}
      <section className="mb-12">
        <HumanitiesSection
          speciesId={species.id}
          speciesName={species.name}
          chineseName={species.chineseName}
          latinName={species.latinName}
          category={species.category}
        />
      </section>

      {/* Learning Plan */}
      <section className="mb-12">
        <LearningPlan species={species} />
      </section>

      {/* Save to Journal + Share Buttons */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
        <ShareCard
          trigger={
            <button className="flex items-center gap-2 px-4 py-3 bg-sage-100 text-sage-700 rounded-2xl shadow-lg hover:bg-sage-200 transition-all">
              <Share2 className="w-4 h-4" />
              {lang === 'zh' ? '分享' : 'Share'}
            </button>
          }
        />
        <button
          onClick={handleSaveToJournal}
          disabled={saved}
          className={`flex items-center gap-2 shadow-lg transition-all duration-300 ${
            saved
              ? 'bg-green-500 text-white px-6 py-3 rounded-2xl'
              : 'btn-primary'
          }`}
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              {lang === 'zh' ? '已保存' : 'Saved'}
            </>
          ) : (
            <>
              <Bookmark className="w-4 h-4" />
              {lang === 'zh' ? '保存到打卡本' : 'Save to Journal'}
            </>
          )}
        </button>
      </div>

      {/* Save Success Toast */}
      {showSaveToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-lg animate-bounce">
          {lang === 'zh' ? '🎉 已保存到打卡本！' : '🎉 Saved to journal!'}
        </div>
      )}
    </div>
  )
}

export default function SpeciesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-sage-500 border-t-transparent rounded-full" />
      </div>
    }>
      <SpeciesPageContent />
    </Suspense>
  )
}
