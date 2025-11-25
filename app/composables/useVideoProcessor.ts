// Video processing composable using FFmpeg WASM
// 処理ID: FILE-006

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

let ffmpeg: FFmpeg | null = null
let ffmpegLoaded = false

export const useVideoProcessor = () => {
  const isLoading = ref(false)
  const isProcessing = ref(false)
  const progress = ref(0)
  const progressText = ref('')
  const error = ref<string | null>(null)

  // Initialize FFmpeg (lazy loading)
  const initFFmpeg = async (): Promise<void> => {
    if (ffmpegLoaded && ffmpeg) {
      return
    }

    isLoading.value = true
    progressText.value = 'FFmpegを読み込み中...'

    try {
      ffmpeg = new FFmpeg()

      // Set up progress handler
      ffmpeg.on('progress', ({ progress: p }) => {
        progress.value = Math.round(p * 100)
        progressText.value = `処理中... ${progress.value}%`
      })

      ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg]', message)
      })

      // Load FFmpeg WASM with CDN fallback
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'

      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
      })

      ffmpegLoaded = true
      console.log('FFmpeg loaded successfully')
    } catch (err) {
      console.error('Failed to load FFmpeg:', err)
      error.value = 'FFmpegの読み込みに失敗しました'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Extract audio from video file
  const extractAudio = async (videoFile: File): Promise<Blob> => {
    if (!ffmpeg || !ffmpegLoaded) {
      await initFFmpeg()
    }

    if (!ffmpeg) {
      throw new Error('FFmpeg is not initialized')
    }

    isProcessing.value = true
    progress.value = 0
    progressText.value = '動画から音声を抽出中...'
    error.value = null

    try {
      const inputFileName = 'input' + getExtension(videoFile.name)
      const outputFileName = 'output.mp3'

      // Write input file to FFmpeg virtual filesystem
      progressText.value = '動画ファイルを準備中...'
      await ffmpeg.writeFile(inputFileName, await fetchFile(videoFile))

      // Extract audio to MP3
      progressText.value = '音声を抽出中...'
      await ffmpeg.exec([
        '-i', inputFileName,
        '-vn',                    // No video
        '-acodec', 'libmp3lame', // MP3 codec
        '-ab', '128k',           // Bitrate
        '-ar', '44100',          // Sample rate
        outputFileName
      ])

      // Read output file
      progressText.value = '音声ファイルを取得中...'
      const data = await ffmpeg.readFile(outputFileName)

      // Clean up virtual filesystem
      await ffmpeg.deleteFile(inputFileName)
      await ffmpeg.deleteFile(outputFileName)

      // Convert to Blob
      const audioBlob = new Blob([data], { type: 'audio/mpeg' })
      progressText.value = '完了'

      return audioBlob
    } catch (err) {
      console.error('Audio extraction failed:', err)
      error.value = '音声の抽出に失敗しました'
      throw err
    } finally {
      isProcessing.value = false
    }
  }

  // Process video file: extract audio and transcribe
  const processVideoFile = async (videoFile: File): Promise<string> => {
    // Extract audio
    const audioBlob = await extractAudio(videoFile)

    // Send to Whisper API for transcription
    progressText.value = '音声を文字起こし中...'

    const formData = new FormData()
    formData.append('audio', audioBlob, 'extracted_audio.mp3')

    try {
      const response = await $fetch<{ text: string }>('/api/transcribe', {
        method: 'POST',
        body: formData
      })

      progressText.value = '文字起こし完了'
      return response.text
    } catch (err) {
      console.error('Transcription failed:', err)
      error.value = '文字起こしに失敗しました'
      throw err
    }
  }

  // Get file extension
  const getExtension = (filename: string): string => {
    const ext = filename.toLowerCase().split('.').pop()
    return ext ? `.${ext}` : ''
  }

  // Check if file is a video
  const isVideoFile = (filename: string): boolean => {
    const videoExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv', 'flv', 'wmv']
    const ext = filename.toLowerCase().split('.').pop() || ''
    return videoExtensions.includes(ext)
  }

  // Cleanup on unmount
  onUnmounted(() => {
    // FFmpeg instance is shared, don't terminate it
    progress.value = 0
    progressText.value = ''
  })

  return {
    isLoading: readonly(isLoading),
    isProcessing: readonly(isProcessing),
    progress: readonly(progress),
    progressText: readonly(progressText),
    error: readonly(error),
    initFFmpeg,
    extractAudio,
    processVideoFile,
    isVideoFile
  }
}
