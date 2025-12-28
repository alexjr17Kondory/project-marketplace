import { Request, Response, NextFunction } from 'express';
import { inventoryConversionsService } from '../services/inventory-conversions.service';

// Listar conversiones
export async function listConversions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, fromDate, toDate } = req.query;

    const filters: any = {};
    if (status) filters.status = status as string;
    if (fromDate) filters.fromDate = new Date(fromDate as string);
    if (toDate) filters.toDate = new Date(toDate as string);

    const conversions = await inventoryConversionsService.listConversions(filters);
    res.json({ success: true, data: conversions });
  } catch (error) {
    next(error);
  }
}

// Obtener conversión por ID
export async function getConversionById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id']!);
    const conversion = await inventoryConversionsService.getConversionById(id);
    res.json({ success: true, data: conversion });
  } catch (error) {
    next(error);
  }
}

// Crear conversión
export async function createConversion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as any).user;
    const data = {
      ...req.body,
      createdById: user?.userId,
      createdByName: user?.email, // Usamos email ya que no tenemos el nombre en el JWT
    };

    const conversion = await inventoryConversionsService.createConversion(data);
    res.status(201).json({ success: true, data: conversion });
  } catch (error) {
    next(error);
  }
}

// Agregar insumo a la conversión
export async function addInputItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const conversionId = parseInt(req.params['id']!);
    const conversion = await inventoryConversionsService.addInputItem(conversionId, req.body);
    res.status(201).json({ success: true, data: conversion });
  } catch (error) {
    next(error);
  }
}

// Actualizar item de insumo
export async function updateInputItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const conversionId = parseInt(req.params['id']!);
    const itemId = parseInt(req.params['itemId']!);
    const conversion = await inventoryConversionsService.updateInputItem(conversionId, itemId, req.body);
    res.json({ success: true, data: conversion });
  } catch (error) {
    next(error);
  }
}

// Eliminar item de insumo
export async function removeInputItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const conversionId = parseInt(req.params['id']!);
    const itemId = parseInt(req.params['itemId']!);
    const conversion = await inventoryConversionsService.removeInputItem(conversionId, itemId);
    res.json({ success: true, data: conversion });
  } catch (error) {
    next(error);
  }
}

// Agregar producto a la conversión
export async function addOutputItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const conversionId = parseInt(req.params['id']!);
    const conversion = await inventoryConversionsService.addOutputItem(conversionId, req.body);
    res.status(201).json({ success: true, data: conversion });
  } catch (error) {
    next(error);
  }
}

// Actualizar item de producto
export async function updateOutputItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const conversionId = parseInt(req.params['id']!);
    const itemId = parseInt(req.params['itemId']!);
    const conversion = await inventoryConversionsService.updateOutputItem(conversionId, itemId, req.body);
    res.json({ success: true, data: conversion });
  } catch (error) {
    next(error);
  }
}

// Eliminar item de producto
export async function removeOutputItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const conversionId = parseInt(req.params['id']!);
    const itemId = parseInt(req.params['itemId']!);
    const conversion = await inventoryConversionsService.removeOutputItem(conversionId, itemId);
    res.json({ success: true, data: conversion });
  } catch (error) {
    next(error);
  }
}

// Enviar a aprobación
export async function submitForApproval(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id']!);
    const conversion = await inventoryConversionsService.submitForApproval(id);
    res.json({ success: true, data: conversion });
  } catch (error) {
    next(error);
  }
}

// Aprobar conversión
export async function approveConversion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id']!);
    const user = (req as any).user;
    const data = {
      approvedById: user?.userId,
      approvedByName: user?.email,
    };

    const conversion = await inventoryConversionsService.approveConversion(id, data);
    res.json({ success: true, data: conversion });
  } catch (error) {
    next(error);
  }
}

// Cancelar conversión
export async function cancelConversion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id']!);
    const conversion = await inventoryConversionsService.cancelConversion(id);
    res.json({ success: true, data: conversion });
  } catch (error) {
    next(error);
  }
}

// Eliminar conversión
export async function deleteConversion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params['id']!);
    await inventoryConversionsService.deleteConversion(id);
    res.json({ success: true, message: 'Conversión eliminada exitosamente' });
  } catch (error) {
    next(error);
  }
}

// Obtener estadísticas
export async function getConversionStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await inventoryConversionsService.getConversionStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

// Crear conversión desde plantilla
export async function createConversionFromTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as any).user;
    const data = {
      ...req.body,
      createdById: user?.userId,
      createdByName: user?.email,
    };

    const conversion = await inventoryConversionsService.createConversionFromTemplate(data);
    res.status(201).json({ success: true, data: conversion });
  } catch (error) {
    next(error);
  }
}
