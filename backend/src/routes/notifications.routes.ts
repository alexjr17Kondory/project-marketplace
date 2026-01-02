import { Router } from 'express';
import * as notificationsController from '../controllers/notifications.controller';
import { validateQuery, validateParams, validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  listNotificationsQuerySchema,
  markReadSchema,
  notificationIdSchema,
} from '../validators/notifications.validator';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Listar notificaciones
router.get(
  '/',
  validateQuery(listNotificationsQuerySchema),
  notificationsController.getNotifications
);

// Contar no leídas
router.get(
  '/unread-count',
  notificationsController.getUnreadCount
);

// Marcar todas como leídas
router.post(
  '/mark-all-read',
  notificationsController.markAllAsRead
);

// Marcar múltiples como leídas
router.post(
  '/mark-read',
  validate(markReadSchema),
  notificationsController.markMultipleAsRead
);

// Obtener notificación por ID
router.get(
  '/:id',
  validateParams(notificationIdSchema),
  notificationsController.getNotificationById
);

// Marcar como leída
router.patch(
  '/:id/read',
  validateParams(notificationIdSchema),
  notificationsController.markAsRead
);

// Eliminar notificación
router.delete(
  '/:id',
  validateParams(notificationIdSchema),
  notificationsController.deleteNotification
);

export default router;
