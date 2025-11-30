<template>
  <!-- オーバーレイ（モバイル時のみ） -->
  <div
    v-if="isSidebarOpen"
    class="sidebar-overlay"
    @click="closeSidebar"
  />

  <aside
    class="app-sidebar"
    :class="{ 'open': isSidebarOpen }"
  >
    <!-- ナビゲーション -->
    <nav class="sidebar-nav">
      <div class="nav-section">
        <span class="nav-section-title">メニュー</span>
        <div class="nav-items">
          <UButton
            v-for="item in navigationItems"
            :key="item.name"
            variant="ghost"
            color="neutral"
            class="nav-item"
            :class="{ 'active': isActive(item) }"
            :ui="{
              base: 'w-full justify-start'
            }"
            @click="switchView(item)"
          >
            <template #leading>
              <UIcon :name="item.icon" class="nav-icon" />
            </template>
            <span class="nav-label">{{ item.name }}</span>
            <template v-if="item.badge" #trailing>
              <UBadge color="warning" variant="solid" size="xs">{{ item.badge }}</UBadge>
            </template>
          </UButton>
        </div>
      </div>
    </nav>

    <!-- サイドバーフッター -->
    <div class="sidebar-footer">
      <UButton
        variant="ghost"
        color="neutral"
        class="nav-item logout-item"
        :ui="{
          base: 'w-full justify-start'
        }"
        @click="handleLogout"
      >
        <template #leading>
          <UIcon name="i-lucide-log-out" class="nav-icon" />
        </template>
        <span class="nav-label">ログアウト</span>
      </UButton>
    </div>
  </aside>
</template>

<script setup lang="ts">
const router = useRouter()
const route = useRoute()

// グローバルな状態を参照
const isSidebarOpen = useState<boolean>('isSidebarOpen', () => false)

// ナビゲーションアイテム - Lucideアイコンを使用
const navigationItems = [
  { name: 'サマリー', path: '/summary', icon: 'i-lucide-bar-chart-3' },
  { name: '個人比較', path: '/ranking', icon: 'i-lucide-trophy' },
  { name: '個人記録', path: '/records', icon: 'i-lucide-award' },
  { name: 'ログ', path: '/logs', icon: 'i-lucide-file-text' },
  { name: 'ロープレ構築', path: '/content-creation', icon: 'i-lucide-hammer' },
  { name: 'テストプレイ', path: '/test-play', icon: 'i-lucide-play-circle' },
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
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  z-index: 99;
  backdrop-filter: blur(2px);
}

.app-sidebar {
  width: 260px;
  background: white;
  border-right: 1px solid #e2e8f0;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  display: flex;
  flex-direction: column;
  z-index: 100;
  flex-shrink: 0;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.1);
}

.app-sidebar.open {
  transform: translateX(0);
}

/* ナビゲーション */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px;
}

.nav-section {
  margin-bottom: 24px;
}

.nav-section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #94a3b8;
  padding: 0 12px;
  margin-bottom: 8px;
  display: block;
}

.nav-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ナビゲーションボタン - UButton をカスタマイズ */
.nav-item {
  gap: 14px;
  padding: 16px 20px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 500;
  color: #475569;
}

.nav-item:hover {
  background: #f1f5f9;
  color: #0ea5e9;
}

.nav-item.active {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  color: #0284c7;
  font-weight: 600;
  border-left: 3px solid #0ea5e9;
  margin-left: -3px;
}

.nav-icon {
  font-size: 24px;
  flex-shrink: 0;
  opacity: 0.8;
}

.nav-item.active .nav-icon {
  opacity: 1;
}

.nav-label {
  flex: 1;
  text-align: left;
}

/* サイドバーフッター */
.sidebar-footer {
  padding: 12px;
  border-top: 1px solid #e2e8f0;
}

.logout-item {
  color: #64748b;
}

.logout-item:hover {
  background: #fff1f2;
  color: #e11d48;
}

/* スクロールバー */
.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 2px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}
</style>
