import { useNavigate } from 'react-router-dom';
import { ProductCard } from './ProductCard';
import type { Product } from '../../types/product';
import { Package } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  onAddToCart?: (product: Product) => void;
}

export const ProductGrid = ({ products, onAddToCart }: ProductGridProps) => {
  const navigate = useNavigate();

  const handleCustomize = (product: Product) => {
    navigate(`/customizer?product=${product.id}`);
  };

  const handleAddToCartClick = (product: Product) => {
    onAddToCart?.(product);
  };

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="bg-gray-100 rounded-full p-8 mb-6">
          <Package className="w-16 h-16 text-gray-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          No se encontraron productos
        </h3>
        <p className="text-gray-600 text-center max-w-md">
          Intenta ajustar los filtros o buscar con otros términos
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={handleAddToCartClick}
          onCustomize={handleCustomize}
        />
      ))}
    </div>
  );
};
