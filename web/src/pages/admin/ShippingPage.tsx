import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../context/OrdersContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Modal } from '../../components/shared/Modal';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../types/order';
import {
  Truck,
  Package,
  Search,
  MapPin,
  Phone,
  User,
  Clock,
  CheckCircle,
  ExternalLink,
  Settings,
} from 'lucide-react';

export const ShippingPage = () => {
  const navigate = useNavigate();
  const { orders, updateOrderStatus, updateTrackingInfo } = useOrders();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState({ number: '', url: '' });
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  // Pedidos listos para despachar (pagados o en preparación)
  const ordersToShip = useMemo(() => {
    return orders.filter(
      (order) => order.status === 'paid' || order.status === 'processing'
    );
  }, [orders]);

  // Pedidos ya enviados
  const shippedOrders = useMemo(() => {
    return orders.filter((order) => order.status === 'shipped');
  }, [orders]);

  // Filtrar por búsqueda
  const filteredOrdersToShip = useMemo(() => {
    if (!searchQuery) return ordersToShip;
    const query = searchQuery.toLowerCase();
    return ordersToShip.filter(
      (order) =>
        order.orderNumber.toLowerCase().includes(query) ||
        order.userName.toLowerCase().includes(query) ||
        order.shipping.city.toLowerCase().includes(query)
    );
  }, [ordersToShip, searchQuery]);

  const filteredShippedOrders = useMemo(() => {
    if (!searchQuery) return shippedOrders;
    const query = searchQuery.toLowerCase();
    return shippedOrders.filter(
      (order) =>
        order.orderNumber.toLowerCase().includes(query) ||
        order.userName.toLowerCase().includes(query) ||
        order.trackingNumber?.toLowerCase().includes(query)
    );
  }, [shippedOrders, searchQuery]);

  const handleOpenTrackingModal = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    setSelectedOrderId(orderId);
    setTrackingData({
      number: order?.trackingNumber || '',
      url: order?.trackingUrl || '',
    });
    setIsTrackingModalOpen(true);
  };

  const handleMarkAsShipped = () => {
    if (!selectedOrderId || !trackingData.number) {
      toast.error('Ingresa el número de guía');
      return;
    }

    updateTrackingInfo(selectedOrderId, trackingData.number, trackingData.url || undefined);
    updateOrderStatus(selectedOrderId, 'shipped');
    toast.success('Pedido marcado como enviado');
    setIsTrackingModalOpen(false);
    setSelectedOrderId(null);
    setTrackingData({ number: '', url: '' });
  };

  const handleMarkAsDelivered = (orderId: string) => {
    updateOrderStatus(orderId, 'delivered');
    toast.success('Pedido marcado como entregado');
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Despacho</h1>
          <p className="text-gray-600 mt-1 text-sm">Gestiona los envíos de pedidos</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Por Despachar</p>
              <p className="text-xl font-bold text-purple-600">{ordersToShip.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Truck className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">En Tránsito</p>
              <p className="text-xl font-bold text-orange-600">{shippedOrders.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Entregados Hoy</p>
              <p className="text-xl font-bold text-green-600">
                {orders.filter(
                  (o) =>
                    o.status === 'delivered' &&
                    o.deliveredAt &&
                    new Date(o.deliveredAt).toDateString() === new Date().toDateString()
                ).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Tiempo Promedio</p>
              <p className="text-xl font-bold text-blue-600">2.5 días</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por número de pedido, cliente, ciudad o guía..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Orders to Ship */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-purple-600" />
          Pedidos por Despachar ({filteredOrdersToShip.length})
        </h2>

        {filteredOrdersToShip.length > 0 ? (
          <div className="grid gap-4">
            {filteredOrdersToShip.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900">{order.orderNumber}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {order.userName}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {order.shipping.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {order.items.reduce((acc, item) => acc + item.quantity, 0)} unidades
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="admin-secondary"
                      onClick={() => navigate(`/admin-panel/orders/${order.id}`)}
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                    <Button onClick={() => handleOpenTrackingModal(order.id)}>
                      <Truck className="w-4 h-4 mr-1" />
                      Despachar
                    </Button>
                  </div>
                </div>

                {/* Dirección de envío */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-gray-900">{order.shipping.address}</p>
                        <p className="text-gray-500">
                          {order.shipping.city}, {order.shipping.postalCode}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{order.shipping.phone}</span>
                    </div>
                  </div>
                  {order.shipping.notes && (
                    <p className="mt-2 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                      <strong>Nota:</strong> {order.shipping.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">¡Todo al día!</h3>
            <p className="text-gray-500">No hay pedidos pendientes de despacho</p>
          </div>
        )}
      </div>

      {/* Shipped Orders */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5 text-orange-600" />
          En Tránsito ({filteredShippedOrders.length})
        </h2>

        {filteredShippedOrders.length > 0 ? (
          <div className="grid gap-4">
            {filteredShippedOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                      <Truck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900">{order.orderNumber}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {order.userName}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {order.shipping.city}
                        </span>
                        {order.trackingNumber && (
                          <span className="flex items-center gap-1 font-mono text-orange-600">
                            Guía: {order.trackingNumber}
                          </span>
                        )}
                      </div>
                      {order.shippedAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          Enviado el {new Date(order.shippedAt).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {order.trackingUrl && (
                      <a
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Rastrear
                      </a>
                    )}
                    <Button
                      variant="admin-secondary"
                      onClick={() => navigate(`/admin-panel/orders/${order.id}`)}
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      variant="admin-primary"
                      onClick={() => handleMarkAsDelivered(order.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Entregado
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sin envíos en tránsito</h3>
            <p className="text-gray-500">Los pedidos enviados aparecerán aquí</p>
          </div>
        )}
      </div>

      {/* Tracking Modal */}
      <Modal
        isOpen={isTrackingModalOpen}
        onClose={() => {
          setIsTrackingModalOpen(false);
          setSelectedOrderId(null);
        }}
        title="Despachar Pedido"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Ingresa la información de envío para marcar este pedido como despachado.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Guía *
            </label>
            <Input
              type="text"
              value={trackingData.number}
              onChange={(e) => setTrackingData({ ...trackingData, number: e.target.value })}
              placeholder="Ej: COL123456789"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL de Seguimiento (opcional)
            </label>
            <Input
              type="url"
              value={trackingData.url}
              onChange={(e) => setTrackingData({ ...trackingData, url: e.target.value })}
              placeholder="https://tracking.example.com/..."
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="admin-secondary"
              onClick={() => {
                setIsTrackingModalOpen(false);
                setSelectedOrderId(null);
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button onClick={handleMarkAsShipped} className="flex-1">
              <Truck className="w-4 h-4 mr-2" />
              Marcar como Enviado
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
