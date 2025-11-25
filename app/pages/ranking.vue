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
          <div class="ranking-header">
            <h2 class="text-lg font-semibold text-gray-800">個人レコード</h2>
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
                  <th v-if="visibleColumns.rank">
                    <span class="th-content">順位</span>
                  </th>
                  <th v-if="visibleColumns.player">
                    <span class="th-content">プレイヤー</span>
                  </th>
                  <th v-if="visibleColumns.org" class="sortable" @click="toggleSort('org')">
                    <span class="th-content">組織<span class="sort-icon" :class="{ active: isSortedColumn('org') }">{{ getSortIcon('org') }}</span></span>
                  </th>
                  <th v-if="visibleColumns.group" class="sortable" @click="toggleSort('group')">
                    <span class="th-content">グループ<span class="sort-icon" :class="{ active: isSortedColumn('group') }">{{ getSortIcon('group') }}</span></span>
                  </th>
                  <th v-if="visibleColumns.totalScore" class="sortable" @click="toggleSort('totalScore')">
                    <span class="th-content">総スコア<span class="sort-icon" :class="{ active: isSortedColumn('totalScore') }">{{ getSortIcon('totalScore') }}</span></span>
                  </th>
                  <th v-if="visibleColumns.totalPlays" class="sortable" @click="toggleSort('totalPlays')">
                    <span class="th-content">プレイ数<span class="sort-icon" :class="{ active: isSortedColumn('totalPlays') }">{{ getSortIcon('totalPlays') }}</span></span>
                  </th>
                  <th v-if="visibleColumns.clearCount" class="sortable" @click="toggleSort('clearCount')">
                    <span class="th-content">クリア数<span class="sort-icon" :class="{ active: isSortedColumn('clearCount') }">{{ getSortIcon('clearCount') }}</span></span>
                  </th>
                  <th v-if="visibleColumns.avgScore" class="sortable" @click="toggleSort('avgScore')">
                    <span class="th-content">平均スコア<span class="sort-icon" :class="{ active: isSortedColumn('avgScore') }">{{ getSortIcon('avgScore') }}</span></span>
                  </th>
                  <th v-if="visibleColumns.totalPlayTime" class="sortable" @click="toggleSort('totalPlayTime')">
                    <span class="th-content">プレイ時間<span class="sort-icon" :class="{ active: isSortedColumn('totalPlayTime') }">{{ getSortIcon('totalPlayTime') }}</span></span>
                  </th>
                  <th v-if="visibleColumns.totalSpeechTime" class="sortable" @click="toggleSort('totalSpeechTime')">
                    <span class="th-content">発話時間<span class="sort-icon" :class="{ active: isSortedColumn('totalSpeechTime') }">{{ getSortIcon('totalSpeechTime') }}</span></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="sortedData.length === 0">
                  <td :colspan="visibleColumnCount" class="text-center text-gray-600">データがありません</td>
                </tr>
                <tr v-for="item in sortedData" :key="item.rank" :class="getRowClass(item.rank)">
                  <td v-if="visibleColumns.rank" class="rank-cell" :class="getRankClass(item.rank)">{{ item.rank }}位</td>
                  <td v-if="visibleColumns.player">{{ item.player }}</td>
                  <td v-if="visibleColumns.org">{{ item.org }}</td>
                  <td v-if="visibleColumns.group">{{ item.group }}</td>
                  <td v-if="visibleColumns.totalScore">{{ item.totalScore }}点</td>
                  <td v-if="visibleColumns.totalPlays">{{ item.totalPlays }}回</td>
                  <td v-if="visibleColumns.clearCount">{{ item.clearCount }}回</td>
                  <td v-if="visibleColumns.avgScore">{{ item.avgScore }}点</td>
                  <td v-if="visibleColumns.totalPlayTime">{{ formatTime(item.totalPlayTime) }}</td>
                  <td v-if="visibleColumns.totalSpeechTime">{{ formatTime(item.totalSpeechTime) }}</td>
                </tr>
              </tbody>
            </table>
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
const { isDataLoaded, loadDemoData, getFilterOptions, getRankingData, getFilteredRankingData } = useDemoData()

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

// ランキングデータ
const rankingData = ref<any[]>([])

// フィルター折りたたみ状態
const isFilterCollapsed = ref(false)

const handleFilterCollapsed = (collapsed: boolean) => {
  isFilterCollapsed.value = collapsed
}

// テーブルソート（デフォルトは総スコア降順）
const {
  sortState,
  sortedData: baseSortedData,
  toggleSort: baseToggleSort,
  getSortIcon,
  isSortedColumn
} = useTableSort(rankingData, { defaultColumn: 'totalScore', defaultDirection: 'desc' })

// ソート不可のカラムを定義
const nonSortableColumns = ['rank', 'player']

// ソート切り替え（ソート不可のカラムはスキップ）
const toggleSort = (column: string) => {
  if (nonSortableColumns.includes(column)) return
  baseToggleSort(column)
}

