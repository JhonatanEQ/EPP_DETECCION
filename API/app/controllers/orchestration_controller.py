
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from typing import Optional, Dict, Any

import base64
import cv2
import numpy as np
import logging
from io import BytesIO

from app.models.ppe_models import ImageRequest
from app.services.orchestration_service import OrchestrationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v2", tags=["Orchestrated Detection"])

orchestration_service: Optional[OrchestrationService] = None


def init_orchestration(service: OrchestrationService):
    """Inicializa el servicio de orquestación"""
    global orchestration_service
    orchestration_service = service
    logger.info("Servicio de orquestación inicializado")


@router.get("/health")
async def health_check():
    """
    Verifica el estado de todos los servicios
    """
    if not orchestration_service:
        raise HTTPException(
            status_code=503,
            detail="Servicio de orquestación no inicializado"
        )
    
    ppe_service_ok = orchestration_service.check_ppe_service_health()
    
    return {
        "status": "ok" if ppe_service_ok else "degraded",
        "services": {
            "pose_detection": {
                "status": "ok",
                "model": "YOLOv8-Pose"
            },
            "ppe_detection": {
                "status": "ok" if ppe_service_ok else "error",
                "service": "Node.js Microservice",
                "url": orchestration_service.ppe_service_url
            }
        },
        "message": "Todos los servicios operativos" if ppe_service_ok else "Microservicio EPP no disponible"
    }


@router.post("/detect/complete")
async def detect_complete(request: ImageRequest):
    """
    Detección completa: pose + EPP
    
    Procesa la imagen en dos pasos:
    1. Detecta personas y poses (YOLOv8-Pose local)
    2. Detecta EPP (Microservicio Node.js + Roboflow)
    
    Returns:
        JSON con ambas detecciones combinadas
    """
    try:
        if not orchestration_service:
            raise HTTPException(
                status_code=503,
                detail="Servicio de orquestación no disponible"
            )
        
        if not orchestration_service.check_ppe_service_health():
            raise HTTPException(
                status_code=503,
                detail="Microservicio de detección EPP no disponible en " + 
                       orchestration_service.ppe_service_url
            )
        
        try:
            image_data = base64.b64decode(request.image)
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                raise ValueError("No se pudo decodificar la imagen")
                
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Error decodificando imagen: {str(e)}"
            )
        

        result = orchestration_service.process_complete_detection(image)

        formatted_result = _format_detection_response(result)
        
        return JSONResponse(content=formatted_result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f" Error en detección completa: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando imagen: {str(e)}"
        )


@router.post("/detect/pose")
async def detect_pose_only(request: ImageRequest):
    """
    Detecta solo personas y poses (sin EPP)
    """
    try:
        if not orchestration_service:
            raise HTTPException(
                status_code=503,
                detail="Servicio de orquestación no disponible"
            )

        image_data = base64.b64decode(request.image)
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(
                status_code=400,
                detail="No se pudo decodificar la imagen"
            )
        
        result = orchestration_service.detect_pose(image)
        
        return JSONResponse(content={
            'success': True,
            'detection': result
        })
        
    except Exception as e:
        logger.error(f"Error en detección de pose: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando imagen: {str(e)}"
        )


@router.post("/detect/ppe")
async def detect_ppe_only(request: ImageRequest):
    """
    Detecta solo EPP (sin pose)
    Usa el microservicio Node.js
    """
    try:
        if not orchestration_service:
            raise HTTPException(
                status_code=503,
                detail="Servicio de orquestación no disponible"
            )
        
        if not orchestration_service.check_ppe_service_health():
            raise HTTPException(
                status_code=503,
                detail="Microservicio de detección EPP no disponible"
            )
        
        image_data = base64.b64decode(request.image)
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(
                status_code=400,
                detail="No se pudo decodificar la imagen"
            )

        result = orchestration_service.detect_ppe(image)
        
        return JSONResponse(content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en detección EPP: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando imagen: {str(e)}"
        )


