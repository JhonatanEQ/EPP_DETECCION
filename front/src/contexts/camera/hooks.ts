import { useContext } from 'react'
import { CameraContext } from './context'

export function useCameraConfig() {
  const context = useContext(CameraContext)
  if (!context) {
    throw new Error('useCameraConfig must be used within CameraProvider')
  }
  return context
}
