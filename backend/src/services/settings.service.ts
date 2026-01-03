import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';
import type {
  StoreSettings,
  OrderSettings,
  PaymentSettings,
  NotificationSettings,
} from '../validators/settings.validator';

// Keys predefinidas del sistema
export const SETTING_KEYS = {
  // Keys básicas (existentes)
  STORE: 'store_settings',
  ORDER: 'order_settings',
  PAYMENT: 'payment_settings',
  NOTIFICATION: 'notification_settings',
  // Keys adicionales para frontend completo
  GENERAL: 'general_settings',
  APPEARANCE: 'appearance_settings',
  SHIPPING: 'shipping_settings',
  HOME: 'home_settings',
  CATALOG: 'catalog_settings',
  LEGAL: 'legal_settings',
  PRINTING: 'printing_settings',
} as const;

// Valores por defecto
const DEFAULT_SETTINGS: Record<string, any> = {
  [SETTING_KEYS.STORE]: {
    storeName: 'Mi Marketplace',
    storeDescription: 'Tienda de productos personalizados',
    storeEmail: 'info@marketplace.com',
    storePhone: '',
    storeAddress: '',
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: '',
      whatsapp: '',
    },
  },
  [SETTING_KEYS.ORDER]: {
    shippingCost: 12000,
    freeShippingThreshold: 150000,
    taxRate: 0.19,
    minOrderAmount: 0,
    maxOrderItems: 20,
  },
  [SETTING_KEYS.PAYMENT]: {
    // Estructura del frontend
    methods: [
      {
        id: 'pm-1',
        type: 'wompi',
        name: 'Wompi',
        description: 'Paga con tarjeta de crédito/débito, PSE o Nequi',
        isActive: true,
        wompiConfig: {
          publicKey: '',
          privateKey: '',
          integrityKey: '',
          eventSecret: '',
          isTestMode: true,
        },
      },
      {
        id: 'pm-2',
        type: 'transfer',
        name: 'Transferencia Bancaria',
        description: 'Paga directamente desde tu banco',
        instructions: 'Realiza la transferencia y envía el comprobante.',
        isActive: false,
        bankInfo: {
          bankName: '',
          accountType: '',
          accountNumber: '',
          accountHolder: '',
          documentType: '',
          documentNumber: '',
        },
      },
      {
        id: 'pm-3',
        type: 'cash',
        name: 'Pago Contra Entrega',
        description: 'Paga cuando recibas tu pedido',
        instructions: 'Solo disponible para ciertas zonas.',
        isActive: false,
      },
      {
        id: 'pm-4',
        type: 'pickup',
        name: 'Pago en Punto Físico',
        description: 'Recoge y paga en nuestra tienda',
        instructions: 'Tu pedido estará listo para recoger en 2-3 días hábiles.',
        isActive: false,
        pickupConfig: {
          storeName: '',
          address: '',
          city: '',
          scheduleWeekdays: '',
          scheduleWeekends: '',
          phone: '',
        },
      },
    ],
    taxEnabled: false, // Por defecto deshabilitado para pequeños negocios
    taxRate: 19,
    taxIncluded: true,
  },
  [SETTING_KEYS.NOTIFICATION]: {
    emailNotifications: true,
    orderConfirmation: true,
    orderStatusUpdates: true,
    lowStockAlerts: true,
    lowStockThreshold: 10,
  },
  // Configuraciones adicionales del frontend
  [SETTING_KEYS.GENERAL]: {
    siteName: 'Mi Marketplace',
    siteDescription: 'Tienda de productos personalizados',
    slogan: 'Tu Estilo, Tu Diseño',
    logo: '',
    brandColors: {
      primary: '#7c3aed',
      secondary: '#ec4899',
      accent: '#f59e0b',
    },
    contactEmail: 'info@marketplace.com',
    contactPhone: '',
    address: '',
    city: '',
    country: 'Colombia',
    currency: 'COP',
    currencySymbol: '$',
    socialLinks: {
      facebook: '',
      instagram: '',
      whatsapp: '',
    },
  },
  [SETTING_KEYS.APPEARANCE]: {
    brandColors: {
      primary: '#7c3aed',
      secondary: '#ec4899',
      accent: '#f59e0b',
    },
    buttonColor: '#7c3aed',
    headerBgColor: '#ffffff',
    showSlogan: true,
    headerStyle: 'default',
    footerBgColor: '#111827',
    showSocialInFooter: true,
    showScheduleInFooter: true,
    useGradientHero: true,
  },
  [SETTING_KEYS.SHIPPING]: {
    origin: {
      companyName: '',
      contactName: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Colombia',
    },
    zones: [],
    carriers: [],
    defaultCarrierId: null,
    handlingTime: 2,
    packageDefaults: {
      defaultLength: 30,
      defaultWidth: 25,
      defaultHeight: 5,
      defaultWeightPerItem: 0.25,
      volumetricDivisor: 5000,
    },
  },
  [SETTING_KEYS.HOME]: {
    enableCustomizer: true,
    hero: {
      badge: '100% Personalizable',
      title: 'Dale Vida a tu',
      titleHighlight: 'Creatividad',
      subtitle: 'Crea diseños únicos en camisetas y hoodies.',
      primaryButtonText: 'Personalizar Ahora',
      primaryButtonLink: '/customize',
      showPrimaryButton: true,
      secondaryButtonText: 'Ver Catálogo',
      secondaryButtonLink: '/catalog',
      showSecondaryButton: true,
      showBadge: true,
      highlights: ['Sin mínimos', 'Envío rápido', 'Alta calidad'],
      showHighlights: true,
      useGradientBackground: true,
    },
    features: [
      {
        id: 'feature-1',
        icon: 'palette',
        title: 'Personalización Fácil',
        description: 'Editor visual intuitivo para crear diseños únicos en minutos',
        isActive: true,
        order: 1,
      },
      {
        id: 'feature-2',
        icon: 'sparkles',
        title: 'Alta Calidad',
        description: 'Productos premium con impresión de alta resolución',
        isActive: true,
        order: 2,
      },
      {
        id: 'feature-3',
        icon: 'package',
        title: 'Entrega Rápida',
        description: 'Producción y envío en tiempo récord',
        isActive: true,
        order: 3,
      },
    ],
    showFeatures: true,
    productSections: [
      {
        id: 'section-1',
        title: 'Productos Destacados',
        subtitle: 'Los favoritos de nuestros clientes para sublimación',
        filters: { featured: true },
        maxProducts: 5,
        showViewAll: true,
        viewAllLink: '/catalog?featured=true',
        isActive: true,
        order: 1,
      },
      {
        id: 'section-2',
        title: 'Los Más Vendidos',
        subtitle: 'Lo que más eligen nuestros clientes',
        filters: { bestsellers: true },
        maxProducts: 5,
        showViewAll: true,
        viewAllLink: '/catalog?sort=bestsellers',
        isActive: true,
        order: 2,
      },
      {
        id: 'section-3',
        title: 'Tazas y Termos',
        subtitle: 'Personaliza tu bebida favorita con diseños únicos',
        filters: { categoryId: 'drinkware' },
        maxProducts: 5,
        showViewAll: true,
        viewAllLink: '/catalog?category=drinkware',
        isActive: true,
        order: 3,
      },
      {
        id: 'section-4',
        title: 'Decoración y Hogar',
        subtitle: 'Cuadros, posa vasos y más para tu espacio',
        filters: { categoryId: 'home' },
        maxProducts: 5,
        showViewAll: true,
        viewAllLink: '/catalog?category=home',
        isActive: true,
        order: 4,
      },
    ],
    cta: {
      badge: 'Crea sin límites',
      showBadge: true,
      title: '¿Listo para crear algo único?',
      subtitle: 'Empieza a diseñar tu prenda personalizada ahora',
      buttonText: 'Personalizar Ahora',
      buttonLink: '/customize',
      showButton: true,
      isActive: true,
    },
    whatsappButton: {
      isActive: false,
      phoneNumber: '',
      defaultMessage: '',
      position: 'bottom-right',
      showOnMobile: true,
      showOnDesktop: true,
      buttonColor: '#25D366',
      pulseAnimation: true,
      showTooltip: true,
      tooltipText: '¿Necesitas ayuda?',
    },
  },
  [SETTING_KEYS.CATALOG]: {
    filters: {
      showCategoryFilter: true,
      showTypeFilter: true,
      showPriceFilter: true,
      showStockFilter: true,
      showFeaturedFilter: true,
      // Usar slugs en español que coinciden con la BD
      enabledCategories: ['ropa', 'accesorios', 'bebidas', 'hogar', 'oficina'],
      enabledProductTypes: [
        'camiseta', 'hoodie', 'sueter', 'polo', 'gorra',
        'taza', 'taza-magica', 'termo', 'vaso-termico',
        'cuadro-aluminio', 'posa-vasos', 'cojin', 'reloj', 'rompecabezas', 'manta',
        'llavero', 'mouse-pad', 'funda-celular', 'bolsa-tote', 'lanyard', 'libreta', 'calendario'
      ],
    },
    defaultProductsPerPage: 12,
    showSortOptions: true,
  },
  [SETTING_KEYS.LEGAL]: {
    termsAndConditions: {
      id: 'terms',
      title: 'Términos y Condiciones',
      slug: 'terms',
      content: '',
      isActive: true,
      lastUpdated: null,
    },
    privacyPolicy: {
      id: 'privacy',
      title: 'Política de Privacidad',
      slug: 'privacy',
      content: '',
      isActive: true,
      lastUpdated: null,
    },
    returnsPolicy: {
      id: 'returns',
      title: 'Política de Devoluciones',
      slug: 'returns',
      content: '',
      isActive: true,
      lastUpdated: null,
    },
  },
  [SETTING_KEYS.PRINTING]: {
    // Formato de papel para tickets POS
    ticketFormat: '80mm',
    ticketWidth: 80,
    ticketHeight: 0, // 0 = continuo para tickets térmicos
    ticketMargins: { top: 5, right: 5, bottom: 10, left: 5 },
    ticketLogo: '', // Logo específico para tickets (opcional)
    // Opciones de visibilidad del header
    showLogo: true,
    showStoreName: true, // Mostrar nombre de la empresa
    showNit: true, // Mostrar NIT
    // Opciones generales
    showQR: false,
    fontSize: 'medium',
    showPreviewModal: true,
    selectedTemplateId: 'thermal-80mm',
  },
};

