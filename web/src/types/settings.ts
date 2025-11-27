// Settings types
export interface GeneralSettings {
  siteName: string;
  siteDescription: string;
  logo?: string;
  favicon?: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  country: string;
  currency: string;
  currencySymbol: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    whatsapp?: string;
  };
}

// Zona geografica simplificada (solo define areas)
export interface ShippingZone {
  id: string;
  name: string;
  cities: string[]; // Si esta vacio, aplica a cualquier ciudad no listada en otras zonas
  isActive: boolean;
}

// Tarifa de una transportadora para una zona especifica
export interface CarrierZoneRate {
  zoneId: string;
  baseCost: number; // Costo base del envio
  costPerKg: number; // Costo adicional por kg (se usa el mayor entre peso real y volumetrico)
  freeShippingThreshold?: number; // Umbral para envio gratis
  estimatedDays: { min: number; max: number };
  maxWeight?: number; // Peso maximo permitido
}

// Configuracion de paquete por defecto para calculos
export interface PackageDefaults {
  // Dimensiones base de un paquete estandar (cm)
  defaultLength: number;
  defaultWidth: number;
  defaultHeight: number;
  // Peso base por producto (kg)
  defaultWeightPerItem: number;
  // Factor para calcular peso volumetrico: (L x W x H) / factor
  volumetricDivisor: number;
}

// Direccion de origen de envio (desde donde salen los paquetes)
export interface ShippingOrigin {
  companyName: string; // Nombre de la empresa/remitente
  contactName: string; // Nombre de contacto
  phone: string;
  address: string;
  city: string;
  state: string; // Departamento
  postalCode?: string;
  country: string;
}

export interface ShippingCarrier {
  id: string;
  name: string;
  code: string;
  trackingUrlTemplate?: string;
  isActive: boolean;
  // Factor volumetrico de esta transportadora (usualmente 5000 aereo, 6000 terrestre)
  volumetricFactor: number;
  // Tarifas por zona
  zoneRates: CarrierZoneRate[];
}

export interface ShippingSettings {
  origin: ShippingOrigin; // Direccion de origen de todos los envios
  zones: ShippingZone[];
  carriers: ShippingCarrier[];
  defaultCarrierId?: string;
  handlingTime: number;
  packageDefaults: PackageDefaults;
}

export interface PaymentMethodConfig {
  id: string;
  type: 'credit_card' | 'debit_card' | 'pse' | 'cash' | 'transfer' | 'wompi';
  name: string;
  description?: string;
  instructions?: string;
  isActive: boolean;
  bankInfo?: {
    bankName: string;
    accountType: string;
    accountNumber: string;
    accountHolder: string;
    documentType: string;
    documentNumber: string;
  };
  // Configuración específica de Wompi
  wompiConfig?: {
    publicKey: string;
    isTestMode: boolean;
  };
}

export interface PaymentSettings {
  methods: PaymentMethodConfig[];
  taxRate: number;
  taxIncluded: boolean;
}

export interface Settings {
  general: GeneralSettings;
  shipping: ShippingSettings;
  payment: PaymentSettings;
  updatedAt: Date;
  updatedBy: string;
}

export const PAYMENT_TYPE_LABELS: Record<PaymentMethodConfig['type'], string> = {
  credit_card: 'Tarjeta de Credito',
  debit_card: 'Tarjeta de Debito',
  pse: 'PSE',
  cash: 'Efectivo',
  transfer: 'Transferencia Bancaria',
  wompi: 'Wompi (Tarjeta, PSE, Nequi)',
};

export const CURRENCY_OPTIONS = [
  { code: 'COP', symbol: '$', name: 'Peso Colombiano' },
  { code: 'USD', symbol: '$', name: 'Dolar Estadounidense' },
  { code: 'EUR', symbol: 'E', name: 'Euro' },
  { code: 'MXN', symbol: '$', name: 'Peso Mexicano' },
];
