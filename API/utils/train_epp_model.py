"""
Script para entrenar el modelo EPP con 8 clases individuales
(epp_completo se calcula programáticamente en el backend)
Ejecutar: python train_epp_model.py
"""

from ultralytics import YOLO
import torch
from pathlib import Path

def verificar_gpu():
    """Verificar si hay GPU disponible"""
    if torch.cuda.is_available():
        print(f"GPU disponible: {torch.cuda.get_device_name(0)}")
        print(f"Memoria: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
        return True
    else:
        print("No se detectó GPU NVIDIA")
        print("RECOMENDACIÓN: Usa Google Colab con GPU gratis")
        respuesta = input("\n¿Continuar de todas formas? (s/n): ")
        return respuesta.lower() == 's'

def entrenar_modelo():
    """Entrenar modelo YOLO para detección de EPP con 8 clases individuales"""
    
    if not verificar_gpu():
        return

    data_yaml = "EPP_dataset/data.yaml"
    
    if not Path(data_yaml).exists():
        return

    config = {
        'data': data_yaml,
        'epochs': 100,
        'imgsz': 640,
        'batch': 16,
        'device': 0,
        'workers': 8,
        'patience': 20,
        'save': True,
        'plots': True,
        'val': True,
    }
    
    print("Configuración de entrenamiento:")
    for key, value in config.items():
        print(f"   • {key}: {value}")
    
    input("\nPresiona ENTER para iniciar el entrenamiento...")

    print("\nCargando modelo base YOLOv8n...")
    model = YOLO('yolov8n.pt')

    print("\nIniciando entrenamiento...")
    
    try:
        results = model.train(**config)

        print("ENTRENAMIENTO COMPLETADO!")
        
    except Exception as e:
        print(f"\nError durante el entrenamiento: {e}")

if __name__ == "__main__":
    entrenar_modelo()
