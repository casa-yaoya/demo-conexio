<template>
  <div class="flex h-full flex-col">
    <!-- タブヘッダー -->
    <div class="flex border-b border-gray-200">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="flex-1 border-b-2 px-4 py-3 text-sm font-medium transition-colors"
        :class="
          activeTab === tab.id
            ? 'border-primary text-primary'
            : 'border-transparent text-gray-600 hover:text-gray-900'
        "
      >
        {{ tab.name }}
      </button>
    </div>

    <!-- タブコンテンツ -->
    <div class="flex-1 overflow-y-auto p-6">
      <!-- 入力データタブ -->
      <div v-if="activeTab === 'input'" class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-secondary">入力データ</h3>
          <button
            @click="clearAllData"
            class="text-xs text-red-600 hover:text-red-700"
          >
            全削除
          </button>
        </div>

        <div v-if="inputData.length === 0" class="py-8 text-center text-sm text-gray-500">
          入力データがありません
        </div>

        <div
          v-for="(file, index) in inputData"
          :key="index"
          class="rounded-lg border border-gray-200 p-4"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-secondary">{{ file.name }}</span>
                <span class="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                  {{ file.dataType }}
                </span>
              </div>
              <p class="mt-2 text-xs text-gray-500">
                {{ formatFileSize(file.size) }} • {{ file.uploadDate }}
              </p>
            </div>
            <button
              @click="deleteFile(index)"
              class="text-gray-400 hover:text-red-500"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      <!-- 会話の流れタブ -->
      <div v-if="activeTab === 'script'" class="space-y-4">
        <h3 class="text-sm font-semibold text-secondary">会話の流れ</h3>

        <div v-if="scripts.length === 0" class="py-8 text-center text-sm text-gray-500">
          台本が生成されていません
        </div>

        <div
          v-for="(script, index) in scripts"
          :key="index"
          class="rounded-lg border border-gray-200 p-4"
        >
          <div class="mb-2 flex items-center justify-between">
            <span class="text-sm font-semibold text-secondary">{{ script.mode }}</span>
            <button class="text-xs text-primary hover:text-primary-hover">
              編集
            </button>
          </div>
          <pre class="mt-2 whitespace-pre-wrap text-xs text-gray-700">{{ script.content }}</pre>
        </div>
      </div>

      <!-- 設計書タブ -->
      <div v-if="activeTab === 'config'" class="space-y-4">
        <h3 class="text-sm font-semibold text-secondary">設計書</h3>

        <div v-if="systemPrompts.length === 0" class="py-8 text-center text-sm text-gray-500">
          システムプロンプトが生成されていません
        </div>

        <div
          v-for="(prompt, index) in systemPrompts"
          :key="index"
          class="rounded-lg border border-gray-200 p-4"
        >
          <div class="mb-2 flex items-center justify-between">
            <span class="text-sm font-semibold text-secondary">{{ prompt.mode }}</span>
            <button class="text-xs text-primary hover:text-primary-hover">
              編集
            </button>
          </div>
          <pre class="mt-2 whitespace-pre-wrap text-xs text-gray-700">{{ prompt.content }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FileData } from '~/types/roleplay'

const tabs = [
  { id: 'input', name: '入力データ' },
  { id: 'script', name: '会話の流れ' },
  { id: 'config', name: '設計書' }
]

const activeTab = ref('input')
const inputData = ref<FileData[]>([])
const scripts = ref<Array<{ mode: string; content: string }>>([])
const systemPrompts = ref<Array<{ mode: string; content: string }>>([])

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  return (bytes / 1024 / 1024 / 1024).toFixed(1) + ' GB'
}

const clearAllData = () => {
  if (confirm('全ての入力データを削除しますか?')) {
    inputData.value = []
  }
}

const deleteFile = (index: number) => {
  if (confirm('このファイルを削除しますか?')) {
    inputData.value.splice(index, 1)
  }
}

// データをグローバルに公開
defineExpose({ inputData, scripts, systemPrompts })
</script>
