import { NextRequest, NextResponse } from 'next/server'

// In-memory cache for humanities results
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days (cultural content changes rarely)

interface HumanitiesResult {
  title: string
  content: string
  quote?: string
  quoteAuthor?: string
  source?: string
  culturalLinks?: CulturalLink[]
}

interface CulturalLink {
  title: string
  url: string
  type: 'poem' | 'legend' | 'culture' | 'wiki'
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const name = searchParams.get('name') || ''
  const chineseName = searchParams.get('chineseName') || ''
  const latinName = searchParams.get('latinName') || ''
  const lang = searchParams.get('lang') || 'zh'

  if (!name && !chineseName && !latinName) {
    return NextResponse.json({
      success: false,
      error: 'Species name is required'
    }, { status: 400 })
  }

  // Check cache
  const cacheKey = `${name}_${chineseName}_${latinName}_${lang}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data)
  }

  const volcApiKey = process.env.VOLCENGINE_API_KEY
  const volcEndpointId = process.env.VOLCENGINE_ENDPOINT_ID

  // Strategy 1: Use Volcengine AI to generate humanities content
  if (volcApiKey) {
    try {
      const result = await generateHumanitiesWithAI({
        name, chineseName, latinName, lang, volcApiKey, volcEndpointId
      })

      if (result) {
        const response = {
          success: true,
          humanities: result,
          source: 'volcengine-ai'
        }
        cache.set(cacheKey, { data: response, timestamp: Date.now() })
        return NextResponse.json(response)
      }
    } catch (error) {
      console.error('Volcengine AI humanities generation error:', error)
    }
  }

  // Strategy 2: Try Wikipedia for cultural content
  try {
    const wikiResult = await fetchHumanitiesFromWikipedia({
      name, chineseName, latinName, lang
    })

    if (wikiResult) {
      const response = {
        success: true,
        humanities: wikiResult,
        source: 'wikipedia'
      }
      cache.set(cacheKey, { data: response, timestamp: Date.now() })
      return NextResponse.json(response)
    }
  } catch (error) {
    console.error('Wikipedia humanities fetch error:', error)
  }

  // Strategy 3: Generate basic humanities content from species name
  const fallbackResult = generateFallbackHumanities({
    name, chineseName, latinName, lang
  })

  const response = {
    success: true,
    humanities: fallbackResult,
    source: 'fallback'
  }
  cache.set(cacheKey, { data: response, timestamp: Date.now() })
  return NextResponse.json(response)
}

/**
 * Use Volcengine AI to generate rich humanities content about a species
 */
async function generateHumanitiesWithAI(params: {
  name: string
  chineseName: string
  latinName: string
  lang: string
  volcApiKey: string
  volcEndpointId?: string
}): Promise<HumanitiesResult | null> {
  const { name, chineseName, latinName, lang, volcApiKey, volcEndpointId } = params

  const isZh = lang === 'zh'

  // Build the prompt based on language
  const prompt = isZh
    ? `请为物种"${chineseName || name}"（学名：${latinName || name}，英文名：${name}）撰写人文知识卡片。

要求返回如下 JSON 格式：
{
  "title": "人文标题，简洁有力，如'荷花的品格'、'蝶梦千年'",
  "content": "2-3段人文内容，涵盖以下方向中的2-3个：\n1. 中国古典诗词中的意象（引用具体诗句和作者）\n2. 民间传说或神话故事\n3. 传统文化中的象征意义\n4. 西方文化中的相关典故或谚语\n5. 名人名言或文学作品的引用\n\n内容要求：\n- 必须与该物种直接相关，不要泛泛而谈\n- 引用的诗词、典故必须准确\n- 语言优美，适合亲子阅读\n- 每段3-4句话",
  "quote": "一句最经典的与该物种相关的诗句或名言",
  "quoteAuthor": "诗句或名言的作者",
  "source": "内容的主要出处，如'《诗经》'、'Aesop\\'s Fables'",
  "culturalLinks": [
    {"title": "相关文化链接标题", "url": "搜索URL", "type": "poem|legend|culture|wiki"}
  ]
}

注意：
- 如果该物种在中国文化中有特殊意义，优先写中国人文内容
- 如果在东西方文化中都有典故，都提及
- culturalLinks 提供2-3个相关的搜索链接（YouTube/B站/维基）
- 只返回JSON，不要其他文字`
    : `Please create a cultural humanities card for the species "${name}"${chineseName ? ` (Chinese: ${chineseName})` : ''}${latinName ? `, scientific name: ${latinName}` : ''}.

Return a JSON object with these fields:
{
  "title": "A catchy cultural title, like 'The Sacred Lotus' or 'The Monarch's Journey'",
  "content": "2-3 paragraphs of cultural content covering 2-3 of these aspects:\n1. Symbolism in Eastern/Chinese culture (poems, legends)\n2. Western cultural references (mythology, literature, proverbs)\n3. Folklore and traditional stories\n4. Famous quotes or literary works about this species\n5. Cultural significance across civilizations\n\nRequirements:\n- Must be directly relevant to this specific species\n- Accurate citations and references\n- Beautiful language suitable for family reading\n- 3-4 sentences per paragraph",
  "quote": "A classic quote or poem line about this species",
  "quoteAuthor": "Author of the quote",
  "source": "Primary source, e.g. 'Aesop\\'s Fables', 'Book of Songs'",
  "culturalLinks": [
    {"title": "Related cultural link title", "url": "Search URL", "type": "poem|legend|culture|wiki"}
  ]
}

Notes:
- If this species has special significance in Chinese/Eastern culture, prioritize that
- Mention both Eastern and Western cultural references if available
- Provide 2-3 cultural search links (YouTube/Wikipedia)
- Return ONLY the JSON object, no other text.`

  const response = await fetch(
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
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.7  // Higher temperature for creative content
      })
    }
  )

  if (!response.ok) {
    console.error('Volcengine AI response status:', response.status)
    return null
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''

  // Parse JSON from response
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])

      // Build cultural search links if not provided by AI
      const culturalLinks = parsed.culturalLinks || buildCulturalLinks({
        name, chineseName, latinName, lang
      })

      return {
        title: stripHtml(parsed.title || (isZh ? `${chineseName || name}的人文故事` : `The Story of ${name}`)),
        content: stripHtml(parsed.content || ''),
        quote: stripHtml(parsed.quote || ''),
        quoteAuthor: stripHtml(parsed.quoteAuthor || ''),
        source: stripHtml(parsed.source || ''),
        culturalLinks
      }
    }
  } catch (parseError) {
    console.error('Failed to parse AI humanities response:', parseError)
  }

  // If JSON parsing fails, try to extract useful content
  if (content.length > 50) {
    return {
      title: isZh ? `${chineseName || name}的人文故事` : `The Story of ${name}`,
      content: stripHtml(content.slice(0, 800)),
      culturalLinks: buildCulturalLinks({ name, chineseName, latinName, lang })
    }
  }

  return null
}

/**
 * Fetch humanities content from Wikipedia
 */
async function fetchHumanitiesFromWikipedia(params: {
  name: string
  chineseName: string
  latinName: string
  lang: string
}): Promise<HumanitiesResult | null> {
  const { name, chineseName, latinName, lang } = params
  const isZh = lang === 'zh'

  // Try Chinese Wikipedia for cultural content
  if (isZh || chineseName) {
    try {
      const searchName = chineseName || name
      const wikiUrl = `https://zh.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchName)}`
      const wikiResponse = await fetch(wikiUrl, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000)
      })

      if (wikiResponse.ok) {
        const wikiData = await wikiResponse.json()
        const extract = wikiData.extract || ''

        // Check if the extract contains cultural keywords
        const culturalKeywords = ['诗', '文化', '象征', '传说', '典故', '民间', '文学', '神话', 'symbol', 'culture', 'myth', 'legend', 'literature', 'poetry']
        const hasCulturalContent = culturalKeywords.some(kw => extract.includes(kw))

        if (extract.length > 100) {
          return {
            title: `${chineseName || name}的文化故事`,
            content: extract.slice(0, 600) + (extract.length > 600 ? '...' : ''),
            source: 'Wikipedia',
            culturalLinks: [
              {
                title: `${chineseName || name} - 维基百科`,
                url: wikiData.content_urls?.desktop?.page || `https://zh.wikipedia.org/wiki/${encodeURIComponent(searchName)}`,
                type: 'wiki'
              },
              ...buildCulturalLinks({ name, chineseName, latinName, lang })
            ]
          }
        }
      }
    } catch (e) {
      console.error('Chinese Wikipedia fetch failed:', e)
    }
  }

  // Try English Wikipedia
  try {
    const searchName = latinName || name
    const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchName)}`
    const wikiResponse = await fetch(wikiUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000)
    })

    if (wikiResponse.ok) {
      const wikiData = await wikiResponse.json()
      const extract = wikiData.extract || ''

      if (extract.length > 100) {
        return {
          title: `The Story of ${name}`,
          content: extract.slice(0, 600) + (extract.length > 600 ? '...' : ''),
          source: 'Wikipedia',
          culturalLinks: [
            {
              title: `${name} - Wikipedia`,
              url: wikiData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(searchName)}`,
              type: 'wiki'
            },
            ...buildCulturalLinks({ name, chineseName, latinName, lang })
          ]
        }
      }
    }
  } catch (e) {
    console.error('English Wikipedia fetch failed:', e)
  }

  return null
}

