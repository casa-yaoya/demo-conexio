<template>
  <UModal v-model:open="modalOpen">
    <template #header>
      <h3 class="text-xl font-semibold text-gray-900">ロープレ生成</h3>
    </template>

    <template #body>
      <div class="file-dialog-description">
        参照するファイルを選択してください（任意）
      </div>

      <div v-if="files.length > 0" class="file-list">
        <div
          v-for="file in files"
          :key="file.id"
          class="file-list-item"
          :class="{ selected: selectedFiles.has(file.id) }"
          @click="toggleFile(file.id)"
        >
          <UCheckbox
            :model-value="selectedFiles.has(file.id)"
            @click.stop
            @update:model-value="toggleFile(file.id)"
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
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          variant="outline"
          color="neutral"
          @click="close"
        >
          キャンセル
        </UButton>
        <UButton
          color="primary"
          @click="generate"
        >
          生成開始
        </UButton>
      </div>
    </template>
  </UModal>
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

// モーダルの開閉状態（propsと同期）
const modalOpen = computed({
  get: () => props.isOpen,
  set: (value: boolean) => {
    if (!value) emit('close')
  }
})

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
</style>
