import { NextRequest, NextResponse } from 'next/server'

// Cache for video results
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const speciesName = searchParams.get('name') || ''
  const lang = searchParams.get('lang') || 'en'
  const latinName = searchParams.get('latin') || ''
  const chineseName = searchParams.get('chinese') || ''

  // Include all name variants in cache key
  const cacheKey = `videos_${speciesName}_${latinName}_${chineseName}_${lang}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({
      ...cached.data,
      cached: true
    })
  }

  try {
    const videos: any[] = []
    const apiKey = process.env.YOUTUBE_API_KEY
    // Prefer Latin name for scientific accuracy, then Chinese name, then species name
    const primaryName = latinName || chineseName || speciesName

    if (apiKey) {
      // Search for educational videos on YouTube using YouTube Data API
      const searchQuery = `${primaryName} nature documentary educational ${lang === 'zh' ? '中文' : 'English'}`

      try {
        const searchResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=${lang === 'zh' ? 4 : 3}&key=${apiKey}`
        )

        if (searchResponse.ok) {
          const searchData = await searchResponse.json()

          for (const item of searchData.items || []) {
            videos.push({
              id: item.id.videoId,
              title: item.snippet.title,
              thumbnail: item.snippet.thumbnails?.medium?.url,
              youtubeId: item.id.videoId,
              language: lang,
              channelTitle: item.snippet.channelTitle
            })
          }
        }
      } catch (e) {
        console.error('YouTube API error:', e)
      }
    }

    // If no YouTube API key, or API didn't return results,
    // generate species-specific YouTube search links
    if (videos.length === 0) {
      const displayName = chineseName || primaryName

      if (lang === 'zh') {
        // Chinese videos: use species Chinese name + keywords
        videos.push({
          id: `yt_search_zh_doc_${Date.now()}`,
          title: `${displayName} 纪录片`,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(displayName + ' 纪录片 自然')}`,
          language: 'zh',
          notice: '点击在 YouTube 搜索相关视频'
        })
        videos.push({
          id: `yt_search_zh_learn_${Date.now()}`,
          title: `${displayName} 科普介绍`,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(displayName + ' 科普介绍')}`,
          language: 'zh',
          notice: '点击在 YouTube 搜索科普视频'
        })
        // Add Bilibili search link for Chinese users
        videos.push({
          id: `bili_search_${Date.now()}`,
          title: `${displayName} - B站`,
          url: `https://search.bilibili.com/all?keyword=${encodeURIComponent(displayName + ' 自然 纪录片')}`,
          language: 'zh',
          notice: '点击在 B站 搜索相关视频'
        })
      } else {
        // English videos
        videos.push({
          id: `yt_search_en_doc_${Date.now()}`,
          title: `${primaryName} Nature Documentary`,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(primaryName + ' nature documentary')}`,
          language: 'en',
          notice: 'Click to search YouTube for related videos'
        })
        videos.push({
          id: `yt_search_en_learn_${Date.now()}`,
          title: `${primaryName} Facts & Education`,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(primaryName + ' facts educational')}`,
          language: 'en',
          notice: 'Click to search YouTube for educational videos'
        })
      }
    }

    const result = {
      success: true,
      videos: videos.slice(0, lang === 'zh' ? 4 : 3),
      source: apiKey ? 'YouTube Data API' : 'YouTube Search Links'
    }

    cache.set(cacheKey, { data: result, timestamp: Date.now() })
    return NextResponse.json(result)

  } catch (error) {
    console.error('Videos API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch videos'
    }, { status: 500 })
  }
}
