# 🛡️ Sistema de Detección de EPP con Validación de Pose

YOLOv8 + FastAPI + Microservicio Node.js + React + WebSockets

Sistema completo para la detección y validación de **Equipos de Protección Personal (EPP)** en tiempo real.
Incluye:

* 🔍 Detección de personas + 17 keypoints (pose detection)
* 👕 Detección de 8 elementos EPP (casco, lentes, guantes, etc.)
* 🧠 Validación espacial (EPP colocado en la región correcta)
* ⚛️ Dashboard web en React
* 🌐 Microservicio Node.js para detección vía Roboflow Workflows
* 🧵 Comunicación en tiempo real con WebSocket

---

# 📁 Estructura del Proyecto

```
EPP/
├── API/                     # Backend principal (FastAPI)
│   ├── app/
│   │   ├── controllers/     # Rutas/API
│   │   ├── services/        # Lógica (pose, validación, orquestador)
│   │   ├── models/          # Pydantic
│   │   ├── utils/
│   │   └── config/
│   ├── models/              # Modelos YOLO locales (.pt)
│   ├── main.py              # Entrada del servidor
│   ├── requirements.txt
│
├── ppe-detection-service/    # Microservicio Node.js (Roboflow)
│   ├── server.js
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
├── front/                   # Frontend React + TypeScript
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── contexts/
│   │   └── utils/
│   └── package.json
│
└── README.md                # Este archivo
```

---

# 🚀 Instalación Completa (Back + Microservicio + Front)

A continuación se instala **cada parte del sistema** por separado.

---

# 1️⃣ Backend – FastAPI (Python)

## 📥 1.1 Ingresar a la carpeta

```bash
cd API
```

## 🐍 1.2 Crear entorno virtual

```bash
python -m venv venv
```

Activar:

**Windows PowerShell**

```bash
.\venv\Scripts\Activate.ps1
```

**Linux/Mac**

```bash
source venv/bin/activate
```

## 📦 1.3 Instalar dependencias

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

## 🧠 1.4 Verificar modelos YOLO

Archivo requerido:

```
API/models/ppe_best.pt
```

Comprobar:

```bash
ls models/
```

## ▶️ 1.5 Ejecutar el servidor FastAPI

```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### URLs importantes:

| Recurso               | URL                                                      |
| --------------------- | -------------------------------------------------------- |
| API                   | [http://localhost:8000](http://localhost:8000)           |
| Documentación Swagger | [http://localhost:8000/docs](http://localhost:8000/docs) |
| WebSocket             | ws://localhost:8000/api/ws/detect                        |

---

# 2️⃣ Microservicio Node.js (Roboflow)

*El backend FastAPI depende de este servicio.*

## 📥 2.1 Ir a la carpeta

```bash
cd ppe-detection-service
```

## 📦 2.2 Instalar dependencias

```bash
npm install
```

## ⚙️ 2.3 Crear archivo `.env`

Usa `.env.example` como base:

```env
PORT=3002
ROBOFLOW_API_KEY=TU_API_KEY
ROBOFLOW_WORKSPACE=tu_workspace
ROBOFLOW_WORKFLOW_ID=flow-id
ROBOFLOW_API_URL=https://detect.roboflow.com
```

## ▶️ 2.4 Ejecutar el microservicio

```bash
npm start
```

Deberías ver:

```
🚀 MICROSERVICIO PPE DETECTION INICIADO
GET /health
POST /detect
POST /validate
```

### Endpoints

| Método | URL                                                              |
| ------ | ---------------------------------------------------------------- |
| GET    | [http://localhost:3002/health](http://localhost:3002/health)     |
| GET    | [http://localhost:3002/config](http://localhost:3002/config)     |
| POST   | [http://localhost:3002/detect](http://localhost:3002/detect)     |
| POST   | [http://localhost:3002/validate](http://localhost:3002/validate) |

---

# 3️⃣ Frontend – React + Vite + TypeScript

## 📥 3.1 Ir a carpeta

```bash
cd front
```

## 📦 3.2 Instalar dependencias

```bash
npm install
```

## ⚙️ 3.3 Crear el archivo `.env`

```env
VITE_API_URL=http://localhost:8000
```

## ▶️ 3.4 Ejecutar servidor de desarrollo

```bash
npm run dev
```

URL:

```
http://localhost:5173
```

---

# 🧠 Arquitectura General del Sistema

```txt
              (Webcam/IP Camera)
                       │
                       ▼
               Frontend React
           (captura frame base64)
                       │ WebSocket
                       ▼
              API FastAPI (core)
 ┌───────────────────────────────────────────┐
 │ - Detección de personas + pose YOLOv8     │
 │ - Validación de regiones corporales       │
 │ - Orquestación de IA                      │
 │ - WebSocket server                        │
 └───────────────────────────────────────────┘
                       │ REST
                       ▼
     Microservicio Node.js (Roboflow API)
 ┌─────────────────────────────────────────┐
 │ - Envía imagen a Roboflow Workflows     │
 │ - Agrupa detecciones por clase          │
 │ - Normaliza nombres (casco, lentes...)  │
 │ - Retorna detecciones y faltantes       │
 └─────────────────────────────────────────┘
                       │
                       ▼
                 Respuesta JSON
         (ppe_status + faltantes + pose)
