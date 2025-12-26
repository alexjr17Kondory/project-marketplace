import { Request, Response } from 'express';
import * as variantsService from '../services/variants.service';

/**
 * Listar variantes con filtros
 * GET /api/variants
 */
export async function listVariants(req: Request, res: Response): Promise<void> {
  try {
    const { productId, colorId, sizeId, isActive, lowStock } = req.query;

    const filter: any = {};

    if (productId) filter.productId = Number(productId);
    if (colorId) filter.colorId = Number(colorId);
    if (sizeId) filter.sizeId = Number(sizeId);
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (lowStock !== undefined) filter.lowStock = lowStock === 'true';

    const variants = await variantsService.getVariants(filter);

    res.json({
      success: true,
      data: variants,
    });
  } catch (error: any) {
    console.error('Error listing variants:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al listar variantes',
    });
  }
}

/**
 * Crear una variante manualmente
 * POST /api/variants
 */
export async function createVariant(req: Request, res: Response): Promise<void> {
  try {
    const { productId, colorId, sizeId, sku, barcode, stock, minStock, priceAdjustment } =
      req.body;

    if (!productId || !colorId || !sizeId) {
      res.status(400).json({
        success: false,
        message: 'productId, colorId y sizeId son requeridos',
      });
      return;
    }

    const variant = await variantsService.createVariant({
      productId: Number(productId),
      colorId: Number(colorId),
      sizeId: Number(sizeId),
      sku,
      barcode,
      stock: stock !== undefined ? Number(stock) : undefined,
      minStock: minStock !== undefined ? Number(minStock) : undefined,
      priceAdjustment: priceAdjustment !== undefined ? Number(priceAdjustment) : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Variante creada exitosamente',
      data: variant,
    });
  } catch (error: any) {
    console.error('Error creating variant:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al crear variante',
    });
  }
}

/**
 * Obtener una variante por ID
 * GET /api/variants/:id
 */
export async function getVariant(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const variant = await variantsService.getVariantById(Number(id));

    if (!variant) {
      res.status(404).json({
        success: false,
        message: 'Variante no encontrada',
      });
      return;
    }

    res.json({
      success: true,
      data: variant,
    });
  } catch (error: any) {
    console.error('Error getting variant:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener variante',
    });
  }
}

/**
 * Actualizar una variante
 * PATCH /api/variants/:id
 */
export async function updateVariant(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { sku, barcode, stock, minStock, priceAdjustment, isActive } = req.body;

    const updateData: any = {};

    if (sku !== undefined) updateData.sku = sku;
    if (barcode !== undefined) updateData.barcode = barcode;
    if (stock !== undefined) updateData.stock = Number(stock);
    if (minStock !== undefined) updateData.minStock = Number(minStock);
    if (priceAdjustment !== undefined) updateData.priceAdjustment = Number(priceAdjustment);
    if (isActive !== undefined) updateData.isActive = isActive;

    const variant = await variantsService.updateVariant(Number(id), updateData);

    res.json({
      success: true,
      message: 'Variante actualizada exitosamente',
      data: variant,
    });
  } catch (error: any) {
    console.error('Error updating variant:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar variante',
    });
  }
}

/**
 * Eliminar una variante
 * DELETE /api/variants/:id
 */
export async function deleteVariant(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    await variantsService.deleteVariant(Number(id));

    res.json({
      success: true,
      message: 'Variante eliminada exitosamente',
    });
  } catch (error: any) {
    console.error('Error deleting variant:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al eliminar variante',
    });
  }
}

/**
 * Buscar variante por código de barras
 * GET /api/variants/barcode/:barcode
 */
export async function getVariantByBarcode(req: Request, res: Response): Promise<void> {
  try {
    const barcode = req.params.barcode as string;

    const variant = await variantsService.getVariantByBarcode(barcode);

    if (!variant) {
      res.status(404).json({
        success: false,
        message: 'Variante no encontrada',
      });
      return;
    }

    res.json({
      success: true,
      data: variant,
    });
  } catch (error: any) {
    console.error('Error getting variant by barcode:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al buscar variante',
    });
  }
}

/**
 * Buscar variante por SKU
 * GET /api/variants/sku/:sku
 */
export async function getVariantBySku(req: Request, res: Response): Promise<void> {
  try {
    const sku = req.params.sku as string;

    const variant = await variantsService.getVariantBySku(sku);

    if (!variant) {
      res.status(404).json({
        success: false,
        message: 'Variante no encontrada',
      });
      return;
    }

    res.json({
      success: true,
      data: variant,
    });
  } catch (error: any) {
    console.error('Error getting variant by SKU:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al buscar variante',
    });
  }
}

/**
 * Generar variantes automáticamente para un producto
 * POST /api/variants/generate/:productId
 */
export async function generateVariants(req: Request, res: Response): Promise<void> {
  try {
    const { productId } = req.params;
    const { initialStock } = req.body;

    const result = await variantsService.generateVariantsForProduct(
      Number(productId),
      initialStock !== undefined ? Number(initialStock) : 0
    );

    res.status(201).json({
      success: true,
      message: `Se generaron ${result.total} variantes`,
      data: result,
    });
  } catch (error: any) {
    console.error('Error generating variants:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al generar variantes',
    });
  }
}

/**
 * Ajustar stock de una variante
 * POST /api/variants/:id/adjust-stock
 */
export async function adjustStock(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { quantity, reason } = req.body;

    if (quantity === undefined) {
      res.status(400).json({
        success: false,
        message: 'quantity es requerido',
      });
      return;
    }

    const variant = await variantsService.adjustStock(Number(id), Number(quantity), reason);

    res.json({
      success: true,
      message: 'Stock ajustado exitosamente',
      data: variant,
    });
  } catch (error: any) {
    console.error('Error adjusting stock:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al ajustar stock',
    });
  }
}

/**
 * Obtener variantes con stock bajo
 * GET /api/variants/low-stock
 */
export async function getLowStock(req: Request, res: Response): Promise<void> {
  try {
    const variants = await variantsService.checkLowStock();

    res.json({
      success: true,
      data: variants,
    });
  } catch (error: any) {
    console.error('Error getting low stock:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener variantes con stock bajo',
    });
  }
}
