<template>
  <div class="data-filter" :class="{ collapsed: !isFilterPanelOpen }">
    <div class="filter-header" @click="toggleFilterPanel">
      <span class="filter-icon">🔍</span>
      <h2 class="filter-title">フィルター</h2>
      <span class="filter-toggle-icon">{{ isFilterPanelOpen ? '◀' : '▶' }}</span>
    </div>

    <div v-show="isFilterPanelOpen" class="filter-body">
    <!-- 期間絞り込み（常に開いている） -->
    <div class="filter-section filter-section-always-open">
      <div class="filter-section-header-static">
        <span class="filter-section-title">期間絞り込み</span>
      </div>
      <div class="filter-section-content">
        <div class="period-filter">
          <div class="period-row">
            <label class="period-label">開始日</label>
            <input type="date" class="period-input" v-model="internalDateFrom" />
          </div>
          <div class="period-row">
            <label class="period-label">終了日</label>
            <input type="date" class="period-input" v-model="internalDateTo" />
          </div>
        </div>
      </div>
    </div>

    <!-- レッスンで絞り込み -->
    <div class="filter-section">
      <div class="filter-section-header" @click="toggleSection('lesson')">
        <span class="filter-section-icon">{{ expandedSections.lesson ? '▼' : '▶' }}</span>
        <span class="filter-section-title">レッスンで絞り込み</span>
        <span class="filter-count" v-if="getSelectedLessonCount > 0">{{ getSelectedLessonCount }}件</span>
      </div>
      <div v-show="expandedSections.lesson" class="filter-section-content">
        <!-- カテゴリー -->
        <div v-for="category in filterOptions.categories" :key="category" class="filter-group">
          <div class="filter-group-header" @click="toggleCategoryExpand(category)">
            <input
              type="checkbox"
              :checked="isCategoryFullySelected(category)"
              :indeterminate="isCategoryPartiallySelected(category)"
              @change="toggleCategory(category)"
              @click.stop
              class="filter-checkbox"
            />
            <span class="filter-group-name">{{ category }}</span>
            <span class="filter-expand-icon">{{ expandedCategories[category] ? '▲' : '▼' }}</span>
          </div>
          <!-- レベル -->
          <div v-show="expandedCategories[category]" class="filter-subgroup">
            <div v-for="level in (filterOptions.levels[category] || [])" :key="`${category}-${level}`" class="filter-level-item">
              <div class="filter-level-header" @click="toggleLevelExpand(category, level)">
                <input
                  type="checkbox"
                  :checked="isLevelFullySelected(category, level)"
                  :indeterminate="isLevelPartiallySelected(category, level)"
                  @change="toggleLevel(category, level)"
                  @click.stop
                  class="filter-checkbox"
                />
                <span class="filter-level-name">Lv.{{ level }}</span>
                <span class="filter-expand-icon">{{ expandedLevels[`${category}|${level}`] ? '▲' : '▼' }}</span>
              </div>
              <!-- レッスン -->
              <div v-show="expandedLevels[`${category}|${level}`]" class="filter-lessons">
                <div
                  v-for="lesson in (filterOptions.lessons[`${category}|${level}`] || [])"
                  :key="lesson"
                  class="filter-lesson-item"
                >
                  <input
                    type="checkbox"
                    :checked="selectedLessons.has(lesson)"
                    @change="toggleLesson(lesson)"
                    class="filter-checkbox"
                  />
                  <span class="filter-lesson-name">{{ lesson }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- レベルで絞り込み -->
    <div class="filter-section">
      <div class="filter-section-header" @click="toggleSection('level')">
        <span class="filter-section-icon">{{ expandedSections.level ? '▼' : '▶' }}</span>
        <span class="filter-section-title">レベルで絞り込み</span>
      </div>
      <div v-show="expandedSections.level" class="filter-section-content">
        <div class="level-filter-options">
          <label v-for="level in availableLevels" :key="level" class="filter-checkbox-label level-filter-item">
            <input
              type="checkbox"
              :checked="selectedFilterLevels.has(level)"
              @change="toggleFilterLevel(level)"
              class="filter-checkbox"
            />
            <span class="level-filter-name">Lv.{{ level }}</span>
          </label>
        </div>
      </div>
    </div>

    <!-- プレイヤー絞り込み -->
    <div class="filter-section">
      <div class="filter-section-header" @click="toggleSection('player')">
        <span class="filter-section-icon">{{ expandedSections.player ? '▼' : '▶' }}</span>
        <span class="filter-section-title">プレイヤー絞り込み</span>
        <span class="filter-count" v-if="selectedPlayers.size < allPlayersCount">{{ selectedPlayers.size }}名</span>
      </div>
      <div v-show="expandedSections.player" class="filter-section-content">
        <!-- Account -->
        <div v-for="account in filterOptions.accounts" :key="account" class="filter-group">
          <div class="filter-group-header" @click="toggleAccountExpand(account)">
            <input
              type="checkbox"
              :checked="isAccountFullySelected(account)"
              :indeterminate="isAccountPartiallySelected(account)"
              @change="toggleAccount(account)"
              @click.stop
              class="filter-checkbox"
            />
            <span class="filter-group-name">{{ account }}</span>
            <span class="filter-expand-icon">{{ expandedAccounts[account] ? '▲' : '▼' }}</span>
          </div>
          <!-- Group -->
          <div v-show="expandedAccounts[account]" class="filter-subgroup">
            <div v-for="group in (filterOptions.accountGroups[account] || [])" :key="`${account}-${group}`" class="filter-level-item">
              <div class="filter-level-header" @click="toggleGroupExpand(account, group)">
                <input
                  type="checkbox"
                  :checked="isGroupFullySelected(account, group)"
                  :indeterminate="isGroupPartiallySelected(account, group)"
                  @change="toggleGroup(account, group)"
                  @click.stop
                  class="filter-checkbox"
                />
                <span class="filter-level-name">{{ group }}</span>
                <span class="filter-expand-icon">{{ expandedGroups[`${account}|${group}`] ? '▲' : '▼' }}</span>
              </div>
              <!-- Player -->
              <div v-show="expandedGroups[`${account}|${group}`]" class="filter-lessons">
                <div
                  v-for="player in (filterOptions.groupPlayers[`${account}|${group}`] || [])"
                  :key="player"
                  class="filter-player-item"
                >
                  <input
                    type="checkbox"
                    :checked="selectedPlayers.has(player)"
                    @change="togglePlayer(player)"
                    class="filter-checkbox"
                  />
                  <span class="filter-player-name">{{ player }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 全選択ボタン -->
    <button class="filter-clear-button" @click="clearFilters">
      全選択
    </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  filterOptions: {
    categories: string[]
    levels: Record<string, string[]>
    lessons: Record<string, string[]>
    players: string[]
    accounts: string[]
    groups: string[]
    accountGroups: Record<string, string[]>
    groupPlayers: Record<string, string[]>
  }
}>()

const emit = defineEmits<{
  (e: 'update:filters', filters: {
    lessons?: string[]
    levels?: string[]
    players?: string[]
    dateFrom: Date | null
    dateTo: Date | null
  }): void
  (e: 'update:collapsed', collapsed: boolean): void
}>()

// フィルターパネル全体の開閉状態
const isFilterPanelOpen = ref(true)

const toggleFilterPanel = () => {
  isFilterPanelOpen.value = !isFilterPanelOpen.value
  emit('update:collapsed', !isFilterPanelOpen.value)
}

// セクション展開状態
const expandedSections = reactive({
  lesson: false,
  level: false,
  player: false
})

// カテゴリー・レベル・アカウント・グループの展開状態
const expandedCategories = reactive<Record<string, boolean>>({})
const expandedLevels = reactive<Record<string, boolean>>({})
const expandedAccounts = reactive<Record<string, boolean>>({})
const expandedGroups = reactive<Record<string, boolean>>({})

// 選択状態（Setで管理）
const selectedLessons = ref<Set<string>>(new Set())
const selectedPlayers = ref<Set<string>>(new Set())
const selectedFilterLevels = ref<Set<string>>(new Set(['1', '2', '3', '4']))

// 期間
const internalDateFrom = ref('')
const internalDateTo = ref('')

// 全レッスン数
const allLessonsCount = computed(() => {
  let count = 0
  const lessons = props.filterOptions.lessons || {}
  for (const key in lessons) {
    count += lessons[key].length
  }
  return count
})

// 全プレイヤー数
const allPlayersCount = computed(() => {
  return props.filterOptions.players?.length || 0
})

// 選択されたレッスン数（表示用）
const getSelectedLessonCount = computed(() => {
  if (selectedLessons.value.size === 0 || selectedLessons.value.size === allLessonsCount.value) {
    return 0
  }
  return selectedLessons.value.size
})

// 利用可能なレベル一覧（固定で1〜4）
const availableLevels = computed(() => {
  return ['1', '2', '3', '4']
})

// 期間ラベル
const dateFrom = computed(() => internalDateFrom.value)
const dateTo = computed(() => internalDateTo.value)

const formatPeriodLabel = computed(() => {
  const from = internalDateFrom.value
  const to = internalDateTo.value
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-')
    return `${year}/${month}/${day}`
  }
  if (from && to) {
    return `${formatDate(from)} 〜 ${formatDate(to)}`
  } else if (from) {
    return `${formatDate(from)} 〜`
  } else if (to) {
    return `〜 ${formatDate(to)}`
  }
  return ''
})

