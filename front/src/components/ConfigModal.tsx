import { useState } from 'react'
import {
  X,
  Camera,
  Bell,
  Clock,
  User,
  Settings as SettingsIcon,
  Volume2,
  Timer,
  BarChart3,
  Download,
  Trash2,
  AlertTriangle,
  Shield,
  Info,
  HardHat,
  Glasses,
  Hand,
  Footprints,
  Shirt,
  Wind,
  Lightbulb,
  VolumeX,
  Globe,
  Bot,
} from 'lucide-react'
import { useCameraConfig } from '../contexts/camera'
import { ConfirmDialog } from './ConfirmDialog'
import { AlertDialog } from './AlertDialog'

interface ConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onHistoryCleared?: () => void
}

export function ConfigModal({ isOpen, onClose, onHistoryCleared }: ConfigModalProps) {
  const [activeTab, setActiveTab] = useState<
    'camera' | 'alerts' | 'history' | 'user'
  >('camera')
  if (!isOpen) return null
  const tabs = [
    {
      id: 'camera' as const,
      label: 'Cámara',
      icon: Camera,
    },
    {
      id: 'alerts' as const,
      label: 'Alertas',
      icon: Bell,
    },
    {
      id: 'history' as const,
      label: 'Historial',
      icon: Clock,
    },
    {
      id: 'user' as const,
      label: 'Usuario',
      icon: User,
    },
  ]
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-industrial-dark to-steel-blue px-6 py-5 border-b-4 border-warning-yellow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning-yellow rounded-lg">
                <SettingsIcon className="w-6 h-6 text-industrial-dark" />
              </div>
              <h2 className="text-2xl font-bold text-white">Configuración del Sistema</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        <div className="flex border-b-2 border-slate-200 px-6 overflow-x-auto bg-slate-50">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 border-b-3 transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'border-warning-yellow text-industrial-dark font-bold bg-white' 
                    : 'border-transparent text-slate-600 hover:text-industrial-dark hover:bg-white/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {activeTab === 'camera' && <CameraSettings />}
        {activeTab === 'alerts' && <AlertsSettings />}
        {activeTab === 'history' && <HistorySettings onHistoryCleared={onHistoryCleared} />}
        {activeTab === 'user' && <UserSettings />}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t-2 border-slate-200 bg-white">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-100 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 hover:border-slate-400 transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

function CameraSettings() {
  const { config, updateConfig } = useCameraConfig()
  const [showIpInput, setShowIpInput] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-slate-900 mb-2">
          Tipo de cámara
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              updateConfig({ type: 'webcam', ipUrl: '' })
              setShowIpInput(false)
            }}
            className={`px-4 py-3 border-2 rounded-lg font-bold transition-colors ${
              config.type === 'webcam'
                ? 'border-blue-900 bg-blue-50 text-blue-900'
                : 'border-slate-300 text-slate-700 hover:border-blue-900 hover:bg-blue-50'
            }`}
          >
            Cámara del equipo (Webcam)
          </button>
          <button
            onClick={() => {
              updateConfig({ type: 'ip' })
              setShowIpInput(true)
            }}
            className={`px-4 py-3 border-2 rounded-lg font-bold transition-colors ${
              config.type === 'ip'
                ? 'border-blue-900 bg-blue-50 text-blue-900'
                : 'border-slate-300 text-slate-700 hover:border-blue-900 hover:bg-blue-50'
            }`}
          >
            Cámara IP
          </button>
        </div>
      </div>

      {(config.type === 'ip' || showIpInput) && (
        <div>
          <label className="block text-sm font-bold text-slate-900 mb-2">
            URL de la cámara IP
          </label>
          <input
            type="text"
            value={config.ipUrl}
            onChange={(e) => updateConfig({ ipUrl: e.target.value })}
            placeholder="http://192.168.1.100:8080/video"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-2 text-sm text-slate-600">
            Ejemplos: rtsp://192.168.1.100:554/stream o http://192.168.1.100:8080/video
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-bold text-slate-900 mb-2">
          Resolución
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(['1080p', '720p', '480p'] as const).map((res) => (
            <button
              key={res}
              onClick={() => updateConfig({ resolution: res })}
              className={`px-4 py-3 border-2 rounded-lg font-bold transition-colors ${
                config.resolution === res
                  ? 'border-blue-900 bg-blue-50 text-blue-900'
                  : 'border-slate-300 text-slate-700 hover:border-blue-900 hover:bg-blue-50'
              }`}
            >
              {res}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-900 mb-2">
          Frecuencia de análisis
        </label>
        <div className="grid grid-cols-3 gap-3">
          {([1, 2, 5] as const).map((freq) => (
            <button
              key={freq}
              onClick={() => updateConfig({ analysisFrequency: freq })}
              className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                config.analysisFrequency === freq
                  ? 'border-blue-900 bg-blue-50 text-blue-900 font-bold'
                  : 'border-slate-300 text-slate-700 hover:border-blue-900 hover:bg-blue-50'
              }`}
            >
              {freq}s
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
        <p className="text-sm text-blue-900 font-bold">
          📱 Cómo usar tu celular como cámara IP:
        </p>
        <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
          <li>Instala "IP Webcam" desde Google Play Store</li>
          <li>Abre la app y presiona "Iniciar servidor"</li>
          <li>Copia la URL que aparece (ej: http://192.168.1.67:8080)</li>
          <li>Pégala aquí arriba (automáticamente agregará /video)</li>
          <li>¡Asegúrate de estar en la misma red WiFi!</li>
        </ol>
        <p className="text-xs text-blue-700 mt-2 flex items-center gap-1">
          <Lightbulb className="w-4 h-4" />
          <span>Tip: Abre primero la URL en tu navegador para verificar que funciona</span>
        </p>
      </div>
    </div>
  )
}

function AlertsSettings() {
  const { config, updateConfig } = useCameraConfig()
  
  const ppeItems = [
    { key: 'casco' as const, label: 'Casco de Seguridad', icon: <HardHat className="w-6 h-6 text-steel-blue" /> },
    { key: 'lentes' as const, label: 'Lentes de Seguridad', icon: <Glasses className="w-6 h-6 text-steel-blue" /> },
    { key: 'guantes' as const, label: 'Guantes de Trabajo', icon: <Hand className="w-6 h-6 text-steel-blue" /> },
    { key: 'botas' as const, label: 'Botas de Seguridad', icon: <Footprints className="w-6 h-6 text-steel-blue" /> },
    { key: 'chaleco' as const, label: 'Chaleco de Seguridad', icon: <Shirt className="w-6 h-6 text-steel-blue" /> },
    { key: 'camisa' as const, label: 'Camisa de Jean', icon: <Shirt className="w-6 h-6 text-steel-blue" /> },
    { key: 'pantalon' as const, label: 'Pantalón Jean', icon: <Shirt className="w-6 h-6 text-steel-blue" /> },
    { key: 'barbijo' as const, label: 'Mascarilla/Tapabocas', icon: <Wind className="w-6 h-6 text-steel-blue" /> },
  ]

  const handleTogglePPE = (key: keyof typeof config.requiredPPE) => {
    updateConfig({
      requiredPPE: {
        ...config.requiredPPE,
        [key]: !config.requiredPPE[key],
      },
    })
  }

  const alertTypeMap: Record<string, 'visual' | 'sound' | 'both'> = {
    'Visual': 'visual',
    'Sonora': 'sound',
    'Ambas': 'both'
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl p-6 shadow-md border-2 border-slate-200">
        <h3 className="text-lg font-bold text-industrial-dark mb-4 flex items-center gap-2">
          <Shield className="w-6 h-6 text-steel-blue" />
          Equipamiento a validar
        </h3>
        <div className="space-y-3">
          {ppeItems.map((item) => (
            <label
              key={item.key}
              className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border-2 ${
                config.requiredPPE[item.key]
                  ? 'bg-success-green/10 border-success-green hover:bg-success-green/20'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span className="font-semibold text-slate-900">{item.label}</span>
              </div>
              <input
                type="checkbox"
                checked={config.requiredPPE[item.key]}
                onChange={() => handleTogglePPE(item.key)}
                className="w-6 h-6 text-success-green rounded-lg focus:ring-2 focus:ring-success-green cursor-pointer"
              />
            </label>
          ))}
        </div>
        <div className="mt-4 p-4 bg-warning-yellow/10 border-2 border-warning-yellow/30 rounded-xl">
          <p className="text-sm text-industrial-dark font-medium flex items-start gap-2">
            <Lightbulb className="w-5 h-5 text-warning-yellow flex-shrink-0 mt-0.5" />
            <span><strong>Nota:</strong> Solo los elementos marcados serán validados. Los desmarcados no afectarán el estado de cumplimiento.</span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md border-2 border-slate-200">
        <h3 className="text-lg font-bold text-industrial-dark mb-4 flex items-center gap-2">
          <Bell className="w-6 h-6 text-steel-blue" />
          Tipo de alerta
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {['Visual', 'Sonora', 'Ambas'].map((type) => (
            <button
              key={type}
              onClick={() => updateConfig({ 
                alerts: { ...config.alerts, type: alertTypeMap[type] } 
              })}
              className={`px-5 py-4 border-2 rounded-xl font-bold transition-all ${
                config.alerts.type === alertTypeMap[type]
                  ? 'border-warning-yellow bg-warning-yellow/20 text-industrial-dark shadow-md'
                  : 'border-slate-300 text-slate-700 hover:border-warning-yellow hover:bg-warning-yellow/10'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md border-2 border-slate-200">
        <h3 className="text-lg font-bold text-industrial-dark mb-4 flex items-center gap-2">
          <Volume2 className="w-6 h-6 text-steel-blue" />
          Volumen
        </h3>
        <div className="flex items-center gap-4">
          <VolumeX className="w-6 h-6 text-slate-400" />
          <input
            type="range"
            min="0"
            max="100"
            value={config.alerts.volume}
            onChange={(e) => updateConfig({ 
              alerts: { ...config.alerts, volume: parseInt(e.target.value) } 
            })}
            className="flex-1 h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-warning-yellow"
          />
          <Volume2 className="w-6 h-6 text-steel-blue" />
        </div>
        <div className="mt-3 text-center">
          <span className="inline-block px-4 py-2 bg-warning-yellow text-industrial-dark rounded-xl text-lg font-black">
            {config.alerts.volume}%
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md border-2 border-slate-200">
        <h3 className="text-lg font-bold text-industrial-dark mb-4 flex items-center gap-2">
          <Timer className="w-6 h-6 text-steel-blue" />
          Intervalo de repetición
        </h3>
        <select 
          value={config.alerts.repeatInterval}
          onChange={(e) => updateConfig({ 
            alerts: { ...config.alerts, repeatInterval: parseInt(e.target.value) } 
          })}
          className="w-full px-4 py-4 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-warning-yellow focus:border-warning-yellow font-semibold text-slate-900"
        >
          <option value={5}>Cada 5 segundos</option>
          <option value={10}>Cada 10 segundos</option>
          <option value={30}>Cada 30 segundos</option>
          <option value={60}>Cada 1 minuto</option>
        </select>
      </div>
    </div>
  )
}

interface HistoryRecord {
  fecha: string
  hora: string
  estado: string
  faltantes: string
}

function HistorySettings({ onHistoryCleared }: { onHistoryCleared?: () => void }) {
  const { config, updateConfig } = useCameraConfig()
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showNoDataAlert, setShowNoDataAlert] = useState(false)
  const [showErrorAlert, setShowErrorAlert] = useState(false)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)

  const handleDownloadCSV = () => {
    const historyData = localStorage.getItem('epp-detection-history')
    if (!historyData) {
      setShowNoDataAlert(true)
      return
    }

    try {
      const records: HistoryRecord[] = JSON.parse(historyData)
      
      const headers = ['Fecha', 'Hora', 'Estado', 'Elementos Faltantes']
      const csvContent = [
        headers.join(','),
        ...records.map((r) => 
          `"${r.fecha}","${r.hora}","${r.estado}","${r.faltantes}"`
        )
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `historial-epp-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error descargando CSV:', error)
      setShowErrorAlert(true)
    }
  }

  const handleClearHistory = () => {
    console.log('🗑️ Iniciando limpieza de historial desde ConfigModal')
    setShowClearConfirm(false)
    
    // Actualizar el estado del Dashboard (esto también limpiará localStorage)
    if (onHistoryCleared) {
      onHistoryCleared()
    }
    
    // Mostrar el mensaje de éxito
    setShowSuccessAlert(true)
  }

  return (
    <>
      <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-md border-2 border-slate-200">
        <h3 className="text-lg font-bold text-industrial-dark mb-4 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-steel-blue" />
          Registros a mostrar
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[10, 20, 50].map((num) => (
            <button
              key={num}
              onClick={() => updateConfig({ 
                history: { ...config.history, maxRecords: num } 
              })}
              className={`px-5 py-4 border-2 rounded-xl font-bold transition-all ${
                config.history.maxRecords === num
                  ? 'border-steel-blue bg-steel-blue text-white shadow-md'
                  : 'border-slate-300 text-slate-700 hover:border-steel-blue hover:bg-steel-blue/10'
              }`}
            >
              {num} registros
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md border-2 border-slate-200 space-y-4">
        <h3 className="text-lg font-bold text-industrial-dark mb-4 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-steel-blue" />
          Acciones
        </h3>
        
        <button 
          onClick={handleDownloadCSV}
          className="w-full px-6 py-4 bg-gradient-to-r from-success-green to-green-700 text-white rounded-xl font-bold hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
        >
          <Download className="w-6 h-6" />
          Descargar historial (CSV)
        </button>
        
        <button 
          onClick={() => setShowClearConfirm(true)}
          className="w-full px-6 py-4 bg-gradient-to-r from-danger-red to-red-700 text-white rounded-xl font-bold hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
        >
          <Trash2 className="w-6 h-6" />
          Limpiar historial
        </button>
      </div>

      <div className="p-5 bg-alert-amber/20 border-2 border-alert-amber rounded-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-7 h-7 text-alert-amber" />
          <div>
            <p className="text-sm font-bold text-industrial-dark mb-1">
              Importante
            </p>
            <p className="text-sm text-slate-700">
              Limpiar el historial eliminará <strong>permanentemente</strong> todos los registros de detección almacenados. Esta acción no se puede deshacer.
            </p>
          </div>
        </div>
      </div>
    </div>

    <ConfirmDialog
      isOpen={showClearConfirm}
      title="Confirmar eliminación"
      message="¿Estás seguro de que deseas eliminar todo el historial? Esta acción no se puede deshacer y se perderán todos los registros de detección almacenados."
      confirmLabel="Sí, eliminar todo"
      cancelLabel="Cancelar"
      variant="danger"
      onConfirm={handleClearHistory}
      onCancel={() => setShowClearConfirm(false)}
    />

    <AlertDialog
      isOpen={showNoDataAlert}
      title="Sin datos"
      message="No hay registros en el historial para descargar. Inicia la detección para generar registros."
      variant="info"
      onClose={() => setShowNoDataAlert(false)}
    />

    <AlertDialog
      isOpen={showErrorAlert}
      title="Error"
      message="Ocurrió un error al generar el archivo CSV. Por favor, intenta nuevamente."
      variant="error"
      onClose={() => setShowErrorAlert(false)}
    />

    <AlertDialog
      isOpen={showSuccessAlert}
      title="Historial limpiado"
      message="El historial se ha eliminado correctamente."
      variant="success"
      onClose={() => setShowSuccessAlert(false)}
    />
  </>
  )
}

function UserSettings() {
  return (
    <div className="space-y-6">

      <div className="bg-white rounded-xl p-6 shadow-md border-2 border-slate-200">
        <h3 className="text-lg font-bold text-industrial-dark mb-4 flex items-center gap-2">
          <Globe className="w-6 h-6 text-steel-blue" />
          Idioma
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="px-5 py-4 border-2 border-steel-blue bg-steel-blue text-white rounded-xl font-bold shadow-md">
            🇪🇸 Español
          </button>
          <button className="px-5 py-4 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:border-steel-blue hover:bg-steel-blue/10 transition-all opacity-50 cursor-not-allowed" disabled>
            🇺🇸 English (Próximamente)
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md border-2 border-slate-200">
        <h3 className="text-lg font-bold text-industrial-dark mb-4 flex items-center gap-2">
          <Bot className="w-6 h-6 text-steel-blue" />
          Información del sistema
        </h3>

        <div className="space-y-3">
          <div className="p-4 bg-gradient-to-r from-steel-blue/10 to-industrial-dark/10 rounded-xl border-2 border-steel-blue/20">
            <div className="text-sm text-slate-600 mb-1 font-medium">
              Modelo de detección
            </div>
            <div className="font-black text-industrial-dark text-lg">
              YOLOv8 Custom EPP
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-success-green/10 to-green-700/10 rounded-xl border-2 border-success-green/20">
            <div className="text-sm text-slate-600 mb-1 font-medium">
              Versión del sistema
            </div>
            <div className="font-black text-success-green text-lg">
              v1.0.0 (Estable)
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-warning-yellow/10 to-alert-amber/10 rounded-xl border-2 border-warning-yellow/30">
            <div className="text-sm text-slate-600 mb-1 font-medium">
              Clases detectadas (9 tipos de EPP)
            </div>
            <div className="font-bold text-industrial-dark text-sm">
              Casco • Lentes • Guantes • Botas • Chaleco • Camisa • Pantalón • Barbijo • EPP Completo
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-industrial-dark to-steel-blue rounded-xl p-6 shadow-lg text-white">
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Info className="w-6 h-6" />
          Acerca del sistema
        </h3>
        <p className="text-sm leading-relaxed opacity-90">
          <strong>Sistema EPP</strong> es una solución de monitoreo en tiempo real para verificar el cumplimiento de equipos de protección personal usando inteligencia artificial con YOLOv8.
        </p>
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-xs opacity-75">
            © 2025 Sistema EPP • Seguridad Industrial
          </p>
        </div>
      </div>
    </div>
  )
}
