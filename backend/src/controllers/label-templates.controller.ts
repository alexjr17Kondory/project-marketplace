import { Request, Response } from 'express';
import * as labelTemplatesService from '../services/label-templates.service';

// ==================== PLANTILLAS ====================

/**
 * GET /api/label-templates
 * Obtener todas las plantillas de etiquetas
 */
export async function getLabelTemplates(req: Request, res: Response): Promise<void> {
  try {
    const includeZones = req.query.includeZones !== 'false';
    const templates = await labelTemplatesService.getLabelTemplates(includeZones);

    res.json({
      success: true,
      data: templates,
    });
  } catch (error: any) {
    console.error('Error getting label templates:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener plantillas',
    });
  }
}

/**
 * GET /api/label-templates/:id
 * Obtener plantilla por ID
 */
export async function getLabelTemplateById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const template = await labelTemplatesService.getLabelTemplateById(Number(id));

    res.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    console.error('Error getting label template:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Plantilla no encontrada',
    });
  }
}

/**
 * GET /api/label-templates/product-type/:productTypeId
 * Obtener plantilla para un tipo de producto
 */
export async function getLabelTemplateForProductType(req: Request, res: Response): Promise<void> {
  try {
    const { productTypeId } = req.params;
    const template = await labelTemplatesService.getLabelTemplateForProductType(Number(productTypeId));

    res.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    console.error('Error getting label template for product type:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Plantilla no encontrada',
    });
  }
}

/**
 * POST /api/label-templates
 * Crear nueva plantilla
 */
export async function createLabelTemplate(req: Request, res: Response): Promise<void> {
  try {
    const data = req.body;
    const template = await labelTemplatesService.createLabelTemplate(data);

    res.status(201).json({
      success: true,
      message: 'Plantilla creada exitosamente',
      data: template,
    });
  } catch (error: any) {
    console.error('Error creating label template:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al crear plantilla',
    });
  }
}

/**
 * PATCH /api/label-templates/:id
 * Actualizar plantilla
 */
export async function updateLabelTemplate(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const data = req.body;
    const template = await labelTemplatesService.updateLabelTemplate(Number(id), data);

    res.json({
      success: true,
      message: 'Plantilla actualizada exitosamente',
      data: template,
    });
  } catch (error: any) {
    console.error('Error updating label template:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar plantilla',
    });
  }
}

/**
 * DELETE /api/label-templates/:id
 * Eliminar plantilla
 */
export async function deleteLabelTemplate(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await labelTemplatesService.deleteLabelTemplate(Number(id));

    res.json({
      success: true,
      message: 'Plantilla eliminada exitosamente',
    });
  } catch (error: any) {
    console.error('Error deleting label template:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al eliminar plantilla',
    });
  }
}

/**
 * POST /api/label-templates/:id/duplicate
 * Duplicar plantilla
 */
export async function duplicateLabelTemplate(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        message: 'El nombre es requerido',
      });
      return;
    }

    const template = await labelTemplatesService.duplicateLabelTemplate(Number(id), name);

    res.status(201).json({
      success: true,
      message: 'Plantilla duplicada exitosamente',
      data: template,
    });
  } catch (error: any) {
    console.error('Error duplicating label template:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al duplicar plantilla',
    });
  }
}

// ==================== ZONAS ====================

/**
 * POST /api/label-templates/:templateId/zones
 * Crear zona en una plantilla
 */
export async function createLabelZone(req: Request, res: Response): Promise<void> {
  try {
    const { templateId } = req.params;
    const data = {
      ...req.body,
      labelTemplateId: Number(templateId),
    };

    const zone = await labelTemplatesService.createLabelZone(data);

    res.status(201).json({
      success: true,
      message: 'Zona creada exitosamente',
      data: zone,
    });
  } catch (error: any) {
    console.error('Error creating label zone:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al crear zona',
    });
  }
}

/**
 * PATCH /api/label-templates/zones/:zoneId
 * Actualizar zona
 */
export async function updateLabelZone(req: Request, res: Response): Promise<void> {
  try {
    const { zoneId } = req.params;
    const data = req.body;

    const zone = await labelTemplatesService.updateLabelZone(Number(zoneId), data);

    res.json({
      success: true,
      message: 'Zona actualizada exitosamente',
      data: zone,
    });
  } catch (error: any) {
    console.error('Error updating label zone:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar zona',
    });
  }
}

/**
 * PATCH /api/label-templates/:templateId/zones/batch
 * Actualizar múltiples zonas
 */
export async function updateLabelZones(req: Request, res: Response): Promise<void> {
  try {
    const { templateId } = req.params;
    const { zones } = req.body;

    if (!Array.isArray(zones)) {
      res.status(400).json({
        success: false,
        message: 'zones debe ser un array',
      });
      return;
    }

    const updatedZones = await labelTemplatesService.updateLabelZones(Number(templateId), zones);

    res.json({
      success: true,
      message: 'Zonas actualizadas exitosamente',
      data: updatedZones,
    });
  } catch (error: any) {
    console.error('Error updating label zones:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar zonas',
    });
  }
}

/**
 * DELETE /api/label-templates/zones/:zoneId
 * Eliminar zona
 */
export async function deleteLabelZone(req: Request, res: Response): Promise<void> {
  try {
    const { zoneId } = req.params;
    await labelTemplatesService.deleteLabelZone(Number(zoneId));

    res.json({
      success: true,
      message: 'Zona eliminada exitosamente',
    });
  } catch (error: any) {
    console.error('Error deleting label zone:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al eliminar zona',
    });
  }
}
