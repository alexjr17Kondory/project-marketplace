import api from './api.service';
import type {
  Notification,
  PaginatedNotifications,
  ListNotificationsParams,
} from '../types/notification';

// Listar notificaciones del usuario
export async function getNotifications(
  params?: ListNotificationsParams
): Promise<PaginatedNotifications> {
  const response = await api.get('/notifications', params as Record<string, any>);
  return {
    data: (response as any).data || [],
    meta: (response as any).meta || { total: 0, page: 1, limit: 10, totalPages: 0, unreadCount: 0 },
  };
}

// Contar notificaciones no leídas
export async function getUnreadCount(): Promise<number> {
  const response = await api.get('/notifications/unread-count');
  return (response as any).data?.unreadCount ?? 0;
}

// Obtener notificación por ID
export async function getNotificationById(id: number): Promise<Notification> {
  const response = await api.get(`/notifications/${id}`);
  return (response as any).data;
}

// Marcar notificación como leída
export async function markAsRead(id: number): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

// Marcar múltiples como leídas
export async function markMultipleAsRead(notificationIds: number[]): Promise<void> {
  await api.post('/notifications/mark-read', { notificationIds });
}

// Marcar todas como leídas
export async function markAllAsRead(): Promise<void> {
  await api.post('/notifications/mark-all-read');
}

// Eliminar notificación
export async function deleteNotification(id: number): Promise<void> {
  await api.delete(`/notifications/${id}`);
}

export default {
  getNotifications,
  getUnreadCount,
  getNotificationById,
  markAsRead,
  markMultipleAsRead,
  markAllAsRead,
  deleteNotification,
};
