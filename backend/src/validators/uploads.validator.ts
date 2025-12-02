import { z } from 'zod';

// Carpetas válidas para subir imágenes
export const validFolders = ['products', 'designs', 'avatars', 'orders', 'general'] as const;

// Subir desde URL
export const uploadFromUrlSchema = z.object({
  url: z.string().url('URL inválida'),
  folder: z.enum(validFolders).optional().default('general'),
  publicId: z.string().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
});

// Subir desde base64
export const uploadBase64Schema = z.object({
  image: z.string().min(1, 'Imagen requerida'),
  folder: z.enum(validFolders).optional().default('general'),
  publicId: z.string().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
});

// Eliminar imagen
export const deleteImageSchema = z.object({
  publicId: z.string().min(1, 'Public ID requerido'),
});

// Query params para obtener URL optimizada
export const optimizeQuerySchema = z.object({
  publicId: z.string().min(1, 'Public ID requerido'),
  width: z.coerce.number().positive().optional(),
  height: z.coerce.number().positive().optional(),
  quality: z.enum(['auto', '80', '90', '100']).optional(),
  format: z.enum(['auto', 'webp', 'jpg', 'png']).optional(),
});

export type UploadFromUrlInput = z.infer<typeof uploadFromUrlSchema>;
export type UploadBase64Input = z.infer<typeof uploadBase64Schema>;
export type DeleteImageInput = z.infer<typeof deleteImageSchema>;
export type OptimizeQuery = z.infer<typeof optimizeQuerySchema>;
