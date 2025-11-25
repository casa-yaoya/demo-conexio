<template>
  <div class="grid h-full grid-cols-[350px_1fr_400px] gap-5 p-5">
    <!-- 左パネル: ロープレ設計エリア -->
    <div class="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <h2 class="text-lg font-semibold text-secondary">ロープレ設計</h2>
        <button
          @click="generateRoleplay"
          class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          ロープレ生成
        </button>
      </div>
      <div class="flex-1 overflow-y-auto p-6">
        <RoleplayDesignForm />
      </div>
    </div>

    <!-- 中央パネル: チャットエリア -->
    <div class="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <h2 class="text-lg font-semibold text-secondary">チャット</h2>
        <button
          @click="resetChat"
          class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
        >
          リセット
        </button>
      </div>
      <div class="flex-1 overflow-y-auto p-6">
        <ChatArea />
      </div>
    </div>

    <!-- 右パネル: タブコンテンツエリア -->
    <div class="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <TabsContent />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const generateRoleplay = () => {
  // TODO: ロープレ生成処理
  console.log('Generate roleplay')
}

const resetChat = () => {
  // TODO: チャットリセット処理
  console.log('Reset chat')
}
</script>
