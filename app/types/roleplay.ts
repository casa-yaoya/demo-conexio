// Roleplay design and course management types

import type { SeparableInfo } from './file'

export interface FileData {
  name: string
  dataType: string  // 対話データ, 商品データ, 教材データ, 顧客データ, その他, 未分類
  type?: string     // MIME type
  extractedText?: string      // 全データ（解析時に保存）
  usedContent?: string        // 利用部分（範囲選択後に設定）
  unusedContent?: string      // 不要部分（範囲選択後に設定）
  content?: string            // 互換性のため維持（usedContentと同じ）
  summary?: string
  size: number
  uploadDate: string
  separable?: SeparableInfo   // 分離可能項目情報
  selectedRange?: string[]    // ユーザーが選択した範囲（「全部」の場合は空配列）
  goals?: string[]            // このファイルに対する求めるゴール
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
  question: string        // 質問テキスト
  criteria: string[]      // 正解基準（リスト）
  correctAnswer: string   // 正答例（口語的な表現）
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
