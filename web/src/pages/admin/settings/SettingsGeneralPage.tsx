import { useState } from 'react';
import { useSettings } from '../../../context/SettingsContext';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../../components/shared/Button';
import { Input } from '../../../components/shared/Input';
import { ImageUpload } from '../../../components/shared/ImageUpload';
import { CURRENCY_OPTIONS } from '../../../types/settings';
import {
  Settings,
  Store,
  Save,
  Globe,
  Phone,
  Mail,
  Building,
  Facebook,
  Instagram,
  MessageCircle,
} from 'lucide-react';

export const SettingsGeneralPage = () => {
  const { settings, updateGeneralSettings } = useSettings();
  const toast = useToast();
  const [generalForm, setGeneralForm] = useState(settings.general);

  const handleSaveGeneral = () => {
    updateGeneralSettings(generalForm);
    toast.success('Configuración general guardada');
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-8 h-8 text-orange-500" />
            Configuración General
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Información básica del sitio y datos de contacto
          </p>
        </div>
      </div>

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
                Slogan
              </label>
              <Input
                value={generalForm.slogan || ''}
                onChange={(e) => setGeneralForm({ ...generalForm, slogan: e.target.value })}
                placeholder="Tu Estilo, Tu Diseño"
              />
              <p className="text-xs text-gray-500 mt-1">
                Texto que aparece debajo del nombre en el header
              </p>
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

        {/* Logo */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Store className="w-5 h-5 text-orange-500" />
            Logo del Sitio
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Sube el logo de tu tienda. Se mostrará junto al nombre en el header y footer.
          </p>
          <ImageUpload
            value={generalForm.logo}
            onChange={(imageData) => setGeneralForm({ ...generalForm, logo: imageData })}
            label=""
            hint="Recomendado: PNG transparente, máximo 200x60px. El nombre y slogan siempre se mostrarán."
            maxSizeMB={1}
            aspectRatio="landscape"
          />
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
    </div>
  );
};
