import type { PrintZone, ProductType } from './product';

// Diseño aplicado a una zona de estampado
export interface Design {
  id: string;
  zoneId: PrintZone;
  imageUrl: string;
  imageData?: string; // Base64 comprimido para preview
  originalImageData?: string; // Base64 original sin compresión para producción
  originalFileName?: string; // Nombre original del archivo
  originalFileSize?: number; // Tamaño original en bytes
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  rotation: number; // En grados
  opacity: number;  // 0 a 1
  filters?: {
    brightness?: number;
    contrast?: number;
    grayscale?: boolean;
  };
}

// Imágenes de producción (originales sin compresión)
export interface ProductionImages {
  front?: string; // Base64 original para producción
  back?: string;
}

// Producto personalizado
export interface CustomizedProduct {
  id: string;
  productId: string;
  productType: ProductType;
  productName: string;
  basePrice: number;
  selectedColor: string;
  selectedSize: string;
  designs: Design[];
  previewImages: {
    front: string; // Comprimido para preview
    back?: string;
  };
  productionImages?: ProductionImages; // Originales para producción
  customizationPrice: number; // Precio adicional por personalización
  totalPrice: number;
  createdAt: Date;
}

// Estado del editor de personalización
export interface CustomizerState {
  productId: string | null;
  productType: ProductType | null;
  selectedColor: string;
  selectedSize: string;
  currentView: 'front' | 'back';
  currentZone: PrintZone | null;
  designs: Design[];
  isUploading: boolean;
  isSaving: boolean;
}
