import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';
import type { CartItem as CartItemType } from '../../types/cart';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

export const CartItem = ({ item, onUpdateQuantity, onRemove }: CartItemProps) => {
  const { format } = useCurrency();

  const handleDecrease = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.id, item.quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (item.quantity < 99) {
      onUpdateQuantity(item.id, item.quantity + 1);
    }
  };

  return (
    <div className="flex gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      {/* Imagen del producto */}
      <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
        <img
          src={item.product.images.front}
          alt={item.product.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Información del producto */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 mb-1">{item.product.name}</h3>
        <p className="text-sm text-gray-600 mb-2">{item.product.description}</p>

        <div className="flex flex-wrap gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Color:</span>
            <div className="flex items-center gap-1">
              <div
                className="w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: item.selectedColor }}
              />
              <span className="text-gray-700">{item.selectedColor}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500">Talla:</span>
            <span className="font-medium text-gray-700">{item.selectedSize}</span>
          </div>
        </div>
      </div>

      {/* Precio y controles */}
      <div className="flex flex-col items-end justify-between">
        <button
          onClick={() => onRemove(item.id)}
          className="text-gray-400 hover:text-red-500 transition-colors p-1"
          aria-label="Eliminar producto"
        >
          <Trash2 className="w-5 h-5" />
        </button>

        <div className="text-right">
          <p className="text-sm text-gray-500 mb-2">
            {format(item.price)} c/u
          </p>
          <p className="text-lg font-bold text-gray-900">
            {format(item.subtotal)}
          </p>
        </div>

        {/* Control de cantidad */}
        <div className="flex items-center gap-2 border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={handleDecrease}
            disabled={item.quantity <= 1}
            className="px-2 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Disminuir cantidad"
          >
            <Minus className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 font-semibold text-gray-900 min-w-[2rem] text-center">
            {item.quantity}
          </span>

          <button
            onClick={handleIncrease}
            disabled={item.quantity >= 99}
            className="px-2 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Aumentar cantidad"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
