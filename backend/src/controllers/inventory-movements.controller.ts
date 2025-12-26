import { Request, Response } from 'express';
import * as inventoryService from '../services/inventory-movements.service';
import { VariantMovementType } from '@prisma/client';

// GET /api/inventory/movements
export async function getMovements(req: Request, res: Response) {
  try {
    const { variantId, productId, movementType, fromDate, toDate, search } = req.query;

    const filters = {
      variantId: variantId ? parseInt(variantId as string, 10) : undefined,
      productId: productId ? parseInt(productId as string, 10) : undefined,
      movementType: movementType as VariantMovementType,
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
      search: search as string,
    };

    const movements = await inventoryService.getMovements(filters);
    res.json({ success: true, data: movements });
  } catch (error: any) {
    console.error('Error getting movements:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// GET /api/inventory/movements/variant/:variantId
export async function getVariantMovements(req: Request, res: Response) {
  try {
    const variantId = parseInt(req.params['variantId'] || '0', 10);
    const movements = await inventoryService.getVariantMovements(variantId);
    res.json({ success: true, data: movements });
  } catch (error: any) {
    console.error('Error getting variant movements:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// POST /api/inventory/movements
export async function createMovement(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const movement = await inventoryService.createMovement({
      ...req.body,
      userId,
    });
    res.status(201).json({ success: true, data: movement, message: 'Movimiento registrado correctamente' });
  } catch (error: any) {
    console.error('Error creating movement:', error);
    res.status(400).json({ success: false, message: error.message });
  }
}

// POST /api/inventory/bulk-adjustment
export async function bulkAdjustment(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      res.status(400).json({ success: false, message: 'Se requiere un array de items' });
      return;
    }

    const results = await inventoryService.bulkAdjustment(items, userId);
    res.json({ success: true, data: results, message: 'Ajuste masivo completado' });
  } catch (error: any) {
    console.error('Error in bulk adjustment:', error);
    res.status(400).json({ success: false, message: error.message });
  }
}

// GET /api/inventory/summary
export async function getSummary(req: Request, res: Response) {
  try {
    const { fromDate, toDate } = req.query;

    const summary = await inventoryService.getMovementsSummary(
      fromDate ? new Date(fromDate as string) : undefined,
      toDate ? new Date(toDate as string) : undefined
    );
    res.json({ success: true, data: summary });
  } catch (error: any) {
    console.error('Error getting summary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// GET /api/inventory/low-stock
export async function getLowStock(req: Request, res: Response) {
  try {
    const variants = await inventoryService.getLowStockVariants();
    res.json({ success: true, data: variants });
  } catch (error: any) {
    console.error('Error getting low stock:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// GET /api/inventory/stats
export async function getStats(req: Request, res: Response) {
  try {
    const stats = await inventoryService.getInventoryStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Error getting stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
