import { useState, useEffect } from 'react';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../../components/shared/Button';
import { ImageUpload } from '../../../components/shared/ImageUpload';
import settingsService from '../../../services/settings.service';
import type { PrintSettings, PaperTemplate, PaperFormat } from '../../../types/settings';
import { PAPER_TEMPLATES, DEFAULT_PRINT_SETTINGS } from '../../../types/settings';
import {
  Printer,
  Check,
  Save,
  RefreshCw,
  Smartphone,
  Info,
  Receipt,
  FileText,
  Image,
  Building2,
  Hash,
} from 'lucide-react';

export const SettingsPrintingPage = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);
  const [selectedTemplate, setSelectedTemplate] = useState<PaperTemplate | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    // Update selected template when settings change
    const template = PAPER_TEMPLATES.find(t => t.id === settings.selectedTemplateId);
    setSelectedTemplate(template || null);
  }, [settings.selectedTemplateId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getPrintingSettings();
      setSettings({ ...DEFAULT_PRINT_SETTINGS, ...data });
    } catch (error) {
      console.error('Error loading printing settings:', error);
      // Use defaults if error
      setSettings(DEFAULT_PRINT_SETTINGS);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await settingsService.updatePrintingSettings(settings);
      toast.success('Configuración de impresión guardada');
    } catch (error) {
      console.error('Error saving printing settings:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectTemplate = (template: PaperTemplate) => {
    setSettings({
      ...settings,
      selectedTemplateId: template.id,
      ticketFormat: template.format,
      ticketWidth: template.width,
      ticketHeight: template.height,
    });
  };

  const getFormatLabel = (format: PaperFormat): string => {
    const labels: Record<PaperFormat, string> = {
      '58mm': 'Ticket 58mm',
      '80mm': 'Ticket 80mm',
      'letter': 'Carta',
      'a4': 'A4',
      'custom': 'Personalizado',
    };
    return labels[format];
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Printer className="w-8 h-8 text-orange-500" />
            Configuración de Impresión
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Configura el formato de papel para tickets de venta POS
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Guardar Cambios
        </Button>
      </div>

      <div className="space-y-6">
        {/* Plantillas de Papel para POS */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-bold text-gray-900">
              Formato de Ticket POS
            </h3>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Selecciona el formato de papel que usa tu impresora de tickets. Esto afecta cómo se genera el PDF de la factura.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PAPER_TEMPLATES.filter(t => t.format === '58mm' || t.format === '80mm' || t.format === 'letter').map((template) => (
              <div
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  settings.selectedTemplateId === template.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                {template.recommended && (
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                    Recomendado
                  </span>
                )}
                {settings.selectedTemplateId === template.id && (
                  <div className="absolute top-2 left-2">
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}

                {/* Preview visual */}
                <div className="flex justify-center mb-3">
                  {template.format === 'letter' ? (
                    <div className="bg-white border-2 border-gray-300 rounded shadow-sm flex items-center justify-center w-16 h-20">
                      <div className="text-center">
                        <FileText className="w-4 h-4 text-gray-400 mx-auto" />
                        <span className="text-xs text-gray-400 font-mono block mt-1">
                          Carta
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`bg-white border-2 border-gray-300 rounded shadow-sm flex items-center justify-center ${
                        template.format === '58mm' ? 'w-12 h-24' : 'w-16 h-28'
                      }`}
                    >
                      <span className="text-xs text-gray-400 font-mono">
                        {template.width}mm
                      </span>
                    </div>
                  )}
                </div>

                <h4 className="font-semibold text-gray-900 text-center">
                  {template.name}
                </h4>
                <p className="text-xs text-gray-500 text-center mt-1">
                  {template.description}
                </p>

                {/* Impresoras compatibles */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-700 mb-1">
                    Impresoras compatibles:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {template.compatiblePrinters.slice(0, 3).map((printer, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                      >
                        {printer}
                      </span>
                    ))}
                    {template.compatiblePrinters.length > 3 && (
                      <span className="text-xs text-gray-400">
                        +{template.compatiblePrinters.length - 3} más
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logo y Encabezado del Ticket */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Image className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-bold text-gray-900">
              Logo y Encabezado del Ticket
            </h3>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Sube un logo específico para el ticket. Si tu logo ya incluye el nombre de la empresa o el NIT, puedes ocultar esos textos para evitar duplicados.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload de logo */}
            <div>
              <ImageUpload
                value={settings.ticketLogo}
                onChange={(imageData) => setSettings({ ...settings, ticketLogo: imageData || '' })}
                label="Logo del Ticket"
                hint="Recomendado: PNG transparente, max 500x200px"
                maxSizeMB={1}
                aspectRatio="landscape"
              />
              {!settings.ticketLogo && (
                <p className="text-xs text-gray-400 mt-2">
                  Si no subes un logo aquí, se usará el logo general de la tienda (si está configurado).
                </p>
              )}
            </div>

            {/* Opciones de visibilidad */}
            <div className="space-y-4">
              {/* Mostrar logo */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Image className="w-5 h-5 text-gray-400" />
                  <div>
                    <h4 className="font-medium text-gray-900">Mostrar Logo</h4>
                    <p className="text-sm text-gray-500">
                      Incluir logo en el encabezado
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showLogo}
                    onChange={(e) => setSettings({ ...settings, showLogo: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              {/* Mostrar nombre de empresa */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-gray-400" />
                  <div>
                    <h4 className="font-medium text-gray-900">Mostrar Nombre</h4>
                    <p className="text-sm text-gray-500">
                      Mostrar nombre de la empresa
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showStoreName ?? true}
                    onChange={(e) => setSettings({ ...settings, showStoreName: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              {/* Mostrar NIT */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Hash className="w-5 h-5 text-gray-400" />
                  <div>
                    <h4 className="font-medium text-gray-900">Mostrar NIT</h4>
                    <p className="text-sm text-gray-500">
                      Mostrar NIT y datos fiscales
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showNit ?? true}
                    onChange={(e) => setSettings({ ...settings, showNit: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Opciones Adicionales */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-bold text-gray-900">
              Otras Opciones
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Mostrar QR */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Mostrar Código QR</h4>
                <p className="text-sm text-gray-500">
                  Incluir código QR con información de la venta
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showQR}
                  onChange={(e) => setSettings({ ...settings, showQR: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>

            {/* Vista previa antes de imprimir */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <h4 className="font-medium text-gray-900">Vista Previa al Imprimir</h4>
                <p className="text-sm text-gray-500">
                  Mostrar modal con vista previa del PDF antes de imprimir
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showPreviewModal ?? true}
                  onChange={(e) => setSettings({ ...settings, showPreviewModal: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>

            {/* Tamaño de fuente */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Tamaño de Fuente</h4>
              <div className="flex gap-2">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setSettings({ ...settings, fontSize: size })}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      settings.fontSize === size
                        ? 'bg-orange-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {size === 'small' && 'Pequeño'}
                    {size === 'medium' && 'Mediano'}
                    {size === 'large' && 'Grande'}
                  </button>
                ))}
              </div>
            </div>

            {/* Márgenes del ticket */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Márgenes del Ticket (mm)</h4>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Arriba</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={settings.ticketMargins.top}
                    onChange={(e) => setSettings({
                      ...settings,
                      ticketMargins: { ...settings.ticketMargins, top: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Derecha</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={settings.ticketMargins.right}
                    onChange={(e) => setSettings({
                      ...settings,
                      ticketMargins: { ...settings.ticketMargins, right: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Abajo</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={settings.ticketMargins.bottom}
                    onChange={(e) => setSettings({
                      ...settings,
                      ticketMargins: { ...settings.ticketMargins, bottom: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Izquierda</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={settings.ticketMargins.left}
                    onChange={(e) => setSettings({
                      ...settings,
                      ticketMargins: { ...settings.ticketMargins, left: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview de configuración actual */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-6 border border-orange-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-orange-500" />
            Resumen de Configuración
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm font-medium text-gray-700">Formato de Ticket POS</p>
              <p className="text-lg font-bold text-gray-900">
                {getFormatLabel(settings.ticketFormat)}
              </p>
              <p className="text-xs text-gray-500">
                {settings.ticketFormat === 'letter'
                  ? `${settings.ticketWidth}x279mm (Hoja Carta)`
                  : `${settings.ticketWidth}mm de ancho`}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm font-medium text-gray-700">Encabezado</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {settings.showLogo && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    Logo
                  </span>
                )}
                {(settings.showStoreName ?? true) && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                    Nombre
                  </span>
                )}
                {(settings.showNit ?? true) && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                    NIT
                  </span>
                )}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm font-medium text-gray-700">Otras Opciones</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {settings.showQR && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    QR
                  </span>
                )}
                {settings.showPreviewModal && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                    Vista Previa
                  </span>
                )}
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                  Fuente {settings.fontSize === 'small' ? 'pequeña' : settings.fontSize === 'medium' ? 'mediana' : 'grande'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
