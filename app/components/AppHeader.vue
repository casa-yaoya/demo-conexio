<template>
  <header class="app-header">
    <!-- モバイル時のみハンバーガーメニュー -->
    <UButton
      icon="i-lucide-menu"
      variant="ghost"
      color="neutral"
      size="md"
      class="mobile-menu-btn"
      @click="toggleSidebar"
      aria-label="メニュー"
    />

    <!-- ページタイトル -->
    <div class="header-title">
      <h1 class="page-title">{{ currentPageTitle }}</h1>
    </div>

    <!-- 右側のユーザーメニュー -->
    <div class="header-right">
      <div class="user-info">
        <div class="user-avatar">
          <UIcon name="i-lucide-user" class="avatar-icon" />
        </div>
        <span class="user-name">管理者</span>
      </div>
      <UButton
        icon="i-lucide-log-out"
        variant="ghost"
        color="neutral"
        size="sm"
        aria-label="ログアウト"
        class="logout-btn"
      />
    </div>
  </header>
</template>

<script setup lang="ts">
const route = useRoute()
const isSidebarOpen = useState<boolean>('isSidebarOpen', () => false)

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

// 現在のページタイトルを取得
const currentPageTitle = computed(() => {
  const path = route.path
  const titles: Record<string, string> = {
    '/summary': 'サマリー',
    '/ranking': '個人レコード',
    '/logs': 'ログ',
    '/content-creation': 'ロープレ構築',
    '/data-import': 'データインポート'
  }
  return titles[path] || 'ダッシュボード'
})
</script>

<style scoped>
.app-header {
  height: 64px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 40;
  gap: 16px;
}

.mobile-menu-btn {
  display: none;
}

.header-title {
  flex: 1;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.user-avatar {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-icon {
  color: white;
  font-size: 16px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #334155;
}

.logout-btn {
  color: #64748b;
}

.logout-btn:hover {
  color: #f43f5e;
  background: #fff1f2;
}

/* モバイル対応 */
@media (max-width: 1024px) {
  .mobile-menu-btn {
    display: flex;
  }

  .app-header {
    padding: 0 16px;
  }

  .user-info {
    display: none;
  }
}
</style>
