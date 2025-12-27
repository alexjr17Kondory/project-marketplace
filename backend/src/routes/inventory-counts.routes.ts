import { Router } from 'express';
import * as inventoryCountsController from '../controllers/inventory-counts.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permissions.middleware';

const router = Router();

/**
 * @swagger
 * /api/inventory-counts:
 *   get:
 *     summary: Obtener todos los conteos de inventario
 *     tags: [InventoryCounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, IN_PROGRESS, PENDING_APPROVAL, APPROVED, CANCELLED]
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
 *         description: Lista de conteos de inventario
 */
router.get('/', authenticate, requirePermission('inventory.view'), inventoryCountsController.getInventoryCounts);

/**
 * @swagger
 * /api/inventory-counts/stats:
 *   get:
 *     summary: Obtener estadísticas de conteos
 *     tags: [InventoryCounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas
 */
router.get('/stats', authenticate, requirePermission('inventory.view'), inventoryCountsController.getStats);

/**
 * @swagger
 * /api/inventory-counts/{id}:
 *   get:
 *     summary: Obtener un conteo por ID
 *     tags: [InventoryCounts]
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
 *         description: Conteo encontrado
 *       404:
 *         description: Conteo no encontrado
 */
router.get('/:id', authenticate, requirePermission('inventory.view'), inventoryCountsController.getInventoryCountById);

/**
 * @swagger
 * /api/inventory-counts:
 *   post:
 *     summary: Crear un conteo de inventario
 *     tags: [InventoryCounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - countType
 *             properties:
 *               countType:
 *                 type: string
 *                 enum: [FULL, PARTIAL]
 *               countDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *               inputIds:
 *                 type: array
 *                 description: Solo para conteo parcial
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: Conteo creado
 */
router.post('/', authenticate, requirePermission('inventory.manage'), inventoryCountsController.createInventoryCount);

/**
 * @swagger
 * /api/inventory-counts/{id}/start:
 *   patch:
 *     summary: Iniciar conteo (cambiar a IN_PROGRESS)
 *     tags: [InventoryCounts]
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
 *         description: Conteo iniciado
 */
router.patch('/:id/start', authenticate, requirePermission('inventory.manage'), inventoryCountsController.startCount);

/**
 * @swagger
 * /api/inventory-counts/{id}/items/{itemId}:
 *   patch:
 *     summary: Actualizar cantidad contada de un item
 *     tags: [InventoryCounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: itemId
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
 *               - countedQuantity
 *             properties:
 *               countedQuantity:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item actualizado
 */
router.patch('/:id/items/:itemId', authenticate, requirePermission('inventory.manage'), inventoryCountsController.updateItemCount);

/**
 * @swagger
 * /api/inventory-counts/{id}/submit:
 *   patch:
 *     summary: Enviar conteo a aprobación
 *     tags: [InventoryCounts]
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
 *         description: Conteo enviado a aprobación
 */
router.patch('/:id/submit', authenticate, requirePermission('inventory.manage'), inventoryCountsController.submitForApproval);

/**
 * @swagger
 * /api/inventory-counts/{id}/approve:
 *   patch:
 *     summary: Aprobar conteo y aplicar ajustes
 *     tags: [InventoryCounts]
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
 *         description: Conteo aprobado y ajustes aplicados
 */
router.patch('/:id/approve', authenticate, requirePermission('inventory.manage'), inventoryCountsController.approveCount);

/**
 * @swagger
 * /api/inventory-counts/{id}/cancel:
 *   patch:
 *     summary: Cancelar conteo
 *     tags: [InventoryCounts]
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
 *         description: Conteo cancelado
 */
router.patch('/:id/cancel', authenticate, requirePermission('inventory.manage'), inventoryCountsController.cancelCount);

/**
 * @swagger
 * /api/inventory-counts/{id}:
 *   delete:
 *     summary: Eliminar conteo (solo DRAFT o CANCELLED)
 *     tags: [InventoryCounts]
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
 *         description: Conteo eliminado
 */
router.delete('/:id', authenticate, requirePermission('inventory.manage'), inventoryCountsController.deleteInventoryCount);

export default router;
