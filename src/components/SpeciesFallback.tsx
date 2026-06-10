'use client'

import { useState } from 'react'
import { useLanguage } from './LanguageContext'
import { Search, Leaf } from 'lucide-react'
import Link from 'next/link'

interface SpeciesFallbackProps {
  name: string
  imageUrl: string | null
}

export default function SpeciesFallback({ name, imageUrl }: SpeciesFallbackProps) {
  const { lang, t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/?search=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Leaf className="w-10 h-10 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-sage-800 mb-4">
          {lang === 'zh' ? '未能识别这个物种' : 'Could Not Identify This Species'}
        </h1>
        <p className="text-sage-600">
          {lang === 'zh'
            ? '看起来像是一株特别的植物或小生灵，但我们未能看清它的特征。'
            : 'It looks like a special plant or creature, but we couldn\'t see its features clearly.'}
        </p>
        <p className="text-sage-500 mt-2">
          {lang === 'zh' ? '要不再靠近一点试试？' : 'Try getting closer next time!'}
        </p>
      </div>

      {/* Image Preview */}
      {imageUrl && (
        <div className="card mb-6 p-4">
          <div className="aspect-square max-w-xs mx-auto rounded-2xl overflow-hidden bg-sage-50">
            <img
              src={imageUrl}
              alt="Uploaded"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Manual Search */}
      <div className="card">
        <h2 className="text-lg font-semibold text-sage-700 mb-4 text-center">
          {lang === 'zh' ? '或手动搜索物种名' : 'Or Search for Species Name'}
        </h2>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sage-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'zh' ? '输入物种名称...' : 'Enter species name...'}
              className="w-full pl-12 pr-4 py-3 bg-sage-50 border border-sage-200 rounded-2xl
                         focus:outline-none focus:border-sage-400 transition-colors"
            />
          </div>
          <button type="submit" className="btn-primary">
            {lang === 'zh' ? '搜索' : 'Search'}
          </button>
        </form>

        {/* Suggestions */}
        <div className="mt-6 pt-6 border-t border-sage-100">
          <p className="text-sm text-sage-500 mb-3">
            {lang === 'zh' ? '常见可识别物种' : 'Common Identifiable Species'}
          </p>
          <div className="flex flex-wrap gap-2">
          {['金斑蝶', '蒲公英', '瓢虫', '赤狐', '荷花'].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setSearchQuery(suggestion)}
              className="px-3 py-1.5 bg-sage-100 text-sage-600 rounded-full text-sm hover:bg-sage-200 transition-colors"
            >
              {lang === 'zh' ? suggestion : {
                '金斑蝶': 'Monarch',
                '蒲公英': 'Dandelion',
                '瓢虫': 'Ladybug',
                '赤狐': 'Red Fox',
                '荷花': 'Lotus'
              }[suggestion] || suggestion}
            </button>
            ))}
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="text-center mt-8">
        <Link href="/" className="btn-secondary">
          {lang === 'zh' ? '重新上传图片' : 'Upload New Photo'}
        </Link>
      </div>
    </div>
  )
}
