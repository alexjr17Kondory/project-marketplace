import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  storeSettingsSchema,
  orderSettingsSchema,
  notificationSettingsSchema,
  updateSettingSchema,
} from '../validators/settings.validator';

const router = Router();

// ==================== RUTAS PÚBLICAS ====================

/**
 * @swagger
 * /settings/public:
 *   get:
 *     summary: Obtener configuración pública
 *     description: Retorna la configuración necesaria para el frontend (tienda, envío, impuestos, métodos de pago)
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Configuración pública
 */
router.get('/public', settingsController.getPublicSettings);

// ==================== RUTAS ESPECÍFICAS (DEBEN IR ANTES DE /:key) ====================

// Store Settings
router.get('/store/config', authenticate, requireAdmin, settingsController.getStoreSettings);
router.put(
  '/store/config',
  authenticate,
  requireAdmin,
  validate(storeSettingsSchema),
  settingsController.updateStoreSettings
);

// Order Settings
router.get('/orders/config', authenticate, requireAdmin, settingsController.getOrderSettings);
router.put(
  '/orders/config',
  authenticate,
  requireAdmin,
  validate(orderSettingsSchema),
  settingsController.updateOrderSettings
);

// Payment Settings
router.get('/payments/config', authenticate, requireAdmin, settingsController.getPaymentSettings);
router.put('/payments/config', authenticate, requireAdmin, settingsController.updatePaymentSettings);

// Notification Settings
router.get('/notifications/config', authenticate, requireAdmin, settingsController.getNotificationSettings);
router.put(
  '/notifications/config',
  authenticate,
  requireAdmin,
  validate(notificationSettingsSchema),
  settingsController.updateNotificationSettings
);

// General Settings
router.get('/general/config', authenticate, requireAdmin, settingsController.getGeneralSettings);
router.put('/general/config', authenticate, requireAdmin, settingsController.updateGeneralSettings);

// Appearance Settings
router.get('/appearance/config', authenticate, requireAdmin, settingsController.getAppearanceSettings);
router.put('/appearance/config', authenticate, requireAdmin, settingsController.updateAppearanceSettings);

// Shipping Settings (full)
router.get('/shipping/config', authenticate, requireAdmin, settingsController.getShippingSettingsFull);
router.put('/shipping/config', authenticate, requireAdmin, settingsController.updateShippingSettingsFull);

// Home Settings
router.get('/home/config', authenticate, requireAdmin, settingsController.getHomeSettings);
router.put('/home/config', authenticate, requireAdmin, settingsController.updateHomeSettings);

// Catalog Settings
router.get('/catalog/config', authenticate, requireAdmin, settingsController.getCatalogSettings);
router.put('/catalog/config', authenticate, requireAdmin, settingsController.updateCatalogSettings);

// Legal Settings
router.get('/legal/config', authenticate, requireAdmin, settingsController.getLegalSettings);
router.put('/legal/config', authenticate, requireAdmin, settingsController.updateLegalSettings);

// ==================== RUTAS ADMIN GENÉRICAS ====================

/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Obtener todas las configuraciones
 *     description: Retorna todas las configuraciones del sistema (solo admin)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticate, requireAdmin, settingsController.getAllSettings);

/**
 * @swagger
 * /settings/{key}:
 *   get:
 *     summary: Obtener configuración por key genérica
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Key de la configuración
 *         example: store_settings
 */
router.get('/:key', authenticate, requireAdmin, settingsController.getSettingByKey);

/**
 * @swagger
 * /settings/{key}:
 *   put:
 *     summary: Actualizar configuración por key genérica
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:key',
  authenticate,
  requireAdmin,
  validate(updateSettingSchema),
  settingsController.updateSetting
);

export default router;
