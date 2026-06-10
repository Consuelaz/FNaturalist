import { NextRequest, NextResponse } from 'next/server'

// Cache for image results
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const speciesName = searchParams.get('name') || ''
  const latinName = searchParams.get('latin') || ''
  const chineseName = searchParams.get('chinese') || ''
  const category = searchParams.get('category') || 'plant'
  const count = parseInt(searchParams.get('count') || '6')

  // Include all name variants in cache key
  const cacheKey = `images_${speciesName}_${latinName}_${chineseName}_${category}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data)
  }

  try {
    const images: any[] = []
    // Prefer Latin name for scientific accuracy
    const primaryName = latinName || chineseName || speciesName

    // Strategy 1: Use iNaturalist /v1/taxa API — this returns actual taxon photos
    try {
      const taxaResponse = await fetch(
        `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(primaryName)}&locale=zh&per_page=5`,
        {
          headers: { 'Accept': 'application/json' }
        }
      )

      if (taxaResponse.ok) {
        const taxaData = await taxaResponse.json()
        if (taxaData.results?.length > 0) {
          for (const taxon of taxaData.results) {
            // Get photos from taxon_photos or default_photo
            if (taxon.taxon_photos?.length > 0) {
              for (const tp of taxon.taxon_photos.slice(0, count - images.length)) {
                const photo = tp.photo
                if (photo?.medium_url || photo?.url) {
                  images.push({
                    id: `inat_taxon_${tp.photo.id || images.length}`,
                    url: photo.medium_url || photo.url?.replace('square', 'medium'),
                    credit: photo.attribution || 'iNaturalist',
                    license: photo.license_code || 'CC-BY-NC'
                  })
                }
              }
            } else if (taxon.default_photo) {
              const photo = taxon.default_photo
              images.push({
                id: `inat_default_${photo.id || images.length}`,
                url: photo.medium_url || photo.url?.replace('square', 'medium'),
                credit: photo.attribution || 'iNaturalist',
                license: photo.license_code || 'CC-BY-NC'
              })
            }
            if (images.length >= count) break
          }
        }
      }
    } catch (e) {
      console.error('iNaturalist taxa API error:', e)
    }

    // Strategy 2: Use iNaturalist observations API for real user photos
    if (images.length < count) {
      try {
        const obsResponse = await fetch(
          `https://api.inaturalist.org/v1/observations?taxon_name=${encodeURIComponent(primaryName)}&photos=true&quality_grade=research&per_page=${count - images.length}&locale=zh`,
          {
            headers: { 'Accept': 'application/json' }
          }
        )

        if (obsResponse.ok) {
          const obsData = await obsResponse.json()
          if (obsData.results?.length > 0) {
            for (const obs of obsData.results) {
              if (obs.photos?.length > 0 && images.length < count) {
                const photo = obs.photos[0]
                images.push({
                  id: `inat_obs_${obs.id}`,
                  url: photo.medium_url || photo.url?.replace('square', 'medium'),
                  credit: obs.user?.login || 'iNaturalist',
                  license: photo.license_code || 'CC-BY-NC'
                })
              }
            }
          }
        }
      } catch (e) {
        console.error('iNaturalist observations API error:', e)
      }
    }

    // Strategy 3: Try GBIF media for additional images
    if (images.length < count) {
      try {
        // First get the GBIF species key
        const matchResponse = await fetch(
          `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(primaryName)}`
        )

        if (matchResponse.ok) {
          const matchData = await matchResponse.json()
          if (matchData.usageKey) {
            const mediaResponse = await fetch(
              `https://api.gbif.org/v1/species/${matchData.usageKey}/media?limit=${count - images.length}`
            )
            if (mediaResponse.ok) {
              const mediaData = await mediaResponse.json()
              for (const media of mediaData.results?.slice(0, count - images.length) || []) {
                if (media.identifier && images.length < count) {
                  images.push({
                    id: `gbif_${media.key}`,
                    url: media.identifier,
                    credit: media.creator || 'GBIF',
                    license: media.license || 'CC-BY'
                  })
                }
              }
            }
          }
        }
      } catch (e) {
        console.error('GBIF API error:', e)
      }
    }

    // Strategy 4: Try Wikipedia/Wikimedia Commons images
    if (images.length < count) {
      try {
        const wikiSearchName = latinName || speciesName
        const wikiResponse = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiSearchName)}`,
          {
            headers: { 'Accept': 'application/json' }
          }
        )

        if (wikiResponse.ok) {
          const wikiData = await wikiResponse.json()
          if (wikiData.thumbnail?.source) {
            // Get a higher resolution version by modifying the URL
            let thumbUrl = wikiData.thumbnail.source
            // Try to get larger image by removing/adjusting thumbnail parameters
            if (thumbUrl.includes('/thumb/')) {
              // Wikipedia thumbnail URL: extract larger version
              thumbUrl = thumbUrl.replace(/\/\d+px-/, '/800px-')
            }
            images.push({
              id: `wiki_${Date.now()}`,
              url: thumbUrl,
              credit: 'Wikipedia',
              license: 'CC-BY-SA'
            })
          }
        }
      } catch (e) {
        console.error('Wikipedia API error:', e)
      }
    }

    // Try Chinese Wikipedia (zh.wikipedia.org) for additional images
    if (images.length < count && chineseName) {
      try {
        const cnWikiResponse = await fetch(
          `https://zh.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(chineseName)}`,
          {
            headers: { 'Accept': 'application/json' }
          }
        )

        if (cnWikiResponse.ok) {
          const cnWikiData = await cnWikiResponse.json()
          if (cnWikiData.thumbnail?.source) {
            let thumbUrl = cnWikiData.thumbnail.source
            if (thumbUrl.includes('/thumb/')) {
              thumbUrl = thumbUrl.replace(/\/\d+px-/, '/800px-')
            }
            // Avoid duplicates
            const existingUrls = images.map(i => i.url)
            if (!existingUrls.includes(thumbUrl)) {
              images.push({
                id: `wiki_zh_${Date.now()}`,
                url: thumbUrl,
                credit: 'Wikipedia',
                license: 'CC-BY-SA'
              })
            }
          }
        }
      } catch (e) {
        console.error('Chinese Wikipedia API error:', e)
      }
    }

    const result = {
      success: true,
      images: images.slice(0, count),
      source: images.length > 0 ? 'iNaturalist + GBIF + Wikipedia' : 'No results'
    }

    cache.set(cacheKey, { data: result, timestamp: Date.now() })
    return NextResponse.json(result)

  } catch (error) {
    console.error('Images API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch images'
    }, { status: 500 })
  }
}
