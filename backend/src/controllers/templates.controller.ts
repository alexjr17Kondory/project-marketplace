import { Request, Response, NextFunction } from 'express';
import * as templatesService from '../services/templates.service';

// Listar todos los templates (admin)
export async function listTemplates(req: Request, res: Response, next: NextFunction) {
  try {
    const templates = await templatesService.listTemplates();

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    next(error);
  }
}

// Listar templates públicos (para personalizador)
export async function listPublicTemplates(req: Request, res: Response, next: NextFunction) {
  try {
    const templates = await templatesService.listPublicTemplates();

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    next(error);
  }
}

// Listar templates por tipo de producto (público - para personalizador)
export async function getTemplatesByType(req: Request, res: Response, next: NextFunction) {
  try {
    const typeSlug = req.params.typeSlug as string;
    const templates = await templatesService.getTemplatesByType(typeSlug);

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener template por ID
export async function getTemplateById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const template = await templatesService.getTemplateById(id);

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
}

// Crear template (admin)
export async function createTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const template = await templatesService.createTemplate(req.body);

    res.status(201).json({
      success: true,
      message: 'Template creado exitosamente',
      data: template,
    });
  } catch (error) {
    next(error);
  }
}

// Actualizar template (admin)
export async function updateTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const template = await templatesService.updateTemplate(id, req.body);

    res.json({
      success: true,
      message: 'Template actualizado exitosamente',
      data: template,
    });
  } catch (error) {
    next(error);
  }
}

// Eliminar template (admin)
export async function deleteTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    await templatesService.deleteTemplate(id);

    res.json({
      success: true,
      message: 'Template eliminado exitosamente',
    });
  } catch (error) {
    next(error);
  }
}
