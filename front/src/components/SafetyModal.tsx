import { X, AlertTriangle, Shield, CheckCircle, Clock } from 'lucide-react'
import { getMissingPPENorms, type PPENorm } from '../utils/ppeNorms'

interface SafetyModalProps {
  isOpen: boolean
  onClose: () => void
  ppeStatus: Record<string, boolean>
  onResume: () => void
  isPaused: boolean
}

export function SafetyModal({ isOpen, onClose, ppeStatus, onResume, isPaused }: SafetyModalProps) {
  if (!isOpen) return null

  const missingNorms = getMissingPPENorms(ppeStatus)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-gradient-to-br from-danger-red to-red-600 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">
                  NORMAS DE SEGURIDAD INCUMPLIDAS
                </h2>
                <p className="text-white/90 text-sm mt-1">
                  {missingNorms.length} elemento{missingNorms.length > 1 ? 's' : ''} de protección faltante{missingNorms.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {isPaused && (
            <div className="mt-4 flex items-center gap-2 bg-warning-yellow/20 border-2 border-warning-yellow/50 rounded-lg p-3">
              <Clock className="w-5 h-5 text-warning-yellow animate-pulse" />
              <span className="text-sm font-bold text-white">
                Detección pausada - Revise la información de seguridad
              </span>
            </div>
          )}
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          {missingNorms.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-success-green mx-auto mb-4" />
              <h3 className="text-xl font-bold text-industrial-dark mb-2">
                EPP Completo
              </h3>
              <p className="text-slate-600">
                Todos los elementos de protección están presentes
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {missingNorms.map((norm: PPENorm) => (
                <div
                  key={norm.key}
                  className="bg-red-50 border-2 border-danger-red/30 rounded-xl p-4 hover:border-danger-red/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-danger-red/10 rounded-lg flex-shrink-0">
                      <Shield className="w-6 h-6 text-danger-red" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-industrial-dark mb-2">
                        {norm.label}
                      </h3>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-steel-blue rounded-full"></div>
                            <span className="text-xs font-bold text-steel-blue uppercase">
                              Norma
                            </span>
                          </div>
                          <p className="text-sm text-slate-900 font-semibold ml-4">
                            {norm.norm}
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-danger-red rounded-full"></div>
                            <span className="text-xs font-bold text-danger-red uppercase">
                              Riesgo
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 ml-4">
                            {norm.risk}
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-success-green rounded-full"></div>
                            <span className="text-xs font-bold text-success-green uppercase">
                              Acción requerida
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 ml-4 font-medium">
                            {norm.action}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-slate-200 p-6 bg-slate-50">
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl border-2 border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors"
            >
              Cerrar
            </button>
            {isPaused && (
              <button
                onClick={onResume}
                className="px-6 py-3 rounded-xl bg-gradient-to-br from-success-green to-green-600 text-white font-bold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Entendido, reanudar detección
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
