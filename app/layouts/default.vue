<template>
  <UApp>
    <div class="app-layout">
      <!-- サイドバー（デスクトップ時は常時表示） -->
      <AppSidebar />

      <!-- メインエリア -->
      <div class="main-wrapper">
        <!-- ヘッダー -->
        <AppHeader />

        <!-- コンテンツ -->
        <main class="main-content flex-1 overflow-auto">
          <slot />
        </main>
      </div>
    </div>
  </UApp>
</template>

<script setup lang="ts">
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f8fafc;
}

.main-wrapper {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  position: relative;
  z-index: 0;
  isolation: isolate;
  background: #f8fafc;
}

/* タブレット以下でサイドバーを隠す */
@media (max-width: 1024px) {
  .app-layout {
    flex-direction: column;
  }
}
</style>
