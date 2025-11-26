<template>
  <header class="app-header">
    <!-- 左側: ハンバーガーメニュー -->
    <div class="header-left">
      <UButton
        icon="i-lucide-menu"
        variant="ghost"
        color="neutral"
        size="md"
        class="menu-btn"
        @click="toggleSidebar"
        aria-label="メニュー"
      />
    </div>

    <!-- 中央: ロゴとタイトル -->
    <div class="header-center">
      <div class="logo-container">
        <NaretoreLogo />
      </div>
      <NaretoreTextLogo class="text-logo" />
      <span class="admin-label">管理者ページ</span>
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
const isSidebarOpen = useState<boolean>('isSidebarOpen', () => false)

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}
</script>

<style scoped>
.app-header {
  height: 64px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 40;
}

.header-left {
  flex: 1;
  display: flex;
  align-items: center;
}

.menu-btn {
  display: flex;
}

.header-center {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-container {
  width: 36px;
  height: 36px;
}

.text-logo {
  height: 24px;
  width: auto;
}

.admin-label {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  padding-left: 12px;
  border-left: 1px solid #e2e8f0;
}

.header-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
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
  .app-header {
    padding: 0 16px;
  }

  .header-center {
    gap: 8px;
  }

  .logo-container {
    width: 28px;
    height: 28px;
  }

  .text-logo {
    height: 18px;
  }

  .admin-label {
    display: none;
  }

  .user-info {
    display: none;
  }
}
</style>
