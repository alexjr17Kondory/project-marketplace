import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Copy, Tag, X, Save, ArrowLeft, Eye, Download } from 'lucide-react';
import * as labelTemplatesService from '../../../services/label-templates.service';
import * as barcodeService from '../../../services/barcode.service';
import { catalogsService } from '../../../services/catalogs.service';
import type { LabelTemplate, LabelZone } from '../../../types/label-template';
import type { ProductType } from '../../../services/catalogs.service';
import { LabelTemplateEditor } from '../../../components/admin/LabelTemplateEditor';
import { Modal } from '../../../components/shared/Modal';
import { Button } from '../../../components/shared/Button';

type ViewMode = 'list' | 'editor';

export default function LabelTemplatesPage() {
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingTemplate, setEditingTemplate] = useState<LabelTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  // Editor state
  const [editorData, setEditorData] = useState({
    name: '',
    backgroundImage: null as string | null,
    width: 170.08,
    height: 255.12,
    pageType: 'A4',
    pageMargin: 20, // Optimizado: 0.7cm para mejor aprovechamiento
    labelSpacing: 5.67, // Optimizado: 0.2cm para mejor aprovechamiento
    isDefault: false,
    productTypeIds: [] as number[],
    zones: [] as LabelZone[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesData, productTypesData] = await Promise.all([
        labelTemplatesService.getLabelTemplates(),
        catalogsService.getProductTypes(),
      ]);
      setTemplates(templatesData);
      setProductTypes(productTypesData.filter(pt => pt.isActive));
    } catch (err: any) {
      console.error('Error loading data:', err);
      alert(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await labelTemplatesService.getLabelTemplates();
      setTemplates(data);
    } catch (err: any) {
      console.error('Error loading templates:', err);
      alert(err.message || 'Error al cargar plantillas');
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setEditorData({
      name: '',
      backgroundImage: null,
      width: 170.08,
      height: 255.12,
      pageType: 'A4',
      pageMargin: 20, // Optimizado: 0.7cm
      labelSpacing: 5.67, // Optimizado: 0.2cm
      isDefault: false,
      productTypeIds: [],
      zones: [],
    });
    setViewMode('editor');
  };

  const handleEdit = async (template: LabelTemplate) => {
    try {
      // Cargar la plantilla completa con zonas
      const fullTemplate = await labelTemplatesService.getLabelTemplateById(template.id);

      setEditingTemplate(fullTemplate);
      setEditorData({
        name: fullTemplate.name,
        backgroundImage: fullTemplate.backgroundImage,
        width: fullTemplate.width,
        height: fullTemplate.height,
        pageType: fullTemplate.pageType || 'A4',
        pageMargin: fullTemplate.pageMargin ?? 20, // Optimizado: 0.7cm
        labelSpacing: fullTemplate.labelSpacing ?? 5.67, // Optimizado: 0.2cm
        isDefault: fullTemplate.isDefault,
        productTypeIds: fullTemplate.productTypes?.map(pt => pt.productTypeId) || [],
        zones: fullTemplate.zones || [],
      });
      setViewMode('editor');
    } catch (err: any) {
      console.error('Error loading template:', err);
      alert(err.message || 'Error al cargar plantilla');
    }
  };

  const handleSave = async () => {
    if (!editorData.name.trim()) {
      alert('El nombre es requerido');
      return;
    }

    if (editorData.width <= 0 || editorData.height <= 0) {
      alert('Las dimensiones deben ser mayores a 0');
      return;
    }

    setSaving(true);

    try {
      const templateData = {
        name: editorData.name,
        backgroundImage: editorData.backgroundImage,
        width: editorData.width,
        height: editorData.height,
        pageType: editorData.pageType,
        pageMargin: editorData.pageMargin,
        labelSpacing: editorData.labelSpacing,
        isDefault: editorData.isDefault,
        productTypeIds: editorData.productTypeIds,
      };

      let templateId: number;

      if (editingTemplate) {
        // Actualizar plantilla existente
        await labelTemplatesService.updateLabelTemplate(editingTemplate.id, templateData);
        templateId = editingTemplate.id;
      } else {
        // Crear nueva plantilla
        const created = await labelTemplatesService.createLabelTemplate(templateData);
        templateId = created.id;
      }

      // Guardar zonas
      // Primero, eliminar zonas que ya no existen (las que tienen ID positivo pero no están en la lista)
      if (editingTemplate) {
        const existingZoneIds = editorData.zones.filter(z => z.id > 0).map(z => z.id);
        const originalZoneIds = editingTemplate.zones?.map(z => z.id) || [];
        const zonesToDelete = originalZoneIds.filter(id => !existingZoneIds.includes(id));

        for (const zoneId of zonesToDelete) {
          await labelTemplatesService.deleteLabelZone(zoneId);
        }
      }

      // Luego, crear o actualizar cada zona
      for (const zone of editorData.zones) {
        if (zone.id < 0) {
          // Zona nueva (ID temporal negativo)
          await labelTemplatesService.createLabelZone(templateId, {
            zoneType: zone.zoneType,
            x: zone.x,
            y: zone.y,
            width: zone.width,
            height: zone.height,
            fontSize: zone.fontSize,
            fontWeight: zone.fontWeight,
            textAlign: zone.textAlign,
            fontColor: zone.fontColor,
            showLabel: zone.showLabel,
            rotation: zone.rotation,
            zIndex: zone.zIndex,
          });
        } else {
          // Zona existente
          await labelTemplatesService.updateLabelZone(zone.id, {
            x: zone.x,
            y: zone.y,
            width: zone.width,
            height: zone.height,
            fontSize: zone.fontSize,
            fontWeight: zone.fontWeight,
            textAlign: zone.textAlign,
            fontColor: zone.fontColor,
            showLabel: zone.showLabel,
            rotation: zone.rotation,
            zIndex: zone.zIndex,
          });
        }
      }

      await loadTemplates();
      setViewMode('list');
      alert(editingTemplate ? 'Plantilla actualizada correctamente' : 'Plantilla creada correctamente');
    } catch (err: any) {
      console.error('Error saving template:', err);
      alert(err.message || 'Error al guardar plantilla');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (editorData.zones.length > 0 || editorData.name.trim()) {
      if (!confirm('¿Descartar cambios?')) {
        return;
      }
    }
    setViewMode('list');
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar la plantilla "${name}"?`)) {
      return;
    }

    try {
      await labelTemplatesService.deleteLabelTemplate(id);
      await loadTemplates();
      alert('Plantilla eliminada');
    } catch (err: any) {
      alert(err.message || 'Error al eliminar plantilla');
    }
  };

  const handleDuplicate = async (id: number, name: string) => {
    const newName = prompt('Nombre para la plantilla duplicada:', `${name} (Copia)`);
    if (!newName) return;

    try {
      await labelTemplatesService.duplicateLabelTemplate(id, newName);
      await loadTemplates();
      alert('Plantilla duplicada');
    } catch (err: any) {
      alert(err.message || 'Error al duplicar plantilla');
    }
  };

  const handleGenerateExample = async (templateId: number) => {
    try {
      setGeneratingPDF(true);

      // Calcular cuántas etiquetas caben en una hoja con esta plantilla
      const template = templates.find(t => t.id === templateId);
      if (!template) {
        alert('Plantilla no encontrada');
        return;
      }

      // Calcular grid basado en configuración de la plantilla
      const pageType = template.pageType || 'A4';
      let pageWidth: number, pageHeight: number;

      switch (pageType) {
        case 'A3':
          pageWidth = 841.89; pageHeight = 1190.55;
          break;
        case 'LETTER':
          pageWidth = 612; pageHeight = 792;
          break;
        case 'A4':
        default:
          pageWidth = 595.28; pageHeight = 841.89;
          break;
      }

      const margin = template.pageMargin ?? 30;
      const spacing = template.labelSpacing ?? 10;
      const labelCols = Math.floor((pageWidth - margin * 2 + spacing) / (template.width + spacing));
      const labelRows = Math.floor((pageHeight - margin * 2 + spacing) / (template.height + spacing));
      const labelsPerPage = labelCols * labelRows;

      // Generar items de ejemplo (repetir para llenar una página)
      const exampleItems = Array(labelsPerPage).fill(null).map((_, index) => ({
        variantId: 1, // Usaremos la primera variante disponible
        quantity: 1,
      }));

      // Generar PDF
      const pdfBlob = await barcodeService.generateBarcodeLabels(exampleItems, templateId);

      // Crear URL del blob para previsualización
      const url = window.URL.createObjectURL(pdfBlob);
      setPdfPreviewUrl(url);
      setShowPreviewModal(true);

    } catch (err: any) {
      console.error('Error generando PDF:', err);
      alert(err.response?.data?.message || err.message || 'Error al generar PDF de ejemplo');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleGenerateExampleFromEditor = async () => {
    try {
      setGeneratingPDF(true);

      // Si estamos editando, primero guardar la configuración actual temporalmente
      if (editingTemplate) {
        // Actualizar la plantilla con la configuración actual del editor
        await labelTemplatesService.updateLabelTemplate(editingTemplate.id, {
          name: editorData.name,
          backgroundImage: editorData.backgroundImage,
          width: editorData.width,
          height: editorData.height,
          pageType: editorData.pageType,
          pageMargin: editorData.pageMargin,
          labelSpacing: editorData.labelSpacing,
          isDefault: editorData.isDefault,
          productTypeIds: editorData.productTypeIds,
        });

        // Actualizar zonas si cambiaron
        if (editorData.zones && editorData.zones.length > 0) {
          const zonesWithIds = editorData.zones.filter(z => z.id);
          if (zonesWithIds.length > 0) {
            await labelTemplatesService.updateLabelZones(
              editingTemplate.id,
              zonesWithIds.map(zone => ({
                id: zone.id!,
                data: {
                  x: zone.x,
                  y: zone.y,
                  width: zone.width,
                  height: zone.height,
                  fontSize: zone.fontSize,
                  fontWeight: zone.fontWeight,
                  textAlign: zone.textAlign,
                  fontColor: zone.fontColor,
                  showLabel: zone.showLabel,
                  rotation: zone.rotation,
                  zIndex: zone.zIndex,
                },
              }))
            );
          }
        }
      } else {
        alert('Debes guardar la plantilla antes de ver el ejemplo');
        return;
      }

      // Calcular grid basado en la configuración actual del editor
      const pageType = editorData.pageType || 'A4';
      let pageWidth: number, pageHeight: number;

      switch (pageType) {
        case 'A3':
          pageWidth = 841.89; pageHeight = 1190.55;
          break;
        case 'LETTER':
          pageWidth = 612; pageHeight = 792;
          break;
        case 'A4':
        default:
          pageWidth = 595.28; pageHeight = 841.89;
          break;
      }

      const margin = editorData.pageMargin ?? 20;
      const spacing = editorData.labelSpacing ?? 5.67;
      const labelCols = Math.floor((pageWidth - margin * 2 + spacing) / (editorData.width + spacing));
      const labelRows = Math.floor((pageHeight - margin * 2 + spacing) / (editorData.height + spacing));
      const labelsPerPage = labelCols * labelRows;

      // Generar items de ejemplo (repetir para llenar una página)
      const exampleItems = Array(labelsPerPage).fill(null).map((_, index) => ({
        variantId: 1,
        quantity: 1,
      }));

      // Generar PDF usando la plantilla con la configuración actualizada
      const pdfBlob = await barcodeService.generateBarcodeLabels(exampleItems, editingTemplate.id);

      // Crear URL del blob para previsualización
      const url = window.URL.createObjectURL(pdfBlob);
      setPdfPreviewUrl(url);
      setShowPreviewModal(true);

    } catch (err: any) {
      console.error('Error generando PDF:', err);
      alert(err.response?.data?.message || err.message || 'Error al generar PDF de ejemplo');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleClosePreview = () => {
    if (pdfPreviewUrl) {
      window.URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(null);
    }
    setShowPreviewModal(false);
  };

  const handleDownloadPDF = () => {
    if (!pdfPreviewUrl) return;

    const link = document.createElement('a');
    link.href = pdfPreviewUrl;
    link.download = `ejemplo-etiquetas-${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calcular métricas de aprovechamiento de forma reactiva
  const metrics = useMemo(() => {
    const pageType = editorData.pageType || 'A4';
    let pageWidth: number, pageHeight: number, pageNameCm: string;

    switch (pageType) {
      case 'A3':
        pageWidth = 841.89; pageHeight = 1190.55;
        pageNameCm = '29.7 × 42 cm';
        break;
      case 'LETTER':
        pageWidth = 612; pageHeight = 792;
        pageNameCm = '21.6 × 27.9 cm';
        break;
      case 'A4':
      default:
        pageWidth = 595.28; pageHeight = 841.89;
        pageNameCm = '21 × 29.7 cm';
        break;
    }

    const margin = editorData.pageMargin ?? 20;
    const spacing = editorData.labelSpacing ?? 5.67;
    const labelCols = Math.floor((pageWidth - margin * 2 + spacing) / (editorData.width + spacing));
    const labelRows = Math.floor((pageHeight - margin * 2 + spacing) / (editorData.height + spacing));
    const labelsPerPage = labelCols * labelRows;

    // Calcular área utilizada vs área total
    const pageAreaCm2 = (pageWidth / 28.35) * (pageHeight / 28.35);
    const labelAreaCm2 = (editorData.width / 28.35) * (editorData.height / 28.35);
    const usedAreaCm2 = labelAreaCm2 * labelsPerPage;
    const utilizationPercent = (usedAreaCm2 / pageAreaCm2) * 100;

    return {
      pageType,
      pageNameCm,
      labelCols,
      labelRows,
      labelsPerPage,
      utilizationPercent,
    };
  }, [
    editorData.pageType,
    editorData.width,
    editorData.height,
    editorData.pageMargin,
    editorData.labelSpacing,
  ]);

  // Calcular configuraciones optimizadas dinámicamente para el tipo de hoja actual
  const optimizedConfigs = useMemo(() => {
    const pageType = editorData.pageType || 'A4';
    let pageWidth: number, pageHeight: number;

    switch (pageType) {
      case 'A3':
        pageWidth = 841.89; pageHeight = 1190.55;
        break;
      case 'LETTER':
        pageWidth = 612; pageHeight = 792;
        break;
      case 'A4':
      default:
        pageWidth = 595.28; pageHeight = 841.89;
        break;
    }

    // Usar márgenes y separación actuales del editor
    const currentMargin = editorData.pageMargin ?? 20;
    const currentSpacing = editorData.labelSpacing ?? 5.67;

    // Área disponible después de márgenes
    const availableWidth = pageWidth - currentMargin * 2;
    const availableHeight = pageHeight - currentMargin * 2;

    // Función helper para calcular métricas
    const calculateMetrics = (width: number, height: number) => {
      const cols = Math.floor((availableWidth + currentSpacing) / (width + currentSpacing));
      const rows = Math.floor((availableHeight + currentSpacing) / (height + currentSpacing));
      const total = cols * rows;
      const pageAreaCm2 = (pageWidth / 28.35) * (pageHeight / 28.35);
      const labelAreaCm2 = (width / 28.35) * (height / 28.35);
      const usedAreaCm2 = labelAreaCm2 * total;
      const utilization = (usedAreaCm2 / pageAreaCm2) * 100;
      return { cols, rows, total, utilization };
    };

    // Función para calcular dimensiones óptimas dado un grid objetivo
    // Usa los márgenes y separación ACTUALES del formulario
    const calculateOptimalDimensions = (targetCols: number, targetRows: number, aspectRatio: number = 1.5) => {
      // Calcular el ancho máximo que puede tener cada etiqueta
      // availableWidth = (labelWidth × cols) + (spacing × (cols - 1))
      // labelWidth = (availableWidth - spacing × (cols - 1)) / cols
      const maxWidth = (availableWidth - currentSpacing * (targetCols - 1)) / targetCols;
      const maxHeight = (availableHeight - currentSpacing * (targetRows - 1)) / targetRows;

      // Mantener proporción vertical (2:3) ajustando dimensiones
      let finalWidth = maxWidth;
      let finalHeight = finalWidth * aspectRatio;

      // Si la altura calculada excede el máximo, ajustar desde la altura
      if (finalHeight > maxHeight) {
        finalHeight = maxHeight;
        finalWidth = finalHeight / aspectRatio;
      }

      return { width: finalWidth, height: finalHeight };
    };

    // Definir grids objetivo para cada tamaño
    // Estos grids se adaptan automáticamente al tamaño de hoja seleccionado
    const configs = [];

    // PEQUEÑA: Grid denso (más etiquetas)
    // Para A4: típicamente 4×6 = 24 etiquetas
    // Para A3: típicamente 6×9 = 54 etiquetas
    // Para Letter: típicamente 4×5 = 20 etiquetas
    let smallCols = 4, smallRows = 6;
    if (pageType === 'A3') {
      smallCols = 6;
      smallRows = 9;
    } else if (pageType === 'LETTER') {
      smallCols = 4;
      smallRows = 5;
    }

    const smallSize = calculateOptimalDimensions(smallCols, smallRows, 1.5);
    configs.push({
      name: 'Pequeña',
      description: 'Máxima cantidad de etiquetas',
      recommendation: 'Ideal para accesorios, ropa infantil o producción masiva',
      width: smallSize.width,
      height: smallSize.height,
      color: 'purple',
      icon: '📦',
    });

    // MEDIANA: Grid balanceado
    // Para A4: típicamente 3×3 = 9 etiquetas
    // Para A3: típicamente 4×6 = 24 etiquetas
    // Para Letter: típicamente 3×3 = 9 etiquetas
    let mediumCols = 3, mediumRows = 3;
    if (pageType === 'A3') {
      mediumCols = 4;
      mediumRows = 6;
    }

    const mediumSize = calculateOptimalDimensions(mediumCols, mediumRows, 1.5);
    configs.push({
      name: 'Mediana',
      description: 'Balance entre tamaño y cantidad',
      recommendation: 'Recomendada para ropa en general y uso estándar',
      width: mediumSize.width,
      height: mediumSize.height,
      color: 'green',
      icon: '📋',
    });

    // GRANDE: Grid espacioso (menos etiquetas, más grandes)
    // Para A4: típicamente 2×2 = 4 etiquetas
    // Para A3: típicamente 3×4 = 12 etiquetas
    // Para Letter: típicamente 2×2 = 4 etiquetas
    let largeCols = 2, largeRows = 2;
    if (pageType === 'A3') {
      largeCols = 3;
      largeRows = 4;
    }

    const largeSize = calculateOptimalDimensions(largeCols, largeRows, 1.5);
    configs.push({
      name: 'Grande',
      description: 'Mayor espacio y legibilidad',
      recommendation: 'Perfecta para productos premium o con mucha información',
      width: largeSize.width,
      height: largeSize.height,
      color: 'amber',
      icon: '📄',
    });

    // Calcular métricas reales para cada configuración
    return configs.map(config => {
      const metrics = calculateMetrics(config.width, config.height);
      return {
        ...config,
        metrics,
        widthCm: (config.width / 28.35).toFixed(1),
        heightCm: (config.height / 28.35).toFixed(1),
      };
    }).filter(config => config.metrics.total > 0); // Solo mostrar si caben etiquetas
  }, [editorData.pageType, editorData.pageMargin, editorData.labelSpacing]);

  // Función para aplicar una configuración optimizada (solo cambia dimensiones)
  const applyOptimizedConfig = (config: typeof optimizedConfigs[0]) => {
    setEditorData({
      ...editorData,
      width: config.width,
      height: config.height,
      // Mantiene pageMargin y labelSpacing actuales del usuario
    });
  };

  // Vista de Editor
  if (viewMode === 'editor') {
    return (
      <>
        <div className="p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Volver"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Tag className="w-8 h-8 text-orange-500" />
                {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
              </h1>
              <p className="text-gray-600 mt-1 text-sm">
                Diseña la etiqueta arrastrando las zonas de información
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              onClick={handleGenerateExampleFromEditor}
              className="flex items-center gap-2 px-4 py-2 text-orange-600 bg-orange-50 border border-orange-300 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50"
              disabled={generatingPDF || !editingTemplate}
              title={!editingTemplate ? 'Guarda la plantilla primero para ver el ejemplo' : 'Ver ejemplo de PDF'}
            >
              <Eye size={20} />
              {generatingPDF ? 'Generando...' : 'Ver Ejemplo'}
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              disabled={saving}
            >
              <Save size={20} />
              {saving ? 'Guardando...' : 'Guardar Plantilla'}
            </button>
          </div>
        </div>

        {/* Nombre de la plantilla */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Plantilla <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editorData.name}
                onChange={(e) => setEditorData({ ...editorData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Ej: Etiqueta Camisetas"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editorData.isDefault}
                  onChange={(e) => setEditorData({ ...editorData, isDefault: e.target.checked })}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">Plantilla por defecto</span>
              </label>
            </div>
          </div>

          {/* Configuración de Impresión */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Configuración de Impresión</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Tipo de Hoja */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Hoja
                </label>
                <select
                  value={editorData.pageType}
                  onChange={(e) => {
                    const pageType = e.target.value;
                    setEditorData({ ...editorData, pageType });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="A4">A4 (21 × 29.7 cm)</option>
                  <option value="A3">A3 (29.7 × 42 cm)</option>
                  <option value="LETTER">Carta (21.6 × 27.9 cm)</option>
                  <option value="CUSTOM">Personalizado</option>
                </select>
              </div>

              {/* Ancho de Etiqueta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ancho Etiqueta (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="30"
                  value={(editorData.width / 28.35).toFixed(1)}
                  onChange={(e) => {
                    const cm = parseFloat(e.target.value) || 6;
                    setEditorData({ ...editorData, width: cm * 28.35 });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Alto de Etiqueta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alto Etiqueta (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="40"
                  value={(editorData.height / 28.35).toFixed(1)}
                  onChange={(e) => {
                    const cm = parseFloat(e.target.value) || 9;
                    setEditorData({ ...editorData, height: cm * 28.35 });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Margen de Página */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Margen Página (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={(editorData.pageMargin / 28.35).toFixed(1)}
                  onChange={(e) => {
                    const cm = parseFloat(e.target.value) || 1;
                    setEditorData({ ...editorData, pageMargin: cm * 28.35 });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Separación entre Etiquetas */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Separación entre Etiquetas (cm)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={(editorData.labelSpacing / 28.35).toFixed(1)}
                onChange={(e) => {
                  const cm = parseFloat(e.target.value) || 0.3;
                  setEditorData({ ...editorData, labelSpacing: cm * 28.35 });
                }}
                className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Espacio entre etiquetas en la hoja (recomendado: 0.3-0.4 cm)
              </p>
            </div>

            {/* Métricas de Aprovechamiento - Compacto */}
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-700">Aprovechamiento:</span>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="text-xs">
                    <span className="text-gray-600">Hoja:</span>
                    <span className="font-semibold text-gray-900 ml-1">{metrics.pageType} ({metrics.pageNameCm})</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-600">Grid:</span>
                    <span className="font-semibold text-blue-600 ml-1">{metrics.labelCols} × {metrics.labelRows}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-600">Etiquetas:</span>
                    <span className="font-bold text-green-600 ml-1 text-sm">{metrics.labelsPerPage}/hoja</span>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                    metrics.utilizationPercent >= 70 ? 'bg-green-100 text-green-700' :
                    metrics.utilizationPercent >= 60 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {metrics.utilizationPercent.toFixed(1)}% {
                      metrics.utilizationPercent >= 70 ? '✨' :
                      metrics.utilizationPercent >= 60 ? '✓' :
                      metrics.utilizationPercent >= 50 ? '⚠' : '❌'
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Recomendaciones de Tamaño - Dinámicas */}
            <div className="mt-4">
              <details className="group" open>
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between p-2 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-orange-600 group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">Recomendaciones de Tamaño para {editorData.pageType || 'A4'}</span>
                    </div>
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </summary>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {optimizedConfigs.map((config, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => applyOptimizedConfig(config)}
                      className="text-left p-3 rounded-lg border-2 transition-all hover:shadow-md"
                      style={{
                        backgroundColor: config.color === 'purple' ? '#faf5ff' :
                          config.color === 'green' ? '#f0fdf4' :
                          '#fffbeb',
                        borderColor: config.color === 'purple' ? '#d8b4fe' :
                          config.color === 'green' ? '#86efac' :
                          '#fcd34d',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          config.color === 'purple' ? '#f3e8ff' :
                          config.color === 'green' ? '#dcfce7' :
                          '#fef3c7';
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          config.color === 'purple' ? '#faf5ff' :
                          config.color === 'green' ? '#f0fdf4' :
                          '#fffbeb';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-2xl">{config.icon}</span>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-gray-900">{config.name}</div>
                          <div className="text-xs text-gray-600 mt-0.5">{config.widthCm} × {config.heightCm} cm</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex-1">
                          <div className="text-xs text-gray-500">Etiquetas/hoja</div>
                          <div className="text-lg font-bold text-gray-900">{config.metrics.total}</div>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-500">Aprovechamiento</div>
                          <div className={`text-lg font-bold ${
                            config.metrics.utilization >= 70 ? 'text-green-600' :
                            config.metrics.utilization >= 60 ? 'text-yellow-600' :
                            'text-orange-600'
                          }`}>
                            {config.metrics.utilization.toFixed(0)}%
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 border-t border-gray-200 pt-2">
                        <div className="font-medium text-gray-700 mb-1">{config.description}</div>
                        <div>{config.recommendation}</div>
                        <div className="mt-1 text-gray-400">Grid: {config.metrics.cols} × {config.metrics.rows}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </details>
            </div>
          </div>

          {/* Selector de tipos de producto */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipos de Producto (Opcional)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {productTypes.map((productType) => (
                <label
                  key={productType.id}
                  className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={editorData.productTypeIds.includes(productType.id)}
                    onChange={(e) => {
                      const newIds = e.target.checked
                        ? [...editorData.productTypeIds, productType.id]
                        : editorData.productTypeIds.filter(id => id !== productType.id);
                      setEditorData({ ...editorData, productTypeIds: newIds });
                    }}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">{productType.name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Si no seleccionas ninguno, la plantilla estará disponible para todos los tipos
            </p>
          </div>
        </div>

        {/* Editor Visual */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <LabelTemplateEditor
            backgroundImage={editorData.backgroundImage}
            width={editorData.width}
            height={editorData.height}
            zones={editorData.zones}
            onZonesChange={(zones) => setEditorData({ ...editorData, zones })}
            onBackgroundImageChange={(image) => setEditorData({ ...editorData, backgroundImage: image })}
          />
        </div>
      </div>

      {/* Modal - Previsualización del PDF */}
      {showPreviewModal && pdfPreviewUrl && (
        <Modal
          isOpen={showPreviewModal}
          onClose={handleClosePreview}
          title="Ejemplo de Etiquetas PDF"
          size="xl"
        >
          <div className="space-y-4">
            {/* Vista previa del PDF */}
            <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ height: '600px' }}>
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-full"
                title="PDF Preview"
              />
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={handleClosePreview}
              >
                Cerrar
              </Button>
              <Button
                variant="primary"
                onClick={handleDownloadPDF}
                icon={<Download size={18} />}
              >
                Descargar PDF
              </Button>
            </div>
          </div>
        </Modal>
      )}
      </>
    );
  }

  // Vista de Lista
  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando plantillas...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="w-8 h-8 text-orange-500" />
            Plantillas de Etiquetas
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Gestiona las plantillas para impresión de etiquetas de productos
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm md:text-base"
        >
          <Plus size={20} />
          Nueva Plantilla
        </button>
      </div>

      {/* Templates Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {templates.length === 0 ? (
          <div className="text-center py-12">
            <Tag size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay plantillas de etiquetas
            </h3>
            <p className="text-gray-600 mb-4">
              Crea tu primera plantilla para comenzar
            </p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Plus size={20} />
              Nueva Plantilla
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipos de Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dimensiones
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Configuración
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zonas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Imagen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Tag className="w-5 h-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {template.name}
                          </div>
                          {template.isDefault && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                              Por Defecto
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {template.productTypes && template.productTypes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {template.productTypes.slice(0, 3).map((pt) => (
                            <span
                              key={pt.id}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {pt.productType.name}
                            </span>
                          ))}
                          {template.productTypes.length > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                              +{template.productTypes.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Todos los tipos</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(template.width / 28.35).toFixed(1)} × {(template.height / 28.35).toFixed(1)} cm
                      <div className="text-xs text-gray-400">
                        ({template.width.toFixed(1)} × {template.height.toFixed(1)} pts)
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="space-y-1">
                        <div className="font-medium">{template.pageType || 'A4'}</div>
                        <div className="text-xs text-gray-400">
                          Margen: {((template.pageMargin || 30) / 28.35).toFixed(1)} cm
                        </div>
                        <div className="text-xs text-gray-400">
                          Espacio: {((template.labelSpacing || 10) / 28.35).toFixed(1)} cm
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {template.zones.length} zona{template.zones.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {template.backgroundImage ? (
                        <span className="text-green-600 font-medium">✓ Con imagen</span>
                      ) : (
                        <span className="text-gray-400">Fondo blanco</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        template.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {template.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(template)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDuplicate(template.id, template.name)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Duplicar"
                        >
                          <Copy size={18} />
                        </button>
                        {!template.isDefault && (
                          <button
                            onClick={() => handleDelete(template.id, template.name)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>

      {/* Modal - Previsualización del PDF */}
      {showPreviewModal && pdfPreviewUrl && (
        <Modal
          isOpen={showPreviewModal}
          onClose={handleClosePreview}
          title="Ejemplo de Etiquetas PDF"
          size="xl"
        >
          <div className="space-y-4">
            {/* Vista previa del PDF */}
            <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ height: '600px' }}>
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-full"
                title="PDF Preview"
              />
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={handleClosePreview}
              >
                Cerrar
              </Button>
              <Button
                variant="primary"
                onClick={handleDownloadPDF}
                icon={<Download size={18} />}
              >
                Descargar PDF
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
