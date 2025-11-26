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
    <!-- ロゴエリア -->
    <div class="sidebar-header">
      <NaretoreTextLogo class="sidebar-logo" />
      <span class="sidebar-title">管理者ページ</span>
    </div>

    <!-- ナビゲーション -->
    <nav class="sidebar-nav">
      <div class="nav-section">
        <span class="nav-section-title">メニュー</span>
        <div class="nav-items">
          <button
            v-for="item in navigationItems"
            :key="item.name"
            class="nav-item"
            :class="{ 'active': isActive(item) }"
            @click="switchView(item)"
          >
            <UIcon :name="item.icon" class="nav-icon" />
            <span class="nav-label">{{ item.name }}</span>
            <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
          </button>
        </div>
      </div>
    </nav>

    <!-- サイドバーフッター -->
    <div class="sidebar-footer">
      <button class="nav-item logout-item" @click="handleLogout">
        <UIcon name="i-lucide-log-out" class="nav-icon" />
        <span class="nav-label">ログアウト</span>
      </button>
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
  { name: '個人レコード', path: '/ranking', icon: 'i-lucide-trophy' },
  { name: 'ログ', path: '/logs', icon: 'i-lucide-file-text' },
  { name: 'ロープレ構築', path: '/content-creation', icon: 'i-lucide-pencil', badge: '開発中' },
]

const switchView = (item: typeof navigationItems[0]) => {
  router.push(item.path)
  // モバイル時はサイドバーを閉じる
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
  background: rgba(15, 23, 42, 0.5);
  z-index: 99;
  display: none;
  backdrop-filter: blur(2px);
}

.app-sidebar {
  width: 260px;
  background: white;
  border-right: 1px solid #e2e8f0;
  height: 100vh;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  z-index: 50;
  flex-shrink: 0;
}

/* サイドバーヘッダー */
.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.sidebar-logo {
  height: 28px;
  width: auto;
}

.sidebar-title {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
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
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
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
  font-size: 20px;
  flex-shrink: 0;
  opacity: 0.8;
}

.nav-item.active .nav-icon {
  opacity: 1;
}

.nav-label {
  flex: 1;
}

.nav-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border-radius: 10px;
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

/* モバイル対応 */
@media (max-width: 1024px) {
  .sidebar-overlay {
    display: block;
  }

  .app-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 100;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.1);
  }

  .app-sidebar.open {
    transform: translateX(0);
  }
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
