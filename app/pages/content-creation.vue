<template>
  <div class="content-creation-container">
    <!-- 上部: コース・レッスン選択バー -->
    <div class="cc-selector-bar">
      <div class="cc-selector-item">
        <UIcon name="i-lucide-book-open" class="cc-selector-icon" />
        <span class="cc-selector-label">コース</span>
        <USelect
          v-model="selectedCategory"
          :items="categoryOptions"
          size="sm"
          class="cc-selector-select"
        />
      </div>
      <div class="cc-selector-item">
        <UIcon name="i-lucide-play-circle" class="cc-selector-icon" />
        <span class="cc-selector-label">レッスン</span>
        <USelect
          v-model="selectedLesson"
          :items="lessonOptions"
          placeholder="選択..."
          size="sm"
          class="cc-selector-select"
        />
      </div>

      <!-- 構築中メッセージ -->
      <div v-if="isBuilding" class="cc-building-message">
        <span class="cc-building-spinner"></span>
        <span class="cc-building-text">ロープレを設計中...</span>
      </div>
    </div>

    <!-- 左列: 入力パネル -->
    <div
      class="cc-panel cc-operation-panel"
      @dragenter.prevent="handleDragEnter"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <!-- ドラッグ&ドロップオーバーレイ -->
      <div v-if="isDragging" class="cc-drop-overlay">
        <div class="cc-drop-overlay-content">
          <div class="cc-drop-icon">📁</div>
          <div class="cc-drop-text">ファイルをアップロード</div>
        </div>
      </div>
      <!-- 入力パネルヘッダー -->
      <div class="cc-panel-header">
        <UIcon name="i-lucide-edit-3" class="cc-panel-header-icon" />
        <span class="cc-panel-header-title">入力パネル</span>
        <UButton
          color="primary"
          size="sm"
          class="cc-header-action-button"
          :disabled="isBuilding || !canGenerateRoleplay"
          @click="handleBuildStart"
        >
          <UIcon name="i-lucide-rocket" class="cc-header-action-icon" />
          {{ isBuilding ? '設計中...' : '構築スタート' }}
        </UButton>
      </div>

      <!-- タブナビゲーション -->
      <div class="cc-panel-tabs">
        <button
          class="cc-panel-tab"
          :class="{ active: operationTab === 'chat' }"
          @click="operationTab = 'chat'"
        >
          <UIcon name="i-lucide-message-square" class="cc-panel-tab-icon" />
          <span>チャット</span>
        </button>
        <button
          class="cc-panel-tab"
          :class="{ active: operationTab === 'course' }"
          @click="operationTab = 'course'"
        >
          <UIcon name="i-lucide-folder-tree" class="cc-panel-tab-icon" />
          <span>コース</span>
        </button>
        <button
          class="cc-panel-tab"
          :class="{ active: operationTab === 'files' }"
          @click="operationTab = 'files'"
        >
          <UIcon name="i-lucide-file-text" class="cc-panel-tab-icon" />
          <span>ファイル</span>
        </button>
      </div>

      <!-- チャットタブ -->
      <div v-show="operationTab === 'chat'" class="cc-operation-tab-content active">
        <ChatArea
          ref="chatAreaRef"
          @file-uploaded="handleFileUploaded"
          @file-upload-started="handleFileUploadStarted"
          @file-type-updated="handleFileTypeUpdated"
          @file-range-selected="handleFileRangeSelected"
          @file-goals-updated="handleFileGoalsUpdated"
          @start-roleplay-generation="handleStartRoleplayGeneration"
        />
      </div>

      <!-- コースタブ -->
      <div v-show="operationTab === 'course'" class="cc-operation-tab-content active">
        <div class="cc-course-manager">
          <div class="cc-course-tree">
            <!-- ツリー構造 -->
            <div v-for="(category, catIndex) in courseTree" :key="catIndex" class="cc-tree-category">
              <!-- カテゴリー（Lv.1） -->
              <div
                class="cc-tree-node cc-tree-category-node"
                @click="toggleTreeNode('category', catIndex)"
              >
                <span class="cc-tree-expand-icon">{{ category.expanded ? '▼' : '▶' }}</span>
                <span class="cc-tree-icon">📁</span>
                <span class="cc-tree-label">{{ category.name }}</span>
                <span class="cc-tree-count">({{ category.lessons.length }})</span>
              </div>

              <!-- レッスン一覧 -->
              <div v-show="category.expanded" class="cc-tree-children">
                <div
                  v-for="(lesson, lessonIndex) in category.lessons"
                  :key="lessonIndex"
                  class="cc-tree-node cc-tree-lesson-node"
                  :class="{ 'cc-tree-node-selected': selectedLesson === `${catIndex}-${lessonIndex}` }"
                  @click="selectLesson(catIndex, lessonIndex, lesson)"
                >
                  <span class="cc-tree-expand-icon"></span>
                  <span class="cc-tree-icon">📄</span>
                  <span class="cc-tree-label">{{ lesson.name }}</span>
                  <span v-if="lesson.status === 'draft'" class="cc-tree-status cc-status-draft">下書き</span>
                  <span v-else-if="lesson.status === 'published'" class="cc-tree-status cc-status-published">公開中</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 操作ボタン -->
          <div class="cc-course-actions">
            <UButton variant="outline" color="neutral" size="sm" @click="addNewCategory">
              + カテゴリーを追加
            </UButton>
            <UButton variant="outline" color="neutral" size="sm" @click="addNewLesson">
              + レッスンを追加
            </UButton>
          </div>
        </div>
      </div>

      <!-- ファイルタブ -->
      <div v-show="operationTab === 'files'" class="cc-operation-tab-content active">
        <div class="cc-raw-data-container">
          <div v-if="uploadedFiles.length === 0" class="cc-raw-data-empty">
            <div class="cc-empty-icon">📁</div>
            <div class="cc-empty-text">まだファイルがアップロードされていません</div>
            <div class="cc-empty-hint">
              チャットでファイルをアップロードすると、ここにテキスト化されたデータが表示されます
            </div>
          </div>
          <div v-else class="cc-file-list-display">
            <div
              v-for="(file, index) in uploadedFiles"
              :key="index"
              class="cc-file-item-card"
              :class="[
                { 'cc-file-item-expanded': selectedFileIndex === index },
                getFileColorClass(file.name)
              ]"
              @click="toggleFileExpand(index)"
            >
              <!-- 概要セクション（常に表示） -->
              <div class="cc-file-summary">
                <!-- ファイル名行 -->
                <div class="cc-file-name-row">
                  <span class="cc-file-icon">{{ getFileIcon(file.name) }}</span>
                  <span class="cc-file-name">{{ file.name }}</span>
                  <span class="cc-file-expand-icon">{{ selectedFileIndex === index ? '▼' : '▶' }}</span>
                </div>

                <!-- アップロード日 + ダウンロードボタン行 -->
                <div class="cc-file-date-row">
                  <span class="cc-file-upload-date">アップロード日: {{ file.uploadDate }}</span>
                  <UButton
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    icon="i-lucide-download"
                    class="cc-file-download-btn-inline"
                    @click.stop="downloadFile(file)"
                  >
                    ダウンロード
                  </UButton>
                </div>

                <!-- メタ情報（種類・範囲） -->
                <div class="cc-file-meta-row">
                  <div class="cc-file-meta-item" @click.stop>
                    <span class="cc-file-meta-label">種類:</span>
                    <USelect
                      v-model="file.dataType"
                      :items="fileTypeOptions"
                      size="xs"
                      class="cc-file-type-select"
                    />
                  </div>
                  <div v-if="getFileRangeOptions(file).length > 0" class="cc-file-meta-item" @click.stop>
                    <span class="cc-file-meta-label">範囲:</span>
                    <USelectMenu
                      :model-value="getFileSelectedRangeValue(file)"
                      :items="getFileRangeOptionsWithAll(file)"
                      multiple
                      size="xs"
                      class="cc-file-range-select"
                      placeholder="全部"
                      :searchable="false"
                      @update:model-value="handleRangeChangeWithAll(file, $event)"
                    />
                  </div>
                </div>
              </div>

              <!-- 内容詳細セクション（展開時のみ表示） -->
              <div v-show="selectedFileIndex === index" class="cc-file-detail">
                <div class="cc-file-detail-header">
                  <span class="cc-file-detail-label">ファイルの内容</span>
                </div>
                <pre class="cc-file-content-text">{{ getFileContentDisplay(file) || '解析中...' }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 中央列: 構築パネル -->
    <div class="cc-panel cc-build-panel">
      <BuildPanel
        ref="buildPanelRef"
        :points="buildPoints"
        :overview="buildOverview"
        :script-lines="buildScriptLines"
        :is-building="isBuilding"
        :building-step="buildingStep"
        :character-options="characterOptions"
        :selected-character="selectedCharacter"
        @update:overview="buildOverview = $event"
        @update:selected-persona="selectedCharacter = $event"
        @generate-prompts="generateAllPrompts"
        @character-selected="handleCharacterSelected"
      />
    </div>

    <!-- 右列: プレイエリア＋モード選択＋プロンプトパネル -->
    <div class="cc-right-column">
      <div class="cc-panel cc-play-component">
        <!-- プレイパネルヘッダー -->
        <div class="cc-panel-header">
          <UIcon name="i-lucide-play-circle" class="cc-panel-header-icon" />
          <span class="cc-panel-header-title">プレイパネル</span>
          <UButton
            variant="ghost"
            color="neutral"
            size="sm"
            class="cc-header-save-button"
          >
            <UIcon name="i-lucide-save" class="cc-header-save-icon" />
            設定を保存
          </UButton>
        </div>

        <div class="cc-play-content">
          <!-- 左側: 相手選択コンポーネント -->
          <div class="cc-opponent-panel">
            <!-- サムネイル -->
            <div class="cc-opponent-thumbnail" @click="openCharacterSettings">
              <video
                v-if="selectedCharacterInfo?.avatar"
                :src="selectedCharacterInfo.avatar"
                class="cc-opponent-video"
                autoplay
                loop
                muted
                playsinline
              />
              <div v-else class="cc-opponent-placeholder">👔</div>
            </div>

            <!-- 相手選択 -->
            <div class="cc-opponent-select-group">
              <label class="cc-opponent-label">相手</label>
              <USelect
                v-model="selectedCharacter"
                :items="characterOptions"
                size="sm"
                class="cc-opponent-select"
              />
            </div>

            <!-- スペーサー -->
            <div class="cc-opponent-spacer"></div>

            <!-- マイクボタン -->
            <UButton
              :variant="isRecording ? 'solid' : 'outline'"
              :color="isRecording ? 'error' : 'neutral'"
              size="md"
              class="cc-opponent-mic-btn"
              @click="toggleMic"
            >
              <span class="cc-mic-icon">🎤</span>
              <span>{{ isRecording ? '録音中' : 'マイク' }}</span>
            </UButton>

            <!-- スタートボタン -->
            <UButton
              :variant="conversationActive ? 'solid' : 'solid'"
              :color="conversationActive ? 'error' : 'primary'"
              size="md"
              class="cc-opponent-start-btn"
              @click="toggleRoleplay"
            >
              {{ conversationActive ? '■ 停止' : '▶ スタート' }}
            </UButton>
          </div>

          <!-- 中央: 映像表示エリア -->
          <div class="cc-video-area">
            <div class="cc-video-window-container">
              <div class="cc-character-window" :class="{ 'cc-speaking': isSpeaking, 'cc-listening': isConnected && !isSpeaking }">
                <video
                  ref="characterVideoRef"
                  id="characterVideo"
                  class="cc-character-video"
                  src="/idle.webm"
                  loop
                  muted
                  autoplay
                  playsinline
                ></video>

                <!-- Connection Status -->
                <div class="cc-video-connection-status">
                  <div class="cc-connection-status">
                    <span class="cc-status-indicator" :class="connectionStatusClass"></span>
                    <span class="cc-status-text">{{ connectionStatusText }}</span>
                  </div>
                </div>

                <div v-if="showResult" class="cc-result-overlay">
                  <div class="cc-score-display">{{ score }}点</div>
                  <div class="cc-feedback-box" v-html="feedbackHtml"></div>
                </div>
              </div>
            </div>

            <!-- ステータスメッセージ（映像の下） -->
            <div class="cc-video-status-message">
              <span v-if="conversationActive && isSpeaking" class="cc-status-text cc-status-speaking">
                AIが話しています...
              </span>
              <span v-else-if="conversationActive && isRecording" class="cc-status-text cc-status-recording">
                録音中...あなたの番です
              </span>
              <span v-else-if="conversationActive" class="cc-status-text cc-status-waiting">
                マイクボタンを押して話してください
              </span>
              <span v-else class="cc-status-text cc-status-idle">
                スタートボタンでロープレを開始
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- モード選択バー（プレイパネルとプロンプトパネルの間） -->
      <div class="cc-mode-selector-bar">
        <UIcon name="i-lucide-settings-2" class="cc-mode-selector-icon" />
        <span class="cc-mode-selector-label">モード選択：</span>
        <USelect
          v-model="selectedMode"
          :items="modeOptions"
          size="md"
          class="cc-mode-selector-select"
        />
        <span class="cc-mode-selector-hint">{{ getModeDescription(selectedMode) }}</span>
      </div>

      <!-- プロンプトパネル（下） -->
      <div class="cc-panel cc-prompt-panel">
        <div class="cc-panel-header">
          <UIcon name="i-lucide-file-code" class="cc-panel-header-icon" />
          <span class="cc-panel-header-title">プロンプト</span>
          <span class="cc-prompt-mode-label">{{ selectedModeLabel }}</span>
        </div>

        <div class="cc-prompt-content-wrapper">
          <div v-if="currentPrompt?.isGenerating" class="cc-prompt-loading">
            <span class="cc-loading-spinner"></span>
            <span>プロンプトを生成中...</span>
          </div>
          <pre v-else-if="currentPrompt?.content" class="cc-prompt-content-text">{{ currentPrompt.content }}</pre>
          <div v-else class="cc-prompt-empty">
            <span>まだ生成されていません</span>
            <p class="cc-prompt-empty-hint">設計パネルの「プロンプト生成」ボタンで生成します</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Character Settings Popup -->
    <CharacterSettingsPopup
      :is-open="showCharacterSettingsPopup"
      :current-settings="characterSettings"
      @close="showCharacterSettingsPopup = false"
      @apply="applyCharacterSettings"
    />
  </div>
</template>

<script setup lang="ts">
import type { FileData, RoleplayContext } from '../types/roleplay'
import type { RealtimeConfig } from '../composables/useRealtimeAPI'

definePageMeta({
  layout: 'default'
})

// Use the Realtime API composable
const {
  isConnected,
  isPlaying,
  isRecording: realtimeIsRecording,
  isSpeaking,
  connectionStatus,
  toggleRoleplay: realtimeToggleRoleplay,
  toggleRecording,
  startRoleplay,
  stopRoleplay,
  onTranscript,
  onAIResponse,
  onError
} = useRealtimeAPI()

// State
const selectedCategory = ref('sales-basics')
const selectedRoleplayDesign = ref('')
const operationTab = ref('chat')

// Operation Tab Items for UTabs
const operationTabItems = [
  { label: 'チャット', value: 'chat' },
  { label: 'コース', value: 'course' },
  { label: 'ファイル', value: 'files' }
]

const selectedLesson = ref('')
const selectedMode = ref('confirmation')
const selectedCharacter = ref('akira')
const selectedVoice = ref<'alloy' | 'echo' | 'shimmer' | 'ash' | 'ballad' | 'coral' | 'sage' | 'verse'>('alloy')

// 構築パネル用の状態
const isBuilding = ref(false)
const buildingStep = ref('')
const buildGoals = ref<string[]>([])
const buildPoints = ref<Array<{ question: string; point: string; correctAnswer: string }>>([])
const buildOverview = ref('')
const buildScriptLines = ref<Array<{ speaker: 'self' | 'opponent' | 'narrator'; text: string }>>([])

// スクリプト展開トグル
const toggleScriptExpand = (index: number) => {
  if (scripts.value[index]) {
    scripts.value[index].expanded = !scripts.value[index].expanded
  }
}

// Select options for USelect components
const categoryOptions = [
  { label: '営業基礎', value: 'sales-basics' },
  { label: 'カスタマーサービス', value: 'customer-service' },
  { label: 'プレゼンテーション', value: 'presentation' },
  { label: '交渉術', value: 'negotiation' },
  { label: 'リーダーシップ', value: 'leadership' }
]

const roleplayDesignOptions = [
  { label: '新規作成', value: 'new' },
  { label: '飛び込み営業', value: 'cold-call' },
  { label: '商品説明', value: 'product-intro' },
  { label: 'クロージング', value: 'closing' },
  { label: 'クレーム対応', value: 'complaint' }
]

const fileTypeOptions = [
  { label: '未分類', value: '未分類' },
  { label: '見本データ', value: '見本データ' },
  { label: '教材データ', value: '教材データ' },
  { label: '自社データ', value: '自社データ' },
  { label: '顧客データ', value: '顧客データ' },
  { label: 'その他', value: 'その他' }
]

const lessonOptions = [
  { label: 'Lv.1: 飛び込み学習モード', value: 'lv1-1' },
  { label: 'Lv.1: 話すことまとめ', value: 'lv1-2' },
  { label: 'Lv.2: 相手に寄り添うトーク', value: 'lv2-1' },
  { label: 'Lv.2: 言葉の選び方', value: 'lv2-2' }
]

// キャラクターオプション（BuildPanelのキャラクターから動的に生成）
const characterOptions = computed(() => {
  const characters = buildPanelRef.value?.characters || []
  if (characters.length === 0) {
    // デフォルト（BuildPanelがまだマウントされていない場合）
    return [
      { label: '高橋 明（IT企業 PM）', value: 'akira' },
      { label: '田村 篤志（製造業 工場長）', value: 'atsushi' },
      { label: '木村 潤（スタートアップ CEO）', value: 'jun' },
      { label: '渡辺 啓二（金融機関 部長）', value: 'keiji' },
      { label: '山本 恵子（小売業 バイヤー）', value: 'keiko' },
      { label: '佐藤 京子（人材会社 採用責任者）', value: 'kyoko' },
      { label: '中村 誠（コンサル パートナー）', value: 'makoto' },
      { label: '鈴木 菜々（ベンチャー マーケター）', value: 'nana' },
      { label: '伊藤 さくら（医療機関 事務長）', value: 'sakura' },
      { label: '加藤 武（建設会社 社長）', value: 'takeshi' },
      { label: '松本 達也（広告代理店 CD）', value: 'tatsuya' }
    ]
  }
  return characters.map((c: any) => ({
    label: `${c.name}（${c.attribute.split(' ')[0]}）`,
    value: c.id
  }))
})

// モード選択オプション
const modeOptions = [
  { label: '台本モード', value: 'subtitle' },
  { label: 'お手本モード', value: 'ai-demo' },
  { label: '確認モード', value: 'confirmation' },
  { label: '実戦モード', value: 'practice' }
]

const voiceOptions = [
  { label: 'Alloy', value: 'alloy' },
  { label: 'Echo', value: 'echo' },
  { label: 'Shimmer', value: 'shimmer' }
]

// Roleplay state - now linked to Realtime API
const conversationActive = computed(() => isPlaying.value)
const isRecording = computed(() => realtimeIsRecording.value)
const showResult = ref(false)
const score = ref(85)
const feedbackHtml = ref('')

// Custom character animation webm files
const customListeningVideo = ref<string | null>(null)
const customSpeakingVideo = ref<string | null>(null)

// Video element ref
const characterVideoRef = ref<HTMLVideoElement | null>(null)

// Connection status - now from Realtime API
const connectionStatusClass = computed(() => {
  if (isConnected.value) {
    return isSpeaking.value ? 'cc-status-speaking' : 'cc-status-connected'
  }
  return 'cc-status-disconnected'
})
const connectionStatusText = computed(() => connectionStatus.value)

// Data
const uploadedFiles = ref<FileData[]>([])
const scripts = ref<Array<{ mode: string; content: string; expanded: boolean }>>([])
const systemPrompts = ref<Array<{ mode: string; content: string; expanded: boolean }>>([])
const selectedFileIndex = ref<number | null>(null)
const defaultModes = ['台本モード', 'お手本モード', '確認モード', '実戦モード']
const isGeneratingPrompts = ref(false)

// Mode mapping for API calls
const modeKeyMap: Record<string, string> = {
  '台本モード': 'subtitle',
  'お手本モード': 'ai-demo',
  '確認モード': 'confirmation',
  '実戦モード': 'practice'
}

// System prompts display with generation state
interface SystemPromptDisplay {
  mode: string
  modeKey: string
  content: string
  expanded: boolean
  isGenerating: boolean
}

const systemPromptsDisplay = ref<SystemPromptDisplay[]>(
  defaultModes.map(mode => ({
    mode,
    modeKey: modeKeyMap[mode] || 'practice',
    content: '',
    expanded: false,
    isGenerating: false
  }))
)

// モードラベルのマッピング
const modeLabelMap: Record<string, string> = {
  'subtitle': '台本モード',
  'ai-demo': 'お手本モード',
  'confirmation': '確認モード',
  'practice': '実戦モード'
}

// 選択中のモードのラベル
const selectedModeLabel = computed(() => modeLabelMap[selectedMode.value] || selectedMode.value)

// モードの説明を取得
const getModeDescription = (mode: string): string => {
  const descriptions: Record<string, string> = {
    'subtitle': '台本を見ながら練習',
    'ai-demo': 'AIがお手本を実演',
    'confirmation': '一問一答形式で確認',
    'practice': '本番を想定した実践練習'
  }
  return descriptions[mode] || ''
}

// 選択中のモードに対応するプロンプト
const currentPrompt = computed(() => {
  return systemPromptsDisplay.value.find(p => p.modeKey === selectedMode.value)
})

// 選択中のモードのインデックス
const currentPromptIndex = computed(() => {
  return systemPromptsDisplay.value.findIndex(p => p.modeKey === selectedMode.value)
})

// 選択中のモードのプロンプトを生成
const generateCurrentModePrompt = () => {
  const index = currentPromptIndex.value
  if (index >= 0) {
    generateSinglePrompt(selectedMode.value, index)
  }
}

// 選択中のモードのプロンプトを編集
const editCurrentPrompt = () => {
  const index = currentPromptIndex.value
  if (index >= 0) {
    editPrompt(index)
  }
}

// コースツリー構造
interface CourseLesson {
  name: string
  status: 'draft' | 'published'
}

interface CourseCategory {
  name: string
  expanded: boolean
  lessons: CourseLesson[]
}

const courseTree = ref<CourseCategory[]>([
  {
    name: 'Lv.1 学習',
    expanded: true,
    lessons: [
      { name: '飛び込み学習モード', status: 'published' },
      { name: '話すことまとめ', status: 'published' },
      { name: '基本挨拶トレーニング', status: 'draft' }
    ]
  },
  {
    name: 'Lv.2 確認',
    expanded: false,
    lessons: [
      { name: '相手に寄り添うトーク', status: 'published' },
      { name: '言葉の選び方', status: 'draft' },
      { name: 'クロージング術', status: 'draft' }
    ]
  },
  {
    name: 'Lv.3 実践',
    expanded: false,
    lessons: [
      { name: 'ロールプレイング基礎', status: 'draft' },
      { name: '顧客対応シミュレーション', status: 'draft' }
    ]
  },
  {
    name: 'Lv.4 実力だめし',
    expanded: false,
    lessons: [
      { name: '総合テスト', status: 'draft' }
    ]
  }
])

// 選択されたキャラクター情報（BuildPanelから自動取得）
interface SelectedCharacterInfo {
  id: string
  name: string
  age: number
  attribute: string
  personality: string
  catchphrase: string
  avatar: string
  voice: 'alloy' | 'echo' | 'shimmer' | 'ash' | 'ballad' | 'coral' | 'sage' | 'verse'
}
const selectedCharacterInfo = computed<SelectedCharacterInfo | null>(() => {
  const characters = buildPanelRef.value?.characters || []
  const found = characters.find((c: any) => c.id === selectedCharacter.value)
  return found || null
})

// Character settings for popup
const characterSettings = computed(() => ({
  character: selectedCharacter.value,
  voice: selectedCharacterInfo.value?.voice || 'alloy',
  speechRate: 1.0,
  tone: 'neutral',
  responseStyle: 'professional',
  difficulty: 'normal',
  // 選択されたキャラクター情報を追加
  characterInfo: selectedCharacterInfo.value
}))

// Dialogs
const showCharacterSettingsPopup = ref(false)

// ロープレ構築可能かどうか（ChatAreaからファイルがあるか確認）
const canGenerateRoleplay = computed(() => {
  return uploadedFiles.value.length > 0 || chatAreaRef.value?.collectedData?.files?.length > 0
})

// 構築スタートボタンクリック時 - ChatAreaのstartRoleplayGenerationを呼び出す
const handleBuildStart = () => {
  // チャットタブに切り替え
  operationTab.value = 'chat'
  // ChatAreaの構築フローを開始
  nextTick(() => {
    chatAreaRef.value?.startRoleplayGeneration?.()
  })
}

// Drag & Drop
const isDragging = ref(false)
const dragCounter = ref(0)

// Refs
const roleplayDesignForm = ref<any>(null)
const chatAreaRef = ref<any>(null)
const buildPanelRef = ref<any>(null)

// Methods

// Toggle roleplay - now uses Realtime API
const toggleRoleplay = async () => {
  const config: RealtimeConfig = {
    voice: selectedCharacterInfo.value?.voice || 'alloy',
    instructions: getInstructionsForMode(selectedMode.value)
  }
  await realtimeToggleRoleplay(config)
}

// Get instructions based on selected mode
const getInstructionsForMode = (mode: string): string => {
  // 生成されたプロンプトがあればそれを使用
  const generatedPrompt = systemPromptsDisplay.value.find(p => p.modeKey === mode)
  if (generatedPrompt?.content) {
    return generatedPrompt.content
  }

  // デフォルトのプロンプト（生成前）
  const modeInstructions: Record<string, string> = {
    'subtitle': 'あなたはロールプレイの台本読み上げアシスタントです。台本に沿って話してください。',
    'ai-demo': 'あなたはお手本を見せるアシスタントです。理想的な対応を実演してください。',
    'confirmation': 'あなたは確認モードのアシスタントです。ユーザーの理解度を確認しながら進めてください。',
    'practice': 'あなたは実戦モードの練習相手です。リアルな顧客として振る舞い、ユーザーの対応を評価してください。'
  }
  return modeInstructions[mode] || modeInstructions['practice']
}

// Toggle microphone - now uses Realtime API
const toggleMic = () => {
  if (isConnected.value) {
    toggleRecording()
  }
}

// Watch for speaking state changes to control video animation
watch(isSpeaking, (speaking) => {
  updateCharacterAnimation(speaking)
})

// Update character animation based on speaking state
const updateCharacterAnimation = (speaking: boolean) => {
  const video = characterVideoRef.value || document.getElementById('characterVideo') as HTMLVideoElement
  if (!video) return

  if (speaking && customSpeakingVideo.value) {
    video.src = customSpeakingVideo.value
    video.play()
  } else if (!speaking && customListeningVideo.value) {
    video.src = customListeningVideo.value
    video.play()
  }
}

// Set custom animation videos
const setCustomAnimations = (listening: string | null, speaking: string | null) => {
  customListeningVideo.value = listening
  customSpeakingVideo.value = speaking
}

const openCharacterSettings = () => {
  showCharacterSettingsPopup.value = true
}

// BuildPanelでキャラクターが選択された時の処理
const handleCharacterSelected = (character: SelectedCharacterInfo) => {
  // 選択されたキャラクターIDを更新（selectedCharacterInfoはcomputedで自動取得）
  selectedCharacter.value = character.id
  // キャラクター設定ポップアップを開く
  showCharacterSettingsPopup.value = true
}

interface CharacterSettings {
  character: string
  voice: string
  speechRate: number
  tone: string
  responseStyle: string
  difficulty: string
  customListeningVideo?: string | null
  customSpeakingVideo?: string | null
}

const applyCharacterSettings = (settings: CharacterSettings) => {
  selectedCharacter.value = settings.character
  selectedVoice.value = settings.voice as typeof selectedVoice.value

  // Apply custom animation videos if provided
  if (settings.customListeningVideo !== undefined) {
    customListeningVideo.value = settings.customListeningVideo
  }
  if (settings.customSpeakingVideo !== undefined) {
    customSpeakingVideo.value = settings.customSpeakingVideo
  }

  showCharacterSettingsPopup.value = false
}

const addNewCategory = () => {
  const newCategory: CourseCategory = {
    name: `新規カテゴリー ${courseTree.value.length + 1}`,
    expanded: true,
    lessons: []
  }
  courseTree.value.push(newCategory)
}

const addNewLesson = () => {
  // 最初に展開されているカテゴリーに追加、なければ最初のカテゴリー
  const targetIndex = courseTree.value.findIndex(c => c.expanded)
  const index = targetIndex >= 0 ? targetIndex : 0

  if (courseTree.value.length > 0) {
    courseTree.value[index].lessons.push({
      name: `新規レッスン ${courseTree.value[index].lessons.length + 1}`,
      status: 'draft'
    })
    courseTree.value[index].expanded = true
  }
}

const toggleTreeNode = (type: string, index: number) => {
  if (type === 'category') {
    courseTree.value[index].expanded = !courseTree.value[index].expanded
  }
}

const selectLesson = (catIndex: number, lessonIndex: number, lesson: CourseLesson) => {
  selectedLesson.value = `${catIndex}-${lessonIndex}`
  console.log('Selected lesson:', lesson.name)
}

const editScript = (index: number) => {
  // TODO: スクリプト編集処理
  console.log('Edit script', index)
}

// Toggle prompt card expansion
const togglePromptExpand = (index: number) => {
  systemPromptsDisplay.value[index].expanded = !systemPromptsDisplay.value[index].expanded
}

// Generate a single prompt
const generateSinglePrompt = async (modeKey: string, index: number) => {
  if (systemPromptsDisplay.value[index].isGenerating) return

  systemPromptsDisplay.value[index].isGenerating = true
  systemPromptsDisplay.value[index].expanded = true

  try {
    // ポイントデータから評価ポイントを構築
    const pointsForDesign = buildPoints.value.map(p => ({
      question: p.question,
      criteria: p.correctAnswer,
      example: p.point
    }))

    // キャラクター情報を取得
    const characterInfo = selectedCharacterInfo.value

    const response = await $fetch<{ mode: string; systemPrompt: string }>('/api/generate-prompt', {
      method: 'POST',
      body: {
        mode: modeKey,
        roleplayDesign: {
          situation: buildOverview.value,
          opponentSetting: characterInfo ? `${characterInfo.name}（${characterInfo.attribute}）: ${characterInfo.personality}` : undefined,
          points: pointsForDesign.length > 0 ? pointsForDesign : undefined
        },
        files: uploadedFiles.value.map(f => ({
          name: f.name,
          content: f.extractedText,
          summary: f.summary
        }))
      }
    })

    systemPromptsDisplay.value[index].content = response.systemPrompt
  } catch (error) {
    console.error('Error generating prompt:', error)
    systemPromptsDisplay.value[index].content = 'プロンプトの生成に失敗しました。APIキーを確認してください。'
  } finally {
    systemPromptsDisplay.value[index].isGenerating = false
  }
}

// Generate all prompts
const generateAllPrompts = async () => {
  console.log('🚀 generateAllPrompts called')
  console.log('📝 systemPromptsDisplay:', systemPromptsDisplay.value)

  if (isGeneratingPrompts.value) {
    console.log('⚠️ Already generating, skipping')
    return
  }

  isGeneratingPrompts.value = true

  // Generate prompts sequentially to avoid server overload
  for (let index = 0; index < systemPromptsDisplay.value.length; index++) {
    const prompt = systemPromptsDisplay.value[index]
    console.log(`📝 Generating prompt for mode: ${prompt.modeKey} at index ${index}`)
    await generateSinglePrompt(prompt.modeKey, index)
  }
  console.log('✅ All prompts generated')
  isGeneratingPrompts.value = false
}

const editPrompt = (index: number) => {
  // TODO: プロンプト編集処理
  console.log('Edit prompt', index)
}

// ロープレ構築開始（ChatAreaから呼ばれる）
const handleStartRoleplayGeneration = async (context: RoleplayContext) => {
  console.log('Starting roleplay generation with context:', context)

  // 構築開始
  isBuilding.value = true
  buildingStep.value = 'ポイントを抽出中...'

  // ロープレ設計データを取得
  const roleplayDesign = roleplayDesignForm.value?.getDesign?.() || null

  // ゴールラベルのマッピング
  const goalLabels: Record<string, string> = {
    'memorize': '暗記',
    'response': '切り返し',
    'hearing': 'ヒアリング',
    'speaking': '話し方'
  }

  // ゴールを設定
  buildGoals.value = context.goals.map(g => goalLabels[g] || g)

  try {
    // 1. ポイント要約を生成
    buildingStep.value = 'ポイントを抽出中...'
    const pointsResponse = await $fetch<{ overview: string; points: Array<{ question: string; point: string; correctAnswer: string }> }>('/api/generate-points', {
      method: 'POST',
      body: {
        files: context.files.map(f => ({
          name: f.name,
          content: f.extractedText,
          dataType: f.dataType
        })),
        goals: context.goals.map(g => goalLabels[g] || g),
        additionalInfo: context.additionalInfo,
        roleplayDesign
      }
    })

    // ポイントを構築パネルに設定
    buildPoints.value = pointsResponse.points

    // 概要を設定（APIから返された概要を使用）
    buildOverview.value = pointsResponse.overview || ''

    // ポイント生成後、設計パネルのポイントタブを強制的にオンにする
    if (buildPanelRef.value?.setActiveTab) {
      buildPanelRef.value.setActiveTab('points')
    }

    // 2. 台本生成（vs先生、vsお客さん）
    buildingStep.value = '台本を生成中...'
    const scriptsResponse = await $fetch<{
      teacherScript: string
      customerScript: string
    }>('/api/generate-scripts', {
      method: 'POST',
      body: {
        files: context.files.map(f => ({
          name: f.name,
          content: f.extractedText,
          dataType: f.dataType
        })),
        goals: context.goals.map(g => goalLabels[g] || g),
        additionalInfo: context.additionalInfo,
        points: pointsResponse.points,
        roleplayDesign
      }
    })

    // 生成結果をscriptsに追加（構築パネル用）
    scripts.value = [
      { mode: '台本（vs先生）', content: scriptsResponse.teacherScript, expanded: false },
      { mode: '台本（vsお客さん）', content: scriptsResponse.customerScript, expanded: false }
    ]

    // 台本行をパースしてBuildPanel用に設定
    buildScriptLines.value = parseScriptToLines(scriptsResponse.teacherScript)

    // 3. プロンプト生成（vs先生、フィードバック、vs客シナリオ10パターン）
    buildingStep.value = 'プロンプトを生成中...'
    const promptsResponse = await $fetch<{
      teacherPrompt: string
      feedbackPrompt: string
      customerScenarios: string[]
    }>('/api/generate-roleplay-prompts', {
      method: 'POST',
      body: {
        files: context.files.map(f => ({
          name: f.name,
          content: f.extractedText,
          dataType: f.dataType
        })),
        goals: context.goals.map(g => goalLabels[g] || g),
        additionalInfo: context.additionalInfo,
        points: pointsResponse.points,
        roleplayDesign
      }
    })

    // プロンプトを更新（プロンプトパネル用）
    systemPromptsDisplay.value = [
      { mode: 'vs先生プロンプト', modeKey: 'teacher', content: promptsResponse.teacherPrompt, expanded: false, isGenerating: false },
      { mode: 'フィードバック基準', modeKey: 'feedback', content: promptsResponse.feedbackPrompt, expanded: false, isGenerating: false },
      ...promptsResponse.customerScenarios.map((scenario: string, i: number) => ({
        mode: `vs客シナリオ${i + 1}`,
        modeKey: `customer-${i + 1}`,
        content: scenario,
        expanded: false,
        isGenerating: false
      }))
    ]

    // 構築完了
    isBuilding.value = false
    buildingStep.value = ''

    // 完了通知
    chatAreaRef.value?.notifyGenerationComplete(true)

  } catch (error) {
    console.error('Error generating roleplay:', error)
    isBuilding.value = false
    buildingStep.value = ''
    chatAreaRef.value?.notifyGenerationComplete(false)
  }
}

// ポイントをフォーマット
const formatPoints = (points: Array<{ question: string; answer: string }>): string => {
  return points.map((p, i) => `【ポイント${i + 1}】\n問: ${p.question}\n答: ${p.answer}`).join('\n\n')
}

// 台本テキストをScriptLine配列にパース
const parseScriptToLines = (scriptText: string): Array<{ speaker: 'self' | 'opponent' | 'narrator'; text: string }> => {
  const lines: Array<{ speaker: 'self' | 'opponent' | 'narrator'; text: string }> = []
  const scriptLines = scriptText.split('\n').filter(line => line.trim())

  for (const line of scriptLines) {
    // 「自分:」「相手:」「先生:」「お客さん:」「ナレーター:」などのパターンを検出
    if (line.match(/^(自分|あなた|営業|練習者|ユーザー|スタッフ)[：:]/)) {
      lines.push({ speaker: 'self', text: line.replace(/^(自分|あなた|営業|練習者|ユーザー|スタッフ)[：:]/, '').trim() })
    } else if (line.match(/^(相手|先生|お客さん|お客様|顧客|上司)[：:]/)) {
      lines.push({ speaker: 'opponent', text: line.replace(/^(相手|先生|お客さん|お客様|顧客|上司)[：:]/, '').trim() })
    } else if (line.match(/^(ナレーター|ナレーション|解説|注釈|タイトル|補足)[：:]/)) {
      lines.push({ speaker: 'narrator', text: line.replace(/^(ナレーター|ナレーション|解説|注釈|タイトル|補足)[：:]/, '').trim() })
    } else if (lines.length > 0) {
      // 前の話者の続きとして追加
      lines[lines.length - 1].text += '\n' + line.trim()
    } else {
      // 最初の行が話者指定なしの場合はナレーターとして扱う
      lines.push({ speaker: 'narrator', text: line.trim() })
    }
  }

  return lines
}

const handleFileUploadStarted = (file: FileData) => {
  // アップロード開始時にリストに追加（未分類状態）
  uploadedFiles.value.push(file)
}

const handleFileUploaded = (file: FileData) => {
  // 解析完了時にファイルの抽出テキストを更新
  const existingFile = uploadedFiles.value.find(f => f.name === file.name)
  if (existingFile) {
    existingFile.extractedText = file.extractedText
  }
}

const handleFileTypeUpdated = (data: { fileName: string; dataType: string }) => {
  // タイプ選択時にファイルのdataTypeを更新
  const file = uploadedFiles.value.find(f => f.name === data.fileName)
  if (file) {
    file.dataType = data.dataType
  }
}

const handleFileRangeSelected = (data: { fileName: string; selectedRange: string[]; usedContent: string; unusedContent: string }) => {
  // 範囲選択時にファイルの利用部分/不要部分を更新
  const file = uploadedFiles.value.find(f => f.name === data.fileName) as any
  if (file) {
    file.selectedRange = data.selectedRange
    file.usedContent = data.usedContent
    file.unusedContent = data.unusedContent
    file.content = data.usedContent  // 互換性のため
  }
  console.log('📐 Range selected for', data.fileName, ':', data.selectedRange.length === 0 ? '全部' : data.selectedRange.join(', '))
}

const handleFileGoalsUpdated = (data: { fileName: string; goals: string[] }) => {
  // ゴール選択時にファイルのgoalsを更新
  const file = uploadedFiles.value.find(f => f.name === data.fileName) as any
  if (file) {
    file.goals = data.goals
  }
  console.log('🎯 Goals set for', data.fileName, ':', data.goals.join(', '))
}

const toggleFileExpand = (index: number) => {
  if (selectedFileIndex.value === index) {
    selectedFileIndex.value = null
  } else {
    selectedFileIndex.value = index
  }
}

const downloadFile = (file: FileData) => {
  // 抽出テキストをダウンロード
  const content = file.extractedText || ''
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${file.name.replace(/\.[^/.]+$/, '')}_extracted.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ファイル拡張子からカラークラスを取得
const getFileColorClass = (fileName: string): string => {
  const ext = fileName.toLowerCase().split('.').pop() || ''
  if (ext === 'pdf') return 'cc-file-pdf'
  if (['pptx', 'ppt'].includes(ext)) return 'cc-file-ppt'
  if (['xlsx', 'xls'].includes(ext)) return 'cc-file-excel'
  if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext)) return 'cc-file-audio'
  if (['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext)) return 'cc-file-video'
  if (['docx', 'doc'].includes(ext)) return 'cc-file-word'
  return 'cc-file-default'
}

// ファイル拡張子からアイコンを取得
const getFileIcon = (fileName: string): string => {
  const ext = fileName.toLowerCase().split('.').pop() || ''
  if (ext === 'pdf') return '📕'
  if (['pptx', 'ppt'].includes(ext)) return '📊'
  if (['xlsx', 'xls'].includes(ext)) return '📗'
  if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext)) return '🎵'
  if (['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext)) return '🎬'
  if (['docx', 'doc'].includes(ext)) return '📘'
  return '📄'
}

// ファイルの範囲選択オプションを取得
const getFileRangeOptions = (file: FileData): { label: string; value: string }[] => {
  if (!file.separable || !file.separable.items || file.separable.items.length === 0) {
    return []
  }
  return file.separable.items.map(item => ({
    label: item.label,
    value: String(item.value)
  }))
}

// ファイルの範囲選択オプションを取得（「全部」オプション付き）
const getFileRangeOptionsWithAll = (file: FileData): { label: string; value: string }[] => {
  const options = getFileRangeOptions(file)
  if (options.length === 0) return []
  return [
    { label: '全部', value: '__all__' },
    ...options
  ]
}

// ファイルの選択範囲の値を取得（USelectMenu用）
const getFileSelectedRangeValue = (file: FileData): string[] => {
  if (!file.selectedRange || file.selectedRange.length === 0) {
    return []
  }
  return file.selectedRange.map(v => String(v))
}

// 範囲変更時の処理（「全部」オプション対応）
const handleRangeChangeWithAll = async (file: FileData, newRange: string[]) => {
  // 「全部」が選択された場合
  if (newRange.includes('__all__')) {
    // 他のオプションがあれば「全部」のみにする、なければ全てを選択
    const allOptions = getFileRangeOptions(file)
    const allValues = allOptions.map(o => o.value)

    // 前回「全部」がなくて今回「全部」が追加された場合 → 全選択
    const prevHadAll = file.selectedRange?.includes('__all__')
    if (!prevHadAll) {
      file.selectedRange = allValues
      await reanalyzeFileContent(file, allValues)
      return
    }
  }

  // 「__all__」を除外して処理
  const filteredRange = newRange.filter(v => v !== '__all__')
  await handleRangeChange(file, filteredRange)
}

// 範囲変更時の処理
const handleRangeChange = async (file: FileData, newRange: string[]) => {
  // ファイルの選択範囲を更新
  file.selectedRange = newRange

  // 範囲が空の場合は何もしない
  if (newRange.length === 0) {
    file.usedContent = ''
    return
  }

  // 再分析が必要な場合は実行
  await reanalyzeFileContent(file, newRange)
}

// ファイルコンテンツを再分析
const reanalyzeFileContent = async (file: FileData, selectedRange: string[]) => {
  const ext = file.name.toLowerCase().split('.').pop() || ''
  const needsAIAnalysis = ['pdf', 'mp3', 'wav', 'm4a', 'mp4', 'mov', 'avi', 'webm'].includes(ext)

  // ChatAreaからファイルオブジェクトを取得
  const chatArea = chatAreaRef.value as any
  if (!chatArea) return

  // 対応するFileオブジェクトを見つける
  const fileObj = chatArea.collectedData?.files?.find((f: any) => f.name === file.name)?.file
  if (!fileObj && needsAIAnalysis) {
    console.warn('File object not found for re-analysis')
    return
  }

  try {
    if (needsAIAnalysis && fileObj) {
      // PDFや音声/動画の場合はOpenAI APIで再分析
      const analyzeFormData = new FormData()
      analyzeFormData.append('file', fileObj)
      analyzeFormData.append('fileType', ext === 'pdf' ? 'pdf' : (['mp3', 'wav', 'm4a'].includes(ext) ? 'audio' : 'video'))
      analyzeFormData.append('selectedRange', JSON.stringify(selectedRange.map(v => file.separable?.isNumeric ? Number(v) : v)))

      const response = await globalThis.$fetch('/api/analyze', {
        method: 'POST',
        body: analyzeFormData
      }) as { success: boolean; text?: string }

      if (response.success && response.text) {
        file.extractedText = response.text
        file.usedContent = response.text
      }
    } else {
      // Excel/PowerPointの場合はextract-content APIで再分析
      // ファイルバッファはサーバーに保存されているので、fileIdで取得
      // 現状はChatAreaからの再アップロードが必要
      // 簡易実装：extractedTextから範囲を抽出
      if (file.separable?.type === 'sheet') {
        // Excelのシート選択
        const fullText = file.extractedText || ''
        const selectedSheets = selectedRange
        const parts: string[] = []

        for (const sheetName of selectedSheets) {
          const regex = new RegExp(`\\[${sheetName}\\][\\s\\S]*?(?=\\n\\[|$)`, 'g')
          const match = fullText.match(regex)
          if (match) {
            parts.push(match[0])
          }
        }
        file.usedContent = parts.join('\n').trim()
      } else if (file.separable?.type === 'slide') {
        // PowerPointのスライド選択
        const fullText = file.extractedText || ''
        const selectedSlides = selectedRange.map(v => Number(v))
        const parts: string[] = []

        for (const slideNum of selectedSlides) {
          const regex = new RegExp(`\\[スライド ${slideNum}\\][\\s\\S]*?(?=\\n\\[スライド|$)`, 'g')
          const match = fullText.match(regex)
          if (match) {
            parts.push(match[0])
          }
        }
        file.usedContent = parts.join('\n').trim()
      }
    }
  } catch (error) {
    console.error('Re-analysis error:', error)
  }
}

// ファイルの範囲表示を取得（テキスト表示用 - 未使用だが互換性のため残す）
const getFileRangeDisplay = (file: FileData): string => {
  if (!file.selectedRange || file.selectedRange.length === 0) {
    return '未選択'
  }
  return file.selectedRange.join(', ')
}

// ファイルの内容表示を取得（利用部分のみ）
const getFileContentDisplay = (file: FileData): string => {
  const fileAny = file as any
  // usedContentがあればそれを使用、なければextractedText
  return fileAny.usedContent || file.extractedText || ''
}

// Drag & Drop handlers
const handleDragEnter = (event: DragEvent) => {
  dragCounter.value++
  if (event.dataTransfer?.types.includes('Files')) {
    isDragging.value = true
  }
}

const handleDragOver = (event: DragEvent) => {
  if (event.dataTransfer?.types.includes('Files')) {
    isDragging.value = true
  }
}

const handleDragLeave = () => {
  dragCounter.value--
  if (dragCounter.value === 0) {
    isDragging.value = false
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  dragCounter.value = 0

  const file = event.dataTransfer?.files[0]
  if (file) {
    // チャットタブに切り替え
    operationTab.value = 'chat'
    // ChatAreaのhandleFileを呼び出すためにイベントを発火
    // ChatAreaコンポーネントにrefを追加して直接呼び出す
    chatAreaRef.value?.handleDroppedFile(file)
  }
}
</script>

<style scoped>
/* コンポーネント固有のスタイル */

/* 上部セレクターバー */
.cc-selector-bar {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 12px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  margin-bottom: 0;
}

.cc-selector-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cc-selector-icon {
  font-size: 18px;
  color: #0284c7;
}

.cc-selector-label {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
}

.cc-selector-select {
  min-width: 180px;
}

/* 構築中メッセージ */
.cc-building-message {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
  padding: 6px 16px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 20px;
  animation: pulse-building 1.5s ease-in-out infinite;
}

.cc-building-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.cc-building-text {
  font-size: 13px;
  font-weight: 600;
  color: white;
}

@keyframes pulse-building {
  0%, 100% {
    box-shadow: 0 2px 12px rgba(99, 102, 241, 0.4);
  }
  50% {
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.6);
  }
}

/* ヘッダーアクションボタン */
.cc-header-action-button {
  margin-left: auto;
  height: 36px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.3);
  transition: all 0.2s;
}

.cc-header-action-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
}

