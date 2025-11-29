import { useState } from 'react';
import { useSettings } from '../../../context/SettingsContext';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../../components/shared/Button';
import { Input } from '../../../components/shared/Input';
import type { AppearanceSettings } from '../../../types/settings';
import { BRAND_COLOR_PRESETS, THEME_PRESETS } from '../../../types/settings';
import {
  Palette,
  Save,
  Settings,
  Store,
  Globe,
} from 'lucide-react';

export const SettingsAppearancePage = () => {
  const { settings, updateAppearanceSettings } = useSettings();
  const toast = useToast();
  const [appearanceForm, setAppearanceForm] = useState<AppearanceSettings>(settings.appearance);

  const handleSaveAppearance = () => {
    updateAppearanceSettings(appearanceForm);
    toast.success('Configuración de apariencia guardada');
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Palette className="w-8 h-8 text-orange-500" />
            Apariencia
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Personaliza los colores y estilos del sitio
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Temas Predefinidos */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-orange-500" />
            Temas Predefinidos
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Selecciona un tema predefinido para aplicar todos los colores de una vez.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {THEME_PRESETS.map((theme, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setAppearanceForm({
                  ...appearanceForm,
                  brandColors: theme.brandColors,
                  buttonColor: theme.buttonColor,
                  footerBgColor: theme.footerBgColor,
                })}
                className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                  appearanceForm.brandColors.primary === theme.brandColors.primary
                    ? 'border-orange-500 ring-2 ring-orange-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div
                  className="h-12 rounded-md mb-2"
                  style={{
                    background: `linear-gradient(to right, ${theme.brandColors.primary}, ${theme.brandColors.secondary}, ${theme.brandColors.accent})`
                  }}
                />
                <span className="text-sm font-medium text-gray-700">{theme.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Colores de Marca */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-orange-500" />
            Colores de Marca (Gradiente)
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Define los colores del gradiente que se usará en el nombre del sitio y elementos destacados.
          </p>

          {/* Paletas de gradiente */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paletas de gradiente
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {BRAND_COLOR_PRESETS.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setAppearanceForm({
                    ...appearanceForm,
                    brandColors: {
                      primary: preset.primary,
                      secondary: preset.secondary,
                      accent: preset.accent,
                    }
                  })}
                  className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                    appearanceForm.brandColors.primary === preset.primary &&
                    appearanceForm.brandColors.secondary === preset.secondary
                      ? 'border-orange-500 ring-2 ring-orange-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div
                    className="h-8 rounded-md mb-2"
                    style={{
                      background: `linear-gradient(to right, ${preset.primary}, ${preset.secondary}, ${preset.accent})`
                    }}
                  />
                  <span className="text-xs font-medium text-gray-700">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Colores personalizados */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Colores personalizados
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Primario</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={appearanceForm.brandColors.primary}
                    onChange={(e) => setAppearanceForm({
                      ...appearanceForm,
                      brandColors: { ...appearanceForm.brandColors, primary: e.target.value }
                    })}
                    className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                  />
                  <Input
                    value={appearanceForm.brandColors.primary}
                    onChange={(e) => setAppearanceForm({
                      ...appearanceForm,
                      brandColors: { ...appearanceForm.brandColors, primary: e.target.value }
                    })}
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Secundario</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={appearanceForm.brandColors.secondary}
                    onChange={(e) => setAppearanceForm({
                      ...appearanceForm,
                      brandColors: { ...appearanceForm.brandColors, secondary: e.target.value }
                    })}
                    className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                  />
                  <Input
                    value={appearanceForm.brandColors.secondary}
                    onChange={(e) => setAppearanceForm({
                      ...appearanceForm,
                      brandColors: { ...appearanceForm.brandColors, secondary: e.target.value }
                    })}
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Acento</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={appearanceForm.brandColors.accent}
                    onChange={(e) => setAppearanceForm({
                      ...appearanceForm,
                      brandColors: { ...appearanceForm.brandColors, accent: e.target.value }
                    })}
                    className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                  />
                  <Input
                    value={appearanceForm.brandColors.accent}
                    onChange={(e) => setAppearanceForm({
                      ...appearanceForm,
                      brandColors: { ...appearanceForm.brandColors, accent: e.target.value }
                    })}
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Vista previa del gradiente */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <label className="block text-xs text-gray-500 mb-2">Vista previa</label>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl"
                style={{
                  background: `linear-gradient(to bottom right, ${appearanceForm.brandColors.primary}, ${appearanceForm.brandColors.secondary}, ${appearanceForm.brandColors.accent})`
                }}
              />
              <span
                className="text-2xl font-black"
                style={{
                  background: `linear-gradient(to right, ${appearanceForm.brandColors.primary}, ${appearanceForm.brandColors.secondary}, ${appearanceForm.brandColors.accent})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {settings.general.siteName || 'StylePrint'}
              </span>
            </div>
          </div>
        </div>

        {/* Botones y elementos */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-500" />
            Color de Botones
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Color principal para botones y elementos interactivos.
          </p>
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={appearanceForm.buttonColor}
              onChange={(e) => setAppearanceForm({ ...appearanceForm, buttonColor: e.target.value })}
              className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
            />
            <Input
              value={appearanceForm.buttonColor}
              onChange={(e) => setAppearanceForm({ ...appearanceForm, buttonColor: e.target.value })}
              className="w-32 font-mono text-sm"
            />
            <button
              type="button"
              className="px-6 py-2 rounded-lg text-white font-medium"
              style={{ backgroundColor: appearanceForm.buttonColor }}
            >
              Ejemplo de botón
            </button>
          </div>
        </div>

        {/* Opciones del Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Store className="w-5 h-5 text-orange-500" />
            Opciones del Header
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Mostrar Slogan</p>
                <p className="text-sm text-gray-500">Muestra el slogan debajo del nombre en el header</p>
              </div>
              <button
                type="button"
                onClick={() => setAppearanceForm({ ...appearanceForm, showSlogan: !appearanceForm.showSlogan })}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  appearanceForm.showSlogan ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    appearanceForm.showSlogan ? 'left-8' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Opciones del Footer */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-orange-500" />
            Opciones del Footer
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color de fondo del Footer
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={appearanceForm.footerBgColor}
                  onChange={(e) => setAppearanceForm({ ...appearanceForm, footerBgColor: e.target.value })}
                  className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                />
                <Input
                  value={appearanceForm.footerBgColor}
                  onChange={(e) => setAppearanceForm({ ...appearanceForm, footerBgColor: e.target.value })}
                  className="w-32 font-mono text-sm"
                />
                <div
                  className="w-24 h-12 rounded-lg border border-gray-200"
                  style={{ backgroundColor: appearanceForm.footerBgColor }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Mostrar Redes Sociales</p>
                <p className="text-sm text-gray-500">Muestra los iconos de redes sociales en el footer</p>
              </div>
              <button
                type="button"
                onClick={() => setAppearanceForm({ ...appearanceForm, showSocialInFooter: !appearanceForm.showSocialInFooter })}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  appearanceForm.showSocialInFooter ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    appearanceForm.showSocialInFooter ? 'left-8' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Mostrar Horarios</p>
                <p className="text-sm text-gray-500">Muestra la sección de horarios de atención en el footer</p>
              </div>
              <button
                type="button"
                onClick={() => setAppearanceForm({ ...appearanceForm, showScheduleInFooter: !appearanceForm.showScheduleInFooter })}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  appearanceForm.showScheduleInFooter ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    appearanceForm.showScheduleInFooter ? 'left-8' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Guardar */}
        <div className="flex justify-end">
          <Button onClick={handleSaveAppearance}>
            <Save className="w-4 h-4 mr-2" />
            Guardar Cambios
          </Button>
        </div>
      </div>
    </div>
  );
};
