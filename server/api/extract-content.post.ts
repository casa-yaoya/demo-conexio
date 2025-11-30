// Extract content from file with selected range
import { readMultipartFormData } from 'h3'
import { parseFileWithRange } from '../utils/fileParser'

export default defineEventHandler(async (event) => {
  console.log('📥 Extract Content API called')
  try {
    // Parse multipart form data
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      return {
        success: false,
        error: 'No form data'
      }
    }

    // Get the file
    const fileData = formData.find(item => item.filename)
    if (!fileData || !fileData.filename || !fileData.data) {
      return {
        success: false,
        error: 'Invalid file data'
      }
    }

    // Get selected range
    const selectedRangeField = formData.find(item => item.name === 'selectedRange')
    let selectedRange: (string | number)[] = []
    if (selectedRangeField?.data) {
      try {
        selectedRange = JSON.parse(selectedRangeField.data.toString())
      } catch {
        selectedRange = []
      }
    }

    console.log('📄 Extracting content from:', fileData.filename)
    console.log('📊 Selected range:', selectedRange)

    // Parse file with selected range
    const parseResult = await parseFileWithRange(
      fileData.data,
      fileData.filename,
      fileData.type || 'application/octet-stream',
      selectedRange
    )

    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error || 'Content extraction failed'
      }
    }

    console.log('✅ Content extracted successfully')
    return {
      success: true,
      text: parseResult.text
    }
  } catch (error) {
    console.error('❌ Extract content error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Content extraction failed'
    }
  }
})