.cc-header-action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cc-header-action-icon {
  font-size: 14px;
  margin-right: 6px;
}

.cc-play-component.collapsed {
  display: none;
}

.cc-play-toggle-icon.rotated {
  transform: rotate(180deg);
}

.cc-file-list-display {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cc-file-item-card {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.2s;
  border-left: 4px solid #9ca3af;
}

.cc-file-item-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.cc-file-item-card.cc-file-item-expanded {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

/* ファイルタイプ別カラー - 全体に薄く色付け */
.cc-file-item-card.cc-file-pdf {
  border-left-color: #3b82f6;
  background: #eff6ff;
}

.cc-file-item-card.cc-file-pdf:hover {
  background: #dbeafe;
}

.cc-file-item-card.cc-file-ppt {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.cc-file-item-card.cc-file-ppt:hover {
  background: #fee2e2;
}

.cc-file-item-card.cc-file-excel {
  border-left-color: #22c55e;
  background: #f0fdf4;
}

.cc-file-item-card.cc-file-excel:hover {
  background: #dcfce7;
}

.cc-file-item-card.cc-file-audio,
.cc-file-item-card.cc-file-video {
  border-left-color: #8b5cf6;
  background: #f5f3ff;
}

.cc-file-item-card.cc-file-audio:hover,
.cc-file-item-card.cc-file-video:hover {
  background: #ede9fe;
}

.cc-file-item-card.cc-file-word {
  border-left-color: #0284c7;
  background: #f0f9ff;
}

.cc-file-item-card.cc-file-word:hover {
  background: #e0f2fe;
}

.cc-file-item-card.cc-file-default {
  border-left-color: #9ca3af;
  background: #f9fafb;
}

.cc-file-item-card.cc-file-default:hover {
  background: #f3f4f6;
}

.cc-file-item-card {
  cursor: pointer;
  padding: 12px;
  transition: all 0.2s;
}

.cc-file-item-card:hover {
  transform: translateX(2px);
}

/* 概要セクション */
.cc-file-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ファイル名行 */
.cc-file-name-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.cc-file-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.cc-file-name {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  word-break: break-word;
  line-height: 1.4;
}

.cc-file-expand-icon {
  font-size: 10px;
  color: #9ca3af;
  flex-shrink: 0;
  margin-top: 4px;
  transition: transform 0.2s;
}

.cc-file-item-expanded .cc-file-expand-icon {
  color: #6b7280;
}

/* アップロード日 + ダウンロードボタン行 */
.cc-file-date-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 30px;
}

.cc-file-upload-date {
  font-size: 11px;
  color: #6b7280;
}

.cc-file-download-btn-inline {
  font-size: 11px;
  padding: 2px 8px;
  height: auto;
}

/* メタ情報行 */
.cc-file-meta-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding-left: 30px;
}

.cc-file-meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.cc-file-meta-label {
  color: #6b7280;
  font-size: 12px;
  flex-shrink: 0;
}

.cc-file-type-select {
  min-width: 100px;
}

.cc-file-range-select {
  min-width: 100px;
}

/* 内容詳細セクション */
.cc-file-detail {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.cc-file-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.cc-file-detail-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
}

.cc-file-content-text {
  margin: 0;
  padding: 12px;
  font-size: 12px;
  line-height: 1.6;
  color: #374151;
  white-space: pre-wrap;
  word-break: break-word;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  font-family: inherit;
  max-height: 300px;
  overflow-y: auto;
}

.cc-input-data-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 40px;
}

