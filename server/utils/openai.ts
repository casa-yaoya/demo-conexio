import OpenAI from 'openai'

export function getOpenAIClient(): OpenAI {
  const config = useRuntimeConfig()
  const apiKey = config.openaiApiKey || process.env.NUXT_OPENAI_API_KEY || ''

  if (!apiKey) {
    console.error('OpenAI API key is not configured')
  }

  return new OpenAI({
    apiKey
  })
}
