'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from './LanguageContext'
import { BookOpen, Quote, ExternalLink, Sparkles, Search } from 'lucide-react'

interface CulturalLink {
  title: string
  url: string
  type: 'poem' | 'legend' | 'culture' | 'wiki'
}

interface StoryContent {
  title: string
  content: string
  quote?: string
  quoteAuthor?: string
  source?: string
  culturalLinks?: CulturalLink[]
}

interface HumanitiesSectionProps {
  speciesId: string
  speciesName: string
  chineseName?: string
  latinName?: string
  category?: string
}

const linkTypeLabels = {
  zh: {
    poem: '诗词',
    legend: '传说',
    culture: '文化',
    wiki: '百科'
  },
  en: {
    poem: 'Poetry',
    legend: 'Legend',
    culture: 'Culture',
    wiki: 'Wiki'
  }
}

const linkTypeColors = {
  poem: 'bg-purple-50 text-purple-600 border-purple-200',
  legend: 'bg-amber-50 text-amber-600 border-amber-200',
  culture: 'bg-rose-50 text-rose-600 border-rose-200',
  wiki: 'bg-blue-50 text-blue-600 border-blue-200'
}

export default function HumanitiesSection({
  speciesId,
  speciesName,
  chineseName,
  latinName,
  category
}: HumanitiesSectionProps) {
  const { lang, t } = useLanguage()
  const [story, setStory] = useState<StoryContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchHumanities() {
      setLoading(true)
      setError(false)

      try {
        const params = new URLSearchParams({
          name: speciesName,
          lang
        })
        if (chineseName) params.set('chineseName', chineseName)
        if (latinName) params.set('latinName', latinName)

        const response = await fetch(`/api/humanities?${params.toString()}`)

        if (!response.ok) {
          throw new Error('Failed to fetch humanities')
        }

        const data = await response.json()

        if (data.success && data.humanities) {
          setStory(data.humanities)
        } else {
          setError(true)
        }
      } catch (e) {
        console.error('Failed to fetch humanities:', e)
        setError(true)
      }

      setLoading(false)
    }

    if (speciesName) {
      fetchHumanities()
    }
  }, [speciesName, chineseName, latinName, lang])

  // Loading skeleton
  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-amber-100 rounded" />
          <div className="h-6 bg-amber-100 rounded w-24" />
        </div>
        <div className="h-5 bg-amber-50 rounded w-1/2 mb-4" />
        <div className="space-y-2">
          <div className="h-4 bg-sage-100 rounded" />
          <div className="h-4 bg-sage-100 rounded w-5/6" />
          <div className="h-4 bg-sage-100 rounded w-4/6" />
        </div>
        <div className="mt-4 h-4 bg-amber-50 rounded w-3/4" />
      </div>
    )
  }

  // Error state with search prompt
  if (error || !story) {
    const displayName = lang === 'zh' ? (chineseName || speciesName) : speciesName
    return (
      <div className="card bg-gradient-to-br from-amber-50/30 to-sage-50/30">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-semibold text-sage-800">
            {t('result.humanities')}
          </h3>
        </div>
        <p className="text-sage-500 text-sm mb-4">
          {lang === 'zh'
            ? `暂时没有找到${displayName}的人文故事，试试搜索更多内容吧！`
            : `No cultural stories found for ${displayName}. Try searching for more!`}
        </p>
        <div className="flex flex-wrap gap-2">
          {chineseName && (
            <a
              href={`https://search.bilibili.com/all?keyword=${encodeURIComponent(chineseName + ' 诗词 典故')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs rounded-full border border-amber-200 transition-colors"
            >
              <Search className="w-3 h-3" />
              {chineseName} 诗词典故
            </a>
          )}
          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(speciesName + ' culture folklore')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs rounded-full border border-rose-200 transition-colors"
          >
            <Search className="w-3 h-3" />
            {speciesName} culture & folklore
          </a>
          {latinName && (
            <a
              href={`https://en.wikipedia.org/wiki/${encodeURIComponent(latinName)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs rounded-full border border-blue-200 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Wikipedia
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="card bg-gradient-to-br from-amber-50/50 to-sage-50/50">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold text-sage-800 font-chinese-title">
          {t('result.humanities')}
        </h3>
      </div>

      {/* Story Title */}
      <h4 className="text-xl font-medium text-sage-700 mb-4 leading-snug">
        {story.title}
      </h4>

      {/* Story Content */}
      <div className="prose prose-sage max-w-none mb-6">
        {story.content.split('\n\n').map((paragraph, index) => (
          <p key={index} className="text-sage-600 leading-relaxed mb-3 text-[15px]">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Quote Block */}
      {story.quote && (
        <div className="relative pl-6 border-l-4 border-amber-300 mb-4">
          <Quote className="absolute -left-3 top-0 w-5 h-5 text-amber-300" />
          <p className="text-lg italic text-sage-500 leading-relaxed">
            &ldquo;{story.quote}&rdquo;
          </p>
          {story.quoteAuthor && (
            <p className="text-sm text-sage-400 mt-1">
              — {story.quoteAuthor}
            </p>
          )}
        </div>
      )}

      {/* Source */}
      {story.source && (
        <p className="text-xs text-sage-400 mb-4">
          {lang === 'zh' ? '出处' : 'Source'}: {story.source}
        </p>
      )}

      {/* Cultural Links */}
      {story.culturalLinks && story.culturalLinks.length > 0 && (
        <div className="pt-4 border-t border-sage-100">
          <p className="text-xs text-sage-500 mb-3">
            {lang === 'zh' ? '深入探索' : 'Explore further'}
          </p>
          <div className="flex flex-wrap gap-2">
            {story.culturalLinks.map((link, index) => {
              const typeLabel = linkTypeLabels[lang]?.[link.type] || link.type
              const typeColor = linkTypeColors[link.type] || 'bg-sage-50 text-sage-600 border-sage-200'

              return (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-colors hover:opacity-80 ${typeColor}`}
                >
                  {link.type === 'wiki' ? (
                    <ExternalLink className="w-3 h-3" />
                  ) : (
                    <Search className="w-3 h-3" />
                  )}
                  <span>{link.title}</span>
                  <span className="opacity-60">·</span>
                  <span className="opacity-70">{typeLabel}</span>
                </a>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
