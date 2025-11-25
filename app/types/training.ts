// Training data types for CSV processing and analytics
// 処理ID: CSV-001, CSV-002, CSV-003

export interface TrainingSession {
  date: Date
  org: string
  account: string
  group: string
  player: string
  category: string
  level: number
  lesson: string
  score: number
  speechTime: number
  playTime: number
}

export interface TrainingFilter {
  lessons: Record<string, boolean>
  players: Record<string, boolean>
  startMonth: string | null
  endMonth: string | null
}

export interface TrainingStats {
  recordCount: number
  playerCount: number
  lessonCount: number
  dateRange: {
    min: Date | null
    max: Date | null
  }
}

export interface AggregatedData {
  name: string
  playCount: number
  avgScore: number
  avgSpeechTime: number
  avgPlayTime: number
}

export interface MonthlyTrend {
  month: string
  playCount: number
  avgScore: number
}

export interface PlayerRecord {
  player: string
  playCount: number
  avgScore: number
  lastPlayDate: Date | null
}

export interface RankingEntry {
  rank: number
  player: string
  avgScore: number
  playCount: number
  bestScore: number
}

export interface LogEntry extends TrainingSession {
  id: string
}

// Hierarchy structures for filters
export interface LessonHierarchy {
  [category: string]: {
    checked: boolean
    indeterminate: boolean
    levels: {
      [level: string]: {
        checked: boolean
        indeterminate: boolean
        lessons: {
          [lesson: string]: boolean
        }
      }
    }
  }
}

export interface PlayerHierarchy {
  [org: string]: {
    checked: boolean
    indeterminate: boolean
    accounts: {
      [account: string]: {
        checked: boolean
        indeterminate: boolean
        groups: {
          [group: string]: {
            checked: boolean
            indeterminate: boolean
            players: {
              [player: string]: boolean
            }
          }
        }
      }
    }
  }
}
