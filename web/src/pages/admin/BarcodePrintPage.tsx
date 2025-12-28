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

      // Seleccionar plantilla por defecto (siempre debe haber una)
      const defaultTemplate = activeTemplates.find(t => t.isDefault);
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate.id);
      } else if (activeTemplates.length > 0) {
        // Si no hay plantilla por defecto, usar la primera
        setSelectedTemplate(activeTemplates[0].id);
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
        selectedTemplate! // Siempre debe haber una plantilla seleccionada
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
              {labelTemplates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                  {template.isDefault && ' (Por defecto)'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Variants Matrix */}
      {(() => {
        // Extraer colores y tallas únicos
        const colors = new Map<string, { name: string; hexCode: string }>();
        const sizes = new Map<string, string>();

        variants.forEach((variant) => {
          if (variant.color) {
            colors.set(variant.color.name, {
              name: variant.color.name,
              hexCode: variant.color.hexCode,
            });
          }
          if (variant.size) {
            sizes.set(variant.size.abbreviation, variant.size.abbreviation);
          }
        });

        const colorsArr = Array.from(colors.values());
        const sizesArr = Array.from(sizes.keys());

        // Función para encontrar variante por color y talla
        const findVariant = (colorName: string, sizeName: string) => {
          return variants.find(
            (v) =>
              v.color?.name === colorName &&
              v.size?.abbreviation === sizeName
          );
        };

        // Calcular totales
        const totalLabels = variants.reduce((sum, v) => sum + v.quantity, 0);

        return (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Printer className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">{productName}</span>
                  <span className="text-sm text-gray-500">
                    {variants.length} variantes
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Total de etiquetas</div>
                  <div className="text-2xl font-bold text-blue-600">{totalLabels}</div>
                </div>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-left text-xs font-semibold text-gray-700 bg-gray-100 sticky left-0 border-b-2 border-gray-300">
                      Color / Talla
                    </th>
                    {sizesArr.map((size) => (
                      <th
                        key={size}
                        className="p-3 text-center text-xs font-semibold text-gray-700 bg-gray-100 min-w-[120px] border-b-2 border-gray-300"
                      >
                        {size}
                      </th>
                    ))}
                    <th className="p-3 text-center text-xs font-semibold text-gray-700 bg-gray-100 min-w-[80px] border-b-2 border-gray-300">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {colorsArr.map((color, colorIdx) => {
                    // Calcular total de fila
                    const rowTotal = sizesArr.reduce((sum, size) => {
                      const variant = findVariant(color.name, size);
                      return sum + (variant ? variant.quantity : 0);
                    }, 0);

                    return (
                      <tr
                        key={color.name}
                        className={colorIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                      >
                        <td className="p-3 border-b border-gray-200 sticky left-0 bg-inherit">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0"
                              style={{ backgroundColor: color.hexCode }}
                            />
                            <span className="font-medium text-gray-800">{color.name}</span>
                          </div>
                        </td>
                        {sizesArr.map((size) => {
                          const variant = findVariant(color.name, size);
                          if (!variant) {
                            return (
                              <td
                                key={size}
                                className="p-2 text-center border-b border-gray-200"
                              >
                                <span className="text-gray-300 text-lg">—</span>
                              </td>
                            );
                          }

                          return (
                            <td
                              key={size}
                              className={`p-2 border-b border-gray-200 ${
                                variant.quantity > 0 ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="flex flex-col items-center gap-2">
                                {/* Controles de cantidad */}
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() =>
                                      updateQuantity(variant.id, variant.quantity - 1)
                                    }
                                    className="p-1 text-white bg-gray-500 hover:bg-gray-600 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    disabled={variant.quantity === 0}
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <input
                                    type="number"
                                    value={variant.quantity}
                                    onChange={(e) =>
                                      updateQuantity(
                                        variant.id,
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    className="w-14 px-2 py-1 text-center text-sm font-bold border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    min="0"
                                  />
                                  <button
                                    onClick={() =>
                                      updateQuantity(variant.id, variant.quantity + 1)
                                    }
                                    className="p-1 text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>

                                {/* Info adicional */}
                                <div className="text-xs text-gray-500 space-y-0.5">
                                  <div className="font-mono text-gray-900">
                                    {variant.barcode || 'Sin código'}
                                  </div>
                                  <div>Stock: {variant.stock}</div>
                                  <div className="font-semibold text-gray-700">
                                    ${variant.finalPrice.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                  </div>
                                </div>
                              </div>
                            </td>
                          );
                        })}
                        <td className="p-3 border-b border-gray-200 bg-gray-50 text-center">
                          <div className="font-bold text-gray-800 text-base">
                            {rowTotal}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100">
                    <td className="p-3 font-semibold text-gray-700 sticky left-0 bg-gray-100 border-t-2 border-gray-300">
                      Total por talla
                    </td>
                    {sizesArr.map((size) => {
                      const colTotal = colorsArr.reduce((sum, color) => {
                        const variant = findVariant(color.name, size);
                        return sum + (variant ? variant.quantity : 0);
                      }, 0);
                      return (
                        <td
                          key={size}
                          className="p-3 text-center font-bold text-gray-800 border-t-2 border-gray-300"
                        >
                          {colTotal}
                        </td>
                      );
                    })}
                    <td className="p-3 text-center font-bold text-blue-600 bg-gray-200 border-t-2 border-gray-300 text-lg">
                      {totalLabels}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      })()}

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
