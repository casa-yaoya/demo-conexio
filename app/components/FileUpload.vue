<template>
  <div class="file-upload-container">
    <div
      class="file-upload-dropzone"
      :class="{
        'dragover': isDragging,
        'uploading': isUploading,
        'has-files': uploadedFiles.length > 0
      }"
      @drop.prevent="handleDrop"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @click="openFileSelector"
    >
      <input
        ref="fileInput"
        type="file"
        multiple
        accept=".pdf,.xlsx,.xls,.txt,.csv,.mp3,.mp4,.wav,.mov"
        @change="handleFileSelect"
        class="hidden"
      >

      <div class="dropzone-content">
        <div v-if="isUploading" class="upload-progress">
          <div class="spinner"></div>
          <p class="upload-text">アップロード中...</p>
        </div>

        <div v-else class="upload-prompt">
          <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <p class="upload-main-text">
            ファイルをドラッグ&ドロップ<br>
            またはクリックして選択
          </p>
          <p class="upload-hint-text">
            対応形式: PDF, Excel, テキスト, 音声, 動画
          </p>
        </div>
      </div>
    </div>

    <!-- Error message -->
    <div v-if="uploadError" class="error-message">
      <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>{{ uploadError }}</span>
    </div>

    <!-- Uploaded files list -->
    <div v-if="uploadedFiles.length > 0" class="uploaded-files-list">
      <h3 class="files-list-title">アップロード済みファイル ({{ uploadedFiles.length }})</h3>
      <div class="files-grid">
        <div
          v-for="file in uploadedFiles"
          :key="file.id"
          class="file-card"
        >
          <div class="file-icon">
            <svg v-if="file.type.includes('pdf')" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18.5,9H13V3.5L18.5,9Z"/>
            </svg>
            <svg v-else-if="file.type.includes('sheet') || file.type.includes('excel')" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18.5,9H13V3.5L18.5,9M7,11H9V13H7V11M15,11H17V13H15V11M11,11H13V13H11V11M7,15H9V17H7V15M15,15H17V17H15V15M11,15H13V17H11V15Z"/>
            </svg>
            <svg v-else-if="file.type.includes('audio')" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z"/>
            </svg>
            <svg v-else-if="file.type.includes('video')" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18.5,9H13V3.5L18.5,9Z"/>
            </svg>
          </div>

          <div class="file-info">
            <p class="file-name">{{ file.name }}</p>
            <p class="file-meta">
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
              <span class="file-type-badge" :class="`badge-${file.dataType}`">
                {{ getDataTypeLabel(file.dataType) }}
              </span>
            </p>
            <p v-if="file.extractedText" class="file-preview">
              {{ file.extractedText.substring(0, 100) }}{{ file.extractedText.length > 100 ? '...' : '' }}
            </p>
          </div>

          <button
            class="file-remove-btn"
            @click="removeFile(file.id)"
            aria-label="削除"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const {
  uploadedFiles,
  isUploading,
  uploadError,
  uploadFiles,
  removeFile,
  formatFileSize
} = useFileUpload()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const props = defineProps<{
  dataType?: 'textbook' | 'roleplay' | 'other'
}>()

const handleDrop = async (event: DragEvent) => {
  isDragging.value = false
  const files = Array.from(event.dataTransfer?.files || [])
  if (files.length > 0) {
    await uploadFiles(files, props.dataType || 'other')
  }
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  if (files.length > 0) {
    await uploadFiles(files, props.dataType || 'other')
    // Reset input
    target.value = ''
  }
}

const openFileSelector = () => {
  fileInput.value?.click()
}

const getDataTypeLabel = (dataType: string) => {
  const labels: Record<string, string> = {
    'textbook': '教材',
    'roleplay': 'ロープレ',
    'other': 'その他'
  }
  return labels[dataType] || dataType
}
</script>

<style scoped>
.file-upload-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.file-upload-dropzone {
  border: 2px dashed #d1d5db;
  border-radius: 0.75rem;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #f9fafb;
}

.file-upload-dropzone:hover {
  border-color: #9ca3af;
  background: #f3f4f6;
}

.file-upload-dropzone.dragover {
  border-color: #3b82f6;
  background: #eff6ff;
  border-style: solid;
}

.file-upload-dropzone.uploading {
  pointer-events: none;
  opacity: 0.7;
}

.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.upload-icon {
  width: 48px;
  height: 48px;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.upload-main-text {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.upload-hint-text {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.upload-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.upload-text {
  font-size: 16px;
  color: #374151;
  margin: 0;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  color: #dc2626;
  font-size: 14px;
}

.error-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.uploaded-files-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.files-list-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.files-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.file-card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  position: relative;
  transition: all 0.2s;
}

.file-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.file-icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  color: #3b82f6;
}

.file-icon svg {
  width: 100%;
  height: 100%;
}

.file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.file-type-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 11px;
  font-weight: 500;
}

.badge-textbook {
  background: #dbeafe;
  color: #1e40af;
}

.badge-roleplay {
  background: #fce7f3;
  color: #be185d;
}

.badge-other {
  background: #e5e7eb;
  color: #374151;
}

.file-preview {
  font-size: 12px;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.file-remove-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 24px;
  height: 24px;
  padding: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-remove-btn:hover {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.file-remove-btn svg {
  width: 14px;
  height: 14px;
}

.hidden {
  display: none;
}
</style>
