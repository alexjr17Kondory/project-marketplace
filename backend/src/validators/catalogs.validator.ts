import { z } from 'zod';

// ==================== TALLAS ====================
export const createSizeSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(50),
  abbreviation: z.string().min(1, 'Abreviación requerida').max(10),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateSizeSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  abbreviation: z.string().min(1).max(10).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// ==================== COLORES ====================
export const createColorSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(50),
  hexCode: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Código hex inválido (ej: #FF0000)')
    .transform((val) => val.toUpperCase()),
  isActive: z.boolean().default(true),
});

export const updateColorSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  hexCode: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Código hex inválido')
    .transform((val) => val.toUpperCase())
    .optional(),
  isActive: z.boolean().optional(),
});

// ==================== CATEGORÍAS ====================
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

// ==================== TIPOS DE PRODUCTO ====================
export const createProductTypeSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
});

export const updateProductTypeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

// ==================== PARAMS ====================
export const catalogIdSchema = z.object({
  id: z.string().min(1, 'ID requerido'),
});

export const productTypeIdSchema = z.object({
  productTypeId: z.string().min(1, 'ID de tipo de producto requerido'),
});

// Types
export type CreateSizeInput = z.infer<typeof createSizeSchema>;
export type UpdateSizeInput = z.infer<typeof updateSizeSchema>;
export type CreateColorInput = z.infer<typeof createColorSchema>;
export type UpdateColorInput = z.infer<typeof updateColorSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateProductTypeInput = z.infer<typeof createProductTypeSchema>;
export type UpdateProductTypeInput = z.infer<typeof updateProductTypeSchema>;
