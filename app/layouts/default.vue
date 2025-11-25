<template>
  <div class="flex h-screen overflow-hidden bg-gray-50">
    <!-- サイドバー -->
    <AppSidebar />

    <!-- メインエリア -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <!-- ヘッダー -->
      <AppHeader />

      <!-- コンテンツ -->
      <main class="flex-1 overflow-hidden">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