// === セクション展開 ===
const toggleSection = (section: 'lesson' | 'level' | 'player') => {
  expandedSections[section] = !expandedSections[section]
}

// === カテゴリー関連 ===
const toggleCategoryExpand = (category: string) => {
  expandedCategories[category] = !expandedCategories[category]
}

const isCategoryFullySelected = (category: string) => {
  const levels = props.filterOptions.levels[category] || []
  for (const level of levels) {
    const lessons = props.filterOptions.lessons[`${category}|${level}`] || []
    for (const lesson of lessons) {
      if (!selectedLessons.value.has(lesson)) return false
    }
  }
  return true
}

const isCategoryPartiallySelected = (category: string) => {
  const levels = props.filterOptions.levels[category] || []
  let hasSelected = false
  let hasUnselected = false
  for (const level of levels) {
    const lessons = props.filterOptions.lessons[`${category}|${level}`] || []
    for (const lesson of lessons) {
      if (selectedLessons.value.has(lesson)) {
        hasSelected = true
      } else {
        hasUnselected = true
      }
    }
  }
  return hasSelected && hasUnselected
}

const toggleCategory = (category: string) => {
  const isFullySelected = isCategoryFullySelected(category)
  const levels = props.filterOptions.levels[category] || []

  for (const level of levels) {
    const lessons = props.filterOptions.lessons[`${category}|${level}`] || []
    for (const lesson of lessons) {
      if (isFullySelected) {
        selectedLessons.value.delete(lesson)
      } else {
        selectedLessons.value.add(lesson)
      }
    }
  }
  selectedLessons.value = new Set(selectedLessons.value)
  emitFilters()
}

