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

      </div>

      <!-- サジェスションボタン（スクロール領域の外に配置） -->
      <div v-if="suggestions.length > 0" class="cc-chat-suggestions-fixed">
        <div class="cc-chat-suggestions">
          <UButton
            v-for="(suggestion, index) in suggestions"
            :key="index"
            :variant="isMultiSelect && selectedSuggestions.includes(suggestion.value || '') ? 'solid' : 'outline'"
            :color="isMultiSelect && selectedSuggestions.includes(suggestion.value || '') ? 'primary' : 'neutral'"
            block
            size="lg"
            class="justify-start cc-suggestion-btn"
            @click="handleSuggestionClick(suggestion)"
          >
            {{ suggestion.label }}
          </UButton>
          <!-- 複数選択時の確定ボタン -->
          <UButton
            v-if="isMultiSelect && selectedSuggestions.length > 0"
            color="primary"
            block
            size="lg"
            class="mt-2 cc-suggestion-btn cc-confirm-btn"
            @click="handleConfirmSelection()"
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
        <div class="cc-input-actions">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-send"
            size="sm"
            class="cc-send-button"
            @click="sendMessage"
          >
            送信
          </UButton>
          <UButton
            color="primary"
            size="md"
            class="cc-header-action-button"
            :disabled="!canGenerateRoleplay"
            @click="startRoleplayGeneration"
          >
            <UIcon name="i-lucide-rocket" class="cc-header-action-icon" />
            構築スタート
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
import { watch, ref, nextTick, computed } from 'vue'
import type { ChatMessage, FileData, RoleplayContext } from '../types/roleplay'
import type { SeparableInfo } from '../types/file'

const emit = defineEmits<{
  'file-uploaded': [file: FileData]
  'file-upload-started': [file: FileData]
  'file-type-updated': [data: { fileName: string; dataType: string }]
  'file-range-selected': [data: { fileName: string; selectedRange: string[]; usedContent: string; unusedContent: string }]
  'file-goals-updated': [data: { fileName: string; goals: string[] }]
  'start-roleplay-generation': [context: RoleplayContext]
}>()

interface Suggestion {
  label: string
  action: string
  value?: string
}

// チャットエージェントの状態
type AgentState = 'idle' | 'awaiting_range' | 'awaiting_file_type' | 'awaiting_goals' | 'awaiting_additional' | 'generating' | 'awaiting_file_selection' | 'awaiting_build_goals'

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

// 現在解析中のファイルの分離可能項目情報
const currentSeparableInfo = ref<SeparableInfo | null>(null)

// 収集したデータ
const collectedData = ref<{
  files: FileData[]
  selectedGoals: string[]
  additionalInfo: string[]
  selectedFileIndices?: number[]
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
  { label: '📦 自社商品の資料/データ', action: 'selectFileType', value: 'product' },
  { label: '🎤 商談やロープレの記録', action: 'selectFileType', value: 'dialogue' },
  { label: '📚 教材としている資料/データ', action: 'selectFileType', value: 'material' },
  { label: '👥 顧客に関わる情報', action: 'selectFileType', value: 'customer' },
  { label: '📄 その他（テキストで入力）', action: 'selectFileType', value: 'other' }
]

