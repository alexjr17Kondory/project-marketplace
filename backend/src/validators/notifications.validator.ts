import { z } from 'zod';

// Query params para listar notificaciones
export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  unreadOnly: z.coerce.boolean().default(false),
  type: z.enum(['REVIEW_AVAILABLE', 'ORDER_STATUS', 'PROMO', 'SYSTEM']).optional(),
});

// Marcar notificación como leída
export const markReadSchema = z.object({
  notificationIds: z.array(z.number().int().positive()).min(1),
});

// ID params
export const notificationIdSchema = z.object({
  id: z.coerce.number().int().positive('ID de notificación requerido'),
});

// Types
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
export type MarkReadInput = z.infer<typeof markReadSchema>;
