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
        <UCard class="stats-card mb-4">
          <div class="stats-header-row">
            <div class="stats-header">
              <UIcon name="i-lucide-bar-chart-3" class="stats-header-icon" />
              集計データ
            </div>
            <div class="stats-period">
              <UIcon name="i-lucide-calendar" class="period-icon" />
              {{ selectedPeriodText }}
            </div>
          </div>
          <div class="stats-grid">
            <div class="stat-item stat-time">
              <div class="stat-icon-wrapper">
                <UIcon name="i-lucide-clock" class="stat-icon" />
              </div>
              <div class="stat-content">
                <div class="stats-label">総プレイ時間</div>
                <div class="stats-value">{{ formatTimeLong(aggregatedStats.totalPlayTime) }}</div>
              </div>
            </div>
            <div class="stat-item stat-play">
              <div class="stat-icon-wrapper">
                <UIcon name="i-lucide-play-circle" class="stat-icon" />
              </div>
              <div class="stat-content">
                <div class="stats-label">総プレイ数</div>
                <div class="stats-value">{{ aggregatedStats.playCount.toLocaleString() }}</div>
              </div>
            </div>
            <div class="stat-item stat-players">
              <div class="stat-icon-wrapper">
                <UIcon name="i-lucide-users" class="stat-icon" />
              </div>
              <div class="stat-content">
                <div class="stats-label">総プレイヤー数</div>
                <div class="stats-value">{{ aggregatedStats.playerCount.toLocaleString() }}</div>
              </div>
            </div>
            <div class="stat-item stat-lessons">
              <div class="stat-icon-wrapper">
                <UIcon name="i-lucide-book-open" class="stat-icon" />
              </div>
              <div class="stat-content">
                <div class="stats-label">総レッスン数</div>
                <div class="stats-value">{{ aggregatedStats.lessonCount.toLocaleString() }}</div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Chart -->
        <UCard class="chart-card mb-4">
          <div class="chart-header-row">
            <div class="chart-header">
              <UIcon name="i-lucide-trending-up" class="chart-header-icon" />
              トレンドチャート
            </div>
          </div>
          <!-- チャート設定エリア -->
          <div class="chart-settings">
            <div class="chart-settings-left">
              <!-- 表示内容チェックボックス -->
              <div class="chart-visibility-toggles">
                <label
                  v-for="item in chartDisplayItems"
                  :key="item.key"
                  class="chart-toggle-item"
                  :class="{ 'active': chartVisibility[item.key] }"
                >
                  <UCheckbox
                    :model-value="chartVisibility[item.key]"
                    @update:model-value="toggleChartVisibility(item.key)"
                  />
                  <span
                    class="toggle-label"
                    :style="{ color: chartVisibility[item.key] ? item.color : '#94a3b8' }"
                  >{{ item.label }}</span>
                </label>
              </div>
            </div>
            <div class="chart-settings-right">
              <!-- グラフ比較軸 -->
              <div class="chart-setting-item">
                <UIcon name="i-lucide-git-compare" class="setting-icon" />
                <label class="chart-setting-label">比較軸:</label>
                <USelect
                  v-model="chartCompareAxis"
                  :items="chartCompareAxisOptions"
                  size="sm"
                  class="min-w-[120px]"
                />
              </div>
            </div>
          </div>
          <TrendChart
            :labels="trendChartLabels"
            :datasets="trendChartDatasets"
          />
        </UCard>

        <!-- Table -->
        <UCard class="table-card">
          <div class="table-card-header">
            <div class="table-title">
              <UIcon name="i-lucide-table" class="table-title-icon" />
              サマリーテーブル
            </div>
          </div>
          <div class="summary-header">
            <div class="display-settings-row">
              <div class="display-setting-item">
                <UIcon name="i-lucide-layers" class="setting-icon" />
                <label class="display-setting-label">表示単位:</label>
                <USelect
                  v-model="summaryDisplayUnit"
                  :items="displayUnitOptions"
                  size="sm"
                  class="min-w-[120px]"
                />
              </div>
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
                  <th v-if="visibleColumns.category">コース</th>
                  <th v-if="visibleColumns.level">Lv.</th>
                  <th v-if="visibleColumns.lesson">レッスン</th>
                  <th v-if="visibleColumns.playCount">プレイ数</th>
                  <th v-if="visibleColumns.clearCount">クリア数</th>
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
                  <td v-if="visibleColumns.clearCount">{{ item.clearCount || 0 }}回</td>
                  <td v-if="visibleColumns.avgScore">{{ item.avgScore }}点</td>
                  <td v-if="visibleColumns.bestScore">{{ item.bestScore }}点</td>
                  <td v-if="visibleColumns.totalPlayTime">{{ formatTime(item.totalPlayTime) }}</td>
                  <td v-if="visibleColumns.avgPlayTime">{{ formatTime(item.avgPlayTime) }}</td>
                  <td v-if="visibleColumns.bestScorer">{{ item.bestScorer || '-' }}</td>
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
const {
  isDataLoaded,
  loadDemoData,
  getFilteredMonthlyTrendData,
  getComparisonTrendData,
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

// USelect用オプション
const displayUnitOptions = [
  { label: 'レッスン', value: 'lesson' },
  { label: 'レベル', value: 'level' },
  { label: 'カテゴリー', value: 'category' }
]

const chartCompareAxisOptions = [
  { label: 'なし', value: 'none' },
  { label: 'アカウント', value: 'account' },
  { label: 'グループ', value: 'group' },
  { label: 'プレイヤー', value: 'player' },
  { label: 'コース', value: 'category' },
  { label: 'レベル', value: 'level' },
  { label: 'レッスン', value: 'lesson' }
]

// グラフの比較軸
const chartCompareAxis = ref<'none' | 'account' | 'group' | 'player' | 'category' | 'level' | 'lesson'>('none')

// チャート表示アイテムの定義
const chartDisplayItems = [
  { key: 'playCount', label: 'プレイ数', color: '#3b82f6' },
  { key: 'clearCount', label: 'クリア数', color: '#10b981' },
  { key: 'avgScore', label: '平均スコア', color: '#f97316' },
  { key: 'bestScore', label: 'ベストスコア', color: '#ef4444' },
  { key: 'uniquePlayer', label: 'ユニーク人数', color: '#8b5cf6' }
]

// チャート表示状態
const chartVisibility = reactive<Record<string, boolean>>({
  playCount: true,
  clearCount: true,
  avgScore: true,
  bestScore: true,
  uniquePlayer: true
})

// チャート表示切り替え
const toggleChartVisibility = (key: string) => {
  chartVisibility[key] = !chartVisibility[key]
}

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
  { key: 'clearCount', label: 'クリア数' },
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
  clearCount: true,
  avgScore: true,
  bestScore: true,
  totalPlayTime: true,
  avgPlayTime: true,
  bestScorer: true
})

