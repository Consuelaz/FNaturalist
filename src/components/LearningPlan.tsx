'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from './LanguageContext'
import { Species, LearningDay, VocabWord, QACard, MindmapNode } from '@/types'
import { ChevronDown, ChevronUp, Check, Download, Share2, BookOpen, Lightbulb } from 'lucide-react'

interface LearningPlanProps {
  species: Species
}

interface LearningPlanData {
  speciesId: string
  speciesName: string
  days: LearningDay[]
  vocabulary: VocabWord[]
  qaCards: QACard[]
  mindMap: MindmapNode | null
}

export default function LearningPlan({ species }: LearningPlanProps) {
  const { lang, t } = useLanguage()
  const [isExpanded, setIsExpanded] = useState(false)
  const [completedDays, setCompletedDays] = useState<number[]>([])
  const [plan, setPlan] = useState<LearningPlanData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isExpanded && !plan) {
      loadPlan()
    }
  }, [isExpanded])

  const loadPlan = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        speciesId: species.id,
        name: species.name,
        chineseName: species.chineseName || '',
        latinName: species.latinName || '',
        category: species.category,
        lang: lang,
        ...(species.description && { description: species.description }),
        ...(species.appearance && { appearance: species.appearance }),
        ...(species.habitat && { habitat: species.habitat }),
        ...(species.behavior && { behavior: species.behavior })
      })

      const res = await fetch(`/api/learning-plan?${params}`)
      const data = await res.json()
      if (data.success && data.plan) {
        setPlan(data.plan)
      }
    } catch (err) {
      console.error('Failed to load learning plan:', err)
    }
    setLoading(false)
  }

  const toggleDay = (day: number) => {
    setCompletedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const progress = plan ? Math.round((completedDays.length / plan.days.length) * 100) : 0
  const speciesName = lang === 'zh' ? species.chineseName : species.name

  return (
    <div className="card bg-gradient-to-br from-sage-50 to-amber-50/30">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
            <span className="text-2xl">📚</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-sage-800 font-chinese-title">
              {t('result.learning')}
            </h3>
            <p className="text-sm text-sage-500">
              7-Day English Immersion Plan
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isExpanded && plan && (
            <div className="flex items-center gap-2">
              <div className="w-20 h-2 bg-sage-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm text-sage-500">{progress}%</span>
            </div>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-sage-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-sage-400" />
          )}
        </div>
      </button>

      {/* Loading */}
      {isExpanded && loading && (
        <div className="mt-6 flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-3 border-amber-400 border-t-transparent rounded-full" />
          <span className="ml-3 text-sm text-sage-500">
            {lang === 'zh' ? '正在生成学习计划...' : 'Generating learning plan...'}
          </span>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && !loading && plan && (
        <div className="mt-6 space-y-6">
          {/* Vocabulary Cards */}
          {plan.vocabulary && plan.vocabulary.length > 0 && (
            <div className="bg-white/60 rounded-2xl p-4">
              <h4 className="text-sm font-medium text-sage-600 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {lang === 'zh' ? '核心词汇' : 'Core Vocabulary'}
                <span className="text-xs text-sage-400 font-normal">
                  ({plan.vocabulary.length} {lang === 'zh' ? '个单词' : 'words'})
                </span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {plan.vocabulary.map((word, index) => (
                  <div
                    key={index}
                    className="px-3 py-1.5 bg-sage-100 hover:bg-sage-200 rounded-xl transition-colors cursor-default group relative"
                  >
                    <span className="font-medium text-sage-700">{word.word}</span>
                    {word.pronunciation && (
                      <span className="text-xs text-sage-400 ml-1">{word.pronunciation}</span>
                    )}
                    {word.meaning && (
                      <span className="text-xs text-sage-500 ml-1">— {word.meaning}</span>
                    )}
                    {/* Tooltip with example */}
                    {word.example && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-sage-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        {word.example}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Schedule */}
          <div className="space-y-3">
            {plan.days.map((day) => (
              <div
                key={day.day}
                className={`bg-white/60 rounded-2xl p-4 transition-all ${
                  completedDays.includes(day.day) ? 'ring-2 ring-green-300 bg-green-50/50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleDay(day.day)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      completedDays.includes(day.day)
                        ? 'bg-green-500 text-white'
                        : 'bg-sage-200 text-sage-600 hover:bg-sage-300'
                    }`}
                  >
                    {completedDays.includes(day.day) ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span className="text-sm font-medium">{day.day}</span>
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-sage-700">
                        {day.title}
                      </span>
                      <span className="text-xs text-sage-400">
                        {day.titleEn}
                      </span>
                      {day.theme && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          {day.theme}
                        </span>
                      )}
                    </div>

                    {/* Activities */}
                    {day.activities && day.activities.length > 0 && (
                      <ul className="space-y-1 mt-1">
                        {day.activities.map((activity, idx) => (
                          <li key={idx} className="text-sm text-sage-600 flex items-start gap-1.5">
                            <span className="text-sage-300 mt-1">•</span>
                            <span>{activity}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Sentence Patterns */}
                    {day.sentencePatterns && day.sentencePatterns.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {day.sentencePatterns.map((pattern, idx) => (
                          <span key={idx} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                            {pattern}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Resources */}
                    {day.resources && day.resources.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-sage-400 mb-1">
                          {lang === 'zh' ? '参考资源：' : 'Resources:'}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {day.resources.map((res, idx) => (
                            <span key={idx} className="text-xs text-sage-500 bg-sage-50 px-2 py-0.5 rounded">
                              📎 {res}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Q&A Section */}
          {plan.qaCards && plan.qaCards.length > 0 && (
            <div className="bg-white/60 rounded-2xl p-4">
              <h4 className="text-sm font-medium text-sage-600 mb-3 flex items-center gap-2">
                <span className="text-lg">❓</span>
                {lang === 'zh' ? '亲子问答卡' : 'Q&A Cards'}
              </h4>
              <div className="space-y-2">
                {plan.qaCards.map((qa, index) => (
                  <details key={index} className="bg-sage-50 rounded-xl p-3 cursor-pointer">
                    <summary className="text-sm text-sage-700 font-medium">
                      Q{index + 1}: {qa.question}
                    </summary>
                    {qa.answer && (
                      <p className="text-sm text-sage-600 mt-2 pl-4 border-l-2 border-sage-300">
                        A: {qa.answer}
                      </p>
                    )}
                    {qa.hint && (
                      <p className="text-xs text-sage-400 mt-1 pl-4">
                        💡 {qa.hint}
                      </p>
                    )}
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* Mind Map */}
          {plan.mindMap && (
            <div className="bg-white/60 rounded-2xl p-4">
              <h4 className="text-sm font-medium text-sage-600 mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                {lang === 'zh' ? '思维导图' : 'Mind Map'}
              </h4>
              <MindMapView node={plan.mindMap} lang={lang} />
            </div>
          )}
        </div>
      )}

      {/* Empty state when no plan and not loading */}
      {isExpanded && !loading && !plan && (
        <div className="mt-6 text-center py-6">
          <p className="text-sm text-sage-500">
            {lang === 'zh' ? '暂无学习计划，请重试' : 'No learning plan available. Please try again.'}
          </p>
          <button
            onClick={loadPlan}
            className="mt-3 btn-secondary text-sm"
          >
            {lang === 'zh' ? '重新生成' : 'Regenerate'}
          </button>
        </div>
      )}
    </div>
  )
}

// Simple mind map visualization
function MindMapView({ node, lang }: { node: MindmapNode; lang: string }) {
  if (!node) return null

  return (
    <div className="text-center">
      {/* Center node */}
      <div className="inline-block px-4 py-2 bg-amber-100 text-amber-800 rounded-2xl font-semibold text-sm mb-4">
        {node.text}
      </div>

      {/* Children */}
      {node.children && node.children.length > 0 && (
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {node.children.map((child, idx) => (
            <div key={idx} className="bg-sage-100 rounded-xl p-3 text-center">
              <p className="text-sm font-medium text-sage-700">{child.text}</p>
              {child.children && child.children.length > 0 && (
                <div className="mt-2 space-y-1">
                  {child.children.map((grandchild, gIdx) => (
                    <p key={gIdx} className="text-xs text-sage-500">{grandchild.text}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
