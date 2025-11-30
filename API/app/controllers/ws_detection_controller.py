import base64
import json
import logging
from typing import Optional

import cv2
import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.orchestration_service import OrchestrationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["WebSocket Detection"])


@router.websocket("/ws/detect")
async def ws_detect(websocket: WebSocket):
    """
    WebSocket de detección continua.
    Recibe:
        { "image": "<base64>", "confidence": 0.5 }
    Devuelve en cada frame:
        DetectionResponse compatible con el frontend.
    """
    await websocket.accept()
    await websocket.send_json({
        "type": "connected",
        "message": "WebSocket de detección EPP listo"
    })

    orchestrator: Optional[OrchestrationService] = getattr(
        websocket.app.state, "orchestrator", None
    )

    if orchestrator is None:
        await websocket.send_json({
            "type": "error",
            "message": "Servicio de orquestación no inicializado"
        })
        await websocket.close(code=1011)
        return

    try:
        while True:
            raw_msg = await websocket.receive_text()

            try:
                data = json.loads(raw_msg)
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Payload inválido (no es JSON)"
                })
                continue

            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            image_b64 = data.get("image")
            confidence = float(data.get("confidence", 0.5))

            if not image_b64:
                await websocket.send_json({
                    "type": "error",
                    "message": "Campo 'image' es requerido"
                })
                continue

            try:
                if image_b64.startswith("data:image"):
                    image_b64 = image_b64.split(",", 1)[1]

                image_bytes = base64.b64decode(image_b64)

                nparr = np.frombuffer(image_bytes, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                if img is None:
                    raise ValueError("No se pudo decodificar la imagen")

                height, width = img.shape[:2]
            except Exception as e:
                logger.error(f"Error decodificando imagen WS: {e}")
                await websocket.send_json({
                    "type": "error",
                    "message": f"Imagen inválida: {e}"
                })
                continue

            await websocket.send_json({"type": "processing"})

            try:
                result = orchestrator.validate_ppe(
                    image_bytes,
                    confidence=confidence
                )
            except Exception as e:
                logger.exception("Error en validate_ppe WS: %s", e)
                await websocket.send_json({
                    "type": "error",
                    "message": "Error interno procesando imagen"
                })
                continue

            detection_results = result.get("detection_results", {})
            validation = result.get("validation", {})

            persons = detection_results.get("persons", [])
            persons_count = detection_results.get("persons_detected", 0)
            ppe_detections = detection_results.get("ppe_detections", [])

            detected_ppe = validation.get("detected_ppe", {})
            overall_compliant = validation.get("overall_compliant", False)

            def is_present(key: str) -> bool:
                return detected_ppe.get(key, 0) >= max(1, persons_count)

            ppe_status = {
                "casco":       is_present("casco"),
                "lentes":      is_present("lentes"),
                "guantes":     is_present("guantes"),
                "botas":       is_present("botas"),
                "chaleco":     is_present("chaleco"),
                "camisa":      is_present("camisa_jean"),
                "pantalon":    is_present("pantalon"),
                "barbijo":     is_present("barbijo") if "barbijo" in detected_ppe else False,
                "epp_completo": overall_compliant,
            }

            body_regions = []
            for person in persons:
                bbox = person.get("bbox", [])
                keypoints = person.get("keypoints", [])
                conf_person = person.get("confidence", 0.0)

                if len(bbox) == 4:
                    body_regions.append({
                        "name": "torso",
                        "bbox": bbox,
                        "keypoints": [
                            kp[:3] if len(kp) >= 3 else [kp[0], kp[1], 1.0]
                            for kp in keypoints
                        ],
                        "confidence": conf_person,
                    })

            payload = {
                "ppe_status": ppe_status,
                "detections": ppe_detections,
                "is_compliant": overall_compliant,
                "has_person": persons_count > 0,
                "body_regions": body_regions,
                "image_width": int(width),
                "image_height": int(height),
            }

            await websocket.send_json(payload)

    except WebSocketDisconnect:
        logger.info("WebSocket desconectado por el cliente")
    except Exception as e:
        logger.exception("Error inesperado en WebSocket: %s", e)
        try:
            await websocket.send_json({
                "type": "error",
                "message": "Error inesperado en WebSocket"
            })
        finally:
            await websocket.close(code=1011)