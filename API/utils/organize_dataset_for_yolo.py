"""
Script para Organizar Dataset Augmentado en Estructura YOLO
=============================================================
Este script toma las imágenes organizadas por carpetas de clase
y las reorganiza en la estructura requerida por YOLO para entrenamiento.

Entrada:  imagenes_epp_augmented/ (organizado por clases)
Salida:   EPP_dataset/ (estructura YOLO)
"""

import os
import shutil
from pathlib import Path
import random
from tqdm import tqdm
import json

class YOLODatasetOrganizer:
    """Organiza dataset de imágenes por clase a formato YOLO."""
    
    def __init__(self, 
                 source_dir='imagenes_epp_augmented',
                 output_dir='EPP_dataset',
                 train_ratio=0.70,
                 val_ratio=0.15,
                 test_ratio=0.15):
        """
        Inicializa el organizador.
        
        Args:
            source_dir: Directorio con imágenes organizadas por clase
            output_dir: Directorio de salida con estructura YOLO
            train_ratio: Proporción para entrenamiento (0.7 = 70%)
            val_ratio: Proporción para validación (0.15 = 15%)
            test_ratio: Proporción para prueba (0.15 = 15%)
        """
        # Cambiar base_dir a la carpeta models (un nivel arriba de utils)
        self.base_dir = Path(__file__).parent.parent / "models"
        self.source_dir = self.base_dir / source_dir
        self.output_dir = self.base_dir / output_dir
        self.train_ratio = train_ratio
        self.val_ratio = val_ratio
        self.test_ratio = test_ratio

        # Clases basadas en las carpetas reales en imagenes_epp_augmented/
        self.classes = [
            'barbijo',
            'botas',
            'camisa_jean',  # Corregido: el nombre real de la carpeta
            'casco',
            'chaleco',
            'guantes',
            'lentes',
            'pantalon'
        ]
        
        self.stats = {
            'train': 0,
            'val': 0,
            'test': 0,
            'total': 0
        }
        
        self.class_stats = {}
        
        # Mostrar rutas configuradas
        print(f"\n📁 Rutas configuradas:")
        print(f"   • Base: {self.base_dir}")
        print(f"   • Origen: {self.source_dir}")
        print(f"   • Destino: {self.output_dir}")
    
    def clean_output_directory(self):
        """Limpia el directorio de salida antes de reorganizar."""
        if self.output_dir.exists():
            print(f"\n🗑️ Limpiando directorio de salida: {self.output_dir}")
            shutil.rmtree(self.output_dir)
            print("✓ Directorio limpiado")
    
    def create_directory_structure(self):
        """Crea la estructura de directorios de YOLO."""
        print("\n⚙️ Creando estructura de directorios...")
        
        splits = ['train', 'val', 'test']
        for split in splits:
            (self.output_dir / 'images' / split).mkdir(parents=True, exist_ok=True)
            (self.output_dir / 'labels' / split).mkdir(parents=True, exist_ok=True)
        
        print(f"Estructura creada en: {self.output_dir}")
    
    def get_images_from_class(self, class_name):
        """Obtiene todas las imágenes de una clase."""
        class_dir: Path = Path(self.source_dir) / class_name
        
        if not class_dir.exists():
            print(f"⚠️ Advertencia: No existe el directorio {class_dir}")
            return []

        images = []
        # Buscar imágenes con diferentes extensiones (case-insensitive en Windows)
        for ext in ['*.jpg', '*.jpeg', '*.png', '*.bmp', '*.JPG', '*.JPEG', '*.PNG', '*.BMP']:
            images.extend(list(class_dir.glob(ext)))
        
        # Eliminar duplicados (importante en Windows donde el sistema de archivos es case-insensitive)
        # Usar resolve() para obtener la ruta absoluta y eliminar duplicados por ruta
        unique_images = list({img.resolve(): img for img in images}.values())
        
        # Verificar que las imágenes realmente existen
        unique_images = [img for img in unique_images if img.exists()]
        
        return unique_images
    
    def split_images(self, images):
        """Divide las imágenes en train/val/test."""
        random.shuffle(images)
        
        n_total = len(images)
        n_train = int(n_total * self.train_ratio)
        n_val = int(n_total * self.val_ratio)
        
        splits = {
            'train': images[:n_train],
            'val': images[n_train:n_train + n_val],
            'test': images[n_train + n_val:]
        }
        
        return splits
    
    def create_yolo_label(self, class_idx, split, image_name):
        """
        Crea un archivo de etiqueta YOLO para CLASIFICACIÓN.
        
        Para clasificación de imagen completa en YOLOv8, el formato es:
        - Solo el índice de clase (sin coordenadas de bbox)
        - Esto entrena un modelo clasificador, no detector
        
        Para detección de objetos múltiples necesitarías:
        class_id center_x center_y width height (con anotaciones manuales)
        """
        label_path = self.output_dir / 'labels' / split / f"{Path(image_name).stem}.txt"
        
        # Para clasificación: solo escribir el índice de clase
        with open(label_path, 'w') as f:
            f.write(f"{class_idx}\n")
    
    def copy_image(self, image_path, split):
        """Copia una imagen al directorio correspondiente."""
        dest_path = self.output_dir / 'images' / split / image_path.name
        shutil.copy2(image_path, dest_path)
    
    def process_class(self, class_name, class_idx):
        """Procesa todas las imágenes de una clase."""
        images = self.get_images_from_class(class_name)
        
        if not images:
            print(f"{class_name:15s}: No se encontraron imágenes")
            return

        splits = self.split_images(images)

        class_total = 0
        split_counts = {}
        
        for split_name, split_images in splits.items():
            split_counts[split_name] = len(split_images)
            
            for img_path in split_images:

                self.copy_image(img_path, split_name)

                self.create_yolo_label(class_idx, split_name, img_path.name)

                self.stats[split_name] += 1
                class_total += 1
        
        self.stats['total'] += class_total
        self.class_stats[class_name] = {
            'train': split_counts['train'],
            'val': split_counts['val'],
            'test': split_counts['test'],
            'total': class_total
        }
        
        print(f"✓ {class_name:15s}: "
              f"{split_counts['train']:4d} train + "
              f"{split_counts['val']:4d} val + "
              f"{split_counts['test']:4d} test = "
              f"{class_total:4d} total")
    
    def create_data_yaml(self):
        """Crea el archivo data.yaml para YOLO."""
        yaml_content = f"""# Configuración del dataset EPP para YOLOv8
# Generado automáticamente

# Rutas del dataset
path: {self.output_dir.absolute().as_posix()}
train: images/train
val: images/val
test: images/test

# Número de clases
nc: {len(self.classes)}

# Nombres de las clases
names:
"""
        
        for idx, class_name in enumerate(self.classes):
            yaml_content += f"  {idx}: {class_name}\n"
        
        yaml_path = self.output_dir / 'data.yaml'
        with open(yaml_path, 'w', encoding='utf-8') as f:
            f.write(yaml_content)
        
        print(f"\n✓ Archivo data.yaml creado: {yaml_path}")
    
    def save_statistics(self):
        """Guarda estadísticas del proceso."""
        stats_file = self.output_dir / 'dataset_stats.json'
        
        stats_data = {
            'splits': self.stats,
            'classes': self.class_stats,
            'config': {
                'train_ratio': self.train_ratio,
                'val_ratio': self.val_ratio,
                'test_ratio': self.test_ratio,
                'source_dir': str(self.source_dir),
                'output_dir': str(self.output_dir)
            }
        }
        
        with open(stats_file, 'w', encoding='utf-8') as f:
            json.dump(stats_data, f, indent=2, ensure_ascii=False)
        
        print(f"✓ Estadísticas guardadas: {stats_file}")
    
    def show_summary(self):
        """Muestra resumen del proceso."""

        print("RESUMEN DE ORGANIZACIÓN")
        print("="*70)
        
        print(f"\nDirectorio de salida: {self.output_dir}")
        
        print(f"\nDivisión del dataset:")
        print(f"  • Train:      {self.stats['train']:6d} imágenes ({self.train_ratio*100:.0f}%)")
        print(f"  • Validation: {self.stats['val']:6d} imágenes ({self.val_ratio*100:.0f}%)")
        print(f"  • Test:       {self.stats['test']:6d} imágenes ({self.test_ratio*100:.0f}%)")
        print(f"  • TOTAL:      {self.stats['total']:6d} imágenes")
        
        print(f"\nClases procesadas: {len(self.class_stats)}")
        
        print("\n" + "="*70)
    
    def organize(self):
        """Ejecuta el proceso completo de organización."""
        print("\n" + "🚀 " + "="*66)
        print("   ORGANIZADOR DE DATASET EPP PARA YOLO")
        print("="*68 + "\n")

        if not self.source_dir.exists():
            print(f"Error: Directorio fuente no existe: {self.source_dir}")
            return False
        
        print(f"Directorio fuente: {self.source_dir}")
        print(f"Directorio destino: {self.output_dir}")
        print(f"División: {self.train_ratio*100:.0f}% train / "
              f"{self.val_ratio*100:.0f}% val / {self.test_ratio*100:.0f}% test\n")

        # Limpiar directorio de salida para evitar imágenes antiguas
        self.clean_output_directory()
        
        self.create_directory_structure()

        print(f"\n{'─'*70}")
        print("Procesando clases...")
        print(f"{'─'*70}\n")
        
        for idx, class_name in enumerate(self.classes):
            self.process_class(class_name, idx)

        self.create_data_yaml()

        self.save_statistics()

        self.show_summary()
        
        print("\nOrganización completada exitosamente!")
        print(f"Ahora puedes entrenar con: python train_yolo.py")
        print(f"   O usa el notebook: Train_EPP_Model_Colab.ipynb\n")
        
        return True


