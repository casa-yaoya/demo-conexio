<template>
  <div class="p-5">
    <div class="summary-container" :class="{ 'filter-collapsed': isFilterCollapsed }">
      <!-- Left Filters -->
      <div class="summary-filters">
        <div class="summary-filters-sticky">
          <DataFilter
            :filter-options="filterOptions"
            @update:filters="handleFiltersUpdate"
            @update:collapsed="handleFilterCollapsed"
          />
        </div>
      </div>

      <!-- Right Content -->
      <div class="summary-content">
        <div class="card">
          <div class="table-header">
            <h2 class="text-lg font-semibold text-gray-800">ログ</h2>
            <div class="table-actions">
              <button class="download-button" @click="downloadCSV">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                ダウンロード
              </button>
              <div class="column-settings-container">
                <button class="column-settings-button" @click="toggleColumnSettings">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  列設定
                </button>
                <div v-if="showColumnSettings" class="column-settings-dropdown">
                  <div class="column-settings-title">表示する列</div>
                  <label v-for="col in columnDefinitions" :key="col.key" class="column-settings-item">
                    <input
                      type="checkbox"
                      :checked="visibleColumns[col.key]"
                      @change="toggleColumn(col.key)"
                      class="column-settings-checkbox"
                    />
                    <span>{{ col.label }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th v-if="visibleColumns.date" class="sortable" :class="{ sorted: sortState.column === 'date' }" @click="toggleSort('date')">
                    <span class="th-content">日付<span class="sort-icon">{{ getSortIcon('date') }}</span></span>
                  </th>
                  <th v-if="visibleColumns.org" class="sortable" :class="{ sorted: sortState.column === 'org' }" @click="toggleSort('org')">
                    <span class="th-content">組織<span class="sort-icon">{{ getSortIcon('org') }}</span></span>
                  </th>
                  <th v-if="visibleColumns.account" class="sortable" :class="{ sorted: sortState.column === 'account' }" @click="toggleSort('account')">
                    <span class="th-content">アカウント<span class="sort-icon">{{ getSortIcon('account') }}</span></span>
                  </th>
                  <th v-if="visibleColumns.group" class="sortable" :class="{ sorted: sortState.column === 'group' }" @click="toggleSort('group')">
                    <span class="th-content">グループ<span class="sort-icon">{{ getSortIcon('group') }}</span></span>
                  </th>
                  <th v-if="visibleColumns.player" class="sortable" :class="{ sorted: sortState.column === 'player' }" @click="toggleSort('player')">
                    <span class="th-content">プレイヤー<span class="sort-icon">{{ getSortIcon('player') }}</span></span>
                  </th>
                  <th v-if="visibleColumns.category" class="sortable" :class="{ sorted: sortState.column === 'category' }" @click="toggleSort('category')">
                    <span class="th-content">カテゴリー<span class="sort-icon">{{ getSortIcon('category') }}</span></span>
                  </th>
                  <th v-if="visibleColumns.level" class="sortable" :class="{ sorted: sortState.column === 'level' }" @click="toggleSort('level')">
                    <span class="th-content">レベル<span class="sort-icon">{{ getSortIcon('level') }}</span></span>
                  </th>
                  <th v-if="visibleColumns.lesson" class="sortable" :class="{ sorted: sortState.column === 'lesson' }" @click="toggleSort('lesson')">
                    <span class="th-content">レッスン<span class="sort-icon">{{ getSortIcon('lesson') }}</span></span>
                  </th>
                  <th v-if="visibleColumns.score" class="sortable" :class="{ sorted: sortState.column === 'score' }" @click="toggleSort('score')">
                    <span class="th-content">スコア<span class="sort-icon">{{ getSortIcon('score') }}</span></span>
                  </th>
                  <th v-if="visibleColumns.speechTime" class="sortable" :class="{ sorted: sortState.column === 'speechTime' }" @click="toggleSort('speechTime')">
                    <span class="th-content">発話時間<span class="sort-icon">{{ getSortIcon('speechTime') }}</span></span>
                  </th>
                  <th v-if="visibleColumns.playTime" class="sortable" :class="{ sorted: sortState.column === 'playTime' }" @click="toggleSort('playTime')">
                    <span class="th-content">プレイ時間<span class="sort-icon">{{ getSortIcon('playTime') }}</span></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="sortedData.length === 0">
                  <td :colspan="visibleColumnCount" class="text-center text-gray-600">データがありません</td>
                </tr>
                <tr v-for="(session, index) in sortedData" :key="index">
                  <td v-if="visibleColumns.date">{{ formatDateTime(session.date) }}</td>
                  <td v-if="visibleColumns.org">{{ session.org }}</td>
                  <td v-if="visibleColumns.account">{{ session.account }}</td>
                  <td v-if="visibleColumns.group">{{ session.group }}</td>
                  <td v-if="visibleColumns.player">{{ session.player }}</td>
                  <td v-if="visibleColumns.category">{{ session.category }}</td>
                  <td v-if="visibleColumns.level">Lv.{{ session.level }}</td>
                  <td v-if="visibleColumns.lesson">{{ session.lesson }}</td>
                  <td v-if="visibleColumns.score">{{ session.score }}</td>
                  <td v-if="visibleColumns.speechTime">{{ session.speechTime }}s</td>
                  <td v-if="visibleColumns.playTime">{{ session.playTime }}s</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="flex justify-center items-center gap-2 mt-4">
            <button
              class="pagination-button"
              :disabled="currentPage <= 1"
              @click="changePage(-1)"
            >
              &lt;
            </button>
            <span class="text-sm text-gray-600">ページ {{ currentPage }} / {{ totalPages }}</span>
            <button
              class="pagination-button"
              :disabled="currentPage >= totalPages"
              @click="changePage(1)"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

// デモデータ管理
const { isDataLoaded, loadDemoData, getFilterOptions, getLogData, getFilteredLogData } = useDemoData()

// 現在のフィルター値
const currentFilters = ref<{
  lessons?: string[]
  levels?: string[]
  players?: string[]
  dateFrom: Date | null
  dateTo: Date | null
}>({
  dateFrom: null,
  dateTo: null
})

// フィルターオプション
const filterOptions = computed(() => getFilterOptions())

// ログデータ
const logData = ref<any[]>([])
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = 20

// フィルター折りたたみ状態
const isFilterCollapsed = ref(false)

const handleFilterCollapsed = (collapsed: boolean) => {
  isFilterCollapsed.value = collapsed
}

// 列の定義
const columnDefinitions = [
  { key: 'date', label: '日付' },
  { key: 'org', label: '組織' },
  { key: 'account', label: 'アカウント' },
  { key: 'group', label: 'グループ' },
  { key: 'player', label: 'プレイヤー' },
  { key: 'category', label: 'カテゴリー' },
  { key: 'level', label: 'レベル' },
  { key: 'lesson', label: 'レッスン' },
  { key: 'score', label: 'スコア' },
  { key: 'speechTime', label: '発話時間' },
  { key: 'playTime', label: 'プレイ時間' }
]

// 列の表示状態（組織、アカウント、グループはデフォルトでオフ）
const visibleColumns = reactive<Record<string, boolean>>({
  date: true,
  org: false,
  account: false,
  group: false,
  player: true,
  category: true,
  level: true,
  lesson: true,
  score: true,
  speechTime: true,
  playTime: true
})

// 列設定ドロップダウンの表示状態
const showColumnSettings = ref(false)

// 表示列数を計算
const visibleColumnCount = computed(() => {
  return Object.values(visibleColumns).filter(v => v).length
})

// 列の表示/非表示を切り替え
const toggleColumn = (key: string) => {
  visibleColumns[key] = !visibleColumns[key]
}

// 列設定ドロップダウンの表示/非表示
const toggleColumnSettings = () => {
  showColumnSettings.value = !showColumnSettings.value
}

// テーブルソート
const {
  sortState,
  sortedData,
  toggleSort,
  getSortIcon
} = useTableSort(logData)

// フィルター更新ハンドラ
const handleFiltersUpdate = (filters: {
  lessons?: string[]
  levels?: string[]
  players?: string[]
  dateFrom: Date | null
  dateTo: Date | null
}) => {
  currentFilters.value = filters
  currentPage.value = 1 // フィルター変更時は1ページ目に戻る
  loadLogData()
}

// 日時フォーマット
const formatDateTime = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  return date.toLocaleString('ja-JP')
}

