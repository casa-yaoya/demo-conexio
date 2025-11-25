<template>
  <div class="cc-chat-component">
    <div class="cc-ai-chat-component">
      <!-- チャットメッセージエリア -->
      <div ref="messagesContainer" class="cc-chat-messages">
        <!-- ドラッグ&ドロップエリア（初期表示） - 親コンポーネントで処理するため無効化 -->
        <div v-if="messages.length === 0" class="cc-chat-dropzone">
          <div class="cc-dropzone-icon">📁</div>
          <div class="cc-dropzone-text">
            ファイルをアップロードするか、<br>
            テキスト入力で構築を開始。<br>
            ドラッグ&ドロップも可<br>
            <span class="cc-dropzone-hint">推奨データ：PDF, EXCEL, 録音, 録画</span>
          </div>
        </div>

        <!-- メッセージ一覧 -->
        <template v-else>
          <div
            v-for="(message, index) in messages"
            :key="index"
            class="cc-message"
            :class="message.role === 'user' ? 'user' : 'ai'"
          >
            <div class="cc-message-avatar">
              {{ message.role === 'user' ? '👤' : '' }}
              <NaretoreLogo v-if="message.role === 'assistant'" class="w-8 h-8" />
            </div>
            <div class="cc-message-bubble" v-html="message.content"></div>
          </div>
        </template>

        <div v-if="isLoading" class="cc-message ai">
          <div class="cc-message-avatar">
            <NaretoreLogo class="w-8 h-8" />
          </div>
          <div class="cc-message-bubble">
            入力中...
          </div>
        </div>

        <!-- サジェスションボタン -->
        <div v-if="suggestions.length > 0" class="cc-chat-suggestions">
          <button
            v-for="(suggestion, index) in suggestions"
            :key="index"
            class="cc-chat-suggestion-btn"
            @click="handleSuggestionClick(suggestion)"
          >
            {{ suggestion.label }}
          </button>
        </div>
      </div>

      <!-- チャット入力エリア -->
      <div class="cc-chat-input-area">
        <textarea
          v-model="userInput"
          class="cc-textarea"
          placeholder="メッセージを入力..."
          @keydown.enter.exact.prevent="sendMessage"
          rows="1"
        ></textarea>
        <div class="cc-button-group">
          <button class="cc-button cc-button-secondary" @click="attachFile">
            📎 ファイルを添付
          </button>
          <button class="cc-button cc-button-primary" @click="sendMessage">
            送信
          </button>
        </div>
        <div class="cc-roleplay-generate-wrapper">
          <button class="cc-button cc-button-generate" @click="openFileSelectionDialog">
            🎭 ロープレ生成
          </button>
        </div>
      </div>
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept=".txt,.pdf,.ppt,.pptx,.xlsx,.xls,.mp3,.wav,.mp4,.mov"
      style="display: none"
      @change="handleFileSelect"
    >
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage, FileData } from '~/types/roleplay'

const emit = defineEmits<{
  'file-uploaded': [file: FileData]
  'open-file-selection': []
  'file-upload-started': [file: FileData]
  'file-type-updated': [data: { fileName: string; dataType: string }]
}>()

interface Suggestion {
  label: string
  action: string
  value?: string
}

const messages = ref<ChatMessage[]>([])
const userInput = ref('')
const isLoading = ref(false)
const messagesContainer = ref<HTMLElement>()
const fileInput = ref<HTMLInputElement>()
const suggestions = ref<Suggestion[]>([])
const pendingFile = ref<File | null>(null)
const uploadProgress = ref(0)
const isAnalyzing = ref(false)
const analysisMessageIndex = ref(-1)

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

    scrollToBottom()
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

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const attachFile = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    handleFile(file)
  }
  // Reset input
  target.value = ''
}

const handleDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files[0]
  if (file) {
    handleFile(file)
  }
}

const handleFile = async (file: File) => {
  pendingFile.value = file

  // ファイルメッセージを追加
  const fileSize = formatFileSize(file.size)
  messages.value.push({
    role: 'user',
    content: `<div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 20px;">📎</span>
      <div>
        <div style="font-weight: 600;">${file.name}</div>
        <div style="font-size: 12px; opacity: 0.8;">${fileSize}</div>
      </div>
    </div>`
  })

  // 解析中メッセージを追加（進捗付き）
  isAnalyzing.value = true
  uploadProgress.value = 0
  analysisMessageIndex.value = messages.value.length
  messages.value.push({
    role: 'assistant',
    content: getAnalysisProgressHtml(0)
  })

  scrollToBottom()

  // ファイルを即時アップロード開始（タイプは後で設定）
  const fileData: FileData = {
    name: file.name,
    size: file.size,
    type: file.type,
    dataType: '未分類',
    uploadDate: new Date().toLocaleDateString('ja-JP'),
    extractedText: ''
  }

  // アップロード開始を通知
  emit('file-upload-started', fileData)

  // 解析をシミュレート（実際はAPIを呼び出す）
  await simulateFileAnalysis(file, fileData)
}

const getAnalysisProgressHtml = (progress: number) => {
  const progressBar = `
    <div style="margin-top: 8px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span>解析中...</span>
        <span>${progress}%</span>
      </div>
      <div style="background: #e5e7eb; border-radius: 4px; height: 8px; overflow: hidden;">
        <div style="background: #3b82f6; height: 100%; width: ${progress}%; transition: width 0.3s;"></div>
      </div>
    </div>
  `
  return `ファイルをアップロードしています...${progressBar}`
}

