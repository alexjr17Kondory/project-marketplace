import { Request, Response, NextFunction } from 'express';
import * as catalogsService from '../services/catalogs.service';

// ==================== TALLAS ====================

export async function listSizes(req: Request, res: Response, next: NextFunction) {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const sizes = await catalogsService.listSizes(includeInactive);

    res.json({
      success: true,
      data: sizes,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSizeById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const size = await catalogsService.getSizeById(id);

    res.json({
      success: true,
      data: size,
    });
  } catch (error) {
    next(error);
  }
}

export async function createSize(req: Request, res: Response, next: NextFunction) {
  try {
    const size = await catalogsService.createSize(req.body);

    res.status(201).json({
      success: true,
      message: 'Talla creada exitosamente',
      data: size,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSize(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const size = await catalogsService.updateSize(id, req.body);

    res.json({
      success: true,
      message: 'Talla actualizada exitosamente',
      data: size,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteSize(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    await catalogsService.deleteSize(id);

    res.json({
      success: true,
      message: 'Talla eliminada exitosamente',
    });
  } catch (error) {
    next(error);
  }
}

// ==================== COLORES ====================

export async function listColors(req: Request, res: Response, next: NextFunction) {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const colors = await catalogsService.listColors(includeInactive);

    res.json({
      success: true,
      data: colors,
    });
  } catch (error) {
    next(error);
  }
}

export async function getColorById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const color = await catalogsService.getColorById(id);

    res.json({
      success: true,
      data: color,
    });
  } catch (error) {
    next(error);
  }
}

export async function createColor(req: Request, res: Response, next: NextFunction) {
  try {
    const color = await catalogsService.createColor(req.body);

    res.status(201).json({
      success: true,
      message: 'Color creado exitosamente',
      data: color,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateColor(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const color = await catalogsService.updateColor(id, req.body);

    res.json({
      success: true,
      message: 'Color actualizado exitosamente',
      data: color,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteColor(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    await catalogsService.deleteColor(id);

    res.json({
      success: true,
      message: 'Color eliminado exitosamente',
    });
  } catch (error) {
    next(error);
  }
}

// ==================== CATEGORÍAS ====================

export async function listCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const categories = await catalogsService.listCategories(includeInactive);

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCategoryById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const category = await catalogsService.getCategoryById(id);

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await catalogsService.createCategory(req.body);

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: category,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const category = await catalogsService.updateCategory(id, req.body);

    res.json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: category,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    await catalogsService.deleteCategory(id);

    res.json({
      success: true,
      message: 'Categoría eliminada exitosamente',
    });
  } catch (error) {
    next(error);
  }
}

// ==================== TIPOS DE PRODUCTO ====================

export async function listProductTypes(req: Request, res: Response, next: NextFunction) {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const types = await catalogsService.listProductTypes(includeInactive);

    res.json({
      success: true,
      data: types,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductTypeById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const type = await catalogsService.getProductTypeById(id);

    res.json({
      success: true,
      data: type,
    });
  } catch (error) {
    next(error);
  }
}

export async function createProductType(req: Request, res: Response, next: NextFunction) {
  try {
    const type = await catalogsService.createProductType(req.body);

    res.status(201).json({
      success: true,
      message: 'Tipo de producto creado exitosamente',
      data: type,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProductType(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const type = await catalogsService.updateProductType(id, req.body);

    res.json({
      success: true,
      message: 'Tipo de producto actualizado exitosamente',
      data: type,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProductType(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    await catalogsService.deleteProductType(id);

    res.json({
      success: true,
      message: 'Tipo de producto eliminado exitosamente',
    });
  } catch (error) {
    next(error);
  }
}
