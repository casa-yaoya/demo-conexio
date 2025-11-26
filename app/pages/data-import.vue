<template>
  <div class="p-5">
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold text-gray-800">データ読込</h2>
      </template>

      <!-- Current Data Info -->
      <div class="data-info-grid mb-6">
        <div>
          <div class="data-info-label">総レコード数</div>
          <div class="data-info-value">{{ dataStats.recordCount.toLocaleString() }}</div>
        </div>
        <div>
          <div class="data-info-label">プレイヤー数</div>
          <div class="data-info-value">{{ dataStats.playerCount.toLocaleString() }}</div>
        </div>
        <div>
          <div class="data-info-label">レッスン数</div>
          <div class="data-info-value">{{ dataStats.lessonCount.toLocaleString() }}</div>
        </div>
        <div>
          <div class="data-info-label">期間</div>
          <div class="data-info-value-sm">{{ dataStats.dateRange }}</div>
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
        <div class="flex gap-3 justify-center flex-wrap">
          <UButton
            color="primary"
            icon="i-lucide-file-up"
            @click="selectCSVFile"
          >
            CSVファイルを選択
          </UButton>
          <UButton
            color="success"
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
      <div class="mt-6">
        <h3 class="font-semibold mb-3">データプレビュー（最新10件）</h3>
        <div class="overflow-x-auto">
          <table class="data-table text-xs">
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
                <td colspan="5" class="text-center text-gray-600">データがありません</td>
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
.data-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.data-info-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.data-info-value {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.data-info-value-sm {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.upload-area {
  background: #f9fafb;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
}

.upload-hint {
  margin-top: 12px;
  font-size: 12px;
  color: #6b7280;
}

.upload-status {
  margin-top: 12px;
  font-size: 14px;
  color: #059669;
}

.upload-status.error {
  color: #dc2626;
}

.upload-status.success {
  color: #059669;
}
</style>
