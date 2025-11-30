import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react'

interface PPEChecklistItemProps {
  label: string
  icon: React.ReactNode
  detected: boolean
  hasDetection?: boolean
}

export function PPEChecklistItem({
  label,
  icon,
  detected,
  hasDetection = false,
}: PPEChecklistItemProps) {
  return (
    <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="text-slate-700">{icon}</div>
        <span className="font-medium text-slate-900">{label}</span>
      </div>
      {!hasDetection ? (
        <MinusCircle className="w-6 h-6 text-slate-400" />
      ) : detected ? (
        <CheckCircle2 className="w-6 h-6 text-green-600" />
      ) : (
        <XCircle className="w-6 h-6 text-red-600" />
      )}
    </div>
  )
}
