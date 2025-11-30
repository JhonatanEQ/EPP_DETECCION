"""
Modelos de datos para EPP Detection
"""
from .ppe_models import (
    PPEType,
    PPEStatus,
    Detection,
    ImageRequest,
    DetectionResponse,
    ErrorResponse,
    HealthResponse
)

__all__ = [
    "PPEType",
    "PPEStatus",
    "Detection",
    "ImageRequest",
    "DetectionResponse",
    "ErrorResponse",
    "HealthResponse"
]
