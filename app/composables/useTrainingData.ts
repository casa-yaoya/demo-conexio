// Training data management composable
// 処理ID: CSV-001, CSV-002, CSV-003

import type {
  TrainingSession,
  TrainingFilter,
  TrainingStats,
  AggregatedData,
  MonthlyTrend,
  PlayerRecord,
  RankingEntry,
  LogEntry,
  LessonHierarchy,
  PlayerHierarchy
} from '~/types/training'

// Global state for training data
const trainingData = ref<TrainingSession[]>([])
const isLoading = ref(false)
const loadError = ref<string | null>(null)

// Filter state
const filter = ref<TrainingFilter>({
  lessons: {},
  players: {},
  startMonth: null,
  endMonth: null
})

export const useTrainingData = () => {
  // Computed stats
  const stats = computed<TrainingStats>(() => {
    const data = trainingData.value
    if (data.length === 0) {
      return {
        recordCount: 0,
        playerCount: 0,
        lessonCount: 0,
        dateRange: { min: null, max: null }
      }
    }

    const players = new Set(data.map(d => d.player))
    const lessons = new Set(data.map(d => d.lesson))
    const dates = data.map(d => d.date.getTime())

    return {
      recordCount: data.length,
      playerCount: players.size,
      lessonCount: lessons.size,
      dateRange: {
        min: new Date(Math.min(...dates)),
        max: new Date(Math.max(...dates))
      }
    }
  })

  // Build lesson hierarchy for filter
  const lessonHierarchy = computed<LessonHierarchy>(() => {
    const hierarchy: LessonHierarchy = {}
    const data = trainingData.value

    data.forEach(session => {
      const { category, level, lesson } = session
      const levelKey = `Lv.${level}`

      if (!hierarchy[category]) {
        hierarchy[category] = {
          checked: true,
          indeterminate: false,
          levels: {}
        }
      }

      if (!hierarchy[category].levels[levelKey]) {
        hierarchy[category].levels[levelKey] = {
          checked: true,
          indeterminate: false,
          lessons: {}
        }
      }

      if (!hierarchy[category].levels[levelKey].lessons[lesson]) {
        hierarchy[category].levels[levelKey].lessons[lesson] = true
      }
    })

    return hierarchy
  })

  // Build player hierarchy for filter
  const playerHierarchy = computed<PlayerHierarchy>(() => {
    const hierarchy: PlayerHierarchy = {}
    const data = trainingData.value

    data.forEach(session => {
      const { org, account, group, player } = session

      if (!hierarchy[org]) {
        hierarchy[org] = {
          checked: true,
          indeterminate: false,
          accounts: {}
        }
      }

      if (!hierarchy[org].accounts[account]) {
        hierarchy[org].accounts[account] = {
          checked: true,
          indeterminate: false,
          groups: {}
        }
      }

      if (!hierarchy[org].accounts[account].groups[group]) {
        hierarchy[org].accounts[account].groups[group] = {
          checked: true,
          indeterminate: false,
          players: {}
        }
      }

      if (!hierarchy[org].accounts[account].groups[group].players[player]) {
        hierarchy[org].accounts[account].groups[group].players[player] = true
      }
    })

    return hierarchy
  })

  // Filtered data based on current filter settings
  const filteredData = computed<TrainingSession[]>(() => {
    let data = trainingData.value

    // Filter by date range
    if (filter.value.startMonth) {
      const startDate = new Date(filter.value.startMonth + '-01')
      data = data.filter(d => d.date >= startDate)
    }

    if (filter.value.endMonth) {
      const endDate = new Date(filter.value.endMonth + '-01')
      endDate.setMonth(endDate.getMonth() + 1)
      endDate.setDate(0) // Last day of month
      data = data.filter(d => d.date <= endDate)
    }

    // Filter by lessons (if any are unchecked)
    const lessonFilter = filter.value.lessons
    if (Object.keys(lessonFilter).length > 0) {
      data = data.filter(d => {
        const key = `${d.category}|Lv.${d.level}|${d.lesson}`
        return lessonFilter[key] !== false
      })
    }

    // Filter by players (if any are unchecked)
    const playerFilter = filter.value.players
    if (Object.keys(playerFilter).length > 0) {
      data = data.filter(d => {
        const key = `${d.org}|${d.account}|${d.group}|${d.player}`
        return playerFilter[key] !== false
      })
    }

    return data
  })

  // Parse CSV data (処理ID: CSV-001)
  const parseCSV = async (csvText: string): Promise<void> => {
    isLoading.value = true
    loadError.value = null

    try {
      const lines = csvText.trim().split('\n')
      if (lines.length < 2) {
        throw new Error('CSVデータが空または不正です')
      }

      // Skip header
      const dataLines = lines.slice(1)
      const sessions: TrainingSession[] = []
      const batchSize = 100

      for (let i = 0; i < dataLines.length; i += batchSize) {
        const batch = dataLines.slice(i, i + batchSize)

        for (const line of batch) {
          const cols = line.split(',').map(c => c.trim())
          if (cols.length < 11) continue

          const [dateStr, org, account, group, player, category, levelStr, lesson, scoreStr, speechTimeStr, playTimeStr] = cols

          const session: TrainingSession = {
            date: new Date(dateStr),
            org: org || '',
            account: account || '',
            group: group || '',
            player: player || '',
            category: category || '',
            level: parseInt(levelStr) || 1,
            lesson: lesson || '',
            score: parseInt(scoreStr) || 0,
            speechTime: parseFloat(speechTimeStr) || 0,
            playTime: parseFloat(playTimeStr) || 0
          }

          // Validate date
          if (!isNaN(session.date.getTime())) {
            sessions.push(session)
          }
        }

        // Allow UI to update
        await new Promise(resolve => setTimeout(resolve, 0))
      }

      trainingData.value = sessions
      initializeFilter()
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : 'CSV解析エラー'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // Load CSV file
  const loadCSVFile = async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string
          await parseCSV(text)
          resolve()
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('ファイル読み込みエラー'))
      reader.readAsText(file, 'UTF-8')
    })
  }

  // Load demo data (処理ID: CSV-002)
  const loadDemoData = async (): Promise<void> => {
    isLoading.value = true
    loadError.value = null

    try {
      const response = await fetch('/demo-data.csv')
      if (!response.ok) {
        throw new Error('デモデータの読み込みに失敗しました')
      }
      const text = await response.text()
      await parseCSV(text)
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : 'デモデータ読み込みエラー'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // Initialize filter with default values (処理ID: CSV-003)
  const initializeFilter = () => {
    const data = trainingData.value
    if (data.length === 0) return

    // Find latest date and set date range
    const dates = data.map(d => d.date.getTime())
    const maxDate = new Date(Math.max(...dates))

    const endMonth = `${maxDate.getFullYear()}-${String(maxDate.getMonth() + 1).padStart(2, '0')}`

    const startDate = new Date(maxDate)
    startDate.setMonth(startDate.getMonth() - 5)
    const startMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`

    filter.value = {
      lessons: {},
      players: {},
      startMonth,
      endMonth
    }
  }

  // Update lesson filter
  const updateLessonFilter = (key: string, checked: boolean) => {
    filter.value.lessons = {
      ...filter.value.lessons,
      [key]: checked
    }
  }

  // Update player filter
  const updatePlayerFilter = (key: string, checked: boolean) => {
    filter.value.players = {
      ...filter.value.players,
      [key]: checked
    }
  }

  // Update date filter
  const updateDateFilter = (startMonth: string | null, endMonth: string | null) => {
    filter.value.startMonth = startMonth
    filter.value.endMonth = endMonth
  }

  // Get monthly trends
  const getMonthlyTrends = computed<MonthlyTrend[]>(() => {
    const data = filteredData.value
    if (data.length === 0) return []

    const monthlyData: Record<string, { count: number; totalScore: number }> = {}

    data.forEach(session => {
      const month = `${session.date.getFullYear()}-${String(session.date.getMonth() + 1).padStart(2, '0')}`
      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, totalScore: 0 }
      }
      monthlyData[month].count++
      monthlyData[month].totalScore += session.score
    })

    // Ensure at least 6 months are shown
    const months = Object.keys(monthlyData).sort()
    if (months.length > 0 && months.length < 6) {
      const firstMonth = new Date(months[0] + '-01')
      for (let i = months.length; i < 6; i++) {
        firstMonth.setMonth(firstMonth.getMonth() - 1)
        const month = `${firstMonth.getFullYear()}-${String(firstMonth.getMonth() + 1).padStart(2, '0')}`
        if (!monthlyData[month]) {
          monthlyData[month] = { count: 0, totalScore: 0 }
        }
      }
    }

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, { count, totalScore }]) => ({
        month,
        playCount: count,
        avgScore: count > 0 ? Math.round(totalScore / count) : 0
      }))
  })

  // Get aggregated data by lesson/level/category
  const getAggregatedData = (groupBy: 'lesson' | 'level' | 'category'): AggregatedData[] => {
    const data = filteredData.value
    if (data.length === 0) return []

    const grouped: Record<string, TrainingSession[]> = {}

    data.forEach(session => {
      let key: string
      switch (groupBy) {
        case 'lesson':
          key = session.lesson
          break
        case 'level':
          key = `${session.category} Lv.${session.level}`
          break
        case 'category':
          key = session.category
          break
      }

      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(session)
    })

    return Object.entries(grouped).map(([name, sessions]) => ({
      name,
      playCount: sessions.length,
      avgScore: Math.round(sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length),
      avgSpeechTime: Math.round(sessions.reduce((sum, s) => sum + s.speechTime, 0) / sessions.length * 10) / 10,
      avgPlayTime: Math.round(sessions.reduce((sum, s) => sum + s.playTime, 0) / sessions.length * 10) / 10
    }))
  }

  // Get player records
  const getPlayerRecords = computed<PlayerRecord[]>(() => {
    const data = filteredData.value
    if (data.length === 0) return []

    const playerData: Record<string, TrainingSession[]> = {}

    data.forEach(session => {
      if (!playerData[session.player]) {
        playerData[session.player] = []
      }
      playerData[session.player].push(session)
    })

    return Object.entries(playerData).map(([player, sessions]) => {
      const dates = sessions.map(s => s.date.getTime())
      return {
        player,
        playCount: sessions.length,
        avgScore: Math.round(sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length),
        lastPlayDate: new Date(Math.max(...dates))
      }
    })
  })

  // Get rankings
  const getRankings = computed<RankingEntry[]>(() => {
    const data = filteredData.value
    if (data.length === 0) return []

    const playerData: Record<string, TrainingSession[]> = {}

    data.forEach(session => {
      if (!playerData[session.player]) {
        playerData[session.player] = []
      }
      playerData[session.player].push(session)
    })

    const rankings = Object.entries(playerData)
      .map(([player, sessions]) => ({
        rank: 0,
        player,
        avgScore: Math.round(sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length),
        playCount: sessions.length,
        bestScore: Math.max(...sessions.map(s => s.score))
      }))
      .sort((a, b) => b.avgScore - a.avgScore)

    // Assign ranks
    rankings.forEach((entry, index) => {
      entry.rank = index + 1
    })

    return rankings
  })

  // Get log entries with pagination
  const getLogEntries = (page: number = 1, pageSize: number = 100): { entries: LogEntry[]; totalPages: number; totalCount: number } => {
    const data = filteredData.value
      .map((session, index) => ({
        ...session,
        id: `log-${index}`
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime())

    const totalCount = data.length
    const totalPages = Math.ceil(totalCount / pageSize)
    const start = (page - 1) * pageSize
    const entries = data.slice(start, start + pageSize)

    return { entries, totalPages, totalCount }
  }

  // Get preview data (first 10 records)
  const previewData = computed(() => {
    return trainingData.value.slice(0, 10)
  })

  // Clear all data
  const clearData = () => {
    trainingData.value = []
    filter.value = {
      lessons: {},
      players: {},
      startMonth: null,
      endMonth: null
    }
    loadError.value = null
  }

  return {
    // State
    trainingData: readonly(trainingData),
    isLoading: readonly(isLoading),
    loadError: readonly(loadError),
    filter,
    stats,
    filteredData,
    lessonHierarchy,
    playerHierarchy,
    previewData,

    // Methods
    parseCSV,
    loadCSVFile,
    loadDemoData,
    initializeFilter,
    updateLessonFilter,
    updatePlayerFilter,
    updateDateFilter,
    getAggregatedData,
    getMonthlyTrends,
    getPlayerRecords,
    getRankings,
    getLogEntries,
    clearData
  }
}
