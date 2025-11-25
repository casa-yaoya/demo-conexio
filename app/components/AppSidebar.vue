<template>
  <!-- オーバーレイ（モバイル時のみ） -->
  <div
    v-if="isSidebarOpen"
    class="sidebar-overlay"
    @click="closeSidebar"
  ></div>

  <aside
    class="app-sidebar"
    :class="{ 'open': isSidebarOpen }"
  >
    <nav class="flex-1">
      <div
        v-for="item in navigationItems"
        :key="item.name"
        @click="switchView(item)"
        class="flex items-center gap-3 px-5 py-3 text-sm cursor-pointer transition-all border-l-[3px]"
        :class="[
          isActive(item)
            ? 'bg-gray-50 border-l-primary-600 font-semibold'
            : 'border-l-transparent hover:bg-gray-50'
        ]"
      >
        <span class="text-base">{{ item.icon }}</span>
        <span>{{ item.name }}</span>
      </div>
      <!-- ログアウト -->
      <div
        @click="handleLogout"
        class="flex items-center gap-3 px-5 py-3 text-sm cursor-pointer transition-all border-l-[3px] border-l-transparent hover:bg-gray-50"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        <span>ログアウト</span>
      </div>
    </nav>
  </aside>
</template>

<script setup lang="ts">
const router = useRouter()
const route = useRoute()

// グローバルな状態を参照
const isSidebarOpen = useState<boolean>('isSidebarOpen', () => false)

// ナビゲーションアイテム - 全てSSRページルーティング
const navigationItems = [
  { name: 'ロープレ構築', path: '/content-creation', icon: '✏️' },
  { name: 'サマリー', path: '/summary', icon: '📊' },
  { name: '個人レコード', path: '/ranking', icon: '🏆' },
  { name: 'ログ', path: '/logs', icon: '📝' },
]

const switchView = (item: typeof navigationItems[0]) => {
  router.push(item.path)
  // サイドバーを閉じる
  isSidebarOpen.value = false
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}

const isActive = (item: typeof navigationItems[0]) => {
  return route.path === item.path
}

const handleLogout = () => {
  // TODO: ログアウト処理
  console.log('Logout clicked')
}
</script>

<style scoped>
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
  display: block;
}

.app-sidebar {
  display: flex;
  width: 250px;
  flex-direction: column;
  border-right: 1px solid #e5e7eb;
  background: white;
  height: 100%;
  overflow-y: auto;
  transition: transform 0.3s ease, width 0.3s ease, margin-left 0.3s ease;
  position: fixed;
  top: 64px;
  left: 0;
  bottom: 0;
  z-index: 100;
  transform: translateX(-100%);
}

.app-sidebar.open {
  transform: translateX(0);
}
</style>
