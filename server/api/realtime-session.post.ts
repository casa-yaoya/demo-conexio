export default defineEventHandler(async (event) => {
  try {
    console.log('🔑 エフェメラルキーを取得します...')
    const config = useRuntimeConfig()

    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'alloy'
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ エフェメラルキー取得エラー:', errorText)
      throw createError({
        statusCode: response.status,
        statusMessage: 'エフェメラルキーの取得に失敗しました',
        message: errorText
      })
    }

    const data = await response.json()
    console.log('✅ エフェメラルキー取得成功')

    const wsUrl = `wss://api.openai.com/v1/realtime?model=${data.model}`

    return {
      url: wsUrl,
      client_secret: data.client_secret.value
    }
  } catch (error: any) {
    console.error('Realtime Session Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'セッション作成中にエラーが発生しました',
      message: error.message
    })
  }
})
