// Species identification result
export interface SpeciesResult {
  success: boolean
  species?: Species
  confidence?: number
  error?: string
}

export interface Species {
  id: string
  name: string
  chineseName: string
  latinName?: string
  category: 'insect' | 'plant' | 'animal' | 'marine' | 'fungus'
  confidence: number
  classification?: Classification
  description?: string
  // Encyclopedia sections
  nameOrigin?: string       // 名字由来
  appearance?: string       // 外形特征
  habitat?: string          // 栖息环境
  behavior?: string         // 生活习性
  distribution?: string     // 分布范围
  reproduction?: string     // 繁殖方式/生长周期
  wikiUrl?: string          // Wikipedia链接
  images?: SpeciesImage[]
  videos?: Video[]
  lifecycle?: LifecycleStage[]
  stories?: SpeciesStory
  locale?: string
}

export interface Classification {
  kingdom?: string
  phylum?: string
  class?: string
  order?: string
  family?: string
  genus?: string
  species?: string
}

export interface SpeciesImage {
  id: string
  url: string
  credit?: string
  license?: string
}

export interface Video {
  id: string
  title: string
  thumbnail?: string
  youtubeId?: string
  url?: string
  language: 'zh' | 'en'
  channelTitle?: string
  notice?: string
}

export interface LifecycleStage {
  stage: string
  imageUrl?: string
  description?: string
}

export interface SpeciesStory {
  zh?: StoryContent
  en?: StoryContent
}

export interface StoryContent {
  title: string
  content: string
  source?: string
}

// Learning Plan
export interface LearningPlan {
  speciesId: string
  speciesName: string
  days: LearningDay[]
  vocabulary: VocabWord[]
  questions: QACard[]
  mindmapData?: MindmapNode
}

export interface LearningDay {
  day: number
  title: string
  titleEn: string
  theme?: string
  activities: string[]
  resources: string[]
  sentencePatterns?: string[]
  vocabulary?: VocabWord[]
  completed: boolean
}

export interface VocabWord {
  word: string
  pronunciation?: string
  meaning: string
  example?: string
}

export interface QACard {
  question: string
  answer?: string
  hint?: string
}

export interface MindmapNode {
  text: string
  children?: MindmapNode[]
}

// Journal Record
export interface JournalRecord {
  id: string
  imageUrl: string
  thumbnailUrl?: string
  species: Species
  location?: GeoLocation
  timestamp: number
  learningPlan?: LearningPlan
  learningProgress?: (boolean | number)[]
  badges?: string[]
  shareImageUrl?: string
}

export interface GeoLocation {
  latitude: number
  longitude: number
  name?: string
}

// API Response types
export interface IdentifyResponse {
  success: boolean
  species?: Species
  confidence?: number
  source?: string
  error?: string
}

export interface ImagesResponse {
  success: boolean
  images: SpeciesImage[]
  source: string
}

export interface VideosResponse {
  success: boolean
  videos: Video[]
  cached?: boolean
}
