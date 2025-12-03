import { Router } from 'express';
import * as inputBatchesController from '../controllers/input-batches.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: InputBatches
 *   description: Gestión de lotes de insumos y movimientos de inventario (FIFO) - Solo Admin
 */

// Todas las rutas requieren autenticación de admin
router.use(authenticate, requireAdmin);

/**
 * @swagger
 * /input-batches/input/{inputId}:
 *   get:
 *     summary: Listar lotes por insumo (solo admin)
 *     tags: [InputBatches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de lotes
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere admin)
 *   post:
 *     summary: Crear lote de entrada (solo admin)
 *     tags: [InputBatches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Lote creado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere admin)
 * /input-batches/{id}:
 *   get:
 *     summary: Obtener lote por ID (solo admin)
 *     tags: [InputBatches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lote encontrado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere admin)
 *   put:
 *     summary: Actualizar lote (solo admin)
 *     tags: [InputBatches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lote actualizado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere admin)
 * /input-batches/{id}/adjust:
 *   post:
 *     summary: Ajustar cantidad - correcciones (solo admin)
 *     tags: [InputBatches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cantidad ajustada
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere admin)
 * /input-batches/{id}/reserve:
 *   post:
 *     summary: Reservar para pedido (solo admin)
 *     tags: [InputBatches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cantidad reservada
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere admin)
 * /input-batches/{id}/release:
 *   post:
 *     summary: Liberar reserva (solo admin)
 *     tags: [InputBatches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reserva liberada
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere admin)
 * /input-batches/{id}/output:
 *   post:
 *     summary: Registrar salida de producción (solo admin)
 *     tags: [InputBatches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Salida registrada
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere admin)
 * /input-batches/input/{inputId}/movements:
 *   get:
 *     summary: Historial de movimientos por insumo (solo admin)
 *     tags: [InputBatches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historial de movimientos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere admin)
 * /input-batches/{batchId}/movements:
 *   get:
 *     summary: Historial de movimientos por lote (solo admin)
 *     tags: [InputBatches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historial de movimientos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere admin)
 */

// Gestión de lotes
router.get('/input/:inputId', inputBatchesController.getBatchesByInputId);
router.get('/:id', inputBatchesController.getBatchById);
router.post('/input/:inputId', inputBatchesController.createBatch);
router.put('/:id', inputBatchesController.updateBatch);

// Operaciones de inventario
router.post('/:id/adjust', inputBatchesController.adjustBatchQuantity);
router.post('/:id/reserve', inputBatchesController.reserveFromBatch);
router.post('/:id/release', inputBatchesController.releaseReservation);
router.post('/:id/output', inputBatchesController.recordOutput);

// Movimientos
router.get('/input/:inputId/movements', inputBatchesController.getMovementsByInputId);
router.get('/:batchId/movements', inputBatchesController.getMovementsByBatchId);

export default router;
