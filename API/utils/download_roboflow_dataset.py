"""
Script para descargar el dataset de Roboflow en formato YOLOv8
"""

from roboflow import Roboflow
from pathlib import Path
import os
from dotenv import load_dotenv

def download_dataset():
    """Descarga el dataset de Roboflow en formato YOLOv8"""
    
    print("\n" + "="*80)
    print("📥 DESCARGA DE DATASET DE ROBOFLOW")
    print("="*80 + "\n")
    
    # Cargar API key desde .env
    env_path = Path(__file__).parent.parent / ".env"
    load_dotenv(env_path)
    API_KEY = os.getenv("API_KEY_ROBOFLOW")
    
    if not API_KEY:
        print(f"❌ ERROR: No se encontró API_KEY_ROBOFLOW en {env_path}")
        return False
    
    try:
        # Inicializar Roboflow
        print("📡 Conectando con Roboflow...\n")
        rf = Roboflow(api_key=API_KEY)
        
        # Listar proyectos disponibles
        workspace = rf.workspace()
        project_names = workspace.projects()
        
        print("📋 Proyectos disponibles:")
        for i, proj in enumerate(project_names, 1):
            clean_name = proj.split('/')[-1] if '/' in proj else proj
            print(f"   {i}. {clean_name}")
        
        if not project_names:
            print("\n❌ No se encontraron proyectos en tu workspace")
            return False
        
        # Buscar un proyecto con versiones disponibles
        project = None
        project_name = None
        versions = None
        
        print("\n🔍 Buscando proyecto con versiones descargables...\n")
        
        for project_full in project_names:
            temp_name = project_full.split('/')[-1] if '/' in project_full else project_full
            print(f"   Verificando: {temp_name}")
            
            try:
                temp_project = workspace.project(temp_name)
                temp_versions = temp_project.versions()
                
                if temp_versions:
                    project = temp_project
                    project_name = temp_name
                    versions = temp_versions
                    print(f"   ✅ Encontrado con {len(versions)} versión(es)\n")
                    break
                else:
                    print(f"   ⚠️  Sin versiones\n")
            except Exception as e:
                print(f"   ❌ Error: {e}\n")
        
        if not project or not versions:
            print("❌ No se encontró ningún proyecto con versiones descargables")
            print("\n💡 Esto puede significar que:")
            print("   • Los proyectos no tienen modelos entrenados")
            print("   • Los proyectos usan Workflows (no exportables)")
            print("   • Se requiere plan de pago para exportar")
            return False
        
        print(f"📋 Versiones disponibles: {[v['id'] for v in versions]}")
        
        # Usar la primera versión
        version_id = versions[0]['id']
        print(f"📦 Descargando versión: {version_id}\n")
        
        version = project.version(version_id)
        
        # Descargar en formato YOLOv8
        print("⬇️  Descargando dataset en formato YOLOv8...")
        print("   (Esto puede tardar varios minutos dependiendo del tamaño)\n")
        
        # Descargar a la carpeta models/roboflow_dataset/
        download_path = Path("models/roboflow_dataset")
        
        dataset = version.download(
            model_format="yolov8",  # Formato YOLOv8
            location=str(download_path)
        )
        
        print("\n" + "="*80)
        print("✅ DATASET DESCARGADO EXITOSAMENTE")
        print("="*80 + "\n")
        
        print(f"📁 Ubicación: {download_path.absolute()}")
        print(f"📄 Archivo de configuración: {download_path}/data.yaml")
        
        # Verificar estructura
        if (download_path / "data.yaml").exists():
            print("\n📋 Estructura del dataset:")
            print(f"   ✅ data.yaml encontrado")
            
            # Contar imágenes
            train_imgs = list((download_path / "train" / "images").glob("*")) if (download_path / "train" / "images").exists() else []
            val_imgs = list((download_path / "valid" / "images").glob("*")) if (download_path / "valid" / "images").exists() else []
            test_imgs = list((download_path / "test" / "images").glob("*")) if (download_path / "test" / "images").exists() else []
            
            print(f"   📸 Train: {len(train_imgs)} imágenes")
            print(f"   📸 Valid: {len(val_imgs)} imágenes")
            print(f"   📸 Test: {len(test_imgs)} imágenes")
            
            print(f"\n   Total: {len(train_imgs) + len(val_imgs) + len(test_imgs)} imágenes anotadas")
        
        print("\n" + "="*80)
        print("🎯 SIGUIENTE PASO: ENTRENAR EL MODELO")
        print("="*80 + "\n")
        print("Ejecuta:")
        print(f"   python utils/train_epp_model.py")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print("\n💡 Posibles causas:")
        print("   1. API Key incorrecta")
        print("   2. Proyecto sin dataset exportable")
        print("   3. Sin conexión a internet")
        print("   4. Proyecto requiere plan de pago para exportar")
        return False


if __name__ == "__main__":
    """
    INSTRUCCIONES:
    ==============
    
    Este script descarga el dataset de Roboflow en formato YOLOv8.
    
    Requisitos:
    - API_KEY_ROBOFLOW configurado en .env
    - Proyecto en Roboflow con dataset anotado
    
    Ejecutar:
    1. Activar venv: .\venv\Scripts\Activate.ps1
    2. Ejecutar: python utils/download_roboflow_dataset.py
    """
    download_dataset()
