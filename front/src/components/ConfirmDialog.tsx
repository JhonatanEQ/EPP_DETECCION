import { AlertTriangle, X } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'warning' | 'info'
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'warning'
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const variantStyles = {
    danger: {
      icon: 'bg-danger-red',
      border: 'border-danger-red',
      button: 'from-danger-red to-red-700 hover:from-red-700 hover:to-red-800'
    },
    warning: {
      icon: 'bg-alert-amber',
      border: 'border-alert-amber',
      button: 'from-alert-amber to-yellow-600 hover:from-yellow-600 hover:to-yellow-700'
    },
    info: {
      icon: 'bg-steel-blue',
      border: 'border-steel-blue',
      button: 'from-steel-blue to-blue-700 hover:from-blue-700 hover:to-blue-800'
    }
  }

  const styles = variantStyles[variant]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className={`bg-gradient-to-r from-industrial-dark to-steel-blue p-5 border-b-4 ${styles.border}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${styles.icon} rounded-lg`}>
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
            </div>
            <button
              onClick={onCancel}
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
            onClick={onCancel}
            className="px-5 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 hover:border-slate-400 transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-3 bg-gradient-to-r ${styles.button} text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
