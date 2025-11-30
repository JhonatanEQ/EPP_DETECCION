import { createContext } from 'react'
import type { CameraContextType } from './types'

export const CameraContext = createContext<CameraContextType | undefined>(undefined)
