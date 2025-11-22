import type { ProductType } from '../../types/product';
import { Shirt, Wind } from 'lucide-react';

interface ProductSelectorProps {
  selectedType: ProductType;
  onTypeChange: (type: ProductType) => void;
  availableTypes?: ProductType[];
}

const productIcons: Record<ProductType, any> = {
  tshirt: Shirt,
  hoodie: Wind,
  cap: Shirt,
  bottle: Shirt,
  mug: Shirt,
  pillow: Shirt,
};

const productLabels: Record<ProductType, string> = {
  tshirt: 'Camiseta',
  hoodie: 'Hoodie',
  cap: 'Gorra',
  bottle: 'Botella',
  mug: 'Taza',
  pillow: 'Almohada',
};

export const ProductSelector = ({
  selectedType,
  onTypeChange,
  availableTypes = ['tshirt', 'hoodie'],
}: ProductSelectorProps) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-900">Tipo de Producto</label>
      <div className="grid grid-cols-2 gap-3">
        {availableTypes.map((type) => {
          const Icon = productIcons[type];
          return (
            <button
              key={type}
              onClick={() => onTypeChange(type)}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                selectedType === type
                  ? 'border-purple-600 bg-purple-50 text-purple-600'
                  : 'border-gray-300 hover:border-gray-400 text-gray-700'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-sm font-semibold">{productLabels[type]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
