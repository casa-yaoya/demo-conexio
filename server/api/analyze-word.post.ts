// Word file analysis endpoint
// 処理ID: API-FILE-003

import { readMultipartFormData } from 'h3'
import { parseWord } from '../utils/fileParser'

interface WordAnalysisResult {
  success: boolean
  content?: string
  filename?: string
  error?: string
}

export default defineEventHandler(async (event): Promise<WordAnalysisResult> => {
  console.log('📄 Analyze Word API called')

  try {
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      return { success: false, error: 'No file provided' }
    }

    const fileData = formData.find(item => item.filename)

    if (!fileData || !fileData.filename || !fileData.data) {
      return { success: false, error: 'Invalid file data' }
    }

    const filename = fileData.filename
    const buffer = fileData.data

    console.log(`📄 Analyzing Word file: ${filename}, size: ${buffer.length}`)

    // Check file extension
    const ext = filename.toLowerCase().split('.').pop()
    if (!['doc', 'docx'].includes(ext || '')) {
      return { success: false, error: 'Invalid file type. Only .doc and .docx files are supported.' }
    }

    // Parse Word file
    const result = await parseWord(buffer)

    if (result.success) {
      console.log('✅ Word analysis complete')
      return {
        success: true,
        content: result.text,
        filename: filename
      }
    } else {
      return {
        success: false,
        error: result.error || 'Word parsing failed'
      }
    }
  } catch (error) {
    console.error('❌ Word analysis error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Word analysis failed'
    }
  }
})
