import { Router } from 'express';
import * as variantsController from '../controllers/variants.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission, requireAnyPermission } from '../middleware/permissions.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/variants
 * Listar variantes con filtros
 * Requiere: products.view
 */
router.get('/', requirePermission('products.view'), variantsController.listVariants);

/**
 * POST /api/variants
 * Crear una variante manualmente
 * Requiere: products.create
 */
router.post('/', requirePermission('products.create'), variantsController.createVariant);

/**
 * GET /api/variants/barcode/:barcode
 * Buscar variante por código de barras (CRÍTICO PARA POS)
 * Requiere: products.view O pos.access
 */
router.get(
  '/barcode/:barcode',
  requireAnyPermission('products.view', 'pos.access'),
  variantsController.getVariantByBarcode
);

/**
 * GET /api/variants/sku/:sku
 * Buscar variante por SKU
 * Requiere: products.view
 */
router.get('/sku/:sku', requirePermission('products.view'), variantsController.getVariantBySku);

/**
 * GET /api/variants/lookup
 * Buscar variante por productId, colorHex y sizeName
 * Útil para verificar stock desde el carrito
 * Requiere: autenticación (cualquier usuario)
 */
router.get('/lookup', variantsController.getVariantByProductColorSize);

/**
 * GET /api/variants/low-stock
 * Obtener variantes con stock bajo
 * Requiere: products.view
 */
router.get(
  '/low-stock',
  requirePermission('products.view'),
  variantsController.getLowStock
);

/**
 * GET /api/variants/products
 * Obtener solo variantes de PRODUCTOS (no templates) - consulta rápida
 * Requiere: products.view
 */
router.get(
  '/products',
  requirePermission('products.view'),
  variantsController.getProductVariants
);

/**
 * GET /api/variants/templates
 * Obtener solo variantes de TEMPLATES (plantillas) - con stock calculado
 * Requiere: products.view
 */
router.get(
  '/templates',
  requirePermission('products.view'),
  variantsController.getTemplateVariants
);

/**
 * POST /api/variants/generate/:productId
 * Generar variantes automáticamente para un producto
 * Requiere: products.create
 */
router.post(
  '/generate/:productId',
  requirePermission('products.create'),
  variantsController.generateVariants
);

/**
 * GET /api/variants/:id
 * Obtener una variante por ID
 * Requiere: products.view
 */
router.get('/:id', requirePermission('products.view'), variantsController.getVariant);

/**
 * PATCH /api/variants/:id
 * Actualizar una variante
 * Requiere: products.edit
 */
router.patch('/:id', requirePermission('products.edit'), variantsController.updateVariant);

/**
 * DELETE /api/variants/:id
 * Eliminar una variante
 * Requiere: products.delete
 */
router.delete('/:id', requirePermission('products.delete'), variantsController.deleteVariant);

/**
 * POST /api/variants/:id/adjust-stock
 * Ajustar stock de una variante
 * Requiere: products.edit
 */
router.post(
  '/:id/adjust-stock',
  requirePermission('products.edit'),
  variantsController.adjustStock
);

export default router;
