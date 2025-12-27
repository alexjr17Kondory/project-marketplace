import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRightLeft,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  Plus,
  Loader2,
  Package,
  Boxes,
  X,
  Search,
} from 'lucide-react';
import { Button } from '../../components/shared/Button';
import { Modal } from '../../components/shared/Modal';
import { useToast } from '../../context/ToastContext';
import {
  inventoryConversionsService,
  type InventoryConversion,
  type ConversionInputItem,
  type ConversionOutputItem,
} from '../../services/inventory-conversions.service';
import { inputsService } from '../../services/inputs.service';
import { getVariants, type ProductVariant } from '../../services/variants.service';

// Labels y colores para estados
const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  CANCELLED: 'Cancelada',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

interface InputOption {
  id: number;
  code: string;
  name: string;
  currentStock: number;
  unitOfMeasure: string;
  unitCost: number;
}

export default function InventoryConversionDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const isCreating = id === 'new';

  const [conversion, setConversion] = useState<InventoryConversion | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Options for selectors
  const [inputOptions, setInputOptions] = useState<InputOption[]>([]);
  const [variantOptions, setVariantOptions] = useState<ProductVariant[]>([]);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showAddInputModal, setShowAddInputModal] = useState(false);
  const [showAddOutputModal, setShowAddOutputModal] = useState(false);

  // Add item forms
  const [inputSearch, setInputSearch] = useState('');
  const [outputSearch, setOutputSearch] = useState('');
  const [selectedInput, setSelectedInput] = useState<InputOption | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [inputQuantity, setInputQuantity] = useState<number>(1);
  const [outputQuantity, setOutputQuantity] = useState<number>(1);

  // Create form state
  const [formData, setFormData] = useState<{
    conversionDate: string;
    description: string;
    notes: string;
  }>({
    conversionDate: new Date().toISOString().split('T')[0],
    description: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load inputs and variants for selectors
      const [inputsData, variantsData] = await Promise.all([
        inputsService.getAll({}),
        getVariants(),
      ]);

      setInputOptions(
        inputsData.map((i) => ({
          id: i.id,
          code: i.code,
          name: i.name,
          currentStock: Number(i.currentStock),
          unitOfMeasure: i.unitOfMeasure,
          unitCost: Number(i.unitCost),
        }))
      );
      setVariantOptions(variantsData);

      if (!isCreating) {
        const conversionData = await inventoryConversionsService.getConversionById(Number(id));
        setConversion(conversionData);
      }
    } catch (error) {
      showToast('Error al cargar datos', 'error');
      navigate('/admin-panel/inventory-conversions');
    } finally {
      setLoading(false);
    }
  };

  // Create new conversion
  const handleCreate = async () => {
    try {
      setSaving(true);
      const newConversion = await inventoryConversionsService.createConversion({
        conversionDate: formData.conversionDate,
        description: formData.description || undefined,
        notes: formData.notes || undefined,
      });
      showToast('Conversión creada', 'success');
      navigate(`/admin-panel/inventory-conversions/${newConversion.id}`);
    } catch (error: any) {
      showToast(error.message || 'Error al crear conversión', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Add input item
  const handleAddInput = async () => {
    if (!conversion || !selectedInput) return;

    if (inputQuantity <= 0) {
      showToast('La cantidad debe ser mayor a 0', 'error');
      return;
    }

    if (inputQuantity > selectedInput.currentStock) {
      showToast(`Stock insuficiente. Disponible: ${selectedInput.currentStock}`, 'error');
      return;
    }

    try {
      setSaving(true);
      const updated = await inventoryConversionsService.addInputItem(conversion.id, {
        inputId: selectedInput.id,
        quantity: inputQuantity,
      });
      setConversion(updated);
      setShowAddInputModal(false);
      setSelectedInput(null);
      setInputQuantity(1);
      setInputSearch('');
      showToast('Insumo agregado', 'success');
    } catch (error: any) {
      showToast(error.message || 'Error al agregar insumo', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Remove input item
  const handleRemoveInput = async (itemId: number) => {
    if (!conversion) return;

    try {
      const updated = await inventoryConversionsService.removeInputItem(conversion.id, itemId);
      setConversion(updated);
      showToast('Insumo eliminado', 'success');
    } catch (error: any) {
      showToast(error.message || 'Error al eliminar', 'error');
    }
  };

  // Add output item
  const handleAddOutput = async () => {
    if (!conversion || !selectedVariant) return;

    if (outputQuantity <= 0) {
      showToast('La cantidad debe ser mayor a 0', 'error');
      return;
    }

    try {
      setSaving(true);
      const updated = await inventoryConversionsService.addOutputItem(conversion.id, {
        variantId: selectedVariant.id,
        quantity: outputQuantity,
      });
      setConversion(updated);
      setShowAddOutputModal(false);
      setSelectedVariant(null);
      setOutputQuantity(1);
      setOutputSearch('');
      showToast('Producto agregado', 'success');
    } catch (error: any) {
      showToast(error.message || 'Error al agregar producto', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Remove output item
  const handleRemoveOutput = async (itemId: number) => {
    if (!conversion) return;

    try {
      const updated = await inventoryConversionsService.removeOutputItem(conversion.id, itemId);
      setConversion(updated);
      showToast('Producto eliminado', 'success');
    } catch (error: any) {
      showToast(error.message || 'Error al eliminar', 'error');
    }
  };

  // Submit for approval
  const handleSubmit = async () => {
    if (!conversion) return;

    try {
      setSaving(true);
      const updated = await inventoryConversionsService.submitForApproval(conversion.id);
      setConversion(updated);
      showToast('Conversión enviada a aprobación', 'success');
    } catch (error: any) {
      showToast(error.message || 'Error al enviar', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Approve conversion
  const handleApprove = async () => {
    if (!conversion) return;

    try {
      setSaving(true);
      const updated = await inventoryConversionsService.approveConversion(conversion.id);
      setConversion(updated);
      setShowApproveModal(false);
      showToast('Conversión aprobada - Inventario actualizado', 'success');
    } catch (error: any) {
      showToast(error.message || 'Error al aprobar', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Cancel conversion
  const handleCancel = async () => {
    if (!conversion) return;

    try {
      setSaving(true);
      const updated = await inventoryConversionsService.cancelConversion(conversion.id);
      setConversion(updated);
      setShowCancelModal(false);
      showToast('Conversión cancelada', 'success');
    } catch (error: any) {
      showToast(error.message || 'Error al cancelar', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete conversion
  const handleDelete = async () => {
    if (!conversion) return;

    try {
      setSaving(true);
      await inventoryConversionsService.deleteConversion(conversion.id);
      showToast('Conversión eliminada', 'success');
      navigate('/admin-panel/inventory-conversions');
    } catch (error: any) {
      showToast(error.message || 'Error al eliminar', 'error');
    } finally {
      setSaving(false);
      setShowDeleteModal(false);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Filter inputs for selector
  const filteredInputs = inputOptions.filter((i) => {
    if (!inputSearch) return true;
    const term = inputSearch.toLowerCase();
    return (
      i.code.toLowerCase().includes(term) ||
      i.name.toLowerCase().includes(term)
    );
  });

  // Filter variants for selector
  const filteredVariants = variantOptions.filter((v) => {
    if (!outputSearch) return true;
    const term = outputSearch.toLowerCase();
    return (
      v.sku.toLowerCase().includes(term) ||
      v.productName.toLowerCase().includes(term) ||
      (v.colorName && v.colorName.toLowerCase().includes(term)) ||
      (v.sizeName && v.sizeName.toLowerCase().includes(term))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  // Create form
  if (isCreating) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin-panel/inventory-conversions')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nueva Conversión</h1>
            <p className="text-sm text-gray-500">
              Configura la conversión de insumos a productos
            </p>
          </div>
        </div>

        {/* Create Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Conversión
              </label>
              <input
                type="date"
                value={formData.conversionDate}
                onChange={(e) =>
                  setFormData({ ...formData, conversionDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción (opcional)
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Ej: Sublimación de camisetas para pedido #123"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas (opcional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                placeholder="Notas adicionales..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="admin-outline"
                onClick={() => navigate('/admin-panel/inventory-conversions')}
              >
                Cancelar
              </Button>
              <Button
                variant="admin-orange"
                onClick={handleCreate}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Crear Conversión
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Detail view
  if (!conversion) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Conversión no encontrada</p>
      </div>
    );
  }

  const isEditable = conversion.status === 'DRAFT';
  const canSubmit = isEditable && conversion.inputItems.length > 0 && conversion.outputItems.length > 0;
  const canApprove = conversion.status === 'PENDING';
  const canCancel = conversion.status !== 'APPROVED' && conversion.status !== 'CANCELLED';
  const canDelete = conversion.status === 'DRAFT' || conversion.status === 'CANCELLED';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin-panel/inventory-conversions')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {conversion.conversionNumber}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  STATUS_COLORS[conversion.status]
                }`}
              >
                {STATUS_LABELS[conversion.status]}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {conversion.description || 'Sin descripción'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {canSubmit && (
            <Button variant="admin-orange" onClick={handleSubmit} disabled={saving}>
              <Send className="w-4 h-4" />
              Enviar a Aprobación
            </Button>
          )}
          {canApprove && (
            <Button
              variant="admin-orange"
              onClick={() => setShowApproveModal(true)}
              disabled={saving}
            >
              <CheckCircle className="w-4 h-4" />
              Aprobar
            </Button>
          )}
          {canCancel && (
            <Button
              variant="admin-outline"
              onClick={() => setShowCancelModal(true)}
              disabled={saving}
            >
              <XCircle className="w-4 h-4" />
              Cancelar
            </Button>
          )}
          {canDelete && (
            <Button
              variant="admin-outline"
              onClick={() => setShowDeleteModal(true)}
              disabled={saving}
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Fecha</p>
          <p className="text-lg font-medium">
            {new Date(conversion.conversionDate).toLocaleDateString()}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Insumos</p>
          <p className="text-lg font-medium text-orange-600">
            {conversion.inputItems.length} items
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Productos</p>
          <p className="text-lg font-medium text-blue-600">
            {conversion.outputItems.length} items
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Costo Total</p>
          <p className="text-lg font-medium text-green-600">
            {formatCurrency(conversion.totalInputCost)}
          </p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Items (Insumos a consumir) */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-orange-50 border-b border-orange-100">
            <div className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-orange-600" />
              <h2 className="font-semibold text-gray-900">Insumos a Consumir</h2>
            </div>
            {isEditable && (
              <Button
                variant="admin-outline"
                size="sm"
                onClick={() => setShowAddInputModal(true)}
              >
                <Plus className="w-4 h-4" />
                Agregar
              </Button>
            )}
          </div>

          <div className="divide-y divide-gray-100">
            {conversion.inputItems.length === 0 ? (
              <div className="p-8 text-center">
                <Boxes className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  No hay insumos agregados
                </p>
              </div>
            ) : (
              conversion.inputItems.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{item.inputName}</p>
                    <p className="text-sm text-gray-500">
                      {item.inputCode} • {item.quantity} {item.unitOfMeasure}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-orange-600">
                      {formatCurrency(item.totalCost)}
                    </p>
                    {isEditable && (
                      <button
                        onClick={() => handleRemoveInput(item.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {conversion.inputItems.length > 0 && (
            <div className="px-4 py-3 bg-orange-50 border-t border-orange-100 flex justify-between">
              <span className="font-medium text-gray-700">Total Insumos</span>
              <span className="font-bold text-orange-600">
                {formatCurrency(conversion.totalInputCost)}
              </span>
            </div>
          )}
        </div>

        {/* Output Items (Productos a generar) */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-900">Productos a Generar</h2>
            </div>
            {isEditable && (
              <Button
                variant="admin-outline"
                size="sm"
                onClick={() => setShowAddOutputModal(true)}
              >
                <Plus className="w-4 h-4" />
                Agregar
              </Button>
            )}
          </div>

          <div className="divide-y divide-gray-100">
            {conversion.outputItems.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  No hay productos agregados
                </p>
              </div>
            ) : (
              conversion.outputItems.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    <p className="text-sm text-gray-500">
                      {item.variantSku}
                      {item.colorName && ` • ${item.colorName}`}
                      {item.sizeName && ` • ${item.sizeName}`}
                      {` • ${item.quantity} unid.`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-blue-600">
                      {formatCurrency(item.totalValue)}
                    </p>
                    {isEditable && (
                      <button
                        onClick={() => handleRemoveOutput(item.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {conversion.outputItems.length > 0 && (
            <div className="px-4 py-3 bg-blue-50 border-t border-blue-100 flex justify-between">
              <span className="font-medium text-gray-700">Valor Total</span>
              <span className="font-bold text-blue-600">
                {formatCurrency(conversion.totalOutputCost)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {conversion.notes && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-2">Notas</h3>
          <p className="text-sm text-gray-600">{conversion.notes}</p>
        </div>
      )}

      {/* Add Input Modal */}
      <Modal
        isOpen={showAddInputModal}
        onClose={() => {
          setShowAddInputModal(false);
          setSelectedInput(null);
          setInputSearch('');
          setInputQuantity(1);
        }}
        title="Agregar Insumo"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar Insumo
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={inputSearch}
                onChange={(e) => setInputSearch(e.target.value)}
                placeholder="Buscar por código o nombre..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
            {filteredInputs.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 text-center">
                No se encontraron insumos
              </p>
            ) : (
              filteredInputs.map((input) => (
                <button
                  key={input.id}
                  onClick={() => setSelectedInput(input)}
                  className={`w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                    selectedInput?.id === input.id ? 'bg-orange-50' : ''
                  }`}
                >
                  <p className="font-medium text-gray-900">{input.name}</p>
                  <p className="text-sm text-gray-500">
                    {input.code} • Stock: {input.currentStock} {input.unitOfMeasure} •{' '}
                    {formatCurrency(input.unitCost)}/{input.unitOfMeasure}
                  </p>
                </button>
              ))
            )}
          </div>

          {selectedInput && (
            <div className="p-3 bg-orange-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900 mb-2">
                Seleccionado: {selectedInput.name}
              </p>
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600">Cantidad:</label>
                <input
                  type="number"
                  value={inputQuantity}
                  onChange={(e) => setInputQuantity(Number(e.target.value))}
                  min={0.01}
                  max={selectedInput.currentStock}
                  step={0.01}
                  className="w-24 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-500">
                  {selectedInput.unitOfMeasure} (máx: {selectedInput.currentStock})
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="admin-outline"
              onClick={() => {
                setShowAddInputModal(false);
                setSelectedInput(null);
                setInputSearch('');
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="admin-orange"
              onClick={handleAddInput}
              disabled={!selectedInput || inputQuantity <= 0 || saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Agregar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Output Modal */}
      <Modal
        isOpen={showAddOutputModal}
        onClose={() => {
          setShowAddOutputModal(false);
          setSelectedVariant(null);
          setOutputSearch('');
          setOutputQuantity(1);
        }}
        title="Agregar Producto"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar Producto/Variante
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={outputSearch}
                onChange={(e) => setOutputSearch(e.target.value)}
                placeholder="Buscar por SKU, nombre, color o talla..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
            {filteredVariants.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 text-center">
                No se encontraron variantes
              </p>
            ) : (
              filteredVariants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariant(variant)}
                  className={`w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                    selectedVariant?.id === variant.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <p className="font-medium text-gray-900">{variant.productName}</p>
                  <p className="text-sm text-gray-500">
                    {variant.sku}
                    {variant.colorName && ` • ${variant.colorName}`}
                    {variant.sizeName && ` • ${variant.sizeName}`}
                    {` • Stock: ${variant.stock}`}
                  </p>
                </button>
              ))
            )}
          </div>

          {selectedVariant && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900 mb-2">
                Seleccionado: {selectedVariant.productName} ({selectedVariant.sku})
              </p>
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600">Cantidad:</label>
                <input
                  type="number"
                  value={outputQuantity}
                  onChange={(e) => setOutputQuantity(Number(e.target.value))}
                  min={1}
                  className="w-24 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-500">unidades</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="admin-outline"
              onClick={() => {
                setShowAddOutputModal(false);
                setSelectedVariant(null);
                setOutputSearch('');
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="admin-orange"
              onClick={handleAddOutput}
              disabled={!selectedVariant || outputQuantity <= 0 || saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Agregar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Approve Modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="Aprobar Conversión"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            ¿Confirmas aprobar esta conversión? Se aplicarán los siguientes cambios:
          </p>
          <div className="space-y-2 p-3 bg-gray-50 rounded-lg text-sm">
            <div className="flex items-center gap-2 text-orange-600">
              <Boxes className="w-4 h-4" />
              <span>
                Se descontarán {conversion.inputItems.length} insumos del inventario
              </span>
            </div>
            <div className="flex items-center gap-2 text-blue-600">
              <Package className="w-4 h-4" />
              <span>
                Se agregarán {conversion.outputItems.reduce((sum, i) => sum + i.quantity, 0)} unidades al stock de productos
              </span>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="admin-outline" onClick={() => setShowApproveModal(false)}>
              Cancelar
            </Button>
            <Button variant="admin-orange" onClick={handleApprove} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aprobar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancelar Conversión"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            ¿Estás seguro de cancelar esta conversión? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="admin-outline" onClick={() => setShowCancelModal(false)}>
              Volver
            </Button>
            <Button
              variant="admin-outline"
              className="!text-red-600 !border-red-300 hover:!bg-red-50"
              onClick={handleCancel}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancelar Conversión'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Conversión"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            ¿Estás seguro de eliminar esta conversión? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="admin-outline" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="admin-outline"
              className="!text-red-600 !border-red-300 hover:!bg-red-50"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Eliminar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
