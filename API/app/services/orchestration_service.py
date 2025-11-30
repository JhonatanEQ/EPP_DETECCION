"""
Servicio orquestador para detección combinada de pose y EPP
Integra YOLOv8-Pose (local) con microservicio Node.js (Roboflow)
"""

import cv2
import numpy as np
import base64
import requests
from typing import Dict, Any, List, Tuple, Optional
from ultralytics import YOLO
import logging
import os

logger = logging.getLogger(__name__)

class OrchestrationService:
    """Servicio que coordina la detección de pose y EPP"""

    def __init__(
        self,
        pose_model_path: Optional[str] = None,
        ppe_service_url: Optional[str] = None
    ):
        """
        Inicializa el servicio orquestador

        Args:
            pose_model_path: Ruta al modelo YOLOv8-Pose
            ppe_service_url: URL del microservicio de detección EPP
        """
        self.pose_model_path = pose_model_path or os.getenv(
            "POSE_MODEL_PATH",
            "models/yolov8n-pose.pt"
        )

        self.ppe_service_url = ppe_service_url or os.getenv(
            "PPE_SERVICE_URL",
            "http://localhost:3002"    
        )
        self.pose_model = None
        self._load_pose_model()

    def _load_pose_model(self):
        """Carga el modelo de detección de pose"""
        try:
            self.pose_model = YOLO(self.pose_model_path)
            logger.info(f"✅ Modelo de pose cargado desde {self.pose_model_path}")
        except Exception as e:
            logger.error(f"❌ Error cargando modelo de pose: {e}")
            raise

    def health_check(self) -> Dict[str, Any]:
        """
        Verifica el estado de salud del servicio orquestador

        Returns:
            Dict con estado de los servicios
        """
        health_status = {
            "pose_detection": "ok",
            "ppe_microservice": "unknown",
            "timestamp": "2024-01-20T10:30:00.000Z"
        }

        try:
            response = requests.get(f"{self.ppe_service_url}/health", timeout=5)
            if response.status_code == 200:
                health_status["ppe_microservice"] = "ok"
            else:
                health_status["ppe_microservice"] = f"error_{response.status_code}"
        except requests.exceptions.RequestException as e:
            logger.warning(f"Microservicio EPP no disponible: {e}")
            health_status["ppe_microservice"] = "unavailable"

        return health_status

    def check_ppe_service_health(self) -> bool:
        """
        Verifica si el microservicio EPP está disponible

        Returns:
            True si el servicio está disponible, False en caso contrario
        """
        try:
            response = requests.get(f"{self.ppe_service_url}/health", timeout=5)
            return response.status_code == 200
        except requests.exceptions.RequestException:
            return False

    def detect_combined(self, image_data: bytes, confidence: float = 0.5) -> Dict[str, Any]:
        """
        Detecta pose y EPP de forma combinada

        Args:
            image_data: Datos de la imagen en bytes
            confidence: Umbral de confianza para detección

        Returns:
            Dict con resultados combinados
        """
        try:
            pose_results = self._detect_poses(image_data, confidence)

            persons = []
            for result in pose_results:
                for box in result.boxes:
                    person = {
                        "bbox": box.xyxy[0].tolist(),
                        "confidence": float(box.conf[0]),
                        "keypoints": result.keypoints[0].xy[0].tolist() if result.keypoints else []
                    }
                    persons.append(person)

            ppe_results = self._detect_ppe(image_data, confidence)

            combined_results = {
                "persons_detected": len(persons),
                "persons": persons,
                "ppe_detections": ppe_results.get("detections", []),
                "ppe_summary": ppe_results.get("summary", {}),
                "timestamp": "2024-01-20T10:30:00.000Z"
            }

            logger.info(f"Detección combinada exitosa: {len(persons)} personas, {len(ppe_results.get('detections', []))} EPP")
            return combined_results

        except Exception as e:
            logger.error(f"Error en detección combinada: {e}")
            raise

    def _detect_poses(self, image_data: bytes, confidence: float) -> List:
        """
        Detecta poses en la imagen usando YOLOv8-Pose

        Args:
            image_data: Datos de la imagen
            confidence: Umbral de confianza

        Returns:
            Resultados de YOLOv8-Pose
        """
        try:

            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if self.pose_model is None:
                logger.error("El modelo de pose no está cargado.")
                raise RuntimeError("El modelo de pose no está cargado correctamente.")

            results = self.pose_model(img, conf=confidence)

            logger.info(f"Detección de pose completada: {len(results)} resultados")
            return results

        except Exception as e:
            logger.error(f"Error en detección de pose: {e}")
            raise

    def _detect_ppe(self, image_data: bytes, confidence: float) -> Dict[str, Any]:
        """
        Detecta EPP usando el microservicio Node.js

        Args:
            image_data: Datos de la imagen
            confidence: Umbral de confianza

        Returns:
            Resultados del microservicio EPP
        """
        try:

            image_b64 = base64.b64encode(image_data).decode('utf-8')

            payload = {
                "image": image_b64,
                "confidence": confidence
            }

            response = requests.post(
                f"{self.ppe_service_url}/detect",
                json=payload,
                timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                logger.info(f"Detección EPP completada: {len(result.get('detections', []))} elementos")
                return result
            else:
                logger.error(f"Error en microservicio EPP: {response.status_code} - {response.text}")
                return {"detections": [], "summary": {}, "error": f"HTTP {response.status_code}"}

        except requests.exceptions.Timeout:
            logger.error("⏱Timeout en microservicio EPP")
            return {"detections": [], "summary": {}, "error": "timeout"}
        except requests.exceptions.RequestException as e:
            logger.error(f"Error conectando con microservicio EPP: {e}")
            return {"detections": [], "summary": {}, "error": str(e)}
        except Exception as e:
            logger.error(f"Error inesperado en detección EPP: {e}")
            return {"detections": [], "summary": {}, "error": str(e)}

    def validate_ppe(self, image_data: bytes, confidence: float = 0.5) -> Dict[str, Any]:
        """
        Valida cumplimiento de EPP según normas

        Args:
            image_data: Datos de la imagen
            confidence: Umbral de confianza

        Returns:
            Dict con validación de cumplimiento
        """
        try:
            results = self.detect_combined(image_data, confidence)

            validation = self._validate_compliance(results)

            return {
                "detection_results": results,
                "validation": validation,
                "timestamp": "2024-01-20T10:30:00.000Z"
            }

        except Exception as e:
            logger.error(f"Error en validación EPP: {e}")
            raise

    def _validate_compliance(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Valida si las detecciones cumplen con las normas de EPP

        Args:
            results: Resultados de detección combinada

        Returns:
            Dict con resultado de validación
        """
        required_ppe = {
            "casco": ["helmet", "cascos", "casco"],
            "lentes": ["glasses"],
            "guantes": ["gloves"],
            "botas": ["boots"],
            "chaleco": ["vest", "chalecos", "safety_vest"],
            "camisa_jean": ["shirt", "denim_shirt"],
            "pantalon": ["pants", "jeans", "denim_pants"],
            "barbijo": ["mask", "face_mask", "barbijo"]
        }



        persons_count = results.get("persons_detected", 0)
        ppe_detections = results.get("ppe_detections", [])

        detected_ppe = {}
        for detection in ppe_detections:
            class_name = detection.get("class", "").lower()

            if class_name in ["helmet", "cascos", "casco"]:
                detected_ppe["casco"] = detected_ppe.get("casco", 0) + 1
            elif class_name in ["glasses", "safety_glasses"]:
                detected_ppe["lentes"] = detected_ppe.get("lentes", 0) + 1
            elif class_name in ["gloves"]:
                detected_ppe["guantes"] = detected_ppe.get("guantes", 0) + 1
            elif class_name in ["boots", "safety_boots"]:
                detected_ppe["botas"] = detected_ppe.get("botas", 0) + 1
            elif class_name in ["vest", "chalecos", "safety_vest"]:
                detected_ppe["chaleco"] = detected_ppe.get("chaleco", 0) + 1
            elif class_name in ["shirt", "denim_shirt"]:
                detected_ppe["camisa_jean"] = detected_ppe.get("camisa_jean", 0) + 1
            elif class_name in ["pants", "jeans", "denim_pants"]:
                detected_ppe["pantalon"] = detected_ppe.get("pantalon", 0) + 1
            elif class_name in ["mask", "face_mask", "barbijo"]:
                detected_ppe["barbijo"] = detected_ppe.get("barbijo", 0) + 1



        compliance = {}
        overall_compliant = True

        for ppe_type, count in detected_ppe.items():
            is_compliant = count >= persons_count
            compliance[ppe_type] = {
                "detected": count,
                "required": persons_count,
                "compliant": is_compliant
            }
            if not is_compliant:
                overall_compliant = False

        missing_ppe = []
        for ppe_type in required_ppe.keys():
            if ppe_type not in detected_ppe or detected_ppe[ppe_type] < persons_count:
                missing_ppe.append(ppe_type)

        overall_compliant = len(missing_ppe) == 0

        return {
            "persons_count": persons_count,
            "detected_ppe": detected_ppe,
            "compliance": compliance,
            "overall_compliant": overall_compliant,
            "missing_ppe": missing_ppe,
            "status": "COMPLIANT" if overall_compliant else "NON_COMPLIANT"
        }

    def detect_pose(self, image: np.ndarray, confidence: float = 0.5) -> Dict[str, Any]:
        """
        Detecta solo pose en una imagen OpenCV

        Args:
            image: Imagen OpenCV (numpy array)
            confidence: Umbral de confianza

        Returns:
            Dict con resultados de detección de pose
        """
        try:
            _, buffer = cv2.imencode('.jpg', image)
            image_bytes = buffer.tobytes()

            pose_results = self._detect_poses(image_bytes, confidence)

            persons = []
            for result in pose_results:
                for box in result.boxes:
                    person = {
                        "bbox": box.xyxy[0].tolist(),
                        "confidence": float(box.conf[0]),
                        "keypoints": result.keypoints[0].xy[0].tolist() if result.keypoints else []
                    }
                    persons.append(person)

            return {
                "persons_detected": len(persons),
                "persons": persons,
                "timestamp": "2024-01-20T10:30:00.000Z"
            }

        except Exception as e:
            logger.error(f"Error en detección de pose: {e}")
            raise

    def detect_ppe(self, image: np.ndarray, confidence: float = 0.5) -> Dict[str, Any]:
        """
        Detecta solo EPP en una imagen OpenCV

        Args:
            image: Imagen OpenCV (numpy array)
            confidence: Umbral de confianza

        Returns:
            Dict con resultados de detección EPP
        """
        try:
            _, buffer = cv2.imencode('.jpg', image)
            image_bytes = buffer.tobytes()

            return self._detect_ppe(image_bytes, confidence)

        except Exception as e:
            logger.error(f"Error en detección EPP: {e}")
            raise

    def process_complete_detection(self, image: np.ndarray, confidence: float = 0.5) -> Dict[str, Any]:
        """
        Procesa detección completa (pose + EPP) en una imagen OpenCV

        Args:
            image: Imagen OpenCV (numpy array)
            confidence: Umbral de confianza

        Returns:
            Dict con resultados combinados
        """
        try:

            _, buffer = cv2.imencode('.jpg', image)
            image_bytes = buffer.tobytes()

            return self.detect_combined(image_bytes, confidence)

        except Exception as e:
            logger.error(f"Error en detección completa: {e}")
            raise

    def draw_detections(self, image: np.ndarray, pose_detections: List[Dict], ppe_detections: List[Dict]) -> np.ndarray:
        """
        Dibuja las detecciones en la imagen

        Args:
            image: Imagen OpenCV original
            pose_detections: Lista de detecciones de pose
            ppe_detections: Lista de detecciones EPP

        Returns:
            Imagen con detecciones dibujadas
        """
        try:
            result_image = image.copy()

            for person in pose_detections:
                bbox = person.get("bbox", [])
                if len(bbox) == 4:
                    x1, y1, x2, y2 = map(int, bbox)
                    cv2.rectangle(result_image, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    cv2.putText(result_image, "Persona", (x1, y1 - 10),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

                keypoints = person.get("keypoints", [])
                if keypoints:
                    for i, keypoint in enumerate(keypoints):
                        if len(keypoint) >= 2:
                            x, y = map(int, keypoint[:2])
                            cv2.circle(result_image, (x, y), 3, (255, 0, 0), -1)

            for detection in ppe_detections:
                bbox = detection.get("bbox", [])
                class_name = detection.get("class", "")
                confidence = detection.get("confidence", 0)

                if len(bbox) == 4:
                    x1, y1, x2, y2 = map(int, bbox)
                    cv2.rectangle(result_image, (x1, y1), (x2, y2), (255, 0, 0), 2)

                    text = f"{class_name}: {confidence:.2f}"
                    cv2.putText(result_image, text, (x1, y1 - 10),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)

            return result_image

        except Exception as e:
            logger.error(f" Error dibujando detecciones: {e}")
            return image