@router.post("/validate/ppe")
async def validate_ppe(request: ImageRequest):
    """
    Valida si el EPP está completo
    """
    try:
        if not orchestration_service:
            raise HTTPException(
                status_code=503,
                detail="Servicio de orquestación no disponible"
            )
        
        if not orchestration_service.check_ppe_service_health():
            raise HTTPException(
                status_code=503,
                detail="Microservicio de detección EPP no disponible"
            )

        image_data = base64.b64decode(request.image)
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(
                status_code=400,
                detail="No se pudo decodificar la imagen"
            )

        result = orchestration_service.validate_ppe(image_data)

        formatted_result = _format_validation_response(result)
        
        return JSONResponse(content=formatted_result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f" Error validando EPP: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando imagen: {str(e)}"
        )


@router.post("/detect/complete/image")
async def detect_complete_with_image(request: ImageRequest):
    """
    Detección completa con imagen resultado
    Retorna la imagen con todas las detecciones dibujadas
    """
    try:
        if not orchestration_service:
            raise HTTPException(
                status_code=503,
                detail="Servicio de orquestación no disponible"
            )
        
        if not orchestration_service.check_ppe_service_health():
            raise HTTPException(
                status_code=503,
                detail="Microservicio de detección EPP no disponible"
            )

        image_data = base64.b64decode(request.image)
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(
                status_code=400,
                detail="No se pudo decodificar la imagen"
            )
 
        result = orchestration_service.process_complete_detection(image)

        pose_detections = result['pose_detection']['detections']
        ppe_detections = result['ppe_detection']
        
        result_image = orchestration_service.draw_detections(
            image, 
            pose_detections, 
            ppe_detections
        )

        _, buffer = cv2.imencode('.jpg', result_image)
        
        return StreamingResponse(
            BytesIO(buffer.tobytes()),
            media_type="image/jpeg"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f" Error generando imagen: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando imagen: {str(e)}"
        )

def _format_detection_response(result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Formatea la respuesta de detección combinada al formato esperado por las pruebas

    Args:
        result: Resultado de detect_combined

    Returns:
        Dict formateado para las pruebas
    """
    persons_detected = result.get("persons_detected", 0)
    ppe_detections = result.get("ppe_detections", [])
    ppe_summary = result.get("ppe_summary", {})

    detections_by_class = {}
    total_detections = 0

    for detection in ppe_detections:
        class_name = detection.get("class", "").lower()
        confidence = detection.get("confidence", 0)

        if class_name not in detections_by_class:
            detections_by_class[class_name] = {
                "count": 0,
                "totalConfidence": 0,
                "avgConfidence": 0
            }

        detections_by_class[class_name]["count"] += 1
        detections_by_class[class_name]["totalConfidence"] += confidence
        total_detections += 1

    for class_info in detections_by_class.values():
        if class_info["count"] > 0:
            class_info["avgConfidence"] = class_info["totalConfidence"] / class_info["count"]

    required_ppe = ["casco", "lentes", "guantes", "botas", "chaleco", "camisa_jean", "pantalon"]
    detected_classes = list(detections_by_class.keys())
    missing = [ppe for ppe in required_ppe if ppe not in detected_classes]
    completion_rate = ((len(required_ppe) - len(missing)) / len(required_ppe)) * 100 if required_ppe else 0

    return {
        "pose_detection": {
            "total_persons": persons_detected
        },
        "ppe_detection": {
            "totalDetections": total_detections,
            "detectionsByClass": detections_by_class,
            "validation": {
                "isComplete": len(missing) == 0,
                "completionRate": completion_rate,
                "missing": missing
            }
        },
        "summary": {
            "total_persons": persons_detected,
            "total_ppe_items": total_detections,
            "completion_rate": completion_rate
        }
    }

def _format_validation_response(result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Formatea la respuesta de validación EPP al formato esperado por las pruebas

    Args:
        result: Resultado de validate_ppe

    Returns:
        Dict formateado para las pruebas
    """
    validation = result.get("validation", {})

    status = validation.get("status", "UNKNOWN")
    if status == "COMPLIANT":
        message = "EPP completo detectado"
        safe = True
    else:
        message = "EPP incompleto detectado"
        safe = False

    persons_count = validation.get("persons_count", 1)
    detected_ppe = validation.get("detected_ppe", {})
    total_detected = sum(detected_ppe.values())
    required_total = persons_count * 7
    completion_rate = (total_detected / required_total * 100) if required_total > 0 else 0

    return {
        "validation": {
            "message": message,
            "safe": safe,
            "completionRate": completion_rate,
            "detected": list(detected_ppe.keys()),
            "missing": validation.get("missing_ppe", [])
        }
    }
