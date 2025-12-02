import { Request, Response, NextFunction } from 'express';
import * as productsService from '../services/products.service';

// Listar productos (público)
export async function listProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await productsService.listProducts(req.query as any);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener producto por ID (público)
export async function getProductById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const product = await productsService.getProductById(id);

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
}

// Crear producto (admin)
export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productsService.createProduct(req.body);

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: product,
    });
  } catch (error) {
    next(error);
  }
}

// Actualizar producto (admin)
export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const product = await productsService.updateProduct(id, req.body);

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: product,
    });
  } catch (error) {
    next(error);
  }
}

// Eliminar producto (admin)
export async function deleteProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    await productsService.deleteProduct(id);

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente',
    });
  } catch (error) {
    next(error);
  }
}

// Actualizar stock (admin)
export async function updateStock(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const product = await productsService.updateStock(id, req.body);

    res.json({
      success: true,
      message: 'Stock actualizado exitosamente',
      data: product,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener productos destacados (público)
export async function getFeaturedProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 8;
    const products = await productsService.getFeaturedProducts(limit);

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener productos por categoría (público)
export async function getProductsByCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 12;
    const products = await productsService.getProductsByCategory(
      req.params.category as string,
      limit
    );

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener categorías únicas (público)
export async function getCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await productsService.getCategories();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener tipos únicos (público)
export async function getTypes(_req: Request, res: Response, next: NextFunction) {
  try {
    const types = await productsService.getTypes();

    res.json({
      success: true,
      data: types,
    });
  } catch (error) {
    next(error);
  }
}
