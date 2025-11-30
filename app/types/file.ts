// File upload and parsing types

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  dataType: 'textbook' | 'roleplay' | 'other'
  extractedText: string
  uploadedAt: Date
  url?: string
  separable?: SeparableInfo  // 分離可能項目情報
  selectedRange?: string[]   // ユーザーが選択した範囲
}

// 分離可能な項目の種類
export type SeparableItemType = 'page' | 'sheet' | 'slide' | 'section'

// 分離可能な項目
export interface SeparableItem {
  type: SeparableItemType
  value: string | number  // ページ番号やタブ名
  label: string           // 表示用ラベル
}

// 分離可能項目情報
export interface SeparableInfo {
  type: SeparableItemType
  isNumeric: boolean       // 数字で指定可能か（ページ数など）
  items: SeparableItem[]   // 具体的な項目リスト（タブ名など）
  totalCount?: number      // 総数（ページ数など）
}

export interface FileParseResult {
  success: boolean
  text: string
  error?: string
  metadata?: {
    pageCount?: number
    sheets?: string[]
    slides?: string[]
    duration?: number
    [key: string]: any
  }
  separable?: SeparableInfo  // 分離可能項目情報
}

export interface FileUploadRequest {
  file: File
  dataType?: string
}

export interface FileUploadResponse {
  success: boolean
  file?: UploadedFile
  error?: string
}
