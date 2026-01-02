import { z } from 'zod';

// Crear review
export const createReviewSchema = z.object({
  productId: z.coerce.number().int().positive('ID de producto requerido'),
  rating: z.coerce.number().int().min(1, 'Rating mínimo es 1').max(5, 'Rating máximo es 5'),
  title: z.string().max(200, 'Título máximo 200 caracteres').optional(),
  comment: z.string().min(10, 'Comentario mínimo 10 caracteres').max(2000, 'Comentario máximo 2000 caracteres'),
});

// Actualizar review (propia)
export const updateReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  title: z.string().max(200).optional().nullable(),
  comment: z.string().min(10).max(2000).optional(),
});

// Query params para listar reviews de un producto
export const listReviewsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  sortBy: z.enum(['newest', 'oldest', 'highest', 'lowest', 'helpful']).default('newest'),
});

// Query params para listar reviews de admin
export const listAdminReviewsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  productId: z.coerce.number().int().positive().optional(),
  userId: z.coerce.number().int().positive().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  sortBy: z.enum(['newest', 'oldest', 'highest', 'lowest', 'helpful']).default('newest'),
});

// Votar utilidad de review
export const voteHelpfulSchema = z.object({
  isHelpful: z.boolean(),
});

// Moderar review (admin)
export const moderateReviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

// ID params
export const reviewIdSchema = z.object({
  id: z.coerce.number().int().positive('ID de review requerido'),
});

export const productIdSchema = z.object({
  productId: z.coerce.number().int().positive('ID de producto requerido'),
});

// Types
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
export type ListAdminReviewsQuery = z.infer<typeof listAdminReviewsQuerySchema>;
export type VoteHelpfulInput = z.infer<typeof voteHelpfulSchema>;
export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>;
