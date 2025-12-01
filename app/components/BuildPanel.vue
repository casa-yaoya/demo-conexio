<template>
  <div class="build-panel">
    <div class="build-header">
      <UIcon name="i-lucide-hammer" class="cc-panel-header-icon" />
      <span class="cc-panel-header-title">設計パネル</span>
      <UButton
        color="primary"
        size="sm"
        class="cc-header-action-button"
        :disabled="isBuilding || isGeneratingPrompts"
        @click="showConfirmDialog = true"
      >
        <UIcon name="i-lucide-sparkles" class="cc-header-action-icon" />
        {{ isBuilding || isGeneratingPrompts ? '生成中...' : 'プロンプト生成' }}
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
              <!-- ヘッダー: Q + 問いかけ + 編集ボタン -->
              <div class="point-header">
                <span class="point-q-badge">Q</span>
                <textarea
                  v-if="editingPointIndex === index"
                  v-model="editingPoint.question"
                  class="point-question-edit"
                  rows="1"
                  placeholder="問いかけを入力..."
                ></textarea>
                <span v-else class="point-question-text">{{ point.question }}</span>
                <UButton
                  v-if="editingPointIndex !== index"
                  variant="ghost"
                  size="xs"
                  icon="i-lucide-edit-2"
                  class="point-edit-btn"
                  @click="startEditPoint(index)"
                />
                <UButton
                  v-else
                  variant="solid"
                  size="xs"
                  color="primary"
                  class="point-save-btn"
                  @click="saveEditPoint(index)"
                >
                  保存
                </UButton>
              </div>

              <!-- 正解基準（横並び） -->
              <div class="point-row">
                <span class="point-row-label">正解基準</span>
                <textarea
                  v-if="editingPointIndex === index"
                  v-model="editingPoint.point"
                  class="point-row-edit"
                  rows="1"
                ></textarea>
                <span v-else class="point-row-value">{{ point.point }}</span>
              </div>

              <!-- 正答例（横並び） -->
              <div class="point-row">
                <span class="point-row-label">正答例</span>
                <textarea
                  v-if="editingPointIndex === index"
                  v-model="editingPoint.correctAnswer"
                  class="point-row-edit"
                  rows="1"
                ></textarea>
                <span v-else class="point-row-value point-answer-value">{{ point.correctAnswer }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 台本タブ -->
      <div v-show="activeTab === 'script'" class="tab-pane">
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

    <!-- プロンプト生成確認ダイアログ -->
    <UModal v-model:open="showConfirmDialog" title="プロンプト生成スタート" :ui="{ width: 'max-w-2xl' }">
      <template #body>
        <div class="prompt-gen-dialog">
          <!-- 現在の設定セクション -->
          <div class="prompt-gen-section">
            <div class="prompt-gen-section-title">現在の設定</div>

            <!-- モード別タブ -->
            <div class="prompt-gen-mode-tabs">
              <button
                v-for="mode in promptGenModes"
                :key="mode.key"
                class="prompt-gen-mode-tab"
                :class="{ active: selectedPromptGenMode === mode.key }"
                @click="selectedPromptGenMode = mode.key"
              >
                {{ mode.label }}
              </button>
            </div>

            <!-- モード別の説明（タブの直下） -->
            <div class="prompt-gen-mode-description-area">
              <div v-if="selectedPromptGenMode === 'confirmation'" class="prompt-gen-mode-desc">
                <p>AIが先生役として一問一答形式でポイントを確認します。生成されたポイントに基づいて、ユーザーの理解度をチェックします。</p>
              </div>
              <div v-else-if="selectedPromptGenMode === 'practice'" class="prompt-gen-mode-desc">
                <p>AIがお客様役として実際の接客・営業シーンを再現します。リアルな対話を通じて実践力を磨きます。</p>
              </div>
              <div v-else-if="selectedPromptGenMode === 'subtitle'" class="prompt-gen-mode-desc">
                <p>台本に沿ってAIが相手役を演じます。正しいセリフの流れを練習できます。</p>
              </div>
              <div v-else-if="selectedPromptGenMode === 'ai-demo'" class="prompt-gen-mode-desc">
                <p>AIが理想的な対応のお手本を見せます。プロの接客・営業トークを学べます。</p>
              </div>
            </div>

            <!-- 全モード共通パート -->
            <div class="prompt-gen-common-section">
              <div class="prompt-gen-common-title">共通設定</div>

              <!-- 相手の話し方 -->
              <div class="prompt-gen-field">
                <span class="prompt-gen-field-label">相手の話し方</span>
                <div class="prompt-gen-btn-group">
                  <button
                    v-for="style in speakingStyles"
                    :key="style.value"
                    class="prompt-gen-toggle-btn"
                    :class="{ active: selectedSpeakingStyle === style.value }"
                    @click="selectedSpeakingStyle = style.value"
                  >
                    {{ style.label }}
                  </button>
                </div>
              </div>

              <!-- 終了条件 -->
              <div class="prompt-gen-field">
                <span class="prompt-gen-field-label">終了条件</span>
                <div class="prompt-gen-checkboxes">
                  <!-- 上限ターン数（チェック外せない） -->
                  <div class="prompt-gen-checkbox-row prompt-gen-checkbox-row-with-tooltip">
                    <input
                      type="checkbox"
                      id="end-turn-limit"
                      :checked="true"
                      class="prompt-gen-checkbox"
                      @click.prevent="showTurnLimitTooltip = true"
                    />
                    <label for="end-turn-limit" class="prompt-gen-checkbox-label">
                      上限ターン数に達した時
                      <span class="prompt-gen-turn-input-wrapper">
                        （上限ターン数：
                        <input
                          type="number"
                          v-model.number="maxTurnCount"
                          min="1"
                          max="40"
                          class="prompt-gen-turn-input"
                        />
                        ターン）
                      </span>
                    </label>
                    <div v-if="showTurnLimitTooltip" class="prompt-gen-tooltip">
                      この項目は外せません
                      <button class="prompt-gen-tooltip-close" @click="showTurnLimitTooltip = false">×</button>
                    </div>
                  </div>

                  <!-- 終了コール -->
                  <div class="prompt-gen-checkbox-row">
                    <input
                      type="checkbox"
                      id="end-call"
                      v-model="endOnCall"
                      class="prompt-gen-checkbox"
                    />
                    <label for="end-call" class="prompt-gen-checkbox-label">
                      プレイヤーまたはAIが「会話終了」などの終了コールをした時
                    </label>
                  </div>
                </div>
              </div>

              <!-- 不正解の時の反応 -->
              <div class="prompt-gen-field">
                <span class="prompt-gen-field-label">不正解の時の反応 <span class="prompt-gen-field-note">※相手が先生の時のみ関係</span></span>
                <div class="prompt-gen-radio-group">
                  <label class="prompt-gen-radio-label">
                    <input type="radio" v-model="incorrectResponseType" value="show-answer" class="prompt-gen-radio" />
                    <span>正解を教えて、次に進む（正解は、○○だよ。次に進もう。）</span>
                  </label>
                  <label class="prompt-gen-radio-label">
                    <input type="radio" v-model="incorrectResponseType" value="hint-retry" class="prompt-gen-radio" />
                    <span>ヒントを出して、もう一度答えさせる（〇〇は違うね。ヒント：●● など）</span>
                  </label>
                  <label class="prompt-gen-radio-label">
                    <input type="radio" v-model="incorrectResponseType" value="no-hint-retry" class="prompt-gen-radio" />
                    <span>ヒントを出さずに、もう一度答えさせる（「他には？」「もう少し詳しく」など）</span>
                  </label>
                  <label class="prompt-gen-radio-label">
                    <input type="radio" v-model="incorrectResponseType" value="ignore-move-on" class="prompt-gen-radio" />
                    <span>不正解であることに触れず、自然な流れで次の質問に移る</span>
                  </label>
                </div>
              </div>
            </div>

          </div>

          <!-- 警告メッセージ -->
          <div class="prompt-gen-warning">
            <UIcon name="i-lucide-alert-triangle" class="prompt-gen-warning-icon" />
            <span>現在のプロンプトは上書きされます。よろしいですか？</span>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="confirm-dialog-footer">
          <UButton variant="ghost" color="neutral" @click="showConfirmDialog = false">キャンセル</UButton>
          <UButton color="primary" @click="confirmGeneratePrompts">はい</UButton>
        </div>
      </template>
    </UModal>

    <!-- プロンプト生成中オーバーレイ -->
    <div v-if="isGeneratingPrompts" class="build-loading-overlay">
      <div class="loading-spinner"></div>
      <p class="loading-text">{{ generatingModeLabel }}</p>
      <div class="generation-progress">
        <div class="generation-progress-bar" :style="{ width: generationProgress + '%' }"></div>
      </div>
      <p class="generation-step-text">{{ generationStepText }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Point {
  question: string        // 問いかけ：ポイントを投げかける質問
  point: string           // 正解基準：ポイントの解説
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

// プロンプト生成設定の型
interface PromptGenSettings {
  speakingStyle: 'friendly' | 'polite' | 'strict'
  maxTurnCount: number
  endOnCall: boolean
}

const emit = defineEmits<{
  'update:overview': [value: string]
  'update:points': [value: Point[]]
  'generate-prompts': []
  'generate-single-prompt': [modeKey: string, modeLabel: string, metaPrompt: string, settings: PromptGenSettings]
  'character-selected': [character: Character]
}>()

// タブ状態
const activeTab = ref<'points' | 'script' | 'characters'>('points')

// ローカル状態
const localOverview = ref(props.overview || '')
const selectedCharacterId = ref<string | null>(null)

// ポイント編集用の状態
const editingPointIndex = ref<number | null>(null)
const editingPoint = ref<Point>({ question: '', point: '', correctAnswer: '' })

// ローカルのポイントデータ（編集可能）
const localPoints = ref<Point[]>([])

// propsのpointsが変更されたらlocalPointsを更新
watch(() => props.points, (newPoints) => {
  if (newPoints) {
    localPoints.value = newPoints.map(p => ({ ...p }))
  }
}, { immediate: true, deep: true })

// ポイント編集開始
const startEditPoint = (index: number) => {
  editingPointIndex.value = index
  const point = localPoints.value[index]
  editingPoint.value = { ...point }
}

// ポイント編集保存
const saveEditPoint = (index: number) => {
  localPoints.value[index] = { ...editingPoint.value }
  editingPointIndex.value = null
  // 親に通知（必要に応じてemitを追加）
  emit('update:points', localPoints.value)
}

// 概要編集用の状態
const showOverviewEditor = ref(false)
const editingOverview = ref('')

// プロンプト生成確認ダイアログの状態
const showConfirmDialog = ref(false)
const isGeneratingPrompts = ref(false)
const generatingModeLabel = ref('')
const generationProgress = ref(0)
const generationStepText = ref('')
const currentGeneratingIndex = ref(0)

// プロンプト生成ダイアログ用の状態
const selectedPromptGenMode = ref('confirmation')
const selectedSpeakingStyle = ref('friendly')
const maxTurnCount = ref(10)
const endOnCall = ref(true)
const showTurnLimitTooltip = ref(false)
const incorrectResponseType = ref('show-answer') // 不正解時の反応

// モード別タブの定義
const promptGenModes = [
  { key: 'confirmation', label: '確認モード' },
  { key: 'practice', label: '実践モード' },
  { key: 'subtitle', label: '台本モード' },
  { key: 'ai-demo', label: 'お手本モード' }
]

// 話し方スタイルの定義
const speakingStyles = [
  { value: 'friendly', label: 'フレンドリー' },
  { value: 'polite', label: 'ていねい' },
  { value: 'strict', label: '厳しい' }
]

// モード別の生成用メタプロンプト
const modeMetaPrompts: Record<string, { label: string; metaPrompt: string }> = {
  'subtitle': {
    label: '台本モード',
    metaPrompt: `あなたは、人間がAIと会話をすることでトレーニングをするためにＡＩに渡すプロンプトを生成する、トレーニング設計のプロでかつ、プロンプト生成のプロです。人間が台本通りに話せるかを確認するために、ＡＩに台本の「お客様」側を演じさせたいです。台本の情報は与えられるのでそのままつかってください。また、生成されるプロンプトを実際に使う時には、末尾に相手キャラクターの設定を「あなたの設定：」として追加して動かします。なので、ＡＩにキャラクター的な情報を入れる必要はありません。`
  },
  'ai-demo': {
    label: 'お手本モード',
    metaPrompt: `あなたは、人間がAIと会話をすることでトレーニングをするためにＡＩに渡すプロンプトを生成する、トレーニング設計のプロでかつ、プロンプト生成のプロです。人間にお手本を見せるＡＩをつくりたいです。ポイントや台本（今回の文脈では、人間側がお客様側を体験することになる）の情報は与えられるのでそのままつかってください。また、生成されるプロンプトを実際に使う時には、末尾に相手キャラクターの設定を「あなたの設定：」として追加して動かします。なので、ＡＩにキャラクター的な情報を入れる必要はありません。`
  },
  'confirmation': {
    label: '確認モード',
    metaPrompt: `あなたは、人間がAIと会話をすることでトレーニングをするためにＡＩに渡すプロンプトを生成する、トレーニング設計のプロでかつ、プロンプト生成のプロです。人間がポイントを抑えているか確認する先生のＡＩをつくりたいです。確認するポイントの情報は与えられるのでそのままつかってください。また、生成されるプロンプトを実際に使う時には、末尾に相手キャラクターの設定を「あなたの設定：」として追加して動かします。なので、ＡＩにキャラクター的な情報を入れる必要はありません。`
  },
  'practice': {
    label: '実践モード',
    metaPrompt: `あなたは、人間がAIと会話をすることでトレーニングをするためにＡＩに渡すプロンプトを生成する、トレーニング設計のプロでかつ、プロンプト生成のプロです。人間がポイント押さえてしっかり話せるかを確認するために、ＡＩに「お客様」側を演じさせたいです。ポイントと台本の情報は与えられるので、これを参考に、ＡＩに与えるプロンプトを生成してください。生成されるプロンプトを実際に使う時には、末尾に相手キャラクターの設定を「あなたの設定：」として追加して動かします。なので、ＡＩにキャラクター的な情報を入れる必要はありません。`
  }
}

// モードの順番
const modeOrder = ['subtitle', 'ai-demo', 'confirmation', 'practice']

// プロンプト生成確認後の処理
const confirmGeneratePrompts = async () => {
  showConfirmDialog.value = false
  isGeneratingPrompts.value = true
  generationProgress.value = 0
  currentGeneratingIndex.value = 0

  // 順次プロンプトを生成
  for (let i = 0; i < modeOrder.length; i++) {
    const modeKey = modeOrder[i]
    const modeInfo = modeMetaPrompts[modeKey]

    currentGeneratingIndex.value = i
    generatingModeLabel.value = `${modeInfo.label}のロープレを設計中...`
    generationStepText.value = `${i + 1} / ${modeOrder.length}`
    generationProgress.value = (i / modeOrder.length) * 100

    // 親コンポーネントに個別のプロンプト生成を依頼（設定を含む）
    const settings: PromptGenSettings = {
      speakingStyle: selectedSpeakingStyle.value as 'friendly' | 'polite' | 'strict',
      maxTurnCount: maxTurnCount.value,
      endOnCall: endOnCall.value
    }
    emit('generate-single-prompt', modeKey, modeInfo.label, modeInfo.metaPrompt, settings)

    // 生成が完了するまで待機（親からの通知を待つ）
    await waitForPromptGeneration()
  }

  generationProgress.value = 100
  generatingModeLabel.value = '完了しました'
  generationStepText.value = ''

  // 少し待ってから閉じる
  await new Promise(resolve => setTimeout(resolve, 500))
  isGeneratingPrompts.value = false
}

// プロンプト生成完了を待つ
let resolveGeneration: (() => void) | null = null
const waitForPromptGeneration = () => {
  return new Promise<void>(resolve => {
    resolveGeneration = resolve
  })
}

// 親コンポーネントから呼ばれる生成完了通知
const notifyPromptGenerated = () => {
  if (resolveGeneration) {
    resolveGeneration()
    resolveGeneration = null
  }
}

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

// 話者ラベルを取得（台本は常に営業vsお客様形式）
const getSpeakerLabel = (speaker: 'self' | 'opponent' | 'narrator') => {
  if (speaker === 'self') {
    return 'あなた'
  }
  if (speaker === 'narrator') {
    return 'ナレーター'
  }
  return 'お客様'
}

// フィルタリングされたポイント（ローカルデータを使用）
const filteredPoints = computed(() => {
  return localPoints.value
})

// キャラクター選択処理
const selectCharacter = (character: Character) => {
  selectedCharacterId.value = character.id
  emit('character-selected', character)
}


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
  characters,
  notifyPromptGenerated
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

/* ポイントヘッダー（Q + 編集ボタン） */
.point-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.point-q-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  font-size: 12px;
  font-weight: 700;
  border-radius: 6px;
  flex-shrink: 0;
}

.point-edit-btn {
  margin-left: auto;
  opacity: 0.5;
  transition: opacity 0.15s;
}

.point-card:hover .point-edit-btn {
  opacity: 1;
}

.point-save-btn {
  margin-left: auto;
}

/* ポイントセクション（問/正解基準/正答例） */
.point-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
}

.point-section:last-child {
  border-bottom: none;
}

.point-section-label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  padding: 2px 6px;
  background: #f1f5f9;
  border-radius: 4px;
  width: fit-content;
}

