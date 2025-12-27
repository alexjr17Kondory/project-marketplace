import { useState, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/shared/Modal';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import type { ProductVariant } from '../../services/variants.service';
import * as variantsService from '../../services/variants.service';
import * as barcodeService from '../../services/barcode.service';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Barcode,
  Trash2,
  Printer,
  AlertTriangle,
  RefreshCw,
  Package,
  Layers,
  TrendingDown,
  Settings,
} from 'lucide-react';

const columnHelper = createColumnHelper<ProductVariant>();

export default function VariantsPage() {
  const { showToast } = useToast();
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [showBarcodeModal, setShowBarcodeModal] = useState<ProductVariant | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<ProductVariant | null>(null);
  const [barcodeImageUrl, setBarcodeImageUrl] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);

  // Cargar variantes
  useEffect(() => {
    loadVariants();
  }, [filterLowStock]);

  const loadVariants = async () => {
    setLoading(true);
    try {
      const data = await variantsService.getVariants({
        lowStock: filterLowStock,
      });
      setVariants(data);
    } catch (error: any) {
      showToast('Error al cargar variantes: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Generar codigo de barras para visualizacion
  const handleShowBarcode = async (variant: ProductVariant) => {
    if (!variant.barcode) {
      showToast('Esta variante no tiene codigo de barras asignado', 'error');
      return;
    }

    try {
      const imageUrl = await barcodeService.getVariantBarcodeImage(variant.id);
      setBarcodeImageUrl(imageUrl);
      setShowBarcodeModal(variant);
    } catch (error: any) {
      showToast('Error al generar codigo de barras', 'error');
    }
  };

  // Asignar codigo de barras
  const handleAssignBarcode = async (variantId: number) => {
    try {
      await barcodeService.assignBarcode(variantId);
      showToast('Codigo de barras asignado exitosamente', 'success');
      loadVariants();
    } catch (error: any) {
      showToast('Error al asignar codigo de barras: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  // Eliminar variante
  const handleDelete = async (id: number) => {
    try {
      await variantsService.deleteVariant(id);
      showToast('Variante eliminada exitosamente', 'success');
      setDeleteConfirmId(null);
      loadVariants();
    } catch (error: any) {
      showToast('Error al eliminar variante: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  // Ajustar stock
  const handleStockAdjustment = async (variant: ProductVariant) => {
    const colorName = variant.color?.name || 'N/A';
    const sizeName = variant.size?.name || 'N/A';
    const quantity = window.prompt(
      `Ajustar stock de ${variant.product.name} (${colorName} - ${sizeName})\nStock actual: ${variant.stock}\n\nIngrese cantidad a sumar/restar (ej: +10 o -5):`
    );

    if (!quantity) return;

    const adjustment = parseInt(quantity);
    if (isNaN(adjustment)) {
      showToast('Cantidad invalida', 'error');
      return;
    }

    try {
      await variantsService.adjustStock(variant.id, adjustment);
      showToast('Stock ajustado exitosamente', 'success');
      loadVariants();
    } catch (error: any) {
      showToast('Error al ajustar stock: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  // Stats
  const stats = useMemo(() => {
    const total = variants.length;
    const lowStock = variants.filter(v => v.stock <= v.minStock).length;
    const outOfStock = variants.filter(v => v.stock === 0).length;
    return { total, lowStock, outOfStock };
  }, [variants]);

  // Definir columnas
  const columns = useMemo(
    () => [
      columnHelper.accessor('sku', {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 hover:text-gray-900"
          >
            SKU
            <ArrowUpDown className="w-4 h-4" />
          </button>
        ),
        cell: (info) => (
          <div className="font-mono text-sm text-gray-900">{info.getValue()}</div>
        ),
      }),
      columnHelper.accessor('product.name', {
        header: 'Producto',
        cell: (info) => {
          const product = info.row.original.product;
          const image = product.images?.[0] || '/placeholder.png';
          return (
            <div className="flex items-center">
              <img
                src={image}
                alt={product.name}
                className="w-10 h-10 rounded-lg object-cover"
              />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">{product.name}</div>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('color.name', {
        header: 'Color',
        cell: (info) => {
          const color = info.row.original.color;
          if (!color) {
            return <span className="text-sm text-gray-400">N/A</span>;
          }
          return (
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full border border-gray-200 shadow-sm"
                style={{ backgroundColor: color.hexCode }}
              />
              <span className="text-sm text-gray-900">{color.name}</span>
            </div>
          );
        },
      }),
      columnHelper.accessor('size.name', {
        header: 'Talla',
        cell: (info) => {
          const size = info.row.original.size;
          if (!size) {
            return <span className="text-sm text-gray-400">N/A</span>;
          }
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {size.abbreviation}
            </span>
          );
        },
      }),
      columnHelper.accessor('barcode', {
        header: 'Codigo de Barras',
        cell: (info) => {
          const barcode = info.getValue();
          return barcode ? (
            <button
              onClick={() => handleShowBarcode(info.row.original)}
              className="font-mono text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              {barcode}
            </button>
          ) : (
            <button
              onClick={() => handleAssignBarcode(info.row.original.id)}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-indigo-100 text-gray-600 hover:text-indigo-600 rounded transition-colors"
            >
              Generar
            </button>
          );
        },
      }),
      columnHelper.accessor('stock', {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 hover:text-gray-900"
          >
            Stock
            <ArrowUpDown className="w-4 h-4" />
          </button>
        ),
        cell: (info) => {
          const stock = info.getValue();
          const minStock = info.row.original.minStock;
          const isLow = stock <= minStock;
          const isOut = stock === 0;

          return (
            <button
              onClick={() => handleStockAdjustment(info.row.original)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded font-medium text-sm hover:opacity-80 transition-opacity ${
                isOut
                  ? 'bg-red-100 text-red-700'
                  : isLow
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {stock}
              {isLow && !isOut && <AlertTriangle className="w-3 h-3" />}
            </button>
          );
        },
      }),
      columnHelper.accessor('finalPrice', {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 hover:text-gray-900"
          >
            Precio
            <ArrowUpDown className="w-4 h-4" />
          </button>
        ),
        cell: (info) => (
          <span className="text-sm font-medium text-gray-900">
            ${info.getValue().toLocaleString('es-CO')}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <div className="text-right">Acciones</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            {row.original.barcode && (
              <button
                onClick={() => handleShowBarcode(row.original)}
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Ver codigo de barras"
              >
                <Barcode className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowDetailModal(row.original)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Detalles"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: variants,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-gray-500">Cargando variantes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Variantes de Productos</h1>
          <p className="text-gray-600 mt-1 text-sm">Gestiona variantes, codigos de barras y stock</p>
        </div>
        <Button variant="admin-orange" size="sm" onClick={loadVariants}>
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Variantes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Stock Bajo</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{stats.lowStock}</p>
            </div>
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Sin Stock</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.outOfStock}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por SKU, producto, color..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10"
            />
          </div>
          <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={filterLowStock}
              onChange={(e) => setFilterLowStock(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-gray-700">Solo Stock Bajo</span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
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
                  <td colSpan={columns.length} className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {globalFilter ? 'No se encontraron variantes' : 'No hay variantes'}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {globalFilter
                        ? 'Intenta con otra busqueda'
                        : filterLowStock
                        ? 'Desactiva el filtro de stock bajo para ver todas'
                        : 'Genera variantes desde el modulo de productos'}
                    </p>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 text-sm">
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
        {table.getRowModel().rows.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-700">
              Mostrando{' '}
              <span className="font-medium">
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
              </span>{' '}
              a{' '}
              <span className="font-medium">
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}
              </span>{' '}
              de <span className="font-medium">{table.getFilteredRowModel().rows.length}</span> variantes
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex gap-1">
                {Array.from({ length: table.getPageCount() }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => table.setPageIndex(page - 1)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      table.getState().pagination.pageIndex === page - 1
                        ? 'bg-orange-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal - Ver Codigo de Barras */}
      <Modal
        isOpen={!!showBarcodeModal}
        onClose={() => {
          setShowBarcodeModal(null);
          if (barcodeImageUrl) URL.revokeObjectURL(barcodeImageUrl);
          setBarcodeImageUrl(null);
        }}
        title="Codigo de Barras"
        size="sm"
      >
        {showBarcodeModal && (
          <div className="space-y-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                {showBarcodeModal.product.name}
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                {showBarcodeModal.color && (
                  <>
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: showBarcodeModal.color.hexCode }}
                    />
                    <span>{showBarcodeModal.color.name}</span>
                  </>
                )}
                {showBarcodeModal.size && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span>{showBarcodeModal.size.name}</span>
                  </>
                )}
              </div>
              <p className="font-mono text-xl font-bold mt-3">{showBarcodeModal.barcode}</p>
            </div>
            {barcodeImageUrl && (
              <div className="flex justify-center p-4 bg-white border rounded-lg">
                <img src={barcodeImageUrl} alt="Barcode" className="max-w-full" />
              </div>
            )}
            <div className="flex gap-3">
              <Button
                variant="admin-secondary"
                onClick={() => {
                  setShowBarcodeModal(null);
                  if (barcodeImageUrl) URL.revokeObjectURL(barcodeImageUrl);
                  setBarcodeImageUrl(null);
                }}
                className="flex-1"
              >
                Cerrar
              </Button>
              <Button variant="admin-primary" onClick={() => window.print()} className="flex-1">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal - Confirmar Eliminacion */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Eliminar Variante"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-sm text-gray-700">
              Estas a punto de eliminar esta variante. Esta accion no se puede deshacer.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="admin-secondary" onClick={() => setDeleteConfirmId(null)} className="flex-1">
              Cancelar
            </Button>
            <Button
              variant="admin-danger"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="flex-1"
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal - Detalles de Variante */}
      <Modal
        isOpen={!!showDetailModal}
        onClose={() => setShowDetailModal(null)}
        title="Detalles de Variante"
        size="md"
      >
        {showDetailModal && (
          <div className="space-y-6">
            {/* Producto */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <img
                src={showDetailModal.product.images?.[0] || '/placeholder.png'}
                alt={showDetailModal.product.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <h3 className="font-medium text-gray-900">{showDetailModal.product.name}</h3>
                <p className="text-sm text-gray-500">SKU: {showDetailModal.sku}</p>
              </div>
            </div>

            {/* Atributos */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Color</p>
                {showDetailModal.color ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full border border-gray-200"
                      style={{ backgroundColor: showDetailModal.color.hexCode }}
                    />
                    <span className="text-sm font-medium">{showDetailModal.color.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">N/A</span>
                )}
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Talla</p>
                {showDetailModal.size ? (
                  <span className="text-sm font-medium">{showDetailModal.size.name} ({showDetailModal.size.abbreviation})</span>
                ) : (
                  <span className="text-sm text-gray-400">N/A</span>
                )}
              </div>
            </div>

            {/* Stock y Precio */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Stock</p>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${
                    showDetailModal.stock === 0
                      ? 'text-red-600'
                      : showDetailModal.stock <= showDetailModal.minStock
                      ? 'text-amber-600'
                      : 'text-green-600'
                  }`}>
                    {showDetailModal.stock}
                  </span>
                  <span className="text-xs text-gray-400">/ min: {showDetailModal.minStock}</span>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Precio</p>
                <span className="text-lg font-bold text-gray-900">
                  ${showDetailModal.finalPrice.toLocaleString('es-CO')}
                </span>
              </div>
            </div>

            {/* Codigo de Barras */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Codigo de Barras</p>
              {showDetailModal.barcode ? (
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">{showDetailModal.barcode}</span>
                  <button
                    onClick={() => {
                      handleShowBarcode(showDetailModal);
                      setShowDetailModal(null);
                    }}
                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                  >
                    Ver imagen
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Sin codigo asignado</span>
                  <button
                    onClick={() => {
                      handleAssignBarcode(showDetailModal.id);
                      setShowDetailModal(null);
                    }}
                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                  >
                    Generar
                  </button>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="admin-danger"
                onClick={() => {
                  setShowDetailModal(null);
                  setDeleteConfirmId(showDetailModal.id);
                }}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
              <Button
                variant="admin-secondary"
                onClick={() => {
                  handleStockAdjustment(showDetailModal);
                  setShowDetailModal(null);
                }}
                className="flex-1"
              >
                Ajustar Stock
              </Button>
              <Button variant="admin-primary" onClick={() => setShowDetailModal(null)} className="flex-1">
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// Export con nombre para compatibilidad
export { VariantsPage };
