<template>
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
      <div class="p-5">
        <!-- 集計データ -->
        <div class="card mb-4">
          <div class="stats-header-row">
            <div class="stats-header">集計データ</div>
            <div class="stats-period">{{ selectedPeriodText }}</div>
          </div>
          <div class="stats-grid">
            <div>
              <div class="stats-label">総プレイ時間</div>
              <div class="stats-value">{{ formatTimeLong(aggregatedStats.totalPlayTime) }}</div>
            </div>
            <div>
              <div class="stats-label">総プレイ数</div>
              <div class="stats-value">{{ aggregatedStats.playCount.toLocaleString() }}</div>
            </div>
            <div>
              <div class="stats-label">総プレイヤー数</div>
              <div class="stats-value">{{ aggregatedStats.playerCount.toLocaleString() }}</div>
            </div>
            <div>
              <div class="stats-label">総レッスン数</div>
              <div class="stats-value">{{ aggregatedStats.lessonCount.toLocaleString() }}</div>
            </div>
          </div>
        </div>

        <!-- Chart -->
        <div class="card mb-4">
          <TrendChart
            :labels="trendChartLabels"
            :datasets="trendChartDatasets"
          />
        </div>

        <!-- Table -->
        <div class="card">
          <div class="summary-header">
            <div class="flex items-center gap-3">
              <label class="font-semibold text-sm text-gray-800">表示単位:</label>
              <select v-model="summaryDisplayUnit" class="select-input">
                <option value="lesson">レッスン</option>
                <option value="level">レベル</option>
                <option value="category">カテゴリー</option>
              </select>
            </div>
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
                  <th v-if="visibleColumns.category">コース</th>
                  <th v-if="visibleColumns.level">Lv.</th>
                  <th v-if="visibleColumns.lesson">レッスン</th>
                  <th v-if="visibleColumns.playCount">プレイ数</th>
                  <th v-if="visibleColumns.avgScore">平均</th>
                  <th v-if="visibleColumns.bestScore">ベスト</th>
                  <th v-if="visibleColumns.totalPlayTime">累計時間</th>
                  <th v-if="visibleColumns.avgPlayTime">平均時間</th>
                  <th v-if="visibleColumns.bestScorer">最高点</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="summaryData.length === 0">
                  <td :colspan="visibleColumnCount" class="text-center text-gray-600">データがありません</td>
                </tr>
                <tr v-for="(item, index) in summaryData" :key="index">
                  <td v-if="visibleColumns.category">{{ item.category }}</td>
                  <td v-if="visibleColumns.level" class="whitespace-pre-line">{{ item.levelDisplay }}</td>
                  <td v-if="visibleColumns.lesson" class="whitespace-pre-line">{{ item.lessonDisplay }}</td>
                  <td v-if="visibleColumns.playCount">{{ item.playCount }}回</td>
                  <td v-if="visibleColumns.avgScore">{{ item.avgScore }}点</td>
                  <td v-if="visibleColumns.bestScore">{{ item.bestScore }}点</td>
                  <td v-if="visibleColumns.totalPlayTime">{{ formatTime(item.totalPlayTime) }}</td>
                  <td v-if="visibleColumns.avgPlayTime">{{ formatTime(item.avgPlayTime) }}</td>
                  <td v-if="visibleColumns.bestScorer">{{ item.bestScorer || '-' }}</td>
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
const {
  isDataLoaded,
  loadDemoData,
  getMonthlyTrendData,
  getFilterOptions,
  getFilteredSummaryData,
  getFilteredAggregatedStats
} = useDemoData()

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

const summaryDisplayUnit = ref<'lesson' | 'level' | 'category'>('lesson')
const summaryData = ref<any[]>([])

// フィルター折りたたみ状態
const isFilterCollapsed = ref(false)

const handleFilterCollapsed = (collapsed: boolean) => {
  isFilterCollapsed.value = collapsed
}

// 列の定義（短縮版）
const columnDefinitions = [
  { key: 'category', label: 'コース' },
  { key: 'level', label: 'Lv.' },
  { key: 'lesson', label: 'レッスン' },
  { key: 'playCount', label: 'プレイ数' },
  { key: 'avgScore', label: '平均' },
  { key: 'bestScore', label: 'ベスト' },
  { key: 'totalPlayTime', label: '累計時間' },
  { key: 'avgPlayTime', label: '平均時間' },
  { key: 'bestScorer', label: '最高点' }
]

// 列の表示状態
const visibleColumns = reactive<Record<string, boolean>>({
  category: true,
  level: true,
  lesson: true,
  playCount: true,
  avgScore: true,
  bestScore: true,
  totalPlayTime: true,
  avgPlayTime: true,
  bestScorer: true
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

// クリックイベントでドロップダウンを閉じる
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.column-settings-container')) {
    showColumnSettings.value = false
  }
}

