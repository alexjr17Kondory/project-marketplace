import { Request, Response } from 'express';
import { inventoryCountsService } from '../services/inventory-counts.service';

// Tipo de estado
type InventoryCountStatus = 'DRAFT' | 'IN_PROGRESS' | 'PENDING_APPROVAL' | 'APPROVED' | 'CANCELLED';

// GET /api/inventory-counts
export async function getInventoryCounts(req: Request, res: Response) {
  try {
    const { status, fromDate, toDate } = req.query;

    const filters = {
      status: status as InventoryCountStatus,
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
    };

    const counts = await inventoryCountsService.listCounts(filters);
    res.json({ success: true, data: counts });
  } catch (error: any) {
    console.error('Error getting inventory counts:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// GET /api/inventory-counts/stats
export async function getStats(req: Request, res: Response) {
  try {
    const stats = await inventoryCountsService.getCountStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Error getting inventory count stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// GET /api/inventory-counts/:id
export async function getInventoryCountById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params['id'] || '0', 10);
    const count = await inventoryCountsService.getCountById(id);

    res.json({ success: true, data: count });
  } catch (error: any) {
    console.error('Error getting inventory count:', error);
    if (error.name === 'NotFoundError') {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({ success: false, message: error.message });
  }
}

// POST /api/inventory-counts
export async function createInventoryCount(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const count = await inventoryCountsService.createCount({
      ...req.body,
      countedById: user?.id,
      countedByName: user?.name,
    });
    res.status(201).json({
      success: true,
      data: count,
      message: 'Conteo de inventario creado correctamente'
    });
  } catch (error: any) {
    console.error('Error creating inventory count:', error);
    res.status(400).json({ success: false, message: error.message });
  }
}

// PATCH /api/inventory-counts/:id/start
export async function startCount(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params['id'] || '0', 10);
    const count = await inventoryCountsService.startCount(id);
    res.json({
      success: true,
      data: count,
      message: 'Conteo iniciado correctamente'
    });
  } catch (error: any) {
    console.error('Error starting inventory count:', error);
    if (error.name === 'NotFoundError') {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    res.status(400).json({ success: false, message: error.message });
  }
}

// PATCH /api/inventory-counts/:id/items/:itemId
export async function updateItemCount(req: Request, res: Response): Promise<void> {
  try {
    const countId = parseInt(req.params['id'] || '0', 10);
    const itemId = parseInt(req.params['itemId'] || '0', 10);
    const { countedQuantity, notes } = req.body;

    if (countedQuantity === undefined || countedQuantity === null) {
      res.status(400).json({
        success: false,
        message: 'Se requiere la cantidad contada'
      });
      return;
    }

    const item = await inventoryCountsService.updateItemCount(countId, itemId, {
      countedQuantity: Number(countedQuantity),
      notes,
    });

    res.json({
      success: true,
      data: item,
      message: 'Cantidad actualizada correctamente'
    });
  } catch (error: any) {
    console.error('Error updating item count:', error);
    if (error.name === 'NotFoundError') {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    res.status(400).json({ success: false, message: error.message });
  }
}

// PATCH /api/inventory-counts/:id/submit
export async function submitForApproval(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params['id'] || '0', 10);
    const count = await inventoryCountsService.submitForApproval(id);
    res.json({
      success: true,
      data: count,
      message: 'Conteo enviado a aprobación correctamente'
    });
  } catch (error: any) {
    console.error('Error submitting inventory count:', error);
    if (error.name === 'NotFoundError') {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    res.status(400).json({ success: false, message: error.message });
  }
}

// PATCH /api/inventory-counts/:id/approve
export async function approveCount(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params['id'] || '0', 10);
    const user = (req as any).user;

    const count = await inventoryCountsService.approveCount(id, {
      approvedById: user?.id,
      approvedByName: user?.name,
    });

    res.json({
      success: true,
      data: count,
      message: 'Conteo aprobado y ajustes aplicados correctamente'
    });
  } catch (error: any) {
    console.error('Error approving inventory count:', error);
    if (error.name === 'NotFoundError') {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    res.status(400).json({ success: false, message: error.message });
  }
}

// PATCH /api/inventory-counts/:id/cancel
export async function cancelCount(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params['id'] || '0', 10);
    const count = await inventoryCountsService.cancelCount(id);
    res.json({
      success: true,
      data: count,
      message: 'Conteo cancelado correctamente'
    });
  } catch (error: any) {
    console.error('Error cancelling inventory count:', error);
    if (error.name === 'NotFoundError') {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    res.status(400).json({ success: false, message: error.message });
  }
}

// DELETE /api/inventory-counts/:id
export async function deleteInventoryCount(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params['id'] || '0', 10);
    await inventoryCountsService.deleteCount(id);
    res.json({
      success: true,
      message: 'Conteo de inventario eliminado correctamente'
    });
  } catch (error: any) {
    console.error('Error deleting inventory count:', error);
    if (error.name === 'NotFoundError') {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    res.status(400).json({ success: false, message: error.message });
  }
}
