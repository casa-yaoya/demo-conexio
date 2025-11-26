<template>
  <div class="data-filter" :class="{ collapsed: !isFilterPanelOpen }">
    <!-- フィルターヘッダー -->
    <div class="filter-header" @click="toggleFilterPanel">
      <UIcon name="i-lucide-filter" class="filter-header-icon" />
      <h2 class="filter-title">フィルター</h2>
      <UIcon
        :name="isFilterPanelOpen ? 'i-lucide-chevron-left' : 'i-lucide-chevron-right'"
        class="filter-toggle-icon"
      />
    </div>

    <div v-show="isFilterPanelOpen" class="filter-body">
      <!-- 期間絞り込み（常に開いている） -->
      <div class="filter-section filter-section-primary">
        <div class="filter-section-header-static">
          <UIcon name="i-lucide-calendar" class="filter-section-icon-static" />
          <span class="filter-section-title">期間絞り込み</span>
        </div>
        <div class="filter-section-content">
          <div class="period-filter">
            <div class="period-row">
              <label class="period-label">開始日</label>
              <UInput type="date" v-model="internalDateFrom" size="sm" class="flex-1" />
            </div>
            <div class="period-row">
              <label class="period-label">終了日</label>
              <UInput type="date" v-model="internalDateTo" size="sm" class="flex-1" />
            </div>
          </div>
        </div>
      </div>

      <!-- レッスンで絞り込み -->
      <div class="filter-section">
        <div class="filter-section-header" @click="toggleSection('lesson')">
          <UIcon
            :name="expandedSections.lesson ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
            class="filter-section-icon"
          />
          <span class="filter-section-title">レッスンで絞り込み</span>
          <span class="filter-count" v-if="getSelectedLessonCount > 0">{{ getSelectedLessonCount }}件</span>
        </div>
        <div v-show="expandedSections.lesson" class="filter-section-content">
          <!-- カテゴリー -->
          <div v-for="category in filterOptions.categories" :key="category" class="filter-group">
            <div class="filter-group-header" @click="toggleCategoryExpand(category)">
              <UCheckbox
                :model-value="isCategoryFullySelected(category)"
                :indeterminate="isCategoryPartiallySelected(category)"
                @update:model-value="toggleCategory(category)"
                @click.stop
              />
              <span class="filter-group-name">{{ category }}</span>
              <UIcon
                :name="expandedCategories[category] ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                class="filter-expand-icon"
              />
            </div>
            <!-- レベル -->
            <div v-show="expandedCategories[category]" class="filter-subgroup">
              <div v-for="level in (filterOptions.levels[category] || [])" :key="`${category}-${level}`" class="filter-level-item">
                <div class="filter-level-header" @click="toggleLevelExpand(category, level)">
                  <UCheckbox
                    :model-value="isLevelFullySelected(category, level)"
                    :indeterminate="isLevelPartiallySelected(category, level)"
                    @update:model-value="toggleLevel(category, level)"
                    @click.stop
                  />
                  <span class="filter-level-name">Lv.{{ level }}</span>
                  <UIcon
                    :name="expandedLevels[`${category}|${level}`] ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                    class="filter-expand-icon"
                  />
                </div>
                <!-- レッスン -->
                <div v-show="expandedLevels[`${category}|${level}`]" class="filter-lessons">
                  <div
                    v-for="lesson in (filterOptions.lessons[`${category}|${level}`] || [])"
                    :key="lesson"
                    class="filter-lesson-item"
                  >
                    <UCheckbox
                      :model-value="selectedLessons.has(lesson)"
                      @update:model-value="toggleLesson(lesson)"
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
          <UIcon
            :name="expandedSections.level ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
            class="filter-section-icon"
          />
          <span class="filter-section-title">レベルで絞り込み</span>
        </div>
        <div v-show="expandedSections.level" class="filter-section-content">
          <div class="level-filter-options">
            <label v-for="level in availableLevels" :key="level" class="level-filter-item">
              <UCheckbox
                :model-value="selectedFilterLevels.has(level)"
                @update:model-value="toggleFilterLevel(level)"
              />
              <span class="level-filter-name">Lv.{{ level }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- プレイヤー絞り込み -->
      <div class="filter-section">
        <div class="filter-section-header" @click="toggleSection('player')">
          <UIcon
            :name="expandedSections.player ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
            class="filter-section-icon"
          />
          <span class="filter-section-title">プレイヤー絞り込み</span>
          <span class="filter-count" v-if="selectedPlayers.size < allPlayersCount">{{ selectedPlayers.size }}名</span>
        </div>
        <div v-show="expandedSections.player" class="filter-section-content">
          <!-- Account -->
          <div v-for="account in filterOptions.accounts" :key="account" class="filter-group">
            <div class="filter-group-header" @click="toggleAccountExpand(account)">
              <UCheckbox
                :model-value="isAccountFullySelected(account)"
                :indeterminate="isAccountPartiallySelected(account)"
                @update:model-value="toggleAccount(account)"
                @click.stop
              />
              <span class="filter-group-name">{{ account }}</span>
              <UIcon
                :name="expandedAccounts[account] ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                class="filter-expand-icon"
              />
            </div>
            <!-- Group -->
            <div v-show="expandedAccounts[account]" class="filter-subgroup">
              <div v-for="group in (filterOptions.accountGroups[account] || [])" :key="`${account}-${group}`" class="filter-level-item">
                <div class="filter-level-header" @click="toggleGroupExpand(account, group)">
                  <UCheckbox
                    :model-value="isGroupFullySelected(account, group)"
                    :indeterminate="isGroupPartiallySelected(account, group)"
                    @update:model-value="toggleGroup(account, group)"
                    @click.stop
                  />
                  <span class="filter-level-name">{{ group }}</span>
                  <UIcon
                    :name="expandedGroups[`${account}|${group}`] ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                    class="filter-expand-icon"
                  />
                </div>
                <!-- Player -->
                <div v-show="expandedGroups[`${account}|${group}`]" class="filter-lessons">
                  <div
                    v-for="player in (filterOptions.groupPlayers[`${account}|${group}`] || [])"
                    :key="player"
                    class="filter-player-item"
                  >
                    <UCheckbox
                      :model-value="selectedPlayers.has(player)"
                      @update:model-value="togglePlayer(player)"
                    />
                    <span class="filter-player-name">{{ player }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- リセットボタン -->
      <UButton
        variant="outline"
        color="neutral"
        block
        class="reset-button"
        @click="clearFilters"
      >
        <UIcon name="i-lucide-rotate-ccw" class="mr-2" />
        フィルターをリセット
      </UButton>
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

/* フィルターヘッダー */
.filter-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e2e8f0;
}

.filter-header:hover {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
}

.filter-header-icon {
  font-size: 18px;
  color: #0ea5e9;
}

.filter-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  flex: 1;
}

