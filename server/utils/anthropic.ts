import Anthropic from '@anthropic-ai/sdk'

let anthropicClient: Anthropic | null = null

export function getAnthropicClient() {
  if (!anthropicClient) {
    const config = useRuntimeConfig()
    anthropicClient = new Anthropic({
      apiKey: config.anthropicApiKey
    })
  }
  return anthropicClient
}
