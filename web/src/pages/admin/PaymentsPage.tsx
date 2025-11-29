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
import { useSettings } from '../../context/SettingsContext';
import { Input } from '../../components/shared/Input';
import type { Order, PaymentMethod } from '../../types/order';
import { PAYMENT_METHOD_LABELS } from '../../types/order';
import {
  CreditCard,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Eye,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  Building2,
  Banknote,
  Store,
  TrendingUp,
  Calendar,
  Filter,
} from 'lucide-react';

const columnHelper = createColumnHelper<Order>();

// Iconos según método de pago
const getPaymentIcon = (method: PaymentMethod) => {
  switch (method) {
    case 'wompi':
      return <Zap className="w-4 h-4" />;
    case 'transfer':
      return <Building2 className="w-4 h-4" />;
    case 'cash':
      return <Banknote className="w-4 h-4" />;
    case 'pickup':
      return <Store className="w-4 h-4" />;
    default:
      return <CreditCard className="w-4 h-4" />;
  }
};

// Color del estado de pago
const getPaymentStatusInfo = (order: Order) => {
  if (order.status === 'cancelled') {
    return { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: XCircle };
  }
  if (order.status === 'pending') {
    return { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', icon: Clock };
  }
  return { label: 'Pagado', color: 'bg-green-100 text-green-700', icon: CheckCircle };
};

export const PaymentsPage = () => {
  const navigate = useNavigate();
  const { orders } = useOrders();
  const { settings } = useSettings();
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentMethod | 'all'>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'pending' | 'paid' | 'cancelled'>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Filtrar órdenes
  const filteredOrders = useMemo(() => {
    let result = orders;

    // Filtro por método de pago
    if (paymentMethodFilter !== 'all') {
      result = result.filter((o) => o.paymentMethod === paymentMethodFilter);
    }

    // Filtro por estado de pago
    if (paymentStatusFilter !== 'all') {
      if (paymentStatusFilter === 'pending') {
        result = result.filter((o) => o.status === 'pending');
      } else if (paymentStatusFilter === 'paid') {
        result = result.filter((o) => o.status !== 'pending' && o.status !== 'cancelled');
      } else if (paymentStatusFilter === 'cancelled') {
        result = result.filter((o) => o.status === 'cancelled');
      }
    }

    // Filtro por rango de fecha
    if (dateRange !== 'all') {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (dateRange === 'today') {
        result = result.filter((o) => new Date(o.createdAt) >= startOfDay);
      } else if (dateRange === 'week') {
        const weekAgo = new Date(startOfDay);
        weekAgo.setDate(weekAgo.getDate() - 7);
        result = result.filter((o) => new Date(o.createdAt) >= weekAgo);
      } else if (dateRange === 'month') {
        const monthAgo = new Date(startOfDay);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        result = result.filter((o) => new Date(o.createdAt) >= monthAgo);
      }
    }

    return result;
  }, [orders, paymentMethodFilter, paymentStatusFilter, dateRange]);

  // Estadísticas
  const stats = useMemo(() => {
    const paid = orders.filter((o) => o.status !== 'pending' && o.status !== 'cancelled');
    const pending = orders.filter((o) => o.status === 'pending');
    const cancelled = orders.filter((o) => o.status === 'cancelled');

    const totalRevenue = paid.reduce((sum, o) => sum + o.total, 0);
    const pendingRevenue = pending.reduce((sum, o) => sum + o.total, 0);

    // Por método de pago
    const byMethod: Record<string, { count: number; total: number }> = {};
    orders.forEach((o) => {
      if (!byMethod[o.paymentMethod]) {
        byMethod[o.paymentMethod] = { count: 0, total: 0 };
      }
      byMethod[o.paymentMethod].count++;
      if (o.status !== 'pending' && o.status !== 'cancelled') {
        byMethod[o.paymentMethod].total += o.total;
      }
    });

    return {
      totalOrders: orders.length,
      paidOrders: paid.length,
      pendingOrders: pending.length,
      cancelledOrders: cancelled.length,
      totalRevenue,
      pendingRevenue,
      byMethod,
    };
  }, [orders]);

  const handleViewOrder = (order: Order) => {
    navigate(`/admin-panel/orders/${order.id}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: settings.general.currency || 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('orderNumber', {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 hover:text-gray-900"
          >
            Referencia
            <ArrowUpDown className="w-4 h-4" />
          </button>
        ),
        cell: (info) => (
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => handleViewOrder(info.row.original)}
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-medium text-gray-900 hover:text-green-600 transition-colors">
                {info.getValue()}
              </div>
              <div className="text-sm text-gray-500">
                {info.row.original.paymentReference || 'Sin referencia'}
              </div>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('paymentMethod', {
        header: 'Método',
        cell: (info) => {
          const method = info.getValue();
          return (
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-100 rounded-lg">
                {getPaymentIcon(method)}
              </div>
              <span className="text-sm font-medium text-gray-700">
                {PAYMENT_METHOD_LABELS[method]}
              </span>
            </div>
          );
        },
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
            Monto
            <ArrowUpDown className="w-4 h-4" />
          </button>
        ),
        cell: (info) => (
          <span className="font-bold text-gray-900">
            {formatCurrency(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Estado Pago',
        cell: (info) => {
          const statusInfo = getPaymentStatusInfo(info.row.original);
          const Icon = statusInfo.icon;
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {statusInfo.label}
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
          <span className="text-gray-600 text-sm">
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
              <Eye className="w-4 h-4" />
            </button>
          </div>
        ),
      }),
    ],
    [navigate, settings.general.currency]
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

  // Métodos de pago activos
  const activePaymentMethods = settings.payment.methods.filter((m) => m.isActive);

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Pagos</h1>
          <p className="text-gray-600 mt-1 text-sm">Gestión de transacciones y pagos</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ingresos Totales</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(stats.totalRevenue)}
              </p>
              <p className="text-xs text-gray-400 mt-1">{stats.paidOrders} pagos confirmados</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pagos Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {formatCurrency(stats.pendingRevenue)}
              </p>
              <p className="text-xs text-gray-400 mt-1">{stats.pendingOrders} órdenes</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-xl">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pagos Confirmados</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.paidOrders}</p>
              <p className="text-xs text-gray-400 mt-1">
                {stats.totalOrders > 0
                  ? `${Math.round((stats.paidOrders / stats.totalOrders) * 100)}% del total`
                  : '0%'}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Cancelados</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.cancelledOrders}</p>
              <p className="text-xs text-gray-400 mt-1">
                {stats.totalOrders > 0
                  ? `${Math.round((stats.cancelledOrders / stats.totalOrders) * 100)}% del total`
                  : '0%'}
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Resumen por Método de Pago */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Resumen por Método de Pago
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {activePaymentMethods.map((method) => {
            const methodStats = stats.byMethod[method.type] || { count: 0, total: 0 };
            return (
              <div
                key={method.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  {getPaymentIcon(method.type as PaymentMethod)}
                </div>
                <div>
                  <p className="text-xs text-gray-500">{method.name}</p>
                  <p className="font-bold text-gray-900">{methodStats.count}</p>
                  <p className="text-xs text-green-600">{formatCurrency(methodStats.total)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por referencia, cliente..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtro por método de pago */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value as PaymentMethod | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Todos los métodos</option>
              {activePaymentMethods.map((method) => (
                <option key={method.id} value={method.type}>
                  {method.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por estado */}
          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value as 'all' | 'pending' | 'paid' | 'cancelled')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="paid">Pagados</option>
            <option value="cancelled">Cancelados</option>
          </select>

          {/* Filtro por fecha */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as 'all' | 'today' | 'week' | 'month')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Todo el tiempo</option>
              <option value="today">Hoy</option>
              <option value="week">Última semana</option>
              <option value="month">Último mes</option>
            </select>
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
                    <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {globalFilter || paymentMethodFilter !== 'all' || paymentStatusFilter !== 'all'
                        ? 'No se encontraron pagos'
                        : 'No hay pagos registrados'}
                    </h3>
                    <p className="text-gray-500">
                      {globalFilter || paymentMethodFilter !== 'all' || paymentStatusFilter !== 'all'
                        ? 'Intenta con otros filtros'
                        : 'Los pagos aparecerán aquí cuando los clientes realicen compras'}
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
              de <span className="font-medium">{table.getFilteredRowModel().rows.length}</span> pagos
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
                {Array.from({ length: Math.min(table.getPageCount(), 5) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => table.setPageIndex(page - 1)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      table.getState().pagination.pageIndex === page - 1
                        ? 'bg-green-500 text-white'
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
