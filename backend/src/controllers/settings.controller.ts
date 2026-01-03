import { Request, Response, NextFunction } from 'express';
import * as settingsService from '../services/settings.service';

// Obtener configuración pública (para el frontend)
export async function getPublicSettings(_req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await settingsService.getPublicSettings();

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener todas las configuraciones (admin)
export async function getAllSettings(_req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await settingsService.getAllSettings();

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener configuración por key (admin)
export async function getSettingByKey(req: Request, res: Response, next: NextFunction) {
  try {
    const setting = await settingsService.getSettingByKey(req.params.key as string);

    res.json({
      success: true,
      data: setting,
    });
  } catch (error) {
    next(error);
  }
}

// Actualizar configuración por key (admin)
export async function updateSetting(req: Request, res: Response, next: NextFunction) {
  try {
    const setting = await settingsService.updateSetting(
      req.params.key as string,
      req.body.value
    );

    res.json({
      success: true,
      message: 'Configuración actualizada exitosamente',
      data: setting,
    });
  } catch (error) {
    next(error);
  }
}

// ==================== CONFIGURACIONES ESPECÍFICAS ====================

// Store Settings
export async function getStoreSettings(_req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await settingsService.getStoreSettings();

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateStoreSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const setting = await settingsService.updateStoreSettings(req.body);

    res.json({
      success: true,
      message: 'Configuración de tienda actualizada',
      data: setting,
    });
  } catch (error) {
    next(error);
  }
}

// Order Settings
export async function getOrderSettings(_req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await settingsService.getOrderSettings();

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateOrderSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const setting = await settingsService.updateOrderSettings(req.body);

    res.json({
      success: true,
      message: 'Configuración de pedidos actualizada',
      data: setting,
    });
  } catch (error) {
    next(error);
  }
}

// Payment Settings
export async function getPaymentSettings(_req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await settingsService.getPaymentSettings();

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePaymentSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const setting = await settingsService.updatePaymentSettings(req.body);

    res.json({
      success: true,
      message: 'Configuración de pagos actualizada',
      data: setting,
    });
  } catch (error) {
    next(error);
  }
}

// Notification Settings
export async function getNotificationSettings(_req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await settingsService.getNotificationSettings();

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateNotificationSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const setting = await settingsService.updateNotificationSettings(req.body);

    res.json({
      success: true,
      message: 'Configuración de notificaciones actualizada',
      data: setting,
    });
  } catch (error) {
    next(error);
  }
}

// ==================== CONFIGURACIONES ADICIONALES ====================

// General Settings
export async function getGeneralSettings(_req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await settingsService.getGeneralSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
}

export async function updateGeneralSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const setting = await settingsService.updateGeneralSettings(req.body);
    res.json({ success: true, message: 'Configuración general actualizada', data: setting });
  } catch (error) {
    next(error);
  }
}

// Appearance Settings
export async function getAppearanceSettings(_req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await settingsService.getAppearanceSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
}

export async function updateAppearanceSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const setting = await settingsService.updateAppearanceSettings(req.body);
    res.json({ success: true, message: 'Configuración de apariencia actualizada', data: setting });
  } catch (error) {
    next(error);
  }
}

// Shipping Settings (completo)
export async function getShippingSettingsFull(_req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await settingsService.getShippingSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
}

export async function updateShippingSettingsFull(req: Request, res: Response, next: NextFunction) {
  try {
    const setting = await settingsService.updateShippingSettings(req.body);
    res.json({ success: true, message: 'Configuración de envíos actualizada', data: setting });
  } catch (error) {
    next(error);
  }
}

// Home Settings
export async function getHomeSettings(_req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await settingsService.getHomeSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
}

export async function updateHomeSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const setting = await settingsService.updateHomeSettings(req.body);
    res.json({ success: true, message: 'Configuración de home actualizada', data: setting });
  } catch (error) {
    next(error);
  }
}

// Catalog Settings
export async function getCatalogSettings(_req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await settingsService.getCatalogSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
}

export async function updateCatalogSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const setting = await settingsService.updateCatalogSettings(req.body);
    res.json({ success: true, message: 'Configuración de catálogo actualizada', data: setting });
  } catch (error) {
    next(error);
  }
}

// Legal Settings
export async function getLegalSettings(_req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await settingsService.getLegalSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
}

export async function updateLegalSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const setting = await settingsService.updateLegalSettings(req.body);
    res.json({ success: true, message: 'Configuración legal actualizada', data: setting });
  } catch (error) {
    next(error);
  }
}

// Printing Settings
export async function getPrintingSettings(_req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await settingsService.getPrintingSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
}

export async function updatePrintingSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const setting = await settingsService.updatePrintingSettings(req.body);
    res.json({ success: true, message: 'Configuración de impresión actualizada', data: setting });
  } catch (error) {
    next(error);
  }
}
