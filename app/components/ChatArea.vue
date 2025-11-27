<template>
  <div class="cc-chat-component">
    <div class="cc-ai-chat-component">
      <!-- チャットメッセージエリア -->
      <div ref="messagesContainer" class="cc-chat-messages">
        <!-- ドラッグ&ドロップエリア（初期表示） -->
        <div
          v-if="messages.length === 0"
          class="cc-chat-dropzone"
          @click="attachFile"
        >
          <div class="cc-dropzone-icon">📁</div>
          <div class="cc-dropzone-text">
            ファイルをアップロードするか、<br>
            テキスト入力で構築を開始。<br>
            <span class="cc-dropzone-action">クリックまたはドラッグ&ドロップ</span>
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
          <UButton
            v-for="(suggestion, index) in suggestions"
            :key="index"
            :variant="isMultiSelect && selectedSuggestions.includes(suggestion.value || '') ? 'solid' : 'outline'"
            :color="isMultiSelect && selectedSuggestions.includes(suggestion.value || '') ? 'primary' : 'neutral'"
            block
            class="justify-start"
            @click="handleSuggestionClick(suggestion)"
          >
            {{ suggestion.label }}
          </UButton>
          <!-- 複数選択時の確定ボタン -->
          <UButton
            v-if="isMultiSelect && selectedSuggestions.length > 0"
            color="primary"
            block
            class="mt-2"
            @click="confirmMultiSelect"
          >
            選択を確定（{{ selectedSuggestions.length }}件）
          </UButton>
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
          <UButton
            color="primary"
            icon="i-lucide-send"
            @click="sendMessage"
          >
            送信
          </UButton>
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
import type { ChatMessage, FileData, RoleplayContext } from '../types/roleplay'

const emit = defineEmits<{
  'file-uploaded': [file: FileData]
  'open-file-selection': []
  'file-upload-started': [file: FileData]
  'file-type-updated': [data: { fileName: string; dataType: string }]
  'start-roleplay-generation': [context: RoleplayContext]
}>()

interface Suggestion {
  label: string
  action: string
  value?: string
}

// チャットエージェントの状態
type AgentState = 'idle' | 'awaiting_file_type' | 'awaiting_goals' | 'awaiting_additional' | 'generating'

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

// エージェント状態管理
const agentState = ref<AgentState>('idle')
const isMultiSelect = ref(false)
const selectedSuggestions = ref<string[]>([])

// 収集したデータ
const collectedData = ref<{
  files: FileData[]
  selectedGoals: string[]
  additionalInfo: string[]
}>({
  files: [],
  selectedGoals: [],
  additionalInfo: []
})

// ロープレ構築可能かどうか
const canGenerateRoleplay = computed(() => {
  return collectedData.value.files.length > 0 || collectedData.value.additionalInfo.length > 0
})

// ファイルタイプの選択肢
const fileTypeSuggestions: Suggestion[] = [
  { label: '📖 対話データ（お手本など）', action: 'selectFileType', value: 'dialogue' },
  { label: '🏭 商品データ（自社の扱うもの）', action: 'selectFileType', value: 'product' },
  { label: '📚 教材データ（研修教材など）', action: 'selectFileType', value: 'material' },
  { label: '👥 顧客データ（ペルソナなど）', action: 'selectFileType', value: 'customer' },
  { label: '📄 その他（テキストで入力）', action: 'selectFileType', value: 'other' }
]

// ゴールの選択肢
const goalSuggestions: Suggestion[] = [
  { label: '📝 暗記：台本を完璧に覚えて話す', action: 'selectGoal', value: 'memorize' },
  { label: '💬 切り返し：質問や反論に正しく返す', action: 'selectGoal', value: 'response' },
  { label: '🎯 ヒアリング：相手から情報を引き出す', action: 'selectGoal', value: 'hearing' },
  { label: '🗣️ 話し方：言葉づかい、声量、速さ、間を身に付ける', action: 'selectGoal', value: 'speaking' }
]

const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return

  const message = userInput.value.trim()
  userInput.value = ''

  // ユーザーメッセージを追加
  messages.value.push({
    role: 'user',
    content: message
  })

  // 状態に応じた処理
  if (agentState.value === 'awaiting_file_type' && pendingFile.value) {
    // 「その他」を選んでテキスト入力した場合
    handleOtherFileType(message)
  } else if (agentState.value === 'awaiting_additional') {
    // 追加情報として保存
    collectedData.value.additionalInfo.push(message)

    // 追加情報の確認メッセージ
    messages.value.push({
      role: 'assistant',
      content: `了解です。情報を追加しました。<br><br>他に追加したい情報はありますか？<br><span style="color: #6b7280; font-size: 13px;">（「ロープレ構築」ボタンを押すと構築が開始されます）</span>`
    })
    scrollToBottom()
  } else if (agentState.value === 'idle') {
    // 初期状態でテキスト入力された場合
    collectedData.value.additionalInfo.push(message)

    // ゴール選択に移行
    askForGoals()
  } else {
    // その他の状態ではAPIに送信
    await sendToAPI(message)
  }

  scrollToBottom()
}

