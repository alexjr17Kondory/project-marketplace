import { Router } from 'express';
import * as cashRegisterController from '../controllers/cash-register.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission, requireAnyPermission } from '../middleware/permissions.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// ==================== CAJAS REGISTRADORAS ====================

/**
 * GET /api/cash-registers
 * Listar cajas registradoras
 * Permisos: pos.cash_register o pos.access
 */
router.get(
  '/',
  requireAnyPermission('pos.cash_register', 'pos.access'),
  cashRegisterController.listCashRegisters
);

/**
 * GET /api/cash-registers/my-session
 * Obtener sesión actual del cajero autenticado
 * Permisos: pos.access
 * IMPORTANTE: Esta ruta debe estar ANTES de /:id para evitar conflictos
 */
router.get('/my-session', requirePermission('pos.access'), cashRegisterController.getMySession);

/**
 * GET /api/cash-registers/:id
 * Obtener caja registradora por ID
 * Permisos: pos.cash_register o pos.access
 */
router.get(
  '/:id',
  requireAnyPermission('pos.cash_register', 'pos.access'),
  cashRegisterController.getCashRegister
);

/**
 * POST /api/cash-registers
 * Crear caja registradora
 * Permisos: pos.cash_register
 */
router.post(
  '/',
  requirePermission('pos.cash_register'),
  cashRegisterController.createCashRegister
);

/**
 * PATCH /api/cash-registers/:id
 * Actualizar caja registradora
 * Permisos: pos.cash_register
 */
router.patch(
  '/:id',
  requirePermission('pos.cash_register'),
  cashRegisterController.updateCashRegister
);

/**
 * DELETE /api/cash-registers/:id
 * Eliminar caja registradora
 * Permisos: pos.cash_register
 */
router.delete(
  '/:id',
  requirePermission('pos.cash_register'),
  cashRegisterController.deleteCashRegister
);

// ==================== SESIONES ====================

/**
 * POST /api/cash-registers/:id/open-session
 * Abrir sesión de caja
 * Permisos: pos.open_close_session o pos.access
 */
router.post(
  '/:id/open-session',
  requireAnyPermission('pos.open_close_session', 'pos.access'),
  cashRegisterController.openSession
);

/**
 * POST /api/cash-registers/sessions/:id/close
 * Cerrar sesión de caja
 * Permisos: pos.open_close_session o pos.access
 */
router.post(
  '/sessions/:id/close',
  requireAnyPermission('pos.open_close_session', 'pos.access'),
  cashRegisterController.closeSession
);

/**
 * GET /api/cash-registers/sessions/:id/report
 * Obtener reporte de sesión
 * Permisos: pos.view_reports o pos.cash_register
 */
router.get(
  '/sessions/:id/report',
  requireAnyPermission('pos.view_reports', 'pos.cash_register'),
  cashRegisterController.getSessionReport
);

/**
 * GET /api/cash-registers/sessions
 * Listar sesiones con filtros
 * Permisos: pos.view_reports o pos.cash_register
 */
router.get(
  '/sessions',
  requireAnyPermission('pos.view_reports', 'pos.cash_register'),
  cashRegisterController.listSessions
);

export default router;
