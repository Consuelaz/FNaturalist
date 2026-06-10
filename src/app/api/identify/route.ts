import { NextRequest, NextResponse } from 'next/server'

// In-memory cache for species identification results
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

// Sample species database for fallback
const sampleSpecies = [
  {
    id: 'monarch',
    name: 'Monarch Butterfly',
    chineseName: '金斑蝶',
    latinName: 'Danaus plexippus',
    category: 'insect',
    confidence: 0.92,
    classification: {
      kingdom: '动物界',
      phylum: '节肢动物门',
      class: '昆虫纲',
      order: '鳞翅目',
      family: '蛱蝶科',
      genus: '斑蝶属',
      species: '金斑蝶'
    },
    description: '金斑蝶是一种著名的迁徙性蝴蝶，以其橙黑色花纹和长达数千公里的迁徙而闻名。'
  },
  {
    id: 'lotus',
    name: 'Lotus',
    chineseName: '荷花',
    latinName: 'Nelumbo nucifera',
    category: 'plant',
    confidence: 0.88,
    classification: {
      kingdom: '植物界',
      phylum: '被子植物门',
      class: '双子叶植物纲',
      order: '山龙眼目',
      family: '莲科',
      genus: '莲属',
      species: '莲'
    },
    description: '荷花是中国传统的名贵花卉，象征着清廉高洁，深受人们喜爱。'
  }
]

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get('image') as File

    if (!image) {
      return NextResponse.json({
        success: false,
        error: 'No image provided'
      }, { status: 400 })
    }

    // Read image as base64
    const arrayBuffer = await image.arrayBuffer()
    const imageBase64 = Buffer.from(arrayBuffer).toString('base64')
    const cacheKey = `identify_${imageBase64.slice(0, 100)}`

    // Check cache
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data)
    }

    // Check for API keys
    const volcApiKey = process.env.VOLCENGINE_API_KEY
    const plantnetApiKey = process.env.PLANTNET_API_KEY

    // Try Volcano Engine Doubao-vision API if configured
    const volcEndpointId = process.env.VOLCENGINE_ENDPOINT_ID
    if (volcApiKey) {
      try {
        console.log('Calling Volcano Engine Doubao-vision API...')
        
        const volcResponse = await fetch(
          'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${volcApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: volcEndpointId || 'ep-20260416140324-ptvv5',
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'image_url',
                      image_url: {
                        url: `data:${image.type || 'image/jpeg'};base64,${imageBase64}`
                      }
                    },
                    {
                      type: 'text',
                      text: `Please identify the species in this image. Return a JSON object with these fields:

- "name": English common name
- "chineseName": Chinese common name (中文俗名)
- "latinName": Scientific/Latin name
- "category": one of "insect", "plant", "animal", "marine", "fungus"
- "nameOrigin": Origin of the name in Chinese, explain why it is called this name (1-2 sentences, 中文)
- "appearance": Physical appearance description in Chinese, color, size, distinctive features (2-3 sentences, 中文)
- "habitat": Habitat description in Chinese, where does it live, what environment (2-3 sentences, 中文)
- "behavior": Behavior and lifestyle in Chinese, what does it eat, daily habits (2-3 sentences, 中文)
- "distribution": Geographic distribution in Chinese, which regions/countries (2-3 sentences, 中文)
- "reproduction": Reproduction method or growth cycle in Chinese, how does it reproduce or grow (2-3 sentences, 中文)

Example for Monarch Butterfly:
{"name":"Monarch Butterfly","chineseName":"金斑蝶","latinName":"Danaus plexippus","category":"insect","nameOrigin":"因其翅膀上有金色的斑纹而得名，英文名Monarch意为君主，因其王者般的外观","appearance":"翅膀展开约8.9-10.2厘米，呈鲜艳的橙黑色花纹，翅脉黑色，边缘有白色斑点。雄蝶后翅中央有一个黑色斑点可释放信息素","habitat":"喜栖息在开阔的草地、田野和花园中，尤其是有乳草植物的地方。在美洲大陆广泛分布","behavior":"以花蜜为食，幼虫专食乳草植物。成蝶具有长途迁徙的习性，每年秋季从北美南迁至墨西哥越冬","distribution":"主要分布在北美洲，从加拿大南部到墨西哥。也在澳大利亚、新西兰和加那利群岛等地有分布","reproduction":"雌蝶在乳草植物上产卵，卵孵化后幼虫经历5个龄期化蛹，蛹期约10-14天羽化为成蝶，一年可繁殖数代"}

Return ONLY the JSON object, no other text.`
                    }
                  ]
                }
              ],
              max_tokens: 1500,
              temperature: 0.1
            })
          }
        )

        console.log('Volcano Engine response status:', volcResponse.status)

        if (volcResponse.ok) {
          const volcData = await volcResponse.json()
          console.log('Volcano Engine response:', JSON.stringify(volcData).slice(0, 1000))
          
          // Extract species name from the response
          const content = volcData.choices?.[0]?.message?.content || ''
          let parsedName = ''
          let parsedChineseName = ''
          let parsedLatinName = ''
          let parsedCategory = ''
          let parsedDescription = ''
          let parsedNameOrigin = ''
          let parsedAppearance = ''
          let parsedHabitat = ''
          let parsedBehavior = ''
          let parsedDistribution = ''
          let parsedReproduction = ''

          // Try to parse as JSON (new prompt format)
          try {
            // Extract JSON from response (may have markdown code block wrapping)
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0])
              parsedName = stripHtml(parsed.name || '')
              parsedChineseName = stripHtml(parsed.chineseName || '')
              parsedLatinName = stripHtml(parsed.latinName || '')
              parsedCategory = stripHtml(parsed.category || '')
              parsedDescription = stripHtml(parsed.description || '')
              parsedNameOrigin = stripHtml(parsed.nameOrigin || '')
              parsedAppearance = stripHtml(parsed.appearance || '')
              parsedHabitat = stripHtml(parsed.habitat || '')
              parsedBehavior = stripHtml(parsed.behavior || '')
              parsedDistribution = stripHtml(parsed.distribution || '')
              parsedReproduction = stripHtml(parsed.reproduction || '')
            }
          } catch (parseError) {
            console.log('Failed to parse JSON from volcengine response, falling back to plain text')
          }

          // Fallback: treat as plain text species name
          if (!parsedName) {
            parsedName = stripHtml(content.trim())
          }

          if (parsedName) {
            // Fetch additional details from iNaturalist (for classification & description supplement)
            // If volcengine already provided classification data, iNaturalist can still enhance it
            const speciesDetails = await fetchSpeciesDetails(parsedLatinName || parsedName)

            // Build classification - iNaturalist ancestors take priority (most complete data)
            const category = parsedCategory || detectCategory(parsedName)
            // Only use volcengine classification if iNaturalist didn't return any
            const classification = Object.keys(speciesDetails.classification || {}).length > 0
              ? speciesDetails.classification
              : {
                  kingdom: category === 'plant' ? '植物界' : '动物界'
                }
            const description = parsedDescription || speciesDetails.description || ''

            const result = {
              success: true,
              species: {
                id: (parsedLatinName || parsedName).replace(/\s+/g, '_').toLowerCase(),
                name: parsedName,
                chineseName: parsedChineseName || speciesDetails.chineseName || parsedName,
                latinName: parsedLatinName || speciesDetails.latinName || parsedName,
                category,
                description,
                // Encyclopedia sections from volcengine AI
                nameOrigin: parsedNameOrigin || '',
                appearance: parsedAppearance || '',
                habitat: parsedHabitat || '',
                behavior: parsedBehavior || '',
                distribution: parsedDistribution || '',
                reproduction: parsedReproduction || '',
                // Wikipedia link from iNaturalist
                wikiUrl: speciesDetails.wikiUrl || '',
                classification
              },
              confidence: 0.8,
              source: 'volcengine-doubao'
            }

            cache.set(cacheKey, { data: result, timestamp: Date.now() })
            return NextResponse.json(result)
          }
        }
      } catch (volcError: any) {
        console.error('Volcano Engine API error:', volcError)
      }
    }

    // Try iNaturalist Computer Vision API (accessible in China, no API key needed)
    try {
      console.log('Trying iNaturalist Computer Vision API...')
      
      // iNaturalist CV API requires multipart form data
      const iNatFormData = new FormData()
      const imageBlob = new Blob([Buffer.from(imageBase64, 'base64')], { type: image.type || 'image/jpeg' })
      iNatFormData.append('image', imageBlob, 'image.jpg')
      
      const inatResponse = await fetch(
        'https://api.inaturalist.org/v1/computervision/score_image',
        {
          method: 'POST',
          body: iNatFormData
        }
      )

      if (inatResponse.ok) {
        const inatData = await inatResponse.json()
        if (inatData.results && inatData.results.length > 0) {
          const topResult = inatData.results[0]
          const taxon = topResult.taxon || topResult
          const speciesName = taxon.name || ''
          const speciesDetails = await fetchSpeciesDetails(speciesName)
          const result = {
            success: true,
            species: {
              id: speciesName.replace(/\s+/g, '_').toLowerCase(),
              name: speciesName,
              chineseName: speciesDetails.chineseName || speciesName,
              latinName: speciesDetails.latinName || speciesName,
              category: detectCategory(speciesName),
              description: speciesDetails.description || '',
              classification: speciesDetails.classification || {
                kingdom: detectCategory(speciesName) === 'plant' ? '植物界' : '动物界'
              }
            },
            confidence: topResult.score || taxon.score || 0.7,
            source: 'inaturalist-cv'
          }

          cache.set(cacheKey, { data: result, timestamp: Date.now() })
          return NextResponse.json(result)
        }
      }
    } catch (inatError: any) {
      console.error('iNaturalist Computer Vision API error:', inatError)
    }

    // Try PlantNet API for plant identification
    if (plantnetApiKey) {
      try {
        const plantnetResponse = await fetch(
          `https://my-api.plantnet.org/v2/identify/all?api-key=${plantnetApiKey}&lang=zh`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              images: [imageBase64],
              organs: ['auto']
            })
          }
        )

        if (plantnetResponse.ok) {
          const plantnetData = await plantnetResponse.json()
          const result = {
            success: true,
            species: transformPlantNetResponse(plantnetData),
            confidence: plantnetData.results?.[0]?.score || 0.7,
            source: 'plantnet'
          }

          cache.set(cacheKey, { data: result, timestamp: Date.now() })
          return NextResponse.json(result)
        }
      } catch (plantnetError) {
        console.error('PlantNet API error:', plantnetError)
      }
    }

    // Fallback to demo mode
    const randomSpecies = sampleSpecies[Math.floor(Math.random() * sampleSpecies.length)]
    const result = {
      success: true,
      species: randomSpecies,
      confidence: 0.8,
      source: 'demo',
      notice: '使用示例数据。请配置 VOLCENGINE_API_KEY 以获得真实识别结果。'
    }

    cache.set(cacheKey, { data: result, timestamp: Date.now() })
    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Identification error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Identification service unavailable'
    }, { status: 500 })
  }
}

