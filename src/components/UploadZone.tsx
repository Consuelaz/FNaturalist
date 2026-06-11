'use client'

import React, { useCallback, useState } from 'react'
import { Upload, Image, Leaf, Bug, Flower } from 'lucide-react'
import { useLanguage } from './LanguageContext'

interface UploadZoneProps {
  onFileSelect: (file: File) => void
}

export default function UploadZone({ onFileSelect }: UploadZoneProps) {
  const { lang } = useLanguage()
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file)
    }
  }, [onFileSelect])

  const handleClick = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) onFileSelect(file)
    }
    input.click()
  }, [onFileSelect])

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`input-upload cursor-pointer relative overflow-hidden ${isDragging ? 'border-sage-500 bg-sage-50' : ''}`}
    >
      <div className="absolute top-4 left-4 opacity-20">
        <Leaf className="w-12 h-12 text-sage-500 -rotate-12" />
      </div>
      <div className="absolute bottom-4 right-4 opacity-20">
        <Bug className="w-10 h-10 text-sage-500 rotate-12" />
      </div>
      <div className="absolute top-4 right-12 opacity-10">
        <Flower className="w-8 h-8 text-sandstone-400" />
      </div>

      <div className="relative z-10">
        <div className="w-20 h-20 mx-auto mb-6 bg-sage-100 rounded-full flex items-center justify-center transition-transform duration-300">
          {isDragging ? (
            <Image className="w-10 h-10 text-sage-500" />
          ) : (
            <Upload className="w-10 h-10 text-sage-400" />
          )}
        </div>

        <p className="text-lg font-medium text-sage-700 mb-2">
          {isDragging
            ? (lang === 'zh' ? '释放图片开始识别' : 'Drop image to identify')
            : (lang === 'zh' ? '拖拽图片到这里' : 'Drag & drop image here')
          }
        </p>
        <p className="text-sage-500 mb-4">{lang === 'zh' ? '或' : 'or'}</p>
        <span className="inline-flex items-center gap-2 btn-primary">
          <Image className="w-4 h-4" />
          {lang === 'zh' ? '选择图片 / 拍照' : 'Choose / Take Photo'}
        </span>

        <div className="mt-6 pt-6 border-t border-sage-100">
          <p className="text-xs text-sage-400">
            {lang === 'zh' ? '支持 JPG、PNG、WebP 格式 · 可拍照或从相册选择' : 'Supports JPG, PNG, WebP · Camera or album'}
          </p>
        </div>
      </div>
    </div>
  )
}
