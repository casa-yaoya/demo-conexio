export default defineAppConfig({
  ui: {
    // カラー設定
    colors: {
      primary: 'sky',
      neutral: 'slate'
    },
    // ボタンのデフォルト設定
    button: {
      slots: {
        base: 'rounded-md font-semibold'
      },
      variants: {
        size: {
          xs: { base: 'px-2.5 py-1.5 text-xs' },
          sm: { base: 'px-3.5 py-2 text-sm' },
          md: { base: 'px-4 py-2.5 text-sm' },
          lg: { base: 'px-5 py-3 text-base' },
          xl: { base: 'px-6 py-3.5 text-base' }
        }
      }
    },
    // インプットのデフォルト設定
    input: {
      slots: {
        root: 'rounded-md'
      },
      variants: {
        size: {
          sm: { base: 'px-3 py-2 text-sm' },
          md: { base: 'px-3.5 py-2.5 text-sm' },
          lg: { base: 'px-4 py-3 text-base' }
        }
      }
    },
    // セレクトのデフォルト設定
    select: {
      slots: {
        base: 'inline-flex items-center rounded-md whitespace-nowrap',
        value: 'truncate',
        trailing: 'shrink-0'
      }
    },
    // カードのデフォルト設定
    card: {
      slots: {
        root: 'rounded-lg border border-gray-200 bg-white shadow-sm',
        body: 'p-5'
      }
    },
    // チェックボックスのデフォルト設定
    checkbox: {
      slots: {
        base: 'rounded'
      }
    }
  }
})
