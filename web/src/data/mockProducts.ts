import type { Product } from '../types/product';

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Camiseta Básica',
    description: 'Camiseta de algodón 100% perfecta para personalizar con tus diseños favoritos.',
    type: 'tshirt',
    category: 'clothing',
    basePrice: 15.99,
    images: {
      front: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
      back: 'https://images.unsplash.com/photo-1622445275576-721325c6c4ff?w=800&q=80',
    },
    colors: [
      { name: 'Blanco', hex: '#FFFFFF' },
      { name: 'Negro', hex: '#000000' },
      { name: 'Gris', hex: '#9CA3AF' },
      { name: 'Azul Marino', hex: '#1E3A8A' },
      { name: 'Rojo', hex: '#DC2626' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    featured: true,
    stock: 150,
    rating: 4.5,
    reviewsCount: 89,
    tags: ['básico', 'algodón', 'unisex'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Hoodie Premium',
    description: 'Sudadera con capucha de alta calidad. Material suave y cómodo para tus diseños más creativos.',
    type: 'hoodie',
    category: 'clothing',
    basePrice: 35.99,
    images: {
      front: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80',
      back: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80',
    },
    colors: [
      { name: 'Negro', hex: '#000000' },
      { name: 'Gris Oscuro', hex: '#4B5563' },
      { name: 'Azul Marino', hex: '#1E3A8A' },
      { name: 'Verde Militar', hex: '#365314' },
      { name: 'Borgoña', hex: '#991B1B' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    featured: true,
    stock: 85,
    rating: 4.8,
    reviewsCount: 124,
    tags: ['premium', 'capucha', 'invierno'],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: '3',
    name: 'Camiseta Oversize',
    description: 'Camiseta de corte oversize, tendencia y comodidad. Ideal para diseños grandes y llamativos.',
    type: 'tshirt',
    category: 'clothing',
    basePrice: 18.99,
    images: {
      front: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80',
      back: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&q=80',
    },
    colors: [
      { name: 'Beige', hex: '#D4C5B9' },
      { name: 'Negro', hex: '#000000' },
      { name: 'Blanco Roto', hex: '#F5F5F0' },
      { name: 'Verde Oliva', hex: '#6B7B3B' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    featured: true,
    stock: 95,
    rating: 4.6,
    reviewsCount: 67,
    tags: ['oversize', 'moderno', 'streetwear'],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '4',
    name: 'Gorra Snapback',
    description: 'Gorra ajustable de 6 paneles. Perfecta para logos y diseños en la parte frontal.',
    type: 'cap',
    category: 'accessories',
    basePrice: 12.99,
    images: {
      front: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&q=80',
    },
    colors: [
      { name: 'Negro', hex: '#000000' },
      { name: 'Blanco', hex: '#FFFFFF' },
      { name: 'Azul', hex: '#1D4ED8' },
      { name: 'Rojo', hex: '#DC2626' },
      { name: 'Camuflaje', hex: '#4A5D3F' },
    ],
    sizes: ['Única'],
    featured: false,
    stock: 120,
    rating: 4.3,
    reviewsCount: 45,
    tags: ['gorra', 'snapback', 'ajustable'],
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: '5',
    name: 'Botella Térmica',
    description: 'Botella térmica de acero inoxidable 500ml. Mantiene bebidas frías o calientes por horas.',
    type: 'bottle',
    category: 'accessories',
    basePrice: 19.99,
    images: {
      front: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80',
    },
    colors: [
      { name: 'Blanco', hex: '#FFFFFF' },
      { name: 'Negro Mate', hex: '#1F2937' },
      { name: 'Azul', hex: '#3B82F6' },
      { name: 'Rosa', hex: '#EC4899' },
      { name: 'Verde', hex: '#10B981' },
    ],
    sizes: ['500ml'],
    featured: true,
    stock: 75,
    rating: 4.7,
    reviewsCount: 93,
    tags: ['térmica', 'ecológica', 'deporte'],
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
  },
  {
    id: '6',
    name: 'Taza Cerámica',
    description: 'Taza de cerámica de 350ml. Resistente al microondas y lavavajillas.',
    type: 'mug',
    category: 'home',
    basePrice: 9.99,
    images: {
      front: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80',
    },
    colors: [
      { name: 'Blanco', hex: '#FFFFFF' },
      { name: 'Negro', hex: '#000000' },
      { name: 'Azul Claro', hex: '#93C5FD' },
      { name: 'Rosa Pastel', hex: '#FBCFE8' },
    ],
    sizes: ['350ml'],
    featured: false,
    stock: 200,
    rating: 4.4,
    reviewsCount: 156,
    tags: ['taza', 'cerámica', 'café'],
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08'),
  },
  {
    id: '7',
    name: 'Almohada Decorativa',
    description: 'Cojín decorativo de 45x45cm con funda personalizable. Incluye relleno suave.',
    type: 'pillow',
    category: 'home',
    basePrice: 16.99,
    images: {
      front: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80',
    },
    colors: [
      { name: 'Blanco', hex: '#FFFFFF' },
      { name: 'Beige', hex: '#D4C5B9' },
      { name: 'Gris', hex: '#9CA3AF' },
      { name: 'Azul Marino', hex: '#1E3A8A' },
    ],
    sizes: ['45x45cm'],
    featured: false,
    stock: 60,
    rating: 4.5,
    reviewsCount: 34,
    tags: ['almohada', 'decoración', 'hogar'],
    createdAt: new Date('2024-01-22'),
    updatedAt: new Date('2024-01-22'),
  },
  {
    id: '8',
    name: 'Polo Deportivo',
    description: 'Polo deportivo de tela técnica transpirable. Ideal para equipos y empresas.',
    type: 'tshirt',
    category: 'clothing',
    basePrice: 22.99,
    images: {
      front: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
      back: 'https://images.unsplash.com/photo-1628270069400-0cf93e08e2cd?w=800&q=80',
    },
    colors: [
      { name: 'Blanco', hex: '#FFFFFF' },
      { name: 'Negro', hex: '#000000' },
      { name: 'Azul Royal', hex: '#1E40AF' },
      { name: 'Verde', hex: '#059669' },
      { name: 'Rojo', hex: '#DC2626' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    featured: true,
    stock: 110,
    rating: 4.6,
    reviewsCount: 78,
    tags: ['polo', 'deportivo', 'empresarial'],
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25'),
  },
];

// Función helper para obtener productos filtrados
export const getProducts = (filters?: {
  category?: string;
  featured?: boolean;
  limit?: number;
}): Product[] => {
  let filtered = [...mockProducts];

  if (filters?.category) {
    filtered = filtered.filter((p) => p.category === filters.category);
  }

  if (filters?.featured !== undefined) {
    filtered = filtered.filter((p) => p.featured === filters.featured);
  }

  if (filters?.limit) {
    filtered = filtered.slice(0, filters.limit);
  }

  return filtered;
};

// Función helper para obtener un producto por ID
export const getProductById = (id: string): Product | undefined => {
  return mockProducts.find((p) => p.id === id);
};
