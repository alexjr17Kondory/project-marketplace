import { ArrowUpDown } from 'lucide-react';
import type { ProductSortOption } from '../../types/product';

interface ProductSortProps {
  value: ProductSortOption;
  onChange: (value: ProductSortOption) => void;
}

export const ProductSort = ({ value, onChange }: ProductSortProps) => {
  const sortOptions: { value: ProductSortOption; label: string }[] = [
    { value: 'newest', label: 'Más recientes' },
    { value: 'price-asc', label: 'Precio: Menor a mayor' },
    { value: 'price-desc', label: 'Precio: Mayor a menor' },
    { value: 'name-asc', label: 'Nombre: A-Z' },
    { value: 'name-desc', label: 'Nombre: Z-A' },
    { value: 'rating', label: 'Mejor valorados' },
    { value: 'popular', label: 'Más populares' },
  ];

  return (
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <ArrowUpDown className="w-4 h-4" />
        Ordenar:
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ProductSortOption)}
        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors cursor-pointer"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