.cc-input-data-empty {
  text-align: center;
  color: #6b7280;
}

/* コースツリースタイル */
.cc-course-tree {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.cc-tree-category {
  margin-bottom: 4px;
}

.cc-tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.15s;
}

.cc-tree-node:hover {
  background: #f3f4f6;
}

.cc-tree-node-selected {
  background: #eff6ff;
  border-left: 3px solid #3b82f6;
}

.cc-tree-category-node {
  font-weight: 500;
}

.cc-tree-lesson-node {
  padding-left: 28px;
}

.cc-tree-expand-icon {
  width: 12px;
  font-size: 10px;
  color: #6b7280;
}

.cc-tree-icon {
  font-size: 16px;
}

.cc-tree-label {
  flex: 1;
  font-size: 14px;
  color: #374151;
}

.cc-tree-count {
  font-size: 12px;
  color: #9ca3af;
}

.cc-tree-status {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}

.cc-status-draft {
  background: #fef3c7;
  color: #92400e;
}

.cc-status-published {
  background: #d1fae5;
  color: #065f46;
}

.cc-tree-children {
  margin-left: 8px;
}

.cc-course-actions {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #e5e7eb;
}

.cc-course-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Speaking/Listening animation styles */
.cc-character-window.cc-speaking {
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
  animation: pulse-speaking 1s ease-in-out infinite;
}

