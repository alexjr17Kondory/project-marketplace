import { useState, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import {
  ShoppingCart,
  Plus,
  Search,
  Eye,
  Trash2,
  Send,
  CheckCircle,
  Package,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import { Modal } from '../../components/shared/Modal';
import { Button } from '../../components/shared/Button';
import { PurchaseItemSelector, type PurchaseItem } from '../../components/admin/PurchaseItemSelector';
import { useToast } from '../../context/ToastContext';
import * as purchaseOrdersService from '../../services/purchase-orders.service';
import * as suppliersService from '../../services/suppliers.service';
import type {
  PurchaseOrder,
  PurchaseOrderStatus,
  PurchaseOrderStats,
} from '../../services/purchase-orders.service';
import type { Supplier } from '../../services/suppliers.service';

export default function PurchaseOrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [stats, setStats] = useState<PurchaseOrderStats | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | ''>('');
  const [sorting, setSorting] = useState<SortingState>([]);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showItemSelectorModal, setShowItemSelectorModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<PurchaseOrder | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state for creating orders
  const [formData, setFormData] = useState<{
    supplierId: number;
    expectedDate: string;
    notes: string;
    items: PurchaseItem[];
  }>({
    supplierId: 0,
    expectedDate: '',
    notes: '',
    items: [],
  });

  // Receive form
  const [receiveItems, setReceiveItems] = useState<{ itemId: number; quantityReceived: number }[]>(
    []
  );

  // Load data
  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, statsData, suppliersData] = await Promise.all([
        purchaseOrdersService.getPurchaseOrders({ status: statusFilter || undefined }),
        purchaseOrdersService.getStats(),
        suppliersService.getSuppliers({ isActive: true }),
      ]);
      setOrders(ordersData);
      setStats(statsData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Open create modal
  const handleCreate = () => {
    setFormData({
      supplierId: suppliers[0]?.id || 0,
      expectedDate: '',
      notes: '',
      items: [],
    });
    setShowModal(true);
  };

  // Handle items selected from item selector
  const handleItemsSelected = (items: PurchaseItem[]) => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, ...items],
    }));
    setShowItemSelectorModal(false);
  };

  // Remove item from form
  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  // Update item quantity
  const updateItemQuantity = (index: number, quantity: number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], quantity: Math.max(1, quantity) };
    setFormData({ ...formData, items: newItems });
  };

  // Update item cost
  const updateItemCost = (index: number, unitCost: number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], unitCost };
    setFormData({ ...formData, items: newItems });
  };

  // Save order
  const handleSave = async () => {
    if (!formData.supplierId) {
      showToast('Selecciona un proveedor', 'error');
      return;
    }
    if (formData.items.length === 0) {
      showToast('Agrega al menos un item', 'error');
      return;
    }

    try {
      setSaving(true);
      // Convert PurchaseItem[] to API format
      const apiItems = formData.items.map(item => ({
        variantId: item.variantId,
        inputId: item.inputId,
        description: item.variantInfo ? `${item.productName} - ${item.variantInfo}` : item.productName,
        quantity: item.quantity,
        unitCost: item.unitCost,
      }));

      await purchaseOrdersService.createPurchaseOrder({
        supplierId: formData.supplierId,
        expectedDate: formData.expectedDate || undefined,
        notes: formData.notes || undefined,
        items: apiItems,
      });
      showToast('Orden de compra creada', 'success');
      setShowModal(false);
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Change status
  const handleStatusChange = async (order: PurchaseOrder, newStatus: PurchaseOrderStatus) => {
    try {
      await purchaseOrdersService.updateStatus(order.id, newStatus);
      showToast('Estado actualizado', 'success');
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Error al cambiar estado', 'error');
    }
  };

  // View order details
  const handleView = async (order: PurchaseOrder) => {
    try {
      const fullOrder = await purchaseOrdersService.getPurchaseOrderById(order.id);
      setSelectedOrder(fullOrder);
      setShowViewModal(true);
    } catch (error) {
      showToast('Error al cargar orden', 'error');
    }
  };

  // Open receive modal
  const handleOpenReceive = async (order: PurchaseOrder) => {
    try {
      const fullOrder = await purchaseOrdersService.getPurchaseOrderById(order.id);
      setSelectedOrder(fullOrder);
      setReceiveItems(
        fullOrder.items.map((item) => ({
          itemId: item.id,
          quantityReceived: 0,
        }))
      );
      setShowReceiveModal(true);
    } catch (error) {
      showToast('Error al cargar orden', 'error');
    }
  };

  // Receive items
  const handleReceive = async () => {
    if (!selectedOrder) return;

    const itemsToReceive = receiveItems.filter((item) => item.quantityReceived > 0);
    if (itemsToReceive.length === 0) {
      showToast('Ingresa las cantidades a recibir', 'error');
      return;
    }

    try {
      setSaving(true);
      await purchaseOrdersService.receiveItems(selectedOrder.id, itemsToReceive);
      showToast('Items recibidos correctamente', 'success');
      setShowReceiveModal(false);
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Error al recibir', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete order
  const handleDelete = async () => {
    if (!orderToDelete) return;

    try {
      setSaving(true);
      await purchaseOrdersService.deletePurchaseOrder(orderToDelete.id);
      showToast('Orden eliminada', 'success');
      setShowDeleteModal(false);
      setOrderToDelete(null);
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Error al eliminar', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Table columns
  const columns = useMemo<ColumnDef<PurchaseOrder>[]>(
    () => [
      {
        accessorKey: 'orderNumber',
        header: '# Orden',
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium text-gray-900">
            {row.original.orderNumber}
          </span>
        ),
      },
      {
        accessorKey: 'supplier.name',
        header: 'Proveedor',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-gray-900">{row.original.supplier.name}</p>
            <p className="text-xs text-gray-500">{row.original.supplier.code}</p>
          </div>
        ),
      },
      {
        accessorKey: 'orderDate',
        header: 'Fecha',
        cell: ({ row }) => (
          <span className="text-sm text-gray-600">
            {new Date(row.original.orderDate).toLocaleDateString()}
          </span>
        ),
      },
      {
        accessorKey: 'total',
        header: 'Total',
        cell: ({ row }) => (
          <span className="font-medium text-gray-900">
            ${Number(row.original.total).toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'items',
        header: 'Items',
        cell: ({ row }) => (
          <span className="text-sm text-gray-600">{row.original.items.length}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${purchaseOrdersService.getStatusColor(
              row.original.status
            )}`}
          >
            {purchaseOrdersService.getStatusLabel(row.original.status)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleView(order)}
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                title="Ver"
              >
                <Eye className="w-4 h-4" />
              </button>
              {order.status === 'DRAFT' && (
                <button
                  onClick={() => handleStatusChange(order, 'SENT')}
                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Enviar"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
              {order.status === 'SENT' && (
                <button
                  onClick={() => handleStatusChange(order, 'CONFIRMED')}
                  className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg"
                  title="Confirmar"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
              {['CONFIRMED', 'PARTIAL'].includes(order.status) && (
                <button
                  onClick={() => handleOpenReceive(order)}
                  className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg"
                  title="Recibir"
                >
                  <Package className="w-4 h-4" />
                </button>
              )}
              {['DRAFT', 'CANCELLED'].includes(order.status) && (
                <button
                  onClick={() => {
                    setOrderToDelete(order);
                    setShowDeleteModal(true);
                  }}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  // Filter data
  const filteredData = useMemo(() => {
    if (!searchTerm) return orders;
    const term = searchTerm.toLowerCase();
    return orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(term) ||
        o.supplier.name.toLowerCase().includes(term)
    );
  }, [orders, searchTerm]);

  // Table instance
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  // Calculate form total
  const formTotal = formData.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <ShoppingCart className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Órdenes de Compra</h1>
            <p className="text-sm text-gray-500">Gestión de compras a proveedores</p>
          </div>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Orden
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Pendientes</p>
            <p className="text-2xl font-bold text-orange-600">{stats.pendingCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Recibidas</p>
            <p className="text-2xl font-bold text-green-600">{stats.byStatus.received}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Canceladas</p>
            <p className="text-2xl font-bold text-red-600">{stats.byStatus.cancelled}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Compras del Mes</p>
            <p className="text-2xl font-bold text-gray-900">
              ${stats.monthlyTotal.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número o proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PurchaseOrderStatus | '')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Todos los estados</option>
            <option value="DRAFT">Borrador</option>
            <option value="SENT">Enviada</option>
            <option value="CONFIRMED">Confirmada</option>
            <option value="PARTIAL">Parcial</option>
            <option value="RECEIVED">Recibida</option>
            <option value="CANCELLED">Cancelada</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No hay órdenes de compra</p>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {table.getPageCount() > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              {table.getState().pagination.pageIndex * 10 + 1} -{' '}
              {Math.min((table.getState().pagination.pageIndex + 1) * 10, filteredData.length)} de{' '}
              {filteredData.length}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nueva Orden de Compra" size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor *</label>
              <select
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Seleccionar...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Esperada</label>
              <input
                type="date"
                value={formData.expectedDate}
                onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Items Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Items de la orden</label>
              <Button variant="outline" size="sm" onClick={() => setShowItemSelectorModal(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Agregar Items
              </Button>
            </div>

            {formData.items.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Package className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 mb-2">No hay items agregados</p>
                <Button variant="outline" size="sm" onClick={() => setShowItemSelectorModal(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar Productos o Insumos
                </Button>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Producto</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-600 w-24">Cant.</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-600 w-28">Costo</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600 w-28">Subtotal</th>
                      <th className="px-3 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {formData.items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <div>
                            <p className="font-medium text-gray-900">{item.productName}</p>
                            {item.variantInfo && (
                              <p className="text-xs text-gray-500">{item.variantInfo}</p>
                            )}
                            {item.sku && (
                              <p className="text-xs text-gray-400">{item.sku}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(index, Number(e.target.value))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm"
                            min="1"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.unitCost}
                            onChange={(e) => updateItemCost(index, Number(e.target.value))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm"
                            min="0"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          ${(item.quantity * item.unitCost).toLocaleString()}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => removeItem(index)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-right font-medium text-gray-700">
                        Total:
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-lg text-gray-900">
                        ${formTotal.toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="Notas adicionales para esta orden..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || formData.items.length === 0}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Crear Orden
          </Button>
        </div>
      </Modal>

      {/* Item Selector Modal */}
      <Modal
        isOpen={showItemSelectorModal}
        onClose={() => setShowItemSelectorModal(false)}
        title="Agregar Productos o Insumos"
        size="xl"
      >
        <PurchaseItemSelector
          onItemsSelected={handleItemsSelected}
          onClose={() => setShowItemSelectorModal(false)}
        />
      </Modal>

      {/* View Modal */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title={`Orden ${selectedOrder?.orderNumber}`} size="xl">
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Proveedor</p>
                <p className="font-medium">{selectedOrder.supplier.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Estado</p>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${purchaseOrdersService.getStatusColor(selectedOrder.status)}`}>
                  {purchaseOrdersService.getStatusLabel(selectedOrder.status)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fecha</p>
                <p>{new Date(selectedOrder.orderDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="font-bold text-lg">${Number(selectedOrder.total).toLocaleString()}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Items</p>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Producto</th>
                      <th className="px-3 py-2 text-right">Cantidad</th>
                      <th className="px-3 py-2 text-right">Recibido</th>
                      <th className="px-3 py-2 text-right">Costo Unit.</th>
                      <th className="px-3 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2">
                          {item.variant?.product.name || item.input?.name || item.description}
                          {item.variant && (
                            <span className="text-xs text-gray-500 ml-1">({item.variant.sku})</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">{Number(item.quantity)}</td>
                        <td className="px-3 py-2 text-right">{Number(item.quantityReceived)}</td>
                        <td className="px-3 py-2 text-right">${Number(item.unitCost).toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-medium">${Number(item.subtotal).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={() => setShowViewModal(false)}>
            Cerrar
          </Button>
        </div>
      </Modal>

      {/* Receive Modal */}
      <Modal isOpen={showReceiveModal} onClose={() => setShowReceiveModal(false)} title="Recibir Mercancía" size="lg">
        {selectedOrder && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Ingresa las cantidades recibidas:</p>
            <div className="space-y-2">
              {selectedOrder.items.map((item, index) => {
                const pending = Number(item.quantity) - Number(item.quantityReceived);
                return (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {item.variant?.product.name || item.input?.name || item.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        Pedido: {Number(item.quantity)} | Recibido: {Number(item.quantityReceived)} | Pendiente: {pending}
                      </p>
                    </div>
                    <input
                      type="number"
                      value={receiveItems[index]?.quantityReceived || 0}
                      onChange={(e) => {
                        const newItems = [...receiveItems];
                        newItems[index] = {
                          itemId: item.id,
                          quantityReceived: Math.min(Number(e.target.value), pending),
                        };
                        setReceiveItems(newItems);
                      }}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center"
                      min="0"
                      max={pending}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowReceiveModal(false)}>
            Cancelar
          </Button>
          <Button onClick={handleReceive} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Package className="w-4 h-4 mr-2" />}
            Confirmar Recepción
          </Button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Eliminar Orden">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-gray-600">
              ¿Eliminar la orden <strong>{orderToDelete?.orderNumber}</strong>?
            </p>
            <p className="text-sm text-gray-500 mt-2">Esta acción no se puede deshacer.</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={saving}>
            {saving ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
