// API route: Generate a 7-day English learning plan based on species data
// Uses Volcano Engine AI to create personalized content

import { NextRequest, NextResponse } from 'next/server'

// Cache: 7 days
const cache = new Map<string, { data: any; expires: number }>()
const CACHE_TTL = 7 * 24 * 3600 * 1000

function getCacheKey(speciesId: string, lang: string): string {
  return `learning-plan:${speciesId}:${lang}`
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const speciesId = searchParams.get('speciesId')
  const lang = searchParams.get('lang') || 'zh'
  const name = searchParams.get('name') || ''
  const chineseName = searchParams.get('chineseName') || ''
  const latinName = searchParams.get('latinName') || ''
  const category = searchParams.get('category') || 'animal'
  const description = searchParams.get('description') || ''
  const appearance = searchParams.get('appearance') || ''
  const habitat = searchParams.get('habitat') || ''
  const behavior = searchParams.get('behavior') || ''

  if (!speciesId || !name) {
    return NextResponse.json({ error: 'Missing speciesId or name' }, { status: 400 })
  }

  // Check cache
  const cacheKey = getCacheKey(speciesId, lang)
  const cached = cache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.data)
  }

  try {
    const plan = await generateLearningPlan({
      speciesId, name, chineseName, latinName, category,
      description, appearance, habitat, behavior, lang
    })

    const response = { success: true, plan }
    cache.set(cacheKey, { data: response, expires: Date.now() + CACHE_TTL })

    return NextResponse.json(response)
  } catch (err) {
    console.error('Learning plan generation failed:', err)
    // Return fallback plan
    return NextResponse.json({
      success: true,
      plan: getFallbackPlan(name, chineseName, category, lang)
    })
  }
}

interface SpeciesInput {
  speciesId: string
  name: string
  chineseName: string
  latinName: string
  category: string
  description: string
  appearance: string
  habitat: string
  behavior: string
  lang: string
}

