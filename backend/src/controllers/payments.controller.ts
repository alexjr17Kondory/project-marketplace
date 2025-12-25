import { Request, Response, NextFunction } from 'express';
import * as paymentsService from '../services/payments.service';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';

// ==================== RUTAS DE USUARIO ====================

// Crear intento de pago
export async function createPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const payment = await paymentsService.createPayment(req.body);

    res.status(201).json({
      success: true,
      message: 'Pago iniciado exitosamente',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener pagos de un pedido (usuario puede ver solo sus pedidos)
export async function getMyOrderPayments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const orderId = Number(req.params.orderId);

    // Verificar que el pedido pertenece al usuario
    const { getOrderById } = await import('../services/orders.service');
    await getOrderById(orderId, req.user!.userId);

    const payments = await paymentsService.getPaymentsByOrderId(orderId);

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
}

// Actualizar pago (usuario puede subir comprobante)
export async function updateMyPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);

    // Obtener el pago y verificar que pertenece a una orden del usuario
    const payment = await paymentsService.getPaymentById(id);
    const { getOrderById } = await import('../services/orders.service');
    await getOrderById(payment.orderId, req.user!.userId);

    // Solo permitir actualizar comprobante y notas
    const { receiptUrl, receiptData, notes } = req.body;
    const updated = await paymentsService.updatePayment(id, {
      receiptUrl,
      receiptData,
      notes,
    });

    res.json({
      success: true,
      message: 'Pago actualizado exitosamente',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

// ==================== RUTAS DE ADMIN ====================

// Listar todos los pagos
export async function listPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await paymentsService.listPayments(req.query as any);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener pagos de un pedido (admin)
export async function getOrderPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const orderId = Number(req.params.orderId);
    const payments = await paymentsService.getPaymentsByOrderId(orderId);

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener pago por ID (admin)
export async function getPaymentById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const payment = await paymentsService.getPaymentById(id);

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener pago por transactionId (admin)
export async function getPaymentByTransactionId(req: Request, res: Response, next: NextFunction) {
  try {
    const transactionId = req.params.transactionId as string;
    const payment = await paymentsService.getPaymentByTransactionId(transactionId);

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
}

// Actualizar pago (admin)
export async function updatePayment(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const payment = await paymentsService.updatePayment(id, req.body);

    res.json({
      success: true,
      message: 'Pago actualizado exitosamente',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
}

// Verificar pago manualmente (admin)
export async function verifyPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const verifiedBy = req.user!.userId;

    const payment = await paymentsService.verifyPayment(id, {
      ...req.body,
      verifiedBy,
    });

    res.json({
      success: true,
      message: 'Pago verificado exitosamente',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
}

// Reembolsar pago (admin)
export async function refundPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const payment = await paymentsService.refundPayment(id, req.body);

    res.json({
      success: true,
      message: 'Reembolso procesado exitosamente',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
}

// Cancelar pago (admin)
export async function cancelPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const { reason } = req.body;
    const payment = await paymentsService.cancelPayment(id, reason);

    res.json({
      success: true,
      message: 'Pago cancelado exitosamente',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener estadísticas de pagos (admin)
export async function getPaymentStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await paymentsService.getPaymentStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}
