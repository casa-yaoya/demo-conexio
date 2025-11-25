// File upload and parsing types

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  dataType: 'textbook' | 'roleplay' | 'other'
  extractedText: string
  uploadedAt: Date
  url?: string
}

export interface FileParseResult {
  success: boolean
  text: string
  error?: string
  metadata?: {
    pageCount?: number
    sheets?: string[]
    duration?: number
    [key: string]: any
  }
}

export interface FileUploadRequest {
  file: File
  dataType?: string
}

export interface FileUploadResponse {
  success: boolean
  file?: UploadedFile
  error?: string
}
