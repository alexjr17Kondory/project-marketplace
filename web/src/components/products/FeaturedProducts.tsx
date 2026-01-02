import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { productsService, type ProductFilters } from '../../services/products.service';
import { useSettings } from '../../context/SettingsContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import type { ProductSection } from '../../types/settings';
import type { Product } from '../../types/product';

interface FeaturedProductsProps {
  title?: string;
  subtitle?: string;
  section?: ProductSection;
}

export const FeaturedProducts = ({ title, subtitle, section }: FeaturedProductsProps) => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const isMobile = useIsMobile(768); // md breakpoint
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar productos desde la API
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const filters: ProductFilters = {
          limit: section?.maxProducts || 8,
        };

        // Aplicar filtros de la sección
        if (section?.filters) {
          const sectionFilters = section.filters;

          // Filtros de categoría y tipo
          const category = sectionFilters.category || sectionFilters.categoryId;
          const type = sectionFilters.type || sectionFilters.productTypeId;
          if (category) filters.category = category;
          if (type) filters.type = type;

          // Filtros booleanos
          if (sectionFilters.featured) filters.featured = true;
          if (sectionFilters.inStock) filters.inStock = true;

          // Ordenamiento
          if (sectionFilters.sortBy) {
            switch (sectionFilters.sortBy) {
              case 'price':
                filters.sortBy = 'basePrice';
                filters.sortOrder = 'asc';
                break;
              case 'rating':
                filters.sortBy = 'rating';
                filters.sortOrder = 'desc';
                break;
              case 'newest':
                filters.sortBy = 'createdAt';
                filters.sortOrder = 'desc';
                break;
              case 'reviewsCount':
                filters.sortBy = 'reviewsCount';
                filters.sortOrder = 'desc';
                break;
            }
          }
        } else {
          // Por defecto, productos destacados
          filters.featured = true;
        }

        const response = await productsService.getAll(filters);
        setProducts(response.data || []);
      } catch (error) {
        console.error('Error loading featured products:', error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [section?.filters, section?.maxProducts]);

  // En móvil (2 columnas): si es impar, mostrar uno menos para evitar espacios en blanco
  // En desktop: mostrar todos los productos configurados
  const featuredProducts = isMobile && products.length % 2 !== 0
    ? products.slice(0, -1)
    : products;

  // Colores de marca dinámicos
  const brandColors = settings.appearance?.brandColors || settings.general.brandColors || {
    primary: '#7c3aed',
    secondary: '#ec4899',
    accent: '#f59e0b',
  };

  // Generar link de "Ver todo" con filtros dinámicos
  const getViewAllLink = () => {
    // Si hay un viewAllLink personalizado, usarlo directamente
    if (section?.viewAllLink) {
      return section.viewAllLink;
    }

    if (!section?.filters || Object.keys(section.filters).length === 0) {
      return '/catalog';
    }

    const params = new URLSearchParams();
    const filters = section.filters;

    // Filtros booleanos
    if (filters.featured) params.set('featured', 'true');
    if (filters.bestsellers) params.set('bestsellers', 'true');
    if (filters.newArrivals) params.set('newArrivals', 'true');
    if (filters.inStock) params.set('inStock', 'true');

    // Filtros de categoría/tipo - usar campos nuevos con fallback a los antiguos
    const category = filters.category || filters.categoryId;
    const type = filters.type || filters.productTypeId;
    if (category) params.set('category', category);
    if (type) params.set('type', type);

    // Ordenamiento
    if (filters.sortBy) params.set('sort', filters.sortBy);

    const queryString = params.toString();
    return queryString ? `/catalog?${queryString}` : '/catalog';
  };

  const viewAllLink = getViewAllLink();
  const showViewAll = section?.showViewAll ?? true;

  // Si no hay productos y ya terminó de cargar, no mostrar la sección
  if (!isLoading && featuredProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 px-4 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {title || section?.title || 'Productos Destacados'}
            </h2>
            <p className="text-gray-600">
              {subtitle || section?.subtitle || 'Los más populares y personalizables de nuestra colección'}
            </p>
          </div>
          {showViewAll && (
            <button
              onClick={() => navigate(viewAllLink)}
              className="hidden md:flex items-center gap-2 font-semibold transition-colors group"
              style={{ color: brandColors.primary }}
            >
              Ver todo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-gray-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        )}

        {/* Mobile View All Button */}
        {showViewAll && (
          <div className="md:hidden mt-8 text-center">
            <button
              onClick={() => navigate(viewAllLink)}
              className="inline-flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-lg transition-colors hover:opacity-90"
              style={{ backgroundColor: brandColors.primary }}
            >
              Ver todos los productos
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
