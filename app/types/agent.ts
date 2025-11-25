// AI Agent types and interfaces
import type { RoleplayDesign } from './roleplay'
import type { UploadedFile } from './file'

export interface AgentContext {
  userInput?: string
  files?: UploadedFile[]
  currentDesign?: RoleplayDesign
  roleplayDesign?: RoleplayDesign
  script?: any
  conversationLog?: ConversationMessage[]
  mode?: string
  prompt?: string
}

export interface AgentResponse {
  message?: string
  response?: string
  updatedDesign?: RoleplayDesign
  scripts?: RoleplayScripts
  systemPrompts?: SystemPrompts
  feedback?: FeedbackResult
  error?: string
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: Date
}

export interface RoleplayScripts {
  subtitle?: any
  points?: any
  practice?: any
}

export interface SystemPrompts {
  subtitle?: string
  aiDemo?: string
  confirmation?: string
  practice?: string
}

export interface FeedbackResult {
  score: number
  feedback: string
  achievements: string[]
  improvements: string[]
}

export type AgentType =
  | 'roleplay-support'
  | 'script-generation-subtitle'
  | 'script-generation-points'
  | 'script-generation-practice'
  | 'system-prompt-subtitle'
  | 'system-prompt-aiDemo'
  | 'system-prompt-confirmation'
  | 'system-prompt-practice'
  | 'feedback'

export interface AgentRequest {
  agent: AgentType
  context: AgentContext
}