// ページ変更
const changePage = (delta: number) => {
  const newPage = currentPage.value + delta
  if (newPage >= 1 && newPage <= totalPages.value) {
    currentPage.value = newPage
    loadLogData()
  }
}

// ログデータ読み込み
const loadLogData = () => {
  // フィルターを適用してログデータを取得
  if (typeof getFilteredLogData === 'function') {
    const result = getFilteredLogData(currentPage.value, pageSize, currentFilters.value)
    logData.value = result.data
    totalPages.value = result.totalPages
  } else {
    const result = getLogData(currentPage.value, pageSize)
    logData.value = result.data
    totalPages.value = result.totalPages
  }
}

// CSVダウンロード
const downloadCSV = () => {
  // 表示中の列のみCSVに含める
  const headers = columnDefinitions
    .filter(col => visibleColumns[col.key])
    .map(col => col.label)

  const rows = sortedData.value.map(session => {
    return columnDefinitions
      .filter(col => visibleColumns[col.key])
      .map(col => {
        const value = session[col.key]
        if (col.key === 'date') {
          return formatDateTime(value)
        }
        if (col.key === 'level') {
          return `Lv.${value}`
        }
        if (col.key === 'speechTime' || col.key === 'playTime') {
          return `${value}s`
        }
        return value
      })
  })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `log_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// クリックイベントでドロップダウンを閉じる
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.column-settings-container')) {
    showColumnSettings.value = false
  }
}

// 初期化
onMounted(async () => {
  // データが読み込まれていない場合はデモデータを自動読み込み
  if (!isDataLoaded.value) {
    try {
      await loadDemoData()
    } catch (error) {
      console.error('デモデータの読み込みに失敗しました:', error)
    }
  }
  loadLogData()

  // クリックイベントリスナー追加
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.download-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
}

.download-button:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.column-settings-container {
  position: relative;
}

.column-settings-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
}

.column-settings-button:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.column-settings-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  min-width: 180px;
  z-index: 50;
  padding: 8px 0;
}

.column-settings-title {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 4px;
}

.column-settings-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s;
}

.column-settings-item:hover {
  background: #f3f4f6;
}

.column-settings-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #3b82f6;
  cursor: pointer;
}

.pagination-button {
  padding: 8px 16px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-button:hover:not(:disabled) {
  background: #f3f4f6;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
