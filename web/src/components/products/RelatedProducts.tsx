import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import productsService from '../../services/products.service';
import type { Product } from '../../types/product';

interface RelatedProductsProps {
  product: Product;
  limit?: number;
}

export function RelatedProducts({ product, limit = 8 }: RelatedProductsProps) {
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      setLoading(true);
      try {
        // Obtener productos de la misma categoría
        const response = await productsService.getAll({
          category: product.categorySlug || product.category,
          limit: limit + 5, // Pedir más para filtrar
        });

        // Filtrar el producto actual
        let filtered = response.data.filter(p => p.id !== product.id);

        // Ordenar por cantidad de tags coincidentes
        if (product.tags && product.tags.length > 0) {
          filtered.sort((a, b) => {
            const aMatches = a.tags?.filter(t => product.tags?.includes(t)).length || 0;
            const bMatches = b.tags?.filter(t => product.tags?.includes(t)).length || 0;
            return bMatches - aMatches;
          });
        }

        // Limitar resultados
        setRelatedProducts(filtered.slice(0, limit));
      } catch (error) {
        console.error('Error fetching related products:', error);
        setRelatedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [product.id, product.categorySlug, product.category, product.tags, limit]);

  // No mostrar si no hay productos relacionados
  if (!loading && relatedProducts.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Productos relacionados</h2>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {relatedProducts.map((relatedProduct) => (
            <RelatedProductCard key={relatedProduct.id} product={relatedProduct} />
          ))}
        </div>
      )}
    </div>
  );
}

// Card simplificada para productos relacionados
function RelatedProductCard({ product }: { product: Product }) {
  const imageUrl = product.images.front || '/placeholder-product.png';

  return (
    <Link
      to={`/product/${product.id}`}
      className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
    >
      {/* Imagen */}
      <div className="aspect-square bg-gray-100 overflow-hidden">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 group-hover:text-gray-700">
          {product.name}
        </h3>

        {/* Colores disponibles */}
        {product.colors && product.colors.length > 0 && (
          <div className="flex gap-1 mb-2">
            {product.colors.slice(0, 4).map((color) => (
              <span
                key={color.hexCode}
                className="w-4 h-4 rounded-full border border-gray-200"
                style={{ backgroundColor: color.hexCode }}
                title={color.name}
              />
            ))}
            {product.colors.length > 4 && (
              <span className="text-xs text-gray-400">+{product.colors.length - 4}</span>
            )}
          </div>
        )}

        {/* Precio */}
        <p className="text-sm font-bold text-gray-900">
          ${product.basePrice.toLocaleString('es-CO')}
        </p>
      </div>
    </Link>
  );
}
