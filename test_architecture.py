"""
Script de prueba rápida para la arquitectura de microservicios
Prueba el flujo completo: FastAPI → Microservicio Node.js → Roboflow
"""

import requests
import base64
import json
from pathlib import Path

BACKEND_URL = "http://localhost:8000"
IMAGE_PATH = "API/models/prueba/IMG-20251125-WA0067.jpg"

def encode_image(image_path: str) -> str:
    """Convierte imagen a base64"""
    with open(image_path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

def test_health_check():
    """Prueba 1: Verifica que todos los servicios estén disponibles"""
    print("Prueba 1: Health Check")
    print("=" * 70)
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/v2/health", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print(f"Estado: {data['status']}")
            print(f"   Pose Detection: {data['services']['pose_detection']['status']}")
            print(f"   PPE Detection:  {data['services']['ppe_detection']['status']}")
            print(f"   Mensaje: {data['message']}")
            return True
        else:
            print(f"Error: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_complete_detection():
    """Prueba 2: Detección completa (Pose + EPP)"""
    print("\n🔍 Prueba 2: Detección Completa")
    print("=" * 70)
    
    try:
        print(f"📸 Cargando imagen: {IMAGE_PATH}")
        image_base64 = encode_image(IMAGE_PATH)

        print("⏳ Enviando solicitud...")
        response = requests.post(
            f"{BACKEND_URL}/api/v2/detect/complete",
            json={"image": image_base64},
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            
            print("\nRESULTADOS:")
            print("-" * 70)

            pose = data['pose_detection']
            print(f"👤 Personas detectadas: {pose['total_persons']}")

            ppe = data['ppe_detection']
            print(f"Elementos EPP detectados: {ppe['totalDetections']}")
            
            print("\nDetecciones por clase:")
            for cls, info in ppe['detectionsByClass'].items():
                print(f"   - {cls}: {info['count']} ({info['avgConfidence']*100:.1f}% confianza)")
            
            # Validación
            validation = ppe['validation']
            print(f"\nEPP Completo: {'Sí' if validation['isComplete'] else 'No'}")
            print(f"Tasa de completitud: {validation['completionRate']}%")
            
            if validation['missing']:
                print(f"Elementos faltantes: {', '.join(validation['missing'])}")
            
            # Resumen
            print("\n" + "=" * 70)
            print(f"RESUMEN:")
            print(f"  Personas: {data['summary']['total_persons']}")
            print(f"  Items EPP: {data['summary']['total_ppe_items']}")
            print(f"  Completitud: {data['summary']['completion_rate']}%")
            
            return True
        else:
            print(f"Error: HTTP {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_ppe_validation():
    """Prueba 3: Validación de EPP"""
    print("\nPrueba 3: Validación de EPP")
    print("=" * 70)
    
    try:
        image_base64 = encode_image(IMAGE_PATH)
        
        print("Validando EPP...")
        response = requests.post(
            f"{BACKEND_URL}/api/v2/validate/ppe",
            json={"image": image_base64},
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            validation = data['validation']
            
            print(f"\n{validation['message']}")
            print(f"Seguro: {'Sí' if validation['safe'] else 'No'}")
            print(f"Completitud: {validation['completionRate']}%")
            
            if validation['detected']:
                print(f"\nDetectado: {', '.join(validation['detected'])}")
            
            if validation['missing']:
                print(f"Faltante: {', '.join(validation['missing'])}")
            
            return True
        else:
            print(f"Error: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    """Ejecuta todas las pruebas"""

    if not Path(IMAGE_PATH).exists():
        print(f"Error: No se encontró la imagen {IMAGE_PATH}")
        return
    
    results = []
    
    results.append(("Health Check", test_health_check()))
    results.append(("Detección Completa", test_complete_detection()))
    results.append(("Validación EPP", test_ppe_validation()))

    print("\n" + "╔" + "═" * 68 + "╗")
    print("║" + " " * 25 + "RESUMEN FINAL" + " " * 27 + "║")
    print("╠" + "═" * 68 + "╣")
    
    for name, success in results:
        status = "EXITOSA" if success else " ALLIDA"
        print(f"║  {name:<40} {status:>26} ║")
    
    print("╚" + "═" * 68 + "╝\n")
    
    total_success = sum(1 for _, s in results if s)
    print(f"Resultado: {total_success}/{len(results)} pruebas exitosas")
    
    if total_success == len(results):
        print("¡Todos los servicios funcionan correctamente!")
    else:
        print("Algunos servicios presentan problemas. Verifica los logs.")

if __name__ == "__main__":
    main()
