import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Settings, Power, PowerOff } from 'lucide-react'
import { CameraFeed, type CameraFeedHandle } from './CameraFeed'
import { StatusPanel } from './StatusPanel'
import { WarningBanner } from './warningbanner'
import { DetectionHistory } from './DetectionHistory'
import { SafetyModal } from './SafetyModal'
import { PPEWebSocket, type DetectionResponse } from '../services/ppeService'
import { useCameraConfig } from '../contexts/camera'
import { alertService } from '../utils/alertService'

export interface DashboardHandle {
  clearHistory: () => void
}

interface DashboardProps {
  onOpenConfig: () => void
}

interface DetectionRecord {
  id: string
  fecha: string
  hora: string
  estado: 'Completo' | 'Incompleto'
  faltantes: string
  ppeStatus?: {
    casco: boolean
    lentes: boolean
    guantes: boolean
    botas: boolean
    chaleco: boolean
    camisa: boolean
    pantalon: boolean
    barbijo: boolean
    epp_completo: boolean
  }
}

export const Dashboard = forwardRef<DashboardHandle, DashboardProps>(
  function Dashboard({ onOpenConfig }, ref) {
  const { config } = useCameraConfig()

  const [ppeStatus, setPpeStatus] = useState({
    casco: false,
    lentes: false,
    guantes: false,
    botas: false,
    chaleco: false,
    camisa: false,
    pantalon: false,
    barbijo: false,
    epp_completo: false,
  })
  const [isDetecting, setIsDetecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [detectionRecords, setDetectionRecords] = useState<DetectionRecord[]>(() => {

    try {
      const stored = localStorage.getItem('epp-detection-history')
      if (stored) {
        const parsed = JSON.parse(stored)
        return parsed.slice(0, config.history.maxRecords)
      }
    } catch (error) {
      console.error('Error cargando historial:', error)
    }
    return []
  })
  const [cameraActive, setCameraActive] = useState(false)
  const [hasDetection, setHasDetection] = useState(false)
  const [detections, setDetections] = useState<Array<{class: string, confidence: number, bbox: number[]}>>([])
  const [bodyRegions, setBodyRegions] = useState<Array<{name: string, bbox: number[], keypoints: number[][], confidence: number}>>([])
  const [processedImageSize, setProcessedImageSize] = useState<{width: number, height: number} | null>(null)
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [selectedHistoricalStatus, setSelectedHistoricalStatus] = useState<{
    casco: boolean
    lentes: boolean
    guantes: boolean
    botas: boolean
    chaleco: boolean
    camisa: boolean
    pantalon: boolean
    barbijo: boolean
    epp_completo: boolean
  } | null>(null)
  const wsRef = useRef<PPEWebSocket | null>(null)
  const cameraFeedRef = useRef<CameraFeedHandle | null>(null)
  const detectionIntervalRef = useRef<number | null>(null)
  const isProcessingRef = useRef(false)
  const lastSendTimeRef = useRef<number>(0)
  const adaptiveIntervalRef = useRef<number>(1500)
  const latencyHistoryRef = useRef<number[]>([])
  const pauseTimeoutRef = useRef<number | null>(null)

  useImperativeHandle(ref, () => ({
    clearHistory: () => {
      console.log('🗑️ Limpiando historial...')
      setDetectionRecords([])
      try {
        localStorage.removeItem('epp-detection-history')
      } catch (error) {
        console.error('Error limpiando localStorage:', error)
      }
    }
  }), [])

  const isCompliant = !hasDetection || Object.entries(ppeStatus).every(([key, detected]) => {
    const isRequired = config.requiredPPE[key as keyof typeof config.requiredPPE]
    return !isRequired || detected 
  })

  const missingItems = hasDetection ? Object.entries(ppeStatus)
    .filter(([key, detected]) => {
      if (key === 'epp_completo') return false
      return !detected
    })
    .map(([key]) => {
      const labels: Record<string, string> = {
        casco: 'Casco',
        lentes: 'Lentes',
        guantes: 'Guantes',
        botas: 'Botas',
        chaleco: 'Chaleco',
        camisa: 'Camisa',
        pantalon: 'Pantalón',
        barbijo: 'Barbijo',
      }
      return labels[key]
    }) : []
  
 function crearRegistroDesdeDeteccion(
    data: DetectionResponse
  ): DetectionRecord {
    const ahora = new Date()

    const labels: Record<string, string> = {
      casco: 'Casco',
      lentes: 'Lentes',
      guantes: 'Guantes',
      botas: 'Botas',
      chaleco: 'Chaleco',
      camisa: 'Camisa',
      pantalon: 'Pantalón',
      barbijo: 'Barbijo',
    }

    const faltantesArray = Object
      .entries(data.ppe_status)
      .filter(([key, detected]) => {
        if (key === 'epp_completo') return false
        return !detected
      })
      .map(([key]) => labels[key] || key)

    const faltantesTexto =
      data.is_compliant || faltantesArray.length === 0
        ? 'Ninguno'
        : faltantesArray.join(', ')

    const record: DetectionRecord = {
      id: Date.now().toString(),
      fecha: ahora.toLocaleDateString('es-ES'),
      hora: ahora.toLocaleTimeString('es-ES'),
      estado: data.is_compliant ? 'Completo' : 'Incompleto',
      faltantes: faltantesTexto,
      ppeStatus: data.ppe_status,
    }

    return record
  }

  const handleDetectionResponse = useCallback((data: DetectionResponse) => {

    const latency = Date.now() - lastSendTimeRef.current
    console.log('✅ Respuesta recibida del servidor:')
    console.log(`⏱️ Latencia: ${latency}ms | Detecciones: ${data.detections?.length || 0}`)
    console.log('📦 Datos:', data)

    if (!data || !data.ppe_status) {
      console.warn('Respuesta inválida del servidor:', data)
      setIsDetecting(false)
      isProcessingRef.current = false
      return
    }

    if (data.has_person === false) {
      console.log('Sin personas en escena - Omitiendo alertas EPP')
      setPpeStatus({
        casco: false,
        lentes: false,
        guantes: false,
        botas: false,
        chaleco: false,
        camisa: false,
        pantalon: false,
        barbijo: false,
        epp_completo: false,
      })
      setDetections([])
      setBodyRegions([])
      setHasDetection(false)
      setIsDetecting(false)
      isProcessingRef.current = false
      return
    }

    latencyHistoryRef.current.push(latency)
    if (latencyHistoryRef.current.length > 10) {
      latencyHistoryRef.current.shift()
    }

    if (latencyHistoryRef.current.length >= 5) {
      const avgLatency = latencyHistoryRef.current.reduce((a, b) => a + b, 0) / latencyHistoryRef.current.length
      
      if (avgLatency < 300) {
        adaptiveIntervalRef.current = 1000
      } else if (avgLatency < 600) {
        adaptiveIntervalRef.current = 1500
      } else {
        adaptiveIntervalRef.current = 2500
      }
      
      console.log(`Intervalo ajustado: ${adaptiveIntervalRef.current}ms (latencia avg: ${avgLatency.toFixed(0)}ms)`)
    }

    console.log('DATOS RECIBIDOS DEL BACKEND:', {
      body_regions: data.body_regions?.length || 0,
      has_person: data.has_person,
      image_width: data.image_width,
      image_height: data.image_height,
      tiene_dimensiones: !!(data.image_width && data.image_height)
    })
  
    setPpeStatus(data.ppe_status)
    setDetections(data.detections || [])
    setBodyRegions(data.body_regions || [])
    
    if (data.image_width && data.image_height) {
      setProcessedImageSize({ width: data.image_width, height: data.image_height })
    } else {
      console.warn('Backend NO envió dimensiones de imagen (image_width/image_height)')
    }
    
    setIsDetecting(false)
    isProcessingRef.current = false
    setHasDetection(data.has_person || false)

    const newRecord = crearRegistroDesdeDeteccion(data)

    setDetectionRecords((prev) => {
      const updated = [newRecord, ...prev.slice(0, config.history.maxRecords - 1)]
      try {
        localStorage.setItem('epp-detection-history', JSON.stringify(updated))
      } catch (error) {
        console.error('Error guardando historial:', error)
      }
      return updated
    })


    setDetectionRecords((prev) => {
      const updated = [newRecord, ...prev.slice(0, config.history.maxRecords - 1)]
      try {
        localStorage.setItem('epp-detection-history', JSON.stringify(updated))
      } catch (error) {
        console.error('Error guardando historial:', error)
      }
      return updated
    })

    if (!data.is_compliant) {
      try {
        const alertTriggered = alertService.trigger(
          config.alerts.type,
          config.alerts.volume,
          config.alerts.repeatInterval
        )
        if (alertTriggered) {
          console.log(`Alerta ${config.alerts.type} ejecutada`)
        }
      } catch (error) {
        console.error('Error ejecutando alerta:', error)
      }

      console.log('⏸️ PAUSANDO detección automática - EPP incompleto detectado')
      setIsPaused(true)
      setIsSafetyModalOpen(true)

      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
        detectionIntervalRef.current = null
      }

      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current)
        pauseTimeoutRef.current = null
      }
    } else {
      alertService.reset()
    }
  }, [config.alerts.type, config.alerts.volume, config.alerts.repeatInterval, config.history.maxRecords])

  useEffect(() => {
    console.log('🔌 Inicializando WebSocket...')
    const initTimeout = setTimeout(() => {
      wsRef.current = new PPEWebSocket(
        handleDetectionResponse,
        (error) => {
          console.error('Error WebSocket:', error)
          setIsConnected(false)
        },
        () => {
          setIsConnected(true)
          console.log('Conectado al servidor WebSocket')
        },
        () => {
          setIsConnected(false)
          console.log('🔌 Desconectado del servidor WebSocket')
        }
      )

      wsRef.current.connect()
    }, 500)

    return () => {
      console.log('🧹 Limpiando recursos del Dashboard...')
      clearTimeout(initTimeout)
      if (wsRef.current) {
        console.log('🔌 Cerrando conexión WebSocket...')
        wsRef.current.disconnect()
      }
      if (detectionIntervalRef.current) {
        clearTimeout(detectionIntervalRef.current)
      }
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current)
      }
    }
  }, [])

  const startDetection = () => {
    if (!cameraFeedRef.current || !wsRef.current?.isConnected()) {
      alert('La cámara o el servidor no están disponibles')
      return
    }

    setCameraActive(true)
    console.log('▶Iniciando detección continua con intervalo adaptativo')

    const scheduleNextDetection = () => {
      detectionIntervalRef.current = window.setTimeout(() => {
        if (!cameraFeedRef.current || !wsRef.current?.isConnected() || isPaused) {
          return
        }

        if (!isProcessingRef.current) {
          isProcessingRef.current = true
          setIsDetecting(true)
          lastSendTimeRef.current = Date.now()
          
          const imageData = cameraFeedRef.current.handleCapture()
          if (imageData) {
            console.log('Captura realizada, enviando al servidor...')
            wsRef.current.send(imageData, 0.3)
          } else {
            console.warn('No se pudo capturar imagen')
            isProcessingRef.current = false
            setIsDetecting(false)
          }
        }

        if (!isPaused) {
          scheduleNextDetection()
        }
      }, adaptiveIntervalRef.current)
    }

    scheduleNextDetection()
  }

  const handleOpenSafetyModal = (historicalPpeStatus?: {
    casco: boolean
    lentes: boolean
    guantes: boolean
    botas: boolean
    chaleco: boolean
    camisa: boolean
    pantalon: boolean
    barbijo: boolean
    epp_completo: boolean
  }) => {
    if (historicalPpeStatus) {
      setSelectedHistoricalStatus(historicalPpeStatus)
    }
    setIsSafetyModalOpen(true)
  }

  const handleCloseSafetyModal = () => {
    setIsSafetyModalOpen(false)
    setSelectedHistoricalStatus(null)
  }

  const handleResume = () => {
    console.log('▶️ Reanudando detección desde pausa')
    setIsPaused(false)
    setIsSafetyModalOpen(false)

    if (!cameraActive) {
      setCameraActive(true)
    }

    if (cameraFeedRef.current && wsRef.current?.isConnected()) {
      console.log('🔄 Reiniciando ciclo de detección continua')
      
      const scheduleNextDetection = () => {
        detectionIntervalRef.current = window.setTimeout(() => {
          if (!cameraFeedRef.current || !wsRef.current?.isConnected()) {
            return
          }

          if (!isProcessingRef.current) {
            isProcessingRef.current = true
            setIsDetecting(true)
            lastSendTimeRef.current = Date.now()
            
            const imageData = cameraFeedRef.current.handleCapture()
            if (imageData) {
              console.log('📸 Captura realizada después de reanudar, enviando...')
              wsRef.current.send(imageData, 0.3)
            } else {
              console.warn('⚠️ No se pudo capturar imagen')
              isProcessingRef.current = false
              setIsDetecting(false)
            }
          }

          scheduleNextDetection()
        }, adaptiveIntervalRef.current)
      }

      scheduleNextDetection()
    } else {
      console.error('No se puede reanudar: cámara o servidor no disponibles')
    }
  }

  const stopDetection = () => {
    console.log('Deteniendo detección continua')
    setCameraActive(false)
    setIsPaused(false)
    if (detectionIntervalRef.current) {
      clearTimeout(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }
    setIsDetecting(false)
    isProcessingRef.current = false
    latencyHistoryRef.current = []
    adaptiveIntervalRef.current = 1500
  }

  const handleRefresh = () => {
    console.log('Refreshing camera...')
    stopDetection()
  }
  return (
    <div className="space-y-6">
      <WarningBanner show={hasDetection && !isCompliant} missingItems={missingItems} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-4 sm:gap-6 items-start">
        <div className="w-full">
          <CameraFeed
            ref={cameraFeedRef}
            isCompliant={isCompliant}
            onRefresh={handleRefresh}
            detections={detections}
            bodyRegions={bodyRegions}
            processedImageSize={processedImageSize}
            isConnected={isConnected}
          />
        </div>

        <div className="w-full xl:sticky xl:top-6">
          <StatusPanel 
            ppeStatus={ppeStatus} 
            isDetecting={isDetecting} 
            hasDetection={hasDetection}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
        <button
          onClick={isPaused ? handleResume : (cameraActive ? stopDetection : startDetection)}
          disabled={!isConnected}
          className={`flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-base
            transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] ${
            isPaused
              ? 'bg-gradient-to-r from-warning-yellow to-amber-500 text-industrial-dark hover:from-amber-500 hover:to-amber-600'
              : cameraActive
              ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800'
              : 'bg-gradient-to-r from-success-green to-green-700 text-white hover:from-green-700 hover:to-green-800'
          } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
        >
          {isPaused ? (
            <>
              <Power className="w-6 h-6" />
              <span className="hidden sm:inline">Reanudar Detección</span>
              <span className="sm:hidden">Reanudar</span>
            </>
          ) : cameraActive ? (
            <>
              <PowerOff className="w-6 h-6" />
              <span>Detener</span>
            </>
          ) : (
            <>
              <Power className="w-6 h-6" />
              <span className="hidden sm:inline">Iniciar Detección</span>
              <span className="sm:hidden">Iniciar</span>
            </>
          )}
        </button>

        <button
          onClick={onOpenConfig}
          className="flex items-center justify-center gap-2 px-5 py-4 bg-white border-2 border-slate-300 
            text-slate-700 rounded-xl font-semibold hover:bg-slate-50 hover:border-slate-400
            transition-all shadow-md"
        >
          <Settings className="w-5 h-5" />
          <span className="hidden sm:inline">Configuración</span>
        </button>
      </div>

      <DetectionHistory 
        records={detectionRecords} 
        onViewRisks={handleOpenSafetyModal}
      />

      <SafetyModal
        isOpen={isSafetyModalOpen}
        onClose={handleCloseSafetyModal}
        ppeStatus={selectedHistoricalStatus || ppeStatus}
        onResume={handleResume}
        isPaused={isPaused}
      />
    </div>
  )
})

Dashboard.displayName = 'Dashboard'