const simulateFileAnalysis = async (file: File, fileData: FileData) => {
  // 進捗を更新しながら解析をシミュレート
  const steps = [10, 25, 40, 55, 70, 85, 95, 100]

  for (const progress of steps) {
    await new Promise(resolve => setTimeout(resolve, 300))
    uploadProgress.value = progress

    if (analysisMessageIndex.value >= 0 && analysisMessageIndex.value < messages.value.length) {
      if (progress < 100) {
        messages.value[analysisMessageIndex.value].content = getAnalysisProgressHtml(progress)
      }
    }
  }

  // 解析完了
  isAnalyzing.value = false

  // ダミーの抽出テキストを生成
  fileData.extractedText = generateDummyExtractedText(file.name)

  // 完了メッセージを表示
  if (analysisMessageIndex.value >= 0 && analysisMessageIndex.value < messages.value.length) {
    messages.value[analysisMessageIndex.value].content = `
      <div>
        <div style="color: #10b981; font-weight: 600; margin-bottom: 8px;">✓ 解析完了</div>
        <div>「${file.name}」の解析が完了しました。</div>
        <div style="margin-top: 8px; padding: 8px 12px; background: #f0fdf4; border-radius: 6px; border-left: 3px solid #10b981;">
          ファイルタブから確認できます。
        </div>
        <div style="margin-top: 12px;">このファイルはどのタイプのデータですか？</div>
      </div>
    `
  }

  // ファイルアップロード完了を通知
  emit('file-uploaded', fileData)

  // サジェスションを表示（タイプ選択）
  suggestions.value = [
    { label: '📖 見本データ（商談や接客の正解例）', action: 'selectFileType', value: 'sample' },
    { label: '📚 教材データ（学ばせたい内容の資料）', action: 'selectFileType', value: 'material' },
    { label: '🏢 自社データ（商品情報や会社概要）', action: 'selectFileType', value: 'company' },
    { label: '👥 顧客データ（想定顧客やペルソナ）', action: 'selectFileType', value: 'customer' },
    { label: '📄 その他', action: 'selectFileType', value: 'other' }
  ]

  scrollToBottom()
}

const generateDummyExtractedText = (fileName: string): string => {
  // ファイル名に基づいてダミーテキストを生成
  if (fileName.includes('営業') || fileName.includes('sales')) {
    return `【営業トーク資料】

■ 導入フェーズ
お世話になっております。○○株式会社の△△と申します。
本日はお時間をいただきありがとうございます。

■ ヒアリングフェーズ
現在の課題について、もう少し詳しくお聞かせいただけますでしょうか？
特に○○の部分で困っていらっしゃることはございますか？

■ 提案フェーズ
お伺いした課題に対して、弊社のサービスでは以下のような解決策をご提案できます...`
  }

  return `【抽出されたテキスト】

ファイル: ${fileName}

このファイルから以下の内容が抽出されました。

・セクション1: 概要説明
  ファイルの主要な内容についての説明が含まれています。

・セクション2: 詳細情報
  詳細なデータや情報が記載されています。

・セクション3: まとめ
  全体のまとめと結論が記載されています。

※ 実際の運用ではAIがファイルの内容を解析し、適切なテキストを抽出します。`
}

const handleSuggestionClick = (suggestion: Suggestion) => {
  if (suggestion.action === 'selectFileType' && pendingFile.value) {
    const file = pendingFile.value
    const dataTypeLabels: Record<string, string> = {
      'sample': '見本データ',
      'material': '教材データ',
      'company': '自社データ',
      'customer': '顧客データ',
      'other': 'その他'
    }

    // ユーザーの選択を追加
    messages.value.push({
      role: 'user',
      content: dataTypeLabels[suggestion.value || 'other']
    })

    // AIの確認メッセージ
    messages.value.push({
      role: 'assistant',
      content: `承知しました。「${file.name}」を<strong>${dataTypeLabels[suggestion.value || 'other']}</strong>として登録しました。`
    })

    // ファイルのタイプを更新するイベントを発行
    emit('file-type-updated', {
      fileName: file.name,
      dataType: dataTypeLabels[suggestion.value || 'other']
    })

    // サジェスションをクリア
    suggestions.value = []
    pendingFile.value = null

    scrollToBottom()
  }
}

const openFileSelectionDialog = () => {
  emit('open-file-selection')
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// 外部からドロップされたファイルを処理
const handleDroppedFile = (file: File) => {
  handleFile(file)
}

// データをグローバルに公開
defineExpose({ messages, handleDroppedFile })
</script>

<style scoped>
.cc-message {
  display: flex;
  gap: 12px;
  padding: 8px 0;
}

.cc-message.user {
  flex-direction: row-reverse;
}

.cc-message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.cc-message.user .cc-message-avatar {
  background: #3b82f6;
  color: white;
}

.cc-message.ai .cc-message-avatar {
  background: #f3f4f6;
}

.cc-message-bubble {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
}

.cc-message.user .cc-message-bubble {
  background: #3b82f6;
  color: white;
  border-bottom-right-radius: 4px;
}

.cc-message.ai .cc-message-bubble {
  background: #f3f4f6;
  color: #374151;
  border-bottom-left-radius: 4px;
}

.cc-chat-suggestions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 0;
}

.cc-chat-suggestion-btn {
  padding: 10px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  color: #374151;
}

.cc-chat-suggestion-btn:hover {
  background: #f9fafb;
  border-color: #3b82f6;
}
</style>
