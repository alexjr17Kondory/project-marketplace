import { Router } from 'express';
import * as barcodeController from '../controllers/barcode.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission, requireAnyPermission } from '../middleware/permissions.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// ==================== GENERACIÓN DE IMÁGENES ====================

/**
 * GET /api/barcodes/image/:variantId
 * Obtener imagen del código de barras de una variante
 * Permisos: products.view o pos.access
 */
router.get(
  '/image/:variantId',
  requireAnyPermission('products.view', 'pos.access'),
  barcodeController.getVariantBarcodeImage
);

/**
 * POST /api/barcodes/image
 * Generar imagen de código de barras genérico
 * Permisos: products.view
 */
router.post(
  '/image',
  requirePermission('products.view'),
  barcodeController.generateBarcodeImage
);

// ==================== GENERACIÓN DE ETIQUETAS ====================

/**
 * GET /api/barcodes/label/:variantId
 * Obtener datos completos de etiqueta para una variante
 * Permisos: products.view
 */
router.get(
  '/label/:variantId',
  requirePermission('products.view'),
  barcodeController.getVariantBarcodeLabel
);

/**
 * POST /api/barcodes/labels/batch
 * Generar etiquetas para múltiples variantes
 * Permisos: products.view
 */
router.post(
  '/labels/batch',
  requirePermission('products.view'),
  barcodeController.generateBatchLabels
);

/**
 * GET /api/barcodes/labels/product/:productId
 * Generar etiquetas para todas las variantes de un producto
 * Permisos: products.view
 */
router.get(
  '/labels/product/:productId',
  requirePermission('products.view'),
  barcodeController.generateProductLabels
);

// ==================== ASIGNACIÓN DE CÓDIGOS ====================

/**
 * POST /api/barcodes/assign/:variantId
 * Asignar código de barras a una variante
 * Permisos: products.edit
 */
router.post(
  '/assign/:variantId',
  requirePermission('products.edit'),
  barcodeController.assignBarcode
);

/**
 * POST /api/barcodes/assign-all
 * Asignar códigos automáticamente a todas las variantes sin código
 * Permisos: products.edit
 */
router.post(
  '/assign-all',
  requirePermission('products.edit'),
  barcodeController.assignAllBarcodes
);

// ==================== VALIDACIÓN ====================

/**
 * POST /api/barcodes/validate
 * Validar formato de código de barras
 * Permisos: products.view
 */
router.post(
  '/validate',
  requirePermission('products.view'),
  barcodeController.validateBarcode
);

// ==================== IMPRESIÓN ====================

/**
 * POST /api/barcodes/print
 * Generar PDF con etiquetas de códigos de barras
 * Body: { items: [{ variantId: number, quantity: number }] }
 * Permisos: products.view
 */
router.post(
  '/print',
  requirePermission('products.view'),
  barcodeController.printBarcodeLabels
);

export default router;
