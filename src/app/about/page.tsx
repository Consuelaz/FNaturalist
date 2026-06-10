'use client'

import { useLanguage } from '@/components/LanguageContext'
import { Leaf, BookOpen, Globe, Heart, Info } from 'lucide-react'

export default function AboutPage() {
  const { lang, t } = useLanguage()

  const features = [
    {
      icon: Leaf,
      title: lang === 'zh' ? '即时物种识别' : 'Instant Species ID',
      description: lang === 'zh'
        ? '拍摄或上传照片，AI 帮你快速识别昆虫、植物、动物等物种'
        : 'Take or upload a photo, AI helps identify insects, plants, animals and more'
    },
    {
      icon: BookOpen,
      title: lang === 'zh' ? '专业科普内容' : 'Professional Knowledge',
      description: lang === 'zh'
        ? '获取分类信息、图集、视频和趣味人文故事'
        : 'Get classification info, photo galleries, videos and cultural stories'
    },
    {
      icon: Globe,
      title: lang === 'zh' ? '双语学习体验' : 'Bilingual Learning',
      description: lang === 'zh'
        ? '一键切换中英文，深入学习自然科学词汇'
        : 'Switch between Chinese and English, learn nature vocabulary deeply'
    },
    {
      icon: Heart,
      title: lang === 'zh' ? '亲子英语启蒙' : 'Kids English Immersion',
      description: lang === 'zh'
        ? '将识别结果转化为5天学习计划，亲子共学自然与英语'
        : 'Turn identification into 5-day learning plans for parent-child English learning'
    }
  ]

  const sources = [
    { name: 'iNaturalist', url: 'https://www.inaturalist.org', description: lang === 'zh' ? '物种观察与图片' : 'Species observations & photos' },
    { name: 'GBIF', url: 'https://www.gbif.org', description: lang === 'zh' ? '全球生物多样性数据' : 'Global biodiversity data' },
    { name: 'Wikimedia Commons', url: 'https://commons.wikimedia.org', description: lang === 'zh' ? '物种图片' : 'Species images' },
    { name: 'YouTube', url: 'https://www.youtube.com', description: lang === 'zh' ? '科普视频' : 'Educational videos' }
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-sage-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Leaf className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-sage-800 font-chinese-title mb-4">
          {t('about.title')}
        </h1>
        <p className="text-lg text-sage-600 max-w-2xl mx-auto">
          {lang === 'zh'
            ? '一款专为徒步爱好者设计的物种识别与科普应用，让每一次自然探索都成为学习和发现的旅程。'
            : 'A species identification and learning app designed for hikers, turning every nature exploration into a journey of learning and discovery.'}
        </p>
      </div>

      {/* Features */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-sage-700 mb-6 flex items-center gap-2">
          <Info className="w-5 h-5 text-sage-500" />
          {lang === 'zh' ? '核心功能' : 'Features'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="card">
                <div className="w-12 h-12 bg-sage-100 rounded-2xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-sage-600" />
                </div>
                <h3 className="font-semibold text-sage-700 mb-2">{feature.title}</h3>
                <p className="text-sm text-sage-600">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Design Philosophy */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-sage-700 mb-6">
          {lang === 'zh' ? '设计理念' : 'Design Philosophy'}
        </h2>
        <div className="card bg-gradient-to-br from-sage-50 to-amber-50">
          <div className="space-y-4 text-sage-600">
            <p>
              {lang === 'zh'
                ? '设计灵感来自自然本身。我们希望应用如同置身森林中一般——宁静、呼吸感、充满发现的喜悦。'
                : 'Design inspiration comes from nature itself. We want the app to feel like being in a forest — serene, breathing, full of the joy of discovery.'}
            </p>
            <p>
              {lang === 'zh'
                ? '配色采用鼠尾草绿与琥珀黄的组合，象征自然中的生机与温暖。大量留白与柔和的圆角，让界面如同手绘的自然笔记。'
                : 'Colors combine sage green and amber yellow, symbolizing vitality and warmth in nature. Generous whitespace and soft rounded corners make the interface feel like a hand-drawn nature journal.'}
            </p>
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-sage-700 mb-6">
          {lang === 'zh' ? '数据来源' : 'Data Sources'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {sources.map((source) => (
            <a
              key={source.name}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card card-hover text-center"
            >
              <p className="font-medium text-sage-700">{source.name}</p>
              <p className="text-xs text-sage-400 mt-1">{source.description}</p>
            </a>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-8 border-t border-sage-100">
        <p className="text-sm text-sage-400">
          {lang === 'zh'
            ? '用热爱自然的心，构建连接人与自然的桥梁'
            : 'Building bridges between humans and nature with love'}
        </p>
        <p className="text-xs text-sage-300 mt-2">
          Naturalist App © 2026
        </p>
      </div>
    </div>
  )
}
