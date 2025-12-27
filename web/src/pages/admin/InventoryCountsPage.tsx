import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ClipboardList,
  Plus,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
} from 'lucide-react';
import { Button } from '../../components/shared/Button';
import { useToast } from '../../context/ToastContext';
import * as inventoryCountsService from '../../services/inventory-counts.service';
import type {
  InventoryCount,
  InventoryCountStatus,
  InventoryCountStats,
} from '../../services/inventory-counts.service';

export default function InventoryCountsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [counts, setCounts] = useState<InventoryCount[]>([]);
  const [stats, setStats] = useState<InventoryCountStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InventoryCountStatus | ''>('');
  const [sorting, setSorting] = useState<SortingState>([]);

  // Load data
  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [countsData, statsData] = await Promise.all([
        inventoryCountsService.getInventoryCounts({ status: statusFilter || undefined }),
        inventoryCountsService.getStats(),
      ]);
      setCounts(countsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Navigate to create page
  const handleCreate = () => {
    navigate('/admin-panel/inventory-counts/new');
  };

  // Navigate to view/edit page
  const handleView = (count: InventoryCount) => {
    navigate(`/admin-panel/inventory-counts/${count.id}`);
  };

  // Table columns
  const columns = useMemo<ColumnDef<InventoryCount>[]>(
    () => [
      {
        accessorKey: 'countNumber',
        header: '# Conteo',
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium text-gray-900">
            {row.original.countNumber}
          </span>
        ),
      },
      {
        accessorKey: 'countType',
        header: 'Tipo',
        cell: ({ row }) => (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            row.original.countType === 'FULL'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {inventoryCountsService.TYPE_LABELS[row.original.countType]}
          </span>
        ),
      },
      {
        accessorKey: 'countDate',
        header: 'Fecha',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(row.original.countDate).toLocaleDateString()}
          </div>
        ),
      },
      {
        accessorKey: 'totalItems',
        header: 'Items',
        cell: ({ row }) => (
          <div className="text-sm">
            <span className="font-medium text-gray-900">{row.original.totalItems}</span>
            {row.original.itemsWithDiff > 0 && (
              <span className="ml-1 text-xs text-orange-600">
                ({row.original.itemsWithDiff} con diferencia)
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'countedByName',
        header: 'Contado por',
        cell: ({ row }) => (
          <span className="text-sm text-gray-600">
            {row.original.countedByName || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              inventoryCountsService.STATUS_COLORS[row.original.status]
            }`}
          >
            {inventoryCountsService.STATUS_LABELS[row.original.status]}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Acciones</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end">
            <button
              onClick={() => handleView(row.original)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Ver detalle"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  // Filter data
  const filteredData = useMemo(() => {
    if (!searchTerm) return counts;
    const term = searchTerm.toLowerCase();
    return counts.filter(
      (c) =>
        c.countNumber.toLowerCase().includes(term) ||
        (c.countedByName && c.countedByName.toLowerCase().includes(term))
    );
  }, [counts, searchTerm]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conteo de Inventario</h1>
          <p className="text-sm text-gray-500 mt-1">
            Conteo físico periódico de insumos consumibles
          </p>
        </div>
        <Button onClick={handleCreate} variant="admin-orange" size="sm">
          <Plus className="w-4 h-4" />
          Nuevo Conteo
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Conteos</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Borradores</p>
            <p className="text-2xl font-bold text-gray-600">{stats.byStatus.DRAFT}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">En Progreso</p>
            <p className="text-2xl font-bold text-blue-600">{stats.byStatus.IN_PROGRESS}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Pendientes Aprob.</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.byStatus.PENDING_APPROVAL}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Último Conteo</p>
            <p className="text-lg font-bold text-green-600">
              {stats.lastCount
                ? new Date(stats.lastCount).toLocaleDateString()
                : 'Nunca'}
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
              placeholder="Buscar por número o usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as InventoryCountStatus | '')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Todos los estados</option>
            <option value="DRAFT">Borrador</option>
            <option value="IN_PROGRESS">En Progreso</option>
            <option value="PENDING_APPROVAL">Pendiente Aprobación</option>
            <option value="APPROVED">Aprobado</option>
            <option value="CANCELLED">Cancelado</option>
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
                    <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No hay conteos de inventario</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Crea un nuevo conteo para verificar el inventario físico
                    </p>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleView(row.original)}
                  >
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
    </div>
  );
}
