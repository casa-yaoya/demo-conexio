// Composable for file upload functionality
import type { UploadedFile, FileUploadResponse } from '~/types/file'

interface AnalysisResult {
  success: boolean
  text?: string
  error?: string
}

export const useFileUploader = () => {
  const uploadedFiles = ref<UploadedFile[]>([])
  const isUploading = ref(false)
  const isAnalyzing = ref(false)
  const uploadError = ref<string | null>(null)
  const analysisProgress = ref<{ fileId: string; status: string } | null>(null)

  // Check if file needs AI analysis
  const needsAnalysis = (filename: string): boolean => {
    const ext = filename.toLowerCase().split('.').pop() || ''
    const analysisTypes = ['pdf', 'mp3', 'wav', 'm4a', 'mp4', 'mov', 'avi', 'webm']
    return analysisTypes.includes(ext)
  }

  // Get file type for analysis
  const getFileType = (filename: string): string => {
    const ext = filename.toLowerCase().split('.').pop() || ''
    if (ext === 'pdf') return 'pdf'
    if (['mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac'].includes(ext)) return 'audio'
    if (['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext)) return 'video'
    return 'unknown'
  }

  // Analyze file with AI
  const analyzeFile = async (file: File, fileId: string): Promise<string | null> => {
    console.log('🔬 Starting AI analysis for:', file.name)
    isAnalyzing.value = true
    analysisProgress.value = { fileId, status: '解析中...' }

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileType', getFileType(file.name))

      const response = await $fetch<AnalysisResult>('/api/analyze', {
        method: 'POST',
        body: formData
      })

      if (response.success && response.text) {
        console.log('✅ Analysis complete')
        // Update the file's extractedText
        const fileIndex = uploadedFiles.value.findIndex(f => f.id === fileId)
        if (fileIndex !== -1) {
          uploadedFiles.value[fileIndex] = {
            ...uploadedFiles.value[fileIndex],
            extractedText: response.text
          }
        }
        return response.text
      } else {
        console.error('❌ Analysis failed:', response.error)
        return null
      }
    } catch (error) {
      console.error('❌ Analysis error:', error)
      return null
    } finally {
      isAnalyzing.value = false
      analysisProgress.value = null
    }
  }

  // Upload a single file
  const uploadFile = async (
    file: File,
    dataType: 'textbook' | 'roleplay' | 'other' = 'other',
    autoAnalyze: boolean = true
  ): Promise<UploadedFile | null> => {
    console.log('📤 useFileUpload.uploadFile called:', file.name, dataType)
    isUploading.value = true
    uploadError.value = null

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('dataType', dataType)
      console.log('📦 FormData created, sending to /api/upload...')

      const response = await $fetch<FileUploadResponse>('/api/upload', {
        method: 'POST',
        body: formData
      })
      console.log('📥 Server response:', response)

      if (response.success && response.file) {
        console.log('✅ Upload successful:', response.file)
        uploadedFiles.value.push(response.file)

        // Auto-analyze if needed
        if (autoAnalyze && needsAnalysis(file.name)) {
          // Don't await - run in background
          analyzeFile(file, response.file.id)
        }

        return response.file
      } else {
        console.log('❌ Upload failed:', response.error)
        uploadError.value = response.error || 'Upload failed'
        return null
      }
    } catch (error) {
      uploadError.value = error instanceof Error ? error.message : 'Upload failed'
      console.error('❌ File upload error:', error)
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

  // Update file's extracted text
  const updateFileText = (fileId: string, text: string) => {
    const fileIndex = uploadedFiles.value.findIndex(f => f.id === fileId)
    if (fileIndex !== -1) {
      uploadedFiles.value[fileIndex] = {
        ...uploadedFiles.value[fileIndex],
        extractedText: text
      }
    }
  }

  return {
    uploadedFiles: readonly(uploadedFiles),
    isUploading: readonly(isUploading),
    isAnalyzing: readonly(isAnalyzing),
    uploadError: readonly(uploadError),
    analysisProgress: readonly(analysisProgress),
    uploadFile,
    uploadFiles,
    analyzeFile,
    fetchFiles,
    removeFile,
    clearFiles,
    getFilesByType,
    formatFileSize,
    updateFileText,
    needsAnalysis,
    getFileType
  }
}
