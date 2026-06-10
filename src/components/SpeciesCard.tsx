'use client'

import { Species } from '@/types'
import { useLanguage } from './LanguageContext'
import {
  Award, Leaf, Bug, Flower, Fish, Sprout,
  BookOpen, Eye, TreePine, Footprints, Globe, Heart, ExternalLink
} from 'lucide-react'

interface SpeciesCardProps {
  species: Species
}

const categoryIcons = {
  insect: Bug,
  plant: Flower,
  animal: Leaf,
  marine: Fish,
  fungus: Sprout
}

const categoryLabels = {
  zh: {
    insect: '昆虫',
    plant: '植物',
    animal: '动物',
    marine: '海洋生物',
    fungus: '真菌'
  },
  en: {
    insect: 'Insect',
    plant: 'Plant',
    animal: 'Animal',
    marine: 'Marine',
    fungus: 'Fungus'
  }
}

const classificationLabels: Record<string, Record<string, string>> = {
  zh: {
    kingdom: '界',
    phylum: '门',
    class: '纲',
    order: '目',
    family: '科',
    genus: '属',
    species: '种'
  },
  en: {
    kingdom: 'Kingdom',
    phylum: 'Phylum',
    class: 'Class',
    order: 'Order',
    family: 'Family',
    genus: 'Genus',
    species: 'Species'
  }
}

// Section definitions with icons and labels
const encyclopediaSections = [
  {
    key: 'nameOrigin' as const,
    icon: BookOpen,
    labels: { zh: '名字由来', en: 'Name Origin' },
    color: 'text-amber-600 bg-amber-50'
  },
  {
    key: 'appearance' as const,
    icon: Eye,
    labels: { zh: '外形特征', en: 'Appearance' },
    color: 'text-purple-600 bg-purple-50'
  },
  {
    key: 'habitat' as const,
    icon: TreePine,
    labels: { zh: '栖息环境', en: 'Habitat' },
    color: 'text-green-600 bg-green-50'
  },
  {
    key: 'behavior' as const,
    icon: Footprints,
    labels: { zh: '生活习性', en: 'Behavior' },
    color: 'text-blue-600 bg-blue-50'
  },
  {
    key: 'distribution' as const,
    icon: Globe,
    labels: { zh: '分布范围', en: 'Distribution' },
    color: 'text-teal-600 bg-teal-50'
  },
  {
    key: 'reproduction' as const,
    icon: Heart,
    labels: { zh: '繁殖方式', en: 'Reproduction' },
    color: 'text-rose-600 bg-rose-50'
  }
]

export default function SpeciesCard({ species }: SpeciesCardProps) {
  const { lang, t } = useLanguage()
  const CategoryIcon = categoryIcons[species.category] || Leaf
  const categoryLabel = categoryLabels[lang][species.category]

  // Calculate confidence percentage
  const confidencePercent = Math.round((species.confidence || 0.8) * 100)

  // Check if there are any encyclopedia sections with data
  const hasEncyclopediaData = encyclopediaSections.some(
    section => (species as any)[section.key]
  )

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-sage-100 rounded-2xl flex items-center justify-center">
            <CategoryIcon className="w-8 h-8 text-sage-600" />
          </div>
          <div>
            <span className="inline-block px-2 py-0.5 bg-sage-100 text-sage-600 text-xs rounded-full mb-1">
              {categoryLabel}
            </span>
            {/* Bilingual name display */}
            <h1 className="text-2xl font-bold text-sage-800 font-chinese-title">
              {species.chineseName && species.chineseName !== species.name
                ? species.chineseName
                : (lang === 'zh' ? species.chineseName : species.name)}
            </h1>
            {species.chineseName && species.name && species.chineseName !== species.name && (
              <p className="text-base text-sage-500">
                {species.name}
              </p>
            )}
            {species.latinName && (
              <p className="text-sm text-sage-400 italic">
                {species.latinName}
              </p>
            )}
          </div>
        </div>

        {/* Confidence Badge */}
        <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full shrink-0">
          <Award className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium text-amber-700">
            {confidencePercent}%
          </span>
        </div>
      </div>

      {/* Classification */}
      {species.classification && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-sage-600 mb-3">
            {t('result.classification')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(species.classification)
              .filter(([key, value]) => value)
              .map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sage-50 rounded-xl"
                >
                  <span className="text-xs text-sage-400">
                    {classificationLabels[lang]?.[key] || key}
                  </span>
                  <span className="text-sm text-sage-700">
                    {value as string}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Description (brief summary) */}
      {species.description && (
        <div className="mb-6 pb-6 border-b border-sage-100">
          <p className="text-sage-600 leading-relaxed">
            {species.description}
          </p>
        </div>
      )}

      {/* Encyclopedia Sections */}
      {hasEncyclopediaData && (
        <div className="space-y-4">
          {encyclopediaSections.map(section => {
            const content = (species as any)[section.key]
            if (!content) return null

            const IconComponent = section.icon
            const [textColor, bgColor] = section.color.split(' ')

            return (
              <div key={section.key} className="group">
                <div className="flex items-start gap-3">
                  {/* Section icon */}
                  <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center shrink-0 mt-0.5`}>
                    <IconComponent className={`w-4 h-4 ${textColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-sage-700 mb-1">
                      {section.labels[lang]}
                    </h3>
                    <p className="text-sm text-sage-600 leading-relaxed">
                      {content}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Wikipedia Link */}
      {species.wikiUrl && (
        <div className="mt-6 pt-4 border-t border-sage-100">
          <a
            href={species.wikiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-sage-50 hover:bg-sage-100 rounded-xl text-sm text-sage-600 hover:text-sage-800 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            {lang === 'zh' ? '查看 Wikipedia 百科' : 'View on Wikipedia'}
          </a>
        </div>
      )}

      {/* Source indicator */}
      <div className="mt-4 text-xs text-sage-400">
        {lang === 'zh' ? '识别来源' : 'Source'}: {
          species.confidence > 0.9 ? (lang === 'zh' ? '高置信度识别' : 'High confidence') :
          species.confidence > 0.7 ? (lang === 'zh' ? '中置信度识别' : 'Medium confidence') : (lang === 'zh' ? '参考识别' : 'Reference')
        }
      </div>
    </div>
  )
}
