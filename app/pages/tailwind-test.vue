<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-100">
    <div class="max-w-2xl w-full mx-4">
      <div class="rounded-xl border border-slate-200 p-8 shadow-lg bg-white">
        <h1 class="text-3xl font-bold mb-4 text-slate-900">
          Tailwind CSS v4 on Nuxt 3 ✨
        </h1>
        <p class="text-base text-slate-600 mb-6">
          このテキストの見た目が変わっていれば、Tailwind v4 が動いています。
        </p>

        <!-- カスタムカラーのテスト -->
        <div class="space-y-4">
          <h2 class="text-xl font-semibold text-slate-800 mb-3">カスタムカラーテスト</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 bg-primary text-white rounded-lg">
              <div class="font-semibold">Primary Color</div>
              <div class="text-sm opacity-90">#c30d23</div>
            </div>

            <div class="p-4 bg-secondary text-white rounded-lg">
              <div class="font-semibold">Secondary Color</div>
              <div class="text-sm opacity-90">#231815</div>
            </div>

            <div class="p-4 bg-player border border-slate-300 rounded-lg">
              <div class="font-semibold text-slate-700">Player Color</div>
              <div class="text-sm text-slate-600">#f0f7ff</div>
            </div>

            <div class="p-4 bg-opponent border border-slate-300 rounded-lg">
              <div class="font-semibold text-slate-700">Opponent Color</div>
              <div class="text-sm text-slate-600">#fff7f0</div>
            </div>
          </div>
        </div>

        <!-- ユーティリティクラスのテスト -->
        <div class="mt-8 space-y-3">
          <h2 class="text-xl font-semibold text-slate-800 mb-3">ユーティリティクラステスト</h2>
          <div class="flex gap-3">
            <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
              Button 1
            </button>
            <button class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
              Button 2
            </button>
            <button class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors">
              Button 3
            </button>
          </div>
        </div>

        <!-- 戻るリンク -->
        <div class="mt-8 pt-6 border-t border-slate-200">
          <NuxtLink
            to="/"
            class="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            ← メイン画面に戻る
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})
</script>
