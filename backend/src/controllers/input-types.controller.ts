import { Request, Response, NextFunction } from 'express';
import { inputTypesService } from '../services/input-types.service';

// Listar todos los tipos de insumo
export async function getAllInputTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const inputTypes = await inputTypesService.getAllInputTypes();
    res.json({ success: true, data: inputTypes });
  } catch (error) {
    next(error);
  }
}

// Obtener tipo de insumo por ID
export async function getInputTypeById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id']!);
    const inputType = await inputTypesService.getInputTypeById(id);

    if (!inputType) {
      res.status(404).json({ success: false, message: 'Tipo de insumo no encontrado' });
      return;
    }

    res.json({ success: true, data: inputType });
  } catch (error) {
    next(error);
  }
}

// Crear tipo de insumo
export async function createInputType(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const inputType = await inputTypesService.createInputType(req.body);
    res.status(201).json({ success: true, data: inputType });
  } catch (error) {
    next(error);
  }
}

// Actualizar tipo de insumo
export async function updateInputType(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id']!);
    const inputType = await inputTypesService.updateInputType(id, req.body);
    res.json({ success: true, data: inputType });
  } catch (error) {
    next(error);
  }
}

// Eliminar tipo de insumo
export async function deleteInputType(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id']!);
    const permanent = req.query.permanent === 'true';

    const inputType = permanent
      ? await inputTypesService.permanentDeleteInputType(id)
      : await inputTypesService.deleteInputType(id);

    res.json({ success: true, data: inputType });
  } catch (error) {
    next(error);
  }
}