// CSVダウンロード
const downloadCSV = () => {
  const headers = columnDefinitions
    .filter(col => visibleColumns[col.key])
    .map(col => col.label)

  const rows = summaryData.value.map((item: any) => {
    return columnDefinitions
      .filter(col => visibleColumns[col.key])
      .map(col => {
        if (col.key === 'category') return item.category
        if (col.key === 'level') return item.levelDisplay
        if (col.key === 'lesson') return item.lessonDisplay
        if (col.key === 'playCount') return item.playCount
        if (col.key === 'avgScore') return item.avgScore
        if (col.key === 'bestScore') return item.bestScore
        if (col.key === 'totalPlayTime') return formatTime(item.totalPlayTime)
        if (col.key === 'avgPlayTime') return formatTime(item.avgPlayTime)
        if (col.key === 'bestScorer') return item.bestScorer || '-'
        return ''
      })
  })

  const csvContent = [
    headers.join(','),
    ...rows.map((row: any[]) => row.map(cell => `"${String(cell).replace(/\n/g, ' ')}"`).join(','))
  ].join('\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `summary_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// フィルターオプション
const filterOptions = computed(() => getFilterOptions())

// 集計統計データ（フィルター適用済み）
const aggregatedStats = computed(() => getFilteredAggregatedStats(currentFilters.value))

// 選択期間テキスト
const selectedPeriodText = computed(() => {
  const from = currentFilters.value.dateFrom
  const to = currentFilters.value.dateTo

  const formatDate = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}/${m}/${d}`
  }

  if (from && to) {
    return `${formatDate(from)} ～ ${formatDate(to)}`
  } else if (from) {
    return `${formatDate(from)} ～`
  } else if (to) {
    return `～ ${formatDate(to)}`
  }
  return '全期間'
})

// 時間フォーマット（秒 → 時分秒形式）- テーブル用
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

// 時間フォーマット（秒 → 54時間14分30秒形式）- 集計データ用
const formatTimeLong = (seconds: number | undefined) => {
  if (!seconds || seconds === 0) return '-'
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.round(seconds % 60)

  let result = ''
  if (hours > 0) result += `${hours}時間`
  if (mins > 0) result += `${mins}分`
  if (secs > 0 || result === '') result += `${secs}秒`
  return result
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
  updateSummaryData()
}

// トレンドチャートデータ
const trendChartLabels = computed(() => {
  const trend = getMonthlyTrendData()
  return trend.labels
})

const trendChartDatasets = computed(() => {
  const trend = getMonthlyTrendData()
  return [
    // 面グラフ - ユニークプレイ人数（一番奥）
    {
      label: 'ユニークプレイ人数',
      data: trend.uniquePlayerData,
      type: 'area' as const,
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139, 92, 246, 0.3)',
      yAxisID: 'y',
      order: 4
    },
    // 棒グラフ - プレイ数（奥）
    {
      label: 'プレイ数',
      data: trend.playCountData,
      type: 'bar' as const,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.6)',
      yAxisID: 'y',
      order: 3
    },
    // 棒グラフ - クリア数（手前に重ねる）
    {
      label: 'クリア数',
      data: trend.clearCountData,
      type: 'bar' as const,
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.8)',
      yAxisID: 'y',
      order: 2
    },
    // 折れ線グラフ - 平均スコア
    {
      label: '平均スコア',
      data: trend.avgScoreData,
      type: 'line' as const,
      borderColor: '#f97316',
      backgroundColor: 'transparent',
      yAxisID: 'y1',
      order: 1
    },
    // 折れ線グラフ - ベストスコア
    {
      label: 'ベストスコア',
      data: trend.bestScoreData,
      type: 'line' as const,
      borderColor: '#ef4444',
      backgroundColor: 'transparent',
      yAxisID: 'y1',
      order: 0
    }
  ]
})

// サマリーデータの更新
const updateSummaryData = () => {
  summaryData.value = getFilteredSummaryData(summaryDisplayUnit.value, currentFilters.value)
}

// Watch for display unit changes
watch(summaryDisplayUnit, updateSummaryData)

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

  // クリックイベントリスナー追加
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.whitespace-pre-line {
  white-space: pre-line;
}

.summary-header {
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

/* 集計データセクション */
.stats-header-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.stats-header {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.stats-period {
  font-size: 13px;
  color: #9ca3af;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stats-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.stats-value {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* サマリーテーブルのフォントを小さく */
.data-table {
  font-size: 12px;
}

.data-table th,
.data-table td {
  padding: 0.5rem 0.75rem;
}
</style>
