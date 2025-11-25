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
        <div class="cc-category-select-wrapper">
          <label class="cc-category-label">コース:</label>
          <select v-model="selectedCategory" class="cc-category-select">
            <option value="sales-basics">営業基礎</option>
            <option value="customer-service">カスタマーサービス</option>
            <option value="presentation">プレゼンテーション</option>
            <option value="negotiation">交渉術</option>
            <option value="leadership">リーダーシップ</option>
          </select>
        </div>
      </div>

      <!-- タブナビゲーション -->
      <div class="cc-operation-tabs">
        <button
          class="cc-operation-tab"
          :class="{ active: operationTab === 'chat' }"
          @click="operationTab = 'chat'"
        >
          チャット
        </button>
        <button
          class="cc-operation-tab"
          :class="{ active: operationTab === 'course' }"
          @click="operationTab = 'course'"
        >
          コース
        </button>
        <button
          class="cc-operation-tab"
          :class="{ active: operationTab === 'files' }"
          @click="operationTab = 'files'"
        >
          ファイル
        </button>
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
            <button class="cc-button cc-button-secondary" @click="addNewCategory">
              ➕ カテゴリーを追加
            </button>
            <button class="cc-button cc-button-secondary" @click="addNewLesson">
              ➕ レッスンを追加
            </button>
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
                <select
                  v-model="file.dataType"
                  class="cc-file-type-select"
                  @click.stop
                >
                  <option value="未分類">未分類</option>
                  <option value="見本データ">見本データ</option>
                  <option value="教材データ">教材データ</option>
                  <option value="自社データ">自社データ</option>
                  <option value="顧客データ">顧客データ</option>
                  <option value="その他">その他</option>
                </select>
                <button class="cc-file-download-btn" @click.stop="downloadFile(file)" title="ダウンロード">
                  ⬇️
                </button>
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
          <label class="cc-lesson-label">レッスン:</label>
          <select v-model="selectedLesson" class="cc-lesson-dropdown">
            <option value="">レッスンを選択...</option>
            <optgroup label="Lv.1">
              <option value="lv1-1">Lv.1: 飛び込み学習モード</option>
              <option value="lv1-2">Lv.1: 話すことまとめ</option>
            </optgroup>
            <optgroup label="Lv.2">
              <option value="lv2-1">Lv.2: 相手に寄り添うトーク</option>
              <option value="lv2-2">Lv.2: 言葉の選び方</option>
            </optgroup>
          </select>
        </div>
      </div>

      <div class="cc-play-content">
        <!-- ロープレモード選択コンポーネント (Left) -->
        <div class="cc-roleplay-mode-component">
          <div class="cc-mode-title">モードを選ぶ</div>
          <div class="cc-mode-buttons">
            <button
              class="cc-mode-button"
              :class="{ active: selectedMode === 'subtitle' }"
              @click="selectedMode = 'subtitle'"
            >
              台本モード
            </button>
            <button
              class="cc-mode-button"
              :class="{ active: selectedMode === 'ai-demo' }"
              @click="selectedMode = 'ai-demo'"
            >
              お手本モード
            </button>
            <button
              class="cc-mode-button"
              :class="{ active: selectedMode === 'confirmation' }"
              @click="selectedMode = 'confirmation'"
            >
              確認モード
            </button>
            <button
              class="cc-mode-button"
              :class="{ active: selectedMode === 'practice' }"
              @click="selectedMode = 'practice'"
            >
              実戦モード
            </button>
          </div>
        </div>

        <!-- 再生コンポーネント (Center: Video Display) -->
        <div class="cc-playback-component">
          <!-- Video Window -->
          <div class="cc-video-window-container">
            <div class="cc-character-window">
              <video id="characterVideo" class="cc-character-video" loop muted playsinline></video>
              <div class="cc-character" id="character">👔</div>

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
            <button
              class="cc-start-button-new"
              :class="{ active: conversationActive }"
              @click="toggleRoleplay"
            >
              {{ conversationActive ? '■ 停止' : '▶ スタート' }}
            </button>
            <button
              class="cc-mic-button-new"
              :class="{ active: isRecording }"
              @click="toggleMic"
            >
              <span class="cc-mic-icon">🎤</span>
              <span class="cc-mic-text">{{ isRecording ? '録音中...' : 'OFF' }}</span>
            </button>
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
            <select v-model="selectedCharacter" class="cc-character-select">
              <option value="businessman">ビジネスマン</option>
              <option value="saleswoman">営業ウーマン</option>
              <option value="manager">マネージャー</option>
              <option value="customer">顧客</option>
            </select>
          </div>

          <!-- 音声設定コンポーネント -->
          <div class="cc-voice-settings-component">
            <div class="cc-setting-row">
              <label class="cc-setting-label">音声タイプ:</label>
              <select v-model="selectedVoice" class="cc-voice-select">
                <option value="alloy">Alloy</option>
                <option value="echo">Echo</option>
                <option value="shimmer">Shimmer</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 設計コンポーネント (Right Column Bottom) -->
    <div class="cc-panel cc-design-component" :class="{ expanded: playComponentCollapsed }">
      <!-- テストエリア開閉ボタン -->
      <button class="cc-play-toggle-button" @click="togglePlayComponent">
        <span class="cc-play-toggle-icon" :class="{ rotated: playComponentCollapsed }">▲</span>
        <span class="cc-play-toggle-text">
          {{ playComponentCollapsed ? 'テストエリアを開く' : 'テストエリアを閉じる' }}
        </span>
      </button>

      <div class="cc-tabs">
        <button
          class="cc-tab"
          :class="{ active: designTab === 'diagram' }"
          @click="designTab = 'diagram'"
        >
          ロープレ設計
        </button>
        <button
          class="cc-tab"
          :class="{ active: designTab === 'script' }"
          @click="designTab = 'script'"
        >
          会話の流れ
        </button>
        <button
          class="cc-tab"
          :class="{ active: designTab === 'config' }"
          @click="designTab = 'config'"
        >
          設計書
        </button>
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
              <button class="cc-script-edit-btn" @click.stop="editScript(index)">編集</button>
            </div>
            <div v-show="script.expanded" class="cc-script-card-content">
              <pre class="cc-script-content">{{ script.content }}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- 設計書コンポーネント (Tab 3) -->
      <div v-show="designTab === 'config'" class="cc-tab-content active">
        <div v-if="systemPrompts.length === 0" class="cc-config-content-wrapper">
          <!-- デフォルトで4つのモードカードを表示 -->
          <div class="cc-prompts-container">
            <div v-for="mode in defaultModes" :key="mode" class="cc-prompt-card-editable">
              <div class="cc-prompt-card-header">
                <span class="cc-prompt-expand-icon">▶</span>
                <span class="cc-prompt-card-title">{{ mode }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="cc-prompts-container">
          <div v-for="(prompt, index) in systemPrompts" :key="index" class="cc-prompt-card-editable">
            <div class="cc-prompt-card-header" @click="prompt.expanded = !prompt.expanded">
              <span class="cc-prompt-expand-icon">{{ prompt.expanded ? '▼' : '▶' }}</span>
              <span class="cc-prompt-card-title">{{ prompt.mode }}</span>
              <button class="cc-prompt-edit-btn" @click.stop="editPrompt(index)">編集</button>
            </div>
            <div v-show="prompt.expanded" class="cc-prompt-card-content">
              <pre class="cc-prompt-content-text">{{ prompt.content }}</pre>
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

definePageMeta({
  layout: 'default'
})

// State
const selectedCategory = ref('sales-basics')
const operationTab = ref('chat')
const selectedLesson = ref('')
const selectedMode = ref('confirmation')
const selectedCharacter = ref('businessman')
const selectedVoice = ref('alloy')
const designTab = ref('diagram')
const playComponentCollapsed = ref(false)

// Roleplay state
const conversationActive = ref(false)
const isRecording = ref(false)
const showResult = ref(false)
const score = ref(85)
const feedbackHtml = ref('')

// Connection status
const connectionStatusClass = computed(() => {
  return conversationActive.value ? 'cc-status-connected' : 'cc-status-disconnected'
})
const connectionStatusText = computed(() => {
  return conversationActive.value ? '接続中' : '未接続'
})

// Data
const uploadedFiles = ref<FileData[]>([])
const scripts = ref<Array<{ mode: string; content: string; expanded: boolean }>>([])
const systemPrompts = ref<Array<{ mode: string; content: string; expanded: boolean }>>([])
const selectedFileIndex = ref<number | null>(null)
const defaultModes = ['台本モード', 'お手本モード', '確認モード', '実戦モード']

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

const toggleRoleplay = () => {
  conversationActive.value = !conversationActive.value
  if (!conversationActive.value) {
    isRecording.value = false
  }
}

const toggleMic = () => {
  if (conversationActive.value) {
    isRecording.value = !isRecording.value
  }
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
}

const applyCharacterSettings = (settings: CharacterSettings) => {
  selectedCharacter.value = settings.character
  selectedVoice.value = settings.voice
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
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: white;
  color: #374151;
  cursor: pointer;
  min-width: 100px;
}

.cc-file-type-select:focus {
  outline: none;
  border-color: #3b82f6;
}

.cc-file-download-btn {
  padding: 6px 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 16px;
  border-radius: 4px;
  transition: background 0.2s;
}

.cc-file-download-btn:hover {
  background: #f3f4f6;
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
</style>