.filter-toggle-icon {
  font-size: 16px;
  color: #64748b;
}

/* 折りたたみ時のスタイル */
.data-filter.collapsed .filter-header {
  margin-bottom: 0;
}

.data-filter.collapsed .filter-title,
.data-filter.collapsed .filter-toggle-icon {
  display: none;
}

.filter-body {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* フィルターセクション */
.filter-section {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  margin-bottom: 12px;
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.filter-section:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.filter-section-primary {
  border-color: #0ea5e9;
  border-width: 1px;
  border-left-width: 4px;
}

.filter-section-header {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: #f8fafc;
  cursor: pointer;
  transition: background 0.2s;
  gap: 10px;
}

.filter-section-header:hover {
  background: #f1f5f9;
}

.filter-section-header-static {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  gap: 10px;
}

.filter-section-icon {
  font-size: 14px;
  color: #64748b;
  width: 16px;
  flex-shrink: 0;
}

.filter-section-icon-static {
  font-size: 16px;
  color: #0ea5e9;
}

.filter-section-title {
  flex: 1;
  font-weight: 600;
  font-size: 13px;
  color: #334155;
}

.filter-count {
  font-size: 11px;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  padding: 3px 10px;
  border-radius: 12px;
}

.filter-section-content {
  padding: 16px;
  border-top: 1px solid #e2e8f0;
  max-height: 400px;
  overflow-y: auto;
}

.filter-section-primary .filter-section-content {
  border-top-color: #bae6fd;
}

/* フィルターグループ */
.filter-group {
  margin-bottom: 10px;
}

.filter-group:last-child {
  margin-bottom: 0;
}

.filter-group-header {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
  gap: 10px;
  cursor: pointer;
  transition: background 0.2s;
}

.filter-group-header:hover {
  background: #f1f5f9;
}

.filter-group-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: #334155;
}

.filter-expand-icon {
  font-size: 12px;
  color: #94a3b8;
  flex-shrink: 0;
}

/* サブグループ */
.filter-subgroup {
  padding-left: 20px;
  padding-top: 8px;
}

.filter-level-item {
  margin-bottom: 8px;
}

.filter-level-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f1f5f9;
  border-radius: 6px;
  gap: 10px;
  cursor: pointer;
  transition: background 0.2s;
}

.filter-level-header:hover {
  background: #e2e8f0;
}

.filter-level-name {
  flex: 1;
  font-size: 12px;
  font-weight: 500;
  color: #475569;
}

/* レッスン一覧 */
.filter-lessons {
  padding-left: 20px;
  padding-top: 8px;
}

.filter-lesson-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  margin-bottom: 4px;
  border-radius: 4px;
  transition: background 0.15s;
}

.filter-lesson-item:hover {
  background: #f8fafc;
}

.filter-lesson-name {
  font-size: 12px;
  color: #475569;
}

/* プレイヤー一覧 */
.filter-player-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  margin-bottom: 4px;
  border-radius: 4px;
  transition: background 0.15s;
}

.filter-player-item:hover {
  background: #f8fafc;
}

.filter-player-name {
  font-size: 12px;
  color: #475569;
}

/* レベルフィルター */
.level-filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.level-filter-item {
  display: flex;
  align-items: center;
  padding: 8px 14px;
  background: #f8fafc;
  border-radius: 8px;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e2e8f0;
}

.level-filter-item:hover {
  border-color: #0ea5e9;
  background: #f0f9ff;
}

.level-filter-name {
  font-size: 13px;
  font-weight: 500;
  color: #334155;
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
  font-weight: 500;
  color: #64748b;
  width: 50px;
  flex-shrink: 0;
}

/* リセットボタン */
.reset-button {
  margin-top: 8px;
}

/* スクロールバー */
.filter-section-content::-webkit-scrollbar {
  width: 6px;
}

.filter-section-content::-webkit-scrollbar-track {
  background: #f8fafc;
  border-radius: 3px;
}

.filter-section-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.filter-section-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
