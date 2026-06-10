'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/components/LanguageContext'
import { JournalRecord } from '@/types'
import { getJournalRecords, deleteJournalRecord, getJournalStats } from '@/lib/journal-storage'
import { BookOpen, Calendar, MapPin, Leaf, Trash2, Award, Eye } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import ShareCard from '@/components/ShareCard'
import { useRouter } from 'next/navigation'

export default function JournalPage() {
  const { lang, t } = useLanguage()
  const router = useRouter()
  const [records, setRecords] = useState<JournalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalDiscoveries: 0,
    uniqueSpecies: 0,
    categories: 0,
    badges: 0,
    completedLearning: 0,
    streakDays: 0
  })

  const loadRecords = async () => {
    try {
      const data = await getJournalRecords()
      setRecords(data)
      const s = await getJournalStats()
      setStats(s)
    } catch (e) {
      console.error('Failed to load journal:', e)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadRecords()
  }, [])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(lang === 'zh' ? '确认删除这条记录？' : 'Delete this record?')) return
    await deleteJournalRecord(id)
    loadRecords()
  }

  const handleViewSpecies = (record: JournalRecord) => {
    // Store species data in sessionStorage and navigate to species detail page
    const dataKey = `species_data_${Date.now()}`
    const imageKey = `species_image_${Date.now()}`

    sessionStorage.setItem(dataKey, JSON.stringify({
      success: true,
      species: record.species
    }))

    if (record.imageUrl || record.thumbnailUrl) {
      sessionStorage.setItem(imageKey, record.thumbnailUrl || record.imageUrl)
    }

    const params = new URLSearchParams({ dataKey })
    if (record.imageUrl || record.thumbnailUrl) {
      params.set('imageKey', imageKey)
    }

    router.push(`/species?${params}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-sage-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-sage-800 font-chinese-title mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-sage-500" />
            {t('journal.title')}
          </h1>
          <p className="text-sage-600">
            {records.length > 0
              ? lang === 'zh'
                ? `共 ${records.length} 条记录 · ${stats.uniqueSpecies} 个物种 · ${stats.streakDays} 天连续探索`
                : `${records.length} records · ${stats.uniqueSpecies} species · ${stats.streakDays} day streak`
              : lang === 'zh'
              ? '记录你的每一次自然发现'
              : 'Record your nature discoveries'}
          </p>
        </div>
        {records.length > 0 && (
          <ShareCard />
        )}
      </div>

      {/* Empty State */}
      {records.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-20 h-20 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Leaf className="w-10 h-10 text-sage-400" />
          </div>
          <h2 className="text-xl font-semibold text-sage-700 mb-2">
            {t('journal.empty')}
          </h2>
          <p className="text-sage-500 mb-6">
            {lang === 'zh'
              ? '开始你的第一次自然探索吧'
              : 'Start your first nature exploration'}
          </p>
          <Link href="/" className="btn-primary inline-flex items-center gap-2">
            <Leaf className="w-4 h-4" />
            {lang === 'zh' ? '开始识别' : 'Start Identifying'}
          </Link>
        </div>
      ) : (
        <>
          {/* Records Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {records.map((record) => (
              <div
                key={record.id}
                onClick={() => handleViewSpecies(record)}
                className="card card-hover relative group cursor-pointer"
              >
                {/* Delete Button */}
                <button
                  onClick={(e) => handleDelete(record.id, e)}
                  className="absolute top-3 right-10 z-10 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500"
                  title={lang === 'zh' ? '删除记录' : 'Delete'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* View Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleViewSpecies(record) }}
                  className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-green-50 hover:text-green-600"
                  title={lang === 'zh' ? '查看详情' : 'View Details'}
                >
                  <Eye className="w-4 h-4" />
                </button>

                {/* Image */}
                <div className="aspect-square rounded-2xl overflow-hidden bg-sage-50 mb-4">
                  {record.thumbnailUrl || record.imageUrl ? (
                    <img
                      src={record.thumbnailUrl || record.imageUrl}
                      alt={record.species.chineseName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Leaf className="w-12 h-12 text-sage-200" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div>
                  <h3 className="font-semibold text-sage-800 mb-1">
                    {lang === 'zh' ? record.species.chineseName : record.species.name}
                  </h3>
                  {record.species.latinName && (
                    <p className="text-sm text-sage-400 italic mb-2">
                      {record.species.latinName}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-sage-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(record.timestamp, 'MM/dd', {
                        locale: lang === 'zh' ? zhCN : enUS
                      })}
                    </span>
                    {record.location?.name && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {record.location.name}
                      </span>
                    )}
                    {record.badges?.includes('first') && (
                      <span className="flex items-center gap-1 text-amber-500">
                        <Award className="w-3 h-3" />
                        {lang === 'zh' ? '首次' : 'First'}
                      </span>
                    )}
                  </div>

                  {/* Click Hint */}
                  <div className="mt-3 pt-3 border-t border-sage-100 flex items-center justify-between">
                    <span className="text-xs text-sage-400">
                      {lang === 'zh' ? '点击查看详情' : 'Tap to view'}
                    </span>
                    <Eye className="w-3.5 h-3.5 text-sage-300 group-hover:text-sage-500 transition-colors" />
                  </div>

                  {/* Learning Progress */}
                  {record.learningProgress && record.learningProgress.length > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-sage-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400"
                            style={{
                              width: `${(record.learningProgress.filter(Boolean).length / record.learningProgress.length) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-xs text-sage-400">
                          {record.learningProgress.filter(Boolean).length}/{record.learningProgress.length}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Stats Section */}
          <div className="mt-12 card bg-gradient-to-r from-sage-50 to-amber-50">
            <h3 className="font-semibold text-sage-700 mb-4">
              {lang === 'zh' ? '📊 探索统计' : '📊 Exploration Stats'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white/50 rounded-2xl">
                <p className="text-3xl font-bold text-sage-600">{stats.totalDiscoveries}</p>
                <p className="text-sm text-sage-500">
                  {lang === 'zh' ? '发现次数' : 'Discoveries'}
                </p>
              </div>
              <div className="text-center p-4 bg-white/50 rounded-2xl">
                <p className="text-3xl font-bold text-sage-600">{stats.uniqueSpecies}</p>
                <p className="text-sm text-sage-500">
                  {lang === 'zh' ? '物种数' : 'Species'}
                </p>
              </div>
              <div className="text-center p-4 bg-white/50 rounded-2xl">
                <p className="text-3xl font-bold text-amber-500">{stats.badges}</p>
                <p className="text-sm text-sage-500">
                  {lang === 'zh' ? '获得徽章' : 'Badges'}
                </p>
              </div>
              <div className="text-center p-4 bg-white/50 rounded-2xl">
                <p className="text-3xl font-bold text-green-500">{stats.streakDays}</p>
                <p className="text-sm text-sage-500">
                  {lang === 'zh' ? '连续天数' : 'Streak'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
