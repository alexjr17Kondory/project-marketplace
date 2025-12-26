import { Router } from 'express';
import * as inventoryController from '../controllers/inventory-movements.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permissions.middleware';

const router = Router();

/**
 * @swagger
 * /api/inventory/stats:
 *   get:
 *     summary: Obtener estadísticas de inventario
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de inventario
 */
router.get('/stats', authenticate, requirePermission('inventory.view'), inventoryController.getStats);

/**
 * @swagger
 * /api/inventory/low-stock:
 *   get:
 *     summary: Obtener variantes con stock bajo
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de variantes con stock bajo
 */
router.get('/low-stock', authenticate, requirePermission('inventory.view'), inventoryController.getLowStock);

/**
 * @swagger
 * /api/inventory/summary:
 *   get:
 *     summary: Obtener resumen de movimientos por tipo
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Resumen de movimientos
 */
router.get('/summary', authenticate, requirePermission('inventory.view'), inventoryController.getSummary);

/**
 * @swagger
 * /api/inventory/movements:
 *   get:
 *     summary: Obtener movimientos de inventario
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: variantId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: productId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: movementType
 *         schema:
 *           type: string
 *           enum: [PURCHASE, SALE, ADJUSTMENT, TRANSFER_IN, TRANSFER_OUT, RETURN, DAMAGE, INITIAL]
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de movimientos
 */
router.get('/movements', authenticate, requirePermission('inventory.view'), inventoryController.getMovements);

/**
 * @swagger
 * /api/inventory/movements/variant/{variantId}:
 *   get:
 *     summary: Obtener movimientos de una variante específica
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de movimientos de la variante
 */
router.get('/movements/variant/:variantId', authenticate, requirePermission('inventory.view'), inventoryController.getVariantMovements);

/**
 * @swagger
 * /api/inventory/movements:
 *   post:
 *     summary: Crear un movimiento de inventario
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - variantId
 *               - movementType
 *               - quantity
 *             properties:
 *               variantId:
 *                 type: integer
 *               movementType:
 *                 type: string
 *                 enum: [PURCHASE, SALE, ADJUSTMENT, TRANSFER_IN, TRANSFER_OUT, RETURN, DAMAGE, INITIAL]
 *               quantity:
 *                 type: number
 *               reason:
 *                 type: string
 *               notes:
 *                 type: string
 *               unitCost:
 *                 type: number
 *     responses:
 *       201:
 *         description: Movimiento creado
 */
router.post('/movements', authenticate, requirePermission('inventory.manage'), inventoryController.createMovement);

/**
 * @swagger
 * /api/inventory/bulk-adjustment:
 *   post:
 *     summary: Ajuste masivo de inventario
 *     tags: [Inventory]
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
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     variantId:
 *                       type: integer
 *                     newStock:
 *                       type: integer
 *                     reason:
 *                       type: string
 *     responses:
 *       200:
 *         description: Resultados del ajuste
 */
router.post('/bulk-adjustment', authenticate, requirePermission('inventory.manage'), inventoryController.bulkAdjustment);

export default router;
