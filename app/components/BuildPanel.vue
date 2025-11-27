<template>
  <div class="build-panel">
    <div class="build-header">
      <UIcon name="i-lucide-hammer" class="cc-panel-header-icon" />
      <span class="cc-panel-header-title">設計パネル</span>
      <div class="build-header-buttons">
        <UButton
          color="primary"
          size="sm"
          class="build-button"
          :disabled="isBuilding"
          @click="$emit('start-build')"
        >
          <UIcon name="i-lucide-play" class="build-button-icon" />
          {{ isBuilding ? '設計中...' : 'ロープレ設計' }}
        </UButton>
        <UButton
          variant="outline"
          color="primary"
          size="sm"
          class="build-button"
          :disabled="isBuilding"
          @click="$emit('generate-prompts')"
        >
          <UIcon name="i-lucide-sparkles" class="build-button-icon" />
          プロンプト生成
        </UButton>
      </div>
    </div>

    <!-- 構築中のオーバーレイ -->
    <div v-if="isBuilding" class="build-loading-overlay">
      <div class="loading-spinner"></div>
      <p class="loading-text">{{ buildingStep }}</p>
    </div>

    <!-- タブナビゲーション -->
    <div class="cc-panel-tabs">
      <button
        class="cc-panel-tab"
        :class="{ active: activeTab === 'points' }"
        @click="activeTab = 'points'"
      >
        <UIcon name="i-lucide-list-checks" class="cc-panel-tab-icon" />
        <span>ポイント</span>
      </button>
      <button
        class="cc-panel-tab"
        :class="{ active: activeTab === 'script' }"
        @click="activeTab = 'script'"
      >
        <UIcon name="i-lucide-scroll-text" class="cc-panel-tab-icon" />
        <span>台本</span>
      </button>
      <button
        class="cc-panel-tab"
        :class="{ active: activeTab === 'characters' }"
        @click="activeTab = 'characters'"
      >
        <UIcon name="i-lucide-users" class="cc-panel-tab-icon" />
        <span>キャラクター</span>
      </button>
    </div>

    <!-- タブコンテンツ -->
    <div class="build-tab-content">
      <!-- ポイントタブ -->
      <div v-show="activeTab === 'points'" class="tab-pane">
        <!-- 概要コンポーネント -->
        <div class="overview-section">
          <div class="overview-header">
            <UIcon name="i-lucide-file-text" class="overview-icon" />
            <span class="overview-title">トレーニング概要</span>
          </div>
          <textarea
            v-model="localOverview"
            class="overview-textarea"
            placeholder="トレーニングの概要を入力してください..."
            rows="4"
          ></textarea>
        </div>

        <!-- ポイントコンポーネント -->
        <div class="points-section">
          <div class="points-header">
            <UIcon name="i-lucide-help-circle" class="points-icon" />
            <span class="points-title">ポイント（Q&A）</span>
            <span class="points-count">{{ points.length }}件</span>
          </div>
          <div class="points-list">
            <div v-if="points.length === 0" class="points-empty">
              ポイントがまだ生成されていません
            </div>
            <div
              v-for="(point, index) in points"
              :key="index"
              class="point-card"
            >
              <div class="point-question-row">
                <span class="point-number">Q{{ index + 1 }}</span>
                <span class="point-question">{{ point.question }}</span>
              </div>
              <div class="point-answer-row">
                <span class="point-answer-label">A.</span>
                <span class="point-answer">{{ point.answer }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 台本タブ -->
      <div v-show="activeTab === 'script'" class="tab-pane">
        <!-- ペルソナ選択 -->
        <div class="script-persona-selector">
          <label class="persona-label">ペルソナ:</label>
          <USelect
            v-model="selectedPersona"
            :items="personaOptions"
            size="sm"
            class="persona-select"
          />
        </div>

        <!-- 台本コンテンツ -->
        <div class="script-content-area">
          <div v-if="scriptLines.length === 0" class="script-empty">
            台本がまだ生成されていません
          </div>
          <div v-else class="script-lines">
            <div
              v-for="(line, index) in scriptLines"
              :key="index"
              class="script-line"
              :class="{ 'script-line-self': line.speaker === 'self', 'script-line-opponent': line.speaker === 'opponent' }"
            >
              <div class="script-speaker">
                <span class="speaker-icon">{{ line.speaker === 'self' ? '👤' : '👔' }}</span>
                <span class="speaker-name">{{ line.speaker === 'self' ? '自分' : selectedPersonaLabel }}</span>
              </div>
              <div class="script-text">{{ line.text }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- キャラクタータブ -->
      <div v-show="activeTab === 'characters'" class="tab-pane">
        <div class="characters-section">
          <div class="characters-header">
            <UIcon name="i-lucide-users" class="characters-icon" />
            <span class="characters-title">登場キャラクター</span>
            <span class="characters-count">{{ characters.length }}人</span>
          </div>
          <div class="characters-list">
            <div
              v-for="character in characters"
              :key="character.id"
              class="character-card"
            >
              <div class="character-avatar">
                <video
                  :src="character.avatar"
                  class="character-avatar-video"
                  autoplay
                  loop
                  muted
                  playsinline
                />
              </div>
              <div class="character-info">
                <div class="character-name-row">
                  <span class="character-name">{{ character.name }}</span>
                  <span class="character-age">{{ character.age }}歳</span>
                </div>
                <div class="character-attribute">{{ character.attribute }}</div>
                <div class="character-detail">
                  <span class="detail-label">性格:</span>
                  <span class="detail-value">{{ character.personality }}</span>
                </div>
                <div class="character-detail">
                  <span class="detail-label">口癖:</span>
                  <span class="detail-value">{{ character.catchphrase }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Point {
  question: string
  answer: string
}

interface ScriptLine {
  speaker: 'self' | 'opponent'
  text: string
}

interface Script {
  mode: string
  content: string
  expanded: boolean
}

interface Character {
  id: string
  name: string
  age: number
  attribute: string
  personality: string
  catchphrase: string
  avatar: string
}

const props = defineProps<{
  goals?: string[]
  points?: Point[]
  scripts?: Script[]
  overview?: string
  scriptLines?: ScriptLine[]
  isBuilding?: boolean
  buildingStep?: string
  characterOptions?: Array<{ label: string; value: string }>
  selectedCharacter?: string
}>()

const emit = defineEmits<{
  'update:overview': [value: string]
  'update:selectedPersona': [value: string]
  'start-build': []
  'generate-prompts': []
}>()

// タブ状態
const activeTab = ref<'points' | 'script' | 'characters'>('points')

// ローカル状態
const localOverview = ref(props.overview || '')
const selectedPersona = ref(props.selectedCharacter || 'businessman')

// ペルソナオプション（親からのcharacterOptionsにリンク）
const personaOptions = computed(() => {
  return props.characterOptions || [
    { label: 'ビジネスマン', value: 'businessman' },
    { label: '営業ウーマン', value: 'saleswoman' },
    { label: 'マネージャー', value: 'manager' },
    { label: '顧客', value: 'customer' }
  ]
})

// 選択されたペルソナのラベル
const selectedPersonaLabel = computed(() => {
  const option = personaOptions.value.find(o => o.value === selectedPersona.value)
  return option?.label || '相手'
})

// ポイントリスト
const points = computed(() => props.points || [])

// 台本ライン
const scriptLines = computed(() => props.scriptLines || [])

// キャラクターデータ（11名）
const characters = ref<Character[]>([
  {
    id: 'akira',
    name: '高橋 明',
    age: 35,
    attribute: 'IT企業 プロジェクトマネージャー',
    personality: '論理的で冷静、効率を重視する',
    catchphrase: '「具体的な数字で説明してください」',
    avatar: '/Akira_Loop.webm'
  },
  {
    id: 'atsushi',
    name: '田村 篤志',
    age: 52,
    attribute: '製造業 工場長',
    personality: '実直で慎重、品質にこだわる',
    catchphrase: '「まずは現場を見てから判断しよう」',
    avatar: '/Atsushi_Loop.webm'
  },
  {
    id: 'jun',
    name: '木村 潤',
    age: 28,
    attribute: 'スタートアップ CEO',
    personality: 'スピード重視、革新的',
    catchphrase: '「それ、スケールする？」',
    avatar: '/Jun_Loop.webm'
  },
  {
    id: 'keiji',
    name: '渡辺 啓二',
    age: 48,
    attribute: '金融機関 部長',
    personality: 'リスク意識が高く、保守的',
    catchphrase: '「リスクヘッジはどうなっていますか？」',
    avatar: '/Keiji_Loop.webm'
  },
  {
    id: 'keiko',
    name: '山本 恵子',
    age: 45,
    attribute: '小売業 バイヤー',
    personality: 'コスト意識が高い、交渉上手',
    catchphrase: '「もう少し安くならないの？」',
    avatar: '/Keiko_Loop.webm'
  },
  {
    id: 'kyoko',
    name: '佐藤 京子',
    age: 38,
    attribute: '人材会社 採用責任者',
    personality: '人を見る目が鋭い、共感力が高い',
    catchphrase: '「御社の強みを教えてください」',
    avatar: '/Kyoko_Loop.webm'
  },
  {
    id: 'makoto',
    name: '中村 誠',
    age: 42,
    attribute: 'コンサルティング会社 パートナー',
    personality: '分析的で質問が多い、本質を探る',
    catchphrase: '「それは本当に課題の本質ですか？」',
    avatar: '/Makoto_Loop.webm'
  },
  {
    id: 'nana',
    name: '鈴木 菜々',
    age: 26,
    attribute: 'ベンチャー企業 マーケター',
    personality: 'トレンドに敏感、発想が柔軟',
    catchphrase: '「SNSでバズりそう？」',
    avatar: '/Nana_Loop.webm'
  },
  {
    id: 'sakura',
    name: '伊藤 さくら',
    age: 32,
    attribute: '医療機関 事務長',
    personality: '丁寧で慎重、コンプライアンス重視',
    catchphrase: '「患者さんへの影響は大丈夫ですか？」',
    avatar: '/Sakura_Loop.webm'
  },
  {
    id: 'takeshi',
    name: '加藤 武',
    age: 55,
    attribute: '建設会社 社長',
    personality: '豪快で決断が早い、義理堅い',
    catchphrase: '「男と男の約束だ」',
    avatar: '/Takeshi_Loop.webm'
  },
  {
    id: 'tatsuya',
    name: '松本 達也',
    age: 40,
    attribute: '広告代理店 クリエイティブディレクター',
    personality: '感性重視、こだわりが強い',
    catchphrase: '「面白いけど、もっと尖らせたい」',
    avatar: '/Tatsuya_Loop.webm'
  }
])

// overview変更を親に通知
watch(localOverview, (newVal) => {
  emit('update:overview', newVal)
})

// selectedPersona変更を親に通知
watch(selectedPersona, (newVal) => {
  emit('update:selectedPersona', newVal)
})

// propsの変更を監視
watch(() => props.overview, (newVal) => {
  if (newVal !== undefined) {
    localOverview.value = newVal
  }
})

watch(() => props.selectedCharacter, (newVal) => {
  if (newVal !== undefined) {
    selectedPersona.value = newVal
  }
})
</script>

<style scoped>
.build-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-right: 1px solid #e5e7eb;
  position: relative;
}

.build-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 48px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

/* グローバルスタイルと同期 */
.build-header .cc-panel-header-icon {
  font-size: 18px;
  color: #6366f1;
  flex-shrink: 0;
}

.build-header .cc-panel-header-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
}

.build-header-buttons {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.build-button {
  font-weight: 600;
  padding: 6px 12px;
  font-size: 13px;
}

.build-button-icon {
  font-size: 14px;
  margin-right: 4px;
}

/* Loading Overlay */
.build-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 10;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #8b5cf6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-text {
  color: #6b7280;
  font-size: 14px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Tab Content */
.build-tab-content {
  flex: 1;
  overflow: hidden;
}

.tab-pane {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Overview Section */
.overview-section {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.overview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: #f1f5f9;
  border-bottom: 1px solid #e5e7eb;
}

.overview-icon {
  font-size: 16px;
  color: #6366f1;
}

.overview-title {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.overview-textarea {
  width: 100%;
  padding: 12px 14px;
  border: none;
  font-size: 13px;
  line-height: 1.6;
  resize: none;
  background: white;
  color: #334155;
}

.overview-textarea:focus {
  outline: none;
}

.overview-textarea::placeholder {
  color: #9ca3af;
}

/* Points Section */
.points-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.points-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.points-icon {
  font-size: 16px;
  color: #eab308;
}

.points-title {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  flex: 1;
}

.points-count {
  font-size: 12px;
  color: #9ca3af;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 10px;
}

.points-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.points-empty {
  text-align: center;
  padding: 32px 20px;
  color: #9ca3af;
  font-size: 13px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px dashed #e5e7eb;
}

/* Point Card */
.point-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.15s;
}

.point-card:hover {
  border-color: #d1d5db;
}

.point-question-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  background: #fefce8;
  border-bottom: 1px solid #fef3c7;
}

.point-number {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 22px;
  background: #eab308;
  color: white;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  flex-shrink: 0;
}

.point-question {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  line-height: 1.5;
}

.point-answer-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
}

.point-answer-label {
  font-size: 13px;
  font-weight: 600;
  color: #10b981;
  flex-shrink: 0;
}

.point-answer {
  font-size: 13px;
  color: #475569;
  line-height: 1.6;
}

/* Script Tab */
.script-persona-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.persona-label {
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  white-space: nowrap;
}

.persona-select {
  flex: 1;
  max-width: 200px;
}

.script-content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.script-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px 20px;
  color: #9ca3af;
  font-size: 13px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px dashed #e5e7eb;
}

