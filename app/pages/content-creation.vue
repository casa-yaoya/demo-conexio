<template>
  <div class="content-creation-container">
    <!-- 操作コンポーネント (Left Column - spans 2 rows) -->
    <div
      class="cc-panel cc-operation-component"
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
      <!-- カテゴリー選択 -->
      <div class="cc-category-selector">
        <label class="cc-selector-label">コース:</label>
        <USelect
          v-model="selectedCategory"
          :items="categoryOptions"
          size="sm"
          class="flex-1"
          :ui="{ base: 'inline-flex items-center' }"
        />
      </div>

      <!-- タブナビゲーション -->
      <div class="cc-operation-tabs">
        <UButton
          variant="ghost"
          color="neutral"
          size="sm"
          class="cc-operation-tab"
          :class="{ active: operationTab === 'chat' }"
          @click="operationTab = 'chat'"
        >
          チャット
        </UButton>
        <UButton
          variant="ghost"
          color="neutral"
          size="sm"
          class="cc-operation-tab"
          :class="{ active: operationTab === 'course' }"
          @click="operationTab = 'course'"
        >
          コース
        </UButton>
        <UButton
          variant="ghost"
          color="neutral"
          size="sm"
          class="cc-operation-tab"
          :class="{ active: operationTab === 'files' }"
          @click="operationTab = 'files'"
        >
          ファイル
        </UButton>
      </div>

      <!-- チャットタブ -->
      <div v-show="operationTab === 'chat'" class="cc-operation-tab-content active">
        <ChatArea
          ref="chatAreaRef"
          @file-uploaded="handleFileUploaded"
          @file-upload-started="handleFileUploadStarted"
          @file-type-updated="handleFileTypeUpdated"
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
              :class="{ 'cc-file-item-expanded': selectedFileIndex === index }"
            >
              <!-- ファイルヘッダー（クリックで展開） -->
              <div class="cc-file-item-header" @click="toggleFileExpand(index)">
                <span class="cc-file-expand-icon">{{ selectedFileIndex === index ? '▼' : '▶' }}</span>
                <span class="cc-file-icon">📄</span>
                <div class="cc-file-info">
                  <span class="cc-file-name">{{ file.name }}</span>
                  <span class="cc-file-date">{{ file.uploadDate }}</span>
                </div>
                <USelect
                  v-model="file.dataType"
                  :items="fileTypeOptions"
                  size="xs"
                  class="min-w-[100px]"
                  :ui="{ base: 'inline-flex items-center' }"
                  @click.stop
                />
                <UButton
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  icon="i-lucide-download"
                  @click.stop="downloadFile(file)"
                />
              </div>
              <!-- 抽出テキスト表示（展開時のみ） -->
              <div v-if="selectedFileIndex === index" class="cc-file-extracted-text">
                <div class="cc-extracted-text-header">
                  <span>抽出されたテキスト</span>
                </div>
                <pre class="cc-extracted-text-content">{{ file.extractedText || '解析中...' }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- プレイコンポーネント (Right Column Top) -->
    <div class="cc-panel cc-play-component" :class="{ collapsed: playComponentCollapsed }">
      <!-- プレイエリアヘッダー -->
      <div class="cc-play-header">
        <div class="cc-lesson-selector">
          <label class="cc-selector-label">レッスン:</label>
          <USelect
            v-model="selectedLesson"
            :items="lessonOptions"
            placeholder="レッスンを選択..."
            size="sm"
            class="flex-1"
            :ui="{ base: 'inline-flex items-center' }"
          />
        </div>
      </div>

      <div class="cc-play-content">
        <!-- ロープレモード選択コンポーネント (Left) -->
        <div class="cc-roleplay-mode-component">
          <div class="cc-mode-title">モードを選ぶ</div>
          <div class="cc-mode-buttons">
            <UButton
              :variant="selectedMode === 'subtitle' ? 'solid' : 'outline'"
              :color="selectedMode === 'subtitle' ? 'primary' : 'neutral'"
              size="sm"
              class="cc-mode-button"
              @click="selectedMode = 'subtitle'"
            >
              台本モード
            </UButton>
            <UButton
              :variant="selectedMode === 'ai-demo' ? 'solid' : 'outline'"
              :color="selectedMode === 'ai-demo' ? 'primary' : 'neutral'"
              size="sm"
              class="cc-mode-button"
              @click="selectedMode = 'ai-demo'"
            >
              お手本モード
            </UButton>
            <UButton
              :variant="selectedMode === 'confirmation' ? 'solid' : 'outline'"
              :color="selectedMode === 'confirmation' ? 'primary' : 'neutral'"
              size="sm"
              class="cc-mode-button"
              @click="selectedMode = 'confirmation'"
            >
              確認モード
            </UButton>
            <UButton
              :variant="selectedMode === 'practice' ? 'solid' : 'outline'"
              :color="selectedMode === 'practice' ? 'primary' : 'neutral'"
              size="sm"
              class="cc-mode-button"
              @click="selectedMode = 'practice'"
            >
              実戦モード
            </UButton>
          </div>
        </div>

        <!-- 再生コンポーネント (Center: Video Display) -->
        <div class="cc-playback-component">
          <!-- Video Window -->
          <div class="cc-video-window-container">
            <div class="cc-character-window" :class="{ 'cc-speaking': isSpeaking, 'cc-listening': isConnected && !isSpeaking }">
              <video
                ref="characterVideoRef"
                id="characterVideo"
                class="cc-character-video"
                loop
                muted
                playsinline
              ></video>
              <div class="cc-character" id="character" :class="{ 'cc-character-speaking': isSpeaking }">👔</div>

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

          <!-- 操作コンポーネント (Control Buttons) -->
          <div class="cc-control-component">
            <UButton
              :variant="conversationActive ? 'solid' : 'outline'"
              :color="conversationActive ? 'error' : 'primary'"
              size="lg"
              class="cc-start-button-new"
              @click="toggleRoleplay"
            >
              {{ conversationActive ? '■ 停止' : '▶ スタート' }}
            </UButton>
            <UButton
              :variant="isRecording ? 'solid' : 'outline'"
              :color="isRecording ? 'error' : 'neutral'"
              size="lg"
              class="cc-mic-button-new"
              @click="toggleMic"
            >
              <span class="cc-mic-icon">🎤</span>
              <span class="cc-mic-text">{{ isRecording ? '録音中...' : 'OFF' }}</span>
            </UButton>
          </div>
        </div>

        <!-- 設定コンポーネント (Right: Settings) -->
        <div class="cc-settings-component">
          <!-- キャラクター設定コンポーネント -->
          <div class="cc-character-settings-component">
            <div class="cc-settings-label">相手:</div>
            <div class="cc-character-icon-box" @click="openCharacterSettings">
              👔
            </div>
            <USelect
              v-model="selectedCharacter"
              :items="characterOptions"
              size="sm"
              class="w-full"
              :ui="{ base: 'inline-flex items-center' }"
            />
          </div>

          <!-- 音声設定コンポーネント -->
          <div class="cc-voice-settings-component">
            <div class="cc-setting-row">
              <label class="cc-setting-label">音声タイプ:</label>
              <USelect
                v-model="selectedVoice"
                :items="voiceOptions"
                size="sm"
                class="w-full"
                :ui="{ base: 'inline-flex items-center' }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 設計コンポーネント (Right Column Bottom) -->
    <div class="cc-panel cc-design-component" :class="{ expanded: playComponentCollapsed }">
      <!-- テストエリア開閉ボタン -->
      <UButton
        variant="ghost"
        color="neutral"
        size="sm"
        class="cc-play-toggle-button"
        @click="togglePlayComponent"
      >
        <span class="cc-play-toggle-icon" :class="{ rotated: playComponentCollapsed }">▲</span>
        <span class="cc-play-toggle-text">
          {{ playComponentCollapsed ? 'テストエリアを開く' : 'テストエリアを閉じる' }}
        </span>
      </UButton>

      <div class="cc-tabs">
        <UButton
          variant="ghost"
          color="neutral"
          size="sm"
          class="cc-tab"
          :class="{ active: designTab === 'diagram' }"
          @click="designTab = 'diagram'"
        >
          ロープレ設計
        </UButton>
        <UButton
          variant="ghost"
          color="neutral"
          size="sm"
          class="cc-tab"
          :class="{ active: designTab === 'script' }"
          @click="designTab = 'script'"
        >
          会話の流れ
        </UButton>
        <UButton
          variant="ghost"
          color="neutral"
          size="sm"
          class="cc-tab"
          :class="{ active: designTab === 'config' }"
          @click="designTab = 'config'"
        >
          設計書
        </UButton>
      </div>

      <!-- ロープレ設計コンポーネント (Tab 1) -->
      <div v-show="designTab === 'diagram'" class="cc-tab-content active">
        <RoleplayDesignForm ref="roleplayDesignForm" />
      </div>

      <!-- 会話の流れコンポーネント (Tab 2) -->
      <div v-show="designTab === 'script'" class="cc-tab-content active">
        <div v-if="scripts.length === 0" class="cc-input-data-container">
          <div class="cc-input-data-empty">
            <div class="cc-empty-icon">📝</div>
            <div class="cc-empty-text">まだ会話の流れが生成されていません</div>
            <div class="cc-empty-hint">「ロープレ生成」ボタンから生成できます</div>
          </div>
        </div>
        <div v-else class="cc-scripts-container">
          <div v-for="(script, index) in scripts" :key="index" class="cc-script-card">
            <div class="cc-script-card-header" @click="script.expanded = !script.expanded">
              <span class="cc-script-expand-icon">{{ script.expanded ? '▼' : '▶' }}</span>
              <span class="cc-script-card-title">{{ script.mode }}</span>
              <UButton variant="ghost" color="neutral" size="xs" @click.stop="editScript(index)">編集</UButton>
            </div>
            <div v-show="script.expanded" class="cc-script-card-content">
              <pre class="cc-script-content">{{ script.content }}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- 設計書コンポーネント (Tab 3) -->
      <div v-show="designTab === 'config'" class="cc-tab-content active">
        <!-- 生成ボタン -->
        <div class="cc-generate-prompts-bar">
          <UButton
            color="primary"
            size="sm"
            :disabled="isGeneratingPrompts"
            @click="generateAllPrompts"
          >
            {{ isGeneratingPrompts ? '生成中...' : 'プロンプト生成' }}
          </UButton>
          <span class="cc-generate-hint">各モードのシステムプロンプトを自動生成します</span>
        </div>

        <div class="cc-prompts-container">
          <div
            v-for="(prompt, index) in systemPromptsDisplay"
            :key="prompt.mode"
            class="cc-prompt-card-editable"
            :class="{ 'cc-generating': prompt.isGenerating }"
          >
            <div class="cc-prompt-card-header" @click="togglePromptExpand(index)">
              <span class="cc-prompt-expand-icon">{{ prompt.expanded ? '▼' : '▶' }}</span>
              <span class="cc-prompt-card-title">{{ prompt.mode }}</span>
              <div class="cc-prompt-actions">
                <UButton
                  v-if="prompt.content"
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  @click.stop="editPrompt(index)"
                >
                  編集
                </UButton>
                <UButton
                  color="success"
                  size="xs"
                  :disabled="prompt.isGenerating"
                  @click.stop="generateSinglePrompt(prompt.modeKey, index)"
                >
                  {{ prompt.isGenerating ? '...' : '生成' }}
                </UButton>
              </div>
            </div>
            <div v-show="prompt.expanded" class="cc-prompt-card-content">
              <div v-if="prompt.isGenerating" class="cc-prompt-loading">
                <span class="cc-loading-spinner"></span>
                <span>プロンプトを生成中...</span>
              </div>
              <pre v-else-if="prompt.content" class="cc-prompt-content-text">{{ prompt.content }}</pre>
              <div v-else class="cc-prompt-empty">
                <span>まだ生成されていません</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- File Selection Dialog -->
    <FileSelectionDialog
      :is-open="showFileSelectionDialog"
      :files="uploadedFilesForDialog"
      @close="showFileSelectionDialog = false"
      @generate="handleGenerate"
    />

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
import type { FileData } from '~/types/roleplay'
import type { RealtimeConfig } from '~/composables/useRealtimeAPI'

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
const operationTab = ref('chat')
const selectedLesson = ref('')
const selectedMode = ref('confirmation')
const selectedCharacter = ref('businessman')
const selectedVoice = ref<'alloy' | 'echo' | 'shimmer' | 'ash' | 'ballad' | 'coral' | 'sage' | 'verse'>('alloy')
const designTab = ref('diagram')
const playComponentCollapsed = ref(false)

// Select options for USelect components
const categoryOptions = [
  { label: '営業基礎', value: 'sales-basics' },
  { label: 'カスタマーサービス', value: 'customer-service' },
  { label: 'プレゼンテーション', value: 'presentation' },
  { label: '交渉術', value: 'negotiation' },
  { label: 'リーダーシップ', value: 'leadership' }
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

const characterOptions = [
  { label: 'ビジネスマン', value: 'businessman' },
  { label: '営業ウーマン', value: 'saleswoman' },
  { label: 'マネージャー', value: 'manager' },
  { label: '顧客', value: 'customer' }
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
    name: 'Lv.1 基礎編',
    expanded: true,
    lessons: [
      { name: '飛び込み学習モード', status: 'published' },
      { name: '話すことまとめ', status: 'published' },
      { name: '基本挨拶トレーニング', status: 'draft' }
    ]
  },
  {
    name: 'Lv.2 応用編',
    expanded: false,
    lessons: [
      { name: '相手に寄り添うトーク', status: 'published' },
      { name: '言葉の選び方', status: 'draft' },
      { name: 'クロージング術', status: 'draft' }
    ]
  },
  {
    name: 'Lv.3 実践編',
    expanded: false,
    lessons: [
      { name: 'ロールプレイング基礎', status: 'draft' },
      { name: '顧客対応シミュレーション', status: 'draft' }
    ]
  }
])

