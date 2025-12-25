import { Router } from 'express';
import * as paymentsController from '../controllers/payments.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// ==================== RUTAS DE USUARIO ====================

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Crear intento de pago
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - paymentMethod
 *               - amount
 *             properties:
 *               orderId:
 *                 type: integer
 *               transactionId:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 example: wompi
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: COP
 *               payerName:
 *                 type: string
 *               payerEmail:
 *                 type: string
 *               payerPhone:
 *                 type: string
 *               payerDocument:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pago iniciado exitosamente
 */
router.post(
  '/',
  authenticate,
  paymentsController.createPayment
);

/**
 * @swagger
 * /payments/order/{orderId}:
 *   get:
 *     summary: Obtener pagos de mi pedido
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de pagos del pedido
 */
router.get(
  '/order/:orderId',
  authenticate,
  paymentsController.getMyOrderPayments
);

/**
 * @swagger
 * /payments/{id}:
 *   patch:
 *     summary: Actualizar mi pago (subir comprobante)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receiptUrl:
 *                 type: string
 *               receiptData:
 *                 type: string
 *                 description: Comprobante en base64
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pago actualizado exitosamente
 */
router.patch(
  '/:id',
  authenticate,
  paymentsController.updateMyPayment
);

// ==================== RUTAS DE ADMIN ====================

/**
 * @swagger
 * /payments/stats:
 *   get:
 *     summary: Obtener estadísticas de pagos (Admin)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de pagos
 */
router.get(
  '/stats',
  authenticate,
  requireAdmin,
  paymentsController.getPaymentStats
);

/**
 * @swagger
 * /payments/all:
 *   get:
 *     summary: Listar todos los pagos (Admin)
 *     tags: [Payments]
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
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSING, APPROVED, DECLINED, FAILED, CANCELLED, EXPIRED, REFUNDED, PARTIAL_REFUND]
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: transactionId
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
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [initiatedAt, amount, status]
 *           default: initiatedAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Lista de pagos
 */
router.get(
  '/all',
  authenticate,
  requireAdmin,
  paymentsController.listPayments
);

/**
 * @swagger
 * /payments/order/{orderId}/all:
 *   get:
 *     summary: Obtener todos los pagos de un pedido (Admin)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de pagos del pedido
 */
router.get(
  '/order/:orderId/all',
  authenticate,
  requireAdmin,
  paymentsController.getOrderPayments
);

/**
 * @swagger
 * /payments/{id}/admin:
 *   get:
 *     summary: Obtener pago por ID (Admin)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalles del pago
 */
router.get(
  '/:id/admin',
  authenticate,
  requireAdmin,
  paymentsController.getPaymentById
);

/**
 * @swagger
 * /payments/transaction/{transactionId}:
 *   get:
 *     summary: Obtener pago por transactionId (Admin)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalles del pago
 */
router.get(
  '/transaction/:transactionId',
  authenticate,
  requireAdmin,
  paymentsController.getPaymentByTransactionId
);

/**
 * @swagger
 * /payments/{id}/admin:
 *   patch:
 *     summary: Actualizar pago (Admin)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, PROCESSING, APPROVED, DECLINED, FAILED, CANCELLED, EXPIRED]
 *               transactionId:
 *                 type: string
 *               receiptUrl:
 *                 type: string
 *               receiptData:
 *                 type: string
 *               failureReason:
 *                 type: string
 *               failureCode:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pago actualizado exitosamente
 */
router.patch(
  '/:id/admin',
  authenticate,
  requireAdmin,
  paymentsController.updatePayment
);

/**
 * @swagger
 * /payments/{id}/verify:
 *   post:
 *     summary: Verificar pago manualmente (Admin)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - approved
 *             properties:
 *               approved:
 *                 type: boolean
 *                 description: true para aprobar, false para rechazar
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pago verificado exitosamente
 */
router.post(
  '/:id/verify',
  authenticate,
  requireAdmin,
  paymentsController.verifyPayment
);

/**
 * @swagger
 * /payments/{id}/refund:
 *   post:
 *     summary: Reembolsar pago (Admin)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Monto a reembolsar (si no se especifica, reembolso completo)
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reembolso procesado exitosamente
 */
router.post(
  '/:id/refund',
  authenticate,
  requireAdmin,
  paymentsController.refundPayment
);

/**
 * @swagger
 * /payments/{id}/cancel:
 *   post:
 *     summary: Cancelar pago (Admin)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pago cancelado exitosamente
 */
router.post(
  '/:id/cancel',
  authenticate,
  requireAdmin,
  paymentsController.cancelPayment
);

export default router;
