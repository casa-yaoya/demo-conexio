// File parsing utilities for different file types
import { read, utils } from 'xlsx'
import JSZip from 'jszip'
import type { FileParseResult } from '~/types/file'

/**
 * Parse PDF file - returns placeholder (actual text extraction done via AI)
 * PDFの解析はAI（GPT-4 Vision等）で行うため、ここではメタデータのみを返す
 */
export async function parsePDF(buffer: Buffer, filename: string): Promise<FileParseResult> {
  // PDFはサイズ情報のみ記録し、実際のテキスト抽出はAI処理時に行う
  return {
    success: true,
    text: `[PDF FILE: ${filename}] (${Math.round(buffer.length / 1024)} KB)`,
    metadata: {
      type: 'pdf',
      size: buffer.length
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
 * Parse PowerPoint file and extract text from all slides
 * PPTXファイルからスライドのテキストを抽出
 * 処理ID: FILE-003
 */
export async function parsePowerPoint(buffer: Buffer): Promise<FileParseResult> {
  try {
    const zip = await JSZip.loadAsync(buffer)
    let extractedText = ''
    const slides: string[] = []

    // スライドファイルを取得 (ppt/slides/slide1.xml, slide2.xml, ...)
    const slideFiles = Object.keys(zip.files)
      .filter(name => name.match(/ppt\/slides\/slide\d+\.xml$/))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] || '0')
        const numB = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] || '0')
        return numA - numB
      })

    for (const slidePath of slideFiles) {
      const slideNum = slidePath.match(/slide(\d+)\.xml$/)?.[1] || '0'
      const file = zip.files[slidePath]
      const content = await file.async('text')

      // <a:t>タグからテキストを抽出
      const textMatches = content.match(/<a:t>([^<]*)<\/a:t>/g) || []
      const texts = textMatches.map(match => match.replace(/<\/?a:t>/g, '').trim()).filter(t => t)

      if (texts.length > 0) {
        slides.push(`Slide ${slideNum}`)
        extractedText += `\n[Slide ${slideNum}]\n${texts.join('\n')}\n`
      }
    }

    return {
      success: true,
      text: extractedText.trim() || '(テキストが抽出できませんでした)',
      metadata: {
        slides,
        slideCount: slideFiles.length
      }
    }
  } catch (error) {
    return {
      success: false,
      text: '',
      error: error instanceof Error ? error.message : 'PowerPoint parsing failed'
    }
  }
}

/**
 * Parse Word file and extract text from document
 * DOCXファイルからテキストを抽出
 * 処理ID: API-FILE-003
 */
export async function parseWord(buffer: Buffer): Promise<FileParseResult> {
  try {
    const zip = await JSZip.loadAsync(buffer)

    // document.xmlからテキストを抽出
    const documentFile = zip.files['word/document.xml']
    if (!documentFile) {
      return {
        success: false,
        text: '',
        error: 'Word document.xml not found'
      }
    }

    const content = await documentFile.async('text')
    let extractedText = ''

    // <w:t>タグからテキストを抽出
    const textMatches = content.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []
    const paragraphs: string[] = []
    let currentParagraph = ''

    // 段落を検出して整形
    const paragraphMatches = content.match(/<w:p[^>]*>[\s\S]*?<\/w:p>/g) || []

    for (const paragraph of paragraphMatches) {
      const texts = paragraph.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []
      const paragraphText = texts
        .map(t => t.replace(/<w:t[^>]*>/g, '').replace(/<\/w:t>/g, ''))
        .join('')

      if (paragraphText.trim()) {
        paragraphs.push(paragraphText.trim())
      }
    }

    extractedText = paragraphs.join('\n\n')

    return {
      success: true,
      text: extractedText.trim() || '(テキストが抽出できませんでした)',
      metadata: {
        type: 'word',
        paragraphCount: paragraphs.length
      }
    }
  } catch (error) {
    return {
      success: false,
      text: '',
      error: error instanceof Error ? error.message : 'Word parsing failed'
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
    return await parsePDF(buffer, filename)
  }

  // Excel files
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel' ||
    ['xlsx', 'xls'].includes(extension)
  ) {
    return parseExcel(buffer)
  }

  // PowerPoint files
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    mimeType === 'application/vnd.ms-powerpoint' ||
    ['pptx', 'ppt'].includes(extension)
  ) {
    return await parsePowerPoint(buffer)
  }

  // Word files
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword' ||
    ['docx', 'doc'].includes(extension)
  ) {
    return await parseWord(buffer)
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
