import { HardHat, Glasses, Hand, Footprints, Shirt, Workflow, AlertCircle } from 'lucide-react'
import { PPEChecklistItem } from './PPEChecklistItem'

interface StatusPanelProps {
  ppeStatus: {
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
  isDetecting?: boolean
  hasDetection?: boolean
}

export function StatusPanel({ ppeStatus, isDetecting = false, hasDetection = false }: StatusPanelProps) {

  const isCompliant = Object.entries(ppeStatus).every(([key, detected]) => {
    if (key === 'epp_completo') return true 
    return detected
  })

  const missingItems = Object.entries(ppeStatus).filter(
    ([key, detected]) => {
      if (key === 'epp_completo') return false 
      return !detected
    },
  ).length
  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 overflow-hidden">
      <div className={`p-4 ${
        hasDetection && !isCompliant 
          ? 'bg-gradient-to-br from-danger-red to-red-600' 
          : 'bg-gradient-to-br from-industrial-dark to-steel-blue'
      }`}>
        <h2 className="text-lg font-bold text-white">Estado del EPP</h2>
        {isDetecting && (
          <div className="flex items-center gap-2 text-warning-yellow mt-2">
            <div className="w-2 h-2 bg-warning-yellow rounded-full animate-pulse" />
            <span className="text-xs font-semibold">Analizando...</span>
          </div>
        )}
        {hasDetection && !isCompliant && (
          <div className="flex items-center gap-2 text-white mt-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-semibold">
              Faltan {missingItems} elemento{missingItems > 1 ? 's' : ''} de seguridad
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="space-y-2">
        <PPEChecklistItem
          label="Casco de Seguridad"
          icon={<HardHat className="w-5 h-5" />}
          detected={ppeStatus.casco}
          hasDetection={hasDetection}
        />
        <PPEChecklistItem
          label="Lentes de Seguridad"
          icon={<Glasses className="w-5 h-5" />}
          detected={ppeStatus.lentes}
          hasDetection={hasDetection}
        />
        <PPEChecklistItem
          label="Guantes de Trabajo"
          icon={<Hand className="w-5 h-5" />}
          detected={ppeStatus.guantes}
          hasDetection={hasDetection}
        />
        <PPEChecklistItem
          label="Botas de Seguridad"
          icon={<Footprints className="w-5 h-5" />}
          detected={ppeStatus.botas}
          hasDetection={hasDetection}
        />
        <PPEChecklistItem
          label="Chaleco de Seguridad"
          icon={<Shirt className="w-5 h-5" />}
          detected={ppeStatus.chaleco}
          hasDetection={hasDetection}
        />
        <PPEChecklistItem
          label="Camisa de Jean"
          icon={<Shirt className="w-5 h-5" />}
          detected={ppeStatus.camisa}
          hasDetection={hasDetection}
        />
        <PPEChecklistItem
          label="Pantalón Jean"
          icon={<Shirt className="w-5 h-5" />}
          detected={ppeStatus.pantalon}
          hasDetection={hasDetection}
        />
        <PPEChecklistItem
          label="Mascarilla/Tapabocas"
          icon={<Workflow className="w-5 h-5" />}
          detected={ppeStatus.barbijo}
          hasDetection={hasDetection}
        />
        </div>
      </div>
    </div>
  )
}
