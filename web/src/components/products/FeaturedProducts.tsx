import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { getProducts } from '../../data/mockProducts';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import type { Product } from '../../types/product';
import type { ProductSection } from '../../types/settings';

interface FeaturedProductsProps {
  title?: string;
  subtitle?: string;
  section?: ProductSection;
}

export const FeaturedProducts = ({ title, subtitle, section }: FeaturedProductsProps) => {
  const navigate = useNavigate();
  const { addStandardProduct } = useCart();
  const { settings } = useSettings();
  const isMobile = useIsMobile(768); // md breakpoint

  // Convertir filtros de sección a filtros de getProducts
  const getProductFilters = () => {
    if (!section?.filters) {
      return { featured: true, limit: 5 };
    }

    const filters = section.filters;
    const productFilters: {
      category?: string;
      type?: string;
      featured?: boolean;
      bestsellers?: boolean;
      newArrivals?: boolean;
      inStock?: boolean;
      sortBy?: 'rating' | 'price' | 'newest' | 'reviewsCount';
      limit?: number;
    } = { limit: section.maxProducts || 5 };

    // Aplicar filtros de la sección
    if (filters.featured) productFilters.featured = true;
    if (filters.bestsellers) productFilters.bestsellers = true;
    if (filters.newArrivals) productFilters.newArrivals = true;
    if (filters.inStock) productFilters.inStock = true;
    // Usar los campos nuevos (category, type) con fallback a los antiguos para compatibilidad
    if (filters.category || filters.categoryId) productFilters.category = filters.category || filters.categoryId;
    if (filters.type || filters.productTypeId) productFilters.type = filters.type || filters.productTypeId;
    if (filters.sortBy) productFilters.sortBy = filters.sortBy;

    return productFilters;
  };

  const allFeaturedProducts = getProducts(getProductFilters());
  // En móvil (2 columnas): si es impar, mostrar uno menos para evitar espacios en blanco
  // En desktop: mostrar todos los productos configurados
  const featuredProducts = isMobile && allFeaturedProducts.length % 2 !== 0
    ? allFeaturedProducts.slice(0, -1)
    : allFeaturedProducts;

  // Colores de marca dinámicos
  const brandColors = settings.appearance?.brandColors || settings.general.brandColors || {
    primary: '#7c3aed',
    secondary: '#ec4899',
    accent: '#f59e0b',
  };

  const handleAddToCart = (product: Product) => {
    // Agregar con opciones por defecto (primer color y talla)
    const defaultColor = product.colors[0]?.hex || '#FFFFFF';
    const defaultSize = product.sizes[0] || 'M';

    addStandardProduct(product, defaultColor, defaultSize, 1);

    // TODO: Mostrar toast de confirmación
    alert(`${product.name} agregado al carrito!`);
  };

  const handleCustomize = (product: Product) => {
    // Navegar al personalizador con el producto seleccionado
    navigate(`/customizer?product=${product.id}`);
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

  // Si no hay productos, no mostrar la sección
  if (featuredProducts.length === 0) {
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
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              onCustomize={handleCustomize}
            />
          ))}
        </div>

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
