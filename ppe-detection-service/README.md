# PPE Detection Microservice

Microservicio Node.js para detección de Equipo de Protección Personal (EPP) usando Roboflow API.

## 🚀 Características

- ✅ Detección de 8 clases de EPP
- ✅ Validación de EPP completo
- ✅ API REST con Express
- ✅ Integración con Roboflow Workflows
- ✅ Procesamiento de imágenes en base64

## 📋 Requisitos

- Node.js 14+
- npm o yarn

## 🔧 Instalación

```bash
npm install
```

## ⚙️ Configuración

Copia `.env.example` a `.env` y configura:

```env
PORT=3001
ROBOFLOW_API_KEY=tu_api_key
ROBOFLOW_WORKSPACE=workspace-ydydf
ROBOFLOW_WORKFLOW_ID=find-cascos-glasses-helmets-masks-vests-gloves-shirts-pants-and-boots-4
```

## 🏃 Uso

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

## 📡 Endpoints

### GET /health
Verifica el estado del servicio

**Response:**
```json
{
  "status": "ok",
  "service": "ppe-detection-service",
  "timestamp": "2025-11-30T...",
  "roboflowConfigured": true
}
```

### GET /config
Obtiene configuración del servicio

**Response:**
```json
{
  "eppClasses": ["barbijo", "botas", "camisa_jean", ...],
  "requiredElements": 8,
  "roboflowWorkspace": "workspace-ydydf",
  "roboflowWorkflowId": "find-cascos-..."
}
```

### POST /detect
Detecta EPP en una imagen

**Request:**
```json
{
  "image": "base64_encoded_image"
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2025-11-30T...",
  "detection": {
    "totalDetections": 9,
    "detectionsByClass": {
      "casco": {
        "count": 1,
        "avgConfidence": 0.942,
        "detections": [...]
      }
    },
    "validation": {
      "isComplete": false,
      "detected": ["casco", "chaleco", ...],
      "missing": ["lentes"],
      "completionRate": "87.50"
    }
  }
}
```

### POST /validate
Valida si el EPP está completo

**Request:**
```json
{
  "image": "base64_encoded_image"
}
```

**Response:**
```json
{
  "success": true,
  "validation": {
    "isComplete": true,
    "safe": true,
    "message": "✅ EPP completo detectado",
    "detected": [...],
    "missing": [],
    "completionRate": "100.00"
  }
}
```

## 🔍 Clases EPP Detectadas

1. barbijo (mascarilla)
2. botas (safety boots)
3. camisa_jean (work shirt)
4. casco (helmet)
5. chaleco (reflective vest)
6. guantes (gloves)
7. lentes (safety glasses)
8. pantalon (work pants)

## 🏗️ Arquitectura

```
Frontend → Backend FastAPI → Microservicio Node.js → Roboflow API
                ↓                      ↓
          Pose Detection      EPP Detection
```

## 📝 Licencia

ISC
