import { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Modal } from '../../components/shared/Modal';
import type {
  ShippingZone,
  ShippingCarrier,
  PaymentMethodConfig,
  CarrierZoneRate,
} from '../../types/settings';
import {
  PAYMENT_TYPE_LABELS,
  CURRENCY_OPTIONS,
} from '../../types/settings';
import {
  Settings,
  Store,
  Truck,
  CreditCard,
  Save,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Package,
  Clock,
  DollarSign,
  Check,
  X,
  Globe,
  Phone,
  Mail,
  Building,
  Facebook,
  Instagram,
  MessageCircle,
} from 'lucide-react';

type TabType = 'general' | 'shipping' | 'payment';

export const SettingsPage = () => {
  const { settings, updateGeneralSettings, updateShippingSettings, updatePaymentSettings,
    addShippingZone, updateShippingZone, deleteShippingZone,
    addCarrier, updateCarrier, deleteCarrier,
    updateCarrierZoneRate, addCarrierZoneRate,
    addPaymentMethod, updatePaymentMethod, deletePaymentMethod, togglePaymentMethod
  } = useSettings();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('general');

  // Modal states
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [isCarrierModalOpen, setIsCarrierModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [editingCarrier, setEditingCarrier] = useState<ShippingCarrier | null>(null);
  const [editingPayment, setEditingPayment] = useState<PaymentMethodConfig | null>(null);

  // Form states
  const [generalForm, setGeneralForm] = useState(settings.general);
  const [zoneForm, setZoneForm] = useState<Omit<ShippingZone, 'id'>>({
    name: '',
    cities: [],
    isActive: true,
  });
  const [carrierForm, setCarrierForm] = useState<Omit<ShippingCarrier, 'id'>>({
    name: '',
    code: '',
    trackingUrlTemplate: '',
    isActive: true,
    volumetricFactor: 5000,
    zoneRates: [],
  });
  // Estado para editar tarifas por zona de una transportadora
  const [editingCarrierRates, setEditingCarrierRates] = useState<ShippingCarrier | null>(null);
  const [rateForm, setRateForm] = useState<CarrierZoneRate>({
    zoneId: '',
    baseCost: 0,
    costPerKg: 0,
    estimatedDays: { min: 1, max: 3 },
  });
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState<Omit<PaymentMethodConfig, 'id'>>({
    type: 'transfer',
    name: '',
    description: '',
    instructions: '',
    isActive: true,
  });
  const [citiesInput, setCitiesInput] = useState('');

  const tabs = [
    { id: 'general' as TabType, label: 'General', icon: Store },
    { id: 'shipping' as TabType, label: 'Envíos', icon: Truck },
    { id: 'payment' as TabType, label: 'Pagos', icon: CreditCard },
  ];

  // Handlers General
  const handleSaveGeneral = () => {
    updateGeneralSettings(generalForm);
    toast.success('Configuración general guardada');
  };

  // Handlers Zonas
  const handleOpenZoneModal = (zone?: ShippingZone) => {
    if (zone) {
      setEditingZone(zone);
      setZoneForm({
        name: zone.name,
        cities: zone.cities,
        isActive: zone.isActive,
      });
      setCitiesInput(zone.cities.join(', '));
    } else {
      setEditingZone(null);
      setZoneForm({
        name: '',
        cities: [],
        isActive: true,
      });
      setCitiesInput('');
    }
    setIsZoneModalOpen(true);
  };

  const handleSaveZone = () => {
    const cities = citiesInput.split(',').map(c => c.trim()).filter(Boolean);
    const zoneData = { ...zoneForm, cities };

    if (editingZone) {
      updateShippingZone(editingZone.id, zoneData);
      toast.success('Zona actualizada');
    } else {
      addShippingZone(zoneData);
      toast.success('Zona creada');
    }
    setIsZoneModalOpen(false);
  };

  const handleDeleteZone = (id: string) => {
    if (confirm('¿Eliminar esta zona de envío?')) {
      deleteShippingZone(id);
      toast.success('Zona eliminada');
    }
  };

  // Handlers Transportadoras
  const handleOpenCarrierModal = (carrier?: ShippingCarrier) => {
    if (carrier) {
      setEditingCarrier(carrier);
      setCarrierForm({
        name: carrier.name,
        code: carrier.code,
        trackingUrlTemplate: carrier.trackingUrlTemplate || '',
        isActive: carrier.isActive,
        volumetricFactor: carrier.volumetricFactor,
        zoneRates: carrier.zoneRates,
      });
    } else {
      setEditingCarrier(null);
      setCarrierForm({
        name: '',
        code: '',
        trackingUrlTemplate: '',
        isActive: true,
        volumetricFactor: 5000,
        zoneRates: [],
      });
    }
    setIsCarrierModalOpen(true);
  };

  const handleSaveCarrier = () => {
    if (editingCarrier) {
      updateCarrier(editingCarrier.id, carrierForm);
      toast.success('Transportadora actualizada');
    } else {
      // Al crear nueva transportadora, inicializar tarifas para todas las zonas
      const initialRates: CarrierZoneRate[] = settings.shipping.zones.map(zone => ({
        zoneId: zone.id,
        baseCost: 10000,
        costPerKg: 2000,
        estimatedDays: { min: 2, max: 5 },
      }));
      addCarrier({ ...carrierForm, zoneRates: initialRates });
      toast.success('Transportadora creada');
    }
    setIsCarrierModalOpen(false);
  };

  // Handlers para tarifas de transportadora por zona
  const handleOpenRatesModal = (carrier: ShippingCarrier) => {
    setEditingCarrierRates(carrier);
  };

  const handleCloseRatesModal = () => {
    setEditingCarrierRates(null);
  };

  const handleOpenRateForm = (rate?: CarrierZoneRate) => {
    if (rate) {
      setRateForm(rate);
    } else {
      // Nueva tarifa - seleccionar primera zona sin tarifa
      const existingZoneIds = editingCarrierRates?.zoneRates.map(r => r.zoneId) || [];
      const availableZone = settings.shipping.zones.find(z => !existingZoneIds.includes(z.id));
      setRateForm({
        zoneId: availableZone?.id || '',
        baseCost: 10000,
        costPerKg: 2000,
        estimatedDays: { min: 2, max: 5 },
      });
    }
    setIsRateModalOpen(true);
  };

  const handleSaveRate = () => {
    if (!editingCarrierRates) return;

    const existingRate = editingCarrierRates.zoneRates.find(r => r.zoneId === rateForm.zoneId);
    if (existingRate) {
      updateCarrierZoneRate(editingCarrierRates.id, rateForm.zoneId, rateForm);
    } else {
      addCarrierZoneRate(editingCarrierRates.id, rateForm);
    }

    // Actualizar estado local
    setEditingCarrierRates(prev => {
      if (!prev) return null;
      const existingIdx = prev.zoneRates.findIndex(r => r.zoneId === rateForm.zoneId);
      if (existingIdx >= 0) {
        const newRates = [...prev.zoneRates];
        newRates[existingIdx] = rateForm;
        return { ...prev, zoneRates: newRates };
      } else {
        return { ...prev, zoneRates: [...prev.zoneRates, rateForm] };
      }
    });

    setIsRateModalOpen(false);
    toast.success('Tarifa actualizada');
  };

  const getZoneName = (zoneId: string) => {
    return settings.shipping.zones.find(z => z.id === zoneId)?.name || 'Zona desconocida';
  };

  const handleDeleteCarrier = (id: string) => {
    if (confirm('¿Eliminar esta transportadora?')) {
      deleteCarrier(id);
      toast.success('Transportadora eliminada');
    }
  };

  const handleSetDefaultCarrier = (id: string) => {
    updateShippingSettings({ defaultCarrierId: id });
    toast.success('Transportadora predeterminada actualizada');
  };

  // Handlers Pagos
  const handleOpenPaymentModal = (method?: PaymentMethodConfig) => {
    if (method) {
      setEditingPayment(method);
      setPaymentForm({
        type: method.type,
        name: method.name,
        description: method.description || '',
        instructions: method.instructions || '',
        isActive: method.isActive,
        bankInfo: method.bankInfo,
      });
    } else {
      setEditingPayment(null);
      setPaymentForm({
        type: 'transfer',
        name: '',
        description: '',
        instructions: '',
        isActive: true,
      });
    }
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = () => {
    if (editingPayment) {
      updatePaymentMethod(editingPayment.id, paymentForm);
      toast.success('Método de pago actualizado');
    } else {
      addPaymentMethod(paymentForm);
      toast.success('Método de pago creado');
    }
    setIsPaymentModalOpen(false);
  };

  const handleDeletePayment = (id: string) => {
    if (confirm('¿Eliminar este método de pago?')) {
      deletePaymentMethod(id);
      toast.success('Método de pago eliminado');
    }
  };

  const handleUpdateTax = (taxRate: number, taxIncluded: boolean) => {
    updatePaymentSettings({ taxRate, taxIncluded });
    toast.success('Configuración de impuestos actualizada');
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-8 h-8 text-orange-500" />
            Configuración
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Administra la configuración general del sitio
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* Información del sitio */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Store className="w-5 h-5 text-orange-500" />
                Información del Sitio
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Sitio
                  </label>
                  <Input
                    value={generalForm.siteName}
                    onChange={(e) => setGeneralForm({ ...generalForm, siteName: e.target.value })}
                    placeholder="Mi Tienda"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Moneda
                  </label>
                  <select
                    value={generalForm.currency}
                    onChange={(e) => {
                      const currency = CURRENCY_OPTIONS.find(c => c.code === e.target.value);
                      setGeneralForm({
                        ...generalForm,
                        currency: e.target.value,
                        currencySymbol: currency?.symbol || '$',
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {CURRENCY_OPTIONS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={generalForm.siteDescription}
                    onChange={(e) => setGeneralForm({ ...generalForm, siteDescription: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Descripción breve de tu tienda"
                  />
                </div>
              </div>
            </div>

            {/* Contacto */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-orange-500" />
                Información de Contacto
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email de Contacto
                  </label>
                  <Input
                    type="email"
                    value={generalForm.contactEmail}
                    onChange={(e) => setGeneralForm({ ...generalForm, contactEmail: e.target.value })}
                    placeholder="contacto@ejemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Teléfono
                  </label>
                  <Input
                    value={generalForm.contactPhone}
                    onChange={(e) => setGeneralForm({ ...generalForm, contactPhone: e.target.value })}
                    placeholder="+57 300 123 4567"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Building className="w-4 h-4 inline mr-1" />
                    Dirección
                  </label>
                  <Input
                    value={generalForm.address}
                    onChange={(e) => setGeneralForm({ ...generalForm, address: e.target.value })}
                    placeholder="Calle 123 #45-67"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad
                  </label>
                  <Input
                    value={generalForm.city}
                    onChange={(e) => setGeneralForm({ ...generalForm, city: e.target.value })}
                    placeholder="Bogotá"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Globe className="w-4 h-4 inline mr-1" />
                    País
                  </label>
                  <Input
                    value={generalForm.country}
                    onChange={(e) => setGeneralForm({ ...generalForm, country: e.target.value })}
                    placeholder="Colombia"
                  />
                </div>
              </div>
            </div>

            {/* Redes Sociales */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-orange-500" />
                Redes Sociales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Facebook className="w-4 h-4 inline mr-1 text-blue-600" />
                    Facebook
                  </label>
                  <Input
                    value={generalForm.socialLinks.facebook || ''}
                    onChange={(e) => setGeneralForm({
                      ...generalForm,
                      socialLinks: { ...generalForm.socialLinks, facebook: e.target.value }
                    })}
                    placeholder="https://facebook.com/tu-pagina"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Instagram className="w-4 h-4 inline mr-1 text-pink-600" />
                    Instagram
                  </label>
                  <Input
                    value={generalForm.socialLinks.instagram || ''}
                    onChange={(e) => setGeneralForm({
                      ...generalForm,
                      socialLinks: { ...generalForm.socialLinks, instagram: e.target.value }
                    })}
                    placeholder="https://instagram.com/tu-perfil"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MessageCircle className="w-4 h-4 inline mr-1 text-green-600" />
                    WhatsApp
                  </label>
                  <Input
                    value={generalForm.socialLinks.whatsapp || ''}
                    onChange={(e) => setGeneralForm({
                      ...generalForm,
                      socialLinks: { ...generalForm.socialLinks, whatsapp: e.target.value }
                    })}
                    placeholder="+573001234567"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveGeneral}>
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </Button>
            </div>
          </div>
        )}

        {/* Shipping Tab */}
        {activeTab === 'shipping' && (
          <div className="space-y-6">
            {/* Origen de Envio */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-500" />
                Origen de Envio
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Direccion desde donde salen todos los paquetes (tu bodega o taller).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Empresa *
                  </label>
                  <Input
                    value={settings.shipping.origin.companyName}
                    onChange={(e) => updateShippingSettings({
                      origin: { ...settings.shipping.origin, companyName: e.target.value }
                    })}
                    placeholder="Mi Empresa SAS"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Persona de Contacto *
                  </label>
                  <Input
                    value={settings.shipping.origin.contactName}
                    onChange={(e) => updateShippingSettings({
                      origin: { ...settings.shipping.origin, contactName: e.target.value }
                    })}
                    placeholder="Juan Perez"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefono *
                  </label>
                  <Input
                    value={settings.shipping.origin.phone}
                    onChange={(e) => updateShippingSettings({
                      origin: { ...settings.shipping.origin, phone: e.target.value }
                    })}
                    placeholder="+57 300 123 4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Codigo Postal
                  </label>
                  <Input
                    value={settings.shipping.origin.postalCode || ''}
                    onChange={(e) => updateShippingSettings({
                      origin: { ...settings.shipping.origin, postalCode: e.target.value }
                    })}
                    placeholder="110111"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Direccion *
                  </label>
                  <Input
                    value={settings.shipping.origin.address}
                    onChange={(e) => updateShippingSettings({
                      origin: { ...settings.shipping.origin, address: e.target.value }
                    })}
                    placeholder="Calle 123 #45-67, Bodega 5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad *
                  </label>
                  <Input
                    value={settings.shipping.origin.city}
                    onChange={(e) => updateShippingSettings({
                      origin: { ...settings.shipping.origin, city: e.target.value }
                    })}
                    placeholder="Bogota"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departamento *
                  </label>
                  <Input
                    value={settings.shipping.origin.state}
                    onChange={(e) => updateShippingSettings({
                      origin: { ...settings.shipping.origin, state: e.target.value }
                    })}
                    placeholder="Cundinamarca"
                  />
                </div>
              </div>
            </div>

            {/* Configuración general de envíos */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Tiempo de Preparacion
              </h3>
              <div className="max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dias habiles para preparar un pedido
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={settings.shipping.handlingTime}
                    onChange={(e) => updateShippingSettings({ handlingTime: parseInt(e.target.value) || 0 })}
                    className="w-24"
                  />
                  <span className="text-gray-500">dias</span>
                </div>
              </div>
            </div>

            {/* Configuración de paquetes */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-500" />
                Configuracion de Paquetes
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Valores por defecto para calcular el costo de envio basado en peso y volumen.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Largo (cm)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={settings.shipping.packageDefaults.defaultLength}
                    onChange={(e) => updateShippingSettings({
                      packageDefaults: {
                        ...settings.shipping.packageDefaults,
                        defaultLength: parseFloat(e.target.value) || 1
                      }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Ancho (cm)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={settings.shipping.packageDefaults.defaultWidth}
                    onChange={(e) => updateShippingSettings({
                      packageDefaults: {
                        ...settings.shipping.packageDefaults,
                        defaultWidth: parseFloat(e.target.value) || 1
                      }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Alto (cm)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={settings.shipping.packageDefaults.defaultHeight}
                    onChange={(e) => updateShippingSettings({
                      packageDefaults: {
                        ...settings.shipping.packageDefaults,
                        defaultHeight: parseFloat(e.target.value) || 1
                      }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Peso/item (kg)
                  </label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={settings.shipping.packageDefaults.defaultWeightPerItem}
                    onChange={(e) => updateShippingSettings({
                      packageDefaults: {
                        ...settings.shipping.packageDefaults,
                        defaultWeightPerItem: parseFloat(e.target.value) || 0.1
                      }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Factor Vol.
                  </label>
                  <Input
                    type="number"
                    min="1000"
                    value={settings.shipping.packageDefaults.volumetricDivisor}
                    onChange={(e) => updateShippingSettings({
                      packageDefaults: {
                        ...settings.shipping.packageDefaults,
                        volumetricDivisor: parseInt(e.target.value) || 5000
                      }
                    })}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Peso volumetrico = (Largo x Ancho x Alto) / Factor. Se usa el mayor entre peso real y volumetrico.
              </p>
            </div>

            {/* Zonas de envío */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-orange-500" />
                    Zonas Geograficas
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Define las zonas de cobertura. Las tarifas se configuran por transportadora.
                  </p>
                </div>
                <Button onClick={() => handleOpenZoneModal()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Zona
                </Button>
              </div>
              <div className="space-y-3">
                {settings.shipping.zones.map((zone) => (
                  <div
                    key={zone.id}
                    className={`border rounded-lg p-4 ${zone.isActive ? 'border-gray-200' : 'border-gray-100 bg-gray-50'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{zone.name}</h4>
                          {!zone.isActive && (
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                              Inactiva
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {zone.cities.length > 0 ? zone.cities.join(', ') : 'Resto del pais (ciudades no especificadas)'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenZoneModal(zone)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteZone(zone.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {settings.shipping.zones.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay zonas de envio configuradas
                  </div>
                )}
              </div>
            </div>

            {/* Transportadoras */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-orange-500" />
                    Transportadoras
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Cada transportadora tiene sus propias tarifas por zona geografica.
                  </p>
                </div>
                <Button onClick={() => handleOpenCarrierModal()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Transportadora
                </Button>
              </div>
              <div className="space-y-3">
                {settings.shipping.carriers.map((carrier) => (
                  <div
                    key={carrier.id}
                    className={`border rounded-lg p-4 ${carrier.isActive ? 'border-gray-200' : 'border-gray-100 bg-gray-50'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <Truck className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium text-gray-900">{carrier.name}</h4>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                              {carrier.code}
                            </span>
                            {settings.shipping.defaultCarrierId === carrier.id && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                Predeterminada
                              </span>
                            )}
                            {!carrier.isActive && (
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                                Inactiva
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span>Factor vol: {carrier.volumetricFactor}</span>
                            <span>{carrier.zoneRates.length} tarifas configuradas</span>
                          </div>
                          {/* Mini tabla de tarifas */}
                          {carrier.zoneRates.length > 0 && (
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {carrier.zoneRates.map((rate) => (
                                <div key={rate.zoneId} className="bg-gray-50 rounded px-3 py-2 text-xs">
                                  <div className="font-medium text-gray-700">{getZoneName(rate.zoneId)}</div>
                                  <div className="text-gray-500 mt-0.5">
                                    Base: ${rate.baseCost.toLocaleString()} • +${rate.costPerKg.toLocaleString()}/kg • {rate.estimatedDays.min}-{rate.estimatedDays.max} dias
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-4">
                        <button
                          onClick={() => handleOpenRatesModal(carrier)}
                          className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                          title="Configurar tarifas"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                        {settings.shipping.defaultCarrierId !== carrier.id && carrier.isActive && (
                          <button
                            onClick={() => handleSetDefaultCarrier(carrier.id)}
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg"
                            title="Establecer como predeterminada"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenCarrierModal(carrier)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCarrier(carrier.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {settings.shipping.carriers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay transportadoras configuradas
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment Tab */}
        {activeTab === 'payment' && (
          <div className="space-y-6">
            {/* Impuestos */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-orange-500" />
                Configuración de Impuestos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tasa de Impuesto (%)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.payment.taxRate}
                    onChange={(e) => handleUpdateTax(parseFloat(e.target.value) || 0, settings.payment.taxIncluded)}
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.payment.taxIncluded}
                      onChange={(e) => handleUpdateTax(settings.payment.taxRate, e.target.checked)}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">
                      Los precios ya incluyen impuestos
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Métodos de pago */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-orange-500" />
                  Métodos de Pago
                </h3>
                <Button onClick={() => handleOpenPaymentModal()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Método
                </Button>
              </div>
              <div className="space-y-3">
                {settings.payment.methods.map((method) => (
                  <div
                    key={method.id}
                    className={`border rounded-lg p-4 ${method.isActive ? 'border-gray-200' : 'border-gray-100 bg-gray-50'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${method.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <CreditCard className={`w-5 h-5 ${method.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{method.name}</h4>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {PAYMENT_TYPE_LABELS[method.type]}
                            </span>
                          </div>
                          {method.description && (
                            <p className="text-sm text-gray-500 mt-1">{method.description}</p>
                          )}
                          {method.bankInfo && (
                            <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                              <p><strong>Banco:</strong> {method.bankInfo.bankName}</p>
                              <p><strong>Cuenta:</strong> {method.bankInfo.accountType} - {method.bankInfo.accountNumber}</p>
                              <p><strong>Titular:</strong> {method.bankInfo.accountHolder}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => togglePaymentMethod(method.id)}
                          className={`p-2 rounded-lg ${method.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                          title={method.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {method.isActive ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleOpenPaymentModal(method)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePayment(method.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {settings.payment.methods.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay métodos de pago configurados
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Zone Modal - Simplificado */}
      <Modal
        isOpen={isZoneModalOpen}
        onClose={() => setIsZoneModalOpen(false)}
        title={editingZone ? 'Editar Zona Geografica' : 'Nueva Zona Geografica'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Zona *
            </label>
            <Input
              value={zoneForm.name}
              onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
              placeholder="Ej: Bogota y alrededores"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ciudades (separadas por coma)
            </label>
            <textarea
              value={citiesInput}
              onChange={(e) => setCitiesInput(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="Bogota, Chia, Soacha, Funza"
            />
            <p className="text-xs text-gray-500 mt-1">
              Deja vacio para que aplique a ciudades no cubiertas por otras zonas (ej: "Resto del pais")
            </p>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={zoneForm.isActive}
                onChange={(e) => setZoneForm({ ...zoneForm, isActive: e.target.checked })}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">Zona activa</span>
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="admin-secondary" onClick={() => setIsZoneModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSaveZone} className="flex-1">
              {editingZone ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Carrier Modal */}
      <Modal
        isOpen={isCarrierModalOpen}
        onClose={() => setIsCarrierModalOpen(false)}
        title={editingCarrier ? 'Editar Transportadora' : 'Nueva Transportadora'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <Input
                value={carrierForm.name}
                onChange={(e) => setCarrierForm({ ...carrierForm, name: e.target.value })}
                placeholder="Ej: Servientrega"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Codigo *
              </label>
              <Input
                value={carrierForm.code}
                onChange={(e) => setCarrierForm({ ...carrierForm, code: e.target.value.toUpperCase() })}
                placeholder="Ej: SERVI"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Factor Volumetrico
            </label>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                min="1000"
                value={carrierForm.volumetricFactor}
                onChange={(e) => setCarrierForm({ ...carrierForm, volumetricFactor: parseInt(e.target.value) || 5000 })}
                className="w-32"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCarrierForm({ ...carrierForm, volumetricFactor: 5000 })}
                  className={`px-3 py-1 text-xs rounded ${carrierForm.volumetricFactor === 5000 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}
                >
                  5000 (Aereo)
                </button>
                <button
                  type="button"
                  onClick={() => setCarrierForm({ ...carrierForm, volumetricFactor: 6000 })}
                  className={`px-3 py-1 text-xs rounded ${carrierForm.volumetricFactor === 6000 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}
                >
                  6000 (Terrestre)
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Peso volumetrico = (Largo x Ancho x Alto) / Factor. Aereo usa 5000, terrestre 6000.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL de Rastreo
            </label>
            <Input
              value={carrierForm.trackingUrlTemplate}
              onChange={(e) => setCarrierForm({ ...carrierForm, trackingUrlTemplate: e.target.value })}
              placeholder="https://ejemplo.com/rastreo?guia={tracking}"
            />
            <p className="text-xs text-gray-500 mt-1">
              Usa {'{tracking}'} donde va el numero de guia
            </p>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={carrierForm.isActive}
                onChange={(e) => setCarrierForm({ ...carrierForm, isActive: e.target.checked })}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">Transportadora activa</span>
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="admin-secondary" onClick={() => setIsCarrierModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSaveCarrier} className="flex-1">
              {editingCarrier ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Carrier Rates Modal */}
      <Modal
        isOpen={!!editingCarrierRates}
        onClose={handleCloseRatesModal}
        title={`Tarifas de ${editingCarrierRates?.name || ''}`}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Configura las tarifas de envio para cada zona geografica.
          </p>

          {/* Lista de tarifas */}
          <div className="space-y-2">
            {editingCarrierRates?.zoneRates.map((rate) => (
              <div key={rate.zoneId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{getZoneName(rate.zoneId)}</div>
                  <div className="text-sm text-gray-500">
                    Base: ${rate.baseCost.toLocaleString()} • +${rate.costPerKg.toLocaleString()}/kg •
                    {rate.estimatedDays.min}-{rate.estimatedDays.max} dias
                    {rate.freeShippingThreshold && ` • Gratis desde $${rate.freeShippingThreshold.toLocaleString()}`}
                  </div>
                </div>
                <button
                  onClick={() => handleOpenRateForm(rate)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Boton para agregar tarifa a zona faltante */}
          {settings.shipping.zones.length > (editingCarrierRates?.zoneRates.length || 0) && (
            <Button variant="admin-secondary" onClick={() => handleOpenRateForm()} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Tarifa para Zona
            </Button>
          )}

          <div className="flex justify-end pt-4">
            <Button onClick={handleCloseRatesModal}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rate Edit Modal */}
      <Modal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        title="Editar Tarifa"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zona
            </label>
            <select
              value={rateForm.zoneId}
              onChange={(e) => setRateForm({ ...rateForm, zoneId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              disabled={editingCarrierRates?.zoneRates.some(r => r.zoneId === rateForm.zoneId)}
            >
              <option value="">Seleccionar zona</option>
              {settings.shipping.zones.map((zone) => (
                <option key={zone.id} value={zone.id}>{zone.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Costo Base *
              </label>
              <Input
                type="number"
                min="0"
                value={rateForm.baseCost}
                onChange={(e) => setRateForm({ ...rateForm, baseCost: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Costo por kg *
              </label>
              <Input
                type="number"
                min="0"
                value={rateForm.costPerKg}
                onChange={(e) => setRateForm({ ...rateForm, costPerKg: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dias Minimos
              </label>
              <Input
                type="number"
                min="0"
                value={rateForm.estimatedDays.min}
                onChange={(e) => setRateForm({
                  ...rateForm,
                  estimatedDays: { ...rateForm.estimatedDays, min: parseInt(e.target.value) || 0 }
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dias Maximos
              </label>
              <Input
                type="number"
                min="0"
                value={rateForm.estimatedDays.max}
                onChange={(e) => setRateForm({
                  ...rateForm,
                  estimatedDays: { ...rateForm.estimatedDays, max: parseInt(e.target.value) || 0 }
                })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Envio Gratis Desde
              </label>
              <Input
                type="number"
                min="0"
                value={rateForm.freeShippingThreshold || ''}
                onChange={(e) => setRateForm({ ...rateForm, freeShippingThreshold: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="Opcional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peso Maximo (kg)
              </label>
              <Input
                type="number"
                min="0"
                value={rateForm.maxWeight || ''}
                onChange={(e) => setRateForm({ ...rateForm, maxWeight: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="Sin limite"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="admin-secondary" onClick={() => setIsRateModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSaveRate} className="flex-1">
              Guardar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Payment Method Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={editingPayment ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo *
            </label>
            <select
              value={paymentForm.type}
              onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value as PaymentMethodConfig['type'] })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              {Object.entries(PAYMENT_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <Input
              value={paymentForm.name}
              onChange={(e) => setPaymentForm({ ...paymentForm, name: e.target.value })}
              placeholder="Ej: Transferencia Bancolombia"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <Input
              value={paymentForm.description}
              onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
              placeholder="Breve descripción del método"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instrucciones
            </label>
            <textarea
              value={paymentForm.instructions}
              onChange={(e) => setPaymentForm({ ...paymentForm, instructions: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="Instrucciones para el cliente"
            />
          </div>

          {paymentForm.type === 'transfer' && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-gray-900">Información Bancaria</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Banco</label>
                  <Input
                    value={paymentForm.bankInfo?.bankName || ''}
                    onChange={(e) => setPaymentForm({
                      ...paymentForm,
                      bankInfo: { ...paymentForm.bankInfo!, bankName: e.target.value }
                    })}
                    placeholder="Bancolombia"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Cuenta</label>
                  <select
                    value={paymentForm.bankInfo?.accountType || 'Ahorros'}
                    onChange={(e) => setPaymentForm({
                      ...paymentForm,
                      bankInfo: { ...paymentForm.bankInfo!, accountType: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="Ahorros">Ahorros</option>
                    <option value="Corriente">Corriente</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Número de Cuenta</label>
                  <Input
                    value={paymentForm.bankInfo?.accountNumber || ''}
                    onChange={(e) => setPaymentForm({
                      ...paymentForm,
                      bankInfo: { ...paymentForm.bankInfo!, accountNumber: e.target.value }
                    })}
                    placeholder="123-456789-00"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Titular</label>
                  <Input
                    value={paymentForm.bankInfo?.accountHolder || ''}
                    onChange={(e) => setPaymentForm({
                      ...paymentForm,
                      bankInfo: { ...paymentForm.bankInfo!, accountHolder: e.target.value }
                    })}
                    placeholder="Nombre del titular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tipo Doc.</label>
                  <select
                    value={paymentForm.bankInfo?.documentType || 'CC'}
                    onChange={(e) => setPaymentForm({
                      ...paymentForm,
                      bankInfo: { ...paymentForm.bankInfo!, documentType: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="CC">CC</option>
                    <option value="NIT">NIT</option>
                    <option value="CE">CE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Número Doc.</label>
                  <Input
                    value={paymentForm.bankInfo?.documentNumber || ''}
                    onChange={(e) => setPaymentForm({
                      ...paymentForm,
                      bankInfo: { ...paymentForm.bankInfo!, documentNumber: e.target.value }
                    })}
                    placeholder="123.456.789"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={paymentForm.isActive}
                onChange={(e) => setPaymentForm({ ...paymentForm, isActive: e.target.checked })}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">Método activo</span>
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="admin-secondary" onClick={() => setIsPaymentModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSavePayment} className="flex-1">
              {editingPayment ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
