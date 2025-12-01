import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { Camera, AlertCircle, AlertTriangle } from 'lucide-react'
import { useCameraConfig } from '../contexts/camera'
import { getResolutionDimensions, isValidCameraUrl } from '../utils/cameraUtils'

interface Detection {
  class?: string
  class_name?: string
  confidence: number
  bbox: number[]
}

interface BodyRegion {
  name: string
  bbox: number[]
  keypoints: number[][]
  confidence: number
}

interface CameraFeedProps {
  isCompliant: boolean
  onRefresh: () => void
  onCapture?: (imageData: string) => void
  detections?: Detection[]
  bodyRegions?: BodyRegion[]
  processedImageSize?: { width: number, height: number } | null
  isConnected?: boolean
}

export interface CameraFeedHandle {
  handleCapture: () => string | null
}

export const CameraFeed = forwardRef<CameraFeedHandle, CameraFeedProps>(
  ({ isCompliant, onRefresh, onCapture, detections = [], bodyRegions = [], processedImageSize = null, isConnected = false }, ref) => {
  const { config } = useCameraConfig()
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [ipCameraUrl, setIpCameraUrl] = useState<string>('')
  const [imageSizeWarning, setImageSizeWarning] = useState<string | null>(null)

  const borderColor = isCompliant ? 'border-green-500' : 'border-red-500'

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const startCamera = async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (config.type === 'ip') {
        if (!config.ipUrl) {
          setError('Por favor, configura la URL de la cámara IP.')
          setIsLoading(false)
          return
        }

        if (!isValidCameraUrl(config.ipUrl)) {
          setError('URL inválida. Usa http://, https:// o rtsp://')
          setIsLoading(false)
          return
        }

        let videoUrl = config.ipUrl
        if (!videoUrl.includes('/video') && !videoUrl.includes('/stream') && !videoUrl.includes('/mjpeg')) {
          videoUrl = videoUrl.endsWith('/') ? videoUrl + 'video' : videoUrl + '/video'
        }

        console.log('🎥 Conectando a cámara IP:', videoUrl)
        setIpCameraUrl(videoUrl)
        
        setTimeout(() => {
          setIsLoading(false)
        }, 2000)

      } else {
        const dimensions = getResolutionDimensions(config.resolution)
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: dimensions.width },
            height: { ideal: dimensions.height },
            facingMode: 'user'
          },
          audio: false
        })

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          setStream(mediaStream)
        }
        setIsLoading(false)
      }
    } catch (err) {
      console.error('Error al acceder a la cámara:', err)
      setError('No se pudo acceder a la cámara. Por favor, verifica los permisos.')
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    stopCamera()
    startCamera()
    onRefresh()
  }

  const handleCapture = () => {
    if (!canvasRef.current) return null

    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    if (!context) return null

    setImageSizeWarning(null)

    const processImage = (source: HTMLImageElement | HTMLVideoElement, originalWidth: number, originalHeight: number) => {
      const maxWidth = 640
      const maxHeight = 480
      let targetWidth = originalWidth
      let targetHeight = originalHeight
      
      if (originalWidth > maxWidth || originalHeight > maxHeight) {
        const aspectRatio = originalWidth / originalHeight
        if (originalWidth > originalHeight) {
          targetWidth = maxWidth
          targetHeight = maxWidth / aspectRatio
        } else {
          targetHeight = maxHeight
          targetWidth = maxHeight * aspectRatio
        }
      }
      
      canvas.width = targetWidth
      canvas.height = targetHeight
      context.drawImage(source, 0, 0, targetWidth, targetHeight)

      let imageData = canvas.toDataURL('image/jpeg', 0.8)
      let sizeKB = (imageData.length * 0.75) / 1024

      if (sizeKB > 1024) {
        console.warn(`Imagen grande: ${sizeKB.toFixed(0)}KB - Comprimiendo...`)
        imageData = canvas.toDataURL('image/jpeg', 0.4)
        sizeKB = (imageData.length * 0.75) / 1024
        setImageSizeWarning(`Imagen comprimida: ${sizeKB.toFixed(0)}KB`)
      }

      if (sizeKB > 2048) {
        console.error(`Imagen muy grande: ${sizeKB.toFixed(0)}KB - Reduciendo resolución`)
        const reducedWidth = targetWidth * 0.5
        const reducedHeight = targetHeight * 0.5
        canvas.width = reducedWidth
        canvas.height = reducedHeight
        context.drawImage(source, 0, 0, reducedWidth, reducedHeight)
        imageData = canvas.toDataURL('image/jpeg', 0.4)
        sizeKB = (imageData.length * 0.75) / 1024
        setImageSizeWarning(`Resolución reducida: ${sizeKB.toFixed(0)}KB`)
      }

      if (sizeKB < 500) {
        console.log(`Imagen optimizada: ${sizeKB.toFixed(0)}KB`)
      } else if (sizeKB < 1024) {
        console.log(`Imagen aceptable: ${sizeKB.toFixed(0)}KB`)
      } else {
        console.warn(`Imagen pesada: ${sizeKB.toFixed(0)}KB`)
      }
      
      if (onCapture) {
        onCapture(imageData)
      }
      return imageData
    }

    if (config.type === 'ip' && imgRef.current) {
      const img = imgRef.current
      const originalWidth = img.naturalWidth || img.width
      const originalHeight = img.naturalHeight || img.height
      return processImage(img, originalWidth, originalHeight)
    }

    if (videoRef.current) {
      const video = videoRef.current
      const originalWidth = video.videoWidth
      const originalHeight = video.videoHeight
      return processImage(video, originalWidth, originalHeight)
    }

    return null
  }

  useImperativeHandle(ref, () => ({
    handleCapture,
  }))

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.type, config.ipUrl, config.resolution])

  useEffect(() => {
    const canvas = overlayCanvasRef.current
    const videoElement = config.type === 'ip' ? imgRef.current : videoRef.current
    
    if (!canvas || !videoElement || (detections.length === 0 && bodyRegions.length === 0)) {
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      }
      return
    }

    const drawDetections = () => {
      try {
        console.log('🎨 Iniciando dibujo de detecciones...')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          console.warn('No se pudo obtener contexto 2D del canvas')
          return
        }

        const container = canvas.parentElement
        if (!container) {
          console.warn('Canvas sin contenedor padre')
          return
        }

        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
        console.log(`Canvas: ${canvas.width}x${canvas.height}`)

        // Usar dimensiones procesadas del backend si están disponibles, sino usar dimensiones del media
        let mediaWidth: number
        let mediaHeight: number
        
        if (processedImageSize) {
          // Usar las dimensiones exactas de la imagen procesada por el backend
          mediaWidth = processedImageSize.width
          mediaHeight = processedImageSize.height
          console.log(`📐 DIMENSIONES DEL BACKEND: ${mediaWidth}x${mediaHeight}`)
        } else {
          // Fallback a dimensiones del elemento media
          mediaWidth = config.type === 'ip' 
            ? (imgRef.current?.naturalWidth || imgRef.current?.width || 1)
            : (videoRef.current?.videoWidth || 1)
          mediaHeight = config.type === 'ip'
            ? (imgRef.current?.naturalHeight || imgRef.current?.height || 1)
            : (videoRef.current?.videoHeight || 1)
          console.log(`📐 DIMENSIONES DEL MEDIA (FALLBACK): ${mediaWidth}x${mediaHeight}`)
        }
        
        console.log(`🖼️ Canvas destino: ${canvas.width}x${canvas.height}`)

        if (mediaWidth <= 0 || mediaHeight <= 0) {
          console.warn('Dimensiones de media inválidas')
          return
        }

        const scaleX = canvas.width / mediaWidth
        const scaleY = canvas.height / mediaHeight
        console.log(`⚖️ Escala aplicada: X=${scaleX.toFixed(3)}, Y=${scaleY.toFixed(3)}`)

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        console.log(`Dibujando ${detections.length} detecciones...`)

      detections.forEach((detection, index) => {
        const detectionAny = detection as unknown as Record<string, unknown>
        const className = (detectionAny.class || detectionAny.class_name) as string
        
        if (!detection || !detection.bbox || detection.bbox.length !== 4 || !className) {
          console.warn('Detección inválida:', detection)
          return
        }

        console.log(`Dibujando detección ${index + 1}:`, {
          class: className,
          confidence: detection.confidence,
          bbox: detection.bbox
        })

        const [x1, y1, x2, y2] = detection.bbox
        const width = x2 - x1
        const height = y2 - y1

        const scaledX = x1 * scaleX
        const scaledY = y1 * scaleY
        const scaledWidth = width * scaleX
        const scaledHeight = height * scaleY

        console.log(`Coordenadas escaladas:`, {
          original: `(${x1}, ${y1}, ${x2}, ${y2})`,
          scaled: `(${scaledX.toFixed(1)}, ${scaledY.toFixed(1)}, ${scaledWidth.toFixed(1)}x${scaledHeight.toFixed(1)})`
        })

        const colorMap: Record<string, string> = {
          'casco': '#10b981',
          'gafas': '#3b82f6',
          'guantes': '#f59e0b',
          'botas': '#8b5cf6',
          'chaleco': '#ec4899',
          'protector': '#ec4899',
          'tapabocas': '#06b6d4',
        }
        const classNameLower = className.toLowerCase()
        const color = colorMap[classNameLower] || '#10b981'

        ctx.strokeStyle = color
        ctx.lineWidth = 3
        ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight)

        const confidence = detection.confidence || 0
        const label = `${className} ${(confidence * 100).toFixed(0)}%`
        ctx.font = 'bold 14px system-ui'
        const textMetrics = ctx.measureText(label)
        const textWidth = textMetrics.width + 10
        const textHeight = 24

        ctx.fillStyle = color
        ctx.fillRect(scaledX, scaledY - textHeight, textWidth, textHeight)

        ctx.fillStyle = '#ffffff'
        ctx.fillText(label, scaledX + 5, scaledY - 7)
      })

      // Dibujar regiones corporales
      console.log(`Dibujando ${bodyRegions.length} regiones corporales...`)
      bodyRegions.forEach((region, index) => {
        if (!region || !region.bbox || region.bbox.length !== 4) {
          console.warn('Región corporal inválida:', region)
          return
        }

        console.log(`Dibujando región ${index + 1}:`, {
          name: region.name,
          confidence: region.confidence,
          bbox: region.bbox
        })

        const [x1, y1, x2, y2] = region.bbox
        const width = x2 - x1
        const height = y2 - y1

        const scaledX = x1 * scaleX
        const scaledY = y1 * scaleY
        const scaledWidth = width * scaleX
        const scaledHeight = height * scaleY
        
        console.log(`  📦 ${region.name.toUpperCase()}: Backend[${x1.toFixed(0)}, ${y1.toFixed(0)}] → Canvas[${scaledX.toFixed(0)}, ${scaledY.toFixed(0)}] Size[${scaledWidth.toFixed(0)}x${scaledHeight.toFixed(0)}]`)

        // Colores por región (azul translúcido para indicar zona detectada)
        const regionColorMap: Record<string, string> = {
          'head': 'rgba(59, 130, 246, 0.3)',    // Azul para cabeza
          'hands': 'rgba(245, 158, 11, 0.3)',   // Naranja para manos
          'feet': 'rgba(139, 92, 246, 0.3)',    // Púrpura para pies
          'torso': 'rgba(16, 185, 129, 0.3)',   // Verde para torso
        }
        const regionColor = regionColorMap[region.name] || 'rgba(100, 100, 100, 0.3)'
        const borderColor = regionColor.replace('0.3', '0.8')

        // Dibujar rectángulo de región con relleno translúcido
        ctx.fillStyle = regionColor
        ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight)

        // Borde de región
        ctx.strokeStyle = borderColor
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5]) // Línea punteada
        ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight)
        ctx.setLineDash([]) // Restaurar línea sólida

        // Etiqueta de región
        const regionLabel = `${region.name.toUpperCase()}`
        ctx.font = 'bold 12px system-ui'
        const textMetrics = ctx.measureText(regionLabel)
        const textWidth = textMetrics.width + 8
        const textHeight = 20

        ctx.fillStyle = borderColor
        ctx.fillRect(scaledX, scaledY - textHeight, textWidth, textHeight)

        ctx.fillStyle = '#ffffff'
        ctx.fillText(regionLabel, scaledX + 4, scaledY - 5)

        // Dibujar keypoints si están disponibles
        if (region.keypoints && region.keypoints.length > 0) {
          region.keypoints.forEach(([kx, ky, kconf]) => {
            if (kconf > 0.5) { // Solo keypoints con confianza >50%
              const scaledKX = kx * scaleX
              const scaledKY = ky * scaleY
              
              ctx.fillStyle = '#fff'
              ctx.beginPath()
              ctx.arc(scaledKX, scaledKY, 4, 0, 2 * Math.PI)
              ctx.fill()
              
              ctx.strokeStyle = borderColor
              ctx.lineWidth = 2
              ctx.stroke()
            }
          })
        }
      })

      } catch (error) {
        console.error('Error dibujando detecciones:', error)
      }
    }

    drawDetections()

    const resizeObserver = new ResizeObserver(drawDetections)
    const container = canvas.parentElement
    if (container) {
      resizeObserver.observe(container)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [detections, bodyRegions, processedImageSize, config.type])

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900">Cámara en vivo</h2>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200">
          <div className="relative flex items-center justify-center">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-success-green' : 'bg-danger-red'
            }`} />
            {isConnected && (
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-success-green animate-ping opacity-75" />
            )}
          </div>
          <span className="text-xs font-semibold text-slate-700">
            {isConnected ? 'Servidor conectado' : 'Servidor desconectado'}
          </span>
        </div>
      </div>

      <div
        className={`relative bg-slate-900 rounded-lg overflow-hidden border-4 ${borderColor} aspect-video`}
      >
        {config.type === 'ip' && ipCameraUrl ? (
          <img
            ref={imgRef}
            src={ipCameraUrl}
            alt="IP Camera Stream"
            crossOrigin="anonymous"
            className="w-full h-full object-cover"
            onLoad={() => {
              console.log('Cámara IP cargada correctamente')
              setIsLoading(false)
            }}
            onError={(e) => {
              console.error('Error cargando cámara IP:', e)
              console.log('URL intentada:', ipCameraUrl)
              setError('No se pudo cargar el stream. Verifica:\n1) URL correcta\n2) Misma red WiFi\n3) App IP Webcam corriendo\n4) URL en navegador primero')
              setIsLoading(false)
            }}
          />
        ) : config.type === 'ip' && !ipCameraUrl ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="text-center px-4">
              <Camera className="w-24 h-24 text-slate-500 mx-auto mb-4" />
              <p className="text-white font-medium mb-2">No hay URL configurada</p>
              <p className="text-slate-400 text-sm">Ve a Configuración para agregar la URL de tu cámara IP</p>
              <button
                onClick={onRefresh}
                className="mt-4 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800"
              >
                Abrir Configuración
              </button>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}

        <canvas ref={canvasRef} className="hidden" />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="text-center">
              <Camera className="w-24 h-24 text-slate-700 animate-pulse mx-auto mb-4" />
              <p className="text-white font-medium">Iniciando cámara...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="text-center px-4">
              <AlertCircle className="w-24 h-24 text-red-500 mx-auto mb-4" />
              <p className="text-white font-medium mb-2">Error de cámara</p>
              <p className="text-slate-400 text-sm">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-4 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {!error && !isLoading && (
          <>
            <canvas
              ref={overlayCanvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />
            
            <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm font-medium">
              <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></span>
              Cámara en vivo
            </div>

            {detections.length > 0 && (
              <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded-lg text-xs font-medium">
                {detections.length} objeto{detections.length > 1 ? 's' : ''} detectado{detections.length > 1 ? 's' : ''}
              </div>
            )}
            
            {imageSizeWarning && (
              <div className="absolute bottom-4 left-4 bg-yellow-600/90 text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {imageSizeWarning}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
})

CameraFeed.displayName = 'CameraFeed'
