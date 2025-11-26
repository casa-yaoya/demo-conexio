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
              <span class="page-size-label">表示件数：</span>
              <USelect
                :model-value="pageSize"
                :items="pageSizeOptions"
                size="sm"
                class="page-size-select"
                value-key="value"
                @update:model-value="changePageSize"
              />
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
const pageSize = ref(20)

// ページサイズオプション
const pageSizeOptions = [
  { label: '20件', value: 20 },
  { label: '50件', value: 50 },
  { label: '100件', value: 100 },
  { label: '500件', value: 500 },
  { label: '1000件', value: 1000 }
]

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
    const result = getFilteredLogData(currentPage.value, pageSize.value, currentFilters.value)
    logData.value = result.data
    totalPages.value = result.totalPages
  } else {
    const result = getLogData(currentPage.value, pageSize.value)
    logData.value = result.data
    totalPages.value = result.totalPages
  }
}

// ページサイズ変更
const changePageSize = (newSize: number) => {
  pageSize.value = newSize
  currentPage.value = 1 // 1ページ目に戻る
  loadLogData()
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
   ログカード - Nuxt UI Dashboard Style
   ======================================== */
.log-card {
  background: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius);
  box-shadow: var(--ui-shadow-sm);
}

.log-card-header {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--ui-border);
}

.log-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: var(--ui-text-highlighted);
  margin-bottom: 4px;
}

.log-title-icon {
  font-size: 18px;
  color: #6366f1;
}

.log-subtitle {
  font-size: 12px;
  color: var(--ui-text-muted);
  margin-left: 28px;
}

.log-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--ui-bg-elevated);
  border-radius: var(--ui-radius);
  border: 1px solid var(--ui-border);
}

.log-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-badge,
.page-info {
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
  color: #6366f1;
}

.page-size-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--ui-text);
}

.page-size-select {
  min-width: 100px;
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
   ページネーション
   ======================================== */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--ui-border);
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--ui-text-muted);
}

.pagination-current {
  font-weight: 600;
  color: var(--ui-primary);
  background: rgba(99, 102, 241, 0.1);
  padding: 4px 10px;
  border-radius: var(--ui-radius);
}

.pagination-divider {
  color: var(--ui-text-dimmed);
}

.pagination-total {
  color: var(--ui-text);
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

.sortable.sorted {
  background: rgba(99, 102, 241, 0.08);
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
    padding: 10px 12px;
  }

  .log-info {
    flex-wrap: wrap;
    gap: 8px;
    width: 100%;
  }

  .page-size-label {
    font-size: 12px;
  }

  .page-size-select {
    min-width: 80px;
  }

  .page-info {
    font-size: 11px;
    padding: 4px 8px;
  }

  .table-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .log-card-header {
    padding-bottom: 12px;
    margin-bottom: 12px;
  }

  .log-title {
    font-size: 14px;
  }

  .log-subtitle {
    font-size: 11px;
  }

  .pagination {
    gap: 8px;
    padding-top: 12px;
    margin-top: 12px;
  }

  .pagination-current {
    padding: 3px 8px;
  }
}

@media (max-width: 480px) {
  .log-toolbar {
    padding: 8px 10px;
  }

  .log-info {
    flex-direction: column;
    align-items: flex-start;
  }

  .table-actions {
    flex-wrap: wrap;
    gap: 6px;
  }
}
</style>
