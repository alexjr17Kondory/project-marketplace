import { z } from 'zod';

// Crear producto
export const createProductSchema = z.object({
  sku: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(200, 'El nombre no puede exceder 200 caracteres')
    .transform((val) => val.trim()),
  description: z
    .string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(5000, 'La descripción no puede exceder 5000 caracteres'),
  typeId: z.coerce.number().int().positive('El tipo es requerido').optional().nullable(),
  categoryId: z.coerce.number().int().positive('La categoría es requerida').optional().nullable(),
  basePrice: z.coerce.number().positive('El precio debe ser mayor a 0'),
  stock: z.coerce.number().int().min(0, 'El stock no puede ser negativo').default(0),
  featured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  images: z.array(z.string().url('URL de imagen inválida')).min(1, 'Se requiere al menos una imagen'),
  colors: z.array(z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
    hexCode: z.string(),
  })).min(1, 'Se requiere al menos un color'),
  sizes: z.array(z.object({
    id: z.number(),
    name: z.string(),
    abbreviation: z.string(),
  })).min(1, 'Se requiere al menos una talla'),
  tags: z.array(z.string()).default([]),
});

// Actualizar producto
export const updateProductSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(200, 'El nombre no puede exceder 200 caracteres')
    .transform((val) => val.trim())
    .optional(),
  description: z
    .string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(5000, 'La descripción no puede exceder 5000 caracteres')
    .optional(),
  typeId: z.coerce.number().int().positive().optional().nullable(),
  categoryId: z.coerce.number().int().positive().optional().nullable(),
  basePrice: z.coerce.number().positive('El precio debe ser mayor a 0').optional(),
  stock: z.coerce.number().int().min(0, 'El stock no puede ser negativo').optional(),
  featured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  images: z.array(z.string().url('URL de imagen inválida')).optional(),
  colors: z.array(z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
    hexCode: z.string(),
  })).optional(),
  sizes: z.array(z.object({
    id: z.number(),
    name: z.string(),
    abbreviation: z.string(),
  })).optional(),
  tags: z.array(z.string()).optional(),
});

// Query params para listar productos
export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),
  search: z.string().optional(),
  category: z.string().optional(),
  type: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  featured: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  sortBy: z.enum(['name', 'basePrice', 'createdAt', 'rating', 'stock']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ID param
export const productIdSchema = z.object({
  id: z.string().min(1, 'ID de producto requerido'),
});

// Actualizar stock
export const updateStockSchema = z.object({
  quantity: z.coerce.number().int(),
  operation: z.enum(['set', 'add', 'subtract']).default('set'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
export type UpdateStockInput = z.infer<typeof updateStockSchema>;
