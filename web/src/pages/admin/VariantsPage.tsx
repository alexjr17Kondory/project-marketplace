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
  LayoutGrid,
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
} from 'lucide-react';

const columnHelper = createColumnHelper<ProductVariant>();

export default function VariantsPage() {
  const { showToast } = useToast();
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [showBarcodeModal, setShowBarcodeModal] = useState<ProductVariant | null>(null);
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
              onClick={() => setDeleteConfirmId(row.original.id)}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
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
        pageSize: 20,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
            <LayoutGrid className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Variantes de Productos</h1>
            <p className="text-gray-600 mt-1">
              Gestiona variantes, codigos de barras y stock
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={loadVariants} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
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
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
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
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
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

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por SKU, producto, color..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10"
          />
        </div>
        <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
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

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
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
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Package className="w-12 h-12 text-gray-300 mb-4" />
                      <p className="text-gray-500">No se encontraron variantes</p>
                      {filterLowStock && (
                        <p className="text-sm text-gray-400 mt-1">
                          Desactiva el filtro de stock bajo para ver todas
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
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
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              Mostrando {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} a{' '}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}{' '}
              de {table.getFilteredRowModel().rows.length} variantes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-700 px-2">
              Pagina {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
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
                variant="outline"
                onClick={() => {
                  setShowBarcodeModal(null);
                  if (barcodeImageUrl) URL.revokeObjectURL(barcodeImageUrl);
                  setBarcodeImageUrl(null);
                }}
                className="flex-1"
              >
                Cerrar
              </Button>
              <Button onClick={() => window.print()} className="flex-1">
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
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Export con nombre para compatibilidad
export { VariantsPage };
