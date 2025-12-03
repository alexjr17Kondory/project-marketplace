import { Request, Response, NextFunction } from 'express';
import { inputsService } from '../services/inputs.service';

// Listar todos los insumos
export async function getAllInputs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filters = {
      inputTypeId: req.query.inputTypeId ? parseInt(req.query.inputTypeId as string) : undefined,
      search: req.query.search as string | undefined,
      lowStock: req.query.lowStock === 'true',
    };

    const inputs = await inputsService.getAllInputs(filters);
    res.json({ success: true, data: inputs });
  } catch (error) {
    next(error);
  }
}

// Obtener insumo por ID
export async function getInputById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id']!);
    const input = await inputsService.getInputById(id);

    if (!input) {
      res.status(404).json({ success: false, message: 'Insumo no encontrado' });
      return;
    }

    res.json({ success: true, data: input });
  } catch (error) {
    next(error);
  }
}

// Crear insumo
export async function createInput(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = await inputsService.createInput(req.body);
    res.status(201).json({ success: true, data: input });
  } catch (error) {
    next(error);
  }
}

// Actualizar insumo
export async function updateInput(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id']!);
    const input = await inputsService.updateInput(id, req.body);
    res.json({ success: true, data: input });
  } catch (error) {
    next(error);
  }
}

// Eliminar insumo
export async function deleteInput(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id']!);
    const input = await inputsService.deleteInput(id);
    res.json({ success: true, data: input });
  } catch (error) {
    next(error);
  }
}

// Obtener insumos con stock bajo
export async function getLowStockInputs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const inputs = await inputsService.getLowStockInputs();
    res.json({ success: true, data: inputs });
  } catch (error) {
    next(error);
  }
}

// Recalcular stock de un insumo
export async function recalculateStock(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id']!);
    const input = await inputsService.recalculateStock(id);
    res.json({ success: true, data: input });
  } catch (error) {
    next(error);
  }
}
