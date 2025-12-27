import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardCheck,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  Plus,
  Loader2,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { Button } from '../../components/shared/Button';
import { Modal } from '../../components/shared/Modal';
import { useToast } from '../../context/ToastContext';
import * as inventoryCountsService from '../../services/inventory-counts.service';
import { inputsService } from '../../services/inputs.service';
import type {
  InventoryCount,
  InventoryCountItem,
  InventoryCountType,
} from '../../services/inventory-counts.service';

export default function InventoryCountDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const isCreating = id === 'new';

  const [count, setCount] = useState<InventoryCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inputs, setInputs] = useState<Array<{ id: number; code: string; name: string }>>([]);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Create form state
  const [formData, setFormData] = useState<{
    countType: InventoryCountType;
    countDate: string;
    notes: string;
    selectedInputIds: number[];
  }>({
    countType: 'FULL',
    countDate: new Date().toISOString().split('T')[0],
    notes: '',
    selectedInputIds: [],
  });

  // Count items state for editing
  const [countItems, setCountItems] = useState<Record<number, { countedQuantity: number; notes: string }>>({});

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (isCreating) {
        // Load inputs for partial count selection
        const inputsData = await inputsService.getAll({});
        setInputs(inputsData.map(i => ({ id: i.id, code: i.code, name: i.name })));
      } else {
        const countData = await inventoryCountsService.getInventoryCountById(Number(id));
        setCount(countData);

        // Initialize count items state
        const items: Record<number, { countedQuantity: number; notes: string }> = {};
        countData.items.forEach(item => {
          items[item.id] = {
            countedQuantity: item.countedQuantity ?? item.systemQuantity,
            notes: item.notes || '',
          };
        });
        setCountItems(items);
      }
    } catch (error) {
      showToast('Error al cargar datos', 'error');
      navigate('/admin-panel/inventory-counts');
    } finally {
      setLoading(false);
    }
  };

  // Create new count
  const handleCreate = async () => {
    if (formData.countType === 'PARTIAL' && formData.selectedInputIds.length === 0) {
      showToast('Selecciona al menos un insumo para el conteo parcial', 'error');
      return;
    }

    try {
      setSaving(true);
      const newCount = await inventoryCountsService.createInventoryCount({
        countType: formData.countType,
        countDate: formData.countDate,
        notes: formData.notes || undefined,
        inputIds: formData.countType === 'PARTIAL' ? formData.selectedInputIds : undefined,
      });
      showToast('Conteo de inventario creado', 'success');
      navigate(`/admin-panel/inventory-counts/${newCount.id}`);
    } catch (error: any) {
      showToast(error.message || 'Error al crear conteo', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Update item count
  const handleUpdateItem = async (itemId: number) => {
    if (!count) return;

    const itemData = countItems[itemId];
    if (itemData === undefined) return;

    try {
      await inventoryCountsService.updateItemCount(count.id, itemId, {
        countedQuantity: itemData.countedQuantity,
        notes: itemData.notes || undefined,
      });
      showToast('Cantidad actualizada', 'success');
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Error al actualizar', 'error');
    }
  };

  // Submit for approval
  const handleSubmit = async () => {
    if (!count) return;

    try {
      setSaving(true);
      await inventoryCountsService.submitForApproval(count.id);
      showToast('Conteo enviado a aprobación', 'success');
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Error al enviar', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Approve count
  const handleApprove = async () => {
    if (!count) return;

    try {
      setSaving(true);
      await inventoryCountsService.approveCount(count.id);
      showToast('Conteo aprobado y ajustes aplicados', 'success');
      setShowApproveModal(false);
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Error al aprobar', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Cancel count
  const handleCancel = async () => {
    if (!count) return;

    try {
      setSaving(true);
      await inventoryCountsService.cancelCount(count.id);
      showToast('Conteo cancelado', 'success');
      setShowCancelModal(false);
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Error al cancelar', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete count
  const handleDelete = async () => {
    if (!count) return;

    try {
      setSaving(true);
      await inventoryCountsService.deleteInventoryCount(count.id);
      showToast('Conteo eliminado', 'success');
      navigate('/admin-panel/inventory-counts');
    } catch (error: any) {
      showToast(error.message || 'Error al eliminar', 'error');
    } finally {
      setSaving(false);
      setShowDeleteModal(false);
    }
  };

  // Toggle input selection for partial count
  const toggleInputSelection = (inputId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedInputIds: prev.selectedInputIds.includes(inputId)
        ? prev.selectedInputIds.filter(id => id !== inputId)
        : [...prev.selectedInputIds, inputId],
    }));
  };

  // Calculate statistics
  const getCountStats = () => {
    if (!count) return null;

    const countedItems = count.items.filter(i => i.isCounted);
    const itemsWithPositiveDiff = count.items.filter(i => i.difference !== null && i.difference > 0);
    const itemsWithNegativeDiff = count.items.filter(i => i.difference !== null && i.difference < 0);
    const totalPositiveValue = itemsWithPositiveDiff.reduce((sum, i) => sum + (i.differenceValue || 0), 0);
    const totalNegativeValue = itemsWithNegativeDiff.reduce((sum, i) => sum + Math.abs(i.differenceValue || 0), 0);

    return {
      total: count.items.length,
      counted: countedItems.length,
      pending: count.items.length - countedItems.length,
      progress: count.items.length > 0 ? Math.round((countedItems.length / count.items.length) * 100) : 0,
      positive: itemsWithPositiveDiff.length,
      negative: itemsWithNegativeDiff.length,
      totalPositiveValue,
      totalNegativeValue,
    };
  };

  const stats = getCountStats();
  const canEdit = count && (count.status === 'DRAFT' || count.status === 'IN_PROGRESS');

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
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/admin-panel/inventory-counts')}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nuevo Conteo de Inventario</h1>
            <p className="text-gray-600 text-sm">Crea un nuevo conteo físico de insumos</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl">
          <div className="space-y-6">
            {/* Count Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Conteo
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, countType: 'FULL', selectedInputIds: [] })}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    formData.countType === 'FULL'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-gray-900">Conteo Completo</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Cuenta todos los insumos activos del inventario
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, countType: 'PARTIAL' })}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    formData.countType === 'PARTIAL'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-gray-900">Conteo Parcial</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Selecciona insumos específicos para contar
                  </p>
                </button>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha del Conteo
              </label>
              <input
                type="date"
                value={formData.countDate}
                onChange={(e) => setFormData({ ...formData, countDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas (opcional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 resize-none"
                placeholder="Notas adicionales sobre este conteo..."
              />
            </div>

            {/* Input Selection for Partial */}
            {formData.countType === 'PARTIAL' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insumos a Contar ({formData.selectedInputIds.length} seleccionados)
                </label>
                <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                  {inputs.length === 0 ? (
                    <p className="p-4 text-center text-gray-500">No hay insumos disponibles</p>
                  ) : (
                    inputs.map((input) => (
                      <label
                        key={input.id}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                      >
                        <input
                          type="checkbox"
                          checked={formData.selectedInputIds.includes(input.id)}
                          onChange={() => toggleInputSelection(input.id)}
                          className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{input.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{input.code}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="admin-secondary"
                onClick={() => navigate('/admin-panel/inventory-counts')}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="admin-primary"
                onClick={handleCreate}
                disabled={saving}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Conteo
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
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin-panel/inventory-counts')}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{count?.countNumber}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  inventoryCountsService.STATUS_COLORS[count?.status || 'DRAFT']
                }`}
              >
                {inventoryCountsService.STATUS_LABELS[count?.status || 'DRAFT']}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                count?.countType === 'FULL'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {inventoryCountsService.TYPE_LABELS[count?.countType || 'FULL']}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {count?.status === 'IN_PROGRESS' && stats?.pending === 0 && (
            <Button variant="admin-secondary" size="sm" onClick={handleSubmit} disabled={saving}>
              <Send className="w-4 h-4" />
              Enviar a Aprobación
            </Button>
          )}
          {count?.status === 'PENDING_APPROVAL' && (
            <Button variant="admin-primary" size="sm" onClick={() => setShowApproveModal(true)} disabled={saving}>
              <CheckCircle className="w-4 h-4" />
              Aprobar
            </Button>
          )}
          {count && !['APPROVED', 'CANCELLED'].includes(count.status) && (
            <Button variant="admin-secondary" size="sm" onClick={() => setShowCancelModal(true)} disabled={saving}>
              <XCircle className="w-4 h-4" />
              Cancelar
            </Button>
          )}
          {count && ['DRAFT', 'CANCELLED'].includes(count.status) && (
            <Button variant="admin-danger" size="sm" onClick={() => setShowDeleteModal(true)} disabled={saving}>
              <Trash2 className="w-4 h-4" />
              Eliminar
            </Button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Progreso</p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-2xl font-bold text-gray-900">{stats.progress}%</p>
              <p className="text-sm text-gray-500 mb-1">{stats.counted}/{stats.total}</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div
                className="bg-orange-500 h-1.5 rounded-full transition-all"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
              Sobrantes
            </p>
            <p className="text-2xl font-bold text-green-600">{stats.positive}</p>
            <p className="text-xs text-gray-500">+${stats.totalPositiveValue.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              Faltantes
            </p>
            <p className="text-2xl font-bold text-red-600">{stats.negative}</p>
            <p className="text-xs text-gray-500">-${stats.totalNegativeValue.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Insumo</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600 w-24">Sistema</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600 w-32">Contado</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600 w-24">Diferencia</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 w-28">Valor Dif.</th>
                {canEdit && <th className="px-4 py-3 w-24"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {count?.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No hay items en este conteo</p>
                  </td>
                </tr>
              ) : (
                count?.items.map((item) => {
                  const itemState = countItems[item.id];
                  const currentCountedQty = itemState?.countedQuantity ?? item.systemQuantity;
                  const tempDifference = currentCountedQty - item.systemQuantity;

                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 ${!item.isCounted && canEdit ? 'bg-yellow-50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          {/* Status indicator */}
                          <div className={`w-1.5 h-10 rounded-full ${
                            item.isCounted
                              ? item.difference === 0
                                ? 'bg-green-500'
                                : item.difference! > 0
                                ? 'bg-blue-500'
                                : 'bg-red-500'
                              : 'bg-yellow-400'
                          }`} />
                          <div>
                            <p className="font-medium text-gray-900">{item.inputName}</p>
                            <p className="text-xs text-gray-500 font-mono">{item.inputCode}</p>
                            <p className="text-xs text-gray-400">{item.unitOfMeasure}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-mono text-gray-700">{item.systemQuantity}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {canEdit ? (
                          <input
                            type="number"
                            value={currentCountedQty}
                            onChange={(e) => {
                              setCountItems({
                                ...countItems,
                                [item.id]: {
                                  ...countItems[item.id],
                                  countedQuantity: Number(e.target.value),
                                },
                              });
                            }}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-center font-mono"
                            min="0"
                            step="0.01"
                          />
                        ) : (
                          <span className={`font-mono ${item.isCounted ? 'text-gray-900' : 'text-gray-400'}`}>
                            {item.countedQuantity ?? '-'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {canEdit ? (
                          <span className={`inline-flex items-center gap-1 font-mono text-sm ${
                            tempDifference === 0
                              ? 'text-gray-500'
                              : tempDifference > 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {tempDifference === 0 ? (
                              <Minus className="w-3.5 h-3.5" />
                            ) : tempDifference > 0 ? (
                              <TrendingUp className="w-3.5 h-3.5" />
                            ) : (
                              <TrendingDown className="w-3.5 h-3.5" />
                            )}
                            {tempDifference > 0 ? '+' : ''}{tempDifference}
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 font-mono text-sm ${
                            item.difference === null
                              ? 'text-gray-400'
                              : item.difference === 0
                              ? 'text-gray-500'
                              : item.difference > 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {item.difference === null ? (
                              '-'
                            ) : item.difference === 0 ? (
                              <><Minus className="w-3.5 h-3.5" />0</>
                            ) : item.difference > 0 ? (
                              <><TrendingUp className="w-3.5 h-3.5" />+{item.difference}</>
                            ) : (
                              <><TrendingDown className="w-3.5 h-3.5" />{item.difference}</>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canEdit ? (
                          <span className={`font-mono text-sm ${
                            tempDifference === 0
                              ? 'text-gray-500'
                              : tempDifference > 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {tempDifference === 0 ? '-' : `$${Math.abs(tempDifference * item.unitCost).toLocaleString()}`}
                          </span>
                        ) : (
                          <span className={`font-mono text-sm ${
                            item.differenceValue === null
                              ? 'text-gray-400'
                              : item.differenceValue === 0
                              ? 'text-gray-500'
                              : item.differenceValue > 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {item.differenceValue === null
                              ? '-'
                              : item.differenceValue === 0
                              ? '-'
                              : `$${Math.abs(item.differenceValue).toLocaleString()}`}
                          </span>
                        )}
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="admin-secondary"
                            size="sm"
                            onClick={() => handleUpdateItem(item.id)}
                            className="text-xs"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            Guardar
                          </Button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
              Sin contar
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Sin diferencia
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Sobrante
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Faltante
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {count?.notes && (
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-700 mb-1">Notas</p>
          <p className="text-gray-600 text-sm">{count.notes}</p>
        </div>
      )}

      {/* Approve Modal */}
      <Modal isOpen={showApproveModal} onClose={() => setShowApproveModal(false)} title="Aprobar Conteo">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-800 font-medium">Confirmar Aprobación</p>
              <p className="text-sm text-yellow-700 mt-1">
                Al aprobar este conteo, se aplicarán automáticamente los ajustes de inventario.
                Esta acción no se puede deshacer.
              </p>
            </div>
          </div>
          {stats && (stats.positive > 0 || stats.negative > 0) && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Resumen de Ajustes:</p>
              {stats.positive > 0 && (
                <p className="text-sm text-green-600">
                  +{stats.positive} item(s) con sobrante (+${stats.totalPositiveValue.toLocaleString()})
                </p>
              )}
              {stats.negative > 0 && (
                <p className="text-sm text-red-600">
                  -{stats.negative} item(s) con faltante (-${stats.totalNegativeValue.toLocaleString()})
                </p>
              )}
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="admin-secondary" onClick={() => setShowApproveModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button variant="admin-primary" onClick={handleApprove} disabled={saving} className="flex-1">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Aprobar y Aplicar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancelar Conteo">
        <div className="space-y-4">
          <p className="text-gray-600">
            ¿Estás seguro de cancelar el conteo <strong>{count?.countNumber}</strong>?
            No se aplicarán ajustes al inventario.
          </p>
          <div className="flex gap-3">
            <Button variant="admin-secondary" onClick={() => setShowCancelModal(false)} className="flex-1">
              Volver
            </Button>
            <Button variant="admin-danger" onClick={handleCancel} disabled={saving} className="flex-1">
              {saving ? 'Cancelando...' : 'Cancelar Conteo'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Eliminar Conteo">
        <div className="space-y-4">
          <p className="text-gray-600">
            ¿Estás seguro de eliminar el conteo <strong>{count?.countNumber}</strong>?
            Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <Button variant="admin-secondary" onClick={() => setShowDeleteModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button variant="admin-danger" onClick={handleDelete} disabled={saving} className="flex-1">
              {saving ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
