// File upload endpoint
import { readMultipartFormData } from 'h3'
import { parseFileMetadata } from '../utils/fileParser'
import type { FileUploadResponse, UploadedFile } from '~/types/file'

// In-memory storage for uploaded files (in production, use database)
const uploadedFiles = new Map<string, UploadedFile>()

// Store file buffers for later content extraction
const fileBuffers = new Map<string, Buffer>()

export default defineEventHandler(async (event): Promise<FileUploadResponse> => {
  console.log('📥 Upload API called')
  try {
    // Parse multipart form data
    const formData = await readMultipartFormData(event)
    console.log('📦 FormData parsed, items:', formData?.length || 0)

    if (!formData || formData.length === 0) {
      console.log('❌ No form data')
      return {
        success: false,
        error: 'No file provided'
      }
    }

    // Get the first file from form data
    const fileData = formData.find(item => item.filename)
    console.log('📄 File data found:', fileData?.filename, 'size:', fileData?.data?.length)

    if (!fileData || !fileData.filename || !fileData.data) {
      console.log('❌ Invalid file data')
      return {
        success: false,
        error: 'Invalid file data'
      }
    }

    // Get dataType from form data (optional)
    const dataTypeField = formData.find(item => item.name === 'dataType')
    const dataType = dataTypeField?.data?.toString() || 'other'
    console.log('📋 DataType:', dataType)

    // Parse file for metadata only (structure info without full content)
    console.log('🔍 Parsing file metadata...')
    const parseResult = await parseFileMetadata(
      fileData.data,
      fileData.filename,
      fileData.type || 'application/octet-stream'
    )
    console.log('📝 Parse result:', parseResult.success, parseResult.error || 'no error')

    if (!parseResult.success) {
      console.log('❌ Parse failed:', parseResult.error)
      return {
        success: false,
        error: parseResult.error || 'File parsing failed'
      }
    }

    // Create uploaded file record
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const uploadedFile: UploadedFile = {
      id: fileId,
      name: fileData.filename,
      size: fileData.data.length,
      type: fileData.type || 'application/octet-stream',
      dataType: dataType as 'textbook' | 'roleplay' | 'other',
      extractedText: parseResult.text,  // メタデータのみ（or 分割不可の場合は全テキスト）
      uploadedAt: new Date(),
      separable: parseResult.separable  // 分離可能項目情報を追加
    }
    console.log('✅ File record created:', fileId)
    if (parseResult.separable) {
      console.log('📊 Separable info:', parseResult.separable.type, 'count:', parseResult.separable.totalCount)
    }

    // Store file buffer for later content extraction
    fileBuffers.set(fileId, fileData.data)

    // Store in memory (in production, save to database)
    uploadedFiles.set(fileId, uploadedFile)

    console.log('✅ Upload complete, returning success')
    return {
      success: true,
      file: uploadedFile
    }
  } catch (error) {
    console.error('❌ File upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'File upload failed'
    }
  }
})

// Export for other endpoints to access
export { uploadedFiles, fileBuffers }
