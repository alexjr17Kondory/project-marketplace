import { Router } from 'express';
import * as inputsController from '../controllers/inputs.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Inputs
 *   description: Gestión de insumos (inventario de materias primas) - Solo Admin
 */

// Todas las rutas requieren autenticación de admin
router.use(authenticate, requireAdmin);

/**
 * @swagger
 * /inputs:
 *   get:
 *     summary: Listar insumos con filtros (solo admin)
 *     tags: [Inputs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: inputTypeId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de insumos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere admin)
 *   post:
 *     summary: Crear insumo (solo admin)
 *     tags: [Inputs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Insumo creado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere admin)
 * /inputs/low-stock:
 *   get:
 *     summary: Obtener insumos con stock bajo (solo admin)
 *     tags: [Inputs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Insumos con stock bajo
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere admin)
 * /inputs/{id}:
 *   get:
 *     summary: Obtener insumo por ID (solo admin)
 *     tags: [Inputs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Insumo encontrado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere admin)
 *   put:
 *     summary: Actualizar insumo (solo admin)
 *     tags: [Inputs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Insumo actualizado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere admin)
 *   delete:
 *     summary: Eliminar insumo - soft delete (solo admin)
 *     tags: [Inputs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Insumo eliminado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere admin)
 * /inputs/{id}/recalculate-stock:
 *   post:
 *     summary: Recalcular stock desde lotes (solo admin)
 *     tags: [Inputs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stock recalculado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere admin)
 */
router.get('/', inputsController.getAllInputs);
router.get('/low-stock', inputsController.getLowStockInputs);
router.get('/:id', inputsController.getInputById);
router.post('/', inputsController.createInput);
router.put('/:id', inputsController.updateInput);
router.delete('/:id', inputsController.deleteInput);
router.post('/:id/recalculate-stock', inputsController.recalculateStock);

// Rutas para colores y variantes de insumos
router.post('/:id/colors', inputsController.addColorToInput);
router.delete('/:id/colors/:colorId', inputsController.removeColorFromInput);
router.get('/:id/variants', inputsController.getInputVariants);
router.post('/:id/regenerate-variants', inputsController.regenerateVariants);

// Rutas para variantes individuales
router.get('/variants/:variantId', inputsController.getInputVariantById);
router.put('/variants/:variantId', inputsController.updateInputVariant);
router.post('/variants/:variantId/stock', inputsController.updateVariantStock);
router.get('/variants/:variantId/movements', inputsController.getVariantMovements);

export default router;
