"""
Script de Generación de Dataset Sintético Ampliado de EPP
=========================================================
Este script genera un dataset ampliado mediante técnicas de data augmentation
para imágenes de Equipos de Protección Personal (EPP).

Autor: Sistema de Augmentation EPP
Fecha: 2025
"""

import os
import cv2
import numpy as np
from pathlib import Path
from tqdm import tqdm
import random
import albumentations as A
from PIL import Image
import shutil
from typing import List, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

class EPPDatasetAugmentor:
    """
    Clase para augmentar el dataset de EPP con técnicas avanzadas de procesamiento de imágenes.
    """
    
    def __init__(self, 
                 source_dir: str = "imagenes epp",
                 output_dir: str = "imagenes_epp_augmented",
                 target_images_per_class: int = 1000):
        """
        Inicializa el augmentador de dataset.
        
        Args:
            source_dir: Directorio fuente con las imágenes originales
            output_dir: Directorio destino para las imágenes augmentadas
            target_images_per_class: Número objetivo de imágenes por clase
        """
        # Cambiar base_dir a la carpeta models (un nivel arriba de utils)
        self.base_dir = Path(__file__).parent.parent / "models"
        self.source_dir = self.base_dir / source_dir
        self.output_dir = self.base_dir / output_dir
        self.target_images_per_class = target_images_per_class
        
        print(f"📁 Rutas configuradas:")
        print(f"   • Origen: {self.source_dir}")
        print(f"   • Destino: {self.output_dir}")
        print(f"\n⚙️ Configuración:")
        print(f"   • Imágenes por clase: {target_images_per_class}")
        print(f"   • Total esperado: {target_images_per_class * 8} imágenes (8 clases)")
        
        # Clases basadas en las carpetas existentes en models/imagenes epp/
        self.classes = [
            'barbijo',
            'botas',
            'camisa_jean',  # Cambiado de 'camisa' a 'camisa_jean' (nombre real de la carpeta)
            'casco',
            'chaleco',
            'guantes',
            'lentes',
            'pantalon'
        ]
        
        self.person_augmentation = A.Compose([

            A.OneOf([
                A.Rotate(limit=15, p=1.0),  
                A.ShiftScaleRotate(shift_limit=0.05, scale_limit=0.1, rotate_limit=10, p=1.0),
                A.Affine(scale=(0.9, 1.1), translate_percent=0.05, p=1.0),  
            ], p=0.7),
            
            A.HorizontalFlip(p=0.5),
            
            A.OneOf([
                A.RandomBrightnessContrast(brightness_limit=0.3, contrast_limit=0.3, p=1.0),
                A.HueSaturationValue(hue_shift_limit=20, sat_shift_limit=30, val_shift_limit=20, p=1.0),
                A.RGBShift(r_shift_limit=25, g_shift_limit=25, b_shift_limit=25, p=1.0),
            ], p=0.8),
            
            A.OneOf([
                A.RandomShadow(shadow_roi=(0, 0.5, 1, 1), num_shadows_limit=(1, 2), p=1.0),
                A.RandomBrightnessContrast(brightness_limit=0.2, contrast_limit=0, p=1.0),
            ], p=0.3),
            
            A.OneOf([
                A.GaussNoise(var_limit=(10.0, 50.0), p=1.0),
                A.ISONoise(color_shift=(0.01, 0.05), intensity=(0.1, 0.5), p=1.0),
                A.GaussianBlur(blur_limit=(3, 5), p=1.0),
            ], p=0.3),
            
            A.ImageCompression(quality_lower=85, quality_upper=100, p=0.3),
        ])

        self.object_augmentation = A.Compose([

            A.OneOf([
                A.Rotate(limit=30, p=1.0),
                A.ShiftScaleRotate(shift_limit=0.1, scale_limit=0.2, rotate_limit=20, p=1.0),
                A.Affine(scale=(0.8, 1.2), translate_percent=0.1, p=1.0),
            ], p=0.8),

            A.HorizontalFlip(p=0.5),
            A.VerticalFlip(p=0.2),

            A.OneOf([
                A.RandomBrightnessContrast(brightness_limit=0.3, contrast_limit=0.3, p=1.0),
                A.HueSaturationValue(hue_shift_limit=20, sat_shift_limit=30, val_shift_limit=20, p=1.0),
                A.RGBShift(r_shift_limit=25, g_shift_limit=25, b_shift_limit=25, p=1.0),
            ], p=0.8),
            
            A.OneOf([
                A.RandomShadow(shadow_roi=(0, 0.5, 1, 1), num_shadows_limit=(1, 2), p=1.0),
                A.RandomBrightnessContrast(brightness_limit=0.2, contrast_limit=0, p=1.0),
            ], p=0.3),
            
            A.OneOf([
                A.GaussNoise(var_limit=(10.0, 50.0), p=1.0),
                A.ISONoise(color_shift=(0.01, 0.05), intensity=(0.1, 0.5), p=1.0),
                A.GaussianBlur(blur_limit=(3, 5), p=1.0),
            ], p=0.3),
            
            A.ImageCompression(quality_lower=85, quality_upper=100, p=0.3),
        ])
        

        self.soft_augmentation = A.Compose([
            A.Rotate(limit=8, p=0.4),
            A.HorizontalFlip(p=0.5),
            A.ShiftScaleRotate(shift_limit=0.03, scale_limit=0.05, rotate_limit=5, p=0.3),
            A.RandomBrightnessContrast(brightness_limit=0.2, contrast_limit=0.2, p=0.5),
            A.HueSaturationValue(hue_shift_limit=10, sat_shift_limit=15, val_shift_limit=10, p=0.5),
        ])
    
    def validate_directories(self) -> bool:
        """
        Valida que los directorios necesarios existan.
        
        Returns:
            bool: True si la validación es exitosa
        """
        if not self.source_dir.exists():
            print(f"Error: El directorio fuente no existe: {self.source_dir}")
            return False

        missing_classes = []
        for class_name in self.classes:
            class_dir = self.source_dir / class_name
            if not class_dir.exists():
                missing_classes.append(class_name)
        
        if missing_classes:
            print(f"Advertencia: No se encontraron las siguientes clases: {missing_classes}")
            self.classes = [c for c in self.classes if c not in missing_classes]

        self.output_dir.mkdir(parents=True, exist_ok=True)
        print(f"Directorio de salida creado/verificado: {self.output_dir}")
        
        return True
    
    def get_image_files(self, class_dir: Path) -> List[Path]:
        """
        Obtiene todos los archivos de imagen válidos de un directorio.
        
        Args:
            class_dir: Directorio de la clase
            
        Returns:
            Lista de rutas de archivos de imagen
        """
        valid_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}
        image_files = []
        
        for ext in valid_extensions:
            image_files.extend(class_dir.glob(f"*{ext}"))
            image_files.extend(class_dir.glob(f"*{ext.upper()}"))
        
        return sorted(image_files)
    
    def load_image(self, image_path: Path) -> Optional[np.ndarray]:
        """
        Carga una imagen de forma segura.
        
        Args:
            image_path: Ruta de la imagen
            
        Returns:
            Imagen en formato numpy array (RGB), o None si hay error
        """
        try:

            img = cv2.imread(str(image_path))
            if img is None:

                img = np.array(Image.open(image_path).convert('RGB'))
            else:

                img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            return img
        except Exception as e:
            print(f"Error al cargar {image_path.name}: {e}")
            return None
    
    def save_image(self, image: np.ndarray, output_path: Path, quality: int = 60):
        """
        Guarda una imagen con calidad especificada.
        
        Args:
            image: Imagen en formato numpy array (RGB)
            output_path: Ruta de destino
            quality: Calidad JPEG (1-100)
        """
        try:

            img_bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
            cv2.imwrite(str(output_path), img_bgr, [cv2.IMWRITE_JPEG_QUALITY, quality])
        except Exception as e:
            print(f"Error al guardar {output_path.name}: {e}")
    
    def augment_image(self, image: np.ndarray, class_name: str, use_soft: bool = False) -> np.ndarray:
        """
        Aplica augmentation a una imagen según la clase.
        
        Args:
            image: Imagen original
            class_name: Nombre de la clase (para elegir pipeline apropiado)
            use_soft: Si True, usa augmentation suave
            
        Returns:
            Imagen augmentada
        """
        try:

            person_classes = ['botas', 'epp completo', 'pantalon']
            
            if use_soft:
                pipeline = self.soft_augmentation
            elif class_name in person_classes:
                pipeline = self.person_augmentation
            else:
                pipeline = self.object_augmentation
            
            augmented = pipeline(image=image)
            return augmented['image']
        except Exception as e:
            print(f"Error en augmentation: {e}")
            return image
    
    def process_class(self, class_name: str) -> Tuple[int, int]:
        """
        Procesa todas las imágenes de una clase específica.
        
        Args:
            class_name: Nombre de la clase a procesar
            
        Returns:
            Tupla (imágenes_originales, imágenes_generadas)
        """

        source_class_dir = self.source_dir / class_name
        output_class_dir = self.output_dir / class_name

        if output_class_dir.exists():
            shutil.rmtree(output_class_dir)
        
        output_class_dir.mkdir(parents=True, exist_ok=True)

        original_images = self.get_image_files(source_class_dir)
        num_original = len(original_images)
        
        if num_original == 0:
            print(f"No se encontraron imágenes en {class_name}")
            return 0, 0

        print(f"\nCopiando {num_original} imágenes originales de '{class_name}'...")
        for img_path in original_images:
            shutil.copy2(img_path, output_class_dir / img_path.name)

        num_to_generate = max(0, self.target_images_per_class - num_original)
        
        if num_to_generate == 0:
            print(f"✓ Ya hay suficientes imágenes ({num_original})")
            return num_original, 0

        augmentations_per_image = max(1, num_to_generate // num_original)
        
        print(f"Generando {num_to_generate} imágenes augmentadas...")
        print(f"   Repeticiones por imagen: {augmentations_per_image}")
        
        generated_count = 0

        for img_path in tqdm(original_images, desc=f"Augmentando {class_name}"):
            image = self.load_image(img_path)
            if image is None:
                continue

            base_name = img_path.stem

            for i in range(augmentations_per_image):

                use_soft = (i % 3 == 0)
                augmented_img = self.augment_image(image, class_name, use_soft=use_soft)

                output_name = f"{base_name}_aug{generated_count:04d}.jpg"
                output_path = output_class_dir / output_name

                self.save_image(augmented_img, output_path)
                generated_count += 1

                if generated_count >= num_to_generate:
                    break
            
            if generated_count >= num_to_generate:
                break
        
        return num_original, generated_count
    
    def show_statistics(self):
        """
        Muestra estadísticas del dataset original.
        """
        print("\n" + "="*70)
        print("ESTADÍSTICAS DEL DATASET ORIGINAL")
        print("="*70)
        
        total_images = 0
        
        for class_name in self.classes:
            class_dir = self.source_dir / class_name
            if class_dir.exists():
                images = self.get_image_files(class_dir)
                num_images = len(images)
                total_images += num_images
                print(f"  {class_name:20s}: {num_images:4d} imágenes")
        
        print(f"  {'TOTAL':20s}: {total_images:4d} imágenes")
        print("="*70)
        print(f"Objetivo: {self.target_images_per_class} imágenes por clase")
        print(f"Total esperado: {self.target_images_per_class * len(self.classes)} imágenes")
        print("="*70 + "\n")
    
    def run(self):
        """
        Ejecuta el proceso completo de augmentation.
        """
        print("\n" + "🚀 " + "="*66)
        print("   GENERADOR DE DATASET SINTÉTICO AMPLIADO DE EPP")
        print("="*68 + "\n")
        
        if not self.validate_directories():
            return
        
        self.show_statistics()

        input("Presiona ENTER para iniciar el proceso de augmentation...")

        total_original = 0
        total_generated = 0
        
        for class_name in self.classes:
            print(f"\n{'─'*70}")
            print(f"🔧 Procesando clase: {class_name.upper()}")
            print(f"{'─'*70}")
            
            num_original, num_generated = self.process_class(class_name)
            total_original += num_original
            total_generated += num_generated
            
            print(f"✓ Completado: {num_original} originales + {num_generated} generadas = {num_original + num_generated} total")

        self.show_final_summary(total_original, total_generated)
    
    def show_final_summary(self, total_original: int, total_generated: int):
        """
        Muestra el resumen final del proceso.
        
        Args:
            total_original: Total de imágenes originales
            total_generated: Total de imágenes generadas
        """
        print("\n" + "="*70)
        print("PROCESO COMPLETADO")
        print("="*70)
        print(f"Resumen:")
        print(f"   • Imágenes originales:    {total_original:6d}")
        print(f"   • Imágenes generadas:     {total_generated:6d}")
        print(f"   • Total en dataset:       {total_original + total_generated:6d}")
        print(f"   • Clases procesadas:      {len(self.classes):6d}")
        print(f"\nDataset guardado en: {self.output_dir}")
        print("="*70 + "\n")


def main():
    """
    Función principal para ejecutar el script.
    """
    CONFIG = {
        'source_dir': 'imagenes epp', 
        'output_dir': 'imagenes_epp_augmented',
        'target_images': 1000 
    }

    augmentor = EPPDatasetAugmentor(
        source_dir=CONFIG['source_dir'],
        output_dir=CONFIG['output_dir'],
        target_images_per_class=CONFIG['target_images']
    )
    
    augmentor.run()


if __name__ == "__main__":
    main()
