import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Palette, Eye } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useCurrency } from '../../hooks/useCurrency';
import type { Product } from '../../types/product';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onCustomize?: (product: Product) => void;
}

const categoryLabels: Record<string, string> = {
  clothing: 'Ropa',
  accessories: 'Accesorios',
  drinkware: 'Bebidas',
  home: 'Hogar',
  office: 'Oficina',
};

export const ProductCard = ({ product, onAddToCart, onCustomize }: ProductCardProps) => {
  const { settings } = useSettings();
  const { format } = useCurrency();
  const enableCustomizer = settings.home?.enableCustomizer ?? true;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart?.(product);
  };

  const handleCustomize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onCustomize?.(product);
  };

  return (
    <Link
      to={`/catalog/${product.id}`}
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
          {/* Stock Badge */}
          {product.stock < 20 && product.stock > 0 && (
            <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded ml-auto">
              ÚLTIMAS {product.stock}
            </span>
          )}
          {product.stock === 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded ml-auto">
              AGOTADO
            </span>
          )}
        </div>

        {/* Quick Actions - Aparecen al hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="bg-white/90 hover:bg-white text-gray-800 p-2.5 rounded-full transition-all hover:scale-110 shadow-lg"
            title="Ver detalles"
          >
            <Eye className="w-4 h-4" />
          </button>
          {enableCustomizer && (
            <button
              onClick={handleCustomize}
              className="bg-gray-900 hover:bg-gray-800 text-white p-2.5 rounded-full transition-all hover:scale-110 shadow-lg"
              title="Personalizar"
            >
              <Palette className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleAddToCart}
            className="bg-gray-900 hover:bg-gray-800 text-white p-2.5 rounded-full transition-all hover:scale-110 shadow-lg"
            title="Agregar al carrito"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
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

        {/* Colors - Más pequeños */}
        <div className="flex items-center gap-0.5 mb-2">
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

        {/* Price & Stock - Al final */}
        <div className="flex items-end justify-between mt-auto pt-2 border-t border-gray-100">
          <div>
            <span className="text-lg font-bold text-gray-900">
              {format(product.basePrice)}
            </span>
          </div>
          {product.stock > 0 ? (
            <span className="text-[10px] text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">
              En stock
            </span>
          ) : (
            <span className="text-[10px] text-red-600 font-medium bg-red-50 px-1.5 py-0.5 rounded">
              Agotado
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};
