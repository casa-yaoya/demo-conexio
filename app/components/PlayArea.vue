<template>
  <div class="play-area">
    <!-- プレイエリアヘッダー -->
    <div v-if="showLessonSelector" class="play-header">
      <div class="lesson-selector">
        <label class="selector-label">レッスン:</label>
        <USelect
          v-model="selectedLessonValue"
          :items="lessonOptions"
          placeholder="レッスンを選択..."
          size="sm"
          class="flex-1"
        />
      </div>
    </div>

    <div class="play-content">
      <!-- ロープレモード選択コンポーネント (Left) -->
      <div v-if="showModeSelector" class="roleplay-mode-component">
        <div class="mode-title">モードを選ぶ</div>
        <div class="mode-buttons">
          <UButton
            :variant="selectedModeValue === 'subtitle' ? 'solid' : 'outline'"
            :color="selectedModeValue === 'subtitle' ? 'primary' : 'neutral'"
            size="sm"
            class="mode-button"
            @click="selectedModeValue = 'subtitle'"
          >
            台本モード
          </UButton>
          <UButton
            :variant="selectedModeValue === 'ai-demo' ? 'solid' : 'outline'"
            :color="selectedModeValue === 'ai-demo' ? 'primary' : 'neutral'"
            size="sm"
            class="mode-button"
            @click="selectedModeValue = 'ai-demo'"
          >
            お手本モード
          </UButton>
          <UButton
            :variant="selectedModeValue === 'confirmation' ? 'solid' : 'outline'"
            :color="selectedModeValue === 'confirmation' ? 'primary' : 'neutral'"
            size="sm"
            class="mode-button"
            @click="selectedModeValue = 'confirmation'"
          >
            確認モード
          </UButton>
          <UButton
            :variant="selectedModeValue === 'practice' ? 'solid' : 'outline'"
            :color="selectedModeValue === 'practice' ? 'primary' : 'neutral'"
            size="sm"
            class="mode-button"
            @click="selectedModeValue = 'practice'"
          >
            実戦モード
          </UButton>
        </div>
      </div>

      <!-- 再生コンポーネント (Center: Video Display) -->
      <div class="playback-component">
        <!-- Video Window -->
        <div class="video-window-container">
          <div class="character-window" :class="{ 'speaking': isSpeaking, 'listening': isConnected && !isSpeaking }">
            <video
              ref="characterVideoRef"
              class="character-video"
              src="/idle.webm"
              loop
              muted
              autoplay
              playsinline
            ></video>

            <!-- Connection Status -->
            <div class="video-connection-status">
              <div class="connection-status">
                <span class="status-indicator" :class="connectionStatusClass"></span>
                <span class="status-text">{{ connectionStatusText }}</span>
              </div>
            </div>

            <div v-if="showResult" class="result-overlay">
              <div class="score-display">{{ score }}点</div>
              <div class="feedback-box" v-html="feedbackHtml"></div>
            </div>
          </div>
        </div>

        <!-- 操作コンポーネント (Control Buttons) -->
        <div class="control-component">
          <UButton
            :variant="conversationActive ? 'solid' : 'outline'"
            :color="conversationActive ? 'error' : 'primary'"
            size="lg"
            class="start-button"
            @click="toggleRoleplay"
          >
            {{ conversationActive ? '■ 停止' : '▶ スタート' }}
          </UButton>
          <UButton
            :variant="isRecording ? 'solid' : 'outline'"
            :color="isRecording ? 'error' : 'neutral'"
            size="lg"
            class="mic-button"
            @click="toggleMic"
          >
            <span class="mic-icon">🎤</span>
            <span class="mic-text">{{ isRecording ? '録音中...' : 'OFF' }}</span>
          </UButton>
        </div>
      </div>

      <!-- 設定コンポーネント (Right: Settings) -->
      <div v-if="showSettings" class="settings-component">
        <!-- キャラクター設定コンポーネント -->
        <div class="character-settings-component">
          <div class="settings-label">相手:</div>
          <div class="character-icon-box" @click="$emit('openCharacterSettings')">
            👔
          </div>
          <USelect
            v-model="selectedCharacterValue"
            :items="characterOptions"
            size="sm"
            class="w-full"
          />
        </div>

        <!-- 音声設定コンポーネント -->
        <div class="voice-settings-component">
          <div class="setting-row">
            <label class="setting-label">音声タイプ:</label>
            <USelect
              v-model="selectedVoiceValue"
              :items="voiceOptions"
              size="sm"
              class="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RealtimeConfig } from '~/composables/useRealtimeAPI'

const props = withDefaults(defineProps<{
  showLessonSelector?: boolean
  showModeSelector?: boolean
  showSettings?: boolean
  lessonOptions?: Array<{ label: string; value: string }>
  selectedLesson?: string
  selectedMode?: string
  selectedCharacter?: string
  selectedVoice?: 'alloy' | 'echo' | 'shimmer' | 'ash' | 'ballad' | 'coral' | 'sage' | 'verse'
}>(), {
  showLessonSelector: true,
  showModeSelector: true,
  showSettings: true,
  lessonOptions: () => [],
  selectedLesson: '',
  selectedMode: 'confirmation',
  selectedCharacter: 'businessman',
  selectedVoice: 'alloy'
})

