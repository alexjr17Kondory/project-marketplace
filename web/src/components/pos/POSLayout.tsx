import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  CreditCard,
  History,
  LogOut,
  DollarSign,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePOS } from '../../context/POSContext';
import AppSwitcher from '../common/AppSwitcher';

interface POSLayoutProps {
  children: React.ReactNode;
}

export default function POSLayout({ children }: POSLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { currentSession } = usePOS();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    {
      path: '/pos/sale',
      label: 'Nueva Venta',
      icon: ShoppingCart,
    },
    {
      path: '/pos/history',
      label: 'Historial',
      icon: History,
    },
    {
      path: '/pos/cash',
      label: 'Caja',
      icon: DollarSign,
    },
  ];

  const isActive = (path: string, exact: boolean = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">POS</h1>
              <p className="text-sm text-gray-500">Punto de Venta</p>
            </div>
          </div>

          {/* App Switcher */}
          <div className="mt-4">
            <AppSwitcher />
          </div>
        </div>

        {/* Session Info */}
        {currentSession && (
          <div className="p-4 bg-green-50 border-b border-green-200">
            <div className="text-sm">
              <p className="font-medium text-green-900">Sesión Activa</p>
              <p className="text-green-700">{currentSession.cashRegister?.name}</p>
              <p className="text-green-600 text-xs mt-1">
                {currentSession.salesCount} ventas - $
                {currentSession.totalSales.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {!currentSession && (
          <div className="p-4 bg-yellow-50 border-b border-yellow-200">
            <div className="text-sm">
              <p className="font-medium text-yellow-900">Sin Sesión</p>
              <p className="text-yellow-700 text-xs">
                Debes abrir una sesión de caja
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, item.exact);

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                      ${
                        active
                          ? 'bg-indigo-50 text-indigo-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">Cajero</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-600 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
