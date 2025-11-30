<template>
  <div class="build-panel">
    <div class="build-header">
      <UIcon name="i-lucide-hammer" class="cc-panel-header-icon" />
      <span class="cc-panel-header-title">設計パネル</span>
      <UButton
        color="primary"
        size="sm"
        class="cc-header-action-button"
        :disabled="isBuilding"
        @click="$emit('generate-prompts')"
      >
        <UIcon name="i-lucide-sparkles" class="cc-header-action-icon" />
        {{ isBuilding ? '生成中...' : 'プロンプト生成' }}
      </UButton>
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
        <!-- 概要 -->
        <div class="overview-display">
          <div class="overview-header">
            <span class="overview-label">概要</span>
            <UButton
              variant="ghost"
              size="xs"
              icon="i-lucide-edit-2"
              class="overview-edit-btn"
              @click="showOverviewEditor = true"
            />
          </div>
          <div v-if="localOverview" class="overview-text">{{ localOverview }}</div>
          <div v-else class="overview-empty">まだ生成されていません...</div>
        </div>

        <!-- カテゴリフィルター -->
        <div class="category-filter">
          <button
            v-for="cat in categoryOptions"
            :key="cat.value"
            class="category-tag"
            :class="{ active: selectedCategory === cat.value || (selectedCategory === 'all' && cat.value === 'all') }"
            @click="selectedCategory = cat.value"
          >
            <span class="category-icon">{{ cat.icon }}</span>
            <span class="category-label">{{ cat.label }}</span>
            <span class="category-count">{{ getCategoryCount(cat.value) }}</span>
          </button>
        </div>

        <!-- ポイントリスト -->
        <div class="points-section">
          <div v-if="filteredPoints.length === 0" class="empty-message">
            {{ points.length === 0 ? 'まだ生成されていません...' : 'このカテゴリのポイントはありません' }}
          </div>
          <div v-else class="points-list">
            <div
              v-for="(point, index) in filteredPoints"
              :key="index"
              class="point-card"
            >
              <!-- 問いかけ -->
              <div class="point-question-row">
                <span class="point-category-badge" :class="`badge-${point.category}`">
                  {{ getCategoryLabel(point.category) }}
                </span>
                <span class="point-question">{{ point.question }}</span>
              </div>
              <!-- ポイント（解説） -->
              <div class="point-explanation-row">
                <UIcon name="i-lucide-lightbulb" class="point-row-icon point-icon" />
                <span class="point-explanation">{{ point.point }}</span>
              </div>
              <!-- 正解基準 -->
              <div class="point-answer-row">
                <UIcon name="i-lucide-check-circle" class="point-row-icon answer-icon" />
                <div class="point-answer-content">
                  <ul class="point-answer-list">
                    <li v-for="(item, idx) in parseAnswerToList(point.correctAnswer)" :key="idx">{{ item }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 台本タブ -->
      <div v-show="activeTab === 'script'" class="tab-pane">
        <!-- 相手選択 -->
        <div class="script-persona-selector">
          <label class="persona-label">相手:</label>
          <div class="opponent-toggle">
            <button
              class="opponent-toggle-btn"
              :class="{ active: selectedOpponent === 'teacher' }"
              @click="selectedOpponent = 'teacher'"
            >
              先生
            </button>
            <button
              class="opponent-toggle-btn"
              :class="{ active: selectedOpponent === 'customer' }"
              @click="selectedOpponent = 'customer'"
            >
              お客様
            </button>
          </div>
        </div>

        <!-- 台本コンテンツ -->
        <div class="script-content-area">
          <div v-if="scriptLines.length === 0" class="empty-message">
            まだ生成されていません...
          </div>
          <div v-else class="script-lines-list">
            <div
              v-for="(line, index) in scriptLines"
              :key="index"
              class="script-line-row"
              :class="[
                line.speaker === 'self' ? 'script-line-player' : (line.speaker === 'narrator' ? 'script-line-narrator' : 'script-line-opponent'),
                index % 2 === 0 ? 'script-line-even' : 'script-line-odd'
              ]"
            >
              <span class="script-line-speaker">{{ getSpeakerLabel(line.speaker) }}：</span>
              <span class="script-line-text">{{ line.text }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- キャラクタータブ -->
      <div v-show="activeTab === 'characters'" class="tab-pane">
        <div class="characters-section">
          <div v-if="characters.length === 0" class="empty-message">
            まだ生成されていません...
          </div>
          <template v-else>
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
                :class="{ 'character-card-selected': selectedCharacterId === character.id }"
                @click="selectCharacter(character)"
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
          </template>
        </div>
      </div>
    </div>

    <!-- 概要編集ポップアップ -->
    <UModal v-model:open="showOverviewEditor" title="概要を編集">
      <template #body>
        <textarea
          v-model="editingOverview"
          class="overview-editor-textarea"
          rows="6"
          placeholder="トレーニングの目的と内容のサマリーを入力してください..."
        ></textarea>
      </template>
      <template #footer>
        <div class="overview-editor-footer">
          <UButton variant="ghost" color="neutral" @click="showOverviewEditor = false">キャンセル</UButton>
          <UButton color="primary" @click="saveOverview">保存</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
type PointCategory = 'knowledge' | 'mindset' | 'speaking'

interface Point {
  category: PointCategory // 分類：knowledge（知識）, mindset（考え方）, speaking（話し方）
  question: string        // 問いかけ：ポイントを投げかける質問
  point: string           // ポイント：ポイントの解説
  correctAnswer: string   // 正答例：問いかけに対する口語的なお手本の回答例
}

interface ScriptLine {
  speaker: 'self' | 'opponent' | 'narrator'
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
  voice: 'alloy' | 'echo' | 'shimmer' | 'ash' | 'ballad' | 'coral' | 'sage' | 'verse'
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
  'update:selectedOpponent': [value: string]
  'generate-prompts': []
  'character-selected': [character: Character]
}>()

// タブ状態
const activeTab = ref<'points' | 'script' | 'characters'>('points')

// ローカル状態
const localOverview = ref(props.overview || '')
// 台本タブの相手選択は常に 'teacher' をデフォルトにする
const selectedOpponent = ref<'teacher' | 'customer'>('teacher')
const selectedCharacterId = ref<string | null>(null)
const selectedCategory = ref<'all' | PointCategory>('all')

// 概要編集用の状態
const showOverviewEditor = ref(false)
const editingOverview = ref('')

// 概要編集ポップアップを開く時に現在の値をセット
watch(showOverviewEditor, (isOpen) => {
  if (isOpen) {
    editingOverview.value = localOverview.value
  }
})

// 概要を保存
const saveOverview = () => {
  localOverview.value = editingOverview.value
  emit('update:overview', editingOverview.value)
  showOverviewEditor.value = false
}

// 正解基準を箇条書きリストにパース
const parseAnswerToList = (answer: string): string[] => {
  if (!answer) return []
  // 既に箇条書き形式の場合
  if (answer.includes('・') || answer.includes('•') || answer.includes('-')) {
    return answer.split(/[・•\-\n]/).map(s => s.trim()).filter(s => s.length > 0)
  }
  // 句点で区切る
  if (answer.includes('。')) {
    return answer.split('。').map(s => s.trim()).filter(s => s.length > 0)
  }
  // そのまま返す
  return [answer]
}

// 台本の話者クラスを取得
const getDialogueClass = (speaker: 'self' | 'opponent' | 'narrator') => {
  if (speaker === 'self') {
    return 'dialogue-self'
  }
  if (speaker === 'narrator') {
    return 'dialogue-narrator'
  }
  return selectedOpponent.value === 'teacher' ? 'dialogue-teacher' : 'dialogue-customer'
}

// 話者ラベルを取得
const getSpeakerLabel = (speaker: 'self' | 'opponent' | 'narrator') => {
  if (speaker === 'self') {
    return 'あなた'
  }
  if (speaker === 'narrator') {
    return 'ナレーター'
  }
  return selectedOpponent.value === 'teacher' ? '先生' : 'お客様'
}

// カテゴリオプション
const categoryOptions = [
  { value: 'all', label: '全て', icon: '📋' },
  { value: 'knowledge', label: '知識', icon: '📚' },
  { value: 'mindset', label: '考え方', icon: '💡' },
  { value: 'speaking', label: '話し方', icon: '🗣️' }
]

// カテゴリラベルの取得
const getCategoryLabel = (category: PointCategory): string => {
  const labels: Record<PointCategory, string> = {
    knowledge: '知識',
    mindset: '考え方',
    speaking: '話し方'
  }
  return labels[category] || category
}

// カテゴリごとのポイント数を取得
const getCategoryCount = (category: string): number => {
  if (category === 'all') return props.points?.length || 0
  return props.points?.filter(p => p.category === category).length || 0
}

// フィルタリングされたポイント
const filteredPoints = computed(() => {
  if (selectedCategory.value === 'all') return props.points || []
  return (props.points || []).filter(p => p.category === selectedCategory.value)
})

// 元のインデックスを取得
const getOriginalIndex = (point: Point): number => {
  return (props.points || []).findIndex(p => p === point)
}

// キャラクター選択処理
const selectCharacter = (character: Character) => {
  selectedCharacterId.value = character.id
  emit('character-selected', character)
}

// 相手オプション（先生とお客様のみ）
const opponentOptions = [
  { label: '先生', value: 'teacher' },
  { label: 'お客様', value: 'customer' }
]

// 選択された相手のラベル
const selectedOpponentLabel = computed(() => {
  const option = opponentOptions.find(o => o.value === selectedOpponent.value)
  return option?.label || '相手'
})

// ポイントリスト
const points = computed(() => props.points || [])

// 台本ライン
const scriptLines = computed(() => props.scriptLines || [])

// キャラクターデータ（11名）
// 音声: alloy(中性), echo(男性低め), shimmer(女性高め), ash(男性), ballad(男性穏やか), coral(女性), sage(男性落ち着き), verse(女性力強い)
const characters = ref<Character[]>([
  {
    id: 'akira',
    name: '高橋 明',
    age: 35,
    attribute: 'IT企業 プロジェクトマネージャー',
    personality: '論理的で冷静、効率を重視する',
    catchphrase: '「具体的な数字で説明してください」',
    avatar: '/Akira_Loop.webm',
    voice: 'ash'  // 男性、論理的な印象
  },
  {
    id: 'atsushi',
    name: '田村 篤志',
    age: 52,
    attribute: '製造業 工場長',
    personality: '実直で慎重、品質にこだわる',
    catchphrase: '「まずは現場を見てから判断しよう」',
    avatar: '/Atsushi_Loop.webm',
    voice: 'echo'  // 男性低め、重厚感
  },
  {
    id: 'jun',
    name: '木村 潤',
    age: 28,
    attribute: 'スタートアップ CEO',
    personality: 'スピード重視、革新的',
    catchphrase: '「それ、スケールする？」',
    avatar: '/Jun_Loop.webm',
    voice: 'alloy'  // 中性的、若々しい
  },
  {
    id: 'keiji',
    name: '渡辺 啓二',
    age: 48,
    attribute: '金融機関 部長',
    personality: 'リスク意識が高く、保守的',
    catchphrase: '「リスクヘッジはどうなっていますか？」',
    avatar: '/Keiji_Loop.webm',
    voice: 'sage'  // 男性落ち着き、堅実な印象
  },
  {
    id: 'keiko',
    name: '山本 恵子',
    age: 45,
    attribute: '小売業 バイヤー',
    personality: 'コスト意識が高い、交渉上手',
    catchphrase: '「もう少し安くならないの？」',
    avatar: '/Keiko_Loop.webm',
    voice: 'verse'  // 女性力強い、交渉向き
  },
  {
    id: 'kyoko',
    name: '佐藤 京子',
    age: 38,
    attribute: '人材会社 採用責任者',
    personality: '人を見る目が鋭い、共感力が高い',
    catchphrase: '「御社の強みを教えてください」',
    avatar: '/Kyoko_Loop.webm',
    voice: 'coral'  // 女性、親しみやすい
  },
  {
    id: 'makoto',
    name: '中村 誠',
    age: 42,
    attribute: 'コンサルティング会社 パートナー',
    personality: '分析的で質問が多い、本質を探る',
    catchphrase: '「それは本当に課題の本質ですか？」',
    avatar: '/Makoto_Loop.webm',
    voice: 'ballad'  // 男性穏やか、知的な印象
  },
  {
    id: 'nana',
    name: '鈴木 菜々',
    age: 26,
    attribute: 'ベンチャー企業 マーケター',
    personality: 'トレンドに敏感、発想が柔軟',
    catchphrase: '「SNSでバズりそう？」',
    avatar: '/Nana_Loop.webm',
    voice: 'shimmer'  // 女性高め、若々しい
  },
  {
    id: 'sakura',
    name: '伊藤 さくら',
    age: 32,
    attribute: '医療機関 事務長',
    personality: '丁寧で慎重、コンプライアンス重視',
    catchphrase: '「患者さんへの影響は大丈夫ですか？」',
    avatar: '/Sakura_Loop.webm',
    voice: 'coral'  // 女性、丁寧な印象
  },
  {
    id: 'takeshi',
    name: '加藤 武',
    age: 55,
    attribute: '建設会社 社長',
    personality: '豪快で決断が早い、義理堅い',
    catchphrase: '「男と男の約束だ」',
    avatar: '/Takeshi_Loop.webm',
    voice: 'echo'  // 男性低め、豪快な印象
  },
  {
    id: 'tatsuya',
    name: '松本 達也',
    age: 40,
    attribute: '広告代理店 クリエイティブディレクター',
    personality: '感性重視、こだわりが強い',
    catchphrase: '「面白いけど、もっと尖らせたい」',
    avatar: '/Tatsuya_Loop.webm',
    voice: 'ash'  // 男性、クリエイティブな印象
  }
])

// overview変更を親に通知
watch(localOverview, (newVal) => {
  emit('update:overview', newVal)
})

// selectedOpponent変更を親に通知
watch(selectedOpponent, (newVal) => {
  emit('update:selectedOpponent', newVal)
})

// propsの変更を監視
watch(() => props.overview, (newVal) => {
  if (newVal !== undefined) {
    localOverview.value = newVal
  }
})

// selectedCharacterの変更は台本タブのselectedOpponentとは無関係なので削除
// （selectedCharacterはキャラクター選択、selectedOpponentは相手タイプ）

// 外部からタブを変更するためのメソッド
const setActiveTab = (tab: 'points' | 'script' | 'characters') => {
  activeTab.value = tab
}

// 外部に公開
defineExpose({
  setActiveTab,
  characters
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

/* Overview Simple */
.overview-simple {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.overview-label {
  font-size: 13px;
  font-weight: 500;
  color: #475569;
}

.overview-textarea-simple {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.6;
  resize: none;
  background: white;
  color: #334155;
  transition: border-color 0.15s;
}

.overview-textarea-simple:focus {
  outline: none;
  border-color: #a5b4fc;
}

.overview-textarea-simple::placeholder {
  color: #9ca3af;
}

/* Category Filter */
.category-filter {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.category-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: white;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
}

.category-tag:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.category-tag.active {
  border-color: #6366f1;
  background: #eef2ff;
  color: #4f46e5;
}

.category-icon {
  font-size: 12px;
}

.category-label {
  font-weight: 500;
}

.category-count {
  font-size: 10px;
  background: #f3f4f6;
  padding: 1px 5px;
  border-radius: 8px;
  color: #9ca3af;
}

.category-tag.active .category-count {
  background: #c7d2fe;
  color: #4f46e5;
}

/* Points Section */
.points-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  padding: 10px 12px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.point-number {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  font-size: 12px;
  font-weight: 700;
  border-radius: 50%;
  flex-shrink: 0;
}

.point-category-badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  flex-shrink: 0;
}

.badge-knowledge {
  background: #fef3c7;
  color: #92400e;
}

.badge-mindset {
  background: #dbeafe;
  color: #1e40af;
}

.badge-speaking {
  background: #f3e8ff;
  color: #6b21a8;
}

.point-question {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  line-height: 1.5;
}

/* ポイント解説行 */
.point-explanation-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  background: white;
  border-bottom: 1px solid #f1f5f9;
}

.point-row-icon {
  flex-shrink: 0;
  font-size: 14px;
  margin-top: 2px;
}

.point-icon {
  color: #f59e0b;
}

.answer-icon {
  color: #3b82f6;
}

.point-explanation {
  font-size: 12px;
  color: #334155;
  line-height: 1.6;
}

/* 正答例行 */
.point-answer-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  background: white;
}

.point-answer {
  font-size: 12px;
  color: #475569;
  line-height: 1.6;
}

/* Script Tab */
.script-persona-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
}

