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
  ArrowDownUp,
  Search,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle,
  Box,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import * as inventoryService from '../../services/inventory.service';
import type {
  VariantMovement,
  MovementType,
  InventoryStats,
  InputBatchMovement,
  InputMovementType,
  InputMovementsStats,
} from '../../services/inventory.service';

type TabType = 'products' | 'inputs';

export default function InventoryMovementsPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('products');

  // Products state
  const [movements, setMovements] = useState<VariantMovement[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [typeFilter, setTypeFilter] = useState<MovementType | ''>('');

  // Inputs state
  const [inputMovements, setInputMovements] = useState<InputBatchMovement[]>([]);
  const [inputStats, setInputStats] = useState<InputMovementsStats | null>(null);
  const [inputTypeFilter, setInputTypeFilter] = useState<InputMovementType | ''>('');

  // Common state
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'products') {
      loadProductsData();
    } else {
      loadInputsData();
    }
  }, [activeTab, typeFilter, inputTypeFilter]);

  const loadProductsData = async () => {
    try {
      setLoading(true);
      const [movementsData, statsData] = await Promise.all([
        inventoryService.getMovements({ movementType: typeFilter || undefined }),
        inventoryService.getStats(),
      ]);
      setMovements(movementsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading products data:', error);
      showToast('Error al cargar datos de productos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadInputsData = async () => {
    try {
      setLoading(true);
      const [movementsData, statsData] = await Promise.all([
        inventoryService.getInputMovements({ movementType: inputTypeFilter || undefined }),
        inventoryService.getInputMovementsStats(),
      ]);
      setInputMovements(movementsData);
      setInputStats(statsData);
    } catch (error) {
      console.error('Error loading inputs data:', error);
      showToast('Error al cargar datos de insumos', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Product columns
  const productColumns = useMemo<ColumnDef<VariantMovement>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: 'Fecha',
        cell: ({ row }) => (
          <div className="text-sm">
            <p>{new Date(row.original.createdAt).toLocaleDateString()}</p>
            <p className="text-xs text-gray-500">
              {new Date(row.original.createdAt).toLocaleTimeString()}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'variant',
        header: 'Producto',
        cell: ({ row }) => {
          const v = row.original.variant;
          return (
            <div>
              <p className="font-medium text-sm">{v?.product?.name || '-'}</p>
              <p className="text-xs text-gray-500">
                {v?.sku}
                {v?.color && ` - ${v.color.name}`}
                {v?.size && ` - ${v.size.name}`}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: 'movementType',
        header: 'Tipo',
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${inventoryService.getMovementTypeColor(
              row.original.movementType
            )}`}
          >
            {inventoryService.getMovementTypeLabel(row.original.movementType)}
          </span>
        ),
      },
      {
        accessorKey: 'quantity',
        header: 'Cantidad',
        cell: ({ row }) => {
          const isIncoming = inventoryService.isIncoming(row.original.movementType);
          return (
            <div className="flex items-center gap-1">
              {isIncoming ? (
                <ArrowUpCircle className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowDownCircle className="w-4 h-4 text-red-600" />
              )}
              <span
                className={`font-medium ${isIncoming ? 'text-green-600' : 'text-red-600'}`}
              >
                {isIncoming ? '+' : '-'}
                {Math.abs(row.original.quantity)}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'previousStock',
        header: 'Stock Anterior',
        cell: ({ row }) => (
          <span className="text-sm text-gray-600">{row.original.previousStock}</span>
        ),
      },
      {
        accessorKey: 'newStock',
        header: 'Stock Nuevo',
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.newStock}</span>
        ),
      },
      {
        accessorKey: 'reason',
        header: 'Razón',
        cell: ({ row }) => (
          <span className="text-sm text-gray-600 truncate max-w-[200px] block">
            {row.original.reason || '-'}
          </span>
        ),
      },
    ],
    []
  );

  // Input columns
  const inputColumns = useMemo<ColumnDef<InputBatchMovement>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: 'Fecha',
        cell: ({ row }) => (
          <div className="text-sm">
            <p>{new Date(row.original.createdAt).toLocaleDateString()}</p>
            <p className="text-xs text-gray-500">
              {new Date(row.original.createdAt).toLocaleTimeString()}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'input',
        header: 'Insumo',
        cell: ({ row }) => {
          const input = row.original.input;
          const variant = row.original.inputVariant;
          return (
            <div>
              <p className="font-medium text-sm">{input?.name || '-'}</p>
              <p className="text-xs text-gray-500">
                {input?.code} - {input?.unitOfMeasure}
              </p>
              {variant && (
                <div className="flex items-center gap-1 mt-1">
                  {variant.color && (
                    <span
                      className="w-3 h-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: variant.color.hexCode }}
                      title={variant.color.name}
                    />
                  )}
                  <span className="text-xs text-blue-600">
                    {variant.color?.name || ''} {variant.size?.abbreviation ? `/ ${variant.size.abbreviation}` : ''}
                  </span>
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'inputBatch',
        header: 'Lote/Variante',
        cell: ({ row }) => {
          const variant = row.original.inputVariant;
          if (variant) {
            return (
              <span className="text-xs font-mono text-blue-600">
                {variant.sku}
              </span>
            );
          }
          return (
            <span className="text-sm text-gray-600">
              {row.original.inputBatch?.batchNumber || '-'}
            </span>
          );
        },
      },
      {
        accessorKey: 'movementType',
        header: 'Tipo',
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${inventoryService.getInputMovementTypeColor(
              row.original.movementType
            )}`}
          >
            {inventoryService.getInputMovementTypeLabel(row.original.movementType)}
          </span>
        ),
      },
      {
        accessorKey: 'quantity',
        header: 'Cantidad',
        cell: ({ row }) => {
          const isIncoming = inventoryService.isInputIncoming(row.original.movementType);
          const qty = Number(row.original.quantity);
          return (
            <div className="flex items-center gap-1">
              {isIncoming ? (
                <ArrowUpCircle className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowDownCircle className="w-4 h-4 text-red-600" />
              )}
              <span
                className={`font-medium ${isIncoming ? 'text-green-600' : 'text-red-600'}`}
              >
                {isIncoming ? '+' : '-'}
                {Math.abs(qty).toFixed(2)}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'referenceType',
        header: 'Referencia',
        cell: ({ row }) => {
          const refType = row.original.referenceType;
          const refId = row.original.referenceId;
          if (!refType) return <span className="text-gray-400">-</span>;

          const labels: Record<string, string> = {
            purchase: 'Compra',
            purchase_order: 'Orden de Compra',
            adjustment: 'Ajuste',
            order: 'Pedido',
            production: 'Producción',
            inventory_count: 'Conteo Físico',
          };

          return (
            <span className="text-sm text-gray-600">
              {labels[refType] || refType}
              {refId && ` #${refId}`}
            </span>
          );
        },
      },
      {
        accessorKey: 'reason',
        header: 'Razón',
        cell: ({ row }) => (
          <span className="text-sm text-gray-600 truncate max-w-[200px] block">
            {row.original.reason || '-'}
          </span>
        ),
      },
    ],
    []
  );

  // Filter products data
  const filteredProductsData = useMemo(() => {
    if (!searchTerm) return movements;
    const term = searchTerm.toLowerCase();
    return movements.filter(
      (m) =>
        m.variant?.sku?.toLowerCase().includes(term) ||
        m.variant?.product?.name?.toLowerCase().includes(term) ||
        m.reason?.toLowerCase().includes(term)
    );
  }, [movements, searchTerm]);

  // Filter inputs data
  const filteredInputsData = useMemo(() => {
    if (!searchTerm) return inputMovements;
    const term = searchTerm.toLowerCase();
    return inputMovements.filter(
      (m) =>
        m.input?.code?.toLowerCase().includes(term) ||
        m.input?.name?.toLowerCase().includes(term) ||
        m.reason?.toLowerCase().includes(term)
    );
  }, [inputMovements, searchTerm]);

  // Products table instance
  const productsTable = useReactTable({
    data: filteredProductsData,
    columns: productColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  // Inputs table instance
  const inputsTable = useReactTable({
    data: filteredInputsData,
    columns: inputColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

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
            <ArrowDownUp className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Movimientos de Inventario</h1>
            <p className="text-sm text-gray-500">Historial de entradas y salidas</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => {
              setActiveTab('products');
              setSearchTerm('');
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'products'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Package className="w-4 h-4" />
            Productos (Variantes)
          </button>
          <button
            onClick={() => {
              setActiveTab('inputs');
              setSearchTerm('');
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'inputs'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Box className="w-4 h-4" />
            Insumos (Consumibles)
          </button>
        </nav>
      </div>

      {/* Stats - Products */}
      {activeTab === 'products' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Variantes</p>
                <p className="text-xl font-bold">{stats.totalVariants}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Stock Total</p>
                <p className="text-xl font-bold">{stats.totalStock.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Stock Bajo</p>
                <p className="text-xl font-bold text-yellow-600">{stats.lowStock}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Sin Stock</p>
                <p className="text-xl font-bold text-red-600">{stats.outOfStock}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ArrowDownUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Mov. Hoy</p>
                <p className="text-xl font-bold">{stats.todayMovements}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats - Inputs */}
      {activeTab === 'inputs' && inputStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Box className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Insumos</p>
                <p className="text-xl font-bold">{inputStats.totalInputs}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Stock Total</p>
                <p className="text-xl font-bold">{inputStats.totalStock.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Stock Bajo</p>
                <p className="text-xl font-bold text-yellow-600">{inputStats.lowStock}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ArrowDownUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Mov. Hoy</p>
                <p className="text-xl font-bold">{inputStats.todayMovements}</p>
              </div>
            </div>
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
              placeholder={activeTab === 'products' ? "Buscar por SKU, producto..." : "Buscar por código, insumo..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {activeTab === 'products' ? (
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as MovementType | '')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Todos los tipos</option>
              <option value="PURCHASE">Compra</option>
              <option value="SALE">Venta</option>
              <option value="ADJUSTMENT">Ajuste</option>
              <option value="TRANSFER_IN">Transferencia Entrada</option>
              <option value="TRANSFER_OUT">Transferencia Salida</option>
              <option value="RETURN">Devolución</option>
              <option value="DAMAGE">Daño/Merma</option>
              <option value="INITIAL">Stock Inicial</option>
            </select>
          ) : (
            <select
              value={inputTypeFilter}
              onChange={(e) => setInputTypeFilter(e.target.value as InputMovementType | '')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Todos los tipos</option>
              <option value="ENTRADA">Entrada</option>
              <option value="SALIDA">Salida</option>
              <option value="AJUSTE">Ajuste</option>
              <option value="RESERVA">Reserva</option>
              <option value="LIBERACION">Liberación</option>
              <option value="CONSUMO">Consumo</option>
              <option value="DEVOLUCION">Devolución</option>
            </select>
          )}
        </div>
      </div>

      {/* Products Table */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                {productsTable.getHeaderGroups().map((headerGroup) => (
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
                {productsTable.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={productColumns.length} className="px-4 py-12 text-center">
                      <ArrowDownUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No hay movimientos de productos</p>
                    </td>
                  </tr>
                ) : (
                  productsTable.getRowModel().rows.map((row) => (
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

          {/* Products Pagination */}
          {productsTable.getRowModel().rows.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                Mostrando{' '}
                <span className="font-medium">
                  {productsTable.getState().pagination.pageIndex * productsTable.getState().pagination.pageSize + 1}
                </span>{' '}
                a{' '}
                <span className="font-medium">
                  {Math.min(
                    (productsTable.getState().pagination.pageIndex + 1) * productsTable.getState().pagination.pageSize,
                    productsTable.getFilteredRowModel().rows.length
                  )}
                </span>{' '}
                de <span className="font-medium">{productsTable.getFilteredRowModel().rows.length}</span> movimientos
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => productsTable.previousPage()}
                  disabled={!productsTable.getCanPreviousPage()}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(productsTable.getPageCount(), 10) }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => productsTable.setPageIndex(page - 1)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        productsTable.getState().pagination.pageIndex === page - 1
                          ? 'bg-orange-500 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  {productsTable.getPageCount() > 10 && (
                    <span className="px-2 py-1 text-gray-500">...</span>
                  )}
                </div>

                <button
                  onClick={() => productsTable.nextPage()}
                  disabled={!productsTable.getCanNextPage()}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inputs Table */}
      {activeTab === 'inputs' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                {inputsTable.getHeaderGroups().map((headerGroup) => (
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
                {inputsTable.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={inputColumns.length} className="px-4 py-12 text-center">
                      <ArrowDownUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No hay movimientos de insumos</p>
                    </td>
                  </tr>
                ) : (
                  inputsTable.getRowModel().rows.map((row) => (
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

          {/* Inputs Pagination */}
          {inputsTable.getRowModel().rows.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                Mostrando{' '}
                <span className="font-medium">
                  {inputsTable.getState().pagination.pageIndex * inputsTable.getState().pagination.pageSize + 1}
                </span>{' '}
                a{' '}
                <span className="font-medium">
                  {Math.min(
                    (inputsTable.getState().pagination.pageIndex + 1) * inputsTable.getState().pagination.pageSize,
                    inputsTable.getFilteredRowModel().rows.length
                  )}
                </span>{' '}
                de <span className="font-medium">{inputsTable.getFilteredRowModel().rows.length}</span> movimientos
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => inputsTable.previousPage()}
                  disabled={!inputsTable.getCanPreviousPage()}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(inputsTable.getPageCount(), 10) }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => inputsTable.setPageIndex(page - 1)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        inputsTable.getState().pagination.pageIndex === page - 1
                          ? 'bg-orange-500 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  {inputsTable.getPageCount() > 10 && (
                    <span className="px-2 py-1 text-gray-500">...</span>
                  )}
                </div>

                <button
                  onClick={() => inputsTable.nextPage()}
                  disabled={!inputsTable.getCanNextPage()}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
