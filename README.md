# 🛡️ Sistema de Detección de EPP con Validación de Pose

Sistema completo para detección de Equipos de Protección Personal usando YOLOv8 + YOLOv8-Pose, FastAPI y React. Incluye detección en tiempo real con validación espacial de EPP en regiones corporales específicas.

## 📁 Estructura del Proyecto

```
EPP/
├── API/                    # Backend FastAPI
│   ├── app/               # Código de la API (MVC)
│   │   ├── models/        # Modelos Pydantic
│   │   ├── services/      # Lógica de negocio
│   │   ├── controllers/   # Controladores/Rutas
│   │   └── config/        # Configuración
│   ├── models/            # Modelos YOLO (.pt)
│   ├── docs/              # Documentación
│   ├── main.py           # Punto de entrada
│   └── requirements.txt  # Dependencias Python
│
├── front/                 # Frontend React
│   ├── src/
│   │   ├── components/   # Componentes React
│   │   ├── contexts/     # Context API
│   │   ├── services/     # Servicios (API calls)
│   │   └── utils/        # Utilidades
│   └── package.json
│
└── README.md             # Este archivo
```

## 📋 Requisitos Previos

Antes de instalar el proyecto, necesitas tener instalado:

### 🖥️ Software Necesario

1. **Python 3.10 o superior**
   - Descargar: https://www.python.org/downloads/
   - ⚠️ **IMPORTANTE**: Durante la instalación, marca la casilla "Add Python to PATH"
   - Verificar instalación:
     ```bash
     python --version
     ```

2. **Node.js 18 o superior** (incluye npm)
   - Descargar: https://nodejs.org/
   - Recomendado: Versión LTS (Long Term Support)
   - Verificar instalación:
     ```bash
     node --version
     npm --version
     ```

3. **Git** (para clonar el repositorio)
   - Descargar: https://git-scm.com/downloads
   - Verificar instalación:
     ```bash
     git --version
     ```

4. **Editor de código** (opcional pero recomendado)
   - Visual Studio Code: https://code.visualstudio.com/

---

## 🚀 Instalación Paso a Paso

### 📥 Paso 1: Descargar el Proyecto

```bash
# Clonar el repositorio
git clone https://github.com/yosue2003/NormasEPP.git

# Entrar a la carpeta del proyecto
cd NormasEPP
```

O descarga el ZIP desde GitHub y descomprímelo.

---

### 🐍 Paso 2: Configurar Backend (Python/FastAPI)

#### 2.1 Crear entorno virtual (recomendado)

```bash
# Navegar a la carpeta API
cd API

# Crear entorno virtual
python -m venv venv

# Activar el entorno virtual
# En Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# En Windows (CMD):
venv\Scripts\activate.bat

# En Linux/Mac:
source venv/bin/activate
```

**💡 Nota**: Verás `(venv)` al inicio de tu terminal cuando esté activado.

#### 2.2 Instalar dependencias de Python

```bash
# Con el entorno virtual activado:
pip install --upgrade pip
pip install -r requirements.txt
```

**⏱️ Esto puede tardar 2-5 minutos** (descarga ultralytics, opencv, fastapi, etc.)

#### 2.3 Verificar que el modelo existe

```bash
# El modelo entrenado debe estar en:
# API/models/ppe_best.pt

# Verificar que existe:
# Windows PowerShell:
Test-Path "models\ppe_best.pt"

# Windows CMD / Linux / Mac:
ls models/ppe_best.pt
```

**⚠️ Si no tienes el modelo**: Contacta al administrador del proyecto o entrena tu propio modelo siguiendo `API/models/Train_EPP_Model_Colab.ipynb`.

#### 2.4 Iniciar el servidor backend

```bash
# Opción 1: Con auto-reload (desarrollo)
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Opción 2: Modo simple
python main.py
```

