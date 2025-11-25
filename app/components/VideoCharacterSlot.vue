<template>
  <div
    class="cc-video-slot"
    :class="{ 'has-video': slot?.blobUrl, 'dragging': isDragging }"
    @click="handleClick"
    @dragenter.prevent.stop="handleDragEnter"
    @dragover.prevent.stop="handleDragOver"
    @dragleave.prevent.stop="handleDragLeave"
    @drop.prevent.stop="handleDrop"
  >
    <div class="cc-video-slot-content">
      <span class="cc-video-slot-icon">{{ slot?.blobUrl ? '✅' : '📁' }}</span>
      <span class="cc-video-slot-label">{{ slot?.label || label }}</span>
      <span v-if="slot?.filename" class="cc-video-slot-filename">{{ slot.filename }}</span>
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInputRef"
      type="file"
      accept="video/*"
      style="display: none"
      @change="handleFileSelect"
    >

    <!-- Remove button -->
    <button
      v-if="slot?.blobUrl"
      class="cc-video-slot-remove"
      @click.stop="handleRemove"
    >
      ×
    </button>
  </div>
</template>

<script setup lang="ts">
interface VideoSlot {
  id: string
  label: string
  file: File | null
  blobUrl: string | null
  filename: string | null
}

const props = defineProps<{
  slot: VideoSlot
  label?: string
}>()

const emit = defineEmits<{
  (e: 'file-selected', file: File): void
  (e: 'remove'): void
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const handleClick = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    emit('file-selected', file)
  }
  // Reset input so same file can be selected again
  input.value = ''
}

const handleDragEnter = () => {
  isDragging.value = true
}

const handleDragOver = (event: DragEvent) => {
  event.dataTransfer!.dropEffect = 'copy'
  isDragging.value = true
}

const handleDragLeave = (event: DragEvent) => {
  // Only remove dragging class if leaving the element itself
  const relatedTarget = event.relatedTarget as Node
  const currentTarget = event.currentTarget as Node
  if (!currentTarget.contains(relatedTarget)) {
    isDragging.value = false
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false

  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    if (file.type.startsWith('video/')) {
      emit('file-selected', file)
    } else {
      alert(`動画ファイルをドロップしてください\n現在のファイルタイプ: ${file.type}`)
    }
  }
}

const handleRemove = () => {
  emit('remove')
}
</script>

<style scoped>
.cc-video-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  height: 70px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.cc-video-slot:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.cc-video-slot.dragging {
  border-color: #3b82f6;
  background: #dbeafe;
  border-style: solid;
}

.cc-video-slot.has-video {
  border-color: #10b981;
  border-style: solid;
  background: #ecfdf5;
}

.cc-video-slot-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
}

.cc-video-slot-icon {
  font-size: 20px;
}

.cc-video-slot-label {
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
}

.cc-video-slot-filename {
  font-size: 9px;
  color: #9ca3af;
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cc-video-slot-remove {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ef4444;
  color: white;
  border: none;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.cc-video-slot:hover .cc-video-slot-remove {
  opacity: 1;
}

.cc-video-slot-remove:hover {
  background: #dc2626;
}
</style>
