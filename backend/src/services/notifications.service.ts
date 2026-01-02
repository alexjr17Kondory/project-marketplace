import { Prisma, NotificationType } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';
import type { ListNotificationsQuery } from '../validators/notifications.validator';

// Tipos de respuesta
export interface NotificationResponse {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  referenceType: string | null;
  referenceId: number | null;
  isRead: boolean;
  createdAt: Date;
  // Datos adicionales para el frontend
  productImage?: string;
  productName?: string;
}

export interface PaginatedNotifications {
  data: NotificationResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    unreadCount: number;
  };
}

// ========== Crear Notificaciones ==========

// Crear notificación de review disponible
export async function createReviewAvailableNotification(
  userId: number,
  productId: number,
  productName: string
): Promise<void> {
  // Verificar si ya existe una notificación de este tipo para este producto
  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      type: NotificationType.REVIEW_AVAILABLE,
      referenceType: 'product',
      referenceId: productId,
      isRead: false,
    },
  });

  if (existing) {
    return; // Ya existe una notificación no leída
  }

  await prisma.notification.create({
    data: {
      userId,
      type: NotificationType.REVIEW_AVAILABLE,
      title: 'Deja tu opinión',
      message: `¿Qué te pareció "${productName}"? Tu opinión ayuda a otros compradores.`,
      referenceType: 'product',
      referenceId: productId,
    },
  });
}

// Crear notificaciones de review para todos los productos de una orden
export async function createReviewNotificationsForOrder(
  userId: number,
  orderId: number
): Promise<void> {
  // Obtener items de la orden
  const orderItems = await prisma.orderItem.findMany({
    where: { orderId },
    select: {
      productId: true,
      productName: true,
    },
    distinct: ['productId'],
  });

  // Verificar cuáles productos ya tienen review
  const existingReviews = await prisma.review.findMany({
    where: {
      userId,
      productId: { in: orderItems.map(i => i.productId) },
    },
    select: { productId: true },
  });

  const reviewedProductIds = new Set(existingReviews.map(r => r.productId));

  // Crear notificaciones para productos sin review
  for (const item of orderItems) {
    if (!reviewedProductIds.has(item.productId)) {
      await createReviewAvailableNotification(userId, item.productId, item.productName);
    }
  }
}

// Crear notificación de cambio de estado de orden
export async function createOrderStatusNotification(
  userId: number,
  orderId: number,
  orderNumber: string,
  newStatus: string,
  statusLabel: string
): Promise<void> {
  await prisma.notification.create({
    data: {
      userId,
      type: NotificationType.ORDER_STATUS,
      title: `Pedido ${orderNumber}`,
      message: `Tu pedido ha cambiado a: ${statusLabel}`,
      referenceType: 'order',
      referenceId: orderId,
    },
  });
}

// ========== Consultar Notificaciones ==========

// Listar notificaciones del usuario
export async function listNotifications(
  userId: number,
  query: ListNotificationsQuery
): Promise<PaginatedNotifications> {
  const { page, limit, unreadOnly, type } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.NotificationWhereInput = {
    userId,
    ...(unreadOnly && { isRead: false }),
    ...(type && { type }),
  };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  // Enriquecer con datos de productos si es notificación de review
  const enrichedNotifications: NotificationResponse[] = await Promise.all(
    notifications.map(async (n) => {
      const base: NotificationResponse = {
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        referenceType: n.referenceType,
        referenceId: n.referenceId,
        isRead: n.isRead,
        createdAt: n.createdAt,
      };

      if (n.type === NotificationType.REVIEW_AVAILABLE && n.referenceId) {
        const product = await prisma.product.findUnique({
          where: { id: n.referenceId },
          select: { name: true, images: true },
        });
        if (product) {
          base.productName = product.name;
          base.productImage = Array.isArray(product.images) ? (product.images as string[])[0] : undefined;
        }
      }

      return base;
    })
  );

  return {
    data: enrichedNotifications,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    },
  };
}

// Contar notificaciones no leídas
export async function countUnread(userId: number): Promise<number> {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

// Obtener notificación por ID
export async function getNotificationById(
  userId: number,
  notificationId: number
): Promise<NotificationResponse> {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new NotFoundError('Notificación no encontrada');
  }

  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    referenceType: notification.referenceType,
    referenceId: notification.referenceId,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  };
}

// ========== Acciones ==========

// Marcar notificación como leída
export async function markAsRead(userId: number, notificationId: number): Promise<void> {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new NotFoundError('Notificación no encontrada');
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

// Marcar múltiples notificaciones como leídas
export async function markMultipleAsRead(userId: number, notificationIds: number[]): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      id: { in: notificationIds },
      userId,
    },
    data: { isRead: true },
  });
}

// Marcar todas como leídas
export async function markAllAsRead(userId: number): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

// Eliminar notificación
export async function deleteNotification(userId: number, notificationId: number): Promise<void> {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new NotFoundError('Notificación no encontrada');
  }

  await prisma.notification.delete({ where: { id: notificationId } });
}

// Eliminar notificaciones antiguas (para limpieza periódica)
export async function deleteOldNotifications(daysOld: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.notification.deleteMany({
    where: {
      isRead: true,
      createdAt: { lt: cutoffDate },
    },
  });

  return result.count;
}
