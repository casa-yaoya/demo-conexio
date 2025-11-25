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
  dataType: 'image' | 'pdf' | 'excel' | 'word' | 'text'
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
