export const generateVideoThumbnail = async (file: File): Promise<string | null> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null
  }

  return new Promise(resolve => {
    const video = document.createElement('video')
    const objectUrl = URL.createObjectURL(file)

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl)
      video.removeAttribute('src')
      video.load()
    }

    const resolveWith = (value: string | null) => {
      cleanup()
      resolve(value)
    }

    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true

    const captureFrame = () => {
      video.removeEventListener('seeked', captureFrame)
      video.removeEventListener('loadeddata', captureFrame)

      if (!video.videoWidth || !video.videoHeight) {
        resolveWith(null)
        return
      }

      const maxDimension = 640
      const scale = Math.min(1, maxDimension / Math.max(video.videoWidth, video.videoHeight))
      const width = Math.max(1, Math.round(video.videoWidth * scale))
      const height = Math.max(1, Math.round(video.videoHeight * scale))

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const context = canvas.getContext('2d')
      if (!context) {
        resolveWith(null)
        return
      }

      context.drawImage(video, 0, 0, width, height)

      try {
        resolveWith(canvas.toDataURL('image/png'))
      } catch (error) {
        console.warn('Failed to capture video thumbnail', error)
        resolveWith(null)
      }
    }

    const handleLoadedMetadata = () => {
      if (video.readyState >= 2) {
        captureFrame()
        return
      }

      video.addEventListener('seeked', captureFrame, { once: true })
      try {
        video.currentTime = Math.min(1, (video.duration || 1) / 2)
      } catch {
        captureFrame()
      }
    }

    video.addEventListener('loadeddata', captureFrame, { once: true })
    video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true })
    video.addEventListener('error', () => resolveWith(null), { once: true })

    video.src = objectUrl
    video.load()
  })
}
