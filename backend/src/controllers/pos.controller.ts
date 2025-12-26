import { Response } from 'express';
import * as posService from '../services/pos.service';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { OrderStatus } from '@prisma/client';

/**
 * Escanear producto por código de barras
 * POST /api/pos/scan
 */
export async function scanProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { barcode } = req.body;

    console.log('=== POS SCAN DEBUG ===');
    console.log('Barcode received:', barcode);
    console.log('Barcode type:', typeof barcode);
    console.log('Barcode length:', barcode?.length);
    console.log('Barcode trimmed:', barcode?.trim());
    console.log('======================');

    if (!barcode) {
      res.status(400).json({
        success: false,
        message: 'El código de barras es requerido',
      });
      return;
    }

    // Limpiar el código de barras (eliminar espacios)
    const cleanBarcode = barcode.trim();
    const product = await posService.scanProduct(cleanBarcode);

    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Producto no encontrado',
      });
      return;
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    console.error('Error scanning product:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al escanear producto',
    });
  }
}

/**
 * Crear venta POS
 * POST /api/pos/sale
 */
export async function createSale(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      cashRegisterId,
      items,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      paymentMethod,
      cashAmount,
      cardAmount,
      discount,
      notes,
    } = req.body;

    if (!cashRegisterId || !items || items.length === 0 || !paymentMethod) {
      res.status(400).json({
        success: false,
        message: 'cashRegisterId, items y paymentMethod son requeridos',
      });
      return;
    }

    const sale = await posService.createSale({
      cashRegisterId: Number(cashRegisterId),
      sellerId: req.user!.userId,
      items,
      customerId: customerId ? Number(customerId) : undefined,
      customerName,
      customerEmail,
      customerPhone,
      paymentMethod,
      cashAmount: cashAmount ? Number(cashAmount) : undefined,
      cardAmount: cardAmount ? Number(cardAmount) : undefined,
      discount: discount ? Number(discount) : undefined,
      notes,
    });

    res.status(201).json({
      success: true,
      message: 'Venta creada exitosamente',
      data: sale,
    });
  } catch (error: any) {
    console.error('Error creating sale:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al crear venta',
    });
  }
}

/**
 * Cancelar venta POS
 * POST /api/pos/sale/:id/cancel
 */
export async function cancelSale(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({
        success: false,
        message: 'El motivo de cancelación es requerido',
      });
      return;
    }

    const sale = await posService.cancelSale(Number(id), req.user!.userId, reason);

    res.json({
      success: true,
      message: 'Venta cancelada exitosamente',
      data: sale,
    });
  } catch (error: any) {
    console.error('Error canceling sale:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al cancelar venta',
    });
  }
}

/**
 * Obtener historial de ventas
 * GET /api/pos/sales
 */
export async function getSalesHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { cashRegisterId, dateFrom, dateTo, status } = req.query;

    const sales = await posService.getSalesHistory({
      sellerId: req.user!.userId,
      cashRegisterId: cashRegisterId ? Number(cashRegisterId) : undefined,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      status: status as OrderStatus | undefined,
    });

    res.json({
      success: true,
      data: sales,
    });
  } catch (error: any) {
    console.error('Error getting sales history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener historial de ventas',
    });
  }
}

/**
 * Obtener detalle de venta
 * GET /api/pos/sale/:id
 */
export async function getSaleDetail(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const sale = await posService.getSaleById(Number(id));

    if (!sale) {
      res.status(404).json({
        success: false,
        message: 'Venta no encontrada',
      });
      return;
    }

    res.json({
      success: true,
      data: sale,
    });
  } catch (error: any) {
    console.error('Error getting sale detail:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener detalle de venta',
    });
  }
}

/**
 * Calcular totales de venta
 * POST /api/pos/calculate
 */
export async function calculateSale(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { items, discount } = req.body;

    if (!items || items.length === 0) {
      res.status(400).json({
        success: false,
        message: 'items es requerido',
      });
      return;
    }

    const calculation = await posService.calculateSale(items, discount || 0);

    res.json({
      success: true,
      data: calculation,
    });
  } catch (error: any) {
    console.error('Error calculating sale:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al calcular venta',
    });
  }
}