function transformPlantNetResponse(data: any) {
  const firstResult = data.results?.[0]
  if (!firstResult) return null

  const species = firstResult.species
  return {
    id: species.scientificNameWithoutAuthor?.replace(/\s+/g, '_').toLowerCase() || 'unknown',
    name: species.scientificNameWithoutAuthor || '未知植物',
    chineseName: species.commonNames?.[0] || species.scientificNameWithoutAuthor || '未知植物',
    latinName: species.scientificNameWithoutAuthor,
    category: 'plant',
    classification: {
      kingdom: '植物界',
      family: species.family?.vernacularNames?.[0] || species.family,
      genus: species.genus?.scientificName
    }
  }
}

function detectCategory(name: string): 'insect' | 'plant' | 'animal' | 'marine' | 'fungus' {
  const lowerName = name.toLowerCase()
  if (/butterfly|moth|bee|ant|beetle|bug|fly|dragonfly|insect|spider/i.test(lowerName)) {
    return 'insect'
  }
  if (/fish|shark|whale|coral|sea|ocean|marine/i.test(lowerName)) {
    return 'marine'
  }
  if (/mushroom|fungus|mold/i.test(lowerName)) {
    return 'fungus'
  }
  if (/tree|flower|plant|grass|leaf|seed|草|花|树|叶/i.test(lowerName)) {
    return 'plant'
  }
  return 'animal'
}

