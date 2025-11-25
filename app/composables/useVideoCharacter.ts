// Video Character System composable
// ビデオキャラクターのドラッグ＆ドロップとアイドル/スピーキング切り替え

export interface VideoSlot {
  id: string
  label: string
  file: File | null
  blobUrl: string | null
  filename: string | null
}

export type VideoState = 'idle' | 'speaking'

export const useVideoCharacter = () => {
  // Video slots for drag & drop
  const videoSlots = ref<VideoSlot[]>([
    { id: 'idle', label: 'アイドル', file: null, blobUrl: null, filename: null },
    { id: 'speaking', label: 'スピーキング', file: null, blobUrl: null, filename: null },
    { id: 'video3', label: '動画3', file: null, blobUrl: null, filename: null },
    { id: 'video4', label: '動画4', file: null, blobUrl: null, filename: null },
    { id: 'video5', label: '動画5', file: null, blobUrl: null, filename: null }
  ])

  // Current video state (idle or speaking)
  const currentState = ref<VideoState>('idle')

  // Current active video URL
  const currentVideoUrl = computed(() => {
    const idleSlot = videoSlots.value.find(s => s.id === 'idle')
    const speakingSlot = videoSlots.value.find(s => s.id === 'speaking')

    if (currentState.value === 'speaking' && speakingSlot?.blobUrl) {
      return speakingSlot.blobUrl
    }

    if (idleSlot?.blobUrl) {
      return idleSlot.blobUrl
    }

    return null
  })

  // Check if any video is loaded
  const hasVideo = computed(() => {
    return videoSlots.value.some(s => s.blobUrl !== null)
  })

  // Handle video file selection for a slot
  const handleVideoFile = (slotId: string, file: File) => {
    if (!file.type.startsWith('video/')) {
      console.error('Not a video file:', file.type)
      return false
    }

    const slot = videoSlots.value.find(s => s.id === slotId)
    if (!slot) {
      console.error('Slot not found:', slotId)
      return false
    }

    // Revoke previous blob URL to free memory
    if (slot.blobUrl) {
      URL.revokeObjectURL(slot.blobUrl)
    }

    // Create new blob URL
    slot.file = file
    slot.blobUrl = URL.createObjectURL(file)
    slot.filename = file.name

    console.log(`Video loaded to ${slotId}:`, file.name)
    return true
  }

  // Remove video from a slot
  const removeVideo = (slotId: string) => {
    const slot = videoSlots.value.find(s => s.id === slotId)
    if (!slot) return

    if (slot.blobUrl) {
      URL.revokeObjectURL(slot.blobUrl)
    }

    slot.file = null
    slot.blobUrl = null
    slot.filename = null
  }

  // Switch video state (idle/speaking)
  const switchToState = (state: VideoState) => {
    currentState.value = state
  }

  // Get slot by ID
  const getSlot = (slotId: string) => {
    return videoSlots.value.find(s => s.id === slotId)
  }

  // Cleanup on unmount
  onUnmounted(() => {
    // Revoke all blob URLs
    videoSlots.value.forEach(slot => {
      if (slot.blobUrl) {
        URL.revokeObjectURL(slot.blobUrl)
      }
    })
  })

  return {
    videoSlots,
    currentState,
    currentVideoUrl,
    hasVideo,
    handleVideoFile,
    removeVideo,
    switchToState,
    getSlot
  }
}
