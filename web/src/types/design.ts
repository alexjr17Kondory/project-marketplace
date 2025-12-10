import type { PrintZone, ProductType } from './product';

// Diseño aplicado a una zona de estampado
export interface Design {
  id: string;
  zoneId: PrintZone;
  imageUrl: string;
  imageData?: string; // Base64 comprimido para preview
  originalImageData?: string; // Base64 original sin compresión para producción
  colorizedImageData?: string; // Base64 con color aplicado (para preview)
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
  tintColor?: string; // Color aplicado al diseño (hex)
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

// Configuración de zona guardada (para recrear el diseño)
export interface SavedZoneConfig {
  zoneId: string;
  zoneName: string;
  zoneTypeSlug: string;
  positionX: number; // Porcentaje
  positionY: number;
  maxWidth: number;
  maxHeight: number;
}

// Producto personalizado
export interface CustomizedProduct {
  id: string;
  productId: string;
  productType: ProductType;
  productName: string;
  basePrice: number;
  selectedColor: string;
  selectedColorName?: string; // Nombre del color para mostrar
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

  // Datos del template para poder recrear/editar
  templateId?: number;
  templateSlug?: string;
  templateImages?: {
    front: string;
    back?: string;
  };
  zoneTypeImages?: Record<string, string>; // Imágenes por tipo de zona
  savedZones?: SavedZoneConfig[]; // Configuración de zonas guardadas
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
