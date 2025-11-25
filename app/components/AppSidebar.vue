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
        @click="switchView(item.view)"
        class="flex items-center gap-3 px-5 py-3 text-sm cursor-pointer transition-all border-l-[3px]"
        :class="[
          isActive(item.view)
            ? 'bg-gray-50 border-l-primary-600 font-semibold'
            : 'border-l-transparent hover:bg-gray-50'
        ]"
      >
        <span class="text-base">{{ item.icon }}</span>
        <span>{{ item.name }}</span>
      </div>
    </nav>

    <div class="border-t border-gray-200">
      <button
        @click="handleLogout"
        class="flex w-full items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-gray-50 border-l-[3px] border-l-transparent"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        <span>ログアウト</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
// グローバルな状態を参照
const currentView = useState<string>('currentView', () => 'roleplay')
const isSidebarOpen = useState<boolean>('isSidebarOpen', () => false)

const navigationItems = [
  { name: 'ロープレ構築', view: 'roleplay', icon: '✏️' },
  { name: 'サマリー', view: 'summary', icon: '📊' },
  { name: '個人記録', view: 'personal-records', icon: '👤' },
  { name: 'ランキング', view: 'ranking', icon: '🏆' },
  { name: 'ログ', view: 'logs', icon: '📝' },
  { name: 'データ読み込み', view: 'data-import', icon: '📂' },
]

const switchView = (view: string) => {
  currentView.value = view
  // モバイルではサイドバーを閉じる
  if (window.innerWidth < 768) {
    isSidebarOpen.value = false
  }
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}

const isActive = (view: string) => {
  return currentView.value === view
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
  display: none;
}

@media (max-width: 767px) {
  .sidebar-overlay {
    display: block;
  }
}

.app-sidebar {
  display: flex;
  width: 250px;
  flex-direction: column;
  border-right: 1px solid #e5e7eb;
  background: white;
  height: 100%;
  overflow-y: auto;
  transition: transform 0.3s ease;
}

@media (max-width: 767px) {
  .app-sidebar {
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
}
</style>
