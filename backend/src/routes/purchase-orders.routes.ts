import { Router } from 'express';
import * as purchaseOrdersController from '../controllers/purchase-orders.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permissions.middleware';

const router = Router();

/**
 * @swagger
 * /api/purchase-orders:
 *   get:
 *     summary: Obtener todas las órdenes de compra
 *     tags: [PurchaseOrders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, SENT, CONFIRMED, PARTIAL, RECEIVED, CANCELLED]
 *       - in: query
 *         name: supplierId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Lista de órdenes de compra
 */
router.get('/', authenticate, requirePermission('inventory.view'), purchaseOrdersController.getPurchaseOrders);

/**
 * @swagger
 * /api/purchase-orders/stats:
 *   get:
 *     summary: Obtener estadísticas de órdenes de compra
 *     tags: [PurchaseOrders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas
 */
router.get('/stats', authenticate, requirePermission('inventory.view'), purchaseOrdersController.getStats);

/**
 * @swagger
 * /api/purchase-orders/generate-number:
 *   get:
 *     summary: Generar número de orden
 *     tags: [PurchaseOrders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Número generado
 */
router.get('/generate-number', authenticate, requirePermission('inventory.manage'), purchaseOrdersController.generateNumber);

/**
 * @swagger
 * /api/purchase-orders/{id}:
 *   get:
 *     summary: Obtener una orden por ID
 *     tags: [PurchaseOrders]
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
 *         description: Orden encontrada
 *       404:
 *         description: Orden no encontrada
 */
router.get('/:id', authenticate, requirePermission('inventory.view'), purchaseOrdersController.getPurchaseOrderById);

/**
 * @swagger
 * /api/purchase-orders:
 *   post:
 *     summary: Crear una orden de compra
 *     tags: [PurchaseOrders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - supplierId
 *               - items
 *             properties:
 *               supplierId:
 *                 type: integer
 *               expectedDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     variantId:
 *                       type: integer
 *                     inputId:
 *                       type: integer
 *                     description:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unitCost:
 *                       type: number
 *     responses:
 *       201:
 *         description: Orden creada
 */
router.post('/', authenticate, requirePermission('inventory.manage'), purchaseOrdersController.createPurchaseOrder);

/**
 * @swagger
 * /api/purchase-orders/{id}:
 *   put:
 *     summary: Actualizar una orden (solo en DRAFT)
 *     tags: [PurchaseOrders]
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
 *         description: Orden actualizada
 */
router.put('/:id', authenticate, requirePermission('inventory.manage'), purchaseOrdersController.updatePurchaseOrder);

/**
 * @swagger
 * /api/purchase-orders/{id}/status:
 *   patch:
 *     summary: Cambiar estado de la orden
 *     tags: [PurchaseOrders]
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [DRAFT, SENT, CONFIRMED, PARTIAL, RECEIVED, CANCELLED]
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
router.patch('/:id/status', authenticate, requirePermission('inventory.manage'), purchaseOrdersController.updateStatus);

/**
 * @swagger
 * /api/purchase-orders/{id}/receive:
 *   post:
 *     summary: Recibir items de la orden
 *     tags: [PurchaseOrders]
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
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     itemId:
 *                       type: integer
 *                     quantityReceived:
 *                       type: number
 *     responses:
 *       200:
 *         description: Items recibidos
 */
router.post('/:id/receive', authenticate, requirePermission('inventory.manage'), purchaseOrdersController.receiveItems);

/**
 * @swagger
 * /api/purchase-orders/{id}:
 *   delete:
 *     summary: Eliminar orden (solo DRAFT o CANCELLED)
 *     tags: [PurchaseOrders]
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
 *         description: Orden eliminada
 */
router.delete('/:id', authenticate, requirePermission('inventory.manage'), purchaseOrdersController.deletePurchaseOrder);

export default router;