**✅ Si funciona correctamente verás:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
Modelo personalizado cargado: [ruta]/ppe_best.pt
```

**🌐 URLs importantes:**
- Servidor: http://localhost:8000
- Documentación interactiva: http://localhost:8000/docs
- Health check: http://localhost:8000/api/health

**⏸️ Mantén esta terminal abierta** - el servidor debe estar corriendo.

---

### ⚛️ Paso 3: Configurar Frontend (React/TypeScript)

#### 3.1 Abrir NUEVA terminal

**No cierres la terminal del backend**, abre una nueva.

```bash
# Desde la raíz del proyecto
cd front
```

#### 3.2 Instalar dependencias de Node.js

```bash
npm install
```

**⏱️ Esto puede tardar 1-3 minutos** (descarga React, Vite, Tailwind, etc.)

#### 3.3 Configurar variables de entorno (opcional)

```bash
# Crear archivo .env en la carpeta front/
# Windows PowerShell:
New-Item -Path ".env" -ItemType File

# Linux/Mac:
touch .env
```

Edita el archivo `.env` y agrega:
```env
VITE_API_URL=http://localhost:8000
```

**💡 Nota**: Si el backend corre en otro puerto, cámbialo aquí.

#### 3.4 Iniciar el servidor de desarrollo

```bash
npm run dev
```

**✅ Si funciona correctamente verás:**
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**🌐 Abre tu navegador en**: http://localhost:5173

---

## 🎥 Configuración de Cámara

### Cámara Web (USB)

1. Conecta tu cámara USB
2. En la aplicación web, selecciona la cámara del desplegable
3. Presiona "Iniciar Detección"

### Cámara IP

1. En la aplicación, selecciona "Cámara IP"
2. Ingresa la URL de tu cámara (ejemplo):
   ```
   rtsp://usuario:contraseña@192.168.1.100:554/stream
   http://192.168.1.100:8080/video
   ```
3. Presiona "Conectar"

**💡 Formatos soportados**: RTSP, HTTP, HTTPS

---

## 🎯 Uso del Sistema

### Detección en Tiempo Real

1. **Iniciar Cámara**: Haz clic en "Iniciar Detección"
2. **Detección Automática**: El sistema detectará:
   - ✅ Personas (17 puntos clave del cuerpo)
   - ✅ 4 Regiones corporales (cabeza, manos, pies, torso)
   - ✅ 8 Elementos EPP (casco, lentes, barbijo, chaleco, camisa, guantes, botas, pantalón)
   - ✅ Validación espacial (EPP en región correcta)

3. **Panel de Estado**: Muestra elementos detectados en tiempo real
4. **Historial**: Registra todas las detecciones
5. **Alertas**: Notifica si falta equipo de seguridad

### Configuración

Haz clic en el icono ⚙️ para ajustar:
- **Intervalo de detección**: 500-5000 ms
- **Confianza mínima**: 0.3-0.9
- **Tipo de alerta**: sonido/voz/silencio
- **Volumen**: 0-100%

---

## 🤖 Modelos de Detección

El sistema usa **dos modelos YOLO**:

### 1️⃣ YOLOv8-Pose (Detección de Personas y Pose)
- **Descarga automática**: Se descarga al iniciar el servidor por primera vez
- **Función**: Detecta personas y 17 puntos clave del cuerpo (COCO Keypoints)
- **Regiones calculadas**: Cabeza, Manos, Pies, Torso
- **No requiere configuración manual**

### 2️⃣ YOLOv8 Personalizado (Detección de EPP)
- **Archivo**: `API/models/ppe_best.pt`
- **Clases detectadas**: 8 elementos EPP
  - 🪖 Casco
  - 👓 Lentes
  - 😷 Barbijo
  - 🦺 Chaleco
  - 👕 Camisa
  - 🧤 Guantes
  - 👖 Pantalón
  - 👢 Botas

**⚠️ Importante**: Este modelo debe estar presente en `API/models/ppe_best.pt`. Si no lo tienes, contacta al administrador del proyecto.

### 🔄 Entrenar tu Propio Modelo (Opcional)

Si quieres entrenar un modelo personalizado:
1. Abre `API/models/Train_EPP_Model_Colab.ipynb` en Google Colab
2. Sigue las instrucciones del notebook
3. Descarga el modelo resultante (`best.pt`)
4. Renómbralo a `ppe_best.pt` y colócalo en `API/models/`

## 📊 Endpoints de la API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Información de la API y estado |
| GET | `/api/health` | Health check del servicio |
| WebSocket | `/api/ws/detect` | Detección en tiempo real con validación de pose |

### 🔌 Uso del WebSocket

El frontend se conecta automáticamente al WebSocket para enviar frames de video y recibir detecciones en tiempo real.

**Flujo de datos**:
1. Frontend captura frame de cámara (640x360)
2. Envía imagen base64 por WebSocket
3. Backend procesa con ambos modelos (Pose + EPP)
4. Valida EPP en regiones corporales
5. Retorna: EPP detectado + Regiones corporales + Dimensiones de imagen

**Respuesta JSON**:
```json
{
  "ppe_status": {
    "casco": true,
    "lentes": true,
    "barbijo": false,
    "chaleco": true,
    "camisa": true,
    "guantes": false,
    "pantalon": true,
    "botas": true,
    "epp_completo": false
  },
  "detections": [
    {
      "class": "casco",
      "confidence": 0.89,
      "bbox": [120, 50, 200, 150]
    }
  ],
  "body_regions": [
    {
      "region_type": "head",
      "bbox": [100, 30, 220, 180],
      "keypoints": [[150, 40], [160, 45], ...]
    }
  ],
  "is_compliant": false,
  "processing_time": 145.2,
  "has_person": true,
  "image_width": 640,
  "image_height": 360
}
```

---

## 🔧 Configuración Avanzada

### Backend

La configuración del backend está en `API/app/config/settings.py`:

```python
class Settings(BaseSettings):
    # Configuración del servidor
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS (permitir orígenes)
    ALLOWED_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ]
    
    # Modelo EPP (path absoluto calculado automáticamente)
    @property
    def model_path(self) -> str:
        return str(Path(__file__).parent.parent.parent / "models" / "ppe_best.pt")