// ゴールの選択肢（新フロー用）
const goalSuggestions: Suggestion[] = [
  { label: '📖 台本の暗記', action: 'selectGoal', value: 'script_memorize' },
  { label: '📋 正確な説明や質問', action: 'selectGoal', value: 'accurate_explanation' },
  { label: '🎯 ヒアリング', action: 'selectGoal', value: 'hearing' },
  { label: '💬 質疑や反論への切り返し', action: 'selectGoal', value: 'objection_handling' },
  { label: '🗣️ 話し方', action: 'selectGoal', value: 'speaking' }
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

// メッセージやサジェスションが更新されたら自動スクロール
watch(messages, () => {
  scrollToBottom()
}, { deep: true })

watch(suggestions, () => {
  scrollToBottom()
}, { deep: true })

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

  // 実際のファイル解析を実行
  await analyzeFile(file, fileData)
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

const analyzeFile = async (file: File, fileData: FileData) => {
  // 進捗表示開始
  const progressInterval = setInterval(() => {
    if (uploadProgress.value < 90) {
      uploadProgress.value += 10
      if (analysisMessageIndex.value >= 0 && analysisMessageIndex.value < messages.value.length) {
        messages.value[analysisMessageIndex.value].content = getAnalysisProgressHtml(uploadProgress.value)
      }
    }
  }, 500)

  try {
    // FormDataを作成
    const formData = new FormData()
    formData.append('file', file)
    formData.append('dataType', 'other')

    // ファイルをアップロードして解析
    const uploadResponse = await $fetch<{
      success: boolean
      file?: {
        extractedText: string
        separable?: SeparableInfo
      }
      error?: string
    }>('/api/upload', {
      method: 'POST',
      body: formData
    })

    clearInterval(progressInterval)
    uploadProgress.value = 100

    if (uploadResponse.success && uploadResponse.file) {
      // 分離可能項目情報を設定
      if (uploadResponse.file.separable) {
        fileData.separable = uploadResponse.file.separable
        currentSeparableInfo.value = uploadResponse.file.separable
      }

      // メタデータのみを使用（内容は後でstartContentExtraction()で読み取る）
      // PDF、Excel、PowerPointなどは最初はページ数/シート数/スライド数のみ
      fileData.extractedText = uploadResponse.file.extractedText
    } else {
      // アップロード失敗時はダミーデータにフォールバック
      console.error('Upload failed:', uploadResponse.error)
      fileData.extractedText = generateDummyExtractedText(file.name)

      // ダミーの分離可能項目情報をセット
      const dummySeparable = getDummySeparableInfo(file.name)
      if (dummySeparable) {
        fileData.separable = dummySeparable
        currentSeparableInfo.value = dummySeparable
      }
    }

    isAnalyzing.value = false
    emit('file-uploaded', fileData)

    // ファイルデータを一時保存
    collectedData.value.files.push(fileData)

    // 範囲選択を先に聞く（必須）
    const separable = fileData.separable
    if (separable && separable.items.length > 0) {
      // 分離可能な項目がある場合は範囲選択を聞く
      askForRangeSelection(file.name, separable)
    } else {
      // 分離できない場合は「全部を使用」を確認して次へ
      askForRangeConfirmation(file.name)
    }

    scrollToBottom()
  } catch (error) {
    clearInterval(progressInterval)
    isAnalyzing.value = false

    console.error('File analysis error:', error)

    // エラー時はダミーデータにフォールバック
    fileData.extractedText = generateDummyExtractedText(file.name)

    // ダミーの分離可能項目情報をセット
    const dummySeparable = getDummySeparableInfo(file.name)
    if (dummySeparable) {
      fileData.separable = dummySeparable
      currentSeparableInfo.value = dummySeparable
    }

    emit('file-uploaded', fileData)

    // ファイルデータを一時保存
    collectedData.value.files.push(fileData)

    // 範囲選択を先に聞く（必須）
    if (dummySeparable && dummySeparable.items.length > 0) {
      askForRangeSelection(file.name, dummySeparable)
    } else {
      askForRangeConfirmation(file.name)
    }

    scrollToBottom()
  }
}

// 範囲選択の質問を表示
const askForRangeSelection = (fileName: string, separable: SeparableInfo) => {
  const typeLabel = separable.type === 'sheet' ? 'シート' :
                    separable.type === 'slide' ? 'スライド' :
                    separable.type === 'page' ? 'ページ' : 'セクション'

  // 完了メッセージを表示（別の吹き出し）
  if (analysisMessageIndex.value >= 0 && analysisMessageIndex.value < messages.value.length) {
    messages.value[analysisMessageIndex.value].content = `
      <div>
        <div style="color: #10b981; font-weight: 600; margin-bottom: 8px;">✓ 読込完了！</div>
        <div>「${fileName}」の読み込みが完了しました。</div>
        <div style="margin-top: 12px; padding: 10px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #3b82f6;">
          <div style="font-size: 13px; color: #6b7280;">📊 ${separable.totalCount}件の${typeLabel}が見つかりました</div>
        </div>
      </div>
    `
  }

  // 質問は別の吹き出しに
  messages.value.push({
    role: 'assistant',
    content: `<div>
      <div style="font-weight: 500;">使用する範囲を選択してください</div>
      <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">不要な部分を除外すると精度が向上します</div>
    </div>`
  })

  agentState.value = 'awaiting_range'
  isMultiSelect.value = true
  selectedSuggestions.value = []

  // 範囲選択のサジェスションを生成
  suggestions.value = generateRangeSuggestions(separable)
}

// 分離できないファイルの場合、全部使用することを確認
const askForRangeConfirmation = (fileName: string) => {
  // 完了メッセージを表示（別の吹き出し）
  if (analysisMessageIndex.value >= 0 && analysisMessageIndex.value < messages.value.length) {
    messages.value[analysisMessageIndex.value].content = `
      <div>
        <div style="color: #10b981; font-weight: 600; margin-bottom: 8px;">✓ 読込完了！</div>
        <div>「${fileName}」の読み込みが完了しました。</div>
      </div>
    `
  }

  // 質問は別の吹き出しに
  messages.value.push({
    role: 'assistant',
    content: `<div style="font-weight: 500;">このファイルの全内容を使用しますか？</div>`
  })

  agentState.value = 'awaiting_range'
  isMultiSelect.value = false
  selectedSuggestions.value = []

  // 「全部を使用する」のみ表示
  suggestions.value = [
    { label: '📄 全部を使用する', action: 'selectRange', value: 'all' }
  ]
}

// 範囲選択のサジェスションを生成
const generateRangeSuggestions = (separable: SeparableInfo): Suggestion[] => {
  const result: Suggestion[] = [
    { label: '📄 全部を使用する', action: 'selectRange', value: 'all' }
  ]

  // 各項目を選択肢として追加
  for (const item of separable.items) {
    const icon = separable.type === 'sheet' ? '📊' :
                 separable.type === 'slide' ? '📑' :
                 separable.type === 'page' ? '📄' : '📌'
    result.push({
      label: `${icon} ${item.label}`,
      action: 'selectRange',
      value: String(item.value)
    })
  }

  return result
}

// ダミーの分離可能項目情報を生成（実際はサーバーから取得）
const getDummySeparableInfo = (fileName: string): SeparableInfo | null => {
  const ext = fileName.toLowerCase().split('.').pop()

  if (ext === 'xlsx' || ext === 'xls') {
    return {
      type: 'sheet',
      isNumeric: false,
      items: [
        { type: 'sheet', value: 'Sheet1', label: 'Sheet1' },
        { type: 'sheet', value: '商品マスタ', label: '商品マスタ' },
        { type: 'sheet', value: '顧客リスト', label: '顧客リスト' }
      ],
      totalCount: 3
    }
  }

  if (ext === 'pptx' || ext === 'ppt') {
    return {
      type: 'slide',
      isNumeric: true,
      items: [
        { type: 'slide', value: 1, label: 'スライド 1' },
        { type: 'slide', value: 2, label: 'スライド 2' },
        { type: 'slide', value: 3, label: 'スライド 3' },
        { type: 'slide', value: 4, label: 'スライド 4' },
        { type: 'slide', value: 5, label: 'スライド 5' }
      ],
      totalCount: 5
    }
  }

  if (ext === 'pdf') {
    return {
      type: 'page',
      isNumeric: true,
      items: [
        { type: 'page', value: 1, label: 'ページ 1' },
        { type: 'page', value: 2, label: 'ページ 2' },
        { type: 'page', value: 3, label: 'ページ 3' }
      ],
      totalCount: 3
    }
  }

  return null
}

// ファイルタイプ選択を表示
const showFileTypeSelection = (fileName: string) => {
  // 質問は新しい吹き出しとして追加
  messages.value.push({
    role: 'assistant',
    content: `<div style="font-weight: 500;">このファイルはどんなデータですか？</div>`
  })

  // ファイルタイプ選択のサジェスションを表示
  agentState.value = 'awaiting_file_type'
  isMultiSelect.value = false
  suggestions.value = fileTypeSuggestions
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
  if (suggestion.action === 'selectRange') {
    handleRangeSelection(suggestion)
  } else if (suggestion.action === 'selectFileType') {
    handleFileTypeSelection(suggestion)
  } else if (suggestion.action === 'selectGoal') {
    // 構築フローのゴール選択かファイルアップロード時のゴール選択かで分岐
    if (agentState.value === 'awaiting_build_goals') {
      handleBuildGoalSelection(suggestion)
    } else {
      handleGoalSelection(suggestion)
    }
  } else if (suggestion.action === 'selectBuildFile') {
    handleBuildFileSelection(suggestion)
  }
}

// 選択確定ハンドラ（状態に応じて適切な確定処理を呼び出す）
const handleConfirmSelection = () => {
  if (agentState.value === 'awaiting_range') {
    confirmRangeSelection()
  } else if (agentState.value === 'awaiting_file_selection') {
    confirmFileSelection()
  } else if (agentState.value === 'awaiting_build_goals') {
    confirmBuildGoalSelection()
  } else {
    confirmMultiSelect()
  }
}

// 範囲選択のハンドラ
const handleRangeSelection = (suggestion: Suggestion) => {
  const value = suggestion.value || ''

  // 「全部」を選択した場合
  if (value === 'all') {
    // ユーザーの選択を追加（「範囲：」ラベル付き）
    messages.value.push({
      role: 'user',
      content: '範囲：全部'
    })

    // ファイルの選択範囲を更新
    const file = pendingFile.value
    if (file) {
      const fileIndex = collectedData.value.files.findIndex(f => f.name === file.name)
      if (fileIndex >= 0) {
        const fileData = collectedData.value.files[fileIndex]
        fileData.selectedRange = []  // 空配列 = 全部
        // 全部使用する場合、usedContent = extractedText
        fileData.usedContent = fileData.extractedText
        fileData.unusedContent = ''
        fileData.content = fileData.extractedText  // 互換性のため
      }

      emit('file-range-selected', {
        fileName: file.name,
        selectedRange: [],
        usedContent: collectedData.value.files.find(f => f.name === file.name)?.extractedText || '',
        unusedContent: ''
      })
    }

    suggestions.value = []
    isMultiSelect.value = false
    selectedSuggestions.value = []
    currentSeparableInfo.value = null

    // 次のステップ：ファイルタイプ選択
    showFileTypeSelection(pendingFile.value?.name || '')
    scrollToBottom()
    return
  }

  // 個別選択（複数選択可能）
  if (selectedSuggestions.value.includes(value)) {
    // 選択解除
    selectedSuggestions.value = selectedSuggestions.value.filter(v => v !== value)
  } else {
    // 選択追加
    selectedSuggestions.value.push(value)
  }
}

// 範囲選択の確定 - 範囲を保存してファイルタイプ選択へ
const confirmRangeSelection = () => {
  if (selectedSuggestions.value.length === 0) return

  const file = pendingFile.value
  if (!file) return

  // 選択されたラベルを取得
  const selectedLabels = selectedSuggestions.value.map(v => {
    const item = currentSeparableInfo.value?.items.find(i => String(i.value) === v)
    return item?.label || v
  })

  // ユーザーの選択を追加（「範囲：」ラベル付き）
  messages.value.push({
    role: 'user',
    content: `範囲：${selectedLabels.join('、')}`
  })

  // ファイルの選択範囲を保存（内容はまだ読み取らない）
  const fileIndex = collectedData.value.files.findIndex(f => f.name === file.name)
  if (fileIndex >= 0) {
    const fileData = collectedData.value.files[fileIndex]
    fileData.selectedRange = [...selectedSuggestions.value]
  }

  // リセット
  suggestions.value = []
  isMultiSelect.value = false
  selectedSuggestions.value = []

  // 次のステップ：ファイルタイプ選択（内容読み取りはファイルタイプ選択後）
  showFileTypeSelection(file.name)
  scrollToBottom()
}

// extractedTextから選択された範囲のコンテンツを分離
const splitContentByRange = (
  fullText: string,
  selectedValues: string[],
  separable: SeparableInfo | null
): { used: string; unused: string } => {
  if (!separable || !fullText) {
    return { used: fullText, unused: '' }
  }

  // セクションごとに分割するための正規表現パターンを生成
  const typeLabel = separable.type === 'sheet' ? '' :
                    separable.type === 'slide' ? 'Slide ' :
                    separable.type === 'page' ? 'Page ' : 'Section '

  const usedParts: string[] = []
  const unusedParts: string[] = []

  // シートの場合は[シート名]で分割
  if (separable.type === 'sheet') {
    const sections = fullText.split(/(?=\n\[)/g)
    for (const section of sections) {
      const match = section.match(/^\n?\[([^\]]+)\]/)
      if (match) {
        const sheetName = match[1]
        if (selectedValues.includes(sheetName)) {
          usedParts.push(section)
        } else {
          unusedParts.push(section)
        }
      } else {
        // ヘッダー部分など
        usedParts.push(section)
      }
    }
  } else {
    // スライドやページの場合は[Slide X]や[Page X]で分割
    const pattern = new RegExp(`(?=\\n?\\[${typeLabel}\\d+\\])`, 'g')
    const sections = fullText.split(pattern)

    for (const section of sections) {
      const match = section.match(new RegExp(`^\\n?\\[${typeLabel}(\\d+)\\]`))
      if (match) {
        const num = match[1]
        if (selectedValues.includes(num)) {
          usedParts.push(section)
        } else {
          unusedParts.push(section)
        }
      } else {
        // ヘッダー部分など
        usedParts.push(section)
      }
    }
  }

  return {
    used: usedParts.join('').trim(),
    unused: unusedParts.join('').trim()
  }
}

const handleFileTypeSelection = async (suggestion: Suggestion) => {
  const file = pendingFile.value
  if (!file) return

  const dataTypeLabels: Record<string, string> = {
    'product': '自社商品の資料/データ',
    'dialogue': '商談やロープレの記録',
    'material': '教材としている資料/データ',
    'customer': '顧客に関わる情報',
    'other': 'その他'
  }

  const selectedType = suggestion.value || 'other'

  // ユーザーの選択を追加（「タイプ：」ラベル付き）
  messages.value.push({
    role: 'user',
    content: `タイプ：${dataTypeLabels[selectedType]}`
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

  if (selectedType === 'other') {
    // その他の場合はテキスト入力を促す
    messages.value.push({
      role: 'assistant',
      content: 'どのようなデータか教えてください。'
    })
    // 状態はawating_file_typeのまま
  } else {
    // ファイルタイプ選択後に解析を開始
    await startContentExtraction()
  }

  scrollToBottom()
}

const handleOtherFileType = async (description: string) => {
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

  // ファイルタイプ選択後に解析を開始
  await startContentExtraction()
}

// 選択された範囲のコンテンツを読み取り開始
const startContentExtraction = async () => {
  const file = pendingFile.value
  if (!file) return

  // 解析中メッセージを表示
  const analyzingIndex = messages.value.length
  messages.value.push({
    role: 'assistant',
    content: `<div style="display: flex; align-items: center; gap: 8px;">
      <span class="cc-loading-spinner" style="width: 16px; height: 16px; border: 2px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
      <span>ファイルの内容を解析中...</span>
    </div>`
  })
  scrollToBottom()

  try {
    const fileIndex = collectedData.value.files.findIndex(f => f.name === file.name)
    if (fileIndex < 0) {
      throw new Error('File not found')
    }

    const fileData = collectedData.value.files[fileIndex]
    const selectedRange = fileData.selectedRange || []

    // PDFや音声/動画ファイルの場合はOpenAI APIで解析
    const ext = file.name.toLowerCase().split('.').pop() || ''
    const needsAIAnalysis = ['pdf', 'mp3', 'wav', 'm4a', 'mp4', 'mov', 'avi', 'webm'].includes(ext)

    if (needsAIAnalysis) {
      // OpenAI Vision/Whisper APIで解析
      const analyzeFormData = new FormData()
      analyzeFormData.append('file', file)
      analyzeFormData.append('fileType', ext === 'pdf' ? 'pdf' : (['mp3', 'wav', 'm4a'].includes(ext) ? 'audio' : 'video'))
      if (selectedRange.length > 0) {
        analyzeFormData.append('selectedRange', JSON.stringify(selectedRange))
      }

      const analyzeResponse = await $fetch<{
        success: boolean
        text?: string
        error?: string
      }>('/api/analyze', {
        method: 'POST',
        body: analyzeFormData
      })

      if (analyzeResponse.success && analyzeResponse.text) {
        fileData.extractedText = analyzeResponse.text
        fileData.usedContent = analyzeResponse.text
      }
    } else {
      // Excelやパワポの場合、選択範囲のコンテンツを抽出
      // サーバーに再度リクエストして選択範囲のみ読み取り
      const extractFormData = new FormData()
      extractFormData.append('file', file)
      extractFormData.append('selectedRange', JSON.stringify(selectedRange))

      const extractResponse = await $fetch<{
        success: boolean
        text?: string
        error?: string
      }>('/api/extract-content', {
        method: 'POST',
        body: extractFormData
      })

      if (extractResponse.success && extractResponse.text) {
        fileData.extractedText = extractResponse.text
        fileData.usedContent = extractResponse.text
      }
    }

    // emit
    emit('file-range-selected', {
      fileName: file.name,
      selectedRange,
      usedContent: fileData.usedContent || '',
      unusedContent: ''
    })

    // 解析中メッセージを削除
    messages.value.splice(analyzingIndex, 1)

    // アップロード完了メッセージを表示
    showUploadComplete()
  } catch (error) {
    console.error('Content extraction error:', error)
    // エラー時も完了メッセージを表示
    messages.value.splice(analyzingIndex, 1)
    showUploadComplete()
  }
}

// アップロード完了メッセージを表示
const showUploadComplete = () => {
  messages.value.push({
    role: 'assistant',
    content: `<div style="color: #10b981; font-weight: 600;">
      <span style="font-size: 18px;">✓</span> アップロード完了！
    </div>
    <div style="margin-top: 8px; color: #6b7280; font-size: 13px;">
      別のファイルをアップロードするか、「構築スタート」ボタンを押して構築を開始できます。
    </div>`
  })

  // 状態をリセット
  agentState.value = 'idle'
  suggestions.value = []
  isMultiSelect.value = false
  selectedSuggestions.value = []
  pendingFile.value = null
  currentSeparableInfo.value = null

  scrollToBottom()
}

// ファイルごとのゴール選択を聞く
const askForFileGoals = () => {
  const file = pendingFile.value
  if (!file) return

  agentState.value = 'awaiting_goals'
  isMultiSelect.value = true
  selectedSuggestions.value = []

  messages.value.push({
    role: 'assistant',
    content: `承知しました。<br><br><strong>「${file.name}」で求めるゴールはどれが近いですか？</strong><br><span style="color: #6b7280; font-size: 13px;">（複数選択可）</span>`
  })

  suggestions.value = goalSuggestions
  scrollToBottom()
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

  // ユーザーの選択を追加（「ゴール：」ラベル付き）
  messages.value.push({
    role: 'user',
    content: `ゴール：${selectedLabels.join('、')}`
  })

  const file = pendingFile.value

  // ファイルに紐づけてゴールを保存
  if (file) {
    const fileIndex = collectedData.value.files.findIndex((f: FileData) => f.name === file.name)
    if (fileIndex >= 0) {
      collectedData.value.files[fileIndex].goals = selectedLabels
    }

    // ファイルのゴール更新をemit
    emit('file-goals-updated', {
      fileName: file.name,
      goals: selectedLabels
    })
  }

  // グローバルなゴールにも追加（重複を除去）
  const newGoals = selectedLabels.filter((g: string) => !collectedData.value.selectedGoals.includes(g))
  collectedData.value.selectedGoals.push(...newGoals)

  // リセット
  suggestions.value = []
  isMultiSelect.value = false
  selectedSuggestions.value = []
  pendingFile.value = null

  // ファイル処理完了メッセージ
  if (file) {
    messages.value.push({
      role: 'assistant',
      content: `<div style="color: #10b981; font-weight: 500;">✓ 「${file.name}」の設定が完了しました</div>
        <div style="margin-top: 8px; color: #6b7280; font-size: 13px;">
          別のファイルをアップロードするか、「ロープレ構築」ボタンを押して構築を開始できます。
        </div>`
    })
  }

  // 次のステップ：追加情報（待機状態）
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

// 構築スタートボタン押下時 - ファイル選択フローを開始
const startRoleplayGeneration = () => {
  if (!canGenerateRoleplay.value) return

  // ファイルが1つ以上あればファイル選択を聞く
  if (collectedData.value.files.length > 0) {
    askForFileSelection()
  } else {
    // ファイルがない場合は直接ゴール選択へ
    askForBuildGoals()
  }
}

// 使用するファイルを選択
const askForFileSelection = () => {
  agentState.value = 'awaiting_file_selection'
  isMultiSelect.value = true
  selectedSuggestions.value = []

  messages.value.push({
    role: 'assistant',
    content: `<strong>使用するファイルを選んでください</strong><br><span style="color: #6b7280; font-size: 13px;">（複数選択可）</span>`
  })

  // アップロード済みファイルをサジェスションとして表示
  suggestions.value = collectedData.value.files.map((file, index) => ({
    label: `📄 ${file.name}`,
    action: 'selectBuildFile',
    value: String(index)
  }))

  scrollToBottom()
}

// ファイル選択のハンドラ
const handleBuildFileSelection = (suggestion: Suggestion) => {
  const value = suggestion.value || ''

  if (selectedSuggestions.value.includes(value)) {
    selectedSuggestions.value = selectedSuggestions.value.filter(v => v !== value)
  } else {
    selectedSuggestions.value.push(value)
  }
}

// ファイル選択の確定
const confirmFileSelection = () => {
  if (selectedSuggestions.value.length === 0) return

  // 選択されたファイル名を取得
  const selectedFileNames = selectedSuggestions.value.map(idx => {
    const file = collectedData.value.files[parseInt(idx)]
    return file?.name || ''
  }).filter(Boolean)

  // ユーザーの選択を追加（「ファイル：」ラベル付き）
  messages.value.push({
    role: 'user',
    content: `ファイル：${selectedFileNames.join('、')}`
  })

  // 選択されたファイルのインデックスを保存
  collectedData.value.selectedFileIndices = selectedSuggestions.value.map(idx => parseInt(idx))

  // リセット
  suggestions.value = []
  isMultiSelect.value = false
  selectedSuggestions.value = []

  // 次のステップ：ゴール選択
  askForBuildGoals()
  scrollToBottom()
}

// 構築時のゴール選択
const askForBuildGoals = () => {
  agentState.value = 'awaiting_build_goals'
  isMultiSelect.value = true
  selectedSuggestions.value = []

  messages.value.push({
    role: 'assistant',
    content: `<strong>求めるゴールは何ですか？</strong><br><span style="color: #6b7280; font-size: 13px;">（複数選択可）</span>`
  })

  suggestions.value = goalSuggestions
  scrollToBottom()
}

// 構築ゴール選択のハンドラ
const handleBuildGoalSelection = (suggestion: Suggestion) => {
  const value = suggestion.value || ''

  if (selectedSuggestions.value.includes(value)) {
    selectedSuggestions.value = selectedSuggestions.value.filter(v => v !== value)
  } else {
    selectedSuggestions.value.push(value)
  }
}

// 構築ゴール選択の確定
const confirmBuildGoalSelection = () => {
  if (selectedSuggestions.value.length === 0) return

  const goalLabels: Record<string, string> = {
    'script_memorize': '台本の暗記',
    'accurate_explanation': '正確な説明や質問',
    'hearing': 'ヒアリング',
    'objection_handling': '質疑や反論への切り返し',
    'speaking': '話し方'
  }

  const selectedLabels = selectedSuggestions.value.map(v => goalLabels[v] || v)

  // ユーザーの選択を追加（「ゴール：」ラベル付き）
  messages.value.push({
    role: 'user',
    content: `ゴール：${selectedLabels.join('、')}`
  })

  // ゴールを保存
  collectedData.value.selectedGoals = selectedLabels

  // リセット
  suggestions.value = []
  isMultiSelect.value = false
  selectedSuggestions.value = []

  // 実際の構築を開始
  executeRoleplayGeneration()
  scrollToBottom()
}

// 実際のロープレ構築を実行
const executeRoleplayGeneration = () => {
  agentState.value = 'generating'

  // 設計中メッセージを表示
  messages.value.push({
    role: 'assistant',
    content: `<div style="display: flex; align-items: center; gap: 8px;">
      <span class="cc-loading-spinner" style="width: 16px; height: 16px; border: 2px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
      <span>ロープレを設計中...</span>
    </div>`
  })

  scrollToBottom()

  // 選択されたファイルのみを使用
  const selectedIndices = collectedData.value.selectedFileIndices || []
  const selectedFiles = selectedIndices.length > 0
    ? selectedIndices.map(idx => collectedData.value.files[idx]).filter(Boolean)
    : collectedData.value.files

  // コンテキストを作成して親に通知
  const context: RoleplayContext = {
    files: selectedFiles,
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
  // 設計中メッセージを削除
  const loadingIndex = messages.value.findIndex(
    m => m.content.includes('ロープレを設計中')
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
  collectedData,
  startRoleplayGeneration
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

/* サジェスションボタン固定エリア */
.cc-chat-suggestions-fixed {
  flex-shrink: 0;
  max-height: 40%;
  overflow-y: auto;
  border-top: 1px solid #e5e7eb;
  background: #f8fafc;
  padding: 12px;
}

.cc-chat-suggestions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* サジェスションボタンの高さを1.5倍に */
.cc-suggestion-btn {
  min-height: 48px;
  padding-top: 12px;
  padding-bottom: 12px;
  font-size: 15px;
}

/* 確定ボタンを目立たせる */
.cc-confirm-btn {
  position: sticky;
  bottom: 0;
  background: #3b82f6;
  box-shadow: 0 -2px 8px rgba(59, 130, 246, 0.3);
}

.cc-chat-input-area {
  padding: 12px;
  border-top: 1px solid #e5e7eb;
  background: white;
  display: flex;
  flex-direction: column;
  gap: 10px;
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

.cc-input-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.cc-send-button {
  flex-shrink: 0;
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
