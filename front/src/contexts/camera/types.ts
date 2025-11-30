export type CameraType = 'webcam' | 'ip'
export type AlertType = 'visual' | 'sound' | 'both'

export interface PPEConfig {
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

export interface AlertConfig {
  type: AlertType
  volume: number
  repeatInterval: number // en segundos
}

export interface HistoryConfig {
  maxRecords: number
}

export interface CameraConfig {
  type: CameraType
  ipUrl: string
  resolution: '1080p' | '720p' | '480p'
  analysisFrequency: 1 | 2 | 5
  requiredPPE: PPEConfig
  alerts: AlertConfig
  history: HistoryConfig
}

export interface CameraContextType {
  config: CameraConfig
  updateConfig: (config: Partial<CameraConfig>) => void
}

export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  type: 'webcam',
  ipUrl: '',
  resolution: '1080p',
  analysisFrequency: 2,
  requiredPPE: {
    casco: true,
    lentes: true,
    guantes: true,
    botas: true,
    chaleco: true,
    camisa: true,
    pantalon: true,
    barbijo: true,
    epp_completo: false,
  },
  alerts: {
    type: 'both',
    volume: 70,
    repeatInterval: 5,
  },
  history: {
    maxRecords: 20,
  },
}
