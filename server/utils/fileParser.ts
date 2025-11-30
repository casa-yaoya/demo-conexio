// File parsing utilities for different file types
import { read, utils } from 'xlsx'
import JSZip from 'jszip'
import type { FileParseResult, SeparableInfo, SeparableItem } from '~/types/file'

/**
 * PDFファイルからページ数を抽出（簡易的な方法）
 * PDFの内部構造を直接パースしてページ数を取得
 */
function extractPdfPageCount(buffer: Buffer): number {
  try {
    const content = buffer.toString('latin1')

    // 方法1: /Type /Page オブジェクトをカウント（末尾が/Pagesでないもの）
    // /Type/Page または /Type /Page の形式に対応
    const pageMatches = content.match(/\/Type\s*\/Page(?![s])/gi)
    if (pageMatches && pageMatches.length > 0) {
      console.log(`📄 PDF pages found via /Type /Page: ${pageMatches.length}`)
      return pageMatches.length
    }

    // 方法2: /Pages オブジェクトの /Count を探す（ページツリーから）
    // /Type /Pages ... /Count X の形式
    const pagesMatch = content.match(/\/Type\s*\/Pages[^>]*\/Count\s+(\d+)/i)
    if (pagesMatch) {
      const count = parseInt(pagesMatch[1], 10)
      console.log(`📄 PDF pages found via /Pages /Count: ${count}`)
      return count
    }

    // 方法3: 単純に /Count を探す（ルートのページツリー）
    // 複数の/Countがある場合は最大値を取る（ルートのページツリーが最大）
    const countMatches = content.match(/\/Count\s+(\d+)/g)
    if (countMatches && countMatches.length > 0) {
      const counts = countMatches.map(m => {
        const num = m.match(/(\d+)/)
        return num ? parseInt(num[1], 10) : 0
      }).filter(n => n > 0 && n < 10000)

      if (counts.length > 0) {
        const maxCount = Math.max(...counts)
        console.log(`📄 PDF pages found via /Count (max): ${maxCount}`)
        return maxCount
      }
    }

    // 方法4: endobj でオブジェクト数を数えて推測（最終手段）
    const objMatches = content.match(/\d+\s+0\s+obj/g)
    if (objMatches && objMatches.length > 5) {
      // 大まかな推測: オブジェクト数の1/5程度がページ数の可能性
      const estimatedPages = Math.max(1, Math.floor(objMatches.length / 10))
      console.log(`📄 PDF pages estimated from objects: ${estimatedPages} (${objMatches.length} objects)`)
      // この推測は不正確なので、最低でも1を返す
      return Math.min(estimatedPages, 100)
    }

    console.log('📄 PDF page count extraction failed, defaulting to 1')
    return 1
  } catch (error) {
    console.error('PDF page count extraction error:', error)
    return 1
  }
}

/**
 * Parse PDF file - extract metadata only (page count, size)
 * テキスト抽出はOpenAI Vision API (/api/analyze) で行う
 */
export async function parsePDF(buffer: Buffer, filename: string): Promise<FileParseResult> {
  console.log(`📄 Parsing PDF "${filename}" for metadata...`)

  // ページ数を抽出（バイナリパース）
  const pageCount = extractPdfPageCount(buffer)
  console.log(`📄 PDF "${filename}" has ${pageCount} pages`)

  // 分離可能項目情報を作成（ページ番号ベース）
  const separableItems: SeparableItem[] = []
  for (let i = 1; i <= pageCount; i++) {
    separableItems.push({
      type: 'page' as const,
      value: i,
      label: `ページ ${i}`
    })
  }

  const separable: SeparableInfo = {
    type: 'page',
    isNumeric: true,
    items: separableItems,
    totalCount: pageCount
  }

  // メタデータのみ返す（テキストはOpenAI Vision APIで抽出）
  return {
    success: true,
    text: `[PDF FILE: ${filename}]\nページ数: ${pageCount}\nサイズ: ${Math.round(buffer.length / 1024)} KB\n(内容はAI解析で抽出されます)`,
    metadata: {
      type: 'pdf',
      size: buffer.length,
      pageCount
    },
    separable
  }
}

