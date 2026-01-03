import { Router } from 'express';
import * as posController from '../controllers/pos.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission, requireAnyPermission } from '../middleware/permissions.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * POST /api/pos/scan
 * Escanear código de barras
 * Permisos: pos.access o pos.create_sale
 */
router.post(
  '/scan',
  requireAnyPermission('pos.access', 'pos.create_sale'),
  posController.scanProduct
);

/**
 * POST /api/pos/search
 * Buscar productos y templates por código de barras o nombre
 * Permisos: pos.access o pos.create_sale
 */
router.post(
  '/search',
  requireAnyPermission('pos.access', 'pos.create_sale'),
  posController.searchProductsAndTemplates
);

/**
 * POST /api/pos/calculate
 * Calcular totales de venta
 * Permisos: pos.access o pos.create_sale
 */
router.post(
  '/calculate',
  requireAnyPermission('pos.access', 'pos.create_sale'),
  posController.calculateSale
);

/**
 * POST /api/pos/sale
 * Crear venta POS
 * Permisos: pos.access o pos.create_sale
 */
router.post(
  '/sale',
  requireAnyPermission('pos.access', 'pos.create_sale'),
  posController.createSale
);

/**
 * POST /api/pos/sale/:id/cancel
 * Cancelar venta POS
 * Permisos: pos.access o pos.cancel_sale
 */
router.post(
  '/sale/:id/cancel',
  requireAnyPermission('pos.access', 'pos.cancel_sale'),
  posController.cancelSale
);

/**
 * GET /api/pos/sales
 * Historial de ventas del cajero
 * Permisos: pos.access o pos.view_sales
 */
router.get(
  '/sales',
  requireAnyPermission('pos.access', 'pos.view_sales'),
  posController.getSalesHistory
);

/**
 * GET /api/pos/sale/:id
 * Detalle de venta
 * Permisos: pos.access o pos.view_sales
 */
router.get(
  '/sale/:id',
  requireAnyPermission('pos.access', 'pos.view_sales'),
  posController.getSaleDetail
);

/**
 * GET /api/pos/customer/search
 * Buscar cliente por cédula
 * Permisos: pos.access o pos.create_sale
 */
router.get(
  '/customer/search',
  requireAnyPermission('pos.access', 'pos.create_sale'),
  posController.searchCustomerByCedula
);

/**
 * POST /api/pos/sale/:id/send-invoice
 * Enviar factura por email
 * Permisos: pos.access o pos.view_sales
 */
router.post(
  '/sale/:id/send-invoice',
  requireAnyPermission('pos.access', 'pos.view_sales'),
  posController.sendInvoiceEmail
);

/**
 * GET /api/pos/sale/:id/invoice-pdf
 * Generar PDF de factura para impresión
 * Permisos: pos.access o pos.view_sales
 */
router.get(
  '/sale/:id/invoice-pdf',
  requireAnyPermission('pos.access', 'pos.view_sales'),
  posController.getInvoicePDF
);

/**
 * POST /api/pos/sale/:id/payment-evidence
 * Subir evidencia de pago (imagen) para transferencias
 * Permisos: pos.access o pos.create_sale
 */
router.post(
  '/sale/:id/payment-evidence',
  requireAnyPermission('pos.access', 'pos.create_sale'),
  posController.uploadPaymentEvidence
);

/**
 * GET /api/pos/sale/:id/payment-evidence
 * Obtener evidencia de pago
 * Permisos: pos.access o pos.view_sales
 */
router.get(
  '/sale/:id/payment-evidence',
  requireAnyPermission('pos.access', 'pos.view_sales'),
  posController.getPaymentEvidence
);

export default router;
