<template>
  <UModal v-model:open="modalOpen">
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900">キャラクター設定</h3>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- キャラクター選択 -->
        <div class="setting-section">
          <label class="setting-label">キャラクター</label>
          <div class="character-grid">
            <UButton
              v-for="char in characters"
              :key="char.id"
              :variant="selectedCharacter === char.id ? 'soft' : 'outline'"
              :color="selectedCharacter === char.id ? 'primary' : 'neutral'"
              class="character-option"
              @click="selectedCharacter = char.id"
            >
              <template #leading>
                <span class="text-xl">{{ char.icon }}</span>
              </template>
              <span class="text-xs">{{ char.name }}</span>
            </UButton>
          </div>
        </div>

        <!-- 音声設定 -->
        <div class="setting-section">
          <label class="setting-label">音声タイプ</label>
          <USelect
            v-model="selectedVoice"
            :items="voiceOptions"
            class="w-full"
          />
        </div>

        <!-- 話速設定 -->
        <div class="setting-section">
          <label class="setting-label">話速</label>
          <div class="slider-container">
            <input
              type="range"
              v-model.number="speechRate"
              min="0.5"
              max="2"
              step="0.1"
              class="setting-slider"
            >
            <span class="slider-value">{{ speechRate.toFixed(1) }}x</span>
          </div>
        </div>

        <!-- 声のトーン -->
        <div class="setting-section">
          <label class="setting-label">声のトーン</label>
          <div class="tone-options">
            <UButton
              v-for="tone in tones"
              :key="tone.id"
              :variant="selectedTone === tone.id ? 'soft' : 'outline'"
              :color="selectedTone === tone.id ? 'primary' : 'neutral'"
              size="sm"
              @click="selectedTone = tone.id"
            >
              {{ tone.label }}
            </UButton>
          </div>
        </div>

        <!-- 応答スタイル -->
        <div class="setting-section">
          <label class="setting-label">応答スタイル</label>
          <USelect
            v-model="responseStyle"
            :items="responseStyleOptions"
            class="w-full"
          />
        </div>

        <!-- 難易度 -->
        <div class="setting-section">
          <label class="setting-label">難易度</label>
          <div class="difficulty-options">
            <UButton
              v-for="diff in difficulties"
              :key="diff.id"
              :variant="selectedDifficulty === diff.id ? 'soft' : 'outline'"
              :color="selectedDifficulty === diff.id ? 'primary' : 'neutral'"
              class="difficulty-option"
              @click="selectedDifficulty = diff.id"
            >
              <span class="text-sm">{{ diff.stars }}</span>
              <span class="text-xs">{{ diff.name }}</span>
            </UButton>
          </div>
        </div>

        <!-- カスタムアニメーション -->
        <div class="setting-section custom-animation-section">
          <label class="setting-label">カスタム:</label>
          <div class="custom-animation-grid">
            <!-- 聞く時のアニメーション -->
            <div
              class="custom-animation-dropzone"
              :class="{ 'has-file': customListeningVideo }"
              @dragenter.prevent="onDragEnter('listening', $event)"
              @dragover.prevent="onDragOver"
              @dragleave.prevent="onDragLeave('listening')"
              @drop.prevent="onDrop('listening', $event)"
              @click="triggerFileInput('listening')"
            >
              <div v-if="customListeningVideo" class="dropzone-preview">
                <video :src="customListeningVideo" class="preview-video" muted loop autoplay></video>
                <UButton
                  icon="i-lucide-x"
                  color="error"
                  variant="solid"
                  size="xs"
                  class="absolute top-1 right-1"
                  @click.stop="removeFile('listening')"
                />
              </div>
              <div v-else class="dropzone-content">
                <span class="dropzone-icon">👂</span>
                <span class="dropzone-label">聞く時</span>
                <span class="dropzone-hint">.webm</span>
              </div>
            </div>

            <!-- 話す時のアニメーション -->
            <div
              class="custom-animation-dropzone"
              :class="{ 'has-file': customSpeakingVideo }"
              @dragenter.prevent="onDragEnter('speaking', $event)"
              @dragover.prevent="onDragOver"
              @dragleave.prevent="onDragLeave('speaking')"
              @drop.prevent="onDrop('speaking', $event)"
              @click="triggerFileInput('speaking')"
            >
              <div v-if="customSpeakingVideo" class="dropzone-preview">
                <video :src="customSpeakingVideo" class="preview-video" muted loop autoplay></video>
                <UButton
                  icon="i-lucide-x"
                  color="error"
                  variant="solid"
                  size="xs"
                  class="absolute top-1 right-1"
                  @click.stop="removeFile('speaking')"
                />
              </div>
              <div v-else class="dropzone-content">
                <span class="dropzone-icon">🗣️</span>
                <span class="dropzone-label">話す時</span>
                <span class="dropzone-hint">.webm</span>
              </div>
            </div>
          </div>
          <!-- Hidden file inputs -->
          <input
            ref="listeningFileInput"
            type="file"
            accept=".webm,video/webm"
            style="display: none"
            @change="handleFileSelect('listening', $event)"
          >
          <input
            ref="speakingFileInput"
            type="file"
            accept=".webm,video/webm"
            style="display: none"
            @change="handleFileSelect('speaking', $event)"
          >
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex gap-3 w-full">
        <UButton
          variant="outline"
          color="neutral"
          class="flex-1"
          @click="resetToDefaults"
        >
          デフォルトに戻す
        </UButton>
        <UButton
          color="primary"
          class="flex-1"
          @click="applySettings"
        >
          適用
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
export interface CharacterSettings {
  character: string
  voice: string
  speechRate: number
  tone: string
  responseStyle: string
  difficulty: string
  customListeningVideo?: string | null
  customSpeakingVideo?: string | null
}

