import type { ChatMessage } from '~/types/roleplay'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ messages: ChatMessage[] }>(event)
  const { messages } = body

  if (!messages || !Array.isArray(messages)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'messages配列が必要です'
    })
  }

  try {
    const openai = getOpenAIClient()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages as any,
      temperature: 0.7,
    })

    return {
      content: completion.choices[0].message.content
    }
  } catch (error: any) {
    console.error('Chat API Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'チャット処理中にエラーが発生しました',
      message: error.message
    })
  }
})
