import { useState } from 'react';
import { useSettings } from '../../../context/SettingsContext';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../../components/shared/Button';
import { Input } from '../../../components/shared/Input';
import { Modal } from '../../../components/shared/Modal';
import type { ShippingZone, ShippingCarrier, CarrierZoneRate } from '../../../types/settings';
import {
  Truck,
  MapPin,
  Clock,
  Package,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  Check,
} from 'lucide-react';

export const SettingsShippingPage = () => {
  const {
    settings,
    updateShippingSettings,
    addShippingZone,
    updateShippingZone,
    deleteShippingZone,
    addCarrier,
    updateCarrier,
    deleteCarrier,
    updateCarrierZoneRate,
    addCarrierZoneRate,
  } = useSettings();
  const toast = useToast();

  // Modal states
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [isCarrierModalOpen, setIsCarrierModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [editingCarrier, setEditingCarrier] = useState<ShippingCarrier | null>(null);
  const [editingCarrierRates, setEditingCarrierRates] = useState<ShippingCarrier | null>(null);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);

  // Form states
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
  const [rateForm, setRateForm] = useState<CarrierZoneRate>({
    zoneId: '',
    baseCost: 0,
    costPerKg: 0,
    estimatedDays: { min: 1, max: 3 },
  });
  const [citiesInput, setCitiesInput] = useState('');

  // Zone handlers
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
      setZoneForm({ name: '', cities: [], isActive: true });
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

  // Carrier handlers
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

  // Rate handlers
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

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-8 h-8 text-orange-500" />
            Configuración de Envíos
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Administra zonas geográficas, transportadoras y tarifas
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Origen de Envío */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-500" />
            Origen de Envío
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Dirección desde donde salen todos los paquetes (tu bodega o taller).
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
                placeholder="Juan Pérez"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono *
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
                Código Postal
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
                Dirección *
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
                placeholder="Bogotá"
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

        {/* Tiempo de Preparación */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            Tiempo de Preparación
          </h3>
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Días hábiles para preparar un pedido
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                value={settings.shipping.handlingTime}
                onChange={(e) => updateShippingSettings({ handlingTime: parseInt(e.target.value) || 0 })}
                className="w-24"
              />
              <span className="text-gray-500">días</span>
            </div>
          </div>
        </div>

        {/* Configuración de Paquetes */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-500" />
            Configuración de Paquetes
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Valores por defecto para calcular el costo de envío basado en peso y volumen.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Largo (cm)</label>
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Ancho (cm)</label>
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Alto (cm)</label>
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Peso/item (kg)</label>
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Factor Vol.</label>
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
            Peso volumétrico = (Largo x Ancho x Alto) / Factor. Se usa el mayor entre peso real y volumétrico.
          </p>
        </div>

        {/* Zonas Geográficas */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-500" />
                Zonas Geográficas
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
                      {zone.cities.length > 0 ? zone.cities.join(', ') : 'Resto del país (ciudades no especificadas)'}
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
                No hay zonas de envío configuradas
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
                Cada transportadora tiene sus propias tarifas por zona geográfica.
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
                      {carrier.zoneRates.length > 0 && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {carrier.zoneRates.map((rate) => (
                            <div key={rate.zoneId} className="bg-gray-50 rounded px-3 py-2 text-xs">
                              <div className="font-medium text-gray-700">{getZoneName(rate.zoneId)}</div>
                              <div className="text-gray-500 mt-0.5">
                                Base: ${rate.baseCost.toLocaleString()} • +${rate.costPerKg.toLocaleString()}/kg • {rate.estimatedDays.min}-{rate.estimatedDays.max} días
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

      {/* Zone Modal */}
      <Modal
        isOpen={isZoneModalOpen}
        onClose={() => setIsZoneModalOpen(false)}
        title={editingZone ? 'Editar Zona Geográfica' : 'Nueva Zona Geográfica'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Zona *
            </label>
            <Input
              value={zoneForm.name}
              onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
              placeholder="Ej: Bogotá y alrededores"
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
              placeholder="Bogotá, Chía, Soacha, Funza"
            />
            <p className="text-xs text-gray-500 mt-1">
              Deja vacío para que aplique a ciudades no cubiertas por otras zonas (ej: "Resto del país")
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <Input
                value={carrierForm.name}
                onChange={(e) => setCarrierForm({ ...carrierForm, name: e.target.value })}
                placeholder="Ej: Servientrega"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
              <Input
                value={carrierForm.code}
                onChange={(e) => setCarrierForm({ ...carrierForm, code: e.target.value.toUpperCase() })}
                placeholder="Ej: SERVI"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Factor Volumétrico</label>
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
                  5000 (Aéreo)
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
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL de Rastreo</label>
            <Input
              value={carrierForm.trackingUrlTemplate}
              onChange={(e) => setCarrierForm({ ...carrierForm, trackingUrlTemplate: e.target.value })}
              placeholder="https://ejemplo.com/rastreo?guia={tracking}"
            />
            <p className="text-xs text-gray-500 mt-1">
              Usa {'{tracking}'} donde va el número de guía
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
            Configura las tarifas de envío para cada zona geográfica.
          </p>

          <div className="space-y-2">
            {editingCarrierRates?.zoneRates.map((rate) => (
              <div key={rate.zoneId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{getZoneName(rate.zoneId)}</div>
                  <div className="text-sm text-gray-500">
                    Base: ${rate.baseCost.toLocaleString()} • +${rate.costPerKg.toLocaleString()}/kg •
                    {rate.estimatedDays.min}-{rate.estimatedDays.max} días
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Zona</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo Base *</label>
              <Input
                type="number"
                min="0"
                value={rateForm.baseCost}
                onChange={(e) => setRateForm({ ...rateForm, baseCost: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo por kg *</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Días Mínimos</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Días Máximos</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Envío Gratis Desde</label>
              <Input
                type="number"
                min="0"
                value={rateForm.freeShippingThreshold || ''}
                onChange={(e) => setRateForm({ ...rateForm, freeShippingThreshold: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="Opcional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso Máximo (kg)</label>
              <Input
                type="number"
                min="0"
                value={rateForm.maxWeight || ''}
                onChange={(e) => setRateForm({ ...rateForm, maxWeight: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="Sin límite"
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
    </div>
  );
};