// Character settings for popup
const characterSettings = computed(() => ({
  character: selectedCharacter.value,
  voice: selectedVoice.value,
  speechRate: 1.0,
  tone: 'neutral',
  responseStyle: 'professional',
  difficulty: 'normal'
}))

// Uploaded files for dialog (with id)
const uploadedFilesForDialog = computed(() =>
  uploadedFiles.value.map((file, index) => ({
    ...file,
    id: `file-${index}`
  }))
)

// Dialogs
const showFileSelectionDialog = ref(false)
const showCharacterSettingsPopup = ref(false)

// Drag & Drop
const isDragging = ref(false)
const dragCounter = ref(0)

// Refs
const roleplayDesignForm = ref<any>(null)
const chatAreaRef = ref<any>(null)

// Methods
const togglePlayComponent = () => {
  playComponentCollapsed.value = !playComponentCollapsed.value
}

// Toggle roleplay - now uses Realtime API
const toggleRoleplay = async () => {
  const config: RealtimeConfig = {
    voice: selectedVoice.value,
    instructions: getInstructionsForMode(selectedMode.value)
  }
  await realtimeToggleRoleplay(config)
}

// Get instructions based on selected mode
const getInstructionsForMode = (mode: string): string => {
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
    const response = await $fetch<{ mode: string; systemPrompt: string }>('/api/generate-prompt', {
      method: 'POST',
      body: {
        mode: modeKey,
        roleplayDesign: roleplayDesignForm.value?.getDesign?.() || null,
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
  if (isGeneratingPrompts.value) return

  isGeneratingPrompts.value = true

  // Generate all prompts in parallel
  const promises = systemPromptsDisplay.value.map((prompt, index) =>
    generateSinglePrompt(prompt.modeKey, index)
  )

  await Promise.all(promises)
  isGeneratingPrompts.value = false
}

const editPrompt = (index: number) => {
  // TODO: プロンプト編集処理
  console.log('Edit prompt', index)
}

const handleGenerate = (selectedFiles: FileData[]) => {
  // TODO: ロープレ生成処理
  console.log('Generate roleplay with files:', selectedFiles)
  showFileSelectionDialog.value = false
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
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
}

.cc-file-item-card:hover {
  border-color: #3b82f6;
}

.cc-file-item-card.cc-file-item-expanded {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.cc-file-item-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.cc-file-item-header:hover {
  background: #f9fafb;
}

.cc-file-expand-icon {
  font-size: 10px;
  color: #6b7280;
  width: 16px;
}

.cc-file-icon {
  font-size: 20px;
}

.cc-file-info {
  flex: 1;
  min-width: 0;
}

.cc-file-name {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cc-file-date {
  display: block;
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
}

.cc-file-type-select {
  min-width: 100px;
}

.cc-file-extracted-text {
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.cc-extracted-text-header {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
}

.cc-extracted-text-content {
  padding: 12px;
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: #374151;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 300px;
  overflow-y: auto;
  font-family: inherit;
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
  padding: 20px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
}
</style>
