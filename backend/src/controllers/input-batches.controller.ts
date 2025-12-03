import { Request, Response, NextFunction } from 'express';
import { inputBatchesService } from '../services/input-batches.service';

// Listar lotes por insumo
export async function getBatchesByInputId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const inputId = parseInt(req.params['inputId']!);
    const batches = await inputBatchesService.getBatchesByInputId(inputId);
    res.json({ success: true, data: batches });
  } catch (error) {
    next(error);
  }
}

// Obtener lote por ID
export async function getBatchById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id']!);
    const batch = await inputBatchesService.getBatchById(id);

    if (!batch) {
      res.status(404).json({ success: false, message: 'Lote no encontrado' });
      return;
    }

    res.json({ success: true, data: batch });
  } catch (error) {
    next(error);
  }
}

// Crear lote
export async function createBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const inputId = parseInt(req.params['inputId']!);
    const batch = await inputBatchesService.createBatch({
      inputId,
      ...req.body,
    });
    res.status(201).json({ success: true, data: batch });
  } catch (error) {
    next(error);
  }
}

// Actualizar lote
export async function updateBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id']!);
    const batch = await inputBatchesService.updateBatch(id, req.body);
    res.json({ success: true, data: batch });
  } catch (error) {
    next(error);
  }
}

// Ajustar cantidad del lote
export async function adjustBatchQuantity(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id']!);
    const { quantity, reason, userId } = req.body;
    const batch = await inputBatchesService.adjustBatchQuantity(id, quantity, reason, userId);
    res.json({ success: true, data: batch });
  } catch (error) {
    next(error);
  }
}

// Reservar del lote
export async function reserveFromBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id']!);
    const { quantity, orderId, userId } = req.body;
    const batch = await inputBatchesService.reserveFromBatch(id, quantity, orderId, userId);
    res.json({ success: true, data: batch });
  } catch (error) {
    next(error);
  }
}

// Liberar reserva
export async function releaseReservation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id']!);
    const { quantity, orderId, userId } = req.body;
    const batch = await inputBatchesService.releaseReservation(id, quantity, orderId, userId);
    res.json({ success: true, data: batch });
  } catch (error) {
    next(error);
  }
}

// Registrar salida (producción)
export async function recordOutput(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id']!);
    const { quantity, productionId, userId } = req.body;
    const batch = await inputBatchesService.recordOutput(id, quantity, productionId, userId);
    res.json({ success: true, data: batch });
  } catch (error) {
    next(error);
  }
}

// Obtener movimientos por insumo
export async function getMovementsByInputId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const inputId = parseInt(req.params['inputId']!);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const movements = await inputBatchesService.getMovementsByInputId(inputId, limit);
    res.json({ success: true, data: movements });
  } catch (error) {
    next(error);
  }
}

// Obtener movimientos por lote
export async function getMovementsByBatchId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const batchId = parseInt(req.params['batchId']!);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const movements = await inputBatchesService.getMovementsByBatchId(batchId, limit);
    res.json({ success: true, data: movements });
  } catch (error) {
    next(error);
  }
}
