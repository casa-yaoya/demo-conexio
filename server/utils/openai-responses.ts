/**
 * OpenAI Responses API ユーティリティ
 * エージェント機能を使用したロープレ構築支援
 */

import { getOpenAIClient } from './openai'
import type { Response } from 'openai/resources/responses'

// エージェントの種類
export type AgentType =
  | 'design-assistant'      // ロープレ設計支援エージェント
  | 'script-generator'      // 台本生成エージェント
  | 'content-analyzer'      // コンテンツ分析エージェント

// エージェント設定
export interface AgentConfig {
  instructions: string
  tools?: AgentTool[]
  model?: string
}

// ツールの型定義
export type AgentTool =
  | { type: 'web_search_preview' }
  | { type: 'code_interpreter' }
  | { type: 'file_search' }
  | {
      type: 'function'
      name: string
      description: string
      parameters: Record<string, unknown>
    }

// 会話コンテキスト（マルチターン用）
export interface ConversationContext {
  previousResponseId?: string
}

// レスポンス結果
export interface AgentResponse {
  responseId: string
  content: string
  toolResults?: Array<{
    type: string
    content: string
  }>
}

/**
 * Responses API を使用してエージェントを実行
 */
export async function runAgent(
  agentConfig: AgentConfig,
  input: string | Array<{ role: 'user' | 'assistant'; content: string }>,
  context?: ConversationContext
): Promise<AgentResponse> {
  const openai = getOpenAIClient()

  const requestParams: Parameters<typeof openai.responses.create>[0] = {
    model: agentConfig.model || 'gpt-4.1',
    instructions: agentConfig.instructions,
    input: input,
  }

  // ツールが指定されている場合
  if (agentConfig.tools && agentConfig.tools.length > 0) {
    requestParams.tools = agentConfig.tools
  }

  // 会話継続の場合
  if (context?.previousResponseId) {
    requestParams.previous_response_id = context.previousResponseId
  }

  const response = await openai.responses.create(requestParams)

  // レスポンスからテキストを抽出
  const content = extractResponseText(response)

  // ツール結果を抽出
  const toolResults = extractToolResults(response)

  return {
    responseId: response.id,
    content,
    toolResults
  }
}

/**
 * レスポンスからテキストコンテンツを抽出
 */
function extractResponseText(response: Response): string {
  const textParts: string[] = []

  for (const item of response.output) {
    if (item.type === 'message') {
      for (const content of item.content) {
        if (content.type === 'output_text') {
          textParts.push(content.text)
        }
      }
    }
  }

  return textParts.join('\n')
}

/**
 * レスポンスからツール実行結果を抽出
 */
function extractToolResults(response: Response): Array<{ type: string; content: string }> {
  const results: Array<{ type: string; content: string }> = []

  for (const item of response.output) {
    if (item.type === 'web_search_call') {
      results.push({
        type: 'web_search',
        content: `検索クエリ: ${item.status}`
      })
    }
    // 他のツール結果も必要に応じて追加
  }

  return results
}

/**
 * ストリーミングでエージェントを実行
 */
export async function runAgentStream(
  agentConfig: AgentConfig,
  input: string | Array<{ role: 'user' | 'assistant'; content: string }>,
  onChunk: (chunk: string) => void,
  context?: ConversationContext
): Promise<AgentResponse> {
  const openai = getOpenAIClient()

  const requestParams: Parameters<typeof openai.responses.create>[0] = {
    model: agentConfig.model || 'gpt-4.1',
    instructions: agentConfig.instructions,
    input: input,
    stream: true
  }

  if (agentConfig.tools && agentConfig.tools.length > 0) {
    requestParams.tools = agentConfig.tools
  }

  if (context?.previousResponseId) {
    requestParams.previous_response_id = context.previousResponseId
  }

  const stream = await openai.responses.create(requestParams)

  let responseId = ''
  const contentParts: string[] = []

  for await (const event of stream) {
    if (event.type === 'response.created') {
      responseId = event.response.id
    } else if (event.type === 'response.output_text.delta') {
      onChunk(event.delta)
      contentParts.push(event.delta)
    }
  }

  return {
    responseId,
    content: contentParts.join('')
  }
}
