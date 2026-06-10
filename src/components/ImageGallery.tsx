'use client'

import { useEffect, useState } from 'react'
import { SpeciesImage } from '@/types'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface ImageGalleryProps {
  speciesName: string
  latinName?: string
  chineseName?: string
  category?: string
}

export default function ImageGallery({ speciesName, latinName, chineseName, category }: ImageGalleryProps) {
  const [images, setImages] = useState<SpeciesImage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  useEffect(() => {
    async function fetchImages() {
      try {
        const params = new URLSearchParams({
          name: speciesName,
          count: '5',
        })
        if (latinName) params.set('latin', latinName)
        if (chineseName) params.set('chinese', chineseName)
        if (category) params.set('category', category)

        const response = await fetch(`/api/images?${params}`)
        const data = await response.json()
        if (data.success) {
          setImages(data.images)
        }
      } catch (e) {
        console.error('Failed to fetch images:', e)
      }
      setLoading(false)
    }

    fetchImages()
  }, [speciesName, latinName, chineseName, category])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-sage-100 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-sage-500">暂无图片</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {images.map((image, index) => (
          <button
            key={image.id}
            onClick={() => setSelectedIndex(index)}
            className="aspect-square rounded-2xl overflow-hidden card-hover"
          >
            <img
              src={image.url}
              alt={`${speciesName} ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedIndex(null)}
        >
          <button
            onClick={() => setSelectedIndex(null)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedIndex((prev) => prev !== null ? (prev - 1 + images.length) % images.length : 0)
            }}
            className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-full"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <img
            src={images[selectedIndex].url}
            alt={speciesName}
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedIndex((prev) => prev !== null ? (prev + 1) % images.length : 0)
            }}
            className="absolute right-4 p-2 text-white hover:bg-white/10 rounded-full"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          {/* Image credit */}
          <div className="absolute bottom-4 text-white/60 text-sm">
            {images[selectedIndex].credit} {images[selectedIndex].license && `(${images[selectedIndex].license})`}
          </div>
        </div>
      )}
    </>
  )
}
