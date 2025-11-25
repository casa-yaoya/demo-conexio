// File analysis endpoint - Analyzes uploaded files using AI
import { readMultipartFormData } from 'h3'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

interface AnalysisResult {
  success: boolean
  text?: string
  pages?: Array<{ pageNumber: number; content: string }>
  error?: string
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

export default defineEventHandler(async (event): Promise<AnalysisResult> => {
  console.log('🔍 Analyze API called')

  try {
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      return { success: false, error: 'No file provided' }
    }

    const fileData = formData.find(item => item.filename)
    const fileTypeField = formData.find(item => item.name === 'fileType')

    if (!fileData || !fileData.filename || !fileData.data) {
      return { success: false, error: 'Invalid file data' }
    }

    const fileType = fileTypeField?.data?.toString() || 'unknown'
    const filename = fileData.filename
    const buffer = fileData.data

    console.log(`📄 Analyzing file: ${filename}, type: ${fileType}, size: ${buffer.length}`)

    // Route to appropriate analyzer based on file type
    if (fileType === 'pdf' || filename.toLowerCase().endsWith('.pdf')) {
      return await analyzePDF(buffer, filename)
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
async function analyzePDF(buffer: Buffer, filename: string): Promise<AnalysisResult> {
  console.log('📑 Analyzing PDF with OpenAI Vision...')

  try {
    // Convert PDF pages to images using pdf-lib and canvas
    // For now, send the PDF as base64 directly (OpenAI can process PDF)
    const base64PDF = buffer.toString('base64')

    // Use OpenAI to analyze the PDF
    const response = await openai.chat.completions.create({
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
              text: `このPDFファイルの内容を全て抽出してください。

要件：
1. テキストは元の配置・順序を保持
2. 表は構造を保持して記述（マークダウン形式推奨）
3. 図やグラフがある場合、その内容を説明
4. 数字や金額は正確に抽出
5. 見出しや項目名は明確に区別
6. ページごとに「=== ページ N ===」で区切り

日本語の文字は全て正確に抽出してください。`
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

// Analyze audio using Claude
async function analyzeAudio(buffer: Buffer, filename: string): Promise<AnalysisResult> {
  console.log('🎵 Analyzing audio with Claude...')

  try {
    const base64Audio = buffer.toString('base64')
    const mimeType = getMimeType(filename)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64Audio
              }
            },
            {
              type: 'text',
              text: `この音声ファイルの内容を文字起こししてください。

要件：
1. 発言者が複数いる場合は、発言者を区別
2. タイムスタンプは不要
3. 聞き取れない部分は[不明瞭]と記載
4. 日本語は正確に書き起こし

音声の全内容を正確に文字起こししてください。`
            }
          ]
        }
      ]
    })

    const content = response.content[0]?.type === 'text' ? response.content[0].text : ''
    console.log('✅ Audio transcription complete')

    return {
      success: true,
      text: content
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
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'ja'
    })

    console.log('✅ Video transcription complete via Whisper')

    return {
      success: true,
      text: transcription.text
    }
  } catch (whisperError: any) {
    console.warn('Whisper API failed, trying Claude fallback:', whisperError.message)

    // Fallback: try direct video analysis with Claude
    try {
      const base64Video = buffer.toString('base64')
      const mimeType = getMimeType(filename)

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 16000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: mimeType,
                  data: base64Video
                }
              },
              {
                type: 'text',
                text: `この動画の音声内容を文字起こししてください。

要件：
1. 発言者が複数いる場合は、発言者を区別
2. タイムスタンプは不要
3. 聞き取れない部分は[不明瞭]と記載
4. 日本語は正確に書き起こし

動画内の全ての音声内容を正確に文字起こししてください。`
              }
            ]
          }
        ]
      })

      const content = response.content[0]?.type === 'text' ? response.content[0].text : ''
      console.log('✅ Video transcription complete via Claude fallback')

      return {
        success: true,
        text: content
      }
    } catch (claudeError) {
      console.error('Video analysis error:', claudeError)
      return {
        success: false,
        error: `動画解析に失敗しました: ${whisperError.message}`
      }
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