// === レベル関連 ===
const toggleLevelExpand = (category: string, level: string) => {
  const key = `${category}|${level}`
  expandedLevels[key] = !expandedLevels[key]
}

const isLevelFullySelected = (category: string, level: string) => {
  const lessons = props.filterOptions.lessons[`${category}|${level}`] || []
  for (const lesson of lessons) {
    if (!selectedLessons.value.has(lesson)) return false
  }
  return lessons.length > 0
}

const isLevelPartiallySelected = (category: string, level: string) => {
  const lessons = props.filterOptions.lessons[`${category}|${level}`] || []
  let hasSelected = false
  let hasUnselected = false
  for (const lesson of lessons) {
    if (selectedLessons.value.has(lesson)) {
      hasSelected = true
    } else {
      hasUnselected = true
    }
  }
  return hasSelected && hasUnselected
}

const toggleLevel = (category: string, level: string) => {
  const isFullySelected = isLevelFullySelected(category, level)
  const lessons = props.filterOptions.lessons[`${category}|${level}`] || []

  for (const lesson of lessons) {
    if (isFullySelected) {
      selectedLessons.value.delete(lesson)
    } else {
      selectedLessons.value.add(lesson)
    }
  }
  selectedLessons.value = new Set(selectedLessons.value)
  emitFilters()
}

// === レッスン関連 ===
const toggleLesson = (lesson: string) => {
  if (selectedLessons.value.has(lesson)) {
    selectedLessons.value.delete(lesson)
  } else {
    selectedLessons.value.add(lesson)
  }
  selectedLessons.value = new Set(selectedLessons.value)
  emitFilters()
}

// === レベルフィルター操作 ===
const toggleFilterLevel = (level: string) => {
  if (selectedFilterLevels.value.has(level)) {
    selectedFilterLevels.value.delete(level)
  } else {
    selectedFilterLevels.value.add(level)
  }
  selectedFilterLevels.value = new Set(selectedFilterLevels.value)
  emitFilters()
}

// === アカウント関連 ===
const toggleAccountExpand = (account: string) => {
  expandedAccounts[account] = !expandedAccounts[account]
}