```

### Frontend

Variables de entorno en `front/.env`:

```env
# URL del backend
VITE_API_URL=http://localhost:8000

# Configuración de cámara (opcional)
VITE_DEFAULT_CONFIDENCE=0.5
VITE_DEFAULT_INTERVAL=1000
```

---

## 📚 Documentación Adicional

- **Arquitectura del sistema**: Ver estructura MVC en `API/app/`
- **Entrenamiento de modelos**: `API/models/Train_EPP_Model_Colab.ipynb`
- **Dataset**: `API/models/EPP_dataset/` (imágenes de entrenamiento)

## 🛠️ Tecnologías

### Backend
- **FastAPI** - Framework web
- **YOLO v8** - Detección de objetos
- **OpenCV** - Procesamiento de imágenes
- **WebSocket** - Comunicación en tiempo real

### Frontend
- **React 19** - UI framework
- **TypeScript** - Tipado estático
- **Vite** - Build tool
- **Tailwind CSS** - Estilos

## 📝 Notas

- El modelo base `yolov8n.pt` detecta **personas** pero NO EPP específico
- Para detectar EPP usa un **modelo especializado** (ver `PRETRAINED_MODELS.md`)
- Recomendado: **Roboflow API** para empezar sin necesidad de GPU

## 🐛 Solución de Problemas Comunes

### ❌ Error: "python no se reconoce como comando"

**Causa**: Python no está en el PATH del sistema.

**Solución**:
1. Reinstala Python desde https://www.python.org/downloads/
2. ✅ **Marca la casilla** "Add Python to PATH" durante la instalación
3. Reinicia la terminal

**Verificar**:
```bash
python --version
```

---

### ❌ Error: "pip install falla"

**Causa**: pip desactualizado o problemas de red.

**Solución**:
```bash
# Actualizar pip
python -m pip install --upgrade pip

# Si hay error de SSL/certificados:
pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org -r requirements.txt
```

---

### ❌ Error: "Module not found" al iniciar backend

**Causa**: Dependencias no instaladas o entorno virtual no activado.

**Solución**:
```bash
# Verifica que el entorno virtual esté activado (debes ver "(venv)" en la terminal)
# Si no está activado:
.\venv\Scripts\Activate.ps1  # Windows PowerShell
# o
venv\Scripts\activate.bat    # Windows CMD

# Reinstala dependencias
pip install -r requirements.txt
```

---

### ❌ Error: "Address already in use" (puerto 8000 ocupado)

**Causa**: Otro proceso está usando el puerto 8000.

**Solución**:
```bash
# Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process -Force

