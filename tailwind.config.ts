import type { Config } from 'tailwindcss'

// Tailwind CSS v4 では、このファイルは必須ではありません。
// カスタムカラーは main.css の @theme ディレクティブで定義しています。
// 今後の拡張用に残していますが、v4 では main.css のみで動作します。
export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#c30d23',
          hover: '#b00c1f',
        },
        secondary: {
          DEFAULT: '#231815',
        },
        player: {
          DEFAULT: '#f0f7ff',
        },
        opponent: {
          DEFAULT: '#fff7f0',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