const isAccountFullySelected = (account: string) => {
  const groups = props.filterOptions.accountGroups?.[account] || []
  for (const group of groups) {
    const players = props.filterOptions.groupPlayers?.[`${account}|${group}`] || []
    for (const player of players) {
      if (!selectedPlayers.value.has(player)) return false
    }
  }
  return true
}

const isAccountPartiallySelected = (account: string) => {
  const groups = props.filterOptions.accountGroups?.[account] || []
  let hasSelected = false
  let hasUnselected = false
  for (const group of groups) {
    const players = props.filterOptions.groupPlayers?.[`${account}|${group}`] || []
    for (const player of players) {
      if (selectedPlayers.value.has(player)) {
        hasSelected = true
      } else {
        hasUnselected = true
      }
    }
  }
  return hasSelected && hasUnselected
}

const toggleAccount = (account: string) => {
  const isFullySelected = isAccountFullySelected(account)
  const groups = props.filterOptions.accountGroups?.[account] || []

  for (const group of groups) {
    const players = props.filterOptions.groupPlayers?.[`${account}|${group}`] || []
    for (const player of players) {
      if (isFullySelected) {
        selectedPlayers.value.delete(player)
      } else {
        selectedPlayers.value.add(player)
      }
    }
  }
  selectedPlayers.value = new Set(selectedPlayers.value)
  emitFilters()
}

// === グループ関連 ===
const toggleGroupExpand = (account: string, group: string) => {
  const key = `${account}|${group}`
  expandedGroups[key] = !expandedGroups[key]
}

const isGroupFullySelected = (account: string, group: string) => {
  const players = props.filterOptions.groupPlayers?.[`${account}|${group}`] || []
  for (const player of players) {
    if (!selectedPlayers.value.has(player)) return false
  }
  return players.length > 0
}

const isGroupPartiallySelected = (account: string, group: string) => {
  const players = props.filterOptions.groupPlayers?.[`${account}|${group}`] || []
  let hasSelected = false
  let hasUnselected = false
  for (const player of players) {
    if (selectedPlayers.value.has(player)) {
      hasSelected = true
    } else {
      hasUnselected = true
    }
  }
  return hasSelected && hasUnselected
}

const toggleGroup = (account: string, group: string) => {
  const isFullySelected = isGroupFullySelected(account, group)
  const players = props.filterOptions.groupPlayers?.[`${account}|${group}`] || []

  for (const player of players) {
    if (isFullySelected) {
      selectedPlayers.value.delete(player)
    } else {
      selectedPlayers.value.add(player)
    }
  }
  selectedPlayers.value = new Set(selectedPlayers.value)
  emitFilters()
}

// === プレイヤー関連 ===
const togglePlayer = (player: string) => {
  if (selectedPlayers.value.has(player)) {
    selectedPlayers.value.delete(player)
  } else {
    selectedPlayers.value.add(player)
  }
  selectedPlayers.value = new Set(selectedPlayers.value)
  emitFilters()
}

// === フィルターをemit ===
const emitFilters = () => {
  const isAllLessonsSelected = selectedLessons.value.size === allLessonsCount.value
  const isAllPlayersSelected = selectedPlayers.value.size === allPlayersCount.value
  const isAllLevelsSelected = selectedFilterLevels.value.size === 4

  emit('update:filters', {
    lessons: isAllLessonsSelected ? undefined : Array.from(selectedLessons.value),
    levels: isAllLevelsSelected ? undefined : Array.from(selectedFilterLevels.value),
    players: isAllPlayersSelected ? undefined : Array.from(selectedPlayers.value),
    dateFrom: internalDateFrom.value ? new Date(internalDateFrom.value) : null,
    dateTo: internalDateTo.value ? new Date(internalDateTo.value) : null
  })
}

