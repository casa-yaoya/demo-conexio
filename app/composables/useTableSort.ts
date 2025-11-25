// Table sorting composable
// テーブルのソート機能を提供

export type SortDirection = 'asc' | 'desc' | null

export interface SortState {
  column: string
  direction: SortDirection
}

export interface SortOptions {
  defaultColumn?: string
  defaultDirection?: SortDirection
}

export const useTableSort = <T extends Record<string, any>>(
  initialData: Ref<T[]> | ComputedRef<T[]>,
  options?: SortOptions
) => {
  const sortState = ref<SortState>({
    column: options?.defaultColumn || '',
    direction: options?.defaultDirection || null
  })

  // ソート実行
  const sortedData = computed(() => {
    const data = [...initialData.value]

    if (!sortState.value.column || !sortState.value.direction) {
      return data
    }

    const { column, direction } = sortState.value

    return data.sort((a, b) => {
      let valueA = a[column]
      let valueB = b[column]

      // 日付の比較
      if (valueA instanceof Date && valueB instanceof Date) {
        return direction === 'asc'
          ? valueA.getTime() - valueB.getTime()
          : valueB.getTime() - valueA.getTime()
      }

      // 数値の比較
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return direction === 'asc' ? valueA - valueB : valueB - valueA
      }

      // 文字列の比較
      const strA = String(valueA || '').toLowerCase()
      const strB = String(valueB || '').toLowerCase()

      if (direction === 'asc') {
        return strA.localeCompare(strB, 'ja')
      } else {
        return strB.localeCompare(strA, 'ja')
      }
    })
  })

  // カラムクリック時のソート切り替え
  const toggleSort = (column: string) => {
    if (sortState.value.column === column) {
      // 同じカラムの場合、方向を切り替え（desc → asc）
      if (sortState.value.direction === 'desc') {
        sortState.value.direction = 'asc'
      } else {
        sortState.value.direction = 'desc'
      }
    } else {
      // 新しいカラムの場合、降順で開始（数が大きい順）
      sortState.value.column = column
      sortState.value.direction = 'desc'
    }
  }

  // ソートアイコンの取得（▼/▲形式）
  const getSortIcon = (column: string): string => {
    if (sortState.value.column !== column) {
      return '▼' // 未ソート（グレー表示用）
    }
    if (sortState.value.direction === 'asc') {
      return '▲' // 昇順（小さい順）
    }
    return '▼' // 降順（大きい順）
  }

  // 特定のカラムがソートされているかチェック（アイコンの色変更用）
  const isSortedColumn = (column: string): boolean => {
    return sortState.value.column === column
  }

  // 特定のカラムがソートされているかチェック
  const isSorted = (column: string): boolean => {
    return sortState.value.column === column && sortState.value.direction !== null
  }

  // ソートをリセット
  const resetSort = () => {
    sortState.value.column = ''
    sortState.value.direction = null
  }

  return {
    sortState,
    sortedData,
    toggleSort,
    getSortIcon,
    isSorted,
    isSortedColumn,
    resetSort
  }
}
