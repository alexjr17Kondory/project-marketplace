import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { ProductCategory, ProductType } from '../../types';

interface ProductFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
}

export interface FilterValues {
  category?: ProductCategory;
  type?: ProductType;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
}

export const ProductFilters = ({ onFilterChange }: ProductFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({});

  const categories: { value: ProductCategory; label: string }[] = [
    { value: 'clothing', label: 'Ropa' },
    { value: 'accessories', label: 'Accesorios' },
    { value: 'home', label: 'Hogar' },
  ];

  const types: { value: ProductType; label: string }[] = [
    { value: 'tshirt', label: 'Camisetas' },
    { value: 'hoodie', label: 'Hoodies' },
    { value: 'cap', label: 'Gorras' },
    { value: 'bottle', label: 'Botellas' },
    { value: 'mug', label: 'Tazas' },
    { value: 'pillow', label: 'Almohadas' },
  ];

  const handleFilterChange = (key: keyof FilterValues, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilter = (key: keyof FilterValues) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const activeFiltersCount = Object.keys(filters).length;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header - Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full md:hidden flex items-center justify-between p-4 font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filtros
          {activeFiltersCount > 0 && (
            <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <span className="text-sm text-gray-500">
          {isOpen ? 'Ocultar' : 'Mostrar'}
        </span>
      </button>

      {/* Filters Content */}
      <div className={`p-4 space-y-6 ${isOpen ? 'block' : 'hidden'} md:block`}>
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Categoría
          </label>
          <div className="space-y-2">
            {categories.map((category) => (
              <label
                key={category.value}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <input
                  type="radio"
                  name="category"
                  value={category.value}
                  checked={filters.category === category.value}
                  onChange={(e) => handleFilterChange('category', e.target.value as ProductCategory)}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-gray-700 group-hover:text-purple-600 transition-colors">
                  {category.label}
                </span>
              </label>
            ))}
          </div>
          {filters.category && (
            <button
              onClick={() => clearFilter('category')}
              className="mt-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Type Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Tipo de Producto
          </label>
          <div className="space-y-2">
            {types.map((type) => (
              <label
                key={type.value}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={filters.type === type.value}
                  onChange={(e) =>
                    handleFilterChange('type', e.target.checked ? type.value : undefined)
                  }
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded"
                />
                <span className="text-gray-700 group-hover:text-purple-600 transition-colors">
                  {type.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Rango de Precio
          </label>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Mínimo</label>
              <input
                type="number"
                min="0"
                placeholder="$0"
                value={filters.minPrice || ''}
                onChange={(e) =>
                  handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Máximo</label>
              <input
                type="number"
                min="0"
                placeholder="$100"
                value={filters.maxPrice || ''}
                onChange={(e) =>
                  handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Stock Filter */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.inStock || false}
              onChange={(e) => handleFilterChange('inStock', e.target.checked || undefined)}
              className="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded"
            />
            <span className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
              Solo productos en stock
            </span>
          </label>
        </div>

        {/* Featured Filter */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.featured || false}
              onChange={(e) => handleFilterChange('featured', e.target.checked || undefined)}
              className="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded"
            />
            <span className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
              Solo destacados
            </span>
          </label>
        </div>

        {/* Clear All Button */}
        {activeFiltersCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Limpiar todos los filtros
          </button>
        )}
      </div>
    </div>
  );
};
