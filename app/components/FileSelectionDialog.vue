<template>
  <div v-if="isOpen" class="file-dialog-overlay" @click.self="close">
    <div class="file-dialog">
      <div class="file-dialog-header">
        <h3 class="file-dialog-title">ロープレ生成</h3>
        <button class="file-dialog-close" @click="close">×</button>
      </div>

      <div class="file-dialog-content">
        <div class="file-dialog-description">
          参照するファイルを選択してください（任意）
        </div>

        <div v-if="files.length > 0" class="file-list">
          <div
            v-for="(file, index) in files"
            :key="file.id"
            class="file-list-item"
            :class="{ selected: selectedFiles.has(file.id) }"
            @click="toggleFile(file.id)"
          >
            <input
              type="checkbox"
              :checked="selectedFiles.has(file.id)"
              @click.stop="toggleFile(file.id)"
              class="file-checkbox"
            />
            <span class="file-name">{{ file.name }}</span>
            <span class="file-type-badge" :class="`type-${file.dataType}`">
              {{ getFileTypeLabel(file.dataType) }}
            </span>
          </div>
        </div>

        <div v-else class="no-files">
          <p>ファイルはアップロードされていません</p>
          <p class="no-files-hint">チャット内容のみから生成します</p>
        </div>
      </div>

      <div class="file-dialog-footer">
        <button class="btn btn-secondary" @click="close">キャンセル</button>
        <button class="btn btn-primary" @click="generate">生成開始</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UploadedFile } from '~/types/file'

// Props
const props = defineProps<{
  isOpen: boolean
  files: UploadedFile[]
}>()

// Emits
const emit = defineEmits<{
  close: []
  generate: [selectedFiles: UploadedFile[]]
}>()

// State
const selectedFiles = ref<Set<string>>(new Set())

// Methods
function toggleFile(fileId: string) {
  if (selectedFiles.value.has(fileId)) {
    selectedFiles.value.delete(fileId)
  } else {
    selectedFiles.value.add(fileId)
  }
}

function close() {
  selectedFiles.value.clear()
  emit('close')
}

function generate() {
  const selected = props.files.filter(f => selectedFiles.value.has(f.id))
  emit('generate', selected)
  selectedFiles.value.clear()
}

function getFileTypeLabel(dataType: string): string {
  const labels: Record<string, string> = {
    'textbook': '教材',
    'roleplay': 'ロープレ',
    'other': 'その他'
  }
  return labels[dataType] || dataType
}

// Watch for dialog open/close
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    selectedFiles.value.clear()
  }
})
</script>

<style scoped>
.file-dialog-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.file-dialog {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 42rem;
  width: 100%;
  margin: 0 1rem;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.file-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.file-dialog-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.file-dialog-close {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  color: #6b7280;
  font-size: 1.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}

.file-dialog-close:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.file-dialog-content {
  flex: 1;
  padding: 1rem 1.5rem;
  overflow-y: auto;
}

.file-dialog-description {
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 1rem;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.file-list-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s;
}

.file-list-item:hover {
  background-color: #f9fafb;
}

.file-list-item.selected {
  background-color: #eff6ff;
  border-color: #93c5fd;
}

.file-checkbox {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 0.25rem;
  border-color: #d1d5db;
  color: #2563eb;
}

.file-name {
  flex: 1;
  font-size: 0.875rem;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-type-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.file-type-badge.type-textbook {
  background-color: #dcfce7;
  color: #166534;
}

.file-type-badge.type-roleplay {
  background-color: #f3e8ff;
  color: #6b21a8;
}

.file-type-badge.type-other {
  background-color: #f3f4f6;
  color: #1f2937;
}

.no-files {
  text-align: center;
  padding: 3rem 0;
  color: #6b7280;
}

.no-files-hint {
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.file-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.15s;
  cursor: pointer;
  border: none;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

.btn-primary {
  background-color: #2563eb;
  color: white;
}

.btn-primary:hover {
  background-color: #1d4ed8;
}
</style>
