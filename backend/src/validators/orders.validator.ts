import { z } from 'zod';

// Item del carrito/pedido
const orderItemSchema = z.object({
  productId: z.coerce.number().int().positive('ID de producto requerido'),
  size: z.string().min(1, 'Talla requerida'),
  color: z.string().min(1, 'Color requerido'),
  quantity: z.coerce.number().int().positive('Cantidad debe ser mayor a 0'),
  customization: z.object({
    text: z.string().optional(),
    image: z.string().url().optional(),
    position: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
});

// Información de envío
const shippingInfoSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  phone: z.string().min(7, 'Teléfono requerido'),
  email: z.string().email('Email inválido'),
  address: z.string().min(5, 'Dirección requerida'),
  city: z.string().min(2, 'Ciudad requerida'),
  department: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default('Colombia'),
  notes: z.string().optional(),
});

// Crear pedido
export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Se requiere al menos un producto'),
  shipping: shippingInfoSchema,
  paymentMethod: z.enum(['cash', 'transfer', 'card', 'nequi', 'daviplata', 'wompi', 'pickup', 'credit_card', 'debit_card', 'pse']),
  paymentRef: z.string().optional(),
  notes: z.string().optional(),
});

// Actualizar estado del pedido (admin)
export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

// Query params para listar pedidos
export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  userId: z.coerce.number().int().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'total', 'status', 'orderNumber']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ID param
export const orderIdSchema = z.object({
  id: z.string().min(1, 'ID de pedido requerido'),
});

// Número de orden param
export const orderNumberSchema = z.object({
  orderNumber: z.string().min(1, 'Número de orden requerido'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type ShippingInfo = z.infer<typeof shippingInfoSchema>;
