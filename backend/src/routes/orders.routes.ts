import { Router } from 'express';
import * as ordersController from '../controllers/orders.controller';
import { validate, validateQuery, validateParams } from '../middleware/validate.middleware';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  listOrdersQuerySchema,
  orderIdSchema,
  orderNumberSchema,
} from '../validators/orders.validator';

const router = Router();

// ==================== RUTAS DE USUARIO ====================

/**
 * @swagger
 * /orders/my:
 *   get:
 *     summary: Obtener mis pedidos
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
 *     responses:
 *       200:
 *         description: Lista de mis pedidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 meta:
 *                   type: object
 */
router.get(
  '/my',
  authenticate,
  validateQuery(listOrdersQuerySchema),
  ordersController.getMyOrders
);

/**
 * @swagger
 * /orders/my/{id}:
 *   get:
 *     summary: Obtener mi pedido por ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalles del pedido
 *       404:
 *         description: Pedido no encontrado
 */
router.get(
  '/my/:id',
  authenticate,
  validateParams(orderIdSchema),
  ordersController.getMyOrderById
);

/**
 * @swagger
 * /orders/my/number/{orderNumber}:
 *   get:
 *     summary: Obtener mi pedido por número de orden
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *         example: ORD-241130-0001
 *     responses:
 *       200:
 *         description: Detalles del pedido
 *       404:
 *         description: Pedido no encontrado
 */
router.get(
  '/my/number/:orderNumber',
  authenticate,
  validateParams(orderNumberSchema),
  ordersController.getMyOrderByNumber
);

/**
 * @swagger
 * /orders/my/{id}/cancel:
 *   post:
 *     summary: Cancelar mi pedido
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pedido cancelado exitosamente
 *       400:
 *         description: Solo se pueden cancelar pedidos pendientes
 *       404:
 *         description: Pedido no encontrado
 */
router.post(
  '/my/:id/cancel',
  authenticate,
  validateParams(orderIdSchema),
  ordersController.cancelMyOrder
);

/**
 * @swagger
 * /orders/confirm-payment/{orderNumber}:
 *   post:
 *     summary: Confirmar pago con Wompi (polling)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Alternativa al webhook de Wompi. El frontend llama este endpoint
 *       después de que el usuario regresa del pago, enviando el transactionId.
 *       El backend verifica el pago directamente con Wompi y actualiza la orden.
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *         example: ORD-241130-0001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionId
 *             properties:
 *               transactionId:
 *                 type: string
 *                 description: ID de la transacción de Wompi
 *                 example: "11152843-1764517396-43470"
 *     responses:
 *       200:
 *         description: Pago confirmado exitosamente
 *       400:
 *         description: Pago rechazado o pendiente
 *       404:
 *         description: Orden no encontrada
 */
router.post(
  '/confirm-payment/:orderNumber',
  authenticate,
  validateParams(orderNumberSchema),
  ordersController.confirmPayment
);

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Crear nuevo pedido
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - shipping
 *               - paymentMethod
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - size
 *                     - color
 *                     - quantity
 *                   properties:
 *                     productId:
 *                       type: string
 *                     size:
 *                       type: string
 *                     color:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     customization:
 *                       type: object
 *                       properties:
 *                         text:
 *                           type: string
 *                         image:
 *                           type: string
 *                         position:
 *                           type: string
 *                         notes:
 *                           type: string
 *               shipping:
 *                 type: object
 *                 required:
 *                   - name
 *                   - phone
 *                   - email
 *                   - address
 *                   - city
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: Juan Pérez
 *                   phone:
 *                     type: string
 *                     example: "+57 300 123 4567"
 *                   email:
 *                     type: string
 *                     example: juan@email.com
 *                   address:
 *                     type: string
 *                     example: Calle 123 # 45-67
 *                   city:
 *                     type: string
 *                     example: Medellín
 *                   department:
 *                     type: string
 *                     example: Antioquia
 *                   postalCode:
 *                     type: string
 *                   country:
 *                     type: string
 *                     default: Colombia
 *                   notes:
 *                     type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, transfer, card, nequi, daviplata]
 *               paymentRef:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pedido creado exitosamente
 *       400:
 *         description: Error de validación o stock insuficiente
 */
router.post(
  '/',
  authenticate,
  validate(createOrderSchema),
  ordersController.createOrder
);

// ==================== RUTAS DE ADMIN ====================

/**
 * @swagger
 * /orders/stats:
 *   get:
 *     summary: Obtener estadísticas de pedidos (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de pedidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     byStatus:
 *                       type: object
 *                     revenue:
 *                       type: number
 */
router.get(
  '/stats',
  authenticate,
  requireAdmin,
  ordersController.getOrderStats
);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Listar todos los pedidos (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por número de orden o cliente
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, total, status, orderNumber]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Lista de pedidos
 */
router.get(
  '/',
  authenticate,
  requireAdmin,
  validateQuery(listOrdersQuerySchema),
  ordersController.listOrders
);

/**
 * @swagger
 * /orders/number/{orderNumber}:
 *   get:
 *     summary: Obtener pedido por número de orden (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalles del pedido
 *       404:
 *         description: Pedido no encontrado
 */
router.get(
  '/number/:orderNumber',
  authenticate,
  requireAdmin,
  validateParams(orderNumberSchema),
  ordersController.getOrderByNumber
);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Obtener pedido por ID (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalles del pedido
 *       404:
 *         description: Pedido no encontrado
 */
router.get(
  '/:id',
  authenticate,
  requireAdmin,
  validateParams(orderIdSchema),
  ordersController.getOrderById
);

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Actualizar estado del pedido (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
 *               trackingNumber:
 *                 type: string
 *                 description: Número de guía (para estado SHIPPED)
 *               trackingUrl:
 *                 type: string
 *                 description: URL de rastreo
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 *       400:
 *         description: Transición de estado inválida
 *       404:
 *         description: Pedido no encontrado
 */
router.patch(
  '/:id/status',
  authenticate,
  requireAdmin,
  validateParams(orderIdSchema),
  validate(updateOrderStatusSchema),
  ordersController.updateOrderStatus
);

export default router;
