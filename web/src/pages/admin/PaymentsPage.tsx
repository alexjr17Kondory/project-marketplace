import { useState, useEffect } from 'react';
import { usePayments } from '../../context/PaymentsContext';
import type { Payment, PaymentStatus } from '../../services/payments.service';
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Ban,
  RefreshCw,
  Eye,
  DollarSign,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';

// Mapeo de estados a colores y etiquetas
const STATUS_CONFIG: Record<
  PaymentStatus,
  { color: string; bg: string; label: string; icon: React.ReactNode }
> = {
  PENDING: {
    color: 'text-yellow-700',
    bg: 'bg-yellow-100',
    label: 'Pendiente',
    icon: <Clock className="w-4 h-4" />,
  },
  PROCESSING: {
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    label: 'Procesando',
    icon: <RefreshCw className="w-4 h-4" />,
  },
  APPROVED: {
    color: 'text-green-700',
    bg: 'bg-green-100',
    label: 'Aprobado',
    icon: <CheckCircle className="w-4 h-4" />,
  },
  DECLINED: {
    color: 'text-red-700',
    bg: 'bg-red-100',
    label: 'Rechazado',
    icon: <XCircle className="w-4 h-4" />,
  },
  FAILED: {
    color: 'text-red-700',
    bg: 'bg-red-100',
    label: 'Fallido',
    icon: <AlertCircle className="w-4 h-4" />,
  },
  CANCELLED: {
    color: 'text-gray-700',
    bg: 'bg-gray-100',
    label: 'Cancelado',
    icon: <Ban className="w-4 h-4" />,
  },
  EXPIRED: {
    color: 'text-orange-700',
    bg: 'bg-orange-100',
    label: 'Expirado',
    icon: <Clock className="w-4 h-4" />,
  },
  REFUNDED: {
    color: 'text-purple-700',
    bg: 'bg-purple-100',
    label: 'Reembolsado',
    icon: <RefreshCw className="w-4 h-4" />,
  },
  PARTIAL_REFUND: {
    color: 'text-purple-700',
    bg: 'bg-purple-100',
    label: 'Reembolso Parcial',
    icon: <RefreshCw className="w-4 h-4" />,
  },
};

export function PaymentsPage() {
  const { payments, isLoading, pagination, listPayments, setPage, setFilters } = usePayments();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | ''>('');
  const [methodFilter, setMethodFilter] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Debug: Log payments when they change
  useEffect(() => {
    console.log('[PaymentsPage] payments changed:', payments);
    console.log('[PaymentsPage] payments length:', payments?.length);
    console.log('[PaymentsPage] isLoading:', isLoading);
    console.log('[PaymentsPage] pagination:', pagination);
  }, [payments, isLoading, pagination]);

  // Cargar pagos al montar
  useEffect(() => {
    console.log('[PaymentsPage] Component mounted, calling listPayments');
    listPayments();
  }, [listPayments]);

  // Aplicar filtros
  const handleApplyFilters = () => {
    setFilters({
      search: search || undefined,
      status: statusFilter || undefined,
      paymentMethod: methodFilter || undefined,
    });
    // Recargar inmediatamente después de aplicar filtros
    setTimeout(() => listPayments(), 100);
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setMethodFilter('');
    setFilters({});
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Pagos</h1>
        <p className="text-gray-600">
          Administra todos los pagos e intentos de pago de los pedidos
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold">Filtros</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <Input
              type="text"
              placeholder="Orden, transacción, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Todos</option>
              <option value="PENDING">Pendiente</option>
              <option value="PROCESSING">Procesando</option>
              <option value="APPROVED">Aprobado</option>
              <option value="DECLINED">Rechazado</option>
              <option value="FAILED">Fallido</option>
              <option value="CANCELLED">Cancelado</option>
              <option value="EXPIRED">Expirado</option>
              <option value="REFUNDED">Reembolsado</option>
              <option value="PARTIAL_REFUND">Reembolso Parcial</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Método</label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Todos</option>
              <option value="wompi">Wompi</option>
              <option value="transfer">Transferencia</option>
              <option value="cash">Efectivo</option>
              <option value="nequi">Nequi</option>
              <option value="daviplata">Daviplata</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <Button onClick={handleApplyFilters} variant="admin-primary" className="flex-1">
              Aplicar
            </Button>
            <Button onClick={handleClearFilters} variant="admin-secondary">
              Limpiar
            </Button>
          </div>
        </div>
      </div>

      {/* Tabla de Pagos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID / Orden
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Método
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pagador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : !payments || payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No hay pagos registrados
                  </td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const statusConfig = STATUS_CONFIG[payment.status];
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">#{payment.id}</div>
                        <div className="text-sm text-gray-500">{payment.orderNumber}</div>
                        {payment.transactionId && (
                          <div className="text-xs text-gray-400">{payment.transactionId}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}
                        >
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 capitalize">
                          {payment.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </div>
                        {payment.refundedAmount > 0 && (
                          <div className="text-xs text-purple-600">
                            Reembolsado: {formatCurrency(payment.refundedAmount)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{payment.payerName || '-'}</div>
                        <div className="text-xs text-gray-500">{payment.payerEmail || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(payment.initiatedAt)}
                        </div>
                        {payment.paidAt && (
                          <div className="text-xs text-green-600">
                            Pagado: {formatDate(payment.paidAt)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedPayment(payment)}
                          className="text-purple-600 hover:text-purple-900 inline-flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Ver Detalles
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {pagination && pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando{' '}
                  <span className="font-medium">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>{' '}
                  a{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  de <span className="font-medium">{pagination.total}</span> resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPage(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TODO: Modal de detalles del pago */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Detalles del Pago #{selectedPayment.id}</h3>
              <div className="space-y-4">
                <div>
                  <strong>Estado:</strong>{' '}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      STATUS_CONFIG[selectedPayment.status].bg
                    } ${STATUS_CONFIG[selectedPayment.status].color}`}
                  >
                    {STATUS_CONFIG[selectedPayment.status].icon}
                    {STATUS_CONFIG[selectedPayment.status].label}
                  </span>
                </div>
                <div>
                  <strong>Orden:</strong> {selectedPayment.orderNumber}
                </div>
                <div>
                  <strong>Monto:</strong> {formatCurrency(selectedPayment.amount)}
                </div>
                <div>
                  <strong>Método:</strong> {selectedPayment.paymentMethod}
                </div>
                {selectedPayment.transactionId && (
                  <div>
                    <strong>ID Transacción:</strong> {selectedPayment.transactionId}
                  </div>
                )}
                {selectedPayment.notes && (
                  <div>
                    <strong>Notas:</strong> {selectedPayment.notes}
                  </div>
                )}
                {selectedPayment.failureReason && (
                  <div className="text-red-600">
                    <strong>Razón de fallo:</strong> {selectedPayment.failureReason}
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => setSelectedPayment(null)} variant="admin-secondary">
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
