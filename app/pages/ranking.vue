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
        <UCard class="ranking-card">
          <div class="ranking-card-header">
            <div class="ranking-title">
              <UIcon name="i-lucide-trophy" class="ranking-title-icon" />
              個人レコード
            </div>
            <div class="ranking-subtitle">プレイヤー別のパフォーマンス一覧</div>
          </div>
          <div class="ranking-toolbar">
            <div class="ranking-info">
              <span class="info-badge">
                <UIcon name="i-lucide-users" class="info-icon" />
                {{ sortedData.length }}名
              </span>
            </div>
            <div class="table-actions">
              <UButton
                variant="outline"
                color="primary"
                size="sm"
                icon="i-lucide-download"
                @click="downloadCSV"
              >
                CSVダウンロード
              </UButton>
              <UPopover>
                <UButton
                  variant="outline"
                  color="neutral"
                  size="sm"
                  icon="i-lucide-settings"
                >
                  列設定
                </UButton>
                <template #content>
                  <div class="column-settings-popup">
                    <div class="column-settings-header">
                      <UIcon name="i-lucide-columns" class="column-icon" />
                      表示する列
                    </div>
                    <label v-for="col in columnDefinitions" :key="col.key" class="column-option">
                      <UCheckbox
                        :model-value="visibleColumns[col.key]"
                        @update:model-value="toggleColumn(col.key)"
                      />
                      <span>{{ col.label }}</span>
                    </label>
                  </div>
                </template>
              </UPopover>
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
        </UCard>
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

// 表示列数を計算
const visibleColumnCount = computed(() => {
  return Object.values(visibleColumns).filter(v => v).length
})

// 列の表示/非表示を切り替え
const toggleColumn = (key: string) => {
  visibleColumns[key] = !visibleColumns[key]
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
})
</script>

<style scoped>
/* ========================================
   ランキングカード - Nuxt UI Dashboard Style
   ======================================== */
.ranking-card {
  background: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius);
  box-shadow: var(--ui-shadow-sm);
}

.ranking-card-header {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--ui-border);
}

.ranking-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: var(--ui-text-highlighted);
  margin-bottom: 4px;
}

.ranking-title-icon {
  font-size: 18px;
  color: #f59e0b;
}

.ranking-subtitle {
  font-size: 12px;
  color: var(--ui-text-muted);
  margin-left: 28px;
}

.ranking-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--ui-bg-elevated);
  border-radius: var(--ui-radius);
  border: 1px solid var(--ui-border);
}

.ranking-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--ui-text);
  background: var(--ui-bg);
  padding: 6px 12px;
  border-radius: var(--ui-radius);
  border: 1px solid var(--ui-border);
}

.info-icon {
  font-size: 14px;
  color: #f59e0b;
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 列設定ポップアップ */
.column-settings-popup {
  padding: 8px;
  min-width: 180px;
}

.column-settings-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ui-text-muted);
  padding: 8px 12px;
  border-bottom: 1px solid var(--ui-border);
  margin-bottom: 4px;
}

.column-icon {
  font-size: 14px;
  color: var(--ui-text-dimmed);
}

.column-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ui-text);
  cursor: pointer;
  border-radius: var(--ui-radius);
  transition: all 0.15s ease;
}

.column-option:hover {
  background: var(--ui-bg-elevated);
}

/* ========================================
   ランキングテーブル
   ======================================== */
.rank-cell {
  font-weight: 600;
  font-size: 13px;
}

/* 1位 - ゴールド */
.rank-gold {
  color: #b45309;
}

.row-gold {
  background: rgba(251, 191, 36, 0.15) !important;
}

.row-gold:hover {
  background: rgba(251, 191, 36, 0.25) !important;
}

/* 2位 - シルバー */
.rank-silver {
  color: #64748b;
}

.row-silver {
  background: rgba(148, 163, 184, 0.15) !important;
}

.row-silver:hover {
  background: rgba(148, 163, 184, 0.25) !important;
}

/* 3位 - ブロンズ */
.rank-bronze {
  color: #92400e;
}

.row-bronze {
  background: rgba(251, 146, 60, 0.15) !important;
}

.row-bronze:hover {
  background: rgba(251, 146, 60, 0.25) !important;
}

/* ========================================
   ソート機能
   ======================================== */
.sortable {
  cursor: pointer;
  user-select: none;
  transition: background 0.15s ease;
}

.sortable:hover {
  background: var(--ui-bg-elevated);
}

.th-content {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sort-icon {
  font-size: 10px;
  color: var(--ui-text-dimmed);
  margin-left: 4px;
  transition: color 0.15s ease;
}

.sort-icon.active {
  color: var(--ui-primary);
}

/* ========================================
   レスポンシブ
   ======================================== */
@media (max-width: 768px) {
  .ranking-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .table-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
