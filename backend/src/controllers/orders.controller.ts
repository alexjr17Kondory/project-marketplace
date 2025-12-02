import { Request, Response, NextFunction } from 'express';
import * as ordersService from '../services/orders.service';
import * as wompiService from '../services/wompi.service';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';

// ==================== RUTAS DE USUARIO ====================

// Crear pedido
export async function createOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const order = await ordersService.createOrder(req.user!.userId, req.body);

    res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente',
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener mis pedidos
export async function getMyOrders(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await ordersService.getUserOrders(req.user!.userId, req.query as any);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener mi pedido por ID
export async function getMyOrderById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const order = await ordersService.getOrderById(id, req.user!.userId);

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener mi pedido por número de orden
export async function getMyOrderByNumber(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const order = await ordersService.getOrderByNumber(
      req.params.orderNumber as string,
      req.user!.userId
    );

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

// Cancelar mi pedido
export async function cancelMyOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const order = await ordersService.cancelOrder(id, req.user!.userId);

    res.json({
      success: true,
      message: 'Pedido cancelado exitosamente',
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

// Confirmar pago con Wompi (polling desde frontend)
export async function confirmPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const orderNumber = req.params.orderNumber as string;
    const { transactionId } = req.body;

    if (!orderNumber) {
      res.status(400).json({
        success: false,
        message: 'orderNumber es requerido',
      });
      return;
    }

    if (!transactionId) {
      res.status(400).json({
        success: false,
        message: 'transactionId es requerido',
      });
      return;
    }

    // Verificar que la orden pertenece al usuario
    const order = await ordersService.getOrderByNumber(orderNumber, req.user!.userId);

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Orden no encontrada',
      });
      return;
    }

    // Si ya está pagada, no hacer nada
    if (order.status === 'PAID') {
      res.json({
        success: true,
        message: 'El pedido ya está pagado',
        data: order,
      });
      return;
    }

    // Verificar transacción con Wompi
    const result = await wompiService.confirmPaymentByTransaction(transactionId, orderNumber);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.message,
        status: result.status,
      });
      return;
    }

    // Obtener orden actualizada
    const updatedOrder = await ordersService.getOrderByNumber(orderNumber, req.user!.userId);

    res.json({
      success: true,
      message: result.message,
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
}

// ==================== RUTAS DE ADMIN ====================

// Listar todos los pedidos
export async function listOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await ordersService.listOrders(req.query as any);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener pedido por ID (admin)
export async function getOrderById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const order = await ordersService.getOrderById(id);

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener pedido por número de orden (admin)
export async function getOrderByNumber(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await ordersService.getOrderByNumber(req.params.orderNumber as string);

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

// Actualizar estado del pedido
export async function updateOrderStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const order = await ordersService.updateOrderStatus(id, req.body);

    res.json({
      success: true,
      message: 'Estado del pedido actualizado',
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener estadísticas
export async function getOrderStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await ordersService.getOrderStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}
