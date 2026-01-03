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
 * Buscar productos y templates
 * POST /api/pos/search
 */
export async function searchProductsAndTemplates(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      res.status(400).json({
        success: false,
        message: 'El parámetro query es requerido',
      });
      return;
    }

    const results = await posService.searchProductsAndTemplates(query.trim());

    res.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    console.error('Error searching products:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al buscar productos',
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
      customerCedula,
      paymentMethod,
      cashAmount,
      cardAmount,
      cardReference,
      cardType,
      cardLastFour,
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
      customerCedula,
      paymentMethod,
      cashAmount: cashAmount ? Number(cashAmount) : undefined,
      cardAmount: cardAmount ? Number(cardAmount) : undefined,
      cardReference,
      cardType,
      cardLastFour,
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

/**
 * Buscar cliente por cédula
 * GET /api/pos/customer/search?cedula=123456
 */
export async function searchCustomerByCedula(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { cedula } = req.query;

    if (!cedula || typeof cedula !== 'string') {
      res.status(400).json({
        success: false,
        message: 'La cédula es requerida',
      });
      return;
    }

    const customer = await posService.searchCustomerByCedula(cedula);

    res.json({
      success: true,
      data: customer,
    });
  } catch (error: any) {
    console.error('Error searching customer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al buscar cliente',
    });
  }
}

/**
 * Enviar factura por email
 * POST /api/pos/sale/:id/send-invoice
 */
export async function sendInvoiceEmail(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'El email es requerido',
      });
      return;
    }

    const result = await posService.sendInvoiceEmail(Number(id), email);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error sending invoice:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al enviar factura',
    });
  }
}

/**
 * Generar PDF de factura
 * GET /api/pos/sale/:id/invoice-pdf
 */
export async function getInvoicePDF(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const pdfBuffer = await posService.generateInvoicePDF(Number(id));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Factura_${id}.pdf"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Error generating invoice PDF:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al generar factura PDF',
    });
  }
}

/**
 * Subir evidencia de pago para transferencias
 * POST /api/pos/sale/:id/payment-evidence
 */
export async function uploadPaymentEvidence(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { evidence } = req.body;

    if (!evidence) {
      res.status(400).json({
        success: false,
        message: 'La evidencia de pago es requerida',
      });
      return;
    }

    const sale = await posService.uploadPaymentEvidence(
      Number(id),
      evidence,
      req.user!.userId
    );

    res.json({
      success: true,
      message: 'Evidencia de pago subida exitosamente',
      data: sale,
    });
  } catch (error: any) {
    console.error('Error uploading payment evidence:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al subir evidencia de pago',
    });
  }
}

/**
 * Obtener evidencia de pago
 * GET /api/pos/sale/:id/payment-evidence
 */
export async function getPaymentEvidence(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const evidence = await posService.getPaymentEvidence(Number(id));

    res.json({
      success: true,
      data: { evidence },
    });
  } catch (error: any) {
    console.error('Error getting payment evidence:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al obtener evidencia de pago',
    });
  }
}
