// File analysis endpoint - Analyzes uploaded files using AI (OpenAI only)
import { readMultipartFormData } from 'h3'
import OpenAI from 'openai'

interface AnalysisResult {
  success: boolean
  text?: string
  pages?: Array<{ pageNumber: number; content: string }>
  error?: string
}

// Lazy initialize client to avoid startup errors when API key is not set
let openaiClient: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const config = useRuntimeConfig()
    openaiClient = new OpenAI({
      apiKey: config.openaiApiKey || process.env.NUXT_OPENAI_API_KEY || ''
    })
  }
  return openaiClient
}

export default defineEventHandler(async (event): Promise<AnalysisResult> => {
  console.log('🔍 Analyze API called')

  try {
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      return { success: false, error: 'No file provided' }
    }

    const fileData = formData.find(item => item.filename)
    const fileTypeField = formData.find(item => item.name === 'fileType')
    const selectedRangeField = formData.find(item => item.name === 'selectedRange')

    if (!fileData || !fileData.filename || !fileData.data) {
      return { success: false, error: 'Invalid file data' }
    }

    const fileType = fileTypeField?.data?.toString() || 'unknown'
    const filename = fileData.filename
    const buffer = fileData.data

    // Parse selected range if provided
    let selectedRange: number[] = []
    if (selectedRangeField?.data) {
      try {
        selectedRange = JSON.parse(selectedRangeField.data.toString())
      } catch {
        selectedRange = []
      }
    }

    console.log(`📄 Analyzing file: ${filename}, type: ${fileType}, size: ${buffer.length}`)
    if (selectedRange.length > 0) {
      console.log(`📊 Selected pages/range: ${selectedRange.join(', ')}`)
    }

    // Route to appropriate analyzer based on file type
    if (fileType === 'pdf' || filename.toLowerCase().endsWith('.pdf')) {
      return await analyzePDF(buffer, filename, selectedRange)
    } else if (fileType === 'audio' || isAudioFile(filename)) {
      return await analyzeAudio(buffer, filename)
    } else if (fileType === 'video' || isVideoFile(filename)) {
      return await analyzeVideo(buffer, filename)
    } else {
      return { success: false, error: `Unsupported file type: ${fileType}` }
    }

  } catch (error) {
    console.error('❌ Analysis error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    }
  }
})

// Check if file is audio
function isAudioFile(filename: string): boolean {
  const audioExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac']
  return audioExtensions.some(ext => filename.toLowerCase().endsWith(ext))
}

// Check if file is video
function isVideoFile(filename: string): boolean {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv']
  return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext))
}

// Analyze PDF using OpenAI Vision
async function analyzePDF(buffer: Buffer, filename: string, selectedPages: number[] = []): Promise<AnalysisResult> {
  console.log('📑 Analyzing PDF with OpenAI Vision...')
  if (selectedPages.length > 0) {
    console.log(`📊 Extracting only pages: ${selectedPages.join(', ')}`)
  }

  try {
    // Convert PDF pages to images using pdf-lib and canvas
    // For now, send the PDF as base64 directly (OpenAI can process PDF)
    const base64PDF = buffer.toString('base64')

    // Build prompt based on selected pages
    let promptText: string
    if (selectedPages.length > 0) {
      const pageList = selectedPages.join(', ')
      promptText = `このPDFファイルから、指定されたページのみの内容を抽出してください。

【抽出対象ページ】: ${pageList}

要件：
1. 上記で指定されたページのみを抽出。他のページは無視
2. テキストは元の配置・順序を保持
3. 表は構造を保持して記述（マークダウン形式推奨）
4. 図やグラフがある場合、その内容を説明
5. 数字や金額は正確に抽出
6. 見出しや項目名は明確に区別
7. 各ページは「=== ページ N ===」で区切り

日本語の文字は全て正確に抽出してください。指定ページ以外の内容は一切含めないでください。`
    } else {
      promptText = `このPDFファイルの内容を全て抽出してください。

要件：
1. テキストは元の配置・順序を保持
2. 表は構造を保持して記述（マークダウン形式推奨）
3. 図やグラフがある場合、その内容を説明
4. 数字や金額は正確に抽出
5. 見出しや項目名は明確に区別
6. ページごとに「=== ページ N ===」で区切り

日本語の文字は全て正確に抽出してください。`
    }

    // Use OpenAI to analyze the PDF
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'file',
              file: {
                filename: filename,
                file_data: `data:application/pdf;base64,${base64PDF}`
              }
            } as any,
            {
              type: 'text',
              text: promptText
            }
          ]
        }
      ],
      max_tokens: 16000
    })

    const content = response.choices[0]?.message?.content || ''
    console.log('✅ PDF analysis complete')

    return {
      success: true,
      text: content
    }
  } catch (error) {
    console.error('PDF analysis error:', error)

    // Fallback: return placeholder
    return {
      success: true,
      text: `[PDF FILE: ${filename}] - OpenAI Vision分析に失敗しました。ファイルサイズ: ${Math.round(buffer.length / 1024)} KB`
    }
  }
}

// Analyze audio using OpenAI Whisper
async function analyzeAudio(buffer: Buffer, filename: string): Promise<AnalysisResult> {
  console.log('🎵 Analyzing audio with OpenAI Whisper...')

  try {
    const mimeType = getMimeType(filename)
    const file = new File([buffer], filename, { type: mimeType })

    // Send to Whisper API for transcription
    const transcription = await getOpenAI().audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'ja'
    })

    console.log('✅ Audio transcription complete via Whisper')

    return {
      success: true,
      text: transcription.text
    }
  } catch (error) {
    console.error('Audio analysis error:', error)
    return {
      success: false,
      error: `音声解析に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// Analyze video using Whisper API
// 処理ID: FILE-006
// Note: For large videos, client-side FFmpeg processing is recommended
async function analyzeVideo(buffer: Buffer, filename: string): Promise<AnalysisResult> {
  console.log('🎬 Analyzing video with Whisper API...')

  try {
    // Create a File object from buffer for Whisper API
    const mimeType = getMimeType(filename)
    const file = new File([buffer], filename, { type: mimeType })

    // Send to Whisper API for transcription
    const transcription = await getOpenAI().audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'ja'
    })

    console.log('✅ Video transcription complete via Whisper')

    return {
      success: true,
      text: transcription.text
    }
  } catch (error) {
    console.error('Video analysis error:', error)
    return {
      success: false,
      error: `動画解析に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// Get MIME type from filename
function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop()
  const mimeTypes: Record<string, string> = {
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'm4a': 'audio/m4a',
    'ogg': 'audio/ogg',
    'flac': 'audio/flac',
    'aac': 'audio/aac',
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    'webm': 'video/webm',
    'mkv': 'video/x-matroska',
    'pdf': 'application/pdf'
  }
  return mimeTypes[ext || ''] || 'application/octet-stream'
}