async function fetchSpeciesDetails(speciesName: string): Promise<{
  chineseName?: string;
  latinName?: string;
  description?: string;
  classification?: any;
  wikiUrl?: string;
}> {
  try {
    // Step 1: Search for the taxon to get its ID
    const taxaResponse = await fetch(
      `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(speciesName)}&locale=zh&per_page=1`,
      {
        headers: { 'Accept': 'application/json' }
      }
    )
    if (taxaResponse.ok) {
      const taxaData = await taxaResponse.json()
      if (taxaData.results?.length > 0) {
        const taxon = taxaData.results[0]
        const taxonId = taxon.id

        // Extract Chinese name from preferred_common_name
        let chineseName = ''
        if (taxon.preferred_common_name && /[\u4e00-\u9fff]/.test(taxon.preferred_common_name)) {
          chineseName = taxon.preferred_common_name
        }

        // Step 2: Fetch full taxon details with ancestors to build classification
        // The /v1/taxa/{id}?include_ancestors=true returns an `ancestors` array
        // where each ancestor has { rank: "kingdom", name: "Animalia", preferred_common_name: "動物界" }
        let classification: any = {}
        let description = taxon.wikipedia_summary || ''

        try {
          const detailResponse = await fetch(
            `https://api.inaturalist.org/v1/taxa/${taxonId}?include_ancestors=true&locale=zh`,
            {
              headers: { 'Accept': 'application/json' }
            }
          )
          if (detailResponse.ok) {
            const detailData = await detailResponse.json()
            const detailedTaxon = detailData.results?.[0]

            if (detailedTaxon) {
              // Build classification from ancestors array
              const ancestors = detailedTaxon.ancestors || []
              const rankToKey: Record<string, string> = {
                'kingdom': 'kingdom',
                'phylum': 'phylum',
                'subphylum': 'subphylum',
                'class': 'class',
                'subclass': 'subclass',
                'order': 'order',
                'suborder': 'suborder',
                'superfamily': 'superfamily',
                'family': 'family',
                'subfamily': 'subfamily',
                'tribe': 'tribe',
                'genus': 'genus',
                'species': 'species'
              }

              // Map ancestors by rank → classification
              // Use preferred_common_name (Chinese) if available, otherwise scientific name
              for (const ancestor of ancestors) {
                const key = rankToKey[ancestor.rank]
                if (key) {
                  // Prefer Chinese common name for display, with Latin name as secondary
                  const cnName = ancestor.preferred_common_name || ''
                  const latinName = ancestor.name || ''
                  classification[key] = cnName && /[\u4e00-\u9fff]/.test(cnName)
                    ? `${cnName} (${latinName})`
                    : latinName
                }
              }

              // Add the taxon itself (species rank)
              if (detailedTaxon.rank === 'species') {
                const speciesCn = detailedTaxon.preferred_common_name || ''
                const speciesLatin = detailedTaxon.name || ''
                classification.species = speciesCn && /[\u4e00-\u9fff]/.test(speciesCn)
                  ? `${speciesCn} (${speciesLatin})`
                  : speciesLatin
              }

              // Update description if found in detailed response
              if (detailedTaxon.wikipedia_summary) {
                description = detailedTaxon.wikipedia_summary
              }

              // Update Chinese name from detailed response
              if (!chineseName && detailedTaxon.preferred_common_name && /[\u4e00-\u9fff]/.test(detailedTaxon.preferred_common_name)) {
                chineseName = detailedTaxon.preferred_common_name
              }
            }
          }
        } catch (detailError) {
          console.error('Error fetching taxon details with ancestors:', detailError)
          // Fallback: use basic classification from search result
          if (taxon.rank === 'species' && taxon.name) {
            classification.species = taxon.name
          }
        }

        // Filter classification to only include the main 7 ranks (界门纲目科属种)
        const mainRanks = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species']
        const filteredClassification: any = {}
        for (const rank of mainRanks) {
          if (classification[rank]) {
            filteredClassification[rank] = classification[rank]
          }
        }

        // Get Wikipedia URL from taxon data
        const wikiUrl = taxon.wikipedia_url || ''

        return {
          chineseName: chineseName || taxon.preferred_common_name || '',
          latinName: taxon.name || speciesName,
          description,
          classification: filteredClassification,
          wikiUrl
        }
      }
    }

    // Fallback: try iNaturalist search API
    const searchResponse = await fetch(
      `https://api.inaturalist.org/v1/search?q=${encodeURIComponent(speciesName)}&per_page=1`,
      {
        headers: { 'Accept': 'application/json' }
      }
    )
    if (searchResponse.ok) {
      const searchData = await searchResponse.json()
      if (searchData.results?.length > 0) {
        const result = searchData.results[0]
        const record = result.record || result
        const taxon = record.taxon || record

        let chineseName = ''
        if (record.preferred_common_name && /[\u4e00-\u9fff]/.test(record.preferred_common_name)) {
          chineseName = record.preferred_common_name
        }

        // If we have a taxon ID, fetch with ancestors for classification
        if (taxon.id) {
          try {
            const detailResponse = await fetch(
              `https://api.inaturalist.org/v1/taxa/${taxon.id}?include_ancestors=true&locale=zh`,
              {
                headers: { 'Accept': 'application/json' }
              }
            )
            if (detailResponse.ok) {
              const detailData = await detailResponse.json()
              const detailedTaxon = detailData.results?.[0]
              if (detailedTaxon) {
                const ancestors = detailedTaxon.ancestors || []
                const mainRanks = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species']
                const rankToKey: Record<string, string> = {
                  'kingdom': 'kingdom', 'phylum': 'phylum', 'class': 'class',
                  'order': 'order', 'family': 'family', 'genus': 'genus', 'species': 'species'
                }
                const classification: any = {}
                for (const ancestor of ancestors) {
                  const key = rankToKey[ancestor.rank]
                  if (key) {
                    const cnName = ancestor.preferred_common_name || ''
                    const latinName = ancestor.name || ''
                    classification[key] = cnName && /[\u4e00-\u9fff]/.test(cnName)
                      ? `${cnName} (${latinName})`
                      : latinName
                  }
                }
                if (detailedTaxon.rank === 'species') {
                  const speciesCn = detailedTaxon.preferred_common_name || ''
                  const speciesLatin = detailedTaxon.name || ''
                  classification.species = speciesCn && /[\u4e00-\u9fff]/.test(speciesCn)
                    ? `${speciesCn} (${speciesLatin})`
                    : speciesLatin
                }
                if (!chineseName && detailedTaxon.preferred_common_name && /[\u4e00-\u9fff]/.test(detailedTaxon.preferred_common_name)) {
                  chineseName = detailedTaxon.preferred_common_name
                }
                return {
                  chineseName: chineseName || record.preferred_common_name || '',
                  latinName: taxon.name || speciesName,
                  description: detailedTaxon.wikipedia_summary || taxon.wikipedia_summary || '',
                  classification,
                  wikiUrl: detailedTaxon.wikipedia_url || taxon.wikipedia_url || ''
                }
              }
            }
          } catch (e) {
            console.error('Error fetching taxon ancestors from search fallback:', e)
          }
        }

        // Last resort: return minimal data
        return {
          chineseName: chineseName || record.preferred_common_name || '',
          latinName: taxon.name || speciesName,
          description: taxon.wikipedia_summary || record.wikipedia_summary || '',
          classification: {}
        }
      }
    }
  } catch (error) {
    console.error('Error fetching species details from iNaturalist:', error)
  }
  return {}
}

/**
 * Strip HTML tags from text (AI sometimes returns <b>, <i>, etc.)
 */
function stripHtml(text: string): string {
  if (!text) return ''
  return text
    // Remove HTML tags like <b>, </b>, <i>, </i>, <br>, etc.
    .replace(/<\/?[a-zA-Z][^>]*>/g, '')
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}