const sendToAPI = async (message: string) => {
  isLoading.value = true

  try {
    const response = await $fetch<{ content: string }>('/api/chat', {
      method: 'POST',
      body: {
        messages: messages.value
      }
    })

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
  target.value = ''
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

  // 解析中メッセージを追加
  isAnalyzing.value = true
  uploadProgress.value = 0
  analysisMessageIndex.value = messages.value.length
  messages.value.push({
    role: 'assistant',
    content: getAnalysisProgressHtml(0)
  })

  scrollToBottom()

  // ファイルデータを作成
  const fileData: FileData = {
    name: file.name,
    size: file.size,
    type: file.type,
    dataType: '未分類',
    uploadDate: new Date().toLocaleDateString('ja-JP'),
    extractedText: ''
  }

  emit('file-upload-started', fileData)

  // 解析をシミュレート
  await simulateFileAnalysis(file, fileData)
}

const getAnalysisProgressHtml = (progress: number) => {
  return `ファイルをアップロードしています...
    <div style="margin-top: 8px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span>解析中...</span>
        <span>${progress}%</span>
      </div>
      <div style="background: #e5e7eb; border-radius: 4px; height: 8px; overflow: hidden;">
        <div style="background: #3b82f6; height: 100%; width: ${progress}%; transition: width 0.3s;"></div>
      </div>
    </div>`
}

const simulateFileAnalysis = async (file: File, fileData: FileData) => {
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

  isAnalyzing.value = false
  fileData.extractedText = generateDummyExtractedText(file.name)

  // 完了メッセージと質問を表示
  if (analysisMessageIndex.value >= 0 && analysisMessageIndex.value < messages.value.length) {
    messages.value[analysisMessageIndex.value].content = `
      <div>
        <div style="color: #10b981; font-weight: 600; margin-bottom: 8px;">✓ 解析完了</div>
        <div>「${file.name}」の解析が完了しました。</div>
        <div style="margin-top: 12px; font-weight: 500;">このファイルはどんなデータですか？</div>
      </div>
    `
  }

  emit('file-uploaded', fileData)

  // ファイルタイプ選択のサジェスションを表示
  agentState.value = 'awaiting_file_type'
  isMultiSelect.value = false
  suggestions.value = fileTypeSuggestions

  // ファイルデータを一時保存
  collectedData.value.files.push(fileData)

  scrollToBottom()
}

const generateDummyExtractedText = (fileName: string): string => {
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
  全体のまとめと結論が記載されています。`
}

const handleSuggestionClick = (suggestion: Suggestion) => {
  if (suggestion.action === 'selectFileType') {
    handleFileTypeSelection(suggestion)
  } else if (suggestion.action === 'selectGoal') {
    handleGoalSelection(suggestion)
  }
}

const handleFileTypeSelection = (suggestion: Suggestion) => {
  const file = pendingFile.value
  if (!file) return

  const dataTypeLabels: Record<string, string> = {
    'dialogue': '対話データ',
    'product': '商品データ',
    'material': '教材データ',
    'customer': '顧客データ',
    'other': 'その他'
  }

  const selectedType = suggestion.value || 'other'

  // ユーザーの選択を追加
  messages.value.push({
    role: 'user',
    content: dataTypeLabels[selectedType]
  })

  // ファイルのタイプを更新
  const fileIndex = collectedData.value.files.findIndex(f => f.name === file.name)
  if (fileIndex >= 0) {
    collectedData.value.files[fileIndex].dataType = dataTypeLabels[selectedType]
  }

  emit('file-type-updated', {
    fileName: file.name,
    dataType: dataTypeLabels[selectedType]
  })

  suggestions.value = []
  pendingFile.value = null

  if (selectedType === 'other') {
    // その他の場合はテキスト入力を促す
    messages.value.push({
      role: 'assistant',
      content: 'どのようなデータか教えてください。'
    })
    // 状態はawating_file_typeのまま
  } else {
    // 次のステップ：ゴール選択
    askForGoals()
  }

  scrollToBottom()
}

const handleOtherFileType = (description: string) => {
  const file = pendingFile.value
  if (!file) return

  // ファイルのタイプを更新
  const fileIndex = collectedData.value.files.findIndex(f => f.name === file.name)
  if (fileIndex >= 0) {
    collectedData.value.files[fileIndex].dataType = description
  }

  emit('file-type-updated', {
    fileName: file.name,
    dataType: description
  })

  pendingFile.value = null

  // 次のステップ：ゴール選択
  askForGoals()
}

const askForGoals = () => {
  // すでにゴールが選択されている場合は追加情報へ
  if (collectedData.value.selectedGoals.length > 0) {
    askForAdditionalInfo()
    return
  }

  agentState.value = 'awaiting_goals'
  isMultiSelect.value = true
  selectedSuggestions.value = []

  messages.value.push({
    role: 'assistant',
    content: `承知しました。<br><br><strong>求めるゴールはどれが近いですか？</strong><br><span style="color: #6b7280; font-size: 13px;">（複数選択可）</span>`
  })

  suggestions.value = goalSuggestions
  scrollToBottom()
}

const handleGoalSelection = (suggestion: Suggestion) => {
  const value = suggestion.value || ''

  if (selectedSuggestions.value.includes(value)) {
    // 選択解除
    selectedSuggestions.value = selectedSuggestions.value.filter(v => v !== value)
  } else {
    // 選択追加
    selectedSuggestions.value.push(value)
  }
}

const confirmMultiSelect = () => {
  if (selectedSuggestions.value.length === 0) return

  const goalLabels: Record<string, string> = {
    'memorize': '暗記',
    'response': '切り返し',
    'hearing': 'ヒアリング',
    'speaking': '話し方'
  }

  const selectedLabels = selectedSuggestions.value.map(v => goalLabels[v] || v)

  // ユーザーの選択を追加
  messages.value.push({
    role: 'user',
    content: selectedLabels.join('、')
  })

  // データを保存
  collectedData.value.selectedGoals = [...selectedSuggestions.value]

  // リセット
  suggestions.value = []
  isMultiSelect.value = false
  selectedSuggestions.value = []

  // 次のステップ：追加情報
  askForAdditionalInfo()
}

const askForAdditionalInfo = () => {
  agentState.value = 'awaiting_additional'

  messages.value.push({
    role: 'assistant',
    content: `了解です。他に追加したい情報はありますか？<br><br><span style="color: #6b7280; font-size: 13px;">（「ロープレ構築」ボタンを押すと構築が開始されます）</span>`
  })

  scrollToBottom()
}

const startRoleplayGeneration = () => {
  if (!canGenerateRoleplay.value) return

  agentState.value = 'generating'
  suggestions.value = []

  // 構築中メッセージを表示
  messages.value.push({
    role: 'assistant',
    content: `<div style="display: flex; align-items: center; gap: 8px;">
      <span class="cc-loading-spinner" style="width: 16px; height: 16px; border: 2px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
      <span>ロープレを構築中...</span>
    </div>`
  })

  scrollToBottom()

  // コンテキストを作成して親に通知
  const context: RoleplayContext = {
    files: collectedData.value.files,
    goals: collectedData.value.selectedGoals,
    additionalInfo: collectedData.value.additionalInfo,
    chatHistory: messages.value
  }

  emit('start-roleplay-generation', context)
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

// 構築完了を通知（親から呼ばれる）
const notifyGenerationComplete = (success: boolean, message?: string) => {
  // 構築中メッセージを削除
  const loadingIndex = messages.value.findIndex(
    m => m.content.includes('ロープレを構築中')
  )
  if (loadingIndex >= 0) {
    messages.value.splice(loadingIndex, 1)
  }

  if (success) {
    messages.value.push({
      role: 'assistant',
      content: message || `<div>
        <div style="color: #10b981; font-weight: 600; margin-bottom: 8px;">✓ ロープレ構築完了</div>
        <div>ロープレコンテンツが生成されました。</div>
        <div style="margin-top: 12px; padding: 8px 12px; background: #f0fdf4; border-radius: 6px; border-left: 3px solid #10b981;">
          右側の各タブから確認・編集できます。
        </div>
      </div>`
    })
  } else {
    messages.value.push({
      role: 'assistant',
      content: message || `<div style="color: #ef4444;">
        <div style="font-weight: 600; margin-bottom: 8px;">⚠ 構築エラー</div>
        <div>ロープレの構築中にエラーが発生しました。もう一度お試しください。</div>
      </div>`
    })
  }

  agentState.value = 'awaiting_additional'
  scrollToBottom()
}

// データをグローバルに公開
defineExpose({
  messages,
  handleDroppedFile,
  notifyGenerationComplete,
  collectedData
})
</script>

<style scoped>
.cc-chat-component {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.cc-ai-chat-component {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.cc-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.cc-chat-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #6b7280;
  cursor: pointer;
  border: 2px dashed #e5e7eb;
  border-radius: 12px;
  margin: 16px;
  transition: all 0.2s;
}

.cc-chat-dropzone:hover {
  border-color: #3b82f6;
  background: #f8fafc;
}

.cc-dropzone-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.cc-dropzone-text {
  font-size: 14px;
  line-height: 1.8;
}

.cc-dropzone-action {
  display: block;
  margin-top: 12px;
  font-size: 13px;
  color: #3b82f6;
  font-weight: 500;
}

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
  overflow: hidden;
  position: relative;
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

.cc-chat-input-area {
  padding: 12px;
  border-top: 1px solid #e5e7eb;
  background: white;
}

.cc-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
}

.cc-textarea:focus {
  border-color: #3b82f6;
}

.cc-button-group {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  justify-content: flex-end;
}

.cc-roleplay-generate-wrapper {
  margin-top: 8px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
