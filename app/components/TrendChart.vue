<template>
  <div class="trend-chart-container">
    <Bar v-if="hasBarData" :data="chartData" :options="chartOptions" />
    <Line v-else :data="chartData" :options="lineOnlyChartOptions" />
  </div>
</template>

<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Bar, Line } from 'vue-chartjs'

// Chart.jsコンポーネントを登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface DatasetConfig {
  label: string
  data: (number | null)[]
  borderColor?: string
  backgroundColor?: string
  type?: 'line' | 'bar' | 'area'
  yAxisID?: string
  order?: number  // 描画順序（小さいほど手前）
}

const props = defineProps<{
  labels: string[]
  datasets: DatasetConfig[]
}>()

// 棒グラフデータがあるかどうか
const hasBarData = computed(() =>
  props.datasets.some(ds => ds.type === 'bar')
)

// 最小6ヶ月表示の処理を含むラベル
const processedLabels = computed(() => {
  const labels = [...props.labels]

  // 6ヶ月未満の場合、前の月を追加
  if (labels.length > 0 && labels.length < 6) {
    const monthsToAdd = 6 - labels.length
    const firstLabel = labels[0]

    // "X月" 形式からX月を抽出
    const match = firstLabel.match(/(\d+)月/)
    if (match) {
      let month = parseInt(match[1])

      // 前の月を追加
      for (let i = monthsToAdd; i > 0; i--) {
        month = month - 1
        if (month < 1) month = 12
        labels.unshift(`${month}月`)
      }
    }
  }

  return labels
})

// データセットも同様に調整
const processedDatasets = computed(() => {
  const originalLength = props.labels.length
  const addedMonths = processedLabels.value.length - originalLength

  return props.datasets.map((dataset, index) => {
    // 前に追加された月の分、nullを先頭に追加
    const data = addedMonths > 0
      ? [...Array(addedMonths).fill(null), ...dataset.data]
      : [...dataset.data]

    const isBarType = dataset.type === 'bar'
    const isAreaType = dataset.type === 'area'
    const isLineType = dataset.type === 'line' || (!dataset.type && !isBarType && !isAreaType)

    const baseConfig = {
      label: dataset.label,
      data: data,
      borderColor: dataset.borderColor || getDefaultColor(index),
      yAxisID: dataset.yAxisID || 'y',
      order: dataset.order ?? index  // 描画順序
    }

    if (isBarType) {
      return {
        ...baseConfig,
        type: 'bar' as const,
        backgroundColor: dataset.backgroundColor || 'rgba(251, 146, 60, 0.6)',
        borderWidth: 1
      }
    } else if (isAreaType) {
      // 面グラフ（塗りつぶしのある折れ線グラフ）
      return {
        ...baseConfig,
        type: 'line' as const,
        backgroundColor: dataset.backgroundColor || 'rgba(59, 130, 246, 0.3)',
        tension: 0.3,         // 少し滑らかな曲線
        pointRadius: 3,
        pointHoverRadius: 5,
        spanGaps: false,
        fill: true            // 面グラフとして塗りつぶす
      }
    } else {
      return {
        ...baseConfig,
        type: 'line' as const,
        backgroundColor: 'transparent',
        tension: 0,           // 直線で点を結ぶ（曲線にしない）
        pointRadius: 4,
        pointHoverRadius: 6,
        spanGaps: false,      // データがない点は線でつながない
        fill: false
      }
    }
  })
})

const chartData = computed(() => ({
  labels: processedLabels.value,
  datasets: processedDatasets.value
}))

// 複合チャート（棒グラフ+折れ線）用オプション
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false
  },
  barPercentage: 0.6,      // 棒グラフの幅（0.0〜1.0）
  categoryPercentage: 0.7, // カテゴリ内での棒の幅
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 15,
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleFont: {
        size: 13
      },
      bodyFont: {
        size: 12
      },
      padding: 12,
      cornerRadius: 8
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: {
          size: 11
        }
      }
    },
    y: {
      type: 'linear' as const,
      display: true,
      position: 'left' as const,
      title: {
        display: true,
        text: '回数/人数'
      },
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)'
      },
      ticks: {
        font: {
          size: 11
        }
      }
    },
    y1: {
      type: 'linear' as const,
      display: true,
      position: 'right' as const,
      title: {
        display: true,
        text: 'スコア'
      },
      min: 0,
      max: 110,  // 100点満点だが上部に余白を確保
      grid: {
        drawOnChartArea: false  // 右軸のグリッド線は非表示
      },
      ticks: {
        font: {
          size: 11
        },
        stepSize: 20,  // 0, 20, 40, 60, 80, 100 で表示
        callback: function(value: number) {
          return value <= 100 ? value : ''  // 100より大きい値は非表示
        }
      }
    }
  }
}

// 折れ線グラフのみの場合のオプション（二軸不要）
const lineOnlyChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false
  },
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 15,
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleFont: {
        size: 13
      },
      bodyFont: {
        size: 12
      },
      padding: 12,
      cornerRadius: 8
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: {
          size: 11
        }
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)'
      },
      ticks: {
        font: {
          size: 11
        }
      }
    }
  }
}

function getDefaultColor(index: number): string {
  const colors = [
    '#3b82f6', // blue - プレイ回数
    '#10b981', // green - クリア回数
    '#f97316', // orange - 平均スコア
    '#ef4444', // red
    '#8b5cf6', // violet
    '#06b6d4'  // cyan
  ]
  return colors[index % colors.length]
}
</script>

<style scoped>
.trend-chart-container {
  height: 250px;
  width: 100%;
}
</style>