async function generateLearningPlan(input: SpeciesInput) {
  const isZh = input.lang === 'zh'
  const speciesName = isZh ? input.chineseName || input.name : input.name
  const latinPart = input.latinName ? ` (${input.latinName})` : ''

  const prompt = isZh
    ? `你是一位专业的亲子英语启蒙老师。请为${speciesName}${latinPart}这个物种，设计一套7天英语启蒙学习计划。

物种信息：
- 类别：${input.category}
- 外形特征：${input.appearance || '未知'}
- 栖息环境：${input.habitat || '未知'}
- 生活习性：${input.behavior || '未知'}
- 简介：${input.description || '未知'}

请生成以下结构化内容（返回纯JSON，不要markdown包裹）：

{
  "days": [
    {
      "day": 1,
      "title": "认识TA的名字",
      "titleEn": "Meet the Name",
      "theme": "物种名称+基础词汇",
      "vocabulary": [{"word": "butterfly", "pronunciation": "/ˈbʌtəflaɪ/", "meaning": "蝴蝶", "example": "The butterfly is beautiful."}],
      "sentencePatterns": ["This is a/the ...", "I see a ..."],
      "activities": ["观看物种视频并跟读英文名称", "制作物种名称卡片", "在户外寻找并说出英文名"],
      "resources": ["YouTube: ...（搜索关键词）", "B站: ...（搜索关键词）"]
    }
    // ... days 2-7 类似结构
  ],
  "vocabulary": [{"word": "...", "pronunciation": "...", "meaning": "...", "example": "..."}],
  "qaCards": [{"question": "What does it look like?", "answer": "It has ...", "hint": "描述外形特征"}],
  "mindMap": {"text": "${speciesName}", "children": [{"text": "Appearance"}, {"text": "Habitat"}, {"text": "Food"}, {"text": "Fun Facts"}]}
}

要求：
1. 词汇必须与该物种直接相关（不用通用词汇）
2. 句型要简单适合3-8岁儿童
3. 活动要可操作，结合户外观察
4. 每个day有不同的主题（名称→外形→颜色→栖息地→食物→习性→综合复述）
5. vocabulary 总共10-15个
6. qaCards 总共5个
7. mindMap 要完整，覆盖该物种的主要知识点`
    : `You are a professional kids' English teacher. Design a 7-day English learning plan for the species "${input.name}${latinPart}".

Species info:
- Category: ${input.category}
- Appearance: ${input.appearance || 'unknown'}
- Habitat: ${input.habitat || 'unknown'}
- Behavior: ${input.behavior || 'unknown'}
- Description: ${input.description || 'unknown'}

Return PURE JSON (no markdown):
{
  "days": [
    {
      "day": 1,
      "title": "Meet the Name",
      "titleEn": "Meet the Name",
      "theme": "Species name + basic words",
      "vocabulary": [{"word": "butterfly", "pronunciation": "/ˈbʌtəflaɪ/", "meaning": "蝴蝶", "example": "The butterfly is beautiful."}],
      "sentencePatterns": ["This is a/the ...", "I see a ..."],
      "activities": ["Watch a video and repeat the name", "Make name flashcards", "Find and name it outdoors"],
      "resources": ["YouTube search: ..."]
    }
    // ... days 2-7
  ],
  "vocabulary": [{"word": "...", "pronunciation": "...", "meaning": "...", "example": "..."}],
  "qaCards": [{"question": "What does it look like?", "answer": "It has ...", "hint": "Describe appearance"}],
  "mindMap": {"text": "${input.name}", "children": [{"text": "Appearance"}, {"text": "Habitat"}, {"text": "Food"}, {"text": "Fun Facts"}]}
}

Requirements:
1. Vocabulary must be directly related to this species
2. Sentence patterns for ages 3-8
3. Activities should be actionable, involving outdoor observation
4. Each day has a different theme (name→appearance→color→habitat→food→behavior→review)
5. 10-15 vocabulary words total
6. 5 QA cards
7. Mind map should be complete`

  // Call Volcano Engine API
  const apiKey = process.env.VOLCENGINE_API_KEY
  const endpointId = process.env.VOLCENGINE_ENDPOINT_ID

  if (!apiKey || !endpointId) {
    console.log('No Volcano Engine API key, using fallback plan')
    return getFallbackPlan(input.name, input.chineseName, input.category, input.lang)
  }

  const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: endpointId,
      messages: [
        { role: 'system', content: 'You are a professional kids English teacher. Always return valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  })

  if (!response.ok) {
    throw new Error(`Volcano API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''

  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0])
    return {
      speciesId: input.speciesId,
      speciesName: speciesName,
      days: parsed.days || [],
      vocabulary: parsed.vocabulary || [],
      qaCards: parsed.qaCards || [],
      mindMap: parsed.mindMap || null
    }
  }

  throw new Error('Failed to parse AI response')
}

function getFallbackPlan(name: string, chineseName: string, category: string, lang: string) {
  const isZh = lang === 'zh'
  const displayName = isZh ? chineseName || name : name

  const fallbackVocab = getCategoryVocabulary(category, lang)

  // Split vocab across 7 days so each day has different words
  const vocabPerDay = (dayIndex: number, count: number) => {
    const start = (dayIndex * count) % fallbackVocab.length
    const result = []
    for (let i = 0; i < count && i < fallbackVocab.length; i++) {
      result.push(fallbackVocab[(start + i) % fallbackVocab.length])
    }
    // Always include the species name as the first word if not already
    if (!result.some(v => v.word.toLowerCase() === name.toLowerCase())) {
      result.unshift({
        word: name,
        pronunciation: '',
        meaning: chineseName || name,
        example: `This is a ${name.toLowerCase()}.`
      })
    }
    return result.slice(0, count + 1)
  }

  const days = [
    {
      day: 1,
      title: isZh ? `认识${displayName}` : `Meet the ${name}`,
      titleEn: 'Meet the Name',
      theme: isZh ? `${displayName}的英文名+基础词汇` : `${name} name + basic words`,
      vocabulary: vocabPerDay(0, 2),
      sentencePatterns: [isZh ? `This is a ${name.toLowerCase()}.` : `This is a/the ${name.toLowerCase()}.`, isZh ? `I see a ${name.toLowerCase()}.` : `I see a ${name.toLowerCase()}.`],
      activities: isZh
        ? [`学习${displayName}的英文名"${name}"`, '跟读3遍英文名称', `制作"${name}"名称卡片`]
        : [`Learn the name "${name}"`, 'Repeat the English name 3 times', `Make a "${name}" flashcard`],
      resources: [isZh ? `B站搜索：${displayName} 英文` : `YouTube: ${name} for kids`]
    },
    {
      day: 2,
      title: isZh ? `${displayName}的外形` : `${name} Body Parts`,
      titleEn: 'Body Parts',
      theme: isZh ? '身体部位词汇' : 'Body part vocabulary',
      vocabulary: vocabPerDay(1, 3),
      sentencePatterns: [isZh ? `The ${name.toLowerCase()} has...` : `The ${name.toLowerCase()} has ...`, isZh ? `Its ... is ...` : `Its ... is ...`],
      activities: isZh
        ? [`观察${displayName}的图片，指认身体部位`, '跟读身体部位单词', `画一画${displayName}`]
        : [`Look at ${name} images, point to body parts`, 'Repeat body part words', `Draw a ${name.toLowerCase()}`],
      resources: [isZh ? '图集图片' : 'Image gallery']
    },
    {
      day: 3,
      title: isZh ? `${displayName}的颜色` : `${name} Colors & Size`,
      titleEn: 'Colors & Size',
      theme: isZh ? '颜色+大小描述' : 'Colors and size description',
      vocabulary: vocabPerDay(2, 3),
      sentencePatterns: [isZh ? `The ${name.toLowerCase()} is ... color.` : `The ${name.toLowerCase()} is ... (color)`, isZh ? `It is big/small.` : `It is big/small.`],
      activities: isZh
        ? [`说出${displayName}的颜色`, '比较大小', '户外寻找相似颜色']
        : [`Name the colors of the ${name.toLowerCase()}`, 'Compare sizes', 'Find similar colors outdoors'],
      resources: [isZh ? '观察图片' : 'Observe images']
    },
    {
      day: 4,
      title: isZh ? `${displayName}住在哪里` : `Where the ${name} Lives`,
      titleEn: "Where It Lives",
      theme: isZh ? '栖息地+方位词汇' : 'Habitat + location words',
      vocabulary: vocabPerDay(3, 2),
      sentencePatterns: [isZh ? `The ${name.toLowerCase()} lives in...` : `The ${name.toLowerCase()} lives in ...`, isZh ? `它在森林/水里/花园里` : `It lives in the forest/water/garden`],
      activities: isZh
        ? [`了解${displayName}的栖息地`, '学方位词', '画栖息地地图']
        : [`Learn where the ${name.toLowerCase()} lives`, 'Learn location words', 'Draw a habitat map'],
      resources: [isZh ? '科普视频' : 'Educational video']
    },
    {
      day: 5,
      title: isZh ? `${displayName}吃什么` : `What the ${name} Eats`,
      titleEn: 'Food & Growth',
      theme: isZh ? '食物+生长词汇' : 'Food + growth vocabulary',
      vocabulary: vocabPerDay(4, 2),
      sentencePatterns: [isZh ? `The ${name.toLowerCase()} eats...` : `The ${name.toLowerCase()} eats ...`, isZh ? `It needs water/food/sunlight.` : `It needs water/food/sunlight.`],
      activities: isZh
        ? [`了解${displayName}吃什么`, '学相关动词', '角色扮演喂食']
        : [`Learn what the ${name.toLowerCase()} eats`, 'Learn related verbs', 'Role play feeding'],
      resources: [isZh ? '趣味人文故事' : 'Cultural story']
    },
    {
      day: 6,
      title: isZh ? `${displayName}的趣闻` : `${name} Fun Facts`,
      titleEn: 'Fun Facts',
      theme: isZh ? '数字+有趣表达' : 'Numbers + fun expressions',
      vocabulary: vocabPerDay(5, 2),
      sentencePatterns: [isZh ? `Did you know? ${displayName}...` : `Did you know? The ${name.toLowerCase()} ...`, isZh ? `有趣的是...` : `Fun fact: ...`],
      activities: isZh
        ? [`读关于${displayName}的有趣事实`, '记住2个有趣点', '用英文告诉家人']
        : [`Read fun facts about the ${name.toLowerCase()}`, 'Remember 2 fun points', 'Tell family in English'],
      resources: [isZh ? '百科介绍' : 'Wikipedia summary']
    },
    {
      day: 7,
      title: isZh ? `我来介绍${displayName}` : `Introduce the ${name}`,
      titleEn: 'Introduce It',
      theme: isZh ? '综合复述' : 'Comprehensive review',
      vocabulary: vocabPerDay(6, 3),
      sentencePatterns: [isZh ? `This is a ${name.toLowerCase()}. It has/lives/eats...` : `This is a ${name.toLowerCase()}. It has/lives/eats ...`, isZh ? `我喜欢${displayName}因为...` : `I like the ${name.toLowerCase()} because ...`],
      activities: isZh
        ? [`用英文介绍${displayName}`, '录制介绍视频', '和家长一起角色扮演']
        : [`Introduce the ${name.toLowerCase()} in English`, 'Record an intro video', 'Role play with parents'],
      resources: [isZh ? '思维导图' : 'Mind map']
    }
  ]

  return {
    speciesId: name,
    speciesName: displayName,
    days,
    vocabulary: fallbackVocab,
    qaCards: [
      { question: isZh ? `${displayName}是什么颜色的？` : `What color is the ${name.toLowerCase()}?`, answer: '', hint: isZh ? '描述颜色' : 'Describe colors' },
      { question: isZh ? `${displayName}住在哪里？` : `Where does the ${name.toLowerCase()} live?`, answer: '', hint: isZh ? '描述栖息地' : 'Describe habitat' },
      { question: isZh ? `${displayName}吃什么？` : `What does the ${name.toLowerCase()} eat?`, answer: '', hint: isZh ? '描述食物' : 'Describe food' },
      { question: isZh ? `${displayName}有什么特别的地方？` : `What is special about the ${name.toLowerCase()}?`, answer: '', hint: isZh ? '描述有趣特征' : 'Describe fun features' },
      { question: isZh ? `你能用英文介绍${displayName}吗？` : `Can you introduce the ${name.toLowerCase()} in English?`, answer: '', hint: isZh ? '综合复述' : 'Comprehensive review' }
    ],
    mindMap: {
      text: displayName,
      children: [
        { text: isZh ? '外形' : 'Appearance' },
        { text: isZh ? '栖息地' : 'Habitat' },
        { text: isZh ? '食物' : 'Food' },
        { text: isZh ? '有趣事实' : 'Fun Facts' }
      ]
    }
  }
}

function getCategoryVocabulary(category: string, lang: string): Array<{word: string, pronunciation: string, meaning: string, example: string}> {
  const vocabMap: Record<string, Array<{word: string, pronunciation: string, meaning: string, example: string}>> = {
    insect: [
      { word: 'butterfly', pronunciation: '/ˈbʌtəflaɪ/', meaning: '蝴蝶', example: 'The butterfly is beautiful.' },
      { word: 'wings', pronunciation: '/wɪŋz/', meaning: '翅膀', example: 'It has colorful wings.' },
      { word: 'caterpillar', pronunciation: '/ˈkætəpɪlə/', meaning: '毛毛虫', example: 'The caterpillar eats leaves.' },
      { word: 'insect', pronunciation: '/ˈɪnsekt/', meaning: '昆虫', example: 'It is a small insect.' },
      { word: 'pollinate', pronunciation: '/ˈpɒləneɪt/', meaning: '授粉', example: 'Bees pollinate flowers.' },
      { word: 'metamorphosis', pronunciation: '/ˌmetəˈmɔːfəsɪs/', meaning: '变态发育', example: 'Butterflies go through metamorphosis.' }
    ],
    plant: [
      { word: 'flower', pronunciation: '/ˈflaʊə/', meaning: '花', example: 'The flower is pink.' },
      { word: 'leaf', pronunciation: '/liːf/', meaning: '叶子', example: 'The leaf is green.' },
      { word: 'root', pronunciation: '/ruːt/', meaning: '根', example: 'Roots grow underground.' },
      { word: 'grow', pronunciation: '/ɡrəʊ/', meaning: '生长', example: 'Plants grow from seeds.' },
      { word: 'bloom', pronunciation: '/bluːm/', meaning: '开花', example: 'The flower blooms in spring.' }
    ],
    animal: [
      { word: 'fur', pronunciation: '/fɜː/', meaning: '皮毛', example: 'The fox has red fur.' },
      { word: 'paws', pronunciation: '/pɔːz/', meaning: '爪子', example: 'It walks on four paws.' },
      { word: 'habitat', pronunciation: '/ˈhæbɪtæt/', meaning: '栖息地', example: 'Its habitat is the forest.' },
      { word: 'predator', pronunciation: '/ˈpredətə/', meaning: '捕食者', example: 'It is a predator.' },
      { word: 'nocturnal', pronunciation: '/nɒkˈtɜːnl/', meaning: '夜行性的', example: 'Owls are nocturnal.' }
    ],
    marine: [
      { word: 'fish', pronunciation: '/fɪʃ/', meaning: '鱼', example: 'The fish swims fast.' },
      { word: 'coral', pronunciation: '/ˈkɒrəl/', meaning: '珊瑚', example: 'The coral reef is colorful.' },
      { word: 'ocean', pronunciation: '/ˈəʊʃən/', meaning: '海洋', example: 'It lives in the ocean.' },
      { word: 'fin', pronunciation: '/fɪn/', meaning: '鳍', example: 'The fish has a tail fin.' },
      { word: 'gill', pronunciation: '/ɡɪl/', meaning: '鳃', example: 'Fish breathe with gills.' }
    ],
    fungus: [
      { word: 'mushroom', pronunciation: '/ˈmʌʃrʊm/', meaning: '蘑菇', example: 'The mushroom grows in the forest.' },
      { word: 'spore', pronunciation: '/spɔː/', meaning: '孢子', example: 'Mushrooms spread spores.' },
      { word: 'grow', pronunciation: '/ɡrəʊ/', meaning: '生长', example: 'They grow in damp places.' }
    ]
  }

  const vocab = vocabMap[category] || vocabMap.animal

  // Add English meanings for Chinese mode
  if (lang === 'zh') {
    return vocab.map(v => ({
      ...v,
      meaning: v.meaning // already Chinese
    }))
  }

  return vocab
}
