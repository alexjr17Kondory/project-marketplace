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
import { useOrders } from '../../context/OrdersContext';
import { Input } from '../../components/shared/Input';
import type { Order, OrderStatus } from '../../types/order';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../types/order';
import {
  ShoppingBag,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Settings,
  Clock,
  CreditCard,
  Truck,
  CheckCircle,
  Package,
} from 'lucide-react';

const columnHelper = createColumnHelper<Order>();

export const OrdersPage = () => {
  const navigate = useNavigate();
  const { orders } = useOrders();
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  // Filtrar por estado
  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const handleViewOrder = (order: Order) => {
    navigate(`/admin-panel/orders/${order.id}`);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('orderNumber', {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 hover:text-gray-900"
          >
            Pedido
            <ArrowUpDown className="w-4 h-4" />
          </button>
        ),
        cell: (info) => (
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => handleViewOrder(info.row.original)}
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-medium text-gray-900 hover:text-orange-600 transition-colors">
                {info.getValue()}
              </div>
              <div className="text-sm text-gray-500">{info.row.original.items.length} productos</div>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('userName', {
        header: 'Cliente',
        cell: (info) => (
          <div>
            <div className="font-medium text-gray-900">{info.getValue()}</div>
            <div className="text-sm text-gray-500">{info.row.original.userEmail}</div>
          </div>
        ),
      }),
      columnHelper.accessor('total', {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 hover:text-gray-900"
          >
            Total
            <ArrowUpDown className="w-4 h-4" />
          </button>
        ),
        cell: (info) => (
          <span className="font-medium text-gray-900">
            ${info.getValue().toLocaleString()}
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Estado',
        cell: (info) => {
          const status = info.getValue();
          return (
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[status]}`}
            >
              {ORDER_STATUS_LABELS[status]}
            </span>
          );
        },
      }),
      columnHelper.accessor('createdAt', {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 hover:text-gray-900"
          >
            Fecha
            <ArrowUpDown className="w-4 h-4" />
          </button>
        ),
        cell: (info) => (
          <span className="text-gray-600">
            {new Date(info.getValue()).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <div className="text-right">Acciones</div>,
        cell: (info) => (
          <div className="flex justify-end">
            <button
              onClick={() => handleViewOrder(info.row.original)}
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
    data: filteredOrders,
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
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'paid' || o.status === 'processing').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
  };

  const statusFilters: { value: OrderStatus | 'all'; label: string; color: string }[] = [
    { value: 'all', label: 'Todos', color: 'bg-gray-500' },
    { value: 'pending', label: 'Pendientes', color: 'bg-yellow-500' },
    { value: 'paid', label: 'Pagados', color: 'bg-blue-500' },
    { value: 'processing', label: 'En Preparación', color: 'bg-purple-500' },
    { value: 'shipped', label: 'Enviados', color: 'bg-orange-500' },
    { value: 'delivered', label: 'Entregados', color: 'bg-green-500' },
    { value: 'cancelled', label: 'Cancelados', color: 'bg-red-500' },
  ];

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-600 mt-1 text-sm">Gestiona todos los pedidos de la tienda</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pendientes</p>
              <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">En Proceso</p>
              <p className="text-xl font-bold text-purple-600">{stats.processing}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Truck className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Enviados</p>
              <p className="text-xl font-bold text-orange-600">{stats.shipped}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Entregados</p>
              <p className="text-xl font-bold text-green-600">{stats.delivered}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por número de pedido, cliente..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === filter.value
                    ? `${filter.color} text-white`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
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
                    <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {globalFilter || statusFilter !== 'all'
                        ? 'No se encontraron pedidos'
                        : 'No hay pedidos'}
                    </h3>
                    <p className="text-gray-500">
                      {globalFilter || statusFilter !== 'all'
                        ? 'Intenta con otra búsqueda o filtro'
                        : 'Los pedidos aparecerán aquí cuando los clientes compren'}
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
              de <span className="font-medium">{table.getFilteredRowModel().rows.length}</span> pedidos
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
