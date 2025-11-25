// File upload endpoint
import { readMultipartFormData } from 'h3'
import { parseFile } from '../utils/fileParser'
import type { FileUploadResponse, UploadedFile } from '~/types/file'

// In-memory storage for uploaded files (in production, use database)
const uploadedFiles = new Map<string, UploadedFile>()

export default defineEventHandler(async (event): Promise<FileUploadResponse> => {
  try {
    // Parse multipart form data
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      return {
        success: false,
        error: 'No file provided'
      }
    }

    // Get the first file from form data
    const fileData = formData.find(item => item.filename)

    if (!fileData || !fileData.filename || !fileData.data) {
      return {
        success: false,
        error: 'Invalid file data'
      }
    }

    // Get dataType from form data (optional)
    const dataTypeField = formData.find(item => item.name === 'dataType')
    const dataType = dataTypeField?.data?.toString() || 'other'

    // Parse file content
    const parseResult = await parseFile(
      fileData.data,
      fileData.filename,
      fileData.type || 'application/octet-stream'
    )

    if (!parseResult.success) {
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
      extractedText: parseResult.text,
      uploadedAt: new Date()
    }

    // Store in memory (in production, save to database)
    uploadedFiles.set(fileId, uploadedFile)

    return {
      success: true,
      file: uploadedFile
    }
  } catch (error) {
    console.error('File upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'File upload failed'
    }
  }
})

// Export uploadedFiles for other endpoints to access
export { uploadedFiles }
