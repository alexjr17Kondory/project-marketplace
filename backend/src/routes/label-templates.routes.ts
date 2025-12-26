import { Router } from 'express';
import * as labelTemplatesController from '../controllers/label-templates.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permissions.middleware';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticate);

// ==================== PLANTILLAS ====================

/**
 * GET /api/label-templates
 * Obtener todas las plantillas de etiquetas
 * Query params: includeZones (boolean)
 * Permisos: settings.view
 */
router.get(
  '/',
  requirePermission('settings.view'),
  labelTemplatesController.getLabelTemplates
);

/**
 * GET /api/label-templates/:id
 * Obtener plantilla por ID
 * Permisos: settings.view
 */
router.get(
  '/:id',
  requirePermission('settings.view'),
  labelTemplatesController.getLabelTemplateById
);

/**
 * GET /api/label-templates/product-type/:productTypeId
 * Obtener plantilla para un tipo de producto
 * Permisos: settings.view
 */
router.get(
  '/product-type/:productTypeId',
  requirePermission('settings.view'),
  labelTemplatesController.getLabelTemplateForProductType
);

/**
 * POST /api/label-templates
 * Crear nueva plantilla
 * Permisos: settings.edit
 */
router.post(
  '/',
  requirePermission('settings.edit'),
  labelTemplatesController.createLabelTemplate
);

/**
 * PATCH /api/label-templates/:id
 * Actualizar plantilla
 * Permisos: settings.edit
 */
router.patch(
  '/:id',
  requirePermission('settings.edit'),
  labelTemplatesController.updateLabelTemplate
);

/**
 * DELETE /api/label-templates/:id
 * Eliminar plantilla
 * Permisos: settings.edit
 */
router.delete(
  '/:id',
  requirePermission('settings.edit'),
  labelTemplatesController.deleteLabelTemplate
);

/**
 * POST /api/label-templates/:id/duplicate
 * Duplicar plantilla
 * Body: { name: string }
 * Permisos: settings.edit
 */
router.post(
  '/:id/duplicate',
  requirePermission('settings.edit'),
  labelTemplatesController.duplicateLabelTemplate
);

// ==================== ZONAS ====================

/**
 * POST /api/label-templates/:templateId/zones
 * Crear zona en una plantilla
 * Permisos: settings.edit
 */
router.post(
  '/:templateId/zones',
  requirePermission('settings.edit'),
  labelTemplatesController.createLabelZone
);

/**
 * PATCH /api/label-templates/zones/:zoneId
 * Actualizar zona
 * Permisos: settings.edit
 */
router.patch(
  '/zones/:zoneId',
  requirePermission('settings.edit'),
  labelTemplatesController.updateLabelZone
);

/**
 * PATCH /api/label-templates/:templateId/zones/batch
 * Actualizar múltiples zonas
 * Body: { zones: [{ id: number, data: {...} }] }
 * Permisos: settings.edit
 */
router.patch(
  '/:templateId/zones/batch',
  requirePermission('settings.edit'),
  labelTemplatesController.updateLabelZones
);

/**
 * DELETE /api/label-templates/zones/:zoneId
 * Eliminar zona
 * Permisos: settings.edit
 */
router.delete(
  '/zones/:zoneId',
  requirePermission('settings.edit'),
  labelTemplatesController.deleteLabelZone
);

export default router;