// 表示列数を計算
const visibleColumnCount = computed(() => {
  return Object.values(visibleColumns).filter(v => v).length
})

// 列の表示/非表示を切り替え
const toggleColumn = (key: string) => {
  visibleColumns[key] = !visibleColumns[key]
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
        if (col.key === 'clearCount') return item.clearCount || 0
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

// 比較用のカラーパレット
const comparisonColors = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f97316', // orange
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
  '#f59e0b', // amber
  '#6366f1'  // indigo
]

// トレンドチャートデータ（フィルター対応）
const trendChartLabels = computed(() => {
  const trend = getComparisonTrendData(chartCompareAxis.value, currentFilters.value)
  return trend.labels
})

const trendChartDatasets = computed(() => {
  const result = getComparisonTrendData(chartCompareAxis.value, currentFilters.value)

  // 比較モードの場合
  if ('series' in result && result.isComparison) {
    // 各グループの平均スコアを折れ線グラフとして表示
    return result.series.map((series: { name: string; avgScoreData: (number | null)[] }, index: number) => ({
      label: series.name,
      data: series.avgScoreData,
      type: 'line' as const,
      borderColor: comparisonColors[index % comparisonColors.length],
      backgroundColor: 'transparent',
      yAxisID: 'y1',
      order: index
    }))
  }

  // 比較なし（通常モード）の場合
  const trend = result as {
    labels: string[]
    playCountData: (number | null)[]
    clearCountData: (number | null)[]
    avgScoreData: (number | null)[]
    bestScoreData: (number | null)[]
    uniquePlayerData: (number | null)[]
  }

  const allDatasets = [
    // 面グラフ - ユニークプレイ人数（一番奥）
    {
      key: 'uniquePlayer',
      label: 'ユニークプレイ人数',
      data: trend.uniquePlayerData,
      type: 'area' as const,
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139, 92, 246, 0.3)',
      yAxisID: 'y',
      order: 4
    },
    // 棒グラフ - クリア数（奥）
    {
      key: 'clearCount',
      label: 'クリア数',
      data: trend.clearCountData,
      type: 'bar' as const,
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.6)',
      yAxisID: 'y',
      order: 3
    },
    // 棒グラフ - プレイ数（手前に重ねる）
    {
      key: 'playCount',
      label: 'プレイ数',
      data: trend.playCountData,
      type: 'bar' as const,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      yAxisID: 'y',
      order: 2
    },
    // 折れ線グラフ - 平均スコア
    {
      key: 'avgScore',
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
      key: 'bestScore',
      label: 'ベストスコア',
      data: trend.bestScoreData,
      type: 'line' as const,
      borderColor: '#ef4444',
      backgroundColor: 'transparent',
      yAxisID: 'y1',
      order: 0
    }
  ]

  // chartVisibilityに基づいてフィルタリング
  return allDatasets.filter(ds => chartVisibility[ds.key])
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
})
</script>

<style scoped>
.whitespace-pre-line {
  white-space: pre-line;
}

/* ========================================
   統計カード - Nuxt UI Dashboard Style
   ======================================== */
