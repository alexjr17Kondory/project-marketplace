import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permissions.middleware';
import * as controller from '../controllers/inventory-conversions.controller';

const router = Router();

// Estadísticas (antes de las rutas con :id para evitar conflicto)
router.get('/stats', authenticate, requirePermission('inventory.view'), controller.getConversionStats);

// CRUD básico
router.get('/', authenticate, requirePermission('inventory.view'), controller.listConversions);
router.get('/:id', authenticate, requirePermission('inventory.view'), controller.getConversionById);
router.post('/', authenticate, requirePermission('inventory.manage'), controller.createConversion);
router.delete('/:id', authenticate, requirePermission('inventory.manage'), controller.deleteConversion);

// Items de entrada (insumos)
router.post('/:id/input-items', authenticate, requirePermission('inventory.manage'), controller.addInputItem);
router.patch('/:id/input-items/:itemId', authenticate, requirePermission('inventory.manage'), controller.updateInputItem);
router.delete('/:id/input-items/:itemId', authenticate, requirePermission('inventory.manage'), controller.removeInputItem);

// Items de salida (productos)
router.post('/:id/output-items', authenticate, requirePermission('inventory.manage'), controller.addOutputItem);
router.patch('/:id/output-items/:itemId', authenticate, requirePermission('inventory.manage'), controller.updateOutputItem);
router.delete('/:id/output-items/:itemId', authenticate, requirePermission('inventory.manage'), controller.removeOutputItem);

// Acciones de workflow
router.post('/:id/submit', authenticate, requirePermission('inventory.manage'), controller.submitForApproval);
router.post('/:id/approve', authenticate, requirePermission('inventory.manage'), controller.approveConversion);
router.post('/:id/cancel', authenticate, requirePermission('inventory.manage'), controller.cancelConversion);

export default router;
