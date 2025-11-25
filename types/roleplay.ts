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

export interface AgentContext {
  userInput?: string
  files?: FileData[]
  currentDesign?: RoleplayDesign
  roleplayDesign?: RoleplayDesign
  script?: string
  conversationLog?: string
  mode?: string
  prompt?: string
  messages?: ChatMessage[]
}

export interface AgentResponse {
  response?: string
  updatedDesign?: RoleplayDesign
  mode?: string
  script?: string
  systemPrompt?: string
  content?: string
  totalScore?: number
  feedback?: string
}