.point-section-value {
  font-size: 13px;
  color: #334155;
  line-height: 1.6;
  white-space: pre-wrap;
}

.point-answer-value {
  color: #475569;
  font-style: italic;
}

/* ポイント編集用テキストエリア */
.point-edit-textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;
  background: white;
  color: #334155;
  font-family: inherit;
}

.point-edit-textarea:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* Script Tab */
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

/* 確認ダイアログ */
.confirm-dialog-text {
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
  margin: 0;
}

.confirm-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* プログレスバー */
.generation-progress {
  width: 200px;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 16px;
}

.generation-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.generation-step-text {
  margin-top: 8px;
  font-size: 12px;
  color: #9ca3af;
}

/* プロンプト生成ダイアログ */
.prompt-gen-dialog {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.prompt-gen-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.prompt-gen-section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

/* モード別タブ */
.prompt-gen-mode-tabs {
  display: flex;
  gap: 4px;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 8px;
}

.prompt-gen-mode-tab {
  flex: 1;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.prompt-gen-mode-tab:hover {
  color: #475569;
  background: rgba(255, 255, 255, 0.5);
}

.prompt-gen-mode-tab.active {
  color: #1e293b;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* モード説明エリア（タブ直下） */
.prompt-gen-mode-description-area {
  margin-top: 12px;
  margin-bottom: 16px;
}

.prompt-gen-mode-desc {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 12px 16px;
}

.prompt-gen-mode-desc p {
  margin: 0;
  font-size: 13px;
  color: #0369a1;
  line-height: 1.6;
}

/* 共通設定セクション */
.prompt-gen-common-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.prompt-gen-common-title {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.prompt-gen-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.prompt-gen-field-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

/* ボタングループ（話し方選択） */
.prompt-gen-btn-group {
  display: flex;
  gap: 8px;
}

.prompt-gen-toggle-btn {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.prompt-gen-toggle-btn:hover {
  border-color: #cbd5e1;
  color: #475569;
}

.prompt-gen-toggle-btn.active {
  color: #6366f1;
  background: #eef2ff;
  border-color: #6366f1;
}

/* チェックボックス */
.prompt-gen-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.prompt-gen-checkbox-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.prompt-gen-checkbox-row-with-tooltip {
  position: relative;
}

.prompt-gen-tooltip {
  position: absolute;
  left: 0;
  top: 100%;
  margin-top: 4px;
  background: #1f2937;
  color: #fff;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  white-space: nowrap;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.prompt-gen-tooltip::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 16px;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid #1f2937;
}

.prompt-gen-tooltip-close {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.prompt-gen-tooltip-close:hover {
  color: #fff;
}

.prompt-gen-checkbox {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  accent-color: #6366f1;
  cursor: pointer;
}

.prompt-gen-checkbox:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.prompt-gen-checkbox-label {
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
  cursor: pointer;
}

.prompt-gen-turn-input-wrapper {
  color: #64748b;
}

.prompt-gen-turn-input {
  width: 60px;
  padding: 4px 8px;
  font-size: 13px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  text-align: center;
  margin: 0 4px;
}

.prompt-gen-turn-input:focus {
  outline: none;
  border-color: #6366f1;
}

/* 不正解時の反応（ラジオボタン） */
.prompt-gen-radio-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.prompt-gen-radio-label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
  cursor: pointer;
}

.prompt-gen-radio {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  accent-color: #6366f1;
  cursor: pointer;
  flex-shrink: 0;
}

.prompt-gen-field-note {
  font-size: 12px;
  color: #9ca3af;
  font-weight: normal;
}

/* モード別コンテンツ */
.prompt-gen-mode-content {
  min-height: 60px;
}

.prompt-gen-mode-pane {
  padding: 12px 0;
}

.prompt-gen-mode-description {
  font-size: 14px;
  color: #475569;
  line-height: 1.7;
}

.prompt-gen-mode-description p {
  margin: 0 0 8px 0;
}

.prompt-gen-mode-description p:last-child {
  margin-bottom: 0;
}

.prompt-gen-coming-soon {
  color: #9ca3af;
  font-style: italic;
}

/* 警告メッセージ */
.prompt-gen-warning {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  font-size: 14px;
  color: #92400e;
}

.prompt-gen-warning-icon {
  font-size: 18px;
  color: #f59e0b;
  flex-shrink: 0;
}

/* ポイント横並びレイアウト */
.point-question-text {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  line-height: 1.5;
}

.point-question-edit {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
  resize: none;
  min-height: 24px;
}

.point-question-edit:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.point-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid #f1f5f9;
}

.point-row:last-child {
  border-bottom: none;
}

.point-row-label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  padding: 2px 6px;
  background: #f1f5f9;
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
}

.point-row-value {
  flex: 1;
  font-size: 13px;
  color: #334155;
  line-height: 1.5;
}

.point-row-edit {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
  resize: none;
  min-height: 24px;
}

.point-row-edit:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}
</style>