const props = defineProps<{
  isOpen: boolean
  currentSettings?: CharacterSettings
}>()

const emit = defineEmits<{
  close: []
  apply: [settings: CharacterSettings]
}>()

// モーダルの開閉状態（propsと同期）
const modalOpen = computed({
  get: () => props.isOpen,
  set: (value: boolean) => {
    if (!value) emit('close')
  }
})

// Custom animation file refs
const listeningFileInput = ref<HTMLInputElement | null>(null)
const speakingFileInput = ref<HTMLInputElement | null>(null)
const customListeningVideo = ref<string | null>(null)
const customSpeakingVideo = ref<string | null>(null)
const isDraggingListening = ref(false)
const isDraggingSpeaking = ref(false)

// キャラクター一覧
const characters = [
  { id: 'businessman', icon: '👔', name: 'ビジネスマン' },
  { id: 'saleswoman', icon: '👩‍💼', name: '営業ウーマン' },
  { id: 'manager', icon: '👨‍💼', name: 'マネージャー' },
  { id: 'customer', icon: '🙋', name: '顧客' },
  { id: 'executive', icon: '🤵', name: '役員' },
  { id: 'receptionist', icon: '💁‍♀️', name: '受付' }
]

// 音声一覧（USelect用）
const voiceOptions = [
  { label: 'Alloy (中性的)', value: 'alloy' },
  { label: 'Echo (男性的)', value: 'echo' },
  { label: 'Fable (表現力豊か)', value: 'fable' },
  { label: 'Onyx (深い男性)', value: 'onyx' },
  { label: 'Nova (女性的)', value: 'nova' },
  { label: 'Shimmer (明るい女性)', value: 'shimmer' }
]

// 応答スタイル（USelect用）
const responseStyleOptions = [
  { label: 'フレンドリー', value: 'friendly' },
  { label: 'プロフェッショナル', value: 'professional' },
  { label: 'カジュアル', value: 'casual' },
  { label: 'フォーマル', value: 'formal' }
]

// トーン
const tones = [
  { id: 'neutral', label: '普通' },
  { id: 'positive', label: '明るい' },
  { id: 'serious', label: '真剣' },
  { id: 'empathetic', label: '共感的' }
]

// 難易度
const difficulties = [
  { id: 'easy', name: '初級', stars: '⭐' },
  { id: 'normal', name: '中級', stars: '⭐⭐' },
  { id: 'hard', name: '上級', stars: '⭐⭐⭐' }
]

// 設定値
const selectedCharacter = ref(props.currentSettings?.character || 'businessman')
const selectedVoice = ref(props.currentSettings?.voice || 'alloy')
const speechRate = ref(props.currentSettings?.speechRate || 1.0)
const selectedTone = ref(props.currentSettings?.tone || 'neutral')
const responseStyle = ref(props.currentSettings?.responseStyle || 'professional')
const selectedDifficulty = ref(props.currentSettings?.difficulty || 'normal')

// propsが変更されたら設定を更新
watch(() => props.currentSettings, (newSettings) => {
  if (newSettings) {
    selectedCharacter.value = newSettings.character
    selectedVoice.value = newSettings.voice
    speechRate.value = newSettings.speechRate
    selectedTone.value = newSettings.tone
    responseStyle.value = newSettings.responseStyle
    selectedDifficulty.value = newSettings.difficulty
  }
}, { immediate: true })

