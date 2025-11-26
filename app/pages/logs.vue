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
        <UCard class="log-card">
          <div class="log-card-header">
            <div class="log-title">
              <UIcon name="i-lucide-file-text" class="log-title-icon" />
              ログ
            </div>
            <div class="log-subtitle">プレイセッションの詳細記録</div>
          </div>
          <div class="log-toolbar">
            <div class="log-info">
              <span class="info-badge">
                <UIcon name="i-lucide-list" class="info-icon" />
                {{ sortedData.length }}件
              </span>
              <span class="page-info">
                <UIcon name="i-lucide-book-open" class="info-icon" />
                ページ {{ currentPage }} / {{ totalPages }}
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
                ダウンロード
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
          <div class="pagination">
            <UButton
              variant="outline"
              color="neutral"
              size="sm"
              icon="i-lucide-chevron-left"
              :disabled="currentPage <= 1"
              @click="changePage(-1)"
            />
            <div class="pagination-info">
              <span class="pagination-current">{{ currentPage }}</span>
              <span class="pagination-divider">/</span>
              <span class="pagination-total">{{ totalPages }}</span>
            </div>
            <UButton
              variant="outline"
              color="neutral"
              size="sm"
              icon="i-lucide-chevron-right"
              :disabled="currentPage >= totalPages"
              @click="changePage(1)"
            />
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

// 表示列数を計算
const visibleColumnCount = computed(() => {
  return Object.values(visibleColumns).filter(v => v).length
})

// 列の表示/非表示を切り替え
const toggleColumn = (key: string) => {
  visibleColumns[key] = !visibleColumns[key]
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
})
</script>

<style scoped>
/* ========================================
   ログカード
   ======================================== */
.log-card {
  border-left: 4px solid #6366f1;
}

.log-card-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.log-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.log-title-icon {
  font-size: 20px;
  color: #6366f1;
}

.log-subtitle {
  font-size: 13px;
  color: #64748b;
  margin-left: 30px;
}

.log-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.log-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.info-badge,
.page-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  background: white;
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
}

.info-icon {
  font-size: 14px;
  color: #6366f1;
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 10px;
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
  color: #64748b;
  padding: 8px 12px;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 4px;
}

.column-icon {
  font-size: 14px;
  color: #94a3b8;
}

.column-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.15s ease;
}

.column-option:hover {
  background: #f1f5f9;
}

/* ========================================
   ページネーション
   ======================================== */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #64748b;
}

.pagination-current {
  font-weight: 600;
  color: #6366f1;
  background: #eef2ff;
  padding: 4px 10px;
  border-radius: 6px;
}

.pagination-divider {
  color: #cbd5e1;
}

.pagination-total {
  color: #475569;
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
  background-color: #eef2ff;
}

.sortable.sorted {
  background-color: #e0e7ff;
}

.th-content {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sort-icon {
  font-size: 10px;
  color: #cbd5e1;
  margin-left: 4px;
  transition: color 0.15s ease;
}

.sortable.sorted .sort-icon {
  color: #6366f1;
}

/* ========================================
   レスポンシブ
   ======================================== */
@media (max-width: 768px) {
  .log-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .log-info {
    flex-wrap: wrap;
  }

  .table-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
