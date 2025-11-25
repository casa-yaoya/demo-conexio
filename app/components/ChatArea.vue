<template>
  <div class="flex h-full flex-col">
    <!-- メッセージエリア -->
    <div ref="messagesContainer" class="flex-1 space-y-4 overflow-y-auto pb-4">
      <div
        v-for="(message, index) in messages"
        :key="index"
        class="flex gap-3"
        :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
      >
        <div
          v-if="message.role === 'assistant'"
          class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200"
        >
          🤖
        </div>
        <div
          class="max-w-[70%] rounded-lg px-4 py-2 text-sm"
          :class="
            message.role === 'user'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-900'
          "
        >
          {{ message.content }}
        </div>
        <div
          v-if="message.role === 'user'"
          class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary"
        >
          👤
        </div>
      </div>

      <div v-if="isLoading" class="flex gap-3">
        <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
          🤖
        </div>
        <div class="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-500">
          入力中...
        </div>
      </div>
    </div>

    <!-- 入力エリア -->
    <div class="border-t border-gray-200 pt-4">
      <div class="flex gap-2">
        <textarea
          v-model="userInput"
          @keydown.enter.prevent="sendMessage"
          rows="3"
          class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="メッセージを入力してください (Enter で送信)"
        />
        <button
          @click="sendMessage"
          :disabled="!userInput.trim() || isLoading"
          class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          送信
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '~/types/roleplay'

const messages = ref<ChatMessage[]>([])
const userInput = ref('')
const isLoading = ref(false)
const messagesContainer = ref<HTMLElement>()

const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return

  const message = userInput.value
  userInput.value = ''

  // ユーザーメッセージを追加
  messages.value.push({
    role: 'user',
    content: message
  })

  isLoading.value = true

  try {
    // TODO: API呼び出しを実装
    const response = await $fetch<{ content: string }>('/api/chat', {
      method: 'POST',
      body: {
        messages: messages.value
      }
    })

    // アシスタントメッセージを追加
    messages.value.push({
      role: 'assistant',
      content: response.content
    })

    // スクロールを一番下へ
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
  } catch (error) {
    console.error('Chat error:', error)
    messages.value.push({
      role: 'assistant',
      content: 'エラーが発生しました。もう一度お試しください。'
    })
  } finally {
    isLoading.value = false
  }
}

// データをグローバルに公開
defineExpose({ messages })
</script>
