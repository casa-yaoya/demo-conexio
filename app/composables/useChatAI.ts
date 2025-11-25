// Chat AI Support composable
// ロープレ構築のためのチャットAIサポート機能

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export interface ChatSuggestion {
  icon: string
  text: string
}

export const useChatAI = () => {
  // Chat state
  const messages = ref<ChatMessage[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Conversation history for context
  const conversationHistory = ref<Array<{ role: string; content: string }>>([])

  // Default suggestions
  const suggestions: ChatSuggestion[] = [
    { icon: '🎧', text: 'ヒアリングの練習をしたい' },
    { icon: '🤝', text: 'クロージングの練習をしたい' },
    { icon: '💼', text: 'プレゼンテーションの練習をしたい' }
  ]

  // Add a message to the chat
  const addMessage = (role: ChatMessage['role'], content: string): string => {
    const id = `msg-${Date.now()}`
    messages.value.push({
      id,
      role,
      content,
      timestamp: new Date()
    })
    return id
  }

  // Remove a message by ID
  const removeMessage = (id: string) => {
    const index = messages.value.findIndex(m => m.id === id)
    if (index !== -1) {
      messages.value.splice(index, 1)
    }
  }

  // Update a message content by ID
  const updateMessage = (id: string, content: string) => {
    const message = messages.value.find(m => m.id === id)
    if (message) {
      message.content = content
    }
  }

  // Send message to Claude API
  const sendMessage = async (
    userMessage: string,
    uploadedFiles?: Array<{ name: string; type: string; content?: string }>,
    roleplayDesign?: any
  ): Promise<string> => {
    if (!userMessage.trim()) return ''

    isLoading.value = true
    error.value = null

    // Add user message
    addMessage('user', userMessage)

    // Add to conversation history
    conversationHistory.value.push({
      role: 'user',
      content: userMessage
    })

    // Add loading message
    const loadingId = addMessage('assistant', '考え中...')

    try {
      // Build system prompt for roleplay assistance
      const systemPrompt = buildSystemPrompt(uploadedFiles, roleplayDesign)

      // Call the chat API
      const response = await $fetch('/api/chat', {
        method: 'POST',
        body: {
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.value
          ]
        }
      })

      const assistantMessage = (response as any).content || (response as any).message || ''

      // Update loading message with actual response
      updateMessage(loadingId, assistantMessage)

      // Add to conversation history
      conversationHistory.value.push({
        role: 'assistant',
        content: assistantMessage
      })

      return assistantMessage
    } catch (err: any) {
      const errorMessage = `エラーが発生しました: ${err.message || 'Unknown error'}\n\n再度お試しいただくか、別の質問をしてください。`
      updateMessage(loadingId, errorMessage)
      error.value = err.message
      return errorMessage
    } finally {
      isLoading.value = false
    }
  }

  // Build system prompt based on context
  const buildSystemPrompt = (
    uploadedFiles?: Array<{ name: string; type: string; content?: string }>,
    roleplayDesign?: any
  ): string => {
    let prompt = `あなたは研修コンテンツ制作のアシスタントです。ユーザーがロープレ（ロールプレイ）研修のシナリオを作成するお手伝いをします。

主な役割:
1. ロープレのシチュエーション設計のアドバイス
2. 会話シナリオの提案
3. 評価基準の設定支援
4. 研修効果を高めるためのヒント提供

ユーザーの質問に対して、具体的で実践的なアドバイスを提供してください。`

    // Add uploaded files context
    if (uploadedFiles && uploadedFiles.length > 0) {
      prompt += `\n\n【アップロードされたファイル】\n`
      uploadedFiles.forEach(file => {
        prompt += `- ${file.name} (${file.type})\n`
        if (file.content) {
          prompt += `  内容: ${file.content.substring(0, 500)}...\n`
        }
      })
    }

    // Add roleplay design context
    if (roleplayDesign && roleplayDesign.situation) {
      prompt += `\n\n【現在のロープレ設計】\n`
      prompt += `シチュエーション: ${roleplayDesign.situation}\n`
      if (roleplayDesign.opponentSetting) {
        prompt += `相手の設定: ${roleplayDesign.opponentSetting}\n`
      }
      if (roleplayDesign.missions) {
        prompt += `ミッション（必須）: ${roleplayDesign.missions.required?.join(', ') || 'なし'}\n`
        prompt += `ミッション（採点）: ${roleplayDesign.missions.scoring?.join(', ') || 'なし'}\n`
        prompt += `ミッション（失敗）: ${roleplayDesign.missions.failure?.join(', ') || 'なし'}\n`
      }
    }

    return prompt
  }

  // Clear chat history
  const clearChat = () => {
    messages.value = []
    conversationHistory.value = []
    error.value = null
  }

  // Get chat history as formatted string (for generation)
  const getChatHistoryString = (): string => {
    return messages.value
      .filter(m => m.role !== 'system')
      .map(m => `${m.role === 'user' ? 'ユーザー' : 'AI'}: ${m.content}`)
      .join('\n')
  }

  return {
    messages: readonly(messages),
    isLoading: readonly(isLoading),
    error: readonly(error),
    suggestions,
    sendMessage,
    addMessage,
    removeMessage,
    updateMessage,
    clearChat,
    getChatHistoryString
  }
}
