<template>
  <header class="app-header">
    <button class="hamburger-button" @click="toggleSidebar" aria-label="メニュー">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>

    <div class="header-center">
      <svg viewBox="0 0 208.04 48.98" xmlns="http://www.w3.org/2000/svg" class="naretore-logo">
        <g>
          <path fill="#221714" d="M2.59,48.98v-11.65s2.82-.11,5-.19c4.95-.18,8.27-1.01,9.37-3.1,1.74-3.32,1.78-8.91,1.8-11.92,0-.19,0-.37,0-.55H0v-11.78h18.8V0h12.55v9.79h16.47v11.78h-16.47c-.06,9.16-1.08,15.89-5.52,20.9-5.31,6-14.24,6.5-22.2,6.5h-1.04Z"/>
          <path fill="#221714" d="M114.97,48.72V.05h13.06v14.56c11.66,1.29,19.36,5.44,24.79,8.94l.83.54-6.72,10.6-.84-.53c-.59-.37-1.16-.74-1.72-1.09-4.82-3.08-8.66-5.55-16.34-6.05v21.71h-13.06Z"/>
          <path fill="#221714" d="M169.55,47.82l-4.17-5.54V1h12.67v33.62c4.56-.18,8.23-.97,11.05-2.7,3.26-2.01,6.21-4.86,8.49-8.84l.77-1.4,9.68,8.24h0c-4.69,8.85-9.88,12.47-15.05,14.53-6.28,2.5-12.11,3.36-22.95,3.36h-.5Z"/>
          <path fill="#221714" d="M64.21,47.82l-4.17-5.54V1h12.67v33.62c4.56-.18,8.23-.97,11.05-2.7,3.26-2.01,6.21-4.86,8.49-8.84l.77-1.4,9.68,8.24h0c-4.69,8.85-9.88,12.47-15.05,14.53-6.28,2.5-12.11,3.36-22.95,3.36h-.5Z"/>
        </g>
      </svg>
      <span class="header-title">管理者ページ</span>
    </div>

    <div class="header-user">
      <span class="user-name">管理者</span>
      <button class="logout-button" aria-label="ログアウト">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
      </button>
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
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.hamburger-button {
  padding: 0.5rem;
  background: none;
  border: none;
  color: #374151;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  transition: background-color 0.15s;
}

.hamburger-button:hover {
  background: #f3f4f6;
}

@media (min-width: 768px) {
  .hamburger-button {
    display: none;
  }
}

.header-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.naretore-logo {
  height: 32px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.header-user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-name {
  font-size: 14px;
  color: #4b5563;
}

.logout-button {
  padding: 0.5rem;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  transition: all 0.15s;
}

.logout-button:hover {
  background: #f3f4f6;
  color: #374151;
}
</style>
