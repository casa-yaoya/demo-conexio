<template>
  <div class="test-play-container">
    <!-- レッスン選択パネル -->
    <div class="lesson-panel">
      <div class="panel-header">
        <UIcon name="i-lucide-book-open" class="panel-icon" />
        レッスン選択
      </div>
      <div class="lesson-list">
        <div
          v-for="(lesson, index) in lessons"
          :key="index"
          class="lesson-item"
          :class="{ 'selected': selectedLesson === lesson.value }"
          @click="selectLesson(lesson)"
        >
          <div class="lesson-info">
            <span class="lesson-level">{{ lesson.level }}</span>
            <span class="lesson-name">{{ lesson.name }}</span>
          </div>
          <UIcon name="i-lucide-chevron-right" class="lesson-arrow" />
        </div>
      </div>
    </div>

    <!-- プレイエリア -->
    <div class="play-panel">
      <div class="panel-header">
        <UIcon name="i-lucide-play-circle" class="panel-icon" />
        プレイエリア
        <span v-if="currentLessonName" class="current-lesson">- {{ currentLessonName }}</span>
      </div>
      <div class="play-area-wrapper">
        <PlayArea
          v-model:selected-lesson="selectedLesson"
          v-model:selected-mode="selectedMode"
          v-model:selected-character="selectedCharacter"
          v-model:selected-voice="selectedVoice"
          :show-lesson-selector="false"
          :show-mode-selector="true"
          :show-settings="true"
          :lesson-options="lessonOptions"
          @session-complete="handleSessionComplete"
          @open-character-settings="openCharacterSettings"
        />
      </div>
    </div>

    <!-- 結果パネル -->
    <div class="result-panel" :class="{ 'has-result': showResult }">
      <div class="panel-header">
        <UIcon name="i-lucide-award" class="panel-icon" />
        結果
      </div>
      <div v-if="showResult" class="result-content">
        <SessionResult
          :score="sessionResult.score"
          :play-time="sessionResult.playTime"
          :speech-time="sessionResult.speechTime"
          :feedback="sessionResult.feedback"
          :transcript="sessionResult.transcript"
        />
      </div>
      <div v-else class="result-empty">
        <UIcon name="i-lucide-clock" class="empty-icon" />
        <p class="empty-text">プレイ後に結果が表示されます</p>
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
definePageMeta({
  layout: 'default'
})

// デモデータ管理
const { isDataLoaded, loadDemoData, getFilterOptions } = useDemoData()

// State
const selectedLesson = ref('')
const selectedMode = ref('confirmation')
const selectedCharacter = ref('businessman')
const selectedVoice = ref<'alloy' | 'echo' | 'shimmer'>('alloy')
const showResult = ref(false)
const showCharacterSettingsPopup = ref(false)

interface TranscriptMessage {
  role: 'ai' | 'user'
  content: string
}

const sessionResult = ref({
  score: 0,
  playTime: 0,
  speechTime: 0,
  feedback: '',
  transcript: [] as TranscriptMessage[]
})

// レッスンリスト（デモ用）
const lessons = ref([
  { value: 'lv1-1', level: 'Lv.1', name: '飛び込み学習モード', category: '営業基礎' },
  { value: 'lv1-2', level: 'Lv.1', name: '話すことまとめ', category: '営業基礎' },
  { value: 'lv1-3', level: 'Lv.1', name: '基本挨拶トレーニング', category: '営業基礎' },
  { value: 'lv2-1', level: 'Lv.2', name: '相手に寄り添うトーク', category: '営業基礎' },
  { value: 'lv2-2', level: 'Lv.2', name: '言葉の選び方', category: '営業基礎' },
  { value: 'lv2-3', level: 'Lv.2', name: 'クロージング術', category: '営業基礎' },
  { value: 'lv3-1', level: 'Lv.3', name: 'ロールプレイング基礎', category: '営業基礎' },
  { value: 'lv3-2', level: 'Lv.3', name: '顧客対応シミュレーション', category: '営業基礎' }
])

