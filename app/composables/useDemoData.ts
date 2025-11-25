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

  return {
    allSessions,
    isDataLoaded,
    loadDemoData,
    getPlayerStats,
    getRankingData,
    getLogData,
    getDataStats,
    getSummaryDataByLesson,
    getSummaryDataByLevel,
    getSummaryDataByCategory
  }
}