/**
 * Generate fallback humanities content
 */
function generateFallbackHumanities(params: {
  name: string
  chineseName: string
  latinName: string
  lang: string
}): HumanitiesResult {
  const { name, chineseName, latinName, lang } = params
  const isZh = lang === 'zh'
  const displayName = isZh ? (chineseName || name) : name

  // Category-based cultural templates
  const categoryFromName = detectCategoryFromName(name)
  const templates = getCategoryTemplate(categoryFromName, isZh)

  return {
    title: isZh ? `${displayName}的自然故事` : `The Natural Story of ${displayName}`,
    content: templates.content.replace('{name}', displayName),
    quote: templates.quote,
    quoteAuthor: templates.quoteAuthor,
    source: templates.source,
    culturalLinks: buildCulturalLinks({ name, chineseName, latinName, lang })
  }
}

/**
 * Build search links for cultural exploration
 */
function buildCulturalLinks(params: {
  name: string
  chineseName: string
  latinName: string
  lang: string
}): CulturalLink[] {
  const { name, chineseName, latinName, lang } = params
  const isZh = lang === 'zh'
  const links: CulturalLink[] = []

  if (isZh && chineseName) {
    // Chinese cultural search links
    links.push({
      title: `${chineseName} 诗词典故`,
      url: `https://search.bilibili.com/all?keyword=${encodeURIComponent(chineseName + ' 诗词 典故')}`,
      type: 'poem'
    })
    links.push({
      title: `${chineseName} 文化故事`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(chineseName + ' 文化 故事')}`,
      type: 'culture'
    })
  }

  // English/Western cultural links
  links.push({
    title: `${name} in culture & mythology`,
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(name + ' culture mythology folklore')}`,
    type: 'legend'
  })

  // Wikipedia link
  if (latinName) {
    links.push({
      title: `${latinName} - Wikipedia`,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(latinName)}`,
      type: 'wiki'
    })
  }

  return links
}

/**
 * Detect species category from name for template matching
 */
function detectCategoryFromName(name: string): string {
  const lower = name.toLowerCase()
  if (/butterfly|moth|bee|ant|beetle|bug|fly|dragonfly|insect|spider/i.test(lower)) return 'insect'
  if (/fish|shark|whale|coral|sea|ocean|marine/i.test(lower)) return 'marine'
  if (/mushroom|fungus|mold/i.test(lower)) return 'fungus'
  if (/tree|flower|plant|grass|leaf/i.test(lower)) return 'plant'
  return 'animal'
}

/**
 * Get category-based cultural template for fallback
 */
function getCategoryTemplate(category: string, isZh: boolean): {
  content: string
  quote: string
  quoteAuthor: string
  source: string
} {
  if (isZh) {
    switch (category) {
      case 'insect':
        return {
          content: '法布尔在《昆虫记》中写道："我对昆虫充满敬意，因为它们教会我们什么是真正的专注与热爱。"{name}作为昆虫世界的一员，同样拥有令人惊叹的生命智慧。\n\n在中国古典文学中，昆虫常常是诗人笔下的灵感之源。从《诗经》中的"螽斯羽，诜诜兮"，到李商隐的"春蚕到死丝方尽"，每一种昆虫都承载着独特的文化意象。',
          quote: '春蚕到死丝方尽，蜡炬成灰泪始干',
          quoteAuthor: '李商隐',
          source: '《昆虫记》法布尔'
        }
      case 'plant':
        return {
          content: '陶渊明在《饮酒》中写道："采菊东篱下，悠然见南山。"植物之美，在于它不言而自有声。{name}作为大自然的一页诗篇，同样蕴含着深厚的文化意蕴。\n\n在中国传统文化中，植物常常象征着高洁的品格。从梅兰竹菊"四君子"，到周敦颐笔下的荷花"出淤泥而不染"，植物承载着中国人对理想人格的追求。',
          quote: '采菊东篱下，悠然见南山',
          quoteAuthor: '陶渊明',
          source: '《饮酒》陶渊明'
        }
      case 'marine':
        return {
          content: '庄子在《逍遥游》中写道："北冥有鱼，其名为鲲。"海洋自古就是人类想象力的源泉。{name}作为海洋生物的一员，同样拥有令人着迷的故事。\n\n在中国传统文化中，海洋生物常与龙宫传说、美人鱼故事联系在一起。而在西方，海洋也孕育了无数神话传说——从希腊神话中的海神波塞冬，到北欧传说中的海怪克拉肯。',
          quote: '北冥有鱼，其名为鲲',
          quoteAuthor: '庄子',
          source: '《庄子·逍遥游》'
        }
      default: // animal
        return {
          content: '《诗经》中写道："关关雎鸠，在河之洲。"动物自古以来就是人类最亲密的自然伙伴。{name}作为动物世界的一员，在东西方文化中都有着丰富的故事与象征。\n\n在中国传统文化中，动物常常是十二生肖、民间故事和诗词歌赋中的主角。从"两岸猿声啼不住"到"鹅鹅鹅，曲项向天歌"，每一个动物都承载着独特的文化记忆。',
          quote: '关关雎鸠，在河之洲',
          quoteAuthor: '《诗经》',
          source: '《诗经·周南》'
        }
    }
  } else {
    switch (category) {
      case 'insect':
        return {
          content: 'Jean-Henri Fabre wrote in his "Souvenirs Entomologiques": "The insect world is full of wonders that surpass anything our imagination can create." {name}, as a member of this extraordinary world, carries its own remarkable story.\n\nThroughout history, insects have inspired poets, philosophers, and scientists alike. From the sacred scarab of ancient Egypt to the delicate butterflies in Emily Dickinson\'s verse, these tiny creatures have left an outsized mark on human culture.',
          quote: 'The butterfly counts not months but moments, and has time enough',
          quoteAuthor: 'Rabindranath Tagore',
          source: 'Souvenirs Entomologiques, Jean-Henri Fabre'
        }
      case 'plant':
        return {
          content: 'Ralph Waldo Emerson observed: "The earth laughs in flowers." {name} is one of nature\'s many verses in this endless poem of green.\n\nPlants have been central to human culture since the dawn of civilization. From the lotus of ancient Egypt to the cherry blossoms of Japan, from the olive branch of peace to the rose of love — every culture has woven plants into its deepest stories and symbols.',
          quote: 'The earth laughs in flowers',
          quoteAuthor: 'Ralph Waldo Emerson',
          source: 'Hamatreya, R.W. Emerson'
        }
      case 'marine':
        return {
          content: 'Jacques Cousteau once said: "The sea, once it casts its spell, holds one in its net of wonder forever." {name} is one of the many marvels that inhabit this vast blue world.\n\nMarine life has captivated human imagination for millennia. From the kraken of Norse mythology to the mermaids of seafaring tales, from Melville\'s white whale to Hemingway\'s marlin — the ocean\'s creatures have inspired some of our greatest stories.',
          quote: 'The sea, once it casts its spell, holds one in its net of wonder forever',
          quoteAuthor: 'Jacques Cousteau',
          source: 'The Silent World, Jacques Cousteau'
        }
      default: // animal
        return {
          content: 'Gerald Durrell wrote: "Animals are the essence of our being; without them we would be nothing." {name} carries a rich cultural legacy across civilizations.\n\nFrom Aesop\'s fables to the Chinese zodiac, from Native American spirit animals to the creatures of Norse mythology, animals have been humanity\'s most enduring mirror — reflecting our virtues, vices, and deepest aspirations.',
          quote: 'Until one has loved an animal, a part of one\'s soul remains unawakened',
          quoteAuthor: 'Anatole France',
          source: 'My Family and Other Animals, Gerald Durrell'
        }
    }
  }
}

/**
 * Strip HTML tags from text (AI sometimes returns <b>, <i>, etc.)
 */
function stripHtml(text: string): string {
  if (!text) return ''
  return text
    .replace(/<\/?[a-zA-Z][^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}
