/**
 * エージェントチャット API - Responses API を使用
 * 処理ID: API-AGENT-001
 */

import type { ChatMessage } from '~/types/roleplay'
import { runAgent, type AgentConfig, type AgentTool } from '../../utils/openai-responses'
import { loadPrompt } from '../../utils/prompt'

interface AgentChatRequest {
  messages: ChatMessage[]
  agentType: 'design-assistant' | 'script-generator' | 'content-analyzer'
  currentDesign?: any
  files?: Array<{ name: string; summary?: string; content?: string }>
  previousResponseId?: string
  enableWebSearch?: boolean
}

export default defineEventHandler(async (event) => {
  const body = await readBody<AgentChatRequest>(event)
  const {
    messages,
    agentType = 'design-assistant',
    currentDesign,
    files = [],
    previousResponseId,
    enableWebSearch = false
  } = body

  if (!messages || !Array.isArray(messages)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'messages配列が必要です'
    })
  }

  try {
    // エージェント用プロンプトを読み込み
    let instructions = await loadPrompt(`agent-${agentType}`)

    // フォールバック
    if (!instructions) {
      instructions = getDefaultInstructions(agentType)
    }

    // コンテキスト情報を追加
    if (currentDesign && Object.keys(currentDesign).length > 0) {
      instructions += `\n\n## 現在のロープレ設計\n${JSON.stringify(currentDesign, null, 2)}`
    }
    if (files.length > 0) {
      instructions += `\n\n## アップロードされたファイル\n${files.map(f => `- ${f.name}: ${f.summary || f.content || '内容なし'}`).join('\n')}`
    }

    // ツールの設定
    const tools: AgentTool[] = []
    if (enableWebSearch) {
      tools.push({ type: 'web_search_preview' })
    }

    // エージェント設定
    const agentConfig: AgentConfig = {
      instructions,
      tools: tools.length > 0 ? tools : undefined,
      model: 'gpt-4.1'
    }

    // メッセージを Responses API 形式に変換
    const input = messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }))

    // エージェントを実行
    const response = await runAgent(
      agentConfig,
      input,
      previousResponseId ? { previousResponseId } : undefined
    )

    return {
      content: response.content,
      responseId: response.responseId,
      toolResults: response.toolResults
    }
  } catch (error: any) {
    console.error('Agent Chat API Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'エージェント処理中にエラーが発生しました',
      message: error.message
    })
  }
})

/**
 * デフォルトの instructions を取得
 */
function getDefaultInstructions(agentType: string): string {
  switch (agentType) {
    case 'design-assistant':
      return `あなたはロープレ（ロールプレイング）学習コンテンツを作成するアシスタントです。
ユーザーの要望を聞いて、効果的なロープレ設計を支援してください。`

    case 'script-generator':
      return `あなたはロープレ用の台本を生成するアシスタントです。
与えられた設計に基づいて、効果的な学習台本を作成してください。`

    case 'content-analyzer':
      return `あなたは研修資料を分析するアシスタントです。
アップロードされたファイルから、ロープレ設計に活用できる情報を抽出してください。`

    default:
      return `あなたはAIアシスタントです。ユーザーをサポートしてください。`
  }
}
