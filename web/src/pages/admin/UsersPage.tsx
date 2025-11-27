import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import { useUsers } from '../../context/UsersContext';
import { Input } from '../../components/shared/Input';
import type { User } from '../../types/user';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Settings,
  UserCheck,
  UserX,
  Check,
  X,
} from 'lucide-react';

const columnHelper = createColumnHelper<User>();

export const UsersPage = () => {
  const navigate = useNavigate();
  const { users } = useUsers();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Filtrar por estado
  const filteredUsers = useMemo(() => {
    if (statusFilter === 'all') return users;
    return users.filter((u) => u.status === statusFilter);
  }, [users, statusFilter]);

  const handleViewUser = (user: User) => {
    navigate(`/admin-panel/users/${user.id}`);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 hover:text-gray-900"
          >
            Cliente
            <ArrowUpDown className="w-4 h-4" />
          </button>
        ),
        cell: (info) => (
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => handleViewUser(info.row.original)}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {info.getValue().charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-medium text-gray-900 hover:text-violet-600 transition-colors">
                {info.getValue()}
              </div>
              <div className="text-sm text-gray-500">{info.row.original.email}</div>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('phone', {
        header: 'Teléfono',
        cell: (info) => (
          <span className="text-gray-600">{info.getValue() || '-'}</span>
        ),
      }),
      columnHelper.accessor('address', {
        header: 'Ciudad',
        cell: (info) => (
          <span className="text-gray-600">{info.getValue()?.city || '-'}</span>
        ),
      }),
      columnHelper.accessor('createdAt', {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 hover:text-gray-900"
          >
            Registro
            <ArrowUpDown className="w-4 h-4" />
          </button>
        ),
        cell: (info) => (
          <span className="text-gray-600">
            {new Date(info.getValue()).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Estado',
        cell: (info) => {
          const status = info.getValue();
          return status === 'active' ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <Check className="w-3 h-3 mr-1" />
              Activo
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <X className="w-3 h-3 mr-1" />
              Inactivo
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <div className="text-right">Acciones</div>,
        cell: (info) => (
          <div className="flex justify-end">
            <button
              onClick={() => handleViewUser(info.row.original)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Ver detalles"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        ),
      }),
    ],
    [navigate]
  );

  const table = useReactTable({
    data: filteredUsers,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Estadísticas
  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === 'active').length,
    inactive: users.filter((u) => u.status === 'inactive').length,
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-600 mt-1 text-sm">Gestiona los clientes registrados</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Activos</p>
              <p className="text-xl font-bold text-green-600">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <UserX className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Inactivos</p>
              <p className="text-xl font-bold text-red-600">{stats.inactive}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'active'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Activos
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'inactive'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Inactivos
          </button>
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
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {globalFilter ? 'No se encontraron usuarios' : 'No hay usuarios'}
                    </h3>
                    <p className="text-gray-500">
                      {globalFilter
                        ? 'Intenta con otra búsqueda'
                        : 'Los usuarios aparecerán aquí cuando se registren'}
                    </p>
                  </td>
                </tr>
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
              de <span className="font-medium">{table.getFilteredRowModel().rows.length}</span> usuarios
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
    </div>
  );
};
