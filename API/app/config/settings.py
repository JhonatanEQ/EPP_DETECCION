from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional, List
from pathlib import Path
import os


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        protected_namespaces=(),
        extra="ignore",
    )

    app_name: str = "EPP Detection API"
    app_version: str = "1.0.0"
    debug: bool = False

    host: str = "0.0.0.0"
    port: int = 8000

    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    confidence_threshold: float = 0.5

    ppe_service_url: str = "http://localhost:3001"

    pose_model_path: str = "models/yolov8n-pose.pt"

    ws_heartbeat_interval: int = 15
    ws_inactive_timeout: int = 120
    ws_max_connections: int = 50

    max_image_size_mb: float = 2.0
    max_workers: int = 4
    max_queue_size: int = 100

    uvicorn_timeout_keep_alive: int = 600
    uvicorn_limit_concurrency: int = 50
    uvicorn_limit_max_requests: int = 10000
    uvicorn_backlog: int = 2048

    @property
    def model_path(self) -> str:
        """Ruta absoluta al modelo EPP (ppe_best.pt)"""
        base_dir = Path(__file__).parent.parent.parent
        return str(base_dir / "models" / "ppe_best.pt")

    @property
    def pose_model_abs_path(self) -> str:
        """Ruta absoluta al modelo de pose (yolov8n-pose.pt)"""
        base_dir = Path(__file__).parent.parent.parent
        return str(base_dir / self.pose_model_path)


settings = Settings()