.cc-character-window.cc-listening {
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
}

.cc-character.cc-character-speaking {
  animation: bounce-speaking 0.5s ease-in-out infinite;
}

@keyframes pulse-speaking {
  0%, 100% {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
  }
  50% {
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.8);
  }
}

@keyframes bounce-speaking {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* Connection status colors */
.cc-status-indicator.cc-status-speaking {
  background-color: #3b82f6;
  animation: pulse-dot 1s ease-in-out infinite;
}

.cc-status-indicator.cc-status-connected {
  background-color: #10b981;
}

.cc-status-indicator.cc-status-disconnected {
  background-color: #6b7280;
}

@keyframes pulse-dot {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Prompt generation styles */
.cc-generate-prompts-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 12px;
}

.cc-generate-hint {
  font-size: 12px;
  color: #6b7280;
}

.cc-prompt-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.cc-prompt-card-editable.cc-generating {
  border-color: #3b82f6;
  background: #eff6ff;
}

.cc-prompt-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px;
  color: #6b7280;
}

.cc-loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.cc-prompt-empty {
  padding: 40px 20px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.cc-prompt-empty-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #d1d5db;
}

.cc-prompt-content-wrapper {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.cc-prompt-content-wrapper .cc-prompt-content-text {
  flex: 1;
  margin: 0;
  padding: 16px;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin: 12px;
  font-family: inherit;
  color: #374151;
}

.cc-prompt-content-wrapper .cc-prompt-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

/* テストパネルヘッダー */
.cc-test-panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 48px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

/* 相手選択の左列 */
.cc-opponent-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-right: 1px solid #e5e7eb;
  background: #f8fafc;
  min-width: 140px;
  flex-shrink: 0;
}

