// Tipos para el sistema de notificaciones

export type NotificationType = 'REVIEW_AVAILABLE' | 'ORDER_STATUS' | 'PROMO' | 'SYSTEM';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  referenceType: string | null;
  referenceId: number | null;
  isRead: boolean;
  createdAt: string;
  // Datos adicionales para reviews
  productImage?: string;
  productName?: string;
}

export interface PaginatedNotifications {
  data: Notification[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    unreadCount: number;
  };
}

export interface ListNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: NotificationType;
}