def main():
    """Función principal."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Organiza dataset de EPP para entrenamiento con YOLO'
    )
    parser.add_argument(
        '--source',
        default='imagenes_epp_augmented',
        help='Directorio fuente con imágenes por clase'
    )
    parser.add_argument(
        '--output',
        default='EPP_dataset',
        help='Directorio de salida con estructura YOLO'
    )
    parser.add_argument(
        '--train-ratio',
        type=float,
        default=0.70,
        help='Proporción para entrenamiento (default: 0.70)'
    )
    parser.add_argument(
        '--val-ratio',
        type=float,
        default=0.15,
        help='Proporción para validación (default: 0.15)'
    )
    parser.add_argument(
        '--test-ratio',
        type=float,
        default=0.15,
        help='Proporción para prueba (default: 0.15)'
    )
    
    args = parser.parse_args()

    organizer = YOLODatasetOrganizer(
        source_dir=args.source,
        output_dir=args.output,
        train_ratio=args.train_ratio,
        val_ratio=args.val_ratio,
        test_ratio=args.test_ratio
    )

    organizer.organize()


if __name__ == "__main__":
    """
    INSTRUCCIONES DE USO:
    =====================
    
    Uso básico:
        python organize_dataset_for_yolo.py
    
    Uso avanzado:
        python organize_dataset_for_yolo.py \
            --source imagenes_epp_augmented \
            --output EPP_dataset \
            --train-ratio 0.70 \
            --val-ratio 0.15 \
            --test-ratio 0.15
    
    Después de ejecutar:
        1. Verifica que EPP_dataset/ tenga la estructura correcta
        2. Revisa data.yaml generado
        3. Usa el dataset para entrenar YOLO
    """
    main()