// Obtener todas las configuraciones
export async function getAllSettings() {
  const settings = await prisma.setting.findMany();

  const result: Record<string, any> = {};

  // Incluir valores por defecto para keys que no existen
  for (const [key, defaultValue] of Object.entries(DEFAULT_SETTINGS)) {
    const setting = settings.find((s) => s.key === key);
    result[key] = setting ? setting.value : defaultValue;
  }

  // Incluir cualquier otra configuración personalizada
  for (const setting of settings) {
    if (!result[setting.key]) {
      result[setting.key] = setting.value;
    }
  }

  return result;
}

// Obtener configuración por key
export async function getSettingByKey(key: string) {
  const setting = await prisma.setting.findUnique({
    where: { key },
  });

  if (!setting) {
    // Retornar valor por defecto si existe
    if (DEFAULT_SETTINGS[key]) {
      return { key, value: DEFAULT_SETTINGS[key] };
    }
    throw new NotFoundError(`Configuración '${key}' no encontrada`);
  }

  return setting;
}

// Actualizar o crear configuración
export async function updateSetting(key: string, value: any) {
  const setting = await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  return setting;
}

// Configuraciones específicas con tipado

export async function getStoreSettings(): Promise<StoreSettings> {
  const setting = await getSettingByKey(SETTING_KEYS.STORE);
  return setting.value as StoreSettings;
}

