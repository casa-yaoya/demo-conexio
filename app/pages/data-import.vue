<template>
  <div class="p-5">
    <UCard class="import-card">
      <div class="import-header">
        <div class="import-title">
          <UIcon name="i-lucide-database" class="import-title-icon" />
          データ読込
        </div>
        <div class="import-subtitle">CSVファイルまたはデモデータからデータを読み込みます</div>
      </div>

      <!-- Current Data Info -->
      <div class="data-stats-grid">
        <div class="data-stat-item">
          <div class="data-stat-icon stat-records">
            <UIcon name="i-lucide-file-text" />
          </div>
          <div class="data-stat-content">
            <div class="data-stat-label">総レコード数</div>
            <div class="data-stat-value">{{ dataStats.recordCount.toLocaleString() }}</div>
          </div>
        </div>
        <div class="data-stat-item">
          <div class="data-stat-icon stat-players">
            <UIcon name="i-lucide-users" />
          </div>
          <div class="data-stat-content">
            <div class="data-stat-label">プレイヤー数</div>
            <div class="data-stat-value">{{ dataStats.playerCount.toLocaleString() }}</div>
          </div>
        </div>
        <div class="data-stat-item">
          <div class="data-stat-icon stat-lessons">
            <UIcon name="i-lucide-book-open" />
          </div>
          <div class="data-stat-content">
            <div class="data-stat-label">レッスン数</div>
            <div class="data-stat-value">{{ dataStats.lessonCount.toLocaleString() }}</div>
          </div>
        </div>
        <div class="data-stat-item">
          <div class="data-stat-icon stat-period">
            <UIcon name="i-lucide-calendar" />
          </div>
          <div class="data-stat-content">
            <div class="data-stat-label">期間</div>
            <div class="data-stat-value-sm">{{ dataStats.dateRange }}</div>
          </div>
        </div>
      </div>

      <!-- File Upload -->
      <div class="upload-area">
        <input
          type="file"
          accept=".csv"
          style="display: none;"
          ref="csvFileInput"
          @change="handleCSVFileChange"
        >
        <div class="upload-icon">
          <UIcon name="i-lucide-upload-cloud" />
        </div>
        <div class="upload-text">ファイルをドラッグ＆ドロップ、またはボタンで選択</div>
        <div class="upload-buttons">
          <UButton
            color="primary"
            icon="i-lucide-file-up"
            @click="selectCSVFile"
          >
            CSVファイルを選択
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-database"
            @click="loadDemoDataManually"
          >
            デモデータを読み込む
          </UButton>
        </div>
        <div class="upload-hint">
          フォーマット: 日付,Org,Account,Group,Player,カテゴリ,レベル,レッスン,スコア,発話時間,プレイ時間
        </div>
        <div v-if="csvUploadStatus" class="upload-status" :class="{ error: csvUploadStatus.startsWith('エラー'), success: csvUploadStatus.startsWith('✓') }">
          {{ csvUploadStatus }}
        </div>
      </div>

      <!-- Sample Data Preview -->
      <div class="preview-section">
        <div class="preview-header">
          <UIcon name="i-lucide-eye" class="preview-icon" />
          <span>データプレビュー（最新10件）</span>
        </div>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>日付</th>
                <th>組織</th>
                <th>プレイヤー</th>
                <th>レッスン</th>
                <th>スコア</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="previewData.length === 0">
                <td colspan="5" class="empty-cell">データがありません</td>
              </tr>
              <tr v-for="(session, index) in previewData" :key="index">
                <td>{{ formatDate(session.date) }}</td>
                <td>{{ session.org }}</td>
                <td>{{ session.player }}</td>
                <td>{{ session.lesson }}</td>
                <td>{{ session.score }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

// デモデータ管理
const {
  loadDemoData,
  loadFromCSVFile,
  getDataStats,
  getLogData
} = useDemoData()

// データ統計
const dataStats = ref<any>({ recordCount: 0, playerCount: 0, lessonCount: 0, dateRange: '-' })
const previewData = ref<any[]>([])
const csvUploadStatus = ref('')
const csvFileInput = ref<HTMLInputElement | null>(null)

// 日付フォーマット
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP')
}

