import { Request, Response } from 'express';
import * as purchaseOrdersService from '../services/purchase-orders.service';
import { PurchaseOrderStatus } from '@prisma/client';

// GET /api/purchase-orders
export async function getPurchaseOrders(req: Request, res: Response) {
  try {
    const { search, status, supplierId, fromDate, toDate } = req.query;

    const filters = {
      search: search as string,
      status: status as PurchaseOrderStatus,
      supplierId: supplierId ? parseInt(supplierId as string, 10) : undefined,
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
    };

    const orders = await purchaseOrdersService.getPurchaseOrders(filters);
    res.json({ success: true, data: orders });
  } catch (error: any) {
    console.error('Error getting purchase orders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// GET /api/purchase-orders/stats
export async function getStats(req: Request, res: Response) {
  try {
    const stats = await purchaseOrdersService.getPurchaseOrderStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Error getting purchase order stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// GET /api/purchase-orders/generate-number
export async function generateNumber(req: Request, res: Response) {
  try {
    const orderNumber = await purchaseOrdersService.generateOrderNumber();
    res.json({ success: true, data: { orderNumber } });
  } catch (error: any) {
    console.error('Error generating order number:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// GET /api/purchase-orders/:id
export async function getPurchaseOrderById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params['id'] || '0', 10);
    const order = await purchaseOrdersService.getPurchaseOrderById(id);

    if (!order) {
      res.status(404).json({ success: false, message: 'Orden de compra no encontrada' });
      return;
    }

    res.json({ success: true, data: order });
  } catch (error: any) {
    console.error('Error getting purchase order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// POST /api/purchase-orders
export async function createPurchaseOrder(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const order = await purchaseOrdersService.createPurchaseOrder({
      ...req.body,
      createdById: userId,
    });
    res.status(201).json({ success: true, data: order, message: 'Orden de compra creada correctamente' });
  } catch (error: any) {
    console.error('Error creating purchase order:', error);
    res.status(400).json({ success: false, message: error.message });
  }
}

// PUT /api/purchase-orders/:id
export async function updatePurchaseOrder(req: Request, res: Response) {
  try {
    const id = parseInt(req.params['id'] || '0', 10);
    const order = await purchaseOrdersService.updatePurchaseOrder(id, req.body);
    res.json({ success: true, data: order, message: 'Orden de compra actualizada correctamente' });
  } catch (error: any) {
    console.error('Error updating purchase order:', error);
    res.status(400).json({ success: false, message: error.message });
  }
}

// PATCH /api/purchase-orders/:id/status
export async function updateStatus(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params['id'] || '0', 10);
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ success: false, message: 'Se requiere el nuevo estado' });
      return;
    }

    const order = await purchaseOrdersService.updateOrderStatus(id, status);
    res.json({ success: true, data: order, message: 'Estado actualizado correctamente' });
  } catch (error: any) {
    console.error('Error updating purchase order status:', error);
    res.status(400).json({ success: false, message: error.message });
  }
}

// POST /api/purchase-orders/:id/receive
export async function receiveItems(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params['id'] || '0', 10);
    const { items } = req.body;
    const userId = (req as any).user?.id;

    if (!items || !Array.isArray(items)) {
      res.status(400).json({ success: false, message: 'Se requiere un array de items a recibir' });
      return;
    }

    const order = await purchaseOrdersService.receiveItems(id, items, userId);
    res.json({ success: true, data: order, message: 'Items recibidos correctamente' });
  } catch (error: any) {
    console.error('Error receiving items:', error);
    res.status(400).json({ success: false, message: error.message });
  }
}

// DELETE /api/purchase-orders/:id
export async function deletePurchaseOrder(req: Request, res: Response) {
  try {
    const id = parseInt(req.params['id'] || '0', 10);
    await purchaseOrdersService.deletePurchaseOrder(id);
    res.json({ success: true, message: 'Orden de compra eliminada correctamente' });
  } catch (error: any) {
    console.error('Error deleting purchase order:', error);
    res.status(400).json({ success: false, message: error.message });
  }
}
