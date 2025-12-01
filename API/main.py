
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.controllers.orchestration_controller import (
    router as orchestration_router,
    init_orchestration,
)
from app.controllers.ws_detection_controller import router as ws_router
from app.services.orchestration_service import OrchestrationService

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="API para detección de Equipos de Protección Personal usando YOLO v8",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║     🚀 EPP DETECTION API - ARQUITECTURA MICROSERVICIOS        ║")
    print("╠════════════════════════════════════════════════════════════════╣")
    print(f"║  Modelo EPP:  {settings.model_path[:46]:<46} ║")
    print(f"║  Modelo Pose: {settings.pose_model_abs_path[:46]:<46} ║")
    print(f"║  PPE Service: {settings.ppe_service_url[:46]:<46} ║")
    print("╚════════════════════════════════════════════════════════════════╝")

    try:
        orchestrator = OrchestrationService(
            pose_model_path=settings.pose_model_abs_path,
            ppe_service_url=settings.ppe_service_url,
        )

        init_orchestration(orchestrator)
        print("✅ Servicio de orquestación inicializado (REST API v2)")

        app.state.orchestrator = orchestrator
        print("✅ Servicio de orquestación inicializado (WebSocket)")

    except Exception as e:
        print(f"Error al inicializar servicios: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    print("Cerrando EPP Detection API...")


app.include_router(orchestration_router)
app.include_router(ws_router)


@app.get("/")
async def root():
    return {
        "message": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "endpoints": {
            "POST /api/v2/detect/complete": "Detección completa pose + EPP",
            "WebSocket /api/ws/detect": "Detección en tiempo real",
            "GET /api/v2/health": "Estado del servicio"
        }
    }

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        timeout_keep_alive=settings.uvicorn_timeout_keep_alive,
        timeout_graceful_shutdown=30,
        ws_ping_interval=settings.ws_heartbeat_interval,
        ws_ping_timeout=20,
        ws_max_size=int(settings.max_image_size_mb * 1024 * 1024 * 10),
        limit_concurrency=settings.uvicorn_limit_concurrency,
        limit_max_requests=settings.uvicorn_limit_max_requests,
        backlog=settings.uvicorn_backlog,
        workers=1 if settings.debug else 1,
        log_level="info",
    )