// CSVファイル選択
const selectCSVFile = () => {
  csvFileInput.value?.click()
}

// CSVファイル変更ハンドラ
const handleCSVFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  csvUploadStatus.value = '読み込み中...'

  try {
    const result = await loadFromCSVFile(file)
    if (result.success) {
      csvUploadStatus.value = `✓ ${result.recordCount}件のレコードを読み込みました`
      updateStats()
    } else {
      csvUploadStatus.value = `エラー: ${result.error}`
    }
  } catch (error) {
    csvUploadStatus.value = `エラー: ${error}`
  }

  // ファイル入力をリセット
  target.value = ''
}

// デモデータ読み込み
const loadDemoDataManually = () => {
  csvUploadStatus.value = '読み込み中...'
  loadDemoData()
  csvUploadStatus.value = '✓ デモデータを読み込みました'
  updateStats()
}

// 統計情報を更新
const updateStats = () => {
  dataStats.value = getDataStats()
  const logResult = getLogData(1, 10)
  previewData.value = logResult.data
}

// 初期化
onMounted(() => {
  updateStats()
})
</script>

<style scoped>
/* ========================================
   インポートカード - Nuxt UI Dashboard Style
   ======================================== */
.import-card {
  background: var(--ui-bg);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius);
  box-shadow: var(--ui-shadow-sm);
}

.import-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--ui-border);
}

.import-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: var(--ui-text-highlighted);
  margin-bottom: 4px;
}

.import-title-icon {
  font-size: 18px;
  color: #10b981;
}

.import-subtitle {
  font-size: 12px;
  color: var(--ui-text-muted);
  margin-left: 28px;
}

/* ========================================
   データ統計グリッド
   ======================================== */
.data-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.data-stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--ui-bg-elevated);
  border-radius: var(--ui-radius);
  border: 1px solid var(--ui-border);
  transition: all 0.15s ease;
}

.data-stat-item:hover {
  border-color: var(--ui-border-accented);
}

.data-stat-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--ui-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 18px;
}

.stat-records { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
.stat-players { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
.stat-lessons { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.stat-period { background: rgba(14, 165, 233, 0.1); color: #0ea5e9; }

.data-stat-content {
  flex: 1;
  min-width: 0;
}

.data-stat-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--ui-text-muted);
  margin-bottom: 2px;
}

.data-stat-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--ui-text-highlighted);
  line-height: 1.2;
}

.data-stat-value-sm {
  font-size: 14px;
  font-weight: 600;
  color: var(--ui-text-highlighted);
}

/* ========================================
   アップロードエリア
   ======================================== */
.upload-area {
  background: var(--ui-bg-elevated);
  border: 2px dashed var(--ui-border);
  border-radius: var(--ui-radius);
  padding: 32px 24px;
  text-align: center;
  transition: all 0.2s ease;
  margin-bottom: 24px;
}

.upload-area:hover {
  border-color: var(--ui-primary);
  background: rgba(var(--color-primary-500), 0.02);
}

.upload-icon {
  font-size: 48px;
  color: var(--ui-text-dimmed);
  margin-bottom: 16px;
}

.upload-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--ui-text-muted);
  margin-bottom: 20px;
}

.upload-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.upload-hint {
  margin-top: 16px;
  font-size: 12px;
  color: var(--ui-text-dimmed);
}

.upload-status {
  margin-top: 16px;
  font-size: 13px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: var(--ui-radius);
  display: inline-block;
}

.upload-status.error {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.1);
}

.upload-status.success {
  color: #059669;
  background: rgba(5, 150, 105, 0.1);
}

/* ========================================
   プレビューセクション
   ======================================== */
.preview-section {
  margin-top: 0;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ui-text-highlighted);
  margin-bottom: 12px;
}

.preview-icon {
  font-size: 16px;
  color: var(--ui-text-muted);
}

.empty-cell {
  text-align: center;
  color: var(--ui-text-muted);
  padding: 24px !important;
}

/* ========================================
   レスポンシブ
   ======================================== */
@media (max-width: 1024px) {
  .data-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .data-stats-grid {
    grid-template-columns: 1fr;
  }

  .upload-buttons {
    flex-direction: column;
    align-items: center;
  }
}
</style>
