import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

interface AlertDialogProps {
  isOpen: boolean
  title: string
  message: string
  onClose: () => void
  variant?: 'success' | 'error' | 'info'
}

export function AlertDialog({
  isOpen,
  title,
  message,
  onClose,
  variant = 'info'
}: AlertDialogProps) {
  if (!isOpen) return null

  const variantConfig = {
    success: {
      icon: CheckCircle,
      iconBg: 'bg-success-green',
      border: 'border-success-green',
      iconColor: 'text-white'
    },
    error: {
      icon: AlertCircle,
      iconBg: 'bg-danger-red',
      border: 'border-danger-red',
      iconColor: 'text-white'
    },
    info: {
      icon: Info,
      iconBg: 'bg-steel-blue',
      border: 'border-steel-blue',
      iconColor: 'text-white'
    }
  }

  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className={`bg-gradient-to-r from-industrial-dark to-steel-blue p-5 border-b-4 ${config.border}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${config.iconBg} rounded-lg`}>
                <Icon className={`w-6 h-6 ${config.iconColor}`} />
              </div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <p className="text-slate-700 leading-relaxed">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t-2 border-slate-200">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-steel-blue to-blue-700 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
