import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as cartController from '../controllers/cart.controller';

const router = Router();

// Todas las rutas del carrito requieren autenticacion
router.use(authenticate);

// GET /api/cart - Obtener carrito con validacion de stock
router.get('/', cartController.getCart);

// POST /api/cart/items - Agregar item al carrito
router.post('/items', cartController.addItem);

// PUT /api/cart/items/:id - Actualizar cantidad de un item
router.put('/items/:id', cartController.updateItem);

// PATCH /api/cart/items/:id/customization - Actualizar customization de un item personalizado
router.patch('/items/:id/customization', cartController.updateItemCustomization);

// DELETE /api/cart/items/:id - Eliminar item del carrito
router.delete('/items/:id', cartController.removeItem);

// DELETE /api/cart - Vaciar carrito
router.delete('/', cartController.clearCart);

// POST /api/cart/sync - Sincronizar localStorage con DB
router.post('/sync', cartController.syncCart);

export default router;
