import type { AgentRequest, AgentResponse, AgentContext } from '~/types/agent'
import { getAnthropicClient } from '../utils/anthropic'
import { loadPrompt } from '../utils/prompt'

export default defineEventHandler(async (event): Promise<AgentResponse> => {
  const body = await readBody<AgentRequest>(event)
  const { agent, context } = body

  if (!agent || !context) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Agent and context are required'
    })
  }

  console.log(`🤖 Processing agent request: ${agent}`)

  try {
    switch (agent) {
      case 'roleplay-support':
        return await processRoleplaySupportAgent(context)

      case 'script-generation-subtitle':
      case 'script-generation-points':
      case 'script-generation-practice':
        return await processScriptGenerationAgent(agent, context)

      case 'system-prompt-subtitle':
      case 'system-prompt-aiDemo':
      case 'system-prompt-confirmation':
      case 'system-prompt-practice':
        return await processSystemPromptAgent(agent, context)

      case 'feedback':
        return await processFeedbackAgent(context)

      default:
        throw createError({
          statusCode: 400,
          statusMessage: `Unknown agent: ${agent}`
        })
    }
  } catch (error: any) {
    console.error('Agent API Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
      message: error.message
    })
  }
})

// Roleplay Support Agent
async function processRoleplaySupportAgent(context: AgentContext): Promise<AgentResponse> {
  const { userInput, files = [], currentDesign, prompt } = context
  const anthropic = getAnthropicClient()

  const systemPrompt = prompt || await loadPrompt('roleplay-support-agent')

  const userMessage = `
ユーザー入力: ${userInput}

現在のロープレ設計:
${JSON.stringify(currentDesign, null, 2)}

添付ファイル:
${files.map(f => `- ${f.name}: ${f.summary || '要約なし'}`).join('\n')}

上記の情報を元に、ロープレ設計を更新し、ユーザーに返答してください。
  `

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: userMessage
    }]
  })

  const responseText = response.content[0].type === 'text' ? response.content[0].text : ''

  return {
    response: responseText,
    updatedDesign: currentDesign
  }
}

// Script Generation Agent
async function processScriptGenerationAgent(agent: string, context: AgentContext): Promise<AgentResponse> {
  const { roleplayDesign, files = [], prompt } = context
  const mode = agent.split('-').pop() || ''
  const anthropic = getAnthropicClient()

  const systemPrompt = prompt || await loadPrompt(`script-generation-${mode}`)

  const userMessage = `
ロープレ設計:
${JSON.stringify(roleplayDesign, null, 2)}

添付ファイル:
${files.map(f => `- ${f.name}: ${f.content || '内容なし'}`).join('\n')}

上記の情報を元に、${mode}モード用の台本を生成してください。
  `

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: userMessage
    }]
  })

  const scriptText = response.content[0].type === 'text' ? response.content[0].text : ''

  return {
    mode,
    script: scriptText
  }
}

// System Prompt Agent
async function processSystemPromptAgent(agent: string, context: AgentContext): Promise<AgentResponse> {
  const { roleplayDesign, script, files = [], prompt } = context
  const mode = agent.split('-').pop() || ''
  const anthropic = getAnthropicClient()

  const systemPrompt = prompt || await loadPrompt(`system-prompt-${mode}-mode`)

  const userMessage = `
ロープレ設計:
${JSON.stringify(roleplayDesign, null, 2)}

生成された台本:
${script}

添付ファイル:
${files.map(f => `- ${f.name}: ${f.content || '内容なし'}`).join('\n')}

上記の情報を元に、${mode}モード用のシステムプロンプトを生成してください。
  `

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: userMessage
    }]
  })

  const promptText = response.content[0].type === 'text' ? response.content[0].text : ''

  return {
    mode,
    systemPrompt: promptText
  }
}

// Feedback Agent
async function processFeedbackAgent(context: AgentContext): Promise<AgentResponse> {
  const { roleplayDesign, conversationLog, mode, prompt } = context
  const anthropic = getAnthropicClient()

  const systemPrompt = prompt || await loadPrompt('feedback-prompt')

  const userMessage = `
ロープレ設計のポイント:
${JSON.stringify(roleplayDesign?.points, null, 2)}

モード: ${mode}

会話ログ:
${conversationLog}

上記の会話を評価し、100点満点で採点してください。
  `

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: userMessage
    }]
  })

  const feedbackText = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const jsonMatch = feedbackText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    return {
      totalScore: 0,
      feedback: feedbackText
    }
  } catch (error) {
    console.error('Error parsing feedback JSON:', error)
    return {
      totalScore: 0,
      feedback: feedbackText
    }
  }
}
