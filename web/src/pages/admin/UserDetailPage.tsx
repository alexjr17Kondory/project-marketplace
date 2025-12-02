import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUsers } from '../../context/UsersContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import type { User } from '../../types/user';
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  ShoppingBag,
  Clock,
  Check,
  X,
  Edit2,
  Save,
  Package,
  Building2,
  Loader2,
} from 'lucide-react';

type TabType = 'profile' | 'addresses' | 'orders' | 'activity';

export const UserDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getUserById, updateUser, toggleUserStatus } = useUsers();
  const toast = useToast();

  const [user, setUser] = useState<User | undefined>(undefined);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Cargar usuario al montar
  useEffect(() => {
    const loadUser = async () => {
      if (!id) {
        setIsLoadingUser(false);
        return;
      }
      setIsLoadingUser(true);
      try {
        const data = await getUserById(id);
        setUser(data);
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoadingUser(false);
      }
    };
    loadUser();
  }, [id, getUserById]);

  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    cedula: '',
  });

  // Actualizar formData cuando user cambie
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        cedula: user.cedula || '',
      });
    }
  }, [user]);

  // Direcciones mock para demostración
  const [addresses] = useState([
    {
      id: '1',
      label: 'Casa',
      address: user?.address?.address || 'Calle 123 #45-67',
      city: user?.address?.city || 'Bogotá',
      postalCode: user?.address?.postalCode || '110111',
      country: user?.address?.country || 'Colombia',
      isDefault: true,
    },
  ]);

  // Pedidos mock para demostración
  const [orders] = useState([
    {
      id: 'ORD-001',
      date: new Date('2024-11-20'),
      status: 'completed',
      total: 125000,
      items: 3,
    },
    {
      id: 'ORD-002',
      date: new Date('2024-11-15'),
      status: 'processing',
      total: 89000,
      items: 2,
    },
    {
      id: 'ORD-003',
      date: new Date('2024-10-28'),
      status: 'completed',
      total: 245000,
      items: 5,
    },
  ]);

  // Actividad mock para demostración
  const [activities] = useState([
    { id: '1', action: 'Inicio de sesión', date: new Date('2024-11-25T10:30:00'), ip: '192.168.1.1' },
    { id: '2', action: 'Actualizó perfil', date: new Date('2024-11-24T15:45:00'), ip: '192.168.1.1' },
    { id: '3', action: 'Realizó pedido ORD-001', date: new Date('2024-11-20T14:20:00'), ip: '192.168.1.1' },
    { id: '4', action: 'Agregó dirección de envío', date: new Date('2024-11-18T09:15:00'), ip: '192.168.1.1' },
    { id: '5', action: 'Registro de cuenta', date: new Date('2024-11-10T11:00:00'), ip: '192.168.1.1' },
  ]);

  // Estado de carga
  if (isLoadingUser) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <span className="ml-2 text-gray-600">Cargando usuario...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 md:p-8">
        <div className="text-center py-12">
          <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Usuario no encontrado</h2>
          <p className="text-gray-600 mb-4">El usuario que buscas no existe o fue eliminado</p>
          <Button onClick={() => navigate('/admin-panel/users')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Usuarios
          </Button>
        </div>
      </div>
    );
  }

  const handleSaveProfile = () => {
    updateUser(user.id, {
      name: formData.name,
      phone: formData.phone || undefined,
      cedula: formData.cedula || undefined,
    });
    toast.success('Perfil actualizado correctamente');
    setIsEditing(false);
  };

  const handleToggleStatus = () => {
    toggleUserStatus(user.id);
    toast.success(
      user.status === 'active'
        ? 'Usuario desactivado correctamente'
        : 'Usuario activado correctamente'
    );
  };

  const tabs = [
    { id: 'profile' as TabType, label: 'Perfil', icon: UserIcon },
    { id: 'addresses' as TabType, label: 'Direcciones', icon: MapPin },
    { id: 'orders' as TabType, label: 'Pedidos', icon: ShoppingBag },
    { id: 'activity' as TabType, label: 'Actividad', icon: Clock },
  ];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      completed: 'Completado',
      processing: 'En proceso',
      pending: 'Pendiente',
      cancelled: 'Cancelado',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin-panel/users')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Detalle del Usuario</h1>
            <p className="text-gray-600 mt-1 text-sm">Gestiona la información del cliente</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={user.status === 'active' ? 'admin-danger' : 'admin-primary'}
            onClick={handleToggleStatus}
          >
            {user.status === 'active' ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Desactivar
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Activar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* User Header Card */}
      <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
        <div className="bg-gradient-to-br from-violet-600 via-pink-500 to-amber-500 px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold bg-gradient-to-br from-violet-600 to-pink-500 bg-clip-text text-transparent">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-white">{user.name}</h2>
              <p className="text-violet-100">{user.email}</p>
              <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    user.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {user.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
                <span className="text-white/80 text-sm">
                  Cliente desde {new Date(user.createdAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-gray-200 border-b border-gray-200">
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            <p className="text-xs text-gray-500">Pedidos</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              ${orders.reduce((acc, o) => acc + o.total, 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">Total Gastado</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{addresses.length}</p>
            <p className="text-xs text-gray-500">Direcciones</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Información Personal</h3>
              {!isEditing ? (
                <Button variant="admin-secondary" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="admin-secondary" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveProfile}>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <UserIcon className="w-4 h-4" />
                  Nombre Completo
                </label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">{user.name}</div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">{user.email}</div>
                <p className="text-xs text-gray-500 mt-1">El email no se puede modificar</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4" />
                  Teléfono
                </label>
                {isEditing ? (
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+57 300 123 4567"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                    {user.phone || 'No especificado'}
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <CreditCard className="w-4 h-4" />
                  Cédula / Documento
                </label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={formData.cedula}
                    onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                    placeholder="1234567890"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                    {user.cedula || 'No especificado'}
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4" />
                  Fecha de Registro
                </label>
                <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4" />
                  Última Actualización
                </label>
                <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                  {new Date(user.updatedAt).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Direcciones de Envío</h3>
            </div>

            {addresses.length > 0 ? (
              <div className="grid gap-4">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className={`p-4 rounded-lg border-2 ${
                      address.isDefault ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Building2 className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{address.label}</h4>
                          {address.isDefault && (
                            <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                              Principal
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mt-1">{address.address}</p>
                        <p className="text-gray-500 text-sm">
                          {address.city}, {address.postalCode} - {address.country}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sin direcciones</h3>
                <p className="text-gray-500">El usuario no tiene direcciones registradas</p>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Historial de Pedidos</h3>
            </div>

            {orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Pedido
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Items
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{order.id}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-600">
                          {order.date.toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-4 text-gray-600">{order.items} productos</td>
                        <td className="px-4 py-4 font-medium text-gray-900">
                          ${order.total.toLocaleString()}
                        </td>
                        <td className="px-4 py-4">{getStatusBadge(order.status)}</td>
                        <td className="px-4 py-4 text-right">
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sin pedidos</h3>
                <p className="text-gray-500">El usuario no ha realizado ningún pedido</p>
              </div>
            )}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Registro de Actividad</h3>
            </div>

            {activities.length > 0 ? (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                <div className="space-y-6">
                  {activities.map((activity, index) => (
                    <div key={activity.id} className="relative flex gap-4 pl-10">
                      <div
                        className={`absolute left-2 w-4 h-4 rounded-full border-2 ${
                          index === 0
                            ? 'bg-orange-500 border-orange-500'
                            : 'bg-white border-gray-300'
                        }`}
                      />
                      <div className="flex-1 bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{activity.action}</p>
                            <p className="text-sm text-gray-500">IP: {activity.ip}</p>
                          </div>
                          <span className="text-sm text-gray-500">
                            {activity.date.toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sin actividad</h3>
                <p className="text-gray-500">No hay registros de actividad para este usuario</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
