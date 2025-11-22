import type { ProductTypeConfig } from '../types/product';

// Configuraciones de zonas de estampado para cada tipo de producto
export const productTypeConfigs: ProductTypeConfig[] = [
  {
    type: 'tshirt',
    name: 'Camiseta',
    category: 'clothing',
    basePrice: 15.99,
    description: 'Camiseta de algodón 100% personalizable',
    availableColors: ['#FFFFFF', '#000000', '#9CA3AF', '#1E3A8A', '#DC2626'],
    availableSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    printZones: [
      {
        id: 'front',
        name: 'Frente',
        maxWidth: 300,
        maxHeight: 400,
        position: { x: 150, y: 100 },
      },
      {
        id: 'back',
        name: 'Espalda',
        maxWidth: 300,
        maxHeight: 400,
        position: { x: 150, y: 100 },
      },
      {
        id: 'chest',
        name: 'Pecho (pequeño)',
        maxWidth: 100,
        maxHeight: 100,
        position: { x: 250, y: 80 },
      },
    ],
  },
  {
    type: 'hoodie',
    name: 'Hoodie',
    category: 'clothing',
    basePrice: 35.99,
    description: 'Sudadera con capucha de alta calidad',
    availableColors: ['#000000', '#4B5563', '#1E3A8A', '#365314', '#991B1B'],
    availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
    printZones: [
      {
        id: 'front',
        name: 'Frente',
        maxWidth: 280,
        maxHeight: 350,
        position: { x: 160, y: 120 },
      },
      {
        id: 'back',
        name: 'Espalda',
        maxWidth: 300,
        maxHeight: 400,
        position: { x: 150, y: 100 },
      },
      {
        id: 'left-sleeve',
        name: 'Manga Izquierda',
        maxWidth: 80,
        maxHeight: 150,
        position: { x: 50, y: 150 },
      },
      {
        id: 'right-sleeve',
        name: 'Manga Derecha',
        maxWidth: 80,
        maxHeight: 150,
        position: { x: 470, y: 150 },
      },
    ],
  },
  {
    type: 'cap',
    name: 'Gorra',
    category: 'accessories',
    basePrice: 12.99,
    description: 'Gorra ajustable de 6 paneles',
    availableColors: ['#000000', '#FFFFFF', '#1D4ED8', '#DC2626', '#4A5D3F'],
    availableSizes: ['Única'],
    printZones: [
      {
        id: 'front',
        name: 'Frente',
        maxWidth: 200,
        maxHeight: 100,
        position: { x: 200, y: 150 },
      },
    ],
  },
  {
    type: 'bottle',
    name: 'Botella Térmica',
    category: 'accessories',
    basePrice: 19.99,
    description: 'Botella térmica de acero inoxidable 500ml',
    availableColors: ['#FFFFFF', '#1F2937', '#3B82F6', '#EC4899', '#10B981'],
    availableSizes: ['500ml'],
    printZones: [
      {
        id: 'around',
        name: 'Alrededor',
        maxWidth: 250,
        maxHeight: 180,
        position: { x: 175, y: 160 },
      },
    ],
  },
  {
    type: 'mug',
    name: 'Taza',
    category: 'home',
    basePrice: 9.99,
    description: 'Taza de cerámica 350ml',
    availableColors: ['#FFFFFF', '#000000', '#93C5FD', '#FBCFE8'],
    availableSizes: ['350ml'],
    printZones: [
      {
        id: 'around',
        name: 'Alrededor',
        maxWidth: 280,
        maxHeight: 120,
        position: { x: 160, y: 190 },
      },
    ],
  },
  {
    type: 'pillow',
    name: 'Almohada',
    category: 'home',
    basePrice: 16.99,
    description: 'Cojín decorativo 45x45cm',
    availableColors: ['#FFFFFF', '#D4C5B9', '#9CA3AF', '#1E3A8A'],
    availableSizes: ['45x45cm'],
    printZones: [
      {
        id: 'front',
        name: 'Frontal',
        maxWidth: 350,
        maxHeight: 350,
        position: { x: 125, y: 125 },
      },
    ],
  },
];

// Helper para obtener configuración por tipo
export const getProductTypeConfig = (type: string): ProductTypeConfig | undefined => {
  return productTypeConfigs.find((config) => config.type === type);
};

// Helper para obtener zonas de estampado por tipo
export const getPrintZones = (type: string) => {
  const config = getProductTypeConfig(type);
  return config?.printZones || [];
};