// === 初期化 ===
const initializeDefaults = () => {
  // 全レッスンを選択
  const lessons = props.filterOptions.lessons || {}
  const allLessons = new Set<string>()
  for (const key in lessons) {
    for (const lesson of lessons[key]) {
      allLessons.add(lesson)
    }
  }
  selectedLessons.value = allLessons

  // 全プレイヤーを選択
  const allPlayers = new Set(props.filterOptions.players || [])
  selectedPlayers.value = allPlayers

  // 全レベルを選択
  selectedFilterLevels.value = new Set(['1', '2', '3', '4'])

  // 期間：現在から過去6ヶ月
  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  internalDateTo.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  internalDateFrom.value = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`

  emitFilters()
}

// === フィルタークリア ===
const clearFilters = () => {
  initializeDefaults()
}

// 期間の変更を監視
watch([internalDateFrom, internalDateTo], () => {
  emitFilters()
})

// filterOptionsが変更されたら初期化
watch(
  () => props.filterOptions.categories?.length,
  (newVal) => {
    if (newVal && newVal > 0) {
      initializeDefaults()
    }
  },
  { immediate: true }
)

// 外部から初期化を呼び出せるように公開
defineExpose({
  initializeDefaults
})
</script>

<style scoped>
.data-filter {
  padding: 0;
}

.filter-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 12px;
  margin-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
  cursor: pointer;
  transition: opacity 0.2s;
}

.filter-header:hover {
  opacity: 0.8;
}

.filter-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.filter-title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  flex: 1;
}

.filter-toggle-icon {
  font-size: 12px;
  color: #6b7280;
  flex-shrink: 0;
  margin-right: 8px;
}

/* 折りたたみ時のスタイル */
.data-filter.collapsed .filter-header {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.data-filter.collapsed .filter-title,
.data-filter.collapsed .filter-toggle-icon {
  display: none;
}

.filter-body {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* フィルターセクション */
.filter-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
}

.filter-section-header {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  background: #f9fafb;
  cursor: pointer;
  transition: background 0.2s;
  gap: 8px;
}

.filter-section-header:hover {
  background: #f3f4f6;
}

.filter-section-always-open {
  border-color: #3b82f6;
}

.filter-section-header-static {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  background: #eff6ff;
  gap: 8px;
}

.filter-section-always-open .filter-section-content {
  border-top: 1px solid #bfdbfe;
}

.filter-section-icon {
  font-size: 10px;
  color: #6b7280;
  width: 12px;
}

.filter-section-title {
  flex: 1;
  font-weight: 600;
  font-size: 13px;
  color: #374151;
}

.filter-count {
  font-size: 11px;
  color: #3b82f6;
  background: #dbeafe;
  padding: 2px 8px;
  border-radius: 10px;
}

.filter-period-label {
  font-size: 11px;
  color: #6b7280;
}

.filter-section-content {
  padding: 12px;
  border-top: 1px solid #e5e7eb;
  max-height: 400px;
  overflow-y: auto;
}

/* フィルターグループ */
.filter-group {
  margin-bottom: 8px;
}

.filter-group:last-child {
  margin-bottom: 0;
}

.filter-group-header {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  background: #f9fafb;
  border-radius: 6px;
  gap: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.filter-group-header:hover {
  background: #f3f4f6;
}

.filter-group-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.filter-expand-icon {
  font-size: 10px;
  color: #9ca3af;
  flex-shrink: 0;
}

/* サブグループ */
.filter-subgroup {
  padding-left: 16px;
  padding-top: 8px;
}

.filter-level-item {
  margin-bottom: 6px;
}

.filter-level-header {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  background: #f3f4f6;
  border-radius: 4px;
  gap: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.filter-level-header:hover {
  background: #e5e7eb;
}

.filter-level-name {
  flex: 1;
  font-size: 12px;
  font-weight: 500;
  color: #4b5563;
}

/* レッスン一覧 */
.filter-lessons {
  padding-left: 16px;
  padding-top: 6px;
}

.filter-lesson-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  margin-bottom: 2px;
}

.filter-lesson-name {
  font-size: 12px;
  color: #4b5563;
}

/* プレイヤー一覧 */
.filter-player-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  margin-bottom: 2px;
}

.filter-player-name {
  font-size: 12px;
  color: #4b5563;
}

/* チェックボックス */
.filter-checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex: 1;
}

.filter-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #3b82f6;
  cursor: pointer;
  flex-shrink: 0;
}

/* レベルフィルター */
.level-filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.level-filter-item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  background: #f9fafb;
  border-radius: 6px;
  gap: 8px;
}

.level-filter-name {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

/* 期間フィルター */
.period-filter {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.period-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.period-label {
  font-size: 12px;
  color: #6b7280;
  width: 50px;
  flex-shrink: 0;
}

.period-input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  background: white;
}

.period-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* フィルタークリアボタン */
.filter-clear-button {
  width: 100%;
  padding: 10px 16px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-clear-button:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
  color: #374151;
}

/* スクロールバー */
.filter-section-content::-webkit-scrollbar {
  width: 6px;
}

.filter-section-content::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 3px;
}

.filter-section-content::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.filter-section-content::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