export async function updateStoreSettings(data: StoreSettings) {
  return updateSetting(SETTING_KEYS.STORE, data);
}

export async function getOrderSettings(): Promise<OrderSettings> {
  const setting = await getSettingByKey(SETTING_KEYS.ORDER);
  return setting.value as OrderSettings;
}

export async function updateOrderSettings(data: OrderSettings) {
  return updateSetting(SETTING_KEYS.ORDER, data);
}

export async function getPaymentSettings(): Promise<any> {
  const setting = await getSettingByKey(SETTING_KEYS.PAYMENT);
  return setting.value;
}

export async function updatePaymentSettings(data: any) {
  return updateSetting(SETTING_KEYS.PAYMENT, data);
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const setting = await getSettingByKey(SETTING_KEYS.NOTIFICATION);
  return setting.value as NotificationSettings;
}

export async function updateNotificationSettings(data: NotificationSettings) {
  return updateSetting(SETTING_KEYS.NOTIFICATION, data);
}

// ==================== CONFIGURACIONES ADICIONALES ====================

// General Settings
export async function getGeneralSettings() {
  const setting = await getSettingByKey(SETTING_KEYS.GENERAL);
  return setting.value;
}

export async function updateGeneralSettings(data: any) {
  return updateSetting(SETTING_KEYS.GENERAL, data);
}

// Appearance Settings
export async function getAppearanceSettings() {
  const setting = await getSettingByKey(SETTING_KEYS.APPEARANCE);
  return setting.value;
}

export async function updateAppearanceSettings(data: any) {
  return updateSetting(SETTING_KEYS.APPEARANCE, data);
}