.persona-label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  white-space: nowrap;
}

.script-content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-top: 12px;
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

/* 台本行リスト */
.script-lines-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
}

.script-line-row {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.6;
  border-bottom: 1px solid #f5f5f5;
  background: white;
}

.script-line-row:last-child {
  border-bottom: none;
}

.script-line-speaker {
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 60px;
}

.script-line-text {
  flex: 1;
  color: #374151;
}

/* プレイヤー行 */
.script-line-player {
  background: #fafcff;
}

.script-line-player .script-line-speaker {
  color: #3b82f6;
}

/* 相手行 */
.script-line-opponent {
  background: #fffcf5;
}

.script-line-opponent .script-line-speaker {
  color: #d97706;
}

/* ナレーター行 */
.script-line-narrator {
  background: #fafafa;
  font-style: italic;
}

.script-line-narrator .script-line-speaker {
  color: #9ca3af;
}

.script-line-narrator .script-line-text {
  color: #9ca3af;
}

/* 交互の色分け - 廃止、シンプルに */
.script-line-player.script-line-odd {
  background: #f8fafc;
}

.script-line-opponent.script-line-odd {
  background: #fffbeb;
}

.script-line-narrator.script-line-odd {
  background: #f5f5f5;
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
  border-radius: 12px;
  padding: 14px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.character-card:hover {
  border-color: #c4b5fd;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.1);
  cursor: pointer;
}

.character-card-selected {
  border-color: #8b5cf6;
  background: #f5f3ff;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.2);
}

.character-avatar {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%);
  border-radius: 12px;
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

/* Empty Message */
.empty-message {
  color: #9ca3af;
  font-size: 13px;
  text-align: left;
  padding: 8px 0;
}

/* Overview Display */
.overview-display {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.overview-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.overview-label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.overview-edit-btn {
  opacity: 0.6;
  transition: opacity 0.15s;
}

.overview-edit-btn:hover {
  opacity: 1;
}

.overview-text {
  font-size: 13px;
  color: #334155;
  line-height: 1.7;
  white-space: pre-wrap;
}

.overview-empty {
  font-size: 13px;
  color: #9ca3af;
  font-style: italic;
}

/* Point Answer Content */
.point-answer-content {
  flex: 1;
}

.point-answer-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.point-answer-list li {
  font-size: 12px;
  color: #475569;
  line-height: 1.5;
  padding-left: 14px;
  position: relative;
}

.point-answer-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #3b82f6;
  font-weight: bold;
}

/* Opponent Toggle */
.opponent-toggle {
  display: flex;
  gap: 4px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 3px;
}

.opponent-toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
}

.opponent-toggle-btn:hover {
  background: #f1f5f9;
}

.opponent-toggle-btn.active {
  background: #6366f1;
  color: white;
}

/* Overview Editor Modal */
.overview-editor-textarea {
  width: 100%;
  min-height: 150px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.7;
  resize: vertical;
  background: white;
  color: #334155;
}

.overview-editor-textarea:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.overview-editor-textarea::placeholder {
  color: #9ca3af;
}

.overview-editor-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
