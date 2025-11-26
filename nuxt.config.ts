// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // SPAモード
  ssr: false,

  modules: [
    '@nuxt/ui',
    '@vueuse/nuxt'
  ],

  css: ['@/assets/css/main.css'],

  vite: {
    optimizeDeps: {
      exclude: ['xlsx']
    },
    ssr: {
      noExternal: ['xlsx']
    }
  },

  app: {
    head: {
      title: 'ナレトレ管理画面',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'ナレトレのロープレ管理システム' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  runtimeConfig: {
    openaiApiKey: '',
    anthropicApiKey: '',
    public: {
      apiBase: ''
    }
  },

  nitro: {
    experimental: {
      websocket: true
    },
    externals: {
      inline: ['xlsx', 'pdf-parse']
    }
  },

  typescript: {
    strict: true,
    typeCheck: false
  }
})