// カラムがソート可能かどうか
const isSortable = (column: string): boolean => {
  return !nonSortableColumns.includes(column)
}

// ソート後に順位を再計算
// desc（大きい順）の場合は1位が一番上、asc（小さい順）の場合は1位が一番下
const sortedData = computed(() => {
  const total = baseSortedData.value.length
  const isAsc = sortState.value.direction === 'asc'

  return baseSortedData.value.map((item, index) => ({
    ...item,
    rank: isAsc ? total - index : index + 1
  }))
})

// 列の定義
const columnDefinitions = [
  { key: 'rank', label: '順位' },
  { key: 'player', label: 'プレイヤー' },
  { key: 'org', label: '組織' },
  { key: 'group', label: 'グループ' },
  { key: 'totalScore', label: '総スコア' },
  { key: 'totalPlays', label: 'プレイ数' },
  { key: 'clearCount', label: 'クリア数' },
  { key: 'avgScore', label: '平均スコア' },
  { key: 'totalPlayTime', label: 'プレイ時間' },
  { key: 'totalSpeechTime', label: '発話時間' }
]

// 列の表示状態（組織とグループはデフォルトでオフ）
const visibleColumns = reactive<Record<string, boolean>>({
  rank: true,
  player: true,
  org: false,
  group: false,
  totalScore: true,
  totalPlays: true,
  clearCount: true,
  avgScore: true,
  totalPlayTime: true,
  totalSpeechTime: true
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

// フィルター更新ハンドラ
const handleFiltersUpdate = (filters: {
  lessons?: string[]
  levels?: string[]
  players?: string[]
  dateFrom: Date | null
  dateTo: Date | null
}) => {
  currentFilters.value = filters
  updateRankingData()
}

// ランキングデータの更新
const updateRankingData = () => {
  // フィルターを適用してランキングデータを取得
  if (typeof getFilteredRankingData === 'function') {
    rankingData.value = getFilteredRankingData(currentFilters.value)
  } else {
    rankingData.value = getRankingData()
  }
}

// ランクのスタイルクラス（セルの文字色）
const getRankClass = (rank: number): string => {
  if (rank === 1) return 'rank-gold'
  if (rank === 2) return 'rank-silver'
  if (rank === 3) return 'rank-bronze'
  return ''
}

// 行の背景色クラス
const getRowClass = (rank: number): string => {
  if (rank === 1) return 'row-gold'
  if (rank === 2) return 'row-silver'
  if (rank === 3) return 'row-bronze'
  return ''
}

// 時間フォーマット（秒 → 時分秒形式）
const formatTime = (seconds: number | undefined) => {
  if (!seconds || seconds === 0) return '-'
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.round(seconds % 60)

  let result = ''
  if (hours > 0) result += `${hours}時`
  if (mins > 0) result += `${mins}分`
  if (secs > 0 || result === '') result += `${secs}秒`
  return result
}

// CSVダウンロード
const downloadCSV = () => {
  const headers = columnDefinitions
    .filter(col => visibleColumns[col.key])
    .map(col => col.label)

  const rows = sortedData.value.map((item: any) => {
    return columnDefinitions
      .filter(col => visibleColumns[col.key])
      .map(col => {
        const value = item[col.key]
        if (col.key === 'rank') {
          return `${value}位`
        }
        if (col.key === 'totalPlayTime' || col.key === 'totalSpeechTime') {
          return formatTime(value)
        }
        return value
      })
  })

  const csvContent = [
    headers.join(','),
    ...rows.map((row: any[]) => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `personal_record_${new Date().toISOString().split('T')[0]}.csv`
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
  // DataFilterコンポーネントの初期emitでデータが更新されるのを待つ
  // フォールバックとして、フィルターオプションがある場合は初期データを読み込む
  if (filterOptions.value.categories?.length > 0 && rankingData.value.length === 0) {
    updateRankingData()
  }

  // クリックイベントリスナー追加
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.ranking-header {
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

.rank-cell {
  font-weight: 600;
}

.rank-gold {
  color: #92400e; /* 濃いオレンジ/茶色 - オレンジ背景に対して見やすい */
}

.rank-silver {
  color: #78350f; /* 濃い茶色 - 黄色背景に対して見やすい */
}

.rank-bronze {
  color: #374151; /* 濃いグレー - グレー背景に対して見やすい */
}

/* 1〜3位の行の背景色 */
.row-gold {
  background-color: #fed7aa !important;
}

.row-silver {
  background-color: #fef3c7 !important;
}

.row-bronze {
  background-color: #f3f4f6 !important;
}

/* ソート可能なヘッダー */
.sortable {
  cursor: pointer;
  user-select: none;
}

.sortable:hover {
  background-color: #f3f4f6;
}

.th-content {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sort-icon {
  font-size: 10px;
  color: #d1d5db;
  margin-left: 4px;
}

.sort-icon.active {
  color: #3b82f6;
}
</style>