.cc-opponent-thumbnail {
  width: 100%;
  aspect-ratio: 1;
  background: linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid #e5e7eb;
}

.cc-opponent-thumbnail:hover {
  border-color: #8b5cf6;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
}

.cc-opponent-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cc-opponent-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
}

.cc-opponent-select-wrapper,
.cc-mode-select-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cc-opponent-label,
.cc-mode-label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cc-opponent-select,
.cc-mode-select {
  width: 100%;
}

/* スペーサー */
.cc-opponent-spacer {
  flex: 1;
}

/* 操作ボタン */
.cc-opponent-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cc-sidebar-mic-button {
  width: 100%;
  height: 40px;
  font-size: 13px;
  font-weight: 600;
  justify-content: center;
  gap: 6px;
}

.cc-sidebar-mic-button.recording {
  animation: pulse 1.5s ease-in-out infinite;
}

.cc-sidebar-start-button {
  width: 100%;
  height: 44px;
  font-size: 14px;
  font-weight: 700;
  justify-content: center;
}

/* ステータスメッセージ */
.cc-status-message {
  padding: 10px 14px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  text-align: left;
}

.cc-sidebar-start-button {
  width: 100%;
  aspect-ratio: 1;
  font-size: 14px;
  font-weight: 700;
  justify-content: center;
  flex-direction: column;
  gap: 4px;
}

/* プロンプトパネルのモードラベル */
.cc-prompt-mode-label {
  margin-left: auto;
  font-size: 12px;
  font-weight: 500;
  color: #8b5cf6;
  background: #f5f3ff;
  padding: 4px 12px;
  border-radius: 4px;
}

/* モード選択バー */
.cc-mode-selector-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  margin-bottom: 12px;
  border: 1px solid #e2e8f0;
}

.cc-mode-selector-icon {
  font-size: 20px;
  color: #6366f1;
}

.cc-mode-selector-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.cc-mode-selector-select {
  min-width: 200px;
  font-weight: 500;
}

.cc-mode-selector-hint {
  font-size: 13px;
  color: #64748b;
  margin-left: auto;
  padding: 6px 14px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

/* ヘッダー保存ボタン */
.cc-header-save-button {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  transition: all 0.15s;
}

.cc-header-save-button:hover {
  color: #374151;
  background: #f1f5f9;
}

.cc-header-save-icon {
  font-size: 14px;
}

</style>
