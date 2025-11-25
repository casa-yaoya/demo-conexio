export interface RealtimeConfig {
  voice?: 'alloy' | 'echo' | 'shimmer' | 'ash' | 'ballad' | 'coral' | 'sage' | 'verse'
  instructions?: string
  vadThreshold?: number
  silenceDuration?: number
}

export const useRealtimeAPI = () => {
  const isConnected = ref(false)
  const isPlaying = ref(false)
  const isRecording = ref(false)
  const isSpeaking = ref(false)
  const connectionStatus = ref<string>('未接続')

  let realtimeWS: WebSocket | null = null
  let audioContext: AudioContext | null = null
  let mediaStream: MediaStream | null = null
  let audioProcessor: ScriptProcessorNode | null = null
  let currentConfig: RealtimeConfig = {}

  // Audio playback queue for smooth playback
  let audioQueue: Float32Array[] = []
  let isAudioPlaying = false

  // Event callbacks
  const onTranscript = ref<((text: string, isFinal: boolean) => void) | null>(null)
  const onAIResponse = ref<((text: string) => void) | null>(null)
  const onError = ref<((error: string) => void) | null>(null)

  const startRoleplay = async (config: RealtimeConfig = {}) => {
    try {
      console.log('🎬 Starting roleplay...')
      currentConfig = config

      // Update status
      isPlaying.value = true
      connectionStatus.value = 'エフェメラルキー取得中...'

      // Get ephemeral key from server
      const sessionData = await $fetch('/api/realtime-session', {
        method: 'POST'
      })

      if (!sessionData || !sessionData.client_secret) {
        throw new Error('Failed to get session data')
      }

      console.log('✅ Got ephemeral key, connecting to WebSocket...')
      connectionStatus.value = 'WebSocket接続中...'

      // Connect to OpenAI Realtime WebSocket
      const wsUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`
      realtimeWS = new WebSocket(wsUrl, [
        'realtime',
        `openai-insecure-api-key.${sessionData.client_secret}`,
        'openai-beta.realtime-v1'
      ])

      // WebSocket event handlers
      realtimeWS.onopen = () => {
        console.log('✅ WebSocket connected')
        isConnected.value = true
        connectionStatus.value = 'セッション作成待機中...'
      }

      realtimeWS.onmessage = async (event) => {
        const data = JSON.parse(event.data)

        // Handle session.created event
        if (data.type === 'session.created') {
          console.log('✅ Session created')

          // Configure session with VAD and voice settings
          const updateMessage = {
            type: 'session.update',
            session: {
              modalities: ['audio', 'text'],
              instructions: config.instructions || 'あなたは親しみやすい日本語のアシスタントです。簡潔に答えてください。',
              voice: config.voice || 'alloy',
              input_audio_format: 'pcm16',
              output_audio_format: 'pcm16',
              turn_detection: {
                type: 'server_vad',
                threshold: config.vadThreshold || 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: config.silenceDuration || 500
              }
            }
          }

          console.log('📤 Configuring session...')
          realtimeWS!.send(JSON.stringify(updateMessage))
        }

        // Handle session.updated event
        if (data.type === 'session.updated') {
          console.log('✅ Session configured')
          connectionStatus.value = 'マイク初期化中...'

          // Initialize audio
          await initializeAudio()
          isRecording.value = true
          connectionStatus.value = '会話可能'
        }

        // Handle speech started
        if (data.type === 'input_audio_buffer.speech_started') {
          connectionStatus.value = '聞いています...'
        }

        // Handle response created
        if (data.type === 'response.created') {
          connectionStatus.value = 'AI応答中...'
          isSpeaking.value = true
        }

        // Handle audio response
        if (data.type === 'response.audio.delta' && data.delta) {
          await playAudioChunk(data.delta)
        }

        // Handle transcript
        if (data.type === 'conversation.item.input_audio_transcription.completed') {
          if (onTranscript.value && data.transcript) {
            onTranscript.value(data.transcript, true)
          }
        }

        // Handle AI text response
        if (data.type === 'response.text.delta' && data.delta) {
          if (onAIResponse.value) {
            onAIResponse.value(data.delta)
          }
        }

        // Handle response done
        if (data.type === 'response.done') {
          console.log('✅ AI response complete')
          connectionStatus.value = '会話可能'
          isSpeaking.value = false
        }

        // Handle error
        if (data.type === 'error') {
          console.error('❌ Error:', data.error)
          if (onError.value) {
            onError.value(data.error?.message || 'Unknown error')
          }
        }

        // Log important events
        const importantEvents = ['session.created', 'session.updated', 'error',
          'input_audio_buffer.speech_started', 'response.created', 'response.done']
        if (importantEvents.includes(data.type)) {
          console.log('📩 WebSocket:', data.type)
        }
      }

      realtimeWS.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        connectionStatus.value = 'エラー'
        isConnected.value = false
        if (onError.value) {
          onError.value('WebSocket connection error')
        }
      }

      realtimeWS.onclose = () => {
        console.log('WebSocket closed')
        isConnected.value = false
        isRecording.value = false
        connectionStatus.value = '未接続'
      }

    } catch (error: any) {
      console.error('❌ Error starting roleplay:', error)
      connectionStatus.value = 'エラー: ' + error.message
      isPlaying.value = false
      isConnected.value = false
      if (onError.value) {
        onError.value(error.message)
      }
    }
  }

  const stopRoleplay = () => {
    console.log('🛑 Stopping roleplay...')

    if (realtimeWS) {
      realtimeWS.close()
      realtimeWS = null
    }

    if (audioContext) {
      audioContext.close()
      audioContext = null
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop())
      mediaStream = null
    }

    if (audioProcessor) {
      audioProcessor.disconnect()
      audioProcessor = null
    }

    // Clear audio queue
    audioQueue = []
    isAudioPlaying = false

    isPlaying.value = false
    isConnected.value = false
    isRecording.value = false
    isSpeaking.value = false
    connectionStatus.value = '未接続'
  }

  const toggleRoleplay = async (config?: RealtimeConfig) => {
    if (isPlaying.value) {
      stopRoleplay()
    } else {
      await startRoleplay(config || currentConfig)
    }
  }

  // Toggle recording (pause/resume microphone)
  const toggleRecording = () => {
    if (!isConnected.value) return

    isRecording.value = !isRecording.value

    if (!isRecording.value && realtimeWS && realtimeWS.readyState === WebSocket.OPEN) {
      // Commit audio buffer when stopping
      realtimeWS.send(JSON.stringify({
        type: 'input_audio_buffer.commit'
      }))
      realtimeWS.send(JSON.stringify({
        type: 'response.create'
      }))
    }

    connectionStatus.value = isRecording.value ? '聞いています...' : '一時停止'
  }

  // Send text message
  const sendText = (text: string) => {
    if (!realtimeWS || realtimeWS.readyState !== WebSocket.OPEN) return

    realtimeWS.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }]
      }
    }))

    realtimeWS.send(JSON.stringify({
      type: 'response.create'
    }))
  }

  // Update session instructions
  const updateInstructions = (instructions: string) => {
    if (!realtimeWS || realtimeWS.readyState !== WebSocket.OPEN) return

    realtimeWS.send(JSON.stringify({
      type: 'session.update',
      session: {
        instructions
      }
    }))
  }

  const initializeAudio = async () => {
    try {
      console.log('🎤 Initializing microphone...')

      // Create AudioContext
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000
      })

      // Get microphone permission
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      })

      const source = audioContext.createMediaStreamSource(mediaStream)
      audioProcessor = audioContext.createScriptProcessor(2048, 1, 1)

      audioProcessor.onaudioprocess = (e) => {
        // Only send audio when recording is active
        if (!isRecording.value || !realtimeWS || realtimeWS.readyState !== WebSocket.OPEN) return

        const inputData = e.inputBuffer.getChannelData(0)
        const pcm16 = new Int16Array(inputData.length)

        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]))
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
        }

        // Base64 encode using ArrayBuffer
        const base64Audio = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(pcm16.buffer))))

        // Send audio to WebSocket
        realtimeWS.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: base64Audio
        }))
      }

      source.connect(audioProcessor)
      audioProcessor.connect(audioContext.destination)

      console.log('✅ Microphone initialized')
    } catch (error) {
      console.error('❌ Error initializing audio:', error)
      throw error
    }
  }

  // Play next audio chunk from queue
  const playNextAudio = () => {
    if (audioQueue.length === 0 || !audioContext) {
      isAudioPlaying = false
      isSpeaking.value = false
      return
    }

    isAudioPlaying = true
    isSpeaking.value = true

    const float32 = audioQueue.shift()!
    const audioBuffer = audioContext.createBuffer(1, float32.length, 24000)
    audioBuffer.getChannelData(0).set(float32)

    const source = audioContext.createBufferSource()
    source.buffer = audioBuffer
    source.connect(audioContext.destination)
    source.onended = () => {
      playNextAudio()
    }
    source.start()
  }

  const playAudioChunk = async (base64Audio: string) => {
    if (!audioContext) return

    try {
      const binaryString = atob(base64Audio)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const int16Array = new Int16Array(bytes.buffer)
      const float32Array = new Float32Array(int16Array.length)

      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768
      }

      // Queue audio for smooth playback
      audioQueue.push(float32Array)

      if (!isAudioPlaying) {
        playNextAudio()
      }
    } catch (error) {
      console.error('❌ Error playing audio:', error)
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    stopRoleplay()
  })

  return {
    isConnected,
    isPlaying,
    isRecording,
    isSpeaking,
    connectionStatus,
    toggleRoleplay,
    toggleRecording,
    startRoleplay,
    stopRoleplay,
    sendText,
    updateInstructions,
    onTranscript,
    onAIResponse,
    onError
  }
}
