import { useState, useRef } from 'react'
import { Header } from './components/Header'
import { Dashboard, type DashboardHandle } from './components/Dashboard'
import { ConfigModal } from './components/ConfigModal'
import { ErrorBoundary } from './components/ErrorBoundary'
import { CameraProvider } from './contexts/camera'

export function App() {
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const dashboardRef = useRef<DashboardHandle>(null)
  return (
    <ErrorBoundary>
      <CameraProvider>
        <div className="min-h-screen w-full bg-slate-100">
          <Header />

          <main className="container mx-auto px-4 py-6 max-w-7xl">
            <Dashboard 
              ref={dashboardRef}
              onOpenConfig={() => setIsConfigOpen(true)} 
            />
          </main>

          <ConfigModal
            isOpen={isConfigOpen}
            onClose={() => setIsConfigOpen(false)}
            onHistoryCleared={() => dashboardRef.current?.clearHistory()}
          />
        </div>
      </CameraProvider>
    </ErrorBoundary>
  )
}
