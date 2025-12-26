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
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import * as inventoryService from '../../services/inventory.service';
import type { VariantMovement, MovementType, InventoryStats } from '../../services/inventory.service';

export default function InventoryMovementsPage() {
  const { showToast } = useToast();
  const [movements, setMovements] = useState<VariantMovement[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<MovementType | ''>('');
  const [sorting, setSorting] = useState<SortingState>([]);

  // Load data
  useEffect(() => {
    loadData();
  }, [typeFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [movementsData, statsData] = await Promise.all([
        inventoryService.getMovements({ movementType: typeFilter || undefined }),
        inventoryService.getStats(),
      ]);
      setMovements(movementsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Table columns
  const columns = useMemo<ColumnDef<VariantMovement>[]>(
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

  // Filter data
  const filteredData = useMemo(() => {
    if (!searchTerm) return movements;
    const term = searchTerm.toLowerCase();
    return movements.filter(
      (m) =>
        m.variant?.sku?.toLowerCase().includes(term) ||
        m.variant?.product?.name?.toLowerCase().includes(term) ||
        m.reason?.toLowerCase().includes(term)
    );
  }, [movements, searchTerm]);

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
    initialState: { pagination: { pageSize: 15 } },
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

      {/* Stats */}
      {stats && (
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

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por SKU, producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
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
                    <ArrowDownUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No hay movimientos</p>
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
              {table.getState().pagination.pageIndex * 15 + 1} -{' '}
              {Math.min((table.getState().pagination.pageIndex + 1) * 15, filteredData.length)} de{' '}
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

    </div>
  );
}
