import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { CameraContext } from './context'
import { DEFAULT_CAMERA_CONFIG } from './types'
import type { CameraConfig } from './types'

interface CameraProviderProps {
  children: ReactNode
}

const STORAGE_KEY = 'epp-config'

function loadConfig(): CameraConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...DEFAULT_CAMERA_CONFIG, ...parsed }
    }
  } catch (error) {
    console.error('Error cargando configuración:', error)
  }
  return DEFAULT_CAMERA_CONFIG
}

export function CameraProvider({ children }: CameraProviderProps) {
  const [config, setConfig] = useState<CameraConfig>(loadConfig)

  const updateConfig = (newConfig: Partial<CameraConfig>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...newConfig }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  }, [config])

  return (
    <CameraContext.Provider value={{ config, updateConfig }}>
      {children}
    </CameraContext.Provider>
  )
}
