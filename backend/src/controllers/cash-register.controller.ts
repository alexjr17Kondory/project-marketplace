import { Response } from 'express';
import * as cashRegisterService from '../services/cash-register.service';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { SessionStatus } from '@prisma/client';

/**
 * Listar cajas registradoras
 * GET /api/cash-registers
 */
export async function listCashRegisters(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { activeOnly } = req.query;

    const cashRegisters = await cashRegisterService.getCashRegisters(activeOnly === 'true');

    res.json({
      success: true,
      data: cashRegisters,
    });
  } catch (error: any) {
    console.error('Error listing cash registers:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al listar cajas registradoras',
    });
  }
}

/**
 * Obtener caja registradora por ID
 * GET /api/cash-registers/:id
 */
export async function getCashRegister(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const cashRegister = await cashRegisterService.getCashRegisterById(Number(id));

    if (!cashRegister) {
      res.status(404).json({
        success: false,
        message: 'Caja registradora no encontrada',
      });
      return;
    }

    res.json({
      success: true,
      data: cashRegister,
    });
  } catch (error: any) {
    console.error('Error getting cash register:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener caja registradora',
    });
  }
}

/**
 * Crear caja registradora
 * POST /api/cash-registers
 */
export async function createCashRegister(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { name, location, code } = req.body;

    if (!name || !location || !code) {
      res.status(400).json({
        success: false,
        message: 'name, location y code son requeridos',
      });
      return;
    }

    const cashRegister = await cashRegisterService.createCashRegister({
      name,
      location,
      code,
    });

    res.status(201).json({
      success: true,
      message: 'Caja registradora creada exitosamente',
      data: cashRegister,
    });
  } catch (error: any) {
    console.error('Error creating cash register:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al crear caja registradora',
    });
  }
}

/**
 * Actualizar caja registradora
 * PATCH /api/cash-registers/:id
 */
export async function updateCashRegister(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, location, code, isActive } = req.body;

    const cashRegister = await cashRegisterService.updateCashRegister(Number(id), {
      name,
      location,
      code,
      isActive,
    });

    res.json({
      success: true,
      message: 'Caja registradora actualizada exitosamente',
      data: cashRegister,
    });
  } catch (error: any) {
    console.error('Error updating cash register:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar caja registradora',
    });
  }
}

/**
 * Eliminar caja registradora
 * DELETE /api/cash-registers/:id
 */
export async function deleteCashRegister(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    await cashRegisterService.deleteCashRegister(Number(id));

    res.json({
      success: true,
      message: 'Caja registradora eliminada exitosamente',
    });
  } catch (error: any) {
    console.error('Error deleting cash register:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al eliminar caja registradora',
    });
  }
}

/**
 * Abrir sesión de caja
 * POST /api/cash-registers/:id/open-session
 */
export async function openSession(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { initialCash, notes } = req.body;

    if (initialCash === undefined) {
      res.status(400).json({
        success: false,
        message: 'initialCash es requerido',
      });
      return;
    }

    const session = await cashRegisterService.openSession({
      cashRegisterId: Number(id),
      sellerId: req.user!.userId,
      initialCash: Number(initialCash),
      notes,
    });

    res.status(201).json({
      success: true,
      message: 'Sesión abierta exitosamente',
      data: session,
    });
  } catch (error: any) {
    console.error('Error opening session:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al abrir sesión',
    });
  }
}

/**
 * Cerrar sesión de caja
 * POST /api/cash-registers/sessions/:id/close
 */
export async function closeSession(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { finalCash, notes } = req.body;

    if (finalCash === undefined) {
      res.status(400).json({
        success: false,
        message: 'finalCash es requerido',
      });
      return;
    }

    const session = await cashRegisterService.closeSession(Number(id), {
      finalCash: Number(finalCash),
      notes,
    });

    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente',
      data: session,
    });
  } catch (error: any) {
    console.error('Error closing session:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al cerrar sesión',
    });
  }
}

/**
 * Obtener sesión actual del cajero autenticado
 * GET /api/cash-registers/my-session
 */
export async function getMySession(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    console.log('[GET MY SESSION] userId:', req.user!.userId, 'type:', typeof req.user!.userId);
    const session = await cashRegisterService.getCurrentSession(req.user!.userId);
    console.log('[GET MY SESSION] session found:', session ? 'YES' : 'NO');

    if (!session) {
      res.status(404).json({
        success: false,
        message: 'No tienes una sesión activa',
      });
      return;
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    console.error('Error getting current session:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener sesión actual',
    });
  }
}

/**
 * Obtener reporte de sesión
 * GET /api/cash-registers/sessions/:id/report
 */
export async function getSessionReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const report = await cashRegisterService.getSessionReport(Number(id));

    res.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error('Error getting session report:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al obtener reporte de sesión',
    });
  }
}

/**
 * Listar sesiones con filtros
 * GET /api/cash-registers/sessions
 */
export async function listSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { cashRegisterId, sellerId, status, dateFrom, dateTo } = req.query;

    const sessions = await cashRegisterService.getSessions({
      cashRegisterId: cashRegisterId ? Number(cashRegisterId) : undefined,
      sellerId: sellerId ? Number(sellerId) : undefined,
      status: status as SessionStatus | undefined,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
    });

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error: any) {
    console.error('Error listing sessions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al listar sesiones',
    });
  }
}
