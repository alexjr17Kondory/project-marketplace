import { useNavigate } from 'react-router-dom';
import { usePOS } from '../../context/POSContext';
import OpenSessionPrompt from '../../components/pos/OpenSessionPrompt';
import {
  ShoppingCart,
  Clock,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export default function POSDashboard() {
  const navigate = useNavigate();
  const { currentSession } = usePOS();

  if (!currentSession) {
    return (
      <OpenSessionPrompt
        title="Sin Sesion Activa"
        message="Debes abrir una sesion de caja para comenzar a realizar ventas"
      />
    );
  }

  const sessionDuration = currentSession.openedAt
    ? Math.floor((new Date().getTime() - new Date(currentSession.openedAt).getTime()) / (1000 * 60))
    : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard POS</h1>
        <p className="text-gray-600">
          Resumen de tu sesión actual y acceso rápido a funciones
        </p>
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ventas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {currentSession.salesCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Vendido</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${currentSession.totalSales.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Promedio</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                $
                {currentSession.salesCount > 0
                  ? Math.round(currentSession.totalSales / currentSession.salesCount).toLocaleString()
                  : 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tiempo Abierto</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {Math.floor(sessionDuration / 60)}h {sessionDuration % 60}m
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => navigate('/pos/sale')}
          className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-left group"
        >
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
            <ShoppingCart className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nueva Venta</h3>
          <p className="text-sm text-gray-600">
            Procesar una nueva venta en el punto de venta
          </p>
        </button>

        <button
          onClick={() => navigate('/pos/history')}
          className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-left group"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Historial</h3>
          <p className="text-sm text-gray-600">
            Ver el historial de ventas de tu sesión
          </p>
        </button>

        <button
          onClick={() => navigate('/pos/cash')}
          className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-left group"
        >
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestión de Caja</h3>
          <p className="text-sm text-gray-600">
            Ver detalles y cerrar tu sesión de caja
          </p>
        </button>
      </div>
    </div>
  );
}
