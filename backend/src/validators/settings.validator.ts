import { z } from 'zod';

// Configuración general de la tienda
export const storeSettingsSchema = z.object({
  storeName: z.string().min(1).max(100),
  storeDescription: z.string().max(500).optional(),
  storeLogo: z.string().url().optional(),
  storeEmail: z.string().email(),
  storePhone: z.string().optional(),
  storeAddress: z.string().optional(),
  socialMedia: z.object({
    facebook: z.string().url().optional(),
    instagram: z.string().url().optional(),
    twitter: z.string().url().optional(),
    whatsapp: z.string().optional(),
  }).optional(),
});

// Configuración de pedidos
export const orderSettingsSchema = z.object({
  shippingCost: z.coerce.number().min(0),
  freeShippingThreshold: z.coerce.number().min(0),
  taxRate: z.coerce.number().min(0).max(1),
  minOrderAmount: z.coerce.number().min(0).optional(),
  maxOrderItems: z.coerce.number().int().positive().optional(),
});

// Configuración de pagos
export const paymentSettingsSchema = z.object({
  enabledMethods: z.array(z.enum(['cash', 'transfer', 'card', 'nequi', 'daviplata', 'wompi'])),
  bankInfo: z.object({
    bankName: z.string().optional(),
    accountType: z.string().optional(),
    accountNumber: z.string().optional(),
    accountHolder: z.string().optional(),
  }).optional(),
  nequiNumber: z.string().optional(),
  daviplataNumber: z.string().optional(),
  // Wompi integration
  wompi: z.object({
    enabled: z.boolean().optional(),
    isTestMode: z.boolean().optional(),
    publicKey: z.string().optional(),
    privateKey: z.string().optional(),
    eventsSecret: z.string().optional(),
    integrityKey: z.string().optional(),
  }).optional(),
});

// Configuración de notificaciones
export const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  orderConfirmation: z.boolean(),
  orderStatusUpdates: z.boolean(),
  lowStockAlerts: z.boolean(),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
});

// Key de configuración
export const settingKeySchema = z.object({
  key: z.string().min(1, 'Key requerida'),
});

// Valor genérico de configuración
export const updateSettingSchema = z.object({
  value: z.any(),
});

export type StoreSettings = z.infer<typeof storeSettingsSchema>;
export type OrderSettings = z.infer<typeof orderSettingsSchema>;
export type PaymentSettings = z.infer<typeof paymentSettingsSchema>;
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;
