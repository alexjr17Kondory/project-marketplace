import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Palette } from 'lucide-react';
import { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onCustomize?: (product: Product) => void;
}

export const ProductCard = ({ product, onAddToCart, onCustomize }: ProductCardProps) => {
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    onAddToCart?.(product);
  };

  const handleCustomize = (e: React.MouseEvent) => {
    e.preventDefault();
    onCustomize?.(product);
  };

  return (
    <Link
      to={`/catalog/${product.id}`}
      className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      {/* Image Container */}
      <div className="relative overflow-hidden aspect-square bg-gray-100">
        <img
          src={product.images.front}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />

        {/* Badge */}
        {product.featured && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            Destacado
          </div>
        )}

        {/* Stock Badge */}
        {product.stock < 20 && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            ¡Últimas unidades!
          </div>
        )}

        {/* Quick Actions */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex gap-2">
            <button
              onClick={handleCustomize}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Palette className="w-4 h-4" />
              Personalizar
            </button>
            <button
              onClick={handleAddToCart}
              className="bg-white hover:bg-gray-100 text-gray-800 p-2 rounded-lg transition-colors"
              title="Agregar al carrito"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Category */}
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          {product.category === 'clothing' && 'Ropa'}
          {product.category === 'accessories' && 'Accesorios'}
          {product.category === 'home' && 'Hogar'}
        </p>

        {/* Name */}
        <h3 className="font-bold text-gray-800 text-lg mb-2 line-clamp-1 group-hover:text-purple-600 transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold text-gray-700 ml-1">
                {product.rating.toFixed(1)}
              </span>
            </div>
            {product.reviewsCount && (
              <span className="text-xs text-gray-500">
                ({product.reviewsCount})
              </span>
            )}
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {product.description}
        </p>

        {/* Colors */}
        <div className="flex items-center gap-1 mb-3">
          <span className="text-xs text-gray-500 mr-1">Colores:</span>
          <div className="flex gap-1">
            {product.colors.slice(0, 5).map((color, idx) => (
              <div
                key={idx}
                className="w-5 h-5 rounded-full border-2 border-gray-200 shadow-sm"
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
            {product.colors.length > 5 && (
              <div className="w-5 h-5 rounded-full border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                <span className="text-xs text-gray-600">+{product.colors.length - 5}</span>
              </div>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-gray-900">
              ${product.basePrice.toFixed(2)}
            </span>
            <span className="text-sm text-gray-500 ml-1">USD</span>
          </div>
          {product.stock > 0 ? (
            <span className="text-xs text-green-600 font-semibold">
              En stock
            </span>
          ) : (
            <span className="text-xs text-red-600 font-semibold">
              Agotado
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};
