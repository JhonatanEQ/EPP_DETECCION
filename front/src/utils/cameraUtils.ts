
export function getResolutionDimensions(resolution: string) {
  switch (resolution) {
    case '1080p':
      return { width: 1920, height: 1080 }
    case '720p':
      return { width: 1280, height: 720 }
    case '480p':
      return { width: 854, height: 480 }
    default:
      return { width: 1920, height: 1080 }
  }
}

export function captureVideoFrame(
  videoElement: HTMLVideoElement,
  canvasElement: HTMLCanvasElement,
  quality = 0.8
): string | null {
  const context = canvasElement.getContext('2d')
  if (!context) return null

  canvasElement.width = videoElement.videoWidth
  canvasElement.height = videoElement.videoHeight
  context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height)

  return canvasElement.toDataURL('image/jpeg', quality)
}

export function isValidCameraUrl(url: string): boolean {
  if (!url) return false
  try {
    const urlObj = new URL(url)
    return ['http:', 'https:', 'rtsp:'].includes(urlObj.protocol)
  } catch {
    return false
  }
}
