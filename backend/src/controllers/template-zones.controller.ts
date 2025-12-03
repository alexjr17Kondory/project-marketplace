import { Request, Response, NextFunction } from 'express';
import { templateZonesService } from '../services/template-zones.service';

// Obtener todas las zonas de un template
export async function getZonesByTemplateId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const templateId = parseInt(req.params['templateId']!);
    const zones = await templateZonesService.getZonesByTemplateId(templateId);
    res.json({ success: true, data: zones });
  } catch (error) {
    next(error);
  }
}

// Obtener zona por ID
export async function getZoneById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id']!);
    const zone = await templateZonesService.getZoneById(id);

    if (!zone) {
      res.status(404).json({ success: false, message: 'Zona no encontrada' });
      return;
    }

    res.json({ success: true, data: zone });
  } catch (error) {
    next(error);
  }
}

// Crear zona para un template
export async function createZone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const templateId = parseInt(req.params['templateId']!);
    const zone = await templateZonesService.createZone({
      templateId,
      ...req.body,
    });
    res.status(201).json({ success: true, data: zone });
  } catch (error) {
    next(error);
  }
}

// Actualizar zona
export async function updateZone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id']!);
    const zone = await templateZonesService.updateZone(id, req.body);
    res.json({ success: true, data: zone });
  } catch (error) {
    next(error);
  }
}

// Eliminar zona
export async function deleteZone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id']!);
    const permanent = req.query.permanent === 'true';

    const zone = permanent
      ? await templateZonesService.permanentDeleteZone(id)
      : await templateZonesService.deleteZone(id);

    res.json({ success: true, data: zone });
  } catch (error) {
    next(error);
  }
}

// Crear/actualizar insumo de una zona
export async function upsertZoneInput(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const zoneId = parseInt(req.params['zoneId']!);
    const zoneInput = await templateZonesService.upsertZoneInput(zoneId, req.body);
    res.json({ success: true, data: zoneInput });
  } catch (error) {
    next(error);
  }
}

// Eliminar insumo de una zona
export async function deleteZoneInput(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const zoneId = parseInt(req.params['zoneId']!);
    const zoneInput = await templateZonesService.deleteZoneInput(zoneId);
    res.json({ success: true, data: zoneInput });
  } catch (error) {
    next(error);
  }
}
