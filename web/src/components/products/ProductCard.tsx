import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useCurrency } from '../../hooks/useCurrency';
import type { Product } from '../../types/product';

interface ProductCardProps {
  product: Product;
}

const categoryLabels: Record<string, string> = {
  clothing: 'Ropa',
  accessories: 'Accesorios',
  drinkware: 'Bebidas',
  home: 'Hogar',
  office: 'Oficina',
};

export const ProductCard = ({ product }: ProductCardProps) => {
  const { settings } = useSettings();
  const { format } = useCurrency();

  // Colores de marca
  const brandColors = settings.appearance?.brandColors || settings.general.brandColors || {
    primary: '#7c3aed',
    secondary: '#ec4899',
    accent: '#f59e0b',
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className="group bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* Image Container - Más compacto */}
      <div className="relative overflow-hidden aspect-[4/3] bg-gray-50">
        <img
          src={product.images.front}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges container */}
        <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
          {/* Featured Badge */}
          {product.featured && (
            <span className="bg-gray-900 text-white text-[10px] font-bold px-2 py-0.5 rounded">
              DESTACADO
            </span>
          )}
        </div>

        {/* Quick Action - Desktop: hover overlay */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center pointer-events-none">
          <div
            className="text-white px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 font-medium text-sm"
            style={{ backgroundColor: brandColors.primary }}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Agregar</span>
          </div>
        </div>

        {/* Mobile: botón flotante en esquina inferior derecha */}
        <div
          className="md:hidden absolute bottom-2 right-2 text-white p-2.5 rounded-full shadow-lg flex items-center justify-center"
          style={{ backgroundColor: brandColors.primary }}
        >
          <ShoppingCart className="w-4 h-4" />
        </div>
      </div>

      {/* Product Info - Más compacto */}
      <div className="p-3 flex flex-col flex-1">
        {/* Category & Rating */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
            {categoryLabels[product.category] || product.category}
          </span>
          {product.rating && (
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium text-gray-600">
                {product.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Name */}
        <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1.5 line-clamp-2 group-hover:text-gray-700 transition-colors min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Colors */}
        <div className="flex items-center gap-0.5 mb-1.5">
          {product.colors.slice(0, 4).map((color, idx) => (
            <div
              key={idx}
              className="w-3.5 h-3.5 rounded-full border border-gray-200"
              style={{ backgroundColor: color.hexCode }}
              title={color.name}
            />
          ))}
          {product.colors.length > 4 && (
            <span className="text-[10px] text-gray-400 ml-0.5">
              +{product.colors.length - 4}
            </span>
          )}
        </div>

        {/* Sizes */}
        <div className="flex items-center gap-1 mb-2 flex-wrap">
          {product.sizes.slice(0, 4).map((size, idx) => {
            const sizeValue = typeof size === 'string' ? size : size.abbreviation;
            return (
              <span
                key={idx}
                className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-medium"
              >
                {sizeValue}
              </span>
            );
          })}
          {product.sizes.length > 4 && (
            <span className="text-[10px] text-gray-400">
              +{product.sizes.length - 4}
            </span>
          )}
        </div>

        {/* Price - Al final */}
        <div className="mt-auto pt-2 border-t border-gray-100">
          <span className="text-lg font-bold text-gray-900">
            {format(product.basePrice)}
          </span>
        </div>
      </div>
    </Link>
  );
};
