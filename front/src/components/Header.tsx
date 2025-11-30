import { Shield } from 'lucide-react'

export function Header() {
  return (
    <header className="bg-gradient-to-r from-industrial-dark to-steel-blue px-6 py-5 shadow-lg">
      <div className="flex items-center gap-4">
        <div className="bg-warning-yellow p-3 rounded-xl shadow-md">
          <Shield className="w-8 h-8 text-industrial-dark" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Sistema EPP <span className="text-warning-yellow">•</span> Seguridad Industrial
          </h1>
          <p className="text-sm text-slate-300">
            Monitoreo en tiempo real
          </p>
        </div>
      </div>
    </header>
  )
}
