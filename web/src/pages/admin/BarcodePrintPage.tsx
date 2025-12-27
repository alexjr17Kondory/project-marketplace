import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Plus, Minus, Download, X } from 'lucide-react';
import * as variantsService from '../../services/variants.service';
import * as barcodeService from '../../services/barcode.service';
import { getLabelTemplates } from '../../services/label-templates.service';
import type { ProductVariant } from '../../services/variants.service';
import type { LabelTemplate } from '../../types/label-template';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/shared/Modal';
import { Button } from '../../components/shared/Button';

interface VariantPrintItem extends ProductVariant {
  quantity: number;
}

export default function BarcodePrintPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [variants, setVariants] = useState<VariantPrintItem[]>([]);
  const [labelTemplates, setLabelTemplates] = useState<LabelTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    if (productId) {
      loadVariants();
    }
  }, [productId]);

  const loadVariants = async () => {
    try {
      setLoading(true);

      // Cargar variantes y plantillas en paralelo
      const [variantsData, templatesData] = await Promise.all([
        variantsService.getVariants({ productId: parseInt(productId!) }),
        getLabelTemplates(false)
      ]);

      // Inicializar cantidad en 1 para cada variante
      setVariants(variantsData.map(v => ({ ...v, quantity: 1 })));

      // Filtrar plantillas activas
      const activeTemplates = templatesData.filter(t => t.isActive);
      setLabelTemplates(activeTemplates);

      // Seleccionar plantilla por defecto si existe
      const defaultTemplate = activeTemplates.find(t => t.isDefault);
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate.id);
      }
    } catch (error: any) {
      showToast('Error al cargar variantes: ' + (error.response?.data?.message || error.message), 'error');
      navigate('/admin-panel/products');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (variantId: number, newQuantity: number) => {
    if (newQuantity < 0) return;

    setVariants(prev =>
      prev.map(v => (v.id === variantId ? { ...v, quantity: newQuantity } : v))
    );
  };

  const setAllQuantities = (quantity: number) => {
    if (quantity < 0) return;
    setVariants(prev => prev.map(v => ({ ...v, quantity })));
  };

  const setQuantitiesToStock = () => {
    setVariants(prev => prev.map(v => ({ ...v, quantity: v.stock })));
  };

  const handlePrint = async () => {
    const itemsToPrint = variants.filter(v => v.quantity > 0);

    if (itemsToPrint.length === 0) {
      showToast('Selecciona al menos una variante para imprimir', 'error');
      return;
    }

    try {
      setPrinting(true);

      // Preparar datos para el backend
      const printData = itemsToPrint.map(v => ({
        variantId: v.id,
        quantity: v.quantity,
      }));

      // Llamar al servicio para generar las etiquetas con la plantilla seleccionada
      const pdfBlob = await barcodeService.generateBarcodeLabels(
        printData,
        selectedTemplate || undefined
      );

      // Crear URL del blob para previsualización
      const url = window.URL.createObjectURL(pdfBlob);
      setPdfPreviewUrl(url);
      setShowPreviewModal(true);

      showToast('Etiquetas generadas exitosamente', 'success');
    } catch (error: any) {
      console.error('Error generating labels:', error);
      showToast('Error al generar etiquetas: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setPrinting(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!pdfPreviewUrl) return;

    const link = document.createElement('a');
    link.href = pdfPreviewUrl;
    link.download = `etiquetas-${variants[0]?.product.name || 'producto'}.pdf`;
    link.click();
    showToast('PDF descargado exitosamente', 'success');
  };

  const handleClosePreview = () => {
    if (pdfPreviewUrl) {
      window.URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(null);
    }
    setShowPreviewModal(false);
  };

  const getTotalLabels = () => {
    return variants.reduce((sum, v) => sum + v.quantity, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando variantes...</div>
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <div className="p-4 md:p-8">
        <button
          onClick={() => navigate('/admin-panel/products')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver a Productos
        </button>

        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Printer className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay variantes para este producto
          </h3>
          <p className="text-gray-600">
            Primero debes generar las variantes para poder imprimir códigos de barras.
          </p>
        </div>
      </div>
    );
  }

  const productName = variants[0]?.product.name;

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin-panel/products')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver a Productos
        </button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Generar Etiquetas de Códigos de Barras</h1>
            <p className="text-gray-600 mt-1">{productName}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              disabled={printing || getTotalLabels() === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {printing ? (
                <>Generando...</>
              ) : (
                <>
                  <Printer className="w-5 h-5" />
                  Generar Vista Previa ({getTotalLabels()} etiquetas)
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-blue-900">Acciones rápidas:</span>
          <button
            onClick={() => setAllQuantities(1)}
            className="text-sm px-3 py-1 bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50"
          >
            Todas: 1
          </button>
          <button
            onClick={() => setAllQuantities(5)}
            className="text-sm px-3 py-1 bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50"
          >
            Todas: 5
          </button>
          <button
            onClick={() => setAllQuantities(10)}
            className="text-sm px-3 py-1 bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50"
          >
            Todas: 10
          </button>
          <button
            onClick={setQuantitiesToStock}
            className="text-sm px-3 py-1 bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50"
          >
            Total: Stock actual
          </button>
          <button
            onClick={() => setAllQuantities(0)}
            className="text-sm px-3 py-1 bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50"
          >
            Limpiar todo
          </button>
        </div>
      </div>

      {/* Template Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-shrink-0">
            <label className="text-sm font-medium text-gray-900">
              Plantilla de Etiqueta:
            </label>
          </div>
          <div className="flex-1">
            <select
              value={selectedTemplate || ''}
              onChange={(e) => setSelectedTemplate(e.target.value ? Number(e.target.value) : null)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Plantilla estándar (por defecto)</option>
              {labelTemplates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                  {template.isDefault && ' ★'}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-600">
            {selectedTemplate
              ? 'Se usará diseño personalizado'
              : 'Se usará diseño estándar'}
          </div>
        </div>
        {labelTemplates.length === 0 && (
          <p className="text-sm text-amber-600 mt-2">
            ℹ️ No hay plantillas personalizadas. Ve a Configuración → Plantillas de Etiquetas para crear una.
          </p>
        )}
      </div>

      {/* Variants Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Color
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Talla
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código de Barras
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad de Etiquetas
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {variants.map((variant) => (
                <tr key={variant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-mono text-sm text-gray-900">{variant.sku}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {variant.color ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full border border-gray-300"
                          style={{ backgroundColor: variant.color.hexCode }}
                        />
                        <span className="text-sm text-gray-900">{variant.color.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {variant.size ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {variant.size.abbreviation}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-mono text-sm text-gray-900">
                      {variant.barcode || (
                        <span className="text-gray-400">Sin código</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{variant.stock}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      ${variant.finalPrice.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => updateQuantity(variant.id, variant.quantity - 1)}
                        className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                        disabled={variant.quantity === 0}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        value={variant.quantity}
                        onChange={(e) => updateQuantity(variant.id, parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                      />
                      <button
                        onClick={() => updateQuantity(variant.id, variant.quantity + 1)}
                        className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">Total de Etiquetas a Generar</p>
            <p className="text-3xl font-bold text-blue-900">{getTotalLabels()}</p>
          </div>
          <div className="p-4 bg-white rounded-full">
            <Printer className="w-12 h-12 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Modal - Previsualización del PDF */}
      {showPreviewModal && pdfPreviewUrl && (
        <Modal
          isOpen={showPreviewModal}
          onClose={handleClosePreview}
          title="Previsualización de Etiquetas"
          size="xl"
        >
          <div className="space-y-4">
            {/* PDF Viewer */}
            <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-100" style={{ height: '70vh' }}>
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-full"
                title="Vista previa del PDF"
              />
            </div>

            {/* Footer con botones */}
            <div className="flex justify-between items-center pt-4 border-t">
              <p className="text-sm text-gray-600">
                {getTotalLabels()} etiquetas - {variants[0]?.product.name}
              </p>
              <div className="flex gap-2">
                <Button variant="admin-secondary" onClick={handleClosePreview}>
                  <X className="w-4 h-4 mr-2" />
                  Cerrar
                </Button>
                <Button variant="admin-primary" onClick={handleDownloadPdf}>
                  <Download className="w-4 h-4 mr-2" />
                  Descargar PDF
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
