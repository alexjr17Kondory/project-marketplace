import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import productsRoutes from './products.routes';
import ordersRoutes from './orders.routes';
import catalogsRoutes from './catalogs.routes';
import settingsRoutes from './settings.routes';
import rolesRoutes from './roles.routes';
import uploadsRoutes from './uploads.routes';
import webhooksRoutes from './webhooks.routes';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Verificar estado del servidor
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API funcionando correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: API funcionando correctamente
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: development
 */
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env['NODE_ENV'] || 'development',
  });
});

// Rutas de autenticación
router.use('/auth', authRoutes);

// Rutas de usuarios
router.use('/users', usersRoutes);

// Rutas de productos
router.use('/products', productsRoutes);

// Rutas de pedidos
router.use('/orders', ordersRoutes);

// Rutas de catálogos
router.use('/catalogs', catalogsRoutes);

// Rutas de configuración
router.use('/settings', settingsRoutes);

// Rutas de roles y permisos
router.use('/roles', rolesRoutes);

// Rutas de uploads (imágenes)
router.use('/uploads', uploadsRoutes);

// Rutas de webhooks (Wompi, etc.)
router.use('/webhooks', webhooksRoutes);

export default router;
