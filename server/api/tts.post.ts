// Text-to-Speech API endpoint
// 処理ID: API-AUDIO-002

import { getOpenAIClient } from '../utils/openai'

interface TTSRequest {
  text: string
  voice?: 'alloy' | 'echo' | 'shimmer' | 'ash' | 'ballad' | 'coral' | 'sage' | 'verse'
  speed?: number
}

export default defineEventHandler(async (event) => {
  const body = await readBody<TTSRequest>(event)
  const { text, voice = 'alloy', speed = 1.0 } = body

  if (!text) {
    throw createError({
      statusCode: 400,
      statusMessage: 'テキストが必要です'
    })
  }

  // Limit text length to prevent excessive API usage
  if (text.length > 4096) {
    throw createError({
      statusCode: 400,
      statusMessage: 'テキストは4096文字以下にしてください'
    })
  }

  try {
    const openai = getOpenAIClient()

    console.log(`🔊 TTS API called: ${text.substring(0, 50)}...`)

    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice,
      input: text,
      speed: speed,
      response_format: 'mp3'
    })

    // Get the audio data as ArrayBuffer
    const audioBuffer = await response.arrayBuffer()

    console.log('✅ TTS generation complete')

    // Return audio as binary response
    setHeader(event, 'Content-Type', 'audio/mpeg')
    setHeader(event, 'Content-Disposition', 'inline; filename="speech.mp3"')

    return Buffer.from(audioBuffer)
  } catch (error: any) {
    console.error('TTS API Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: '音声生成中にエラーが発生しました',
      message: error.message
    })
  }
})