const lessonOptions = computed(() =>
  lessons.value.map(l => ({
    label: `${l.level}: ${l.name}`,
    value: l.value
  }))
)

const currentLessonName = computed(() => {
  const lesson = lessons.value.find(l => l.value === selectedLesson.value)
  return lesson ? `${lesson.level} ${lesson.name}` : ''
})

// Character settings for popup
const characterSettings = computed(() => ({
  character: selectedCharacter.value,
  voice: selectedVoice.value,
  speechRate: 1.0,
  tone: 'neutral',
  responseStyle: 'professional',
  difficulty: 'normal'
}))

// Methods
const selectLesson = (lesson: typeof lessons.value[0]) => {
  selectedLesson.value = lesson.value
  showResult.value = false
}

const handleSessionComplete = (result: { score: number; feedback: string }) => {
  sessionResult.value = {
    score: result.score || 85,
    playTime: 180,
    speechTime: 120,
    feedback: result.feedback || 'お疲れ様でした。全体的に良い対応でした。特に相手の話をしっかり聞く姿勢が素晴らしかったです。改善点としては、クロージングの部分でもう少し積極的にアプローチしても良いでしょう。',
    transcript: []
  }
  showResult.value = true
}

const openCharacterSettings = () => {
  showCharacterSettingsPopup.value = true
}

interface CharacterSettingsType {
  character: string
  voice: string
  speechRate: number
  tone: string
  responseStyle: string
  difficulty: string
}

const applyCharacterSettings = (settings: CharacterSettingsType) => {
  selectedCharacter.value = settings.character
  selectedVoice.value = settings.voice as 'alloy' | 'echo' | 'shimmer'
  showCharacterSettingsPopup.value = false
}

// 初期化
onMounted(async () => {
  if (!isDataLoaded.value) {
    try {
      await loadDemoData()
    } catch (error) {
      console.error('デモデータの読み込みに失敗しました:', error)
    }
  }
  // デフォルトで最初のレッスンを選択
  if (lessons.value.length > 0) {
    selectedLesson.value = lessons.value[0].value
  }
})
</script>

<style scoped>
.test-play-container {
  display: grid;
  grid-template-columns: 280px 1fr 360px;
  gap: 0;
  height: 100%;
  background: #f8fafc;
}

/* パネル共通 */
.lesson-panel,
.play-panel,
.result-panel {
  display: flex;
  flex-direction: column;
  background: white;
  border-right: 1px solid #e5e7eb;
  overflow: hidden;
}

.result-panel {
  border-right: none;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.panel-icon {
  font-size: 18px;
  color: #6366f1;
}

.current-lesson {
  font-weight: 500;
  color: #64748b;
}

/* レッスンパネル */
.lesson-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.lesson-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-bottom: 4px;
}

.lesson-item:hover {
  background: #f1f5f9;
}

.lesson-item.selected {
  background: #eff6ff;
  border-left: 3px solid #3b82f6;
}

.lesson-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.lesson-level {
  font-size: 11px;
  font-weight: 600;
  color: #8b5cf6;
}

.lesson-name {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.lesson-arrow {
  font-size: 14px;
  color: #9ca3af;
}

.lesson-item.selected .lesson-arrow {
  color: #3b82f6;
}

/* プレイパネル */
.play-area-wrapper {
  flex: 1;
  overflow: hidden;
}

/* 結果パネル */
.result-content {
  flex: 1;
  overflow-y: auto;
}

.result-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
}

/* レスポンシブ */
@media (max-width: 1280px) {
  .test-play-container {
    grid-template-columns: 240px 1fr 320px;
  }
}

@media (max-width: 1024px) {
  .test-play-container {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
  }

  .lesson-panel {
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
    max-height: 200px;
  }

  .lesson-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px;
  }

  .lesson-item {
    flex: 1;
    min-width: 150px;
    margin-bottom: 0;
  }

  .result-panel {
    max-height: 300px;
    border-top: 1px solid #e5e7eb;
  }
}

@media (max-width: 640px) {
  .lesson-item {
    min-width: 100%;
  }
}
</style>
