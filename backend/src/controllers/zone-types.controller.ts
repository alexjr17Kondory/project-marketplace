import { Request, Response, NextFunction } from 'express';
import { zoneTypesService } from '../services/zone-types.service';

// Listar todos los tipos de zona
export async function getAllZoneTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const zoneTypes = await zoneTypesService.getAllZoneTypes();
    res.json({ success: true, data: zoneTypes });
  } catch (error) {
    next(error);
  }
}

// Obtener tipo de zona por ID
export async function getZoneTypeById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id']!);
    const zoneType = await zoneTypesService.getZoneTypeById(id);

    if (!zoneType) {
      res.status(404).json({ success: false, message: 'Tipo de zona no encontrado' });
      return;
    }

    res.json({ success: true, data: zoneType });
  } catch (error) {
    next(error);
  }
}

// Crear tipo de zona
export async function createZoneType(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const zoneType = await zoneTypesService.createZoneType(req.body);
    res.status(201).json({ success: true, data: zoneType });
  } catch (error) {
    next(error);
  }
}

// Actualizar tipo de zona
export async function updateZoneType(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id']!);
    const zoneType = await zoneTypesService.updateZoneType(id, req.body);
    res.json({ success: true, data: zoneType });
  } catch (error) {
    next(error);
  }
}

// Eliminar tipo de zona
export async function deleteZoneType(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id']!);
    const permanent = req.query.permanent === 'true';

    const zoneType = permanent
      ? await zoneTypesService.permanentDeleteZoneType(id)
      : await zoneTypesService.deleteZoneType(id);

    res.json({ success: true, data: zoneType });
  } catch (error) {
    next(error);
  }
}
