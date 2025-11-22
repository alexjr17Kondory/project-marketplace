import type { PrintZone, ProductType } from './product';

// Diseño aplicado a una zona de estampado
export interface Design {
  id: string;
  zoneId: PrintZone;
  imageUrl: string;
  imageData?: string; // Base64 si la imagen es local
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
    front: string;
    back?: string;
  };
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