.script-lines {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.script-line {
  border-radius: 8px;
  overflow: hidden;
}

.script-line-self {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}

.script-line-opponent {
  background: #fef3c7;
  border: 1px solid #fde68a;
}

.script-speaker {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.script-line-self .script-speaker {
  background: #dbeafe;
}

.script-line-opponent .script-speaker {
  background: #fef08a;
}

.speaker-icon {
  font-size: 16px;
}

.speaker-name {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

.script-text {
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.6;
  color: #334155;
}

/* Characters Section */
.characters-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.characters-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.characters-icon {
  font-size: 16px;
  color: #8b5cf6;
}

.characters-title {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  flex: 1;
}

.characters-count {
  font-size: 12px;
  color: #9ca3af;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 10px;
}

.characters-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Character Card */
.character-card {
  display: flex;
  gap: 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.character-card:hover {
  border-color: #c4b5fd;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.1);
}

.character-avatar {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.character-avatar-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.character-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.character-name-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.character-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.character-age {
  font-size: 12px;
  color: #64748b;
}

.character-attribute {
  font-size: 12px;
  color: #8b5cf6;
  font-weight: 500;
}

.character-detail {
  display: flex;
  gap: 6px;
  font-size: 12px;
  line-height: 1.5;
}

.detail-label {
  color: #9ca3af;
  flex-shrink: 0;
}

.detail-value {
  color: #475569;
}
</style>
