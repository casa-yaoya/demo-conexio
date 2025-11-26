export default defineAppConfig({
  ui: {
    // ===========================================
    // カラー設定
    // main.css の @theme で定義した brand カラーを使用
    // ===========================================
    colors: {
      primary: 'sky',      // brand カラー (Sky Blue)
      secondary: 'slate',  // secondary カラー
      neutral: 'slate',    // neutral カラー
      success: 'emerald',  // 成功系
      warning: 'amber',    // 警告系
      error: 'rose'        // エラー系
    },

    // ===========================================
    // ボタン - Nuxt UI v3 デフォルトを拡張
    // <UButton> とだけ書けば統一された見た目になる
    // ===========================================
    button: {
      slots: {
        base: 'font-semibold transition-all duration-200'
      },
      defaultVariants: {
        size: 'sm',
        color: 'primary',
        variant: 'solid'
      }
    },

    // ===========================================
    // セレクト - フォーム要素
    // ===========================================
    select: {
      slots: {
        base: 'transition-all duration-200'
      },
      defaultVariants: {
        size: 'md',
        color: 'primary',
        variant: 'outline'
      }
    },

    // ===========================================
    // インプット
    // ===========================================
    input: {
      slots: {
        base: 'transition-all duration-200'
      },
      defaultVariants: {
        size: 'md',
        color: 'primary',
        variant: 'outline'
      }
    },

    // ===========================================
    // テキストエリア
    // ===========================================
    textarea: {
      slots: {
        base: 'transition-all duration-200'
      },
      defaultVariants: {
        size: 'md',
        color: 'primary',
        variant: 'outline'
      }
    },

    // ===========================================
    // カード
    // ===========================================
    card: {
      slots: {
        root: 'bg-white rounded-xl border border-slate-200 shadow-sm',
        header: 'px-5 py-4 border-b border-slate-100',
        body: 'p-5',
        footer: 'px-5 py-4 border-t border-slate-100'
      }
    },

    // ===========================================
    // チェックボックス
    // ===========================================
    checkbox: {
      defaultVariants: {
        color: 'primary'
      }
    },

    // ===========================================
    // バッジ
    // ===========================================
    badge: {
      slots: {
        base: 'font-semibold'
      },
      defaultVariants: {
        size: 'sm',
        color: 'primary',
        variant: 'soft'
      }
    },

    // ===========================================
    // ポップオーバー
    // ===========================================
    popover: {
      slots: {
        content: 'bg-white rounded-lg border border-slate-200 shadow-lg'
      }
    },

    // ===========================================
    // ドロップダウンメニュー
    // ===========================================
    dropdownMenu: {
      slots: {
        content: 'bg-white rounded-lg border border-slate-200 shadow-lg min-w-[180px]',
        item: 'text-sm font-medium transition-colors duration-150'
      }
    },

    // ===========================================
    // トースト通知
    // ===========================================
    toast: {
      slots: {
        root: 'rounded-lg shadow-lg border'
      }
    },

    // ===========================================
    // アイコン
    // ===========================================
    icon: {
      size: {
        xs: '14px',
        sm: '16px',
        md: '20px',
        lg: '24px',
        xl: '32px'
      }
    }
  }
})