.stats-card {
  background: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius);
  box-shadow: var(--ui-shadow-sm);
}

.stats-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--ui-border);
}

.stats-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: var(--ui-text-highlighted);
}

.stats-header-icon {
  font-size: 18px;
  color: var(--ui-primary);
}

.stats-period {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--ui-text-muted);
  background: var(--ui-bg-elevated);
  padding: 6px 12px;
  border-radius: var(--ui-radius);
  border: 1px solid var(--ui-border);
}

.period-icon {
  font-size: 14px;
  color: var(--ui-text-dimmed);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--ui-bg-elevated);
  border-radius: var(--ui-radius);
  border: 1px solid var(--ui-border);
  transition: all 0.15s ease;
}

.stat-item:hover {
  border-color: var(--ui-border-accented);
  background: var(--ui-bg-accented);
}

.stat-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: var(--ui-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-time .stat-icon-wrapper { background: rgba(14, 165, 233, 0.1); }
.stat-play .stat-icon-wrapper { background: rgba(16, 185, 129, 0.1); }
.stat-players .stat-icon-wrapper { background: rgba(139, 92, 246, 0.1); }
.stat-lessons .stat-icon-wrapper { background: rgba(245, 158, 11, 0.1); }

.stat-icon {
  font-size: 20px;
}

.stat-time .stat-icon { color: #0ea5e9; }
.stat-play .stat-icon { color: #10b981; }
.stat-players .stat-icon { color: #8b5cf6; }
.stat-lessons .stat-icon { color: #f59e0b; }

.stat-content {
  flex: 1;
  min-width: 0;
}

.stats-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--ui-text-muted);
  margin-bottom: 2px;
}

.stats-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--ui-text-highlighted);
  line-height: 1.2;
}

/* ========================================
   チャートカード - Nuxt UI Dashboard Style
   ======================================== */
.chart-card {
  background: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius);
  box-shadow: var(--ui-shadow-sm);
}

.chart-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--ui-border);
}

.chart-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: var(--ui-text-highlighted);
}

.chart-header-icon {
  font-size: 18px;
  color: #8b5cf6;
}

/* チャート設定エリア */
.chart-settings {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--ui-bg-elevated);
  border-radius: var(--ui-radius);
  flex-wrap: wrap;
  gap: 12px;
  border: 1px solid var(--ui-border);
}

.chart-settings-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.chart-settings-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.chart-visibility-toggles {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chart-toggle-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius);
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 12px;
}

.chart-toggle-item:hover {
  border-color: var(--ui-border-accented);
  background: var(--ui-bg-accented);
}

.chart-toggle-item.active {
  border-color: var(--ui-primary);
  background: rgba(var(--color-primary-500), 0.1);
}

.toggle-label {
  font-weight: 500;
  transition: color 0.15s;
}

.chart-setting-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-setting-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--ui-text-muted);
  white-space: nowrap;
}

/* ========================================
   テーブルカード - Nuxt UI Dashboard Style
   ======================================== */
.table-card {
  background: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius);
  box-shadow: var(--ui-shadow-sm);
}

.table-card-header {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--ui-border);
}

.table-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: var(--ui-text-highlighted);
}

.table-title-icon {
  font-size: 18px;
  color: #10b981;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--ui-bg-elevated);
  border-radius: var(--ui-radius);
  border: 1px solid var(--ui-border);
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 表示設定 */
.display-settings-row {
  display: flex;
  align-items: center;
  gap: 20px;
}

.display-setting-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-icon {
  font-size: 16px;
  color: var(--ui-text-dimmed);
}

.display-setting-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--ui-text-muted);
  white-space: nowrap;
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

/* データテーブル */
.data-table {
  font-size: 13px;
}

.data-table th,
.data-table td {
  padding: 12px 14px;
}

/* ========================================
   レスポンシブ
   ======================================== */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .summary-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .display-settings-row {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
    width: 100%;
  }

  .table-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-item {
    padding: 14px;
  }

  .stats-value {
    font-size: 18px;
  }

  .stats-header-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .chart-settings {
    flex-direction: column;
    align-items: flex-start;
  }

  .chart-settings-right {
    width: 100%;
  }
}

/* スマホ向け（768px以下） */
@media (max-width: 768px) {
  .summary-toolbar {
    flex-direction: column;
    gap: 10px;
    padding: 10px 12px;
  }

  .unit-buttons {
    width: 100%;
    justify-content: flex-start;
  }

  .chart-header-row {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .chart-header {
    font-size: 14px;
  }

  .chart-settings-left {
    width: 100%;
  }

  .chart-visibility-toggles {
    width: 100%;
  }

  .chart-toggle-item {
    font-size: 11px;
    padding: 4px 8px;
  }
}

/* 小さいスマホ（480px以下） */
@media (max-width: 480px) {
  .summary-toolbar {
    padding: 8px 10px;
  }

  .chart-settings {
    padding: 8px 10px;
  }

  .chart-toggle-item {
    font-size: 10px;
    padding: 3px 6px;
  }
}
</style>
