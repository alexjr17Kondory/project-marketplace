import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  Settings,
  GeneralSettings,
  ShippingSettings,
  PaymentSettings,
  ShippingZone,
  ShippingCarrier,
  PaymentMethodConfig,
  CarrierZoneRate,
} from '../types/settings';

// Mock data inicial
const mockSettings: Settings = {
  general: {
    siteName: 'StylePrint',
    siteDescription: 'Tu marketplace de camisetas personalizadas',
    logo: '/logo.png',
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
        type: 'transfer',
        name: 'Transferencia Bancaria',
        description: 'Paga directamente desde tu banco',
        instructions: 'Realiza la transferencia y sube el comprobante en tu pedido.',
        isActive: true,
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
        id: 'pm-2',
        type: 'pse',
        name: 'PSE',
        description: 'Débito directo desde tu cuenta bancaria',
        isActive: true,
      },
      {
        id: 'pm-3',
        type: 'credit_card',
        name: 'Tarjeta de Crédito',
        description: 'Visa, Mastercard, American Express',
        isActive: false,
      },
      {
        id: 'pm-4',
        type: 'cash',
        name: 'Pago Contra Entrega',
        description: 'Paga cuando recibas tu pedido',
        instructions: 'Solo disponible para Bogotá. El domiciliario recibe efectivo o Nequi.',
        isActive: true,
      },
    ],
    taxRate: 19,
    taxIncluded: true,
  },
  updatedAt: new Date(),
  updatedBy: 'Admin',
};

interface SettingsContextType {
  settings: Settings;
  updateGeneralSettings: (data: Partial<GeneralSettings>) => void;
  updateShippingSettings: (data: Partial<ShippingSettings>) => void;
  updatePaymentSettings: (data: Partial<PaymentSettings>) => void;
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

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateGeneralSettings,
        updateShippingSettings,
        updatePaymentSettings,
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
