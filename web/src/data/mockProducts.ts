import type { Product } from '../types/product';

export const mockProducts: Product[] = [
  // ============= ROPA SUBLIMABLE =============
  {
    id: '1',
    name: 'Camiseta Sublimación Full Print',
    description: 'Camiseta 100% poliéster ideal para sublimación completa. Colores vibrantes y duraderos.',
    type: 'camiseta',
    category: 'ropa',
    basePrice: 25000,
    images: {
      front: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
      back: 'https://images.unsplash.com/photo-1622445275576-721325c6c4ff?w=800&q=80',
    },
    colors: [
      { name: 'Blanco', hex: '#FFFFFF' },
      { name: 'Negro', hex: '#000000' },
      { name: 'Gris', hex: '#9CA3AF' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    featured: true,
    stock: 150,
    rating: 4.8,
    reviewsCount: 156,
    tags: ['sublimación', 'full print', 'poliéster'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Buzo con Capucha Sublimable',
    description: 'Hoodie de poliéster con interior afelpado. Perfecto para diseños personalizados en toda la prenda.',
    type: 'hoodie',
    category: 'ropa',
    basePrice: 65000,
    images: {
      front: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80',
      back: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80',
    },
    colors: [
      { name: 'Blanco', hex: '#FFFFFF' },
      { name: 'Gris Claro', hex: '#D1D5DB' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    featured: true,
    stock: 85,
    rating: 4.9,
    reviewsCount: 203,
    tags: ['hoodie', 'sublimación', 'capucha'],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: '3',
    name: 'Suéter Cuello Redondo',
    description: 'Suéter sin capucha ideal para sublimación. Material suave y cómodo para uso diario.',
    type: 'sueter',
    category: 'ropa',
    basePrice: 55000,
    images: {
      front: 'https://images.unsplash.com/photo-1572495532056-8583af1cbae0?w=800&q=80',
      back: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&q=80',
    },
    colors: [
      { name: 'Blanco', hex: '#FFFFFF' },
      { name: 'Gris Melange', hex: '#9CA3AF' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    featured: true,
    stock: 70,
    rating: 4.7,
    reviewsCount: 89,
    tags: ['suéter', 'buzo', 'sublimación'],
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-05'),
  },
  {
    id: '4',
    name: 'Polo Deportivo Sublimable',
    description: 'Polo en tela deportiva perfecta para sublimación. Ideal para uniformes y equipos.',
    type: 'polo',
    category: 'ropa',
    basePrice: 35000,
    images: {
      front: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
      back: 'https://images.unsplash.com/photo-1628270069400-0cf93e08e2cd?w=800&q=80',
    },
    colors: [
      { name: 'Blanco', hex: '#FFFFFF' },
      { name: 'Azul Claro', hex: '#93C5FD' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    featured: false,
    stock: 100,
    rating: 4.6,
    reviewsCount: 67,
    tags: ['polo', 'deportivo', 'uniformes'],
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25'),
  },
  {
    id: '5',
    name: 'Gorra Trucker Sublimable',
    description: 'Gorra con frente sublimable y malla trasera. Perfecta para logos y diseños llamativos.',
    type: 'gorra',
    category: 'accesorios',
    basePrice: 18000,
    images: {
      front: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&q=80',
    },
    colors: [
      { name: 'Blanco/Negro', hex: '#FFFFFF' },
      { name: 'Blanco/Azul', hex: '#FFFFFF' },
      { name: 'Blanco/Rojo', hex: '#FFFFFF' },
    ],
    sizes: ['Única'],
    featured: true,
    stock: 200,
    rating: 4.5,
    reviewsCount: 134,
    tags: ['gorra', 'trucker', 'sublimación'],
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
  },

  // ============= DRINKWARE =============
  {
    id: '6',
    name: 'Taza Cerámica 11oz',
    description: 'Taza de cerámica blanca premium para sublimación. Apta para microondas y lavavajillas.',
    type: 'taza',
    category: 'bebidas',
    basePrice: 15000,
    images: {
      front: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80',
    },
    colors: [
      { name: 'Blanco', hex: '#FFFFFF' },
      { name: 'Interior Rojo', hex: '#DC2626' },
      { name: 'Interior Azul', hex: '#2563EB' },
      { name: 'Interior Negro', hex: '#000000' },
    ],
    sizes: ['11oz', '15oz'],
    featured: true,
    stock: 300,
    rating: 4.9,
    reviewsCount: 342,
    tags: ['taza', 'cerámica', 'regalo'],
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
  },
  {
    id: '7',
    name: 'Taza Mágica Cambia Color',
    description: 'Taza que revela el diseño con el calor. Efecto sorpresa perfecto para regalos.',
    type: 'taza-magica',
    category: 'bebidas',
    basePrice: 22000,
    images: {
      front: 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=800&q=80',
    },
    colors: [
      { name: 'Negro Mágico', hex: '#000000' },
    ],
    sizes: ['11oz'],
    featured: true,
    stock: 150,
    rating: 4.8,
    reviewsCount: 198,
    tags: ['taza mágica', 'termosensible', 'regalo'],
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08'),
  },
  {
    id: '8',
    name: 'Termo Acero Inoxidable 500ml',
    description: 'Botella térmica de acero inoxidable con recubrimiento para sublimación. Mantiene bebidas frías o calientes.',
    type: 'termo',
    category: 'bebidas',
    basePrice: 35000,
    images: {
      front: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80',
    },
    colors: [
      { name: 'Blanco', hex: '#FFFFFF' },
      { name: 'Plateado', hex: '#C0C0C0' },
    ],
    sizes: ['350ml', '500ml', '750ml'],
    featured: true,
    stock: 120,
    rating: 4.7,
    reviewsCount: 156,
    tags: ['termo', 'botella', 'acero'],
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
  },
  {
    id: '9',
    name: 'Vaso Térmico 20oz',
    description: 'Tumbler de acero inoxidable con tapa. Ideal para sublimación con diseños de 360°.',
    type: 'vaso-termico',
    category: 'bebidas',
    basePrice: 28000,
    images: {
      front: 'https://images.unsplash.com/photo-1571167530149-c1105da4c2c7?w=800&q=80',
    },
    colors: [
      { name: 'Blanco', hex: '#FFFFFF' },
      { name: 'Negro', hex: '#1F2937' },
    ],
    sizes: ['20oz', '30oz'],
    featured: false,
    stock: 90,
    rating: 4.6,
    reviewsCount: 87,
    tags: ['vaso', 'tumbler', 'térmico'],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },

  // ============= HOGAR Y DECORACIÓN =============
  {
    id: '10',
    name: 'Cuadro en Aluminio 20x30cm',
    description: 'Panel de aluminio sublimable de alta definición. Colores vibrantes y acabado premium para decoración.',
    type: 'cuadro-aluminio',
    category: 'hogar',
    basePrice: 45000,
    images: {
      front: 'https://images.unsplash.com/photo-1513519245088-0e12902e35a6?w=800&q=80',
    },
    colors: [
      { name: 'Aluminio Brillante', hex: '#E5E7EB' },
      { name: 'Aluminio Mate', hex: '#D1D5DB' },
    ],
    sizes: ['15x20cm', '20x30cm', '30x40cm', '40x60cm'],
    featured: true,
    stock: 80,
    rating: 4.9,
    reviewsCount: 234,
    tags: ['cuadro', 'aluminio', 'decoración'],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '11',
    name: 'Posa Vasos Set x4',
    description: 'Set de 4 posa vasos sublimables. Base de corcho antideslizante. Perfectos para personalizar.',
    type: 'posa-vasos',
    category: 'hogar',
    basePrice: 25000,
    images: {
      front: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    },
    colors: [
      { name: 'Cuadrado', hex: '#FFFFFF' },
      { name: 'Redondo', hex: '#FFFFFF' },
    ],
    sizes: ['Set x4', 'Set x6'],
    featured: true,
    stock: 150,
    rating: 4.7,
    reviewsCount: 123,
    tags: ['posa vasos', 'set', 'hogar'],
    createdAt: new Date('2024-01-22'),
    updatedAt: new Date('2024-01-22'),
  },
  {
    id: '12',
    name: 'Cojín Sublimable 40x40cm',
    description: 'Cojín con funda sublimable. Incluye relleno. Ideal para decoración personalizada.',
    type: 'cojin',
    category: 'hogar',
    basePrice: 32000,
    images: {
      front: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80',
    },
    colors: [
      { name: 'Blanco', hex: '#FFFFFF' },
    ],
    sizes: ['30x30cm', '40x40cm', '50x50cm'],
    featured: false,
    stock: 100,
    rating: 4.5,
    reviewsCount: 78,
    tags: ['cojín', 'almohada', 'decoración'],
    createdAt: new Date('2024-02-08'),
    updatedAt: new Date('2024-02-08'),
  },
  {
    id: '13',
    name: 'Reloj de Pared 20cm',
    description: 'Reloj de pared circular sublimable. Mecanismo silencioso incluido. Decoración única.',
    type: 'reloj',
    category: 'hogar',
    basePrice: 38000,
    images: {
      front: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800&q=80',
    },
    colors: [
      { name: 'Blanco', hex: '#FFFFFF' },
    ],
    sizes: ['20cm', '30cm'],
    featured: false,
    stock: 60,
    rating: 4.6,
    reviewsCount: 45,
    tags: ['reloj', 'pared', 'decoración'],
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
  },
  {
    id: '14',
    name: 'Rompecabezas Sublimable',
    description: 'Puzzle personalizado de cartón premium. Disponible en varias piezas. Regalo perfecto.',
    type: 'rompecabezas',
    category: 'hogar',
    basePrice: 28000,
    images: {
      front: 'https://images.unsplash.com/photo-1494059980473-813e73ee784b?w=800&q=80',
    },
    colors: [
      { name: 'Cartón Premium', hex: '#F5F5F4' },
    ],
    sizes: ['A5 (24 piezas)', 'A4 (120 piezas)', 'A3 (252 piezas)'],
    featured: true,
    stock: 80,
    rating: 4.8,
    reviewsCount: 167,
    tags: ['puzzle', 'rompecabezas', 'regalo'],
    createdAt: new Date('2024-01-28'),
    updatedAt: new Date('2024-01-28'),
  },
  {
    id: '15',
    name: 'Manta Polar Sublimable',
    description: 'Manta de polar suave 100x150cm. Sublimación en toda la superficie. Perfecta para fotos.',
    type: 'manta',
    category: 'hogar',
    basePrice: 75000,
    images: {
      front: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
    },
    colors: [
      { name: 'Blanco', hex: '#FFFFFF' },
    ],
    sizes: ['100x150cm', '150x200cm'],
    featured: false,
    stock: 40,
    rating: 4.7,
    reviewsCount: 56,
    tags: ['manta', 'polar', 'cobija'],
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
  },

  // ============= ACCESORIOS =============
  {
    id: '16',
    name: 'Llavero MDF Rectangular',
    description: 'Llavero de MDF sublimable con argolla metálica. Perfecto para recuerdos y promocionales.',
    type: 'llavero',
    category: 'accesorios',
    basePrice: 5000,
    images: {
      front: 'https://images.unsplash.com/photo-1622556498246-755f44ca76f3?w=800&q=80',
    },
    colors: [
      { name: 'MDF Natural', hex: '#D4A574' },
    ],
    sizes: ['Rectangular', 'Circular', 'Corazón', 'Estrella'],
    featured: true,
    stock: 500,
    rating: 4.4,
    reviewsCount: 234,
    tags: ['llavero', 'MDF', 'promocional'],
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: '17',
    name: 'Mouse Pad Gamer XL',
    description: 'Mouse pad extendido 80x30cm con base antideslizante. Superficie óptima para sublimación.',
    type: 'mouse-pad',
    category: 'accesorios',
    basePrice: 22000,
    images: {
      front: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80',
    },
    colors: [
      { name: 'Negro', hex: '#000000' },
    ],
    sizes: ['Standard (25x20cm)', 'Grande (40x30cm)', 'XL (80x30cm)'],
    featured: true,
    stock: 120,
    rating: 4.8,
    reviewsCount: 189,
    tags: ['mouse pad', 'gamer', 'escritorio'],
    createdAt: new Date('2024-02-12'),
    updatedAt: new Date('2024-02-12'),
  },
  {
    id: '18',
    name: 'Funda Celular Sublimable',
    description: 'Funda dura para smartphone con superficie sublimable. Protección y personalización.',
    type: 'funda-celular',
    category: 'accesorios',
    basePrice: 18000,
    images: {
      front: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&q=80',
    },
    colors: [
      { name: 'Blanco', hex: '#FFFFFF' },
      { name: 'Transparente', hex: '#F3F4F6' },
    ],
    sizes: ['iPhone 13/14', 'iPhone 15', 'Samsung S23', 'Samsung S24'],
    featured: false,
    stock: 200,
    rating: 4.3,
    reviewsCount: 98,
    tags: ['funda', 'celular', 'smartphone'],
    createdAt: new Date('2024-02-18'),
    updatedAt: new Date('2024-02-18'),
  },
  {
    id: '19',
    name: 'Bolsa Tote Bag Sublimable',
    description: 'Bolsa de poliéster resistente para sublimación completa. Asas reforzadas.',
    type: 'bolsa-tote',
    category: 'accesorios',
    basePrice: 20000,
    images: {
      front: 'https://images.unsplash.com/photo-1597633125097-5a9ae3370364?w=800&q=80',
    },
    colors: [
      { name: 'Blanco', hex: '#FFFFFF' },
    ],
    sizes: ['Pequeña', 'Mediana', 'Grande'],
    featured: false,
    stock: 150,
    rating: 4.5,
    reviewsCount: 87,
    tags: ['bolsa', 'tote', 'ecológica'],
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
  },
  {
    id: '20',
    name: 'Cordón Lanyard Sublimable',
    description: 'Lanyard de poliéster para credenciales. Sublimación a doble cara. Gancho metálico incluido.',
    type: 'lanyard',
    category: 'accesorios',
    basePrice: 8000,
    images: {
      front: 'https://images.unsplash.com/photo-1612423284934-2850a4ea6b0f?w=800&q=80',
    },
    colors: [
      { name: 'Blanco', hex: '#FFFFFF' },
    ],
    sizes: ['Standard (90cm)', 'Corto (45cm)'],
    featured: false,
    stock: 300,
    rating: 4.4,
    reviewsCount: 112,
    tags: ['lanyard', 'cordón', 'credencial'],
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-20'),
  },

  // ============= OFICINA =============
  {
    id: '21',
    name: 'Libreta A5 Tapa Dura',
    description: 'Libreta con tapa dura sublimable. 100 hojas rayadas. Ideal para regalos corporativos.',
    type: 'libreta',
    category: 'oficina',
    basePrice: 25000,
    images: {
      front: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80',
    },
    colors: [
      { name: 'Blanco', hex: '#FFFFFF' },
    ],
    sizes: ['A6', 'A5', 'A4'],
    featured: false,
    stock: 100,
    rating: 4.6,
    reviewsCount: 67,
    tags: ['libreta', 'cuaderno', 'oficina'],
    createdAt: new Date('2024-02-25'),
    updatedAt: new Date('2024-02-25'),
  },
  {
    id: '22',
    name: 'Calendario de Escritorio',
    description: 'Calendario de escritorio con base de cartón. 12 hojas sublimables para cada mes.',
    type: 'calendario',
    category: 'oficina',
    basePrice: 28000,
    images: {
      front: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=800&q=80',
    },
    colors: [
      { name: 'Blanco', hex: '#FFFFFF' },
    ],
    sizes: ['Escritorio', 'Pared A4', 'Pared A3'],
    featured: false,
    stock: 80,
    rating: 4.5,
    reviewsCount: 45,
    tags: ['calendario', 'escritorio', 'oficina'],
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
  },

  // ============= MÁS PRODUCTOS POPULARES =============
  {
    id: '23',
    name: 'Camiseta Dry Fit Deportiva',
    description: 'Camiseta deportiva de tela dry fit. Ideal para uniformes deportivos y gimnasios.',
    type: 'camiseta',
    category: 'ropa',
    basePrice: 28000,
    images: {
      front: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&q=80',
      back: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80',
    },
    colors: [
      { name: 'Blanco', hex: '#FFFFFF' },
      { name: 'Amarillo', hex: '#FDE047' },
      { name: 'Verde Neón', hex: '#4ADE80' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    featured: true,
    stock: 180,
    rating: 4.7,
    reviewsCount: 145,
    tags: ['dry fit', 'deportivo', 'uniforme'],
    createdAt: new Date('2024-02-28'),
    updatedAt: new Date('2024-02-28'),
  },
  {
    id: '24',
    name: 'Gorra Dad Hat Sublimable',
    description: 'Gorra estilo vintage con frente sublimable. Cierre ajustable de hebilla.',
    type: 'gorra',
    category: 'accesorios',
    basePrice: 16000,
    images: {
      front: 'https://images.unsplash.com/photo-1534215754734-18e55d13e346?w=800&q=80',
    },
    colors: [
      { name: 'Blanco', hex: '#FFFFFF' },
      { name: 'Beige', hex: '#D4B896' },
    ],
    sizes: ['Única'],
    featured: false,
    stock: 150,
    rating: 4.5,
    reviewsCount: 78,
    tags: ['gorra', 'dad hat', 'vintage'],
    createdAt: new Date('2024-02-28'),
    updatedAt: new Date('2024-02-28'),
  },
  {
    id: '25',
    name: 'Set Tazas Parejas',
    description: 'Set de 2 tazas de cerámica para parejas. Ideal para San Valentín y aniversarios.',
    type: 'taza',
    category: 'bebidas',
    basePrice: 28000,
    images: {
      front: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&q=80',
    },
    colors: [
      { name: 'Blanco Set', hex: '#FFFFFF' },
    ],
    sizes: ['Set x2 (11oz)'],
    featured: true,
    stock: 100,
    rating: 4.9,
    reviewsCount: 256,
    tags: ['tazas', 'parejas', 'regalo'],
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
  },
];

// Función helper para obtener productos filtrados
export const getProducts = (filters?: {
  category?: string;
  type?: string;
  featured?: boolean;
  bestsellers?: boolean;
  newArrivals?: boolean;
  limit?: number;
  sortBy?: 'rating' | 'price' | 'newest' | 'reviewsCount';
}): Product[] => {
  let filtered = [...mockProducts];

  if (filters?.category) {
    filtered = filtered.filter((p) => p.category === filters.category);
  }

  if (filters?.type) {
    filtered = filtered.filter((p) => p.type === filters.type);
  }

  if (filters?.featured !== undefined) {
    filtered = filtered.filter((p) => p.featured === filters.featured);
  }

  // Bestsellers = productos con más reviews
  if (filters?.bestsellers) {
    filtered = filtered.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
  }

  // Nuevos = ordenados por fecha de creación
  if (filters?.newArrivals) {
    filtered = filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Ordenar por criterio
  if (filters?.sortBy) {
    switch (filters.sortBy) {
      case 'rating':
        filtered = filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'price':
        filtered = filtered.sort((a, b) => a.basePrice - b.basePrice);
        break;
      case 'newest':
        filtered = filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'reviewsCount':
        filtered = filtered.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
        break;
    }
  }

  if (filters?.limit) {
    filtered = filtered.slice(0, filters.limit);
  }

  return filtered;
};

// Obtener tipos de productos únicos
export const getProductTypes = (): string[] => {
  const types = new Set(mockProducts.map(p => p.type));
  return Array.from(types);
};

// Obtener categorías únicas
export const getProductCategories = (): string[] => {
  const categories = new Set(mockProducts.map(p => p.category));
  return Array.from(categories);
};

// Función helper para obtener un producto por ID
export const getProductById = (id: string): Product | undefined => {
  return mockProducts.find((p) => p.id === id);
};
