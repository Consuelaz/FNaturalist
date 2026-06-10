'use client'

import { useEffect, useState } from 'react'
import { Video } from '@/types'
import { Play, ExternalLink } from 'lucide-react'

interface VideoSectionProps {
  speciesName: string
  latinName?: string
  chineseName?: string
  lang: 'zh' | 'en'
}

export default function VideoSection({ speciesName, latinName, chineseName, lang }: VideoSectionProps) {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchVideos() {
      try {
        const params = new URLSearchParams({
          name: speciesName,
          lang: lang,
        })
        if (latinName) params.set('latin', latinName)
        if (chineseName) params.set('chinese', chineseName)

        const response = await fetch(`/api/videos?${params}`)
        const data = await response.json()
        if (data.success) {
          setVideos(data.videos)
        }
      } catch (e) {
        console.error('Failed to fetch videos:', e)
      }
      setLoading(false)
    }

    fetchVideos()
  }, [speciesName, latinName, chineseName, lang])

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[...Array(lang === 'zh' ? 4 : 3)].map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-64 aspect-video bg-sage-100 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-sage-500">{lang === 'zh' ? '暂无视频' : 'No videos available'}</p>
      </div>
    )
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
      {videos.map((video) => (
        <div
          key={video.id}
          className="flex-shrink-0 w-64 card-hover"
        >
          {video.youtubeId ? (
            <a
              href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-sage-100">
                {video.thumbnail ? (
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-sage-200" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                    <Play className="w-5 h-5 text-sage-700 ml-0.5" />
                  </div>
                </div>
              </div>
              <h4 className="text-sm font-medium text-sage-700 line-clamp-2">
                {video.title}
              </h4>
              {video.channelTitle && (
                <p className="text-xs text-sage-400 mt-1">
                  {video.channelTitle}
                </p>
              )}
            </a>
          ) : video.url ? (
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-sage-100 flex items-center justify-center">
                <ExternalLink className="w-8 h-8 text-sage-400" />
              </div>
              <h4 className="text-sm font-medium text-sage-700">
                {video.title}
              </h4>
              {video.notice && (
                <p className="text-xs text-sage-400 mt-1">
                  {video.notice}
                </p>
              )}
            </a>
          ) : null}
        </div>
      ))}
    </div>
  )
}
