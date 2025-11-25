// Composable for file upload functionality
import type { UploadedFile, FileUploadResponse } from '~/types/file'

export const useFileUpload = () => {
  const uploadedFiles = ref<UploadedFile[]>([])
  const isUploading = ref(false)
  const uploadError = ref<string | null>(null)

  // Upload a single file
  const uploadFile = async (
    file: File,
    dataType: 'textbook' | 'roleplay' | 'other' = 'other'
  ): Promise<UploadedFile | null> => {
    isUploading.value = true
    uploadError.value = null

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('dataType', dataType)

      const response = await $fetch<FileUploadResponse>('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (response.success && response.file) {
        uploadedFiles.value.push(response.file)
        return response.file
      } else {
        uploadError.value = response.error || 'Upload failed'
        return null
      }
    } catch (error) {
      uploadError.value = error instanceof Error ? error.message : 'Upload failed'
      console.error('File upload error:', error)
      return null
    } finally {
      isUploading.value = false
    }
  }

  // Upload multiple files
  const uploadFiles = async (
    files: File[],
    dataType: 'textbook' | 'roleplay' | 'other' = 'other'
  ): Promise<UploadedFile[]> => {
    const results: UploadedFile[] = []

    for (const file of files) {
      const result = await uploadFile(file, dataType)
      if (result) {
        results.push(result)
      }
    }

    return results
  }

  // Fetch list of uploaded files
  const fetchFiles = async () => {
    try {
      const files = await $fetch<UploadedFile[]>('/api/files')
      uploadedFiles.value = files
    } catch (error) {
      console.error('Failed to fetch files:', error)
      uploadError.value = 'Failed to fetch files'
    }
  }

  // Remove a file from the list (client-side only)
  const removeFile = (fileId: string) => {
    uploadedFiles.value = uploadedFiles.value.filter(f => f.id !== fileId)
  }

  // Clear all files
  const clearFiles = () => {
    uploadedFiles.value = []
  }

  // Get files by data type
  const getFilesByType = (dataType: 'textbook' | 'roleplay' | 'other') => {
    return computed(() => uploadedFiles.value.filter(f => f.dataType === dataType))
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return {
    uploadedFiles: readonly(uploadedFiles),
    isUploading: readonly(isUploading),
    uploadError: readonly(uploadError),
    uploadFile,
    uploadFiles,
    fetchFiles,
    removeFile,
    clearFiles,
    getFilesByType,
    formatFileSize
  }
}