/**
 * Parse Excel file - metadata only (sheet names)
 * テキスト抽出は後で範囲選択後に行う
 */
export function parseExcelMetadata(buffer: Buffer): FileParseResult {
  try {
    const workbook = read(buffer, { type: 'buffer' })
    const sheets: string[] = workbook.SheetNames

    // 分離可能項目情報を作成（シート名ベース）
    const separableItems: SeparableItem[] = sheets.map(sheetName => ({
      type: 'sheet' as const,
      value: sheetName,
      label: sheetName
    }))

    const separable: SeparableInfo = {
      type: 'sheet',
      isNumeric: false,
      items: separableItems,
      totalCount: sheets.length
    }

    return {
      success: true,
      text: `[EXCEL FILE]\nシート数: ${sheets.length}\nシート: ${sheets.join(', ')}\n(内容は範囲選択後に読み取られます)`,
      metadata: {
        sheets,
        sheetCount: sheets.length
      },
      separable
    }
  } catch (error) {
    return {
      success: false,
      text: '',
      error: error instanceof Error ? error.message : 'Excel metadata parsing failed'
    }
  }
}

/**
 * Parse Excel file and extract text from specified sheets
 */
export function parseExcel(buffer: Buffer, selectedSheets?: string[]): FileParseResult {
  try {
    const workbook = read(buffer, { type: 'buffer' })
    let extractedText = ''
    const sheets: string[] = []

    const sheetsToProcess = selectedSheets && selectedSheets.length > 0
      ? workbook.SheetNames.filter(name => selectedSheets.includes(name))
      : workbook.SheetNames

    sheetsToProcess.forEach((sheetName) => {
      sheets.push(sheetName)
      const worksheet = workbook.Sheets[sheetName]
      const sheetText = utils.sheet_to_csv(worksheet)
      extractedText += `\n[${sheetName}]\n${sheetText}\n`
    })

    // 分離可能項目情報を作成（シート名ベース）
    const separableItems: SeparableItem[] = workbook.SheetNames.map(sheetName => ({
      type: 'sheet' as const,
      value: sheetName,
      label: sheetName
    }))

    const separable: SeparableInfo = {
      type: 'sheet',
      isNumeric: false,
      items: separableItems,
      totalCount: workbook.SheetNames.length
    }

    return {
      success: true,
      text: extractedText.trim(),
      metadata: {
        sheets: workbook.SheetNames,
        sheetCount: workbook.SheetNames.length
      },
      separable
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
 * Parse PowerPoint file - metadata only (slide count)
 * テキスト抽出は後で範囲選択後に行う
 */
export async function parsePowerPointMetadata(buffer: Buffer): Promise<FileParseResult> {
  try {
    const zip = await JSZip.loadAsync(buffer)

    // スライドファイルを取得してカウント
    const slideFiles = Object.keys(zip.files)
      .filter(name => name.match(/ppt\/slides\/slide\d+\.xml$/))

    const slideCount = slideFiles.length

    // 分離可能項目情報を作成（スライド番号ベース）
    const separableItems: SeparableItem[] = []
    for (let i = 1; i <= slideCount; i++) {
      separableItems.push({
        type: 'slide' as const,
        value: i,
        label: `スライド ${i}`
      })
    }

    const separable: SeparableInfo = {
      type: 'slide',
      isNumeric: true,
      items: separableItems,
      totalCount: slideCount
    }

    return {
      success: true,
      text: `[POWERPOINT FILE]\nスライド数: ${slideCount}\n(内容は範囲選択後に読み取られます)`,
      metadata: {
        slideCount
      },
      separable
    }
  } catch (error) {
    return {
      success: false,
      text: '',
      error: error instanceof Error ? error.message : 'PowerPoint metadata parsing failed'
    }
  }
}

/**
 * Parse PowerPoint file and extract text from specified slides
 * PPTXファイルからスライドのテキストを抽出
 * 処理ID: FILE-003
 */
export async function parsePowerPoint(buffer: Buffer, selectedSlides?: number[]): Promise<FileParseResult> {
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
      const slideNum = parseInt(slidePath.match(/slide(\d+)\.xml$/)?.[1] || '0')

      // 選択されたスライドのみ処理
      if (selectedSlides && selectedSlides.length > 0 && !selectedSlides.includes(slideNum)) {
        continue
      }

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

    // 分離可能項目情報を作成（スライド番号ベース）
    const separableItems: SeparableItem[] = []
    for (let i = 1; i <= slideFiles.length; i++) {
      separableItems.push({
        type: 'slide' as const,
        value: i,
        label: `スライド ${i}`
      })
    }

    const separable: SeparableInfo = {
      type: 'slide',
      isNumeric: true,
      items: separableItems,
      totalCount: slideFiles.length
    }

    return {
      success: true,
      text: extractedText.trim() || '(テキストが抽出できませんでした)',
      metadata: {
        slides,
        slideCount: slideFiles.length
      },
      separable
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

/**
 * Parse file for metadata only (structure info without content extraction)
 * 構成情報のみを取得（内容は読み取らない）
 */
export async function parseFileMetadata(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<FileParseResult> {
  const extension = filename.toLowerCase().split('.').pop() || ''

  // PDF files - ページ数のみ取得
  if (mimeType === 'application/pdf' || extension === 'pdf') {
    return await parsePDF(buffer, filename)  // 既にメタデータのみ返す
  }

  // Excel files - シート名のみ取得
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel' ||
    ['xlsx', 'xls'].includes(extension)
  ) {
    return parseExcelMetadata(buffer)
  }

  // PowerPoint files - スライド数のみ取得
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    mimeType === 'application/vnd.ms-powerpoint' ||
    ['pptx', 'ppt'].includes(extension)
  ) {
    return await parsePowerPointMetadata(buffer)
  }

  // Word files - 通常解析（分割できないので全部読む）
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword' ||
    ['docx', 'doc'].includes(extension)
  ) {
    return await parseWord(buffer)
  }

  // Text-based files - 通常解析（分割できないので全部読む）
  if (
    mimeType.startsWith('text/') ||
    ['txt', 'csv', 'json', 'md'].includes(extension)
  ) {
    return parseText(buffer)
  }

  // Audio/Video files - メタデータのみ
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

/**
 * Parse file content with selected range
 * 選択された範囲のみの内容を取得
 */
export async function parseFileWithRange(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  selectedRange: (string | number)[]
): Promise<FileParseResult> {
  const extension = filename.toLowerCase().split('.').pop() || ''

  // PDF files - 選択されたページのみ（現状は全部。OpenAI Vision APIで範囲指定）
  if (mimeType === 'application/pdf' || extension === 'pdf') {
    // PDFは現状全ページをOpenAI Vision APIで解析
    return await parsePDF(buffer, filename)
  }

  // Excel files - 選択されたシートのみ
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel' ||
    ['xlsx', 'xls'].includes(extension)
  ) {
    const selectedSheets = selectedRange.map(v => String(v))
    return parseExcel(buffer, selectedSheets)
  }

  // PowerPoint files - 選択されたスライドのみ
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    mimeType === 'application/vnd.ms-powerpoint' ||
    ['pptx', 'ppt'].includes(extension)
  ) {
    const selectedSlides = selectedRange.map(v => Number(v))
    return await parsePowerPoint(buffer, selectedSlides)
  }

  // その他のファイルは通常解析
  return await parseFile(buffer, filename, mimeType)
}