// Shipping Settings
export async function getShippingSettings() {
  const setting = await getSettingByKey(SETTING_KEYS.SHIPPING);
  return setting.value;
}

export async function updateShippingSettings(data: any) {
  return updateSetting(SETTING_KEYS.SHIPPING, data);
}

// Home Settings
export async function getHomeSettings() {
  const setting = await getSettingByKey(SETTING_KEYS.HOME);
  return setting.value;
}

export async function updateHomeSettings(data: any) {
  return updateSetting(SETTING_KEYS.HOME, data);
}

// Catalog Settings
export async function getCatalogSettings() {
  const setting = await getSettingByKey(SETTING_KEYS.CATALOG);
  return setting.value;
}

export async function updateCatalogSettings(data: any) {
  return updateSetting(SETTING_KEYS.CATALOG, data);
}

// Legal Settings
export async function getLegalSettings() {
  const setting = await getSettingByKey(SETTING_KEYS.LEGAL);
  return setting.value;
}

export async function updateLegalSettings(data: any) {
  return updateSetting(SETTING_KEYS.LEGAL, data);
}

// Printing Settings
export async function getPrintingSettings() {
  const setting = await getSettingByKey(SETTING_KEYS.PRINTING);
  return setting.value;
}

export async function updatePrintingSettings(data: any) {
  return updateSetting(SETTING_KEYS.PRINTING, data);
}

// Configuración pública (para el frontend)
export async function getPublicSettings() {
  const [store, order, payment, general, appearance, home, catalog] = await Promise.all([
    getStoreSettings(),
    getOrderSettings(),
    getPaymentSettings(),
    getGeneralSettings(),
    getAppearanceSettings(),
    getHomeSettings(),
    getCatalogSettings(),
  ]);

  return {
    store: {
      name: store.storeName || general.siteName,
      description: store.storeDescription || general.siteDescription,
      logo: store.storeLogo || general.logo,
      phone: store.storePhone || general.contactPhone,
      email: store.storeEmail || general.contactEmail,
      socialMedia: store.socialMedia || general.socialLinks,
    },
    shipping: {
      cost: order.shippingCost,
      freeThreshold: order.freeShippingThreshold,
    },
    tax: {
      enabled: payment.taxEnabled ?? false,
      // Usar taxRate de payment_settings (se configura desde el admin panel)
      rate: payment.taxRate ?? order.taxRate ?? 19,
      // taxIncluded viene de payment_settings, indica si el IVA está incluido en los precios
      included: payment.taxIncluded ?? true,
    },
    paymentMethods: payment.methods
      ? payment.methods.filter((m: any) => m.isActive).map((m: any) => m.type)
      : payment.enabledMethods || [],
    general,
    appearance,
    home,
    catalog,
  };
}

// ==================== CREDENCIALES DE WOMPI ====================

export interface WompiCredentials {
  enabled: boolean;
  isTestMode: boolean;
  publicKey: string;
  privateKey: string;
  eventsSecret: string;
  integrityKey: string;
}

/**
 * Obtener credenciales de Wompi desde la configuración de pagos
 * Busca en methods[] el método de tipo 'wompi' y extrae wompiConfig
 * Prioridad: Base de datos > Variables de entorno
 */
export async function getWompiCredentials(): Promise<WompiCredentials> {
  const payment = await getPaymentSettings();

  // Nueva estructura: buscar en methods[]
  let wompiConfig: any = {};
  let isEnabled = false;

  if (payment.methods && Array.isArray(payment.methods)) {
    const wompiMethod = payment.methods.find((m: any) => m.type === 'wompi');
    if (wompiMethod) {
      isEnabled = wompiMethod.isActive === true;
      wompiConfig = wompiMethod.wompiConfig || {};
    }
  } else if (payment.wompi) {
    // Fallback a estructura antigua
    wompiConfig = payment.wompi;
    isEnabled = wompiConfig.enabled === true;
  }

  // Las credenciales de la BD tienen prioridad, pero fallback a env vars
  return {
    enabled: isEnabled,
    isTestMode: wompiConfig.isTestMode ?? true,
    publicKey: wompiConfig.publicKey || process.env['WOMPI_PUBLIC_KEY'] || '',
    privateKey: wompiConfig.privateKey || process.env['WOMPI_PRIVATE_KEY'] || '',
    eventsSecret: wompiConfig.eventSecret || wompiConfig.eventsSecret || process.env['WOMPI_EVENTS_SECRET'] || '',
    integrityKey: wompiConfig.integrityKey || '',
  };
}