const resetToDefaults = () => {
  selectedCharacter.value = 'businessman'
  selectedVoice.value = 'alloy'
  speechRate.value = 1.0
  selectedTone.value = 'neutral'
  responseStyle.value = 'professional'
  selectedDifficulty.value = 'normal'
  customListeningVideo.value = null
  customSpeakingVideo.value = null
}

const applySettings = () => {
  emit('apply', {
    character: selectedCharacter.value,
    voice: selectedVoice.value,
    speechRate: speechRate.value,
    tone: selectedTone.value,
    responseStyle: responseStyle.value,
    difficulty: selectedDifficulty.value,
    customListeningVideo: customListeningVideo.value,
    customSpeakingVideo: customSpeakingVideo.value
  })
  modalOpen.value = false
}

// Custom animation file handlers
const triggerFileInput = (type: 'listening' | 'speaking') => {
  if (type === 'listening') {
    listeningFileInput.value?.click()
  } else {
    speakingFileInput.value?.click()
  }
}

const handleFileSelect = (type: 'listening' | 'speaking', event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file && file.type === 'video/webm') {
    processFile(type, file)
  }
  input.value = ''
}

const onDragEnter = (type: 'listening' | 'speaking', _event: DragEvent) => {
  if (type === 'listening') {
    isDraggingListening.value = true
  } else {
    isDraggingSpeaking.value = true
  }
}

const onDragOver = (event: DragEvent) => {
  event.dataTransfer!.dropEffect = 'copy'
}

const onDragLeave = (type: 'listening' | 'speaking') => {
  if (type === 'listening') {
    isDraggingListening.value = false
  } else {
    isDraggingSpeaking.value = false
  }
}

const onDrop = (type: 'listening' | 'speaking', event: DragEvent) => {
  isDraggingListening.value = false
  isDraggingSpeaking.value = false

  const file = event.dataTransfer?.files[0]
  if (file && file.type === 'video/webm') {
    processFile(type, file)
  }
}

const processFile = (type: 'listening' | 'speaking', file: File) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string
    if (type === 'listening') {
      customListeningVideo.value = dataUrl
    } else {
      customSpeakingVideo.value = dataUrl
    }
  }
  reader.readAsDataURL(file)
}

const removeFile = (type: 'listening' | 'speaking') => {
  if (type === 'listening') {
    customListeningVideo.value = null
  } else {
    customSpeakingVideo.value = null
  }
}
</script>

<style scoped>
.setting-section {
  margin-bottom: 1.5rem;
}

.setting-section:last-child {
  margin-bottom: 0;
}

.setting-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.character-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 0.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.15s;
}

.character-option:hover {
  border-color: #93c5fd;
  background: #f0f9ff;
}

.character-option.selected {
  border-color: #2563eb;
  background: #eff6ff;
}

.character-icon {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.character-name {
  font-size: 0.75rem;
  color: #4b5563;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.setting-slider {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: #e5e7eb;
  border-radius: 3px;
  outline: none;
}

.setting-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: #2563eb;
  border-radius: 50%;
  cursor: pointer;
}

.slider-value {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
  min-width: 3rem;
  text-align: right;
}

.tone-options {
  display: flex;
  gap: 0.5rem;
}

.tone-option {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 0.75rem;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.15s;
}

.tone-option:hover {
  border-color: #93c5fd;
}

.tone-option.selected {
  border-color: #2563eb;
  background: #eff6ff;
  color: #1e40af;
}

.difficulty-options {
  display: flex;
  gap: 0.5rem;
}

.difficulty-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.15s;
}

.difficulty-option:hover {
  border-color: #93c5fd;
}

.difficulty-option.selected {
  border-color: #2563eb;
  background: #eff6ff;
}

.difficulty-stars {
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.difficulty-name {
  font-size: 0.75rem;
  color: #4b5563;
}

/* Custom animation section styles */
.custom-animation-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
  margin-top: 0.5rem;
}

.custom-animation-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.custom-animation-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.custom-animation-dropzone:hover {
  border-color: #93c5fd;
  background: #eff6ff;
}

.custom-animation-dropzone.has-file {
  border-style: solid;
  border-color: #2563eb;
  background: #eff6ff;
}

.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 1rem;
}

.dropzone-icon {
  font-size: 1.5rem;
}

.dropzone-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.dropzone-hint {
  font-size: 0.75rem;
  color: #9ca3af;
}

.dropzone-preview {
  width: 100%;
  height: 100%;
  position: relative;
}

.preview-video {
  width: 100%;
  height: 120px;
  object-fit: cover;
}
</style>
