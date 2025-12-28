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

// ==================== COLORES Y VARIANTES ====================

// Agregar color a un insumo
export async function addColorToInput(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const inputId = parseInt(req.params['id']!);
    const { colorId } = req.body;

    if (!colorId) {
      res.status(400).json({ success: false, message: 'colorId es requerido' });
      return;
    }

    const input = await inputsService.addColorToInput(inputId, parseInt(colorId));
    res.json({ success: true, data: input });
  } catch (error: any) {
    if (error.message) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
}

// Remover color de un insumo
export async function removeColorFromInput(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const inputId = parseInt(req.params['id']!);
    const colorId = parseInt(req.params['colorId']!);

    const input = await inputsService.removeColorFromInput(inputId, colorId);
    res.json({ success: true, data: input });
  } catch (error: any) {
    if (error.message) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
}

// Agregar talla a un insumo
export async function addSizeToInput(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const inputId = parseInt(req.params['id']!);
    const { sizeId } = req.body;

    if (!sizeId) {
      res.status(400).json({ success: false, message: 'sizeId es requerido' });
      return;
    }

    const input = await inputsService.addSizeToInput(inputId, parseInt(sizeId));
    res.json({ success: true, data: input });
  } catch (error: any) {
    if (error.message) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
}

// Remover talla de un insumo
export async function removeSizeFromInput(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const inputId = parseInt(req.params['id']!);
    const sizeId = parseInt(req.params['sizeId']!);

    const input = await inputsService.removeSizeFromInput(inputId, sizeId);
    res.json({ success: true, data: input });
  } catch (error: any) {
    if (error.message) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
}

// Obtener variantes de un insumo
export async function getInputVariants(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const inputId = parseInt(req.params['id']!);
    const variants = await inputsService.getInputVariants(inputId);
    res.json({ success: true, data: variants });
  } catch (error) {
    next(error);
  }
}

// Obtener todas las variantes de todos los insumos
export async function getAllInputVariants(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const variants = await inputsService.getAllInputVariants();
    res.json({ success: true, data: variants });
  } catch (error) {
    next(error);
  }
}

// Obtener una variante por ID
export async function getInputVariantById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const variantId = parseInt(req.params['variantId']!);
    const variant = await inputsService.getInputVariantById(variantId);

    if (!variant) {
      res.status(404).json({ success: false, message: 'Variante no encontrada' });
      return;
    }

    res.json({ success: true, data: variant });
  } catch (error) {
    next(error);
  }
}

// Actualizar variante de insumo
export async function updateInputVariant(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const variantId = parseInt(req.params['variantId']!);
    const variant = await inputsService.updateInputVariant(variantId, req.body);
    res.json({ success: true, data: variant });
  } catch (error) {
    next(error);
  }
}

// Actualizar stock de variante
export async function updateVariantStock(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const variantId = parseInt(req.params['variantId']!);
    const { quantity, operation } = req.body;

    if (!quantity || !operation) {
      res.status(400).json({ success: false, message: 'quantity y operation son requeridos' });
      return;
    }

    if (!['add', 'subtract'].includes(operation)) {
      res.status(400).json({ success: false, message: 'operation debe ser "add" o "subtract"' });
      return;
    }

    const variant = await inputsService.updateVariantStock(variantId, parseFloat(quantity), operation);
    res.json({ success: true, data: variant });
  } catch (error: any) {
    if (error.message) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
}

// Regenerar variantes de un insumo
export async function regenerateVariants(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const inputId = parseInt(req.params['id']!);
    const input = await inputsService.regenerateVariants(inputId);
    res.json({ success: true, data: input });
  } catch (error: any) {
    if (error.message) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
}

// Obtener movimientos de una variante de insumo
export async function getVariantMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const variantId = parseInt(req.params['variantId']!);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const movements = await inputsService.getVariantMovements(variantId, limit);
    res.json({ success: true, data: movements });
  } catch (error) {
    next(error);
  }
}
