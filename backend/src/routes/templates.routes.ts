import { Router } from 'express';
import * as templatesController from '../controllers/templates.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/templates/public
 * @desc    Listar templates activos (para personalizador)
 * @access  Public
 */
router.get(
  '/public',
  templatesController.listPublicTemplates
);

/**
 * @route   GET /api/templates
 * @desc    Listar todos los templates (admin)
 * @access  Private/Admin
 */
router.get(
  '/',
  authenticate,
  requireAdmin,
  templatesController.listTemplates
);

/**
 * @route   GET /api/templates/type/:typeSlug
 * @desc    Listar templates por tipo de producto (para personalizador)
 * @access  Public
 */
router.get(
  '/type/:typeSlug',
  templatesController.getTemplatesByType
);

/**
 * @route   GET /api/templates/:id
 * @desc    Obtener template por ID
 * @access  Public
 */
router.get(
  '/:id',
  templatesController.getTemplateById
);

/**
 * @route   POST /api/templates
 * @desc    Crear template
 * @access  Private/Admin
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  templatesController.createTemplate
);

/**
 * @route   PUT /api/templates/:id
 * @desc    Actualizar template
 * @access  Private/Admin
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  templatesController.updateTemplate
);

/**
 * @route   DELETE /api/templates/:id
 * @desc    Eliminar template
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  templatesController.deleteTemplate
);

export default router;
