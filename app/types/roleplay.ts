// Roleplay design and course management types

export interface FileData {
  name: string
  dataType: string  // 見本データ, 教材データ, 自社データ, 顧客データ, その他, 未分類
  type?: string     // MIME type
  extractedText?: string
  content?: string
  summary?: string
  size: number
  uploadDate: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface RoleplayDesign {
  situation: string
  opponentSetting: string
  missions: {
    required: string[]
    scoring: string[]
    failure: string[]
  }
  points: Point[]
}

export interface Point {
  question: string
  criteria: string
  example: string
}

export interface Category {
  id: string
  name: string
  levels: Level[]
}

export interface Level {
  id: string
  name: string
  categoryId: string
  lessons: Lesson[]
}

export interface Lesson {
  id: string
  name: string
  levelId: string
  categoryId: string
  design?: RoleplayDesign
  scripts?: {
    subtitle?: any
    points?: any
    practice?: any
  }
  systemPrompts?: {
    subtitle?: string
    aiDemo?: string
    confirmation?: string
    practice?: string
  }
}

export interface Course {
  categories: Category[]
}

// Script types for different modes
export interface SubtitleScript {
  type: 'subtitle'
  dialogues: Dialogue[]
}

export interface Dialogue {
  speaker: 'AI' | 'Player'
  text: string
  timing?: number
}

export interface PointsScript {
  type: 'points'
  points: ScriptPoint[]
}

export interface ScriptPoint {
  title: string
  description: string
  example?: string
}

export interface PracticeScript {
  type: 'practice'
  scenario: string
  objectives: string[]
  tips: string[]
}

// ロープレ構築コンテキスト
export interface RoleplayContext {
  files: FileData[]
  goals: string[]
  additionalInfo: string[]
  chatHistory: ChatMessage[]
}
