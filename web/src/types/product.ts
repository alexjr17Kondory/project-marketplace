// Tipos de productos disponibles
export type ProductType = 'tshirt' | 'hoodie' | 'cap' | 'bottle' | 'mug' | 'pillow';

// Categorías de productos
export type ProductCategory = 'clothing' | 'accessories' | 'home';

// Zonas de estampado para cada tipo de producto
export type PrintZone =
  | 'front'       // Frente
  | 'back'        // Espalda
  | 'left-sleeve' // Manga izquierda
  | 'right-sleeve'// Manga derecha
  | 'chest'       // Pecho (pequeño)
  | 'around'      // Alrededor (botellas, tazas)
  | 'top';        // Superior (gorras)

// Configuración de zona de estampado
export interface PrintZoneConfig {
  id: PrintZone;
  name: string;
  maxWidth: number;  // Ancho máximo en píxeles
  maxHeight: number; // Alto máximo en píxeles
  position: {
    x: number;
    y: number;
  };
}

// Configuración de tipo de producto
export interface ProductTypeConfig {
  type: ProductType;
  name: string;
  category: ProductCategory;
  basePrice: number;
  printZones: PrintZoneConfig[];
  availableColors: string[];
  availableSizes: string[];
  description: string;
}

// Producto base del catálogo
export interface Product {
  id: string;
  name: string;
  description: string;
  type: ProductType;
  category: ProductCategory;
  basePrice: number;
  images: {
    front: string;
    back?: string;
    side?: string;
  };
  colors: ProductColor[];
  sizes: string[];
  featured: boolean;
  stock: number;
  rating?: number;
  reviewsCount?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Color disponible para un producto
export interface ProductColor {
  name: string;
  hex: string;
  image?: string; // URL de imagen del producto en este color
}

// Filtros para productos
export interface ProductFilters {
  category?: ProductCategory;
  type?: ProductType;
  minPrice?: number;
  maxPrice?: number;
  colors?: string[];
  sizes?: string[];
  inStock?: boolean;
  featured?: boolean;
  search?: string;
}

// Opciones de ordenamiento
export type ProductSortOption =
  | 'price-asc'
  | 'price-desc'
  | 'name-asc'
  | 'name-desc'
  | 'newest'
  | 'rating'
  | 'popular';
