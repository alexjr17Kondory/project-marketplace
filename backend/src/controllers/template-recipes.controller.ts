import { Request, Response } from 'express';
import * as templateRecipesService from '../services/template-recipes.service';

/**
 * POST /api/template-recipes
 * Crear o actualizar receta para una variante de template
 */
export async function createTemplateRecipe(req: Request, res: Response): Promise<void> {
  try {
    const { variantId, inputVariantId, quantity } = req.body;

    if (!variantId || !inputVariantId) {
      res.status(400).json({
        message: 'variantId e inputVariantId son requeridos',
      });
      return;
    }

    const recipe = await templateRecipesService.createTemplateRecipe({
      variantId,
      inputVariantId,
      quantity,
    });

    res.status(201).json(recipe);
  } catch (error: any) {
    console.error('Error creating template recipe:', error);
    res.status(500).json({
      message: error.message || 'Error al crear receta de template',
    });
  }
}

/**
 * GET /api/template-recipes/variant/:variantId
 * Obtener todas las recetas de una variante específica (ahora soporta múltiples ingredientes)
 */
export async function getTemplateRecipe(req: Request, res: Response): Promise<void> {
  try {
    const variantId = parseInt(req.params.variantId || '0');

    const recipes = await templateRecipesService.getTemplateRecipes(variantId);

    if (!recipes || recipes.length === 0) {
      res.status(404).json({
        message: 'No se encontraron recetas para esta variante',
      });
      return;
    }

    res.json(recipes);
  } catch (error: any) {
    console.error('Error getting template recipes:', error);
    res.status(500).json({
      message: error.message || 'Error al obtener recetas',
    });
  }
}

/**
 * GET /api/template-recipes/product/:productId
 * Obtener todas las recetas de un template
 */
export async function getTemplateRecipesByProduct(req: Request, res: Response): Promise<void> {
  try {
    const productId = parseInt(req.params.productId || '0');

    const recipes = await templateRecipesService.getTemplateRecipesByProduct(productId);

    res.json(recipes);
  } catch (error: any) {
    console.error('Error getting template recipes:', error);
    res.status(500).json({
      message: error.message || 'Error al obtener recetas',
    });
  }
}

/**
 * GET /api/template-recipes/product/:productId/stock
 * Obtener stock disponible para todas las variantes de un template
 */
export async function getAvailableStock(req: Request, res: Response): Promise<void> {
  try {
    const productId = parseInt(req.params.productId || '0');

    const stock = await templateRecipesService.getAvailableStockForAllVariants(productId);

    res.json(stock);
  } catch (error: any) {
    console.error('Error getting available stock:', error);
    res.status(500).json({
      message: error.message || 'Error al calcular stock disponible',
    });
  }
}

/**
 * DELETE /api/template-recipes/variant/:variantId/input/:inputVariantId
 * Eliminar receta específica de una variante
 */
export async function deleteSpecificTemplateRecipe(req: Request, res: Response): Promise<void> {
  try {
    const variantId = parseInt(req.params.variantId || '0');
    const inputVariantId = parseInt(req.params.inputVariantId || '0');

    await templateRecipesService.deleteTemplateRecipe(variantId, inputVariantId);

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting specific template recipe:', error);
    res.status(500).json({
      message: error.message || 'Error al eliminar receta',
    });
  }
}

/**
 * DELETE /api/template-recipes/variant/:variantId
 * Eliminar todas las recetas de una variante
 */
export async function deleteTemplateRecipe(req: Request, res: Response): Promise<void> {
  try {
    const variantId = parseInt(req.params.variantId || '0');

    await templateRecipesService.deleteAllTemplateRecipes(variantId);

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting template recipes:', error);
    res.status(500).json({
      message: error.message || 'Error al eliminar recetas',
    });
  }
}

/**
 * POST /api/template-recipes/product/:productId/associate
 * Asociar insumos a un template (crea automáticamente las asociaciones de variantes)
 */
export async function associateInputsToTemplate(req: Request, res: Response): Promise<void> {
  try {
    const productId = parseInt(req.params.productId || '0');
    const { inputIds } = req.body;

    if (!Array.isArray(inputIds)) {
      res.status(400).json({
        message: 'inputIds debe ser un array',
      });
      return;
    }

    const result = await templateRecipesService.associateInputsToTemplate(productId, inputIds);

    res.json(result);
  } catch (error: any) {
    console.error('Error associating inputs to template:', error);
    res.status(500).json({
      message: error.message || 'Error al asociar insumos',
    });
  }
}

/**
 * GET /api/template-recipes/product/:productId/inputs
 * Obtener IDs de insumos asociados a un template
 */
export async function getAssociatedInputIds(req: Request, res: Response): Promise<void> {
  try {
    const productId = parseInt(req.params.productId || '0');

    const inputIds = await templateRecipesService.getAssociatedInputIds(productId);

    res.json({ inputIds });
  } catch (error: any) {
    console.error('Error getting associated input IDs:', error);
    res.status(500).json({
      message: error.message || 'Error al obtener insumos asociados',
    });
  }
}

/**
 * GET /api/template-recipes/variant-stock/:productId
 * Obtener stock disponible para una variante específica del template
 * basado en el insumo relacionado
 * Soporta búsqueda por colorId/sizeId O por colorHex/sizeName
 */
export async function getVariantStock(req: Request, res: Response): Promise<void> {
  try {
    const productId = parseInt(req.params.productId || '0');
    const colorId = req.query.colorId ? parseInt(req.query.colorId as string) : null;
    const sizeId = req.query.sizeId ? parseInt(req.query.sizeId as string) : null;
    const colorHex = req.query.colorHex as string | undefined;
    const sizeName = req.query.sizeName as string | undefined;

    const stockInfo = await templateRecipesService.getVariantStockByColorSize(
      productId,
      colorId,
      sizeId,
      colorHex,
      sizeName
    );

    res.json({
      success: true,
      data: stockInfo,
    });
  } catch (error: any) {
    console.error('Error getting variant stock:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener stock de variante',
    });
  }
}