```

---

# 📊 Clases Detectadas

### 👤 Pose Detection (YOLOv8 Pose)

* 17 puntos clave COCO
* Regiones generadas: cabeza, manos, pies, torso

### 🛡️ EPP Detectado por Microservicio

* 🪖 casco
* 👓 lentes
* 😷 barbijo
* 🧤 guantes
* 👕 camisa_jean
* 🦺 chaleco
* 👖 pantalón
* 👢 botas

---

# 📡 Comunicación en Tiempo Real (WebSocket)

El frontend envía frames cada *X ms*:

```ts
ws.send(JSON.stringify({ image: base64, confidence: 0.5 }))
```

El backend retorna:

```json
{
  "ppe_status": {
    "casco": true,
    "lentes": false,
    "guantes": true,
    ...
  },
  "is_compliant": false,
  "body_regions": [...],
  "detections": [...],
  "image_width": 640,
  "image_height": 360
}
```

---

# 🧪 Endpoints del Backend (FastAPI)

| Método | URL              | Descripción                   |
| ------ | ---------------- | ----------------------------- |
| GET    | `/api/health`    | Comprobar estado del servidor |
| WS     | `/api/ws/detect` | Detección en tiempo real      |
| POST   | `/api/detect`    | Detección puntual vía REST    |

---

# ⚙️ Flujo Completo de Validación

1. 📤 **Frontend** captura imagen → base64
2. 🔌 WebSocket → envía a FastAPI
3. 🧠 FastAPI → detecta persona, pose y regiones
4. 🌐 FastAPI → envía imagen al microservicio Node.js
5. 🤖 Node.js → Roboflow → detección EPP
6. 🔄 Node.js responde → FastAPI combina pose + EPP
7. 📥 Frontend recibe estado EPP, faltantes y actualiza UI

---

# 🐛 Errores Comunes

### ❌ “No module named ultralytics”

Solución:

```bash
pip install ultralytics
```

### ❌ Frontend no se conecta a WebSocket

Verifica en `.env`:

```
VITE_API_URL=http://localhost:8000
```

### ❌ Microservicio devuelve error 401

Roboflow API key inválida o mal configurada.

---

# 🧰 Tecnologías Usadas

### Backend

* FastAPI
* Python 3.10
* YOLOv8 + Pose
* OpenCV
* WebSockets
* Pydantic

### Microservicio

* Node.js
* Express
* Roboflow Workflows
* node-fetch

### Frontend

* React 19
* TypeScript
* Vite
* TailwindCSS

---

# 🧑‍💻 Cómo Ejecutar Todo Junto

Terminal 1 – Backend FastAPI:

```bash
cd API
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload
```

Terminal 2 – Microservicio:

```bash
cd ppe-detection-service
npm start
```

Terminal 3 – Frontend:

```bash
cd front
npm run dev
```

💡 **El frontend debe iniciarse al final**, cuando el backend y microservicio ya están levantados.

---

# 🤝 Contribuir

Pull requests y reportes son bienvenidos.
Usa:
[https://github.com/turepo/NormasEPP/issues](https://github.com/turepo/NormasEPP/issues)

---

# 📜 Licencia

MIT License.

---

