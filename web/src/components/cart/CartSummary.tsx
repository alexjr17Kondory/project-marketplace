import { ShoppingBag, Truck, Receipt, Tag } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';
import type { Cart } from '../../types/cart';

interface CartSummaryProps {
  cart: Cart;
  onCheckout?: () => void;
}

export const CartSummary = ({ cart, onCheckout }: CartSummaryProps) => {
  const { format } = useCurrency();
  const hasItems = cart.items.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Receipt className="w-5 h-5 text-gray-600" />
        Resumen de Compra
      </h2>

      <div className="space-y-4 mb-6">
        {/* Total de items */}
        <div className="flex items-center justify-between text-gray-600">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            <span>Productos ({cart.totalItems})</span>
          </div>
          <span className="font-semibold text-gray-900">
            {format(cart.subtotal)}
          </span>
        </div>

        {/* Envío */}
        <div className="flex items-center justify-between text-gray-600">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            <span>Envío</span>
          </div>
          {cart.shipping === 0 ? (
            <span className="font-semibold text-green-600">GRATIS</span>
          ) : (
            <span className="font-semibold text-gray-900">
              {format(cart.shipping)}
            </span>
          )}
        </div>

        {cart.subtotal > 0 && cart.subtotal < 100000 && (
          <p className="text-xs text-gray-500 pl-6">
            Agrega {format(100000 - cart.subtotal)} más para envío gratis
          </p>
        )}

        {/* Impuestos */}
        <div className="flex items-center justify-between text-gray-600">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            <span>Impuestos (19%)</span>
          </div>
          <span className="font-semibold text-gray-900">
            {format(cart.tax)}
          </span>
        </div>

        {/* Descuento (si aplica) */}
        {cart.discount > 0 && (
          <div className="flex items-center justify-between text-green-600">
            <span>Descuento</span>
            <span className="font-semibold">-{format(cart.discount)}</span>
          </div>
        )}
      </div>

      {/* Divisor */}
      <div className="border-t border-gray-200 pt-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">Total</span>
          <span className="text-2xl font-bold text-gray-900">
            {format(cart.total)}
          </span>
        </div>
      </div>

      {/* Botón de checkout */}
      {onCheckout && (
        <button
          onClick={onCheckout}
          disabled={!hasItems}
          className="w-full bg-gray-800 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
        >
          {hasItems ? 'Proceder al Pago' : 'Carrito Vacío'}
        </button>
      )}

      {!hasItems && (
        <p className="text-center text-sm text-gray-500 mt-4">
          Agrega productos al carrito para continuar
        </p>
      )}

      {/* Nota de fase 1 */}
      {hasItems && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800 text-center">
            El proceso de pago se implementará en la Fase 3
          </p>
        </div>
      )}

      {/* Políticas */}
      <div className="mt-6 pt-6 border-t border-gray-200 space-y-2 text-xs text-gray-500">
        <p className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
          Envío gratis en compras mayores a {format(100000)}
        </p>
        <p className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
          Devoluciones gratuitas en 30 días
        </p>
        <p className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
          Garantía de satisfacción 100%
        </p>
      </div>
    </div>
  );
};
