import { Request, Response } from 'express';
import * as cartService from '../services/cart.service';

/**
 * GET /api/cart
 * Obtener carrito del usuario logueado con validacion de stock
 */
export async function getCart(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const items = await cartService.getCartWithStock(userId);

    res.json({
      success: true,
      items,
    });
  } catch (error: any) {
    console.error('Error getting cart:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener carrito',
    });
  }
}

/**
 * POST /api/cart/items
 * Agregar item al carrito
 */
export async function addItem(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const { productId, variantId, isCustomized, customization, quantity, unitPrice } = req.body;

    if (!quantity || quantity < 1) {
      res.status(400).json({ message: 'La cantidad debe ser mayor a 0' });
      return;
    }

    if (unitPrice === undefined || unitPrice < 0) {
      res.status(400).json({ message: 'El precio unitario es requerido' });
      return;
    }

    const item = await cartService.addItem(userId, {
      productId,
      variantId,
      isCustomized: isCustomized || false,
      customization,
      quantity,
      unitPrice,
    });

    res.status(201).json({
      success: true,
      item,
    });
  } catch (error: any) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al agregar item al carrito',
    });
  }
}

/**
 * PUT /api/cart/items/:id
 * Actualizar cantidad de un item
 */
export async function updateItem(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const itemId = parseInt(req.params.id || '0');
    const { quantity } = req.body;

    if (!itemId || isNaN(itemId)) {
      res.status(400).json({ message: 'ID de item invalido' });
      return;
    }

    const item = await cartService.updateItemQuantity(userId, itemId, quantity);

    res.json({
      success: true,
      item,
    });
  } catch (error: any) {
    console.error('Error updating cart item:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar item',
    });
  }
}

/**
 * PATCH /api/cart/items/:id/customization
 * Actualizar customization de un item personalizado
 */
export async function updateItemCustomization(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const itemId = parseInt(req.params.id || '0');
    const { customization, unitPrice } = req.body;

    if (!itemId || isNaN(itemId)) {
      res.status(400).json({ message: 'ID de item invalido' });
      return;
    }

    if (!customization) {
      res.status(400).json({ message: 'customization es requerido' });
      return;
    }

    if (unitPrice === undefined || unitPrice < 0) {
      res.status(400).json({ message: 'unitPrice es requerido' });
      return;
    }

    const item = await cartService.updateItemCustomization(userId, itemId, customization, unitPrice);

    res.json({
      success: true,
      item,
    });
  } catch (error: any) {
    console.error('Error updating cart item customization:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar customization',
    });
  }
}

/**
 * DELETE /api/cart/items/:id
 * Eliminar item del carrito
 */
export async function removeItem(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const itemId = parseInt(req.params.id || '0');

    if (!itemId || isNaN(itemId)) {
      res.status(400).json({ message: 'ID de item invalido' });
      return;
    }

    await cartService.removeItem(userId, itemId);

    res.json({
      success: true,
      message: 'Item eliminado',
    });
  } catch (error: any) {
    console.error('Error removing cart item:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al eliminar item',
    });
  }
}

/**
 * DELETE /api/cart
 * Vaciar carrito
 */
export async function clearCart(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    await cartService.clearCart(userId);

    res.json({
      success: true,
      message: 'Carrito vaciado',
    });
  } catch (error: any) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al vaciar carrito',
    });
  }
}

/**
 * POST /api/cart/sync
 * Sincronizar localStorage con carrito en DB
 */
export async function syncCart(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const { items } = req.body;

    if (!Array.isArray(items)) {
      res.status(400).json({ message: 'items debe ser un array' });
      return;
    }

    // Mapear items del frontend al formato esperado
    const mappedItems = items.map((item: any) => ({
      productId: item.productId || item.customization?.templateId || null,
      variantId: item.variantId || null,
      isCustomized: item.isCustomized || !!item.customization,
      customization: item.customization || item,
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || item.price || item.customization?.price || 0,
    }));

    const syncedItems = await cartService.syncCart(userId, mappedItems);

    res.json({
      success: true,
      items: syncedItems,
    });
  } catch (error: any) {
    console.error('Error syncing cart:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al sincronizar carrito',
    });
  }
}
