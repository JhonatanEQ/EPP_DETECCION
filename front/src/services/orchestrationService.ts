
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const API_V2_URL = `${API_URL}/api/v2`


export interface Keypoint {
  x: number
  y: number
  confidence: number
}

export interface PoseDetection {
  person_id: number
  bbox: {
    x1: number
    y1: number
    x2: number
    y2: number
  }
  confidence: number
  keypoints: Keypoint[]
}

export interface PoseResult {
  total_persons: number
  detections: PoseDetection[]
}

export interface PPEDetection {
  class: string
  confidence: number
  x: number
  y: number
  width: number
  height: number
}

export interface PPEDetectionByClass {
  count: number
  avgConfidence: number
  detections: Array<{
    confidence: number
    bbox: {
      x: number
      y: number
      width: number
      height: number
    }
  }>
}

export interface PPEValidation {
  isComplete: boolean
  detected: string[]
  missing: string[]
  completionRate: string
}

export interface PPEResult {
  totalDetections: number
  detectionsByClass: { [key: string]: PPEDetectionByClass }
  allDetections: PPEDetection[]
  validation: PPEValidation
}


export interface CompleteDetectionResponse {
  success: boolean
  timestamp: string
  pose_detection: PoseResult
  ppe_detection: PPEResult
  summary: {
    total_persons: number
    total_ppe_items: number
    ppe_complete: boolean
    completion_rate: string
  }
}

export interface HealthCheckResponse {
  status: string
  services: {
    pose_detection: {
      status: string
      model: string
    }
    ppe_detection: {
      status: string
      service: string
      url: string
    }
  }
  message: string
}

export interface ValidationResponse {
  success: boolean
  timestamp: string
  validation: {
    isComplete: boolean
    safe: boolean
    message: string
    detected: string[]
    missing: string[]
    completionRate: string
    detectionsByClass: { [key: string]: PPEDetectionByClass }
  }
}

export async function checkHealth(): Promise<HealthCheckResponse> {
  try {
    const response = await fetch(`${API_V2_URL}/health`)
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('❌ Error verificando salud de servicios:', error)
    throw error
  }
}

export async function detectComplete(
  imageData: string,
  confidence: number = 0.5
): Promise<CompleteDetectionResponse> {
  try {
    const response = await fetch(`${API_V2_URL}/detect/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageData,
        confidence,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || `Error HTTP: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error en detección completa:', error)
    throw error
  }
}

export async function detectPoseOnly(
  imageData: string
): Promise<{ success: boolean; detection: PoseResult }> {
  try {
    const response = await fetch(`${API_V2_URL}/detect/pose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageData,
      }),
    })

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(' Error en detección de pose:', error)
    throw error
  }
}

export async function detectPPEOnly(
  imageData: string
): Promise<{ success: boolean; detection: PPEResult }> {
  try {
    const response = await fetch(`${API_V2_URL}/detect/ppe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageData,
      }),
    })

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(' Error en detección EPP:', error)
    throw error
  }
}

export async function validatePPE(
  imageData: string
): Promise<ValidationResponse> {
  try {
    const response = await fetch(`${API_V2_URL}/validate/ppe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageData,
      }),
    })

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(' Error validando EPP:', error)
    throw error
  }
}

export async function getDetectionImage(
  imageData: string
): Promise<Blob> {
  try {
    const response = await fetch(`${API_V2_URL}/detect/complete/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageData,
      }),
    })

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`)
    }

    return await response.blob()
  } catch (error) {
    console.error(' Error obteniendo imagen:', error)
    throw error
  }
}

export function convertToLegacyFormat(ppeResult: PPEResult) {
  const detected = ppeResult.validation.detected
  
  return {
    ppe_status: {
      casco: detected.includes('casco'),
      lentes: detected.includes('lentes'),
      guantes: detected.includes('guantes'),
      botas: detected.includes('botas'),
      chaleco: detected.includes('chaleco'),
      camisa: detected.includes('camisa_jean'),
      pantalon: detected.includes('pantalon'),
      barbijo: detected.includes('barbijo'),
      epp_completo: ppeResult.validation.isComplete,
    },
    is_compliant: ppeResult.validation.isComplete,
    has_person: true,
  }
}

export function getPPEStatusColor(isComplete: boolean): string {
  return isComplete ? '#10b981' : '#ef4444'
}

export function getPPEStatusMessage(validation: PPEValidation): string {
  if (validation.isComplete) {
    return 'EPP Completo - Trabajador seguro'
  }
  
  const missing = validation.missing.join(', ')
  return `Faltan: ${missing}`
}
