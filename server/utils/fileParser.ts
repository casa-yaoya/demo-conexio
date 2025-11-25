// File parsing utilities for different file types
import { read, utils } from 'xlsx'
import type { FileParseResult } from '~/types/file'

/**
 * Parse PDF file and extract text
 */
export async function parsePDF(buffer: Buffer): Promise<FileParseResult> {
  try {
    // Dynamic import for pdf-parse (CommonJS module)
    const pdfParse = await import('pdf-parse').then(m => m.default || m)
    const data = await pdfParse(buffer)
    return {
      success: true,
      text: data.text,
      metadata: {
        pageCount: data.numpages,
        info: data.info
      }
    }
  } catch (error) {
    return {
      success: false,
      text: '',
      error: error instanceof Error ? error.message : 'PDF parsing failed'
    }
  }
}

/**
 * Parse Excel file and extract text from all sheets
 */
export function parseExcel(buffer: Buffer): FileParseResult {
  try {
    const workbook = read(buffer, { type: 'buffer' })
    let extractedText = ''
    const sheets: string[] = []

    workbook.SheetNames.forEach((sheetName) => {
      sheets.push(sheetName)
      const worksheet = workbook.Sheets[sheetName]
      const sheetText = utils.sheet_to_csv(worksheet)
      extractedText += `\n[${sheetName}]\n${sheetText}\n`
    })

    return {
      success: true,
      text: extractedText.trim(),
      metadata: {
        sheets,
        sheetCount: sheets.length
      }
    }
  } catch (error) {
    return {
      success: false,
      text: '',
      error: error instanceof Error ? error.message : 'Excel parsing failed'
    }
  }
}

/**
 * Parse text-based files (txt, csv, etc.)
 */
export function parseText(buffer: Buffer): FileParseResult {
  try {
    const text = buffer.toString('utf-8')
    return {
      success: true,
      text
    }
  } catch (error) {
    return {
      success: false,
      text: '',
      error: error instanceof Error ? error.message : 'Text parsing failed'
    }
  }
}

/**
 * Main file parser that routes to appropriate parser based on file type
 */
export async function parseFile(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<FileParseResult> {
  const extension = filename.toLowerCase().split('.').pop() || ''

  // PDF files
  if (mimeType === 'application/pdf' || extension === 'pdf') {
    return await parsePDF(buffer)
  }

  // Excel files
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel' ||
    ['xlsx', 'xls'].includes(extension)
  ) {
    return parseExcel(buffer)
  }

  // Text-based files
  if (
    mimeType.startsWith('text/') ||
    ['txt', 'csv', 'json', 'md'].includes(extension)
  ) {
    return parseText(buffer)
  }

  // Audio/Video files - no text extraction, just return metadata
  if (mimeType.startsWith('audio/') || mimeType.startsWith('video/')) {
    return {
      success: true,
      text: `[${mimeType.split('/')[0].toUpperCase()} FILE: ${filename}]`,
      metadata: {
        type: mimeType.split('/')[0]
      }
    }
  }

  // Unsupported file type
  return {
    success: false,
    text: '',
    error: `Unsupported file type: ${mimeType}`
  }
}
