import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  Settings,
  GeneralSettings,
  AppearanceSettings,
  ShippingSettings,
  PaymentSettings,
  LegalSettings,
  LegalPage,
  ShippingZone,
  ShippingCarrier,
  PaymentMethodConfig,
  CarrierZoneRate,
  HomeSettings,
  FeatureCard,
  ProductSection,
  WhatsAppButtonSettings,
  CatalogSettings,
} from '../types/settings';

// Mock data inicial
const mockSettings: Settings = {
  general: {
    siteName: 'StylePrint',
    siteDescription: 'Tu marketplace de camisetas personalizadas',
    slogan: 'Tu Estilo, Tu Diseño',
    logo: '',
    brandColors: {
      primary: '#7c3aed',   // violet-600
      secondary: '#ec4899', // pink-500
      accent: '#f59e0b',    // amber-500
    },
    contactEmail: 'contacto@styleprint.com',
    contactPhone: '+57 300 123 4567',
    address: 'Calle 123 #45-67',
    city: 'Bogotá',
    country: 'Colombia',
    currency: 'COP',
    currencySymbol: '$',
    socialLinks: {
      facebook: 'https://facebook.com/styleprint',
      instagram: 'https://instagram.com/styleprint',
      whatsapp: '+573001234567',
    },
  },
  appearance: {
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
  shipping: {
    // Direccion de origen de envio (desde donde salen los paquetes)
    origin: {
      companyName: 'StylePrint SAS',
      contactName: 'Departamento de Envios',
      phone: '+57 300 123 4567',
      address: 'Calle 123 #45-67, Bodega 5',
      city: 'Bogota',
      state: 'Cundinamarca',
      postalCode: '110111',
      country: 'Colombia',
    },
    // Zonas geograficas (sin tarifas, solo agrupacion)
    zones: [
      {
        id: 'zone-1',
        name: 'Bogota y alrededores',
        cities: ['Bogota', 'Chia', 'Cota', 'Soacha', 'Zipaquira', 'Funza', 'Mosquera'],
        isActive: true,
      },
      {
        id: 'zone-2',
        name: 'Principales ciudades',
        cities: ['Medellin', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira', 'Manizales'],
        isActive: true,
      },
      {
        id: 'zone-3',
        name: 'Resto del pais',
        cities: [], // Vacio = aplica a ciudades no listadas en otras zonas
        isActive: true,
      },
    ],
    // Transportadoras con sus tarifas por zona
    carriers: [
      {
        id: 'carrier-1',
        name: 'Servientrega',
        code: 'SERVI',
        trackingUrlTemplate: 'https://www.servientrega.com/wps/portal/rastreo-envio?guia={tracking}',
        isActive: true,
        volumetricFactor: 6000, // Factor terrestre
        zoneRates: [
          {
            zoneId: 'zone-1',
            baseCost: 8000,
            costPerKg: 1500,
            freeShippingThreshold: 150000,
            estimatedDays: { min: 1, max: 2 },
            maxWeight: 30,
          },
          {
            zoneId: 'zone-2',
            baseCost: 12000,
            costPerKg: 2000,
            freeShippingThreshold: 200000,
            estimatedDays: { min: 2, max: 4 },
            maxWeight: 25,
          },
          {
            zoneId: 'zone-3',
            baseCost: 18000,
            costPerKg: 2500,
            estimatedDays: { min: 4, max: 7 },
            maxWeight: 20,
          },
        ],
      },
      {
        id: 'carrier-2',
        name: 'Coordinadora',
        code: 'COORD',
        trackingUrlTemplate: 'https://www.coordinadora.com/rastreo/?guia={tracking}',
        isActive: true,
        volumetricFactor: 5000, // Factor aereo (mas estricto)
        zoneRates: [
          {
            zoneId: 'zone-1',
            baseCost: 9000,
            costPerKg: 1800,
            freeShippingThreshold: 180000,
            estimatedDays: { min: 1, max: 2 },
            maxWeight: 25,
          },
          {
            zoneId: 'zone-2',
            baseCost: 14000,
            costPerKg: 2200,
            freeShippingThreshold: 220000,
            estimatedDays: { min: 2, max: 3 },
            maxWeight: 20,
          },
          {
            zoneId: 'zone-3',
            baseCost: 20000,
            costPerKg: 2800,
            estimatedDays: { min: 3, max: 5 },
            maxWeight: 15,
          },
        ],
      },
      {
        id: 'carrier-3',
        name: 'Interrapidisimo',
        code: 'INTER',
        trackingUrlTemplate: 'https://www.interrapidisimo.com/rastreo/?guia={tracking}',
        isActive: false,
        volumetricFactor: 5000,
        zoneRates: [
          {
            zoneId: 'zone-1',
            baseCost: 7500,
            costPerKg: 1400,
            estimatedDays: { min: 1, max: 3 },
            maxWeight: 30,
          },
          {
            zoneId: 'zone-2',
            baseCost: 11000,
            costPerKg: 1900,
            estimatedDays: { min: 3, max: 5 },
            maxWeight: 25,
          },
          {
            zoneId: 'zone-3',
            baseCost: 16000,
            costPerKg: 2400,
            estimatedDays: { min: 5, max: 8 },
            maxWeight: 20,
          },
        ],
      },
    ],
    defaultCarrierId: 'carrier-1',
    handlingTime: 2,
    packageDefaults: {
      defaultLength: 30, // cm
      defaultWidth: 25, // cm
      defaultHeight: 5, // cm (camiseta doblada)
      defaultWeightPerItem: 0.25, // kg por camiseta
      volumetricDivisor: 5000, // factor estandar para calculo interno
    },
  },
  payment: {
    methods: [
      {
        id: 'pm-1',
        type: 'wompi',
        name: 'Wompi',
        description: 'Paga con tarjeta de crédito/débito, PSE o Nequi',
        isActive: true,
        wompiConfig: {
          publicKey: 'pub_test_SIMULATION',
          isTestMode: true,
        },
      },
      {
        id: 'pm-2',
        type: 'transfer',
        name: 'Transferencia Bancaria',
        description: 'Paga directamente desde tu banco',
        instructions: 'Realiza la transferencia y sube el comprobante en tu pedido.',
        isActive: false,
        bankInfo: {
          bankName: 'Bancolombia',
          accountType: 'Ahorros',
          accountNumber: '123-456789-00',
          accountHolder: 'StylePrint SAS',
          documentType: 'NIT',
          documentNumber: '901.234.567-8',
        },
      },
      {
        id: 'pm-3',
        type: 'cash',
        name: 'Pago Contra Entrega',
        description: 'Paga cuando recibas tu pedido',
        instructions: 'Solo disponible para Bogotá. El domiciliario recibe efectivo o Nequi.',
        isActive: false,
      },
      {
        id: 'pm-4',
        type: 'pickup',
        name: 'Pago en Punto Físico',
        description: 'Recoge y paga en nuestra tienda',
        instructions: 'Tu pedido estará listo para recoger en 2-3 días hábiles.',
        isActive: true,
        pickupConfig: {
          storeName: 'StylePrint Store',
          address: 'Calle 123 #45-67, Local 101',
          city: 'Bogotá',
          scheduleWeekdays: 'Lunes a Viernes: 9:00 AM - 6:00 PM',
          scheduleWeekends: 'Sábados: 10:00 AM - 2:00 PM',
          phone: '+57 300 123 4567',
        },
      },
    ],
    taxRate: 19,
    taxIncluded: true,
  },
  home: {
    enableCustomizer: true,
    hero: {
      badge: '100% Personalizable',
      title: 'Dale Vida a tu',
      titleHighlight: 'Creatividad',
      subtitle: 'Crea diseños únicos en camisetas y hoodies.\nSube tus imágenes y hazlas realidad.',
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
      subtitle: 'Empieza a diseñar tu prenda personalizada ahora y dale vida a tu creatividad',
      buttonText: 'Personalizar Ahora',
      buttonLink: '/customize',
      showButton: true,
      isActive: true,
    },
    whatsappButton: {
      isActive: true,
      phoneNumber: '573001234567',
      defaultMessage: '¡Hola! Me interesa obtener más información sobre sus productos.',
      position: 'bottom-right',
      showOnMobile: true,
      showOnDesktop: true,
      buttonColor: '#25D366',
      pulseAnimation: true,
      showTooltip: true,
      tooltipText: '¿Necesitas ayuda?',
    },
  },
  catalog: {
    filters: {
      showCategoryFilter: true,
      showTypeFilter: true,
      showPriceFilter: true,
      showStockFilter: true,
      showFeaturedFilter: true,
      enabledCategories: ['clothing', 'accessories', 'drinkware', 'home', 'office'],
      enabledProductTypes: [
        'tshirt', 'hoodie', 'sweatshirt', 'polo', 'cap',
        'mug', 'magicmug', 'bottle', 'tumbler',
        'aluminumframe', 'coaster', 'pillow', 'puzzle',
        'keychain', 'mousepad'
      ],
    },
    defaultProductsPerPage: 12,
    showSortOptions: true,
  },
  legal: {
    termsAndConditions: {
      id: 'terms',
      title: 'Términos y Condiciones',
      slug: 'terms',
      content: `<h2>1. Aceptación de los Términos</h2>
<p>Al acceder y utilizar este sitio web, usted acepta estar sujeto a estos términos y condiciones de uso.</p>

<h2>2. Uso del Sitio</h2>
<p>El contenido de este sitio web es únicamente para su información general y uso personal. Está sujeto a cambios sin previo aviso.</p>

<h2>3. Productos Personalizados</h2>
<p>Los productos personalizados son creados según las especificaciones proporcionadas por el cliente. StylePrint no se hace responsable por errores en el diseño proporcionado por el cliente.</p>

<h2>4. Precios y Pagos</h2>
<p>Todos los precios están expresados en pesos colombianos (COP) e incluyen IVA. Nos reservamos el derecho de modificar los precios sin previo aviso.</p>

<h2>5. Envíos</h2>
<p>Los tiempos de entrega son estimados y pueden variar según la ubicación y disponibilidad del producto. StylePrint no se hace responsable por retrasos causados por terceros.</p>

<h2>6. Propiedad Intelectual</h2>
<p>El cliente garantiza que tiene los derechos necesarios sobre las imágenes y diseños que sube para personalización. StylePrint no se hace responsable por violaciones de derechos de autor.</p>`,
      isActive: true,
      lastUpdated: new Date(),
    },
    privacyPolicy: {
      id: 'privacy',
      title: 'Política de Privacidad',
      slug: 'privacy',
      content: `<h2>1. Información que Recopilamos</h2>
<p>Recopilamos información personal que usted nos proporciona directamente, como nombre, correo electrónico, dirección de envío y número de teléfono.</p>

<h2>2. Uso de la Información</h2>
<p>Utilizamos su información para:</p>
<ul>
<li>Procesar y enviar sus pedidos</li>
<li>Comunicarnos con usted sobre su pedido</li>
<li>Mejorar nuestros productos y servicios</li>
<li>Enviar información promocional (si ha dado su consentimiento)</li>
</ul>

<h2>3. Protección de Datos</h2>
<p>Implementamos medidas de seguridad apropiadas para proteger su información personal contra acceso no autorizado, alteración, divulgación o destrucción.</p>

<h2>4. Cookies</h2>
<p>Utilizamos cookies para mejorar su experiencia de navegación. Puede configurar su navegador para rechazar cookies, aunque esto puede afectar la funcionalidad del sitio.</p>

<h2>5. Compartir Información</h2>
<p>No vendemos ni compartimos su información personal con terceros, excepto cuando sea necesario para procesar su pedido (ej: empresas de envío).</p>

<h2>6. Sus Derechos</h2>
<p>Usted tiene derecho a acceder, rectificar o eliminar su información personal. Contáctenos para ejercer estos derechos.</p>`,
      isActive: true,
      lastUpdated: new Date(),
    },
    returnsPolicy: {
      id: 'returns',
      title: 'Política de Devoluciones',
      slug: 'returns',
      content: `<h2>1. Productos Personalizados</h2>
<p>Debido a la naturaleza personalizada de nuestros productos, <strong>no aceptamos devoluciones ni cambios</strong> una vez que el pedido ha sido procesado, excepto en casos de defectos de fabricación.</p>

<h2>2. Defectos de Fabricación</h2>
<p>Si su producto presenta defectos de fabricación (errores de impresión, tallas incorrectas enviadas, daños en el producto), contáctenos dentro de las 48 horas siguientes a la recepción.</p>

<h2>3. Proceso de Reclamación</h2>
<p>Para reportar un defecto:</p>
<ol>
<li>Envíe un correo a contacto@styleprint.com</li>
<li>Incluya fotos claras del defecto</li>
<li>Proporcione su número de pedido</li>
</ol>

<h2>4. Soluciones</h2>
<p>En caso de defecto comprobado, ofrecemos:</p>
<ul>
<li>Reimpresión del producto sin costo adicional</li>
<li>Reembolso completo del valor del producto</li>
</ul>

<h2>5. Tiempos de Respuesta</h2>
<p>Nos comprometemos a responder su reclamación dentro de 3 días hábiles y resolver el caso en un máximo de 10 días hábiles.</p>

<h2>6. Productos Estándar</h2>
<p>Para productos no personalizados, aceptamos devoluciones dentro de los 15 días siguientes a la compra, siempre que el producto esté en su empaque original y sin usar.</p>`,
      isActive: true,
      lastUpdated: new Date(),
    },
  },
  updatedAt: new Date(),
  updatedBy: 'Admin',
};

interface SettingsContextType {
  settings: Settings;
  updateGeneralSettings: (data: Partial<GeneralSettings>) => void;
  updateAppearanceSettings: (data: Partial<AppearanceSettings>) => void;
  updateShippingSettings: (data: Partial<ShippingSettings>) => void;
  updatePaymentSettings: (data: Partial<PaymentSettings>) => void;
  updateLegalPage: (pageKey: keyof LegalSettings, data: Partial<LegalPage>) => void;
  // Zonas de envío
  addShippingZone: (zone: Omit<ShippingZone, 'id'>) => void;
  updateShippingZone: (id: string, data: Partial<ShippingZone>) => void;
  deleteShippingZone: (id: string) => void;
  // Transportadoras
  addCarrier: (carrier: Omit<ShippingCarrier, 'id'>) => void;
  updateCarrier: (id: string, data: Partial<ShippingCarrier>) => void;
  deleteCarrier: (id: string) => void;
  // Tarifas de transportadora por zona
  updateCarrierZoneRate: (carrierId: string, zoneId: string, data: Partial<CarrierZoneRate>) => void;
  addCarrierZoneRate: (carrierId: string, rate: CarrierZoneRate) => void;
  deleteCarrierZoneRate: (carrierId: string, zoneId: string) => void;
  // Métodos de pago
  addPaymentMethod: (method: Omit<PaymentMethodConfig, 'id'>) => void;
  updatePaymentMethod: (id: string, data: Partial<PaymentMethodConfig>) => void;
  deletePaymentMethod: (id: string) => void;
  togglePaymentMethod: (id: string) => void;
  // Home settings
  updateHomeSettings: (data: Partial<HomeSettings>) => void;
  // Catalog settings
  updateCatalogSettings: (data: Partial<CatalogSettings>) => void;
  // Features
  addFeature: (feature: Omit<FeatureCard, 'id'>) => void;
  updateFeature: (id: string, data: Partial<FeatureCard>) => void;
  deleteFeature: (id: string) => void;
  // Product sections
  addProductSection: (section: Omit<ProductSection, 'id'>) => void;
  updateProductSection: (id: string, data: Partial<ProductSection>) => void;
  deleteProductSection: (id: string) => void;
  // WhatsApp button
  updateWhatsAppButton: (data: Partial<WhatsAppButtonSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(mockSettings);

  const updateGeneralSettings = (data: Partial<GeneralSettings>) => {
    setSettings((prev) => ({
      ...prev,
      general: { ...prev.general, ...data },
      updatedAt: new Date(),
    }));
  };

  const updateAppearanceSettings = (data: Partial<AppearanceSettings>) => {
    setSettings((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, ...data },
      updatedAt: new Date(),
    }));
  };

  const updateShippingSettings = (data: Partial<ShippingSettings>) => {
    setSettings((prev) => ({
      ...prev,
      shipping: { ...prev.shipping, ...data },
      updatedAt: new Date(),
    }));
  };

  const updatePaymentSettings = (data: Partial<PaymentSettings>) => {
    setSettings((prev) => ({
      ...prev,
      payment: { ...prev.payment, ...data },
      updatedAt: new Date(),
    }));
  };

  const updateLegalPage = (pageKey: keyof LegalSettings, data: Partial<LegalPage>) => {
    setSettings((prev) => ({
      ...prev,
      legal: {
        ...prev.legal,
        [pageKey]: {
          ...prev.legal[pageKey],
          ...data,
          lastUpdated: new Date(),
        },
      },
      updatedAt: new Date(),
    }));
  };

  // Zonas de envío
  const addShippingZone = (zone: Omit<ShippingZone, 'id'>) => {
    const newZoneId = `zone-${Date.now()}`;
    const newZone: ShippingZone = {
      ...zone,
      id: newZoneId,
    };

    // Tarifa por defecto para la nueva zona
    const defaultRate: CarrierZoneRate = {
      zoneId: newZoneId,
      baseCost: 15000,
      costPerKg: 2000,
      estimatedDays: { min: 3, max: 6 },
    };

    setSettings((prev) => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        zones: [...prev.shipping.zones, newZone],
        // Agregar tarifa por defecto a todas las transportadoras
        carriers: prev.shipping.carriers.map((carrier) => ({
          ...carrier,
          zoneRates: [...carrier.zoneRates, defaultRate],
        })),
      },
      updatedAt: new Date(),
    }));
  };

  const updateShippingZone = (id: string, data: Partial<ShippingZone>) => {
    setSettings((prev) => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        zones: prev.shipping.zones.map((zone) =>
          zone.id === id ? { ...zone, ...data } : zone
        ),
      },
      updatedAt: new Date(),
    }));
  };

  const deleteShippingZone = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        zones: prev.shipping.zones.filter((zone) => zone.id !== id),
        // Eliminar tarifas de esta zona de todas las transportadoras
        carriers: prev.shipping.carriers.map((carrier) => ({
          ...carrier,
          zoneRates: carrier.zoneRates.filter((rate) => rate.zoneId !== id),
        })),
      },
      updatedAt: new Date(),
    }));
  };

  // Transportadoras
  const addCarrier = (carrier: Omit<ShippingCarrier, 'id'>) => {
    const newCarrier: ShippingCarrier = {
      ...carrier,
      id: `carrier-${Date.now()}`,
    };
    setSettings((prev) => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        carriers: [...prev.shipping.carriers, newCarrier],
      },
      updatedAt: new Date(),
    }));
  };

  const updateCarrier = (id: string, data: Partial<ShippingCarrier>) => {
    setSettings((prev) => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        carriers: prev.shipping.carriers.map((carrier) =>
          carrier.id === id ? { ...carrier, ...data } : carrier
        ),
      },
      updatedAt: new Date(),
    }));
  };

  const deleteCarrier = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        carriers: prev.shipping.carriers.filter((carrier) => carrier.id !== id),
        defaultCarrierId:
          prev.shipping.defaultCarrierId === id ? undefined : prev.shipping.defaultCarrierId,
      },
      updatedAt: new Date(),
    }));
  };

  // Tarifas de transportadora por zona
  const updateCarrierZoneRate = (carrierId: string, zoneId: string, data: Partial<CarrierZoneRate>) => {
    setSettings((prev) => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        carriers: prev.shipping.carriers.map((carrier) => {
          if (carrier.id !== carrierId) return carrier;
          return {
            ...carrier,
            zoneRates: carrier.zoneRates.map((rate) =>
              rate.zoneId === zoneId ? { ...rate, ...data } : rate
            ),
          };
        }),
      },
      updatedAt: new Date(),
    }));
  };

  const addCarrierZoneRate = (carrierId: string, rate: CarrierZoneRate) => {
    setSettings((prev) => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        carriers: prev.shipping.carriers.map((carrier) => {
          if (carrier.id !== carrierId) return carrier;
          // Evitar duplicados
          if (carrier.zoneRates.some((r) => r.zoneId === rate.zoneId)) return carrier;
          return {
            ...carrier,
            zoneRates: [...carrier.zoneRates, rate],
          };
        }),
      },
      updatedAt: new Date(),
    }));
  };

  const deleteCarrierZoneRate = (carrierId: string, zoneId: string) => {
    setSettings((prev) => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        carriers: prev.shipping.carriers.map((carrier) => {
          if (carrier.id !== carrierId) return carrier;
          return {
            ...carrier,
            zoneRates: carrier.zoneRates.filter((rate) => rate.zoneId !== zoneId),
          };
        }),
      },
      updatedAt: new Date(),
    }));
  };

  // Métodos de pago
  const addPaymentMethod = (method: Omit<PaymentMethodConfig, 'id'>) => {
    const newMethod: PaymentMethodConfig = {
      ...method,
      id: `pm-${Date.now()}`,
    };
    setSettings((prev) => ({
      ...prev,
      payment: {
        ...prev.payment,
        methods: [...prev.payment.methods, newMethod],
      },
      updatedAt: new Date(),
    }));
  };

  const updatePaymentMethod = (id: string, data: Partial<PaymentMethodConfig>) => {
    setSettings((prev) => ({
      ...prev,
      payment: {
        ...prev.payment,
        methods: prev.payment.methods.map((method) =>
          method.id === id ? { ...method, ...data } : method
        ),
      },
      updatedAt: new Date(),
    }));
  };

  const deletePaymentMethod = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      payment: {
        ...prev.payment,
        methods: prev.payment.methods.filter((method) => method.id !== id),
      },
      updatedAt: new Date(),
    }));
  };

  const togglePaymentMethod = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      payment: {
        ...prev.payment,
        methods: prev.payment.methods.map((method) =>
          method.id === id ? { ...method, isActive: !method.isActive } : method
        ),
      },
      updatedAt: new Date(),
    }));
  };

  // Home settings
  const updateHomeSettings = (data: Partial<HomeSettings>) => {
    setSettings((prev) => ({
      ...prev,
      home: { ...prev.home, ...data },
      updatedAt: new Date(),
    }));
  };

  // Catalog settings
  const updateCatalogSettings = (data: Partial<CatalogSettings>) => {
    setSettings((prev) => ({
      ...prev,
      catalog: {
        ...prev.catalog,
        ...data,
        filters: data.filters
          ? { ...prev.catalog.filters, ...data.filters }
          : prev.catalog.filters,
      },
      updatedAt: new Date(),
    }));
  };

  // Features
  const addFeature = (feature: Omit<FeatureCard, 'id'>) => {
    const newFeature: FeatureCard = {
      ...feature,
      id: `feature-${Date.now()}`,
    };
    setSettings((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        features: [...prev.home.features, newFeature],
      },
      updatedAt: new Date(),
    }));
  };

  const updateFeature = (id: string, data: Partial<FeatureCard>) => {
    setSettings((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        features: prev.home.features.map((f) =>
          f.id === id ? { ...f, ...data } : f
        ),
      },
      updatedAt: new Date(),
    }));
  };

  const deleteFeature = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        features: prev.home.features.filter((f) => f.id !== id),
      },
      updatedAt: new Date(),
    }));
  };

  // Product sections
  const addProductSection = (section: Omit<ProductSection, 'id'>) => {
    const newSection: ProductSection = {
      ...section,
      id: `section-${Date.now()}`,
    };
    setSettings((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        productSections: [...prev.home.productSections, newSection],
      },
      updatedAt: new Date(),
    }));
  };

  const updateProductSection = (id: string, data: Partial<ProductSection>) => {
    setSettings((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        productSections: prev.home.productSections.map((s) =>
          s.id === id ? { ...s, ...data } : s
        ),
      },
      updatedAt: new Date(),
    }));
  };

  const deleteProductSection = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        productSections: prev.home.productSections.filter((s) => s.id !== id),
      },
      updatedAt: new Date(),
    }));
  };

  // WhatsApp button
  const updateWhatsAppButton = (data: Partial<WhatsAppButtonSettings>) => {
    setSettings((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        whatsappButton: { ...prev.home.whatsappButton, ...data },
      },
      updatedAt: new Date(),
    }));
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateGeneralSettings,
        updateAppearanceSettings,
        updateShippingSettings,
        updatePaymentSettings,
        updateLegalPage,
        addShippingZone,
        updateShippingZone,
        deleteShippingZone,
        addCarrier,
        updateCarrier,
        deleteCarrier,
        updateCarrierZoneRate,
        addCarrierZoneRate,
        deleteCarrierZoneRate,
        addPaymentMethod,
        updatePaymentMethod,
        deletePaymentMethod,
        togglePaymentMethod,
        updateHomeSettings,
        updateCatalogSettings,
        addFeature,
        updateFeature,
        deleteFeature,
        addProductSection,
        updateProductSection,
        deleteProductSection,
        updateWhatsAppButton,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
