import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/errors';
import type {
  CreateProductInput,
  UpdateProductInput,
  ListProductsQuery,
  UpdateStockInput,
} from '../validators/products.validator';

// Include común para productos con todas sus relaciones
const productInclude = {
  category: {
    select: {
      slug: true,
      name: true,
    },
  },
  productType: {
    select: {
      slug: true,
      name: true,
    },
  },
  productColors: {
    include: {
      color: {
        select: {
          id: true,
          name: true,
          slug: true,
          hexCode: true,
        },
      },
    },
  },
  productSizes: {
    include: {
      size: {
        select: {
          id: true,
          name: true,
          abbreviation: true,
        },
      },
    },
  },
};

export interface ProductResponse {
  id: number;
  sku: string;
  slug: string;
  name: string;
  description: string;
  categoryId: number | null;
  categorySlug: string | null;
  categoryName: string | null;
  typeId: number | null;
  typeSlug: string | null;
  typeName: string | null;
  basePrice: number;
  stock: number;
  featured: boolean;
  isActive: boolean;
  images: { front: string; back?: string; side?: string };
  colors: Array<{ id: number; name: string; slug: string; hexCode: string }>;
  sizes: Array<{ id: number; name: string; abbreviation: string }>;
  tags: string[];
  rating: number | null;
  reviewsCount: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedProducts {
  data: ProductResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

function formatProductResponse(product: any): ProductResponse {
  return {
    id: product.id,
    sku: product.sku,
    slug: product.slug,
    name: product.name,
    description: product.description,
    categoryId: product.categoryId,
    categorySlug: product.category?.slug || null,
    categoryName: product.category?.name || null,
    typeId: product.typeId,
    typeSlug: product.productType?.slug || null,
    typeName: product.productType?.name || null,
    basePrice: Number(product.basePrice),
    stock: product.stock,
    featured: product.featured,
    isActive: product.isActive,
    images: typeof product.images === 'object' && product.images !== null
      ? product.images
      : { front: '' },
    colors: product.productColors?.map((pc: any) => ({
      id: pc.color.id,
      name: pc.color.name,
      slug: pc.color.slug,
      hexCode: pc.color.hexCode,
    })) || [],
    sizes: product.productSizes?.map((ps: any) => ({
      id: ps.size.id,
      name: ps.size.name,
      abbreviation: ps.size.abbreviation,
    })) || [],
    tags: Array.isArray(product.tags) ? product.tags : [],
    rating: product.rating ? Number(product.rating) : null,
    reviewsCount: product.reviewsCount,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

// Listar productos con filtros y paginación
export async function listProducts(query: ListProductsQuery): Promise<PaginatedProducts> {
  const {
    page,
    limit,
    search,
    category,
    type,
    minPrice,
    maxPrice,
    featured,
    isActive,
    color,
    size,
    sortBy,
    sortOrder,
  } = query;

  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = {
    isTemplate: false, // Solo mostrar productos, no modelos/templates
  };

  // Búsqueda por texto
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  // Filtros por slug de categoría (buscar el ID primero)
  if (category) {
    const cat = await prisma.category.findUnique({
      where: { slug: category },
      select: { id: true },
    });
    if (cat) {
      where.categoryId = cat.id;
    }
  }

  // Filtros por slug de tipo (buscar el ID primero)
  if (type) {
    const productType = await prisma.productType.findUnique({
      where: { slug: type },
      select: { id: true },
    });
    if (productType) {
      where.typeId = productType.id;
    }
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.basePrice = {};
    if (minPrice !== undefined) {
      where.basePrice.gte = minPrice;
    }
    if (maxPrice !== undefined) {
      where.basePrice.lte = maxPrice;
    }
  }

  if (featured !== undefined) {
    where.featured = featured;
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  // Filtro por color (buscar en relación)
  if (color) {
    where.productColors = {
      some: {
        color: {
          slug: color,
        },
      },
    };
  }

  // Filtro por talla (buscar en relación)
  if (size) {
    where.productSizes = {
      some: {
        size: {
          abbreviation: size,
        },
      },
    };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: productInclude,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    data: products.map(formatProductResponse),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Obtener producto por ID
export async function getProductById(id: number): Promise<ProductResponse> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: productInclude,
  });

  if (!product) {
    throw new NotFoundError('Producto no encontrado');
  }

  return formatProductResponse(product);
}

// Generar slug desde nombre
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Generar SKU único
async function generateSku(typeId: number | null | undefined): Promise<string> {
  let prefix = 'PRD';
  if (typeId) {
    const productType = await prisma.productType.findUnique({
      where: { id: typeId },
      select: { slug: true },
    });
    if (productType) {
      prefix = productType.slug.substring(0, 3).toUpperCase();
    }
  }
  const count = await prisma.product.count();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${String(count + 1).padStart(4, '0')}-${timestamp}`;
}

// Crear producto
export async function createProduct(data: CreateProductInput): Promise<ProductResponse> {
  // Generar SKU y slug si no se proporcionan
  const sku = data.sku || await generateSku(data.typeId);
  let slug = data.slug || generateSlug(data.name);

  // Verificar si el slug ya existe y hacerlo único
  const existingSlug = await prisma.product.findUnique({ where: { slug } });
  if (existingSlug) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const product = await prisma.product.create({
    data: {
      sku,
      slug,
      name: data.name,
      description: data.description,
      categoryId: data.categoryId,
      typeId: data.typeId,
      basePrice: data.basePrice,
      stock: data.stock,
      featured: data.featured,
      isActive: data.isActive,
      images: data.images,
      tags: data.tags,
      // Crear relaciones con colores
      productColors: {
        create: data.colors.map(color => ({
          colorId: color.id,
        })),
      },
      // Crear relaciones con tallas
      productSizes: {
        create: data.sizes.map(size => ({
          sizeId: size.id,
        })),
      },
    },
    include: productInclude,
  });

  return formatProductResponse(product);
}

// Actualizar producto
export async function updateProduct(id: number, data: UpdateProductInput): Promise<ProductResponse> {
  const existing = await prisma.product.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new NotFoundError('Producto no encontrado');
  }

  // Preparar los datos de actualización
  const updateData: any = {
    name: data.name,
    description: data.description,
    categoryId: data.categoryId,
    typeId: data.typeId,
    basePrice: data.basePrice,
    stock: data.stock,
    featured: data.featured,
    isActive: data.isActive,
    images: data.images,
    tags: data.tags,
  };

  // Si se proporcionan colores, actualizar relaciones
  if (data.colors && data.colors.length > 0) {
    updateData.productColors = {
      deleteMany: {}, // Eliminar todas las relaciones existentes
      create: data.colors.map(color => ({
        colorId: color.id,
      })),
    };
  }

  // Si se proporcionan tallas, actualizar relaciones
  if (data.sizes && data.sizes.length > 0) {
    updateData.productSizes = {
      deleteMany: {}, // Eliminar todas las relaciones existentes
      create: data.sizes.map(size => ({
        sizeId: size.id,
      })),
    };
  }

  const product = await prisma.product.update({
    where: { id },
    data: updateData,
    include: productInclude,
  });

  return formatProductResponse(product);
}

// Eliminar producto
export async function deleteProduct(id: number): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new NotFoundError('Producto no encontrado');
  }

  // Verificar si tiene pedidos asociados
  const orderItems = await prisma.orderItem.count({
    where: { productId: id },
  });

  if (orderItems > 0) {
    throw new BadRequestError(
      'No se puede eliminar el producto porque tiene pedidos asociados. Desactívalo en su lugar.'
    );
  }

  await prisma.product.delete({
    where: { id },
  });
}

// Actualizar stock
export async function updateStock(id: number, data: UpdateStockInput): Promise<ProductResponse> {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new NotFoundError('Producto no encontrado');
  }

  let newStock: number;

  switch (data.operation) {
    case 'set':
      newStock = data.quantity;
      break;
    case 'add':
      newStock = product.stock + data.quantity;
      break;
    case 'subtract':
      newStock = product.stock - data.quantity;
      break;
    default:
      newStock = data.quantity;
  }

  if (newStock < 0) {
    throw new BadRequestError('El stock no puede ser negativo');
  }

  const updated = await prisma.product.update({
    where: { id },
    data: { stock: newStock },
    include: productInclude,
  });

  return formatProductResponse(updated);
}

// Obtener productos destacados
export async function getFeaturedProducts(limit: number = 8): Promise<ProductResponse[]> {
  const products = await prisma.product.findMany({
    where: {
      featured: true,
      isActive: true,
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: productInclude,
  });

  return products.map(formatProductResponse);
}

// Obtener productos por categoría (recibe slug)
export async function getProductsByCategory(categorySlug: string, limit: number = 12): Promise<ProductResponse[]> {
  // Buscar el ID de la categoría por su slug
  const cat = await prisma.category.findUnique({
    where: { slug: categorySlug },
    select: { id: true },
  });

  if (!cat) {
    return [];
  }

  const products = await prisma.product.findMany({
    where: {
      categoryId: cat.id,
      isActive: true,
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: productInclude,
  });

  return products.map(formatProductResponse);
}

// Obtener categorías desde la tabla categories
export async function getCategories(): Promise<Array<{ id: number; name: string; slug: string }>> {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: { name: 'asc' },
  });

  return categories;
}

// Obtener tipos de producto desde la tabla product_types con su categoría
export async function getTypes(): Promise<Array<{ id: number; name: string; slug: string; categoryId: number | null; categorySlug: string | null }>> {
  const types = await prisma.productType.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      categoryId: true,
      category: {
        select: {
          slug: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return types.map(type => ({
    id: type.id,
    name: type.name,
    slug: type.slug,
    categoryId: type.categoryId,
    categorySlug: type.category?.slug || null,
  }));
}