const emit = defineEmits<{
  (e: 'update:selectedLesson', value: string): void
  (e: 'update:selectedMode', value: string): void
  (e: 'update:selectedCharacter', value: string): void
  (e: 'update:selectedVoice', value: string): void
  (e: 'openCharacterSettings'): void
  (e: 'sessionComplete', result: { score: number; feedback: string }): void
}>()

// Use the Realtime API composable
const {
  isConnected,
  isPlaying,
  isRecording: realtimeIsRecording,
  isSpeaking,
  connectionStatus,
  toggleRoleplay: realtimeToggleRoleplay,
  toggleRecording
} = useRealtimeAPI()

// Local state
const selectedLessonValue = computed({
  get: () => props.selectedLesson,
  set: (value) => emit('update:selectedLesson', value)
})

const selectedModeValue = computed({
  get: () => props.selectedMode,
  set: (value) => emit('update:selectedMode', value)
})

const selectedCharacterValue = computed({
  get: () => props.selectedCharacter,
  set: (value) => emit('update:selectedCharacter', value)
})

const selectedVoiceValue = computed({
  get: () => props.selectedVoice,
  set: (value) => emit('update:selectedVoice', value as any)
})

// Character options
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

// Video element ref
const characterVideoRef = ref<HTMLVideoElement | null>(null)

// Roleplay state
const conversationActive = computed(() => isPlaying.value)
const isRecording = computed(() => realtimeIsRecording.value)
const showResult = ref(false)
const score = ref(0)
const feedbackHtml = ref('')

// Connection status
const connectionStatusClass = computed(() => {
  if (isConnected.value) {
    return isSpeaking.value ? 'status-speaking' : 'status-connected'
  }
  return 'status-disconnected'
})
const connectionStatusText = computed(() => connectionStatus.value)

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

// Toggle roleplay
const toggleRoleplay = async () => {
  const config: RealtimeConfig = {
    voice: selectedVoiceValue.value as any,
    instructions: getInstructionsForMode(selectedModeValue.value)
  }
  await realtimeToggleRoleplay(config)
}

// Toggle microphone
const toggleMic = () => {
  if (isConnected.value) {
    toggleRecording()
  }
}

// Update character animation based on speaking state
watch(isSpeaking, (speaking) => {
  // Animation logic can be added here
})
</script>

<style scoped>
.play-area {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.play-header {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.lesson-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selector-label {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  white-space: nowrap;
}

.play-content {
  flex: 1;
  display: flex;
  padding: 16px;
  gap: 16px;
  overflow: hidden;
}

/* Mode selector */
.roleplay-mode-component {
  width: 120px;
  flex-shrink: 0;
}

.mode-title {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 12px;
}

.mode-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mode-button {
  width: 100%;
  justify-content: center;
}

/* Playback component */
.playback-component {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.video-window-container {
  width: 100%;
  max-width: 400px;
  aspect-ratio: 16/9;
}

.character-window {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.character-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-connection-status {
  position: absolute;
  top: 12px;
  left: 12px;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 16px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-indicator.status-speaking {
  background-color: #3b82f6;
  animation: pulse-dot 1s ease-in-out infinite;
}

.status-indicator.status-connected {
  background-color: #10b981;
}

.status-indicator.status-disconnected {
  background-color: #6b7280;
}

.status-text {
  font-size: 11px;
  color: white;
}

.result-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.score-display {
  font-size: 48px;
  font-weight: 700;
  color: #10b981;
  margin-bottom: 16px;
}

.feedback-box {
  font-size: 14px;
  color: #e5e7eb;
  text-align: center;
  line-height: 1.6;
}

/* Control buttons */
.control-component {
  display: flex;
  gap: 12px;
}

.start-button {
  min-width: 120px;
}

.mic-button {
  display: flex;
  align-items: center;
  gap: 6px;
}

.mic-icon {
  font-size: 16px;
}

.mic-text {
  font-size: 13px;
}

/* Settings component */
.settings-component {
  width: 140px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.character-settings-component {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.settings-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

.character-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  transition: background 0.2s;
}

.character-icon-box:hover {
  background: #e2e8f0;
}

.voice-settings-component {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-label {
  font-size: 11px;
  font-weight: 500;
  color: #64748b;
}

/* Speaking animation */
.character-window.speaking {
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
  animation: pulse-speaking 1s ease-in-out infinite;
}

.character-window.listening {
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
}

@keyframes pulse-speaking {
  0%, 100% {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
  }
  50% {
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.8);
  }
}

@keyframes pulse-dot {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .play-content {
    flex-direction: column;
  }

  .roleplay-mode-component {
    width: 100%;
  }

  .mode-buttons {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .mode-button {
    flex: 1;
    min-width: 80px;
  }

  .settings-component {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>
