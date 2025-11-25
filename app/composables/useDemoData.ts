export interface SessionData {
  date: Date
  org: string
  account: string
  group: string
  player: string
  category: string
  level: string
  lesson: string
  score: number
  speechTime: number
  playTime: number
}

export const useDemoData = () => {
  const allSessions = useState<SessionData[]>('allSessions', () => [])
  const isDataLoaded = useState<boolean>('isDataLoaded', () => false)

  const parseCSV = (csvText: string): SessionData[] => {
    const lines = csvText.trim().split('\n')
    const sessions: SessionData[] = []

    // Skip header row (index 0)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Split by comma, handling potential commas in quoted fields
      const values = line.split(',')

      if (values.length < 11) continue

      try {
        const session: SessionData = {
          date: new Date(values[0]),
          org: values[1],
          account: values[2],
          group: values[3],
          player: values[4],
          category: values[5],
          level: values[6],
          lesson: values[7],
          score: parseInt(values[8]) || 0,
          speechTime: parseInt(values[9]) || 0,
          playTime: parseFloat(values[10]) || 0
        }

        if (!isNaN(session.date.getTime())) {
          sessions.push(session)
        }
      } catch (error) {
        console.warn('Failed to parse line:', line, error)
      }
    }

    return sessions
  }

  const loadDemoData = async () => {
    try {
      const response = await fetch('/demo-data.csv')
      if (!response.ok) {
        throw new Error('デモデータファイルが見つかりません')
      }

      const csvText = await response.text()
      allSessions.value = parseCSV(csvText)
      isDataLoaded.value = true

      console.log(`✓ ${allSessions.value.length}件のデモデータを読み込みました`)

      return allSessions.value
    } catch (error) {
      console.error('Demo data load error:', error)
      throw error
    }
  }

  // CSVファイルから直接読み込み
  const loadFromCSVFile = async (file: File): Promise<SessionData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          const csvText = event.target?.result as string
          const sessions = parseCSV(csvText)

          if (sessions.length === 0) {
            reject(new Error('CSVファイルからデータを読み取れませんでした'))
            return
          }

          allSessions.value = sessions
          isDataLoaded.value = true

          console.log(`✓ ${sessions.length}件のデータをCSVファイルから読み込みました`)
          resolve(sessions)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => {
        reject(new Error('ファイルの読み込みに失敗しました'))
      }

      reader.readAsText(file, 'UTF-8')
    })
  }

  // データをクリア
  const clearData = () => {
    allSessions.value = []
    isDataLoaded.value = false
  }

  const getPlayerStats = () => {
    const playerMap = new Map<string, {
      org: string
      totalPlays: number
      totalScore: number
      totalPlayTime: number
    }>()

    allSessions.value.forEach(session => {
      const existing = playerMap.get(session.player)
      if (existing) {
        existing.totalPlays++
        existing.totalScore += session.score
        existing.totalPlayTime += session.playTime
      } else {
        playerMap.set(session.player, {
          org: session.org,
          totalPlays: 1,
          totalScore: session.score,
          totalPlayTime: session.playTime
        })
      }
    })

    return Array.from(playerMap.entries()).map(([player, stats]) => ({
      player,
      org: stats.org,
      totalPlays: stats.totalPlays,
      avgScore: Math.round(stats.totalScore / stats.totalPlays),
      totalPlayTime: Math.round(stats.totalPlayTime)
    }))
  }

  const getRankingData = () => {
    const stats = getPlayerStats()
    return stats
      .sort((a, b) => b.avgScore - a.avgScore)
      .map((item, index) => ({
        rank: index + 1,
        ...item,
        totalScore: item.avgScore * item.totalPlays
      }))
  }

  const getLogData = (page: number = 1, pageSize: number = 20) => {
    const sorted = [...allSessions.value].sort((a, b) => b.date.getTime() - a.date.getTime())
    const start = (page - 1) * pageSize
    const end = start + pageSize

    return {
      data: sorted.slice(start, end),
      total: sorted.length,
      totalPages: Math.ceil(sorted.length / pageSize)
    }
  }

  const getDataStats = () => {
    if (allSessions.value.length === 0) {
      return {
        recordCount: 0,
        playerCount: 0,
        lessonCount: 0,
        dateRange: '-'
      }
    }

    const players = new Set(allSessions.value.map(s => s.player))
    const lessons = new Set(allSessions.value.map(s => `${s.category}|${s.level}|${s.lesson}`))

    const dates = allSessions.value.map(s => s.date.getTime())
    const minDate = new Date(Math.min(...dates))
    const maxDate = new Date(Math.max(...dates))

    return {
      recordCount: allSessions.value.length,
      playerCount: players.size,
      lessonCount: lessons.size,
      dateRange: `${minDate.toLocaleDateString('ja-JP')} 〜 ${maxDate.toLocaleDateString('ja-JP')}`
    }
  }

  const getSummaryDataByLesson = () => {
    const lessonMap = new Map<string, {
      playCount: number
      totalScore: number
      category: string
      level: string
    }>()

    allSessions.value.forEach(session => {
      const key = session.lesson
      const existing = lessonMap.get(key)

      if (existing) {
        existing.playCount++
        existing.totalScore += session.score
      } else {
        lessonMap.set(key, {
          playCount: 1,
          totalScore: session.score,
          category: session.category,
          level: session.level
        })
      }
    })

    return Array.from(lessonMap.entries()).map(([lesson, stats]) => ({
      lesson,
      category: stats.category,
      level: stats.level,
      playCount: stats.playCount,
      avgScore: Math.round(stats.totalScore / stats.playCount)
    }))
  }

  const getSummaryDataByLevel = () => {
    const levelMap = new Map<string, {
      playCount: number
      totalScore: number
      category: string
    }>()

    allSessions.value.forEach(session => {
      const key = `${session.category} - Lv.${session.level}`
      const existing = levelMap.get(key)

      if (existing) {
        existing.playCount++
        existing.totalScore += session.score
      } else {
        levelMap.set(key, {
          playCount: 1,
          totalScore: session.score,
          category: session.category
        })
      }
    })

    return Array.from(levelMap.entries()).map(([level, stats]) => ({
      level,
      category: stats.category,
      playCount: stats.playCount,
      avgScore: Math.round(stats.totalScore / stats.playCount)
    }))
  }

  const getSummaryDataByCategory = () => {
    const categoryMap = new Map<string, {
      playCount: number
      totalScore: number
    }>()

    allSessions.value.forEach(session => {
      const existing = categoryMap.get(session.category)

      if (existing) {
        existing.playCount++
        existing.totalScore += session.score
      } else {
        categoryMap.set(session.category, {
          playCount: 1,
          totalScore: session.score
        })
      }
    })

    return Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      playCount: stats.playCount,
      avgScore: Math.round(stats.totalScore / stats.playCount)
    }))
  }

  // フィルター用のユニークな値を取得
  const getFilterOptions = () => {
    const categories = new Set<string>()
    const levels = new Map<string, Set<string>>() // category -> levels
    const lessons = new Map<string, Set<string>>() // category|level -> lessons
    const players = new Set<string>()
    const accounts = new Set<string>()
    const groups = new Set<string>()
    const accountGroups = new Map<string, Set<string>>() // account -> groups
    const groupPlayers = new Map<string, Set<string>>() // account|group -> players

    allSessions.value.forEach(session => {
      categories.add(session.category)
      players.add(session.player)
      accounts.add(session.account)
      groups.add(session.group)

      // groups per account
      if (!accountGroups.has(session.account)) {
        accountGroups.set(session.account, new Set())
      }
      accountGroups.get(session.account)!.add(session.group)

      // players per account|group
      const groupKey = `${session.account}|${session.group}`
      if (!groupPlayers.has(groupKey)) {
        groupPlayers.set(groupKey, new Set())
      }
      groupPlayers.get(groupKey)!.add(session.player)

      // levels per category
      if (!levels.has(session.category)) {
        levels.set(session.category, new Set())
      }
      levels.get(session.category)!.add(session.level)

      // lessons per category|level
      const levelKey = `${session.category}|${session.level}`
      if (!lessons.has(levelKey)) {
        lessons.set(levelKey, new Set())
      }
      lessons.get(levelKey)!.add(session.lesson)
    })

    return {
      categories: Array.from(categories).sort(),
      levels: Object.fromEntries(
        Array.from(levels.entries()).map(([cat, lvls]) => [cat, Array.from(lvls).sort()])
      ),
      lessons: Object.fromEntries(
        Array.from(lessons.entries()).map(([key, lsns]) => [key, Array.from(lsns).sort()])
      ),
      players: Array.from(players).sort(),
      accounts: Array.from(accounts).sort(),
      groups: Array.from(groups).sort(),
      accountGroups: Object.fromEntries(
        Array.from(accountGroups.entries()).map(([acc, grps]) => [acc, Array.from(grps).sort()])
      ),
      groupPlayers: Object.fromEntries(
        Array.from(groupPlayers.entries()).map(([key, plrs]) => [key, Array.from(plrs).sort()])
      )
    }
  }

  // 日付範囲を取得
  const getDateRange = () => {
    if (allSessions.value.length === 0) {
      return { min: null, max: null }
    }

    const dates = allSessions.value.map(s => s.date.getTime())
    return {
      min: new Date(Math.min(...dates)),
      max: new Date(Math.max(...dates))
    }
  }

  // フィルター適用済みサマリーデータ取得
  const getFilteredSummaryData = (
    unit: 'lesson' | 'level' | 'category',
    filters: {
      category?: string
      level?: string
      lesson?: string
      lessons?: string[] // 複数レッスン選択用
      levels?: string[] // 複数レベル選択用（レベルで絞り込み機能）
      players?: string[]
      dateFrom?: Date | null
      dateTo?: Date | null
    }
  ) => {
    let filtered = [...allSessions.value]

    // カテゴリーフィルター（単一）
    if (filters.category) {
      filtered = filtered.filter(s => s.category === filters.category)
    }

    // レベルフィルター（単一）
    if (filters.level) {
      filtered = filtered.filter(s => s.level === filters.level)
    }

    // レベルフィルター（複数 - レベルで絞り込み機能）
    if (filters.levels && filters.levels.length > 0) {
      const levelSet = new Set(filters.levels)
      filtered = filtered.filter(s => levelSet.has(s.level))
    }

    // レッスンフィルター（単一）
    if (filters.lesson) {
      filtered = filtered.filter(s => s.lesson === filters.lesson)
    }

    // レッスンフィルター（複数）
    if (filters.lessons && filters.lessons.length > 0) {
      const lessonSet = new Set(filters.lessons)
      filtered = filtered.filter(s => lessonSet.has(s.lesson))
    }

    // プレイヤーフィルター
    if (filters.players && filters.players.length > 0) {
      const playerSet = new Set(filters.players)
      filtered = filtered.filter(s => playerSet.has(s.player))
    }

    // 日付フィルター
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      fromDate.setHours(0, 0, 0, 0)
      filtered = filtered.filter(s => s.date >= fromDate)
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(s => s.date <= toDate)
    }

    // 集計
    const aggregateMap = new Map<string, {
      playCount: number
      totalScore: number
      bestScore: number
      totalSpeechTime: number
      totalPlayTime: number
      category: string
      levels: Set<string>
      lessons: Set<string>
      playerScores: Map<string, number> // プレイヤーごとの総スコア
    }>()

    filtered.forEach(session => {
      let key: string

      switch (unit) {
        case 'lesson':
          key = session.lesson
          break
        case 'level':
          key = `${session.category}|Lv.${session.level}`
          break
        case 'category':
          key = session.category
          break
        default:
          key = session.lesson
      }

      const existing = aggregateMap.get(key)
      if (existing) {
        existing.playCount++
        existing.totalScore += session.score
        existing.bestScore = Math.max(existing.bestScore, session.score)
        existing.totalSpeechTime += session.speechTime
        existing.totalPlayTime += session.playTime
        existing.levels.add(`Lv.${session.level}`)
        existing.lessons.add(session.lesson)
        // プレイヤースコア加算
        const currentPlayerScore = existing.playerScores.get(session.player) || 0
        existing.playerScores.set(session.player, currentPlayerScore + session.score)
      } else {
        const playerScores = new Map<string, number>()
        playerScores.set(session.player, session.score)
        aggregateMap.set(key, {
          playCount: 1,
          totalScore: session.score,
          bestScore: session.score,
          totalSpeechTime: session.speechTime,
          totalPlayTime: session.playTime,
          category: session.category,
          levels: new Set([`Lv.${session.level}`]),
          lessons: new Set([session.lesson]),
          playerScores
        })
      }
    })

    return Array.from(aggregateMap.entries()).map(([key, stats]) => {
      // 表示用のレベルとレッスン（改行区切り）
      const levelsArray = Array.from(stats.levels).sort()
      const lessonsArray = Array.from(stats.lessons).sort()

      let levelDisplay: string
      let lessonDisplay: string

      switch (unit) {
        case 'lesson':
          // レッスン単位：レベルは1つ、レッスンも1つ
          levelDisplay = levelsArray[0] || ''
          lessonDisplay = key
          break
        case 'level':
          // レベル単位：レベルは1つ、レッスンは複数を改行で表示
          levelDisplay = key.split('|')[1] || ''
          lessonDisplay = lessonsArray.join('\n')
          break
        case 'category':
          // カテゴリー単位：レベルは複数を改行、レッスンも複数を改行
          levelDisplay = levelsArray.join('\n')
          lessonDisplay = lessonsArray.join('\n')
          break
        default:
          levelDisplay = levelsArray[0] || ''
          lessonDisplay = key
      }

      // ベストスコアラー（総スコアが最も高いプレイヤー）を取得
      let bestScorer = '-'
      let maxScore = 0
      stats.playerScores.forEach((score, player) => {
        if (score > maxScore) {
          maxScore = score
          bestScorer = player
        }
      })

      return {
        category: stats.category,
        levelDisplay,
        lessonDisplay,
        playCount: stats.playCount,
        avgScore: Math.round(stats.totalScore / stats.playCount),
        bestScore: stats.bestScore,
        totalPlayTime: stats.totalPlayTime,
        avgPlayTime: Math.round(stats.totalPlayTime / stats.playCount),
        bestScorer
      }
    })
  }

  // フィルター適用のヘルパー関数
  const applyFilters = (
    sessions: typeof allSessions.value,
    filters: {
      lessons?: string[]
      levels?: string[]
      players?: string[]
      dateFrom?: Date | null
      dateTo?: Date | null
    }
  ) => {
    let filtered = [...sessions]

    // レベルフィルター（複数）
    if (filters.levels && filters.levels.length > 0) {
      const levelSet = new Set(filters.levels)
      filtered = filtered.filter(s => levelSet.has(s.level))
    }

    // レッスンフィルター（複数）
    if (filters.lessons && filters.lessons.length > 0) {
      const lessonSet = new Set(filters.lessons)
      filtered = filtered.filter(s => lessonSet.has(s.lesson))
    }

    // プレイヤーフィルター
    if (filters.players && filters.players.length > 0) {
      const playerSet = new Set(filters.players)
      filtered = filtered.filter(s => playerSet.has(s.player))
    }

    // 日付フィルター
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      fromDate.setHours(0, 0, 0, 0)
      filtered = filtered.filter(s => s.date >= fromDate)
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(s => s.date <= toDate)
    }

    return filtered
  }

  // フィルター適用済みプレイヤー統計データ取得
  const getFilteredPlayerStats = (filters: {
    lessons?: string[]
    levels?: string[]
    players?: string[]
    dateFrom?: Date | null
    dateTo?: Date | null
  }) => {
    const filtered = applyFilters(allSessions.value, filters)

    const playerMap = new Map<string, {
      org: string
      group: string
      totalPlays: number
      clearCount: number
      totalScore: number
      totalPlayTime: number
      totalSpeechTime: number
    }>()

    filtered.forEach(session => {
      const existing = playerMap.get(session.player)
      const isClear = session.score >= 70 // スコア70以上をクリアとみなす
      if (existing) {
        existing.totalPlays++
        if (isClear) existing.clearCount++
        existing.totalScore += session.score
        existing.totalPlayTime += session.playTime
        existing.totalSpeechTime += session.speechTime
      } else {
        playerMap.set(session.player, {
          org: session.org,
          group: session.group,
          totalPlays: 1,
          clearCount: isClear ? 1 : 0,
          totalScore: session.score,
          totalPlayTime: session.playTime,
          totalSpeechTime: session.speechTime
        })
      }
    })

    return Array.from(playerMap.entries()).map(([player, stats]) => ({
      player,
      org: stats.org,
      group: stats.group,
      totalPlays: stats.totalPlays,
      clearCount: stats.clearCount,
      avgScore: Math.round(stats.totalScore / stats.totalPlays),
      totalPlayTime: Math.round(stats.totalPlayTime),
      totalSpeechTime: Math.round(stats.totalSpeechTime)
    }))
  }

  // フィルター適用済みランキングデータ取得
  const getFilteredRankingData = (filters: {
    lessons?: string[]
    levels?: string[]
    players?: string[]
    dateFrom?: Date | null
    dateTo?: Date | null
  }) => {
    const stats = getFilteredPlayerStats(filters)
    return stats
      .sort((a, b) => b.avgScore - a.avgScore)
      .map((item, index) => ({
        rank: index + 1,
        player: item.player,
        org: item.org,
        group: item.group,
        totalScore: item.avgScore * item.totalPlays,
        totalPlays: item.totalPlays,
        clearCount: item.clearCount,
        avgScore: item.avgScore,
        totalPlayTime: item.totalPlayTime,
        totalSpeechTime: item.totalSpeechTime
      }))
  }

  // フィルター適用済みログデータ取得
  const getFilteredLogData = (
    page: number = 1,
    pageSize: number = 20,
    filters: {
      lessons?: string[]
      levels?: string[]
      players?: string[]
      dateFrom?: Date | null
      dateTo?: Date | null
    }
  ) => {
    const filtered = applyFilters(allSessions.value, filters)
    const sorted = [...filtered].sort((a, b) => b.date.getTime() - a.date.getTime())
    const start = (page - 1) * pageSize
    const end = start + pageSize

    return {
      data: sorted.slice(start, end),
      total: sorted.length,
      totalPages: Math.ceil(sorted.length / pageSize)
    }
  }

  // フィルタリングされた集計統計を取得
  const getFilteredAggregatedStats = (filters: {
    lessons?: string[]
    levels?: string[]
    players?: string[]
    dateFrom?: Date | null
    dateTo?: Date | null
  }) => {
    const filtered = applyFilters(allSessions.value, filters)

    if (filtered.length === 0) {
      return {
        totalPlayTime: 0,
        playCount: 0,
        playerCount: 0,
        lessonCount: 0
      }
    }

    const players = new Set(filtered.map(s => s.player))
    const lessons = new Set(filtered.map(s => `${s.category}|${s.level}|${s.lesson}`))
    const totalPlayTime = filtered.reduce((sum, s) => sum + s.playTime, 0)

    return {
      totalPlayTime,
      playCount: filtered.length,
      playerCount: players.size,
      lessonCount: lessons.size
    }
  }

  // プレイヤー詳細データを取得
  const getPlayerDetails = (playerName: string) => {
    const playerSessions = allSessions.value.filter(s => s.player === playerName)

    if (playerSessions.length === 0) {
      return null
    }

    // 基本統計
    const totalPlays = playerSessions.length
    const totalScore = playerSessions.reduce((sum, s) => sum + s.score, 0)
    const avgScore = Math.round(totalScore / totalPlays)
    const totalPlayTime = playerSessions.reduce((sum, s) => sum + s.playTime, 0)
    const totalSpeechTime = playerSessions.reduce((sum, s) => sum + s.speechTime, 0)

    // 組織情報
    const org = playerSessions[0].org
    const account = playerSessions[0].account
    const group = playerSessions[0].group

    // 日付範囲
    const dates = playerSessions.map(s => s.date.getTime())
    const firstPlay = new Date(Math.min(...dates))
    const lastPlay = new Date(Math.max(...dates))

    // カテゴリー別統計
    const categoryStats = new Map<string, { playCount: number; totalScore: number }>()
    playerSessions.forEach(session => {
      const existing = categoryStats.get(session.category)
      if (existing) {
        existing.playCount++
        existing.totalScore += session.score
      } else {
        categoryStats.set(session.category, {
          playCount: 1,
          totalScore: session.score
        })
      }
    })

    const categoryBreakdown = Array.from(categoryStats.entries()).map(([category, stats]) => ({
      category,
      playCount: stats.playCount,
      avgScore: Math.round(stats.totalScore / stats.playCount)
    }))

    // レッスン別統計
    const lessonStats = new Map<string, { playCount: number; totalScore: number; category: string; level: string }>()
    playerSessions.forEach(session => {
      const existing = lessonStats.get(session.lesson)
      if (existing) {
        existing.playCount++
        existing.totalScore += session.score
      } else {
        lessonStats.set(session.lesson, {
          playCount: 1,
          totalScore: session.score,
          category: session.category,
          level: session.level
        })
      }
    })

    const lessonBreakdown = Array.from(lessonStats.entries()).map(([lesson, stats]) => ({
      lesson,
      category: stats.category,
      level: stats.level,
      playCount: stats.playCount,
      avgScore: Math.round(stats.totalScore / stats.playCount)
    }))

    // 月別トレンド
    const monthlyStats = new Map<string, { playCount: number; totalScore: number }>()
    playerSessions.forEach(session => {
      const month = `${session.date.getFullYear()}/${String(session.date.getMonth() + 1).padStart(2, '0')}`
      const existing = monthlyStats.get(month)
      if (existing) {
        existing.playCount++
        existing.totalScore += session.score
      } else {
        monthlyStats.set(month, {
          playCount: 1,
          totalScore: session.score
        })
      }
    })

    const sortedMonthly = Array.from(monthlyStats.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    const monthlyTrend = {
      labels: sortedMonthly.map(([month]) => month),
      playCountData: sortedMonthly.map(([_, stats]) => stats.playCount),
      avgScoreData: sortedMonthly.map(([_, stats]) => Math.round(stats.totalScore / stats.playCount))
    }

    // 直近のセッション（最新10件）
    const recentSessions = [...playerSessions]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10)

    return {
      player: playerName,
      org,
      account,
      group,
      totalPlays,
      avgScore,
      totalPlayTime: Math.round(totalPlayTime),
      totalSpeechTime: Math.round(totalSpeechTime),
      firstPlay,
      lastPlay,
      categoryBreakdown,
      lessonBreakdown,
      monthlyTrend,
      recentSessions
    }
  }

  // 月別トレンドデータを取得
  const getMonthlyTrendData = () => {
    const monthMap = new Map<string, {
      playCount: number
      clearCount: number  // スコア70以上をクリアとみなす
      totalScore: number
      scoreCount: number
      bestScore: number
      uniquePlayers: Set<string>
    }>()

    allSessions.value.forEach(session => {
      // 元の実装と同じフォーマット: "YYYY-MM"
      const monthKey = `${session.date.getFullYear()}-${String(session.date.getMonth() + 1).padStart(2, '0')}`
      const existing = monthMap.get(monthKey)

      if (existing) {
        existing.playCount++
        if (session.score >= 70) existing.clearCount++
        existing.totalScore += session.score
        existing.scoreCount++
        if (session.score > existing.bestScore) existing.bestScore = session.score
        existing.uniquePlayers.add(session.player)
      } else {
        monthMap.set(monthKey, {
          playCount: 1,
          clearCount: session.score >= 70 ? 1 : 0,
          totalScore: session.score,
          scoreCount: 1,
          bestScore: session.score,
          uniquePlayers: new Set([session.player])
        })
      }
    })

    // 月順にソート
    const sortedMonths = Array.from(monthMap.keys()).sort()

    // 最小6ヶ月表示の処理
    let months = [...sortedMonths]
    if (months.length > 0 && months.length < 6) {
      const monthsToAdd = 6 - months.length
      const [year, month] = months[0].split('-').map(Number)
      const startDate = new Date(year, month - 1, 1)

      // 前の月を追加
      const allMonths: string[] = []
      for (let i = monthsToAdd; i > 0; i--) {
        const targetDate = new Date(startDate)
        targetDate.setMonth(startDate.getMonth() - i)
        const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`
        allMonths.push(monthKey)
      }
      months = [...allMonths, ...months]
    }

    // ラベルを「X月」形式に変換
    const labels = months.map(m => {
      const [, month] = m.split('-')
      return `${parseInt(month)}月`
    })

    // データ準備（データがない月はnullを使用 - 折れ線グラフで線がつながらない）
    const playCountData = months.map(m => {
      const data = monthMap.get(m)
      return data ? data.playCount : null
    })

    const clearCountData = months.map(m => {
      const data = monthMap.get(m)
      return data ? data.clearCount : null
    })

    const avgScoreData = months.map(m => {
      const data = monthMap.get(m)
      if (data && data.scoreCount > 0) {
        return parseFloat((data.totalScore / data.scoreCount).toFixed(1))
      }
      return null  // データがない月は非表示
    })

    const bestScoreData = months.map(m => {
      const data = monthMap.get(m)
      return data ? data.bestScore : null
    })

    const uniquePlayerData = months.map(m => {
      const data = monthMap.get(m)
      return data ? data.uniquePlayers.size : null
    })

    return {
      labels,
      playCountData,
      clearCountData,
      avgScoreData,
      bestScoreData,
      uniquePlayerData
    }
  }

  return {
    allSessions,
    isDataLoaded,
    loadDemoData,
    loadFromCSVFile,
    clearData,
    getPlayerStats,
    getPlayerDetails,
    getRankingData,
    getLogData,
    getDataStats,
    getSummaryDataByLesson,
    getSummaryDataByLevel,
    getSummaryDataByCategory,
    getMonthlyTrendData,
    getFilterOptions,
    getDateRange,
    getFilteredSummaryData,
    getFilteredPlayerStats,
    getFilteredRankingData,
    getFilteredLogData,
    getFilteredAggregatedStats
  }
}
