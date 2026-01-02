import { Response, NextFunction } from 'express';
import * as notificationsService from '../services/notifications.service';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';

// Listar notificaciones del usuario
export async function getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await notificationsService.listNotifications(req.user!.userId, req.query as any);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

// Contar notificaciones no leídas
export async function getUnreadCount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const count = await notificationsService.countUnread(req.user!.userId);

    res.json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error) {
    next(error);
  }
}

// Obtener notificación por ID
export async function getNotificationById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const notification = await notificationsService.getNotificationById(req.user!.userId, id);

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}

// Marcar notificación como leída
export async function markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    await notificationsService.markAsRead(req.user!.userId, id);

    res.json({
      success: true,
      message: 'Notificación marcada como leída',
    });
  } catch (error) {
    next(error);
  }
}

// Marcar múltiples como leídas
export async function markMultipleAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await notificationsService.markMultipleAsRead(req.user!.userId, req.body.notificationIds);

    res.json({
      success: true,
      message: 'Notificaciones marcadas como leídas',
    });
  } catch (error) {
    next(error);
  }
}

// Marcar todas como leídas
export async function markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await notificationsService.markAllAsRead(req.user!.userId);

    res.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas',
    });
  } catch (error) {
    next(error);
  }
}

// Eliminar notificación
export async function deleteNotification(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    await notificationsService.deleteNotification(req.user!.userId, id);

    res.json({
      success: true,
      message: 'Notificación eliminada',
    });
  } catch (error) {
    next(error);
  }
}