# O cambia el puerto:
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

---

### ❌ Error: "FileNotFoundError: models/ppe_best.pt"

**Causa**: El modelo entrenado no existe.

**Solución**:
1. Verifica que el archivo existe en `API/models/ppe_best.pt`
2. Si no lo tienes, descárgalo del repositorio o entrena uno nuevo
3. Verifica la ruta en `API/app/config/settings.py`

---

### ❌ Frontend no conecta con el backend

**Síntoma**: "Network Error" o "Failed to fetch"

**Solución**:
1. Verifica que el backend esté corriendo:
   ```bash
   # Abre http://localhost:8000/api/health en el navegador
   # Debe mostrar: {"status": "healthy"}
   ```

2. Verifica CORS en `API/app/config/settings.py`:
   ```python
   ALLOWED_ORIGINS = [
       "http://localhost:5173",
       "http://127.0.0.1:5173"
   ]
   ```

3. Verifica el archivo `front/.env`:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

4. Reinicia ambos servidores

---

### ❌ Cámara no funciona / "Permission denied"

**Causa**: Navegador no tiene permisos de cámara.

**Solución**:
1. Permite el acceso a la cámara en tu navegador (aparecerá un popup)
2. Verifica la configuración del navegador:
   - Chrome: `chrome://settings/content/camera`
   - Firefox: `about:preferences#privacy`
3. Usa HTTPS o localhost (HTTP solo funciona en localhost)
4. Verifica que la cámara funcione en otras aplicaciones

---

### ❌ Detección muy lenta

**Causas y soluciones**:

1. **CPU lento**: 
   - Aumenta el intervalo de detección (2000-3000 ms)
   - Reduce la resolución de la cámara en configuración

2. **Modelo pesado**:
   - El modelo `ppe_best.pt` puede ser grande
   - Considera usar YOLOv8n (nano) para mayor velocidad

3. **Imagen de alta resolución**:
   - Frontend redimensiona a 640x360 automáticamente
   - Verifica que no estés enviando imágenes 4K

---

### ❌ EPP detectado pero no validado correctamente

**Síntoma**: El sistema detecta EPP pero no lo cuenta como válido.

**Causa**: Validación espacial estricta (EPP debe estar en región corporal correcta).

**Solución**:
1. Verifica que la persona esté completamente visible
2. Los 17 puntos clave del cuerpo deben ser detectados
3. Ajusta el umbral de confianza (mínimo 0.3)
4. Revisa que el EPP esté puesto correctamente (no en la mano, sino en el cuerpo)

---

### ❌ npm install falla

**Causa**: Problemas de red o cache corrupto.

**Solución**:
```bash
# Limpiar cache de npm
npm cache clean --force

# Borrar node_modules y reinstalar
Remove-Item -Recurse -Force node_modules  # PowerShell
# o
rm -rf node_modules  # Linux/Mac

# Reinstalar
npm install
```

---

## 🆘 Obtener Ayuda Adicional

Si ninguna solución funciona:

1. **Revisa los logs del backend**: La terminal muestra errores detallados
2. **Revisa la consola del navegador**: F12 → Console (errores del frontend)
3. **Verifica versiones**:
   ```bash
   python --version  # Debe ser 3.10+
   node --version    # Debe ser 18+
   npm --version
   ```

4. **Documentación adicional**:
   - Backend API: http://localhost:8000/docs
   - Documentación modelos: `API/docs/PRETRAINED_MODELS.md`

---

## 📧 Contacto y Soporte

Para reportar bugs o solicitar ayuda:
- **GitHub Issues**: https://github.com/yosue2003/NormasEPP/issues
- **Documentación técnica**: `API/docs/`

---

## 📝 Notas Importantes

- ⚡ **Primera ejecución**: La descarga de modelos YOLO puede tardar (descarga automática)
- 🔒 **Seguridad**: No expongas el servidor a internet sin autenticación
- 🎯 **Modelo entrenado**: El modelo `ppe_best.pt` está entrenado con imágenes específicas
- 📹 **Cámaras IP**: Requieren configuración de red adecuada
- 🖥️ **Rendimiento**: GPU recomendada pero no requerida (funciona con CPU)
