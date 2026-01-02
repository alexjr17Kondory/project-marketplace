import { useState, useEffect } from 'react';
import { useSettings } from '../../../context/SettingsContext';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../../components/shared/Button';
import { Input } from '../../../components/shared/Input';
import { Modal } from '../../../components/shared/Modal';
import type { FeatureCard, ProductSection, HeroSettings, CTASettings, WhatsAppButtonSettings, SectionFilters } from '../../../types/settings';
import { FEATURE_ICONS } from '../../../types/settings';
import { productsService } from '../../../services/products.service';
import {
  Home,
  Save,
  Image,
  Type,
  LayoutGrid,
  ShoppingBag,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  ToggleLeft,
  ToggleRight,
  Palette,
  Package,
  Truck,
  Shield,
  Heart,
  Star,
  Zap,
  Gift,
  Percent,
  MessageCircle,
} from 'lucide-react';

// Map de iconos
const iconComponents: Record<FeatureCard['icon'], typeof Palette> = {
  palette: Palette,
  sparkles: Sparkles,
  package: Package,
  truck: Truck,
  shield: Shield,
  heart: Heart,
  star: Star,
  zap: Zap,
  gift: Gift,
  percent: Percent,
};

export const SettingsHomePage = () => {
  const {
    settings,
    updateHomeSettings,
    addFeature,
    updateFeature,
    deleteFeature,
    addProductSection,
    updateProductSection,
    deleteProductSection,
    updateWhatsAppButton,
  } = useSettings();
  const toast = useToast();

  // Database catalogs state
  const [dbCategories, setDbCategories] = useState<Array<{ id: number; name: string; slug: string }>>([]);
  const [dbTypes, setDbTypes] = useState<Array<{ id: number; name: string; slug: string; categoryId: number | null; categorySlug: string | null }>>([]);

  // Local form states
  const [heroForm, setHeroForm] = useState<HeroSettings>(settings.home.hero);
  const [ctaForm, setCtaForm] = useState<CTASettings>(settings.home.cta);
  const [whatsappForm, setWhatsappForm] = useState<WhatsAppButtonSettings>(settings.home.whatsappButton);

  // Modal states
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeatureCard | null>(null);
  const [editingSection, setEditingSection] = useState<ProductSection | null>(null);

  // Form states para modales
  const [featureForm, setFeatureForm] = useState<Omit<FeatureCard, 'id'>>({
    icon: 'sparkles',
    title: '',
    description: '',
    isActive: true,
    order: 0,
  });
  const [sectionForm, setSectionForm] = useState<Omit<ProductSection, 'id'>>({
    title: '',
    subtitle: '',
    showSubtitle: true,
    filters: {},
    maxProducts: 5,
    showViewAll: true,
    viewAllLink: '/catalog',
    isActive: true,
    order: 0,
  });

  // Load categories and types from database
  useEffect(() => {
    const loadCatalogsData = async () => {
      try {
        const [categories, types] = await Promise.all([
          productsService.getCategories(),
          productsService.getTypes(),
        ]);
        setDbCategories(categories);
        setDbTypes(types);
      } catch (error) {
        console.error('Error loading catalogs data:', error);
      }
    };
    loadCatalogsData();
  }, []);

  const handleSaveHero = () => {
    updateHomeSettings({ hero: heroForm });
    toast.success('Hero actualizado');
  };

  const handleSaveCTA = () => {
    updateHomeSettings({ cta: ctaForm });
    toast.success('CTA actualizado');
  };

  const handleSaveWhatsApp = () => {
    updateWhatsAppButton(whatsappForm);
    toast.success('Botón de WhatsApp actualizado');
  };

  const handleToggleCustomizer = () => {
    updateHomeSettings({ enableCustomizer: !settings.home.enableCustomizer });
    toast.success(settings.home.enableCustomizer ? 'Personalización deshabilitada' : 'Personalización habilitada');
  };

  const handleToggleFeatures = () => {
    updateHomeSettings({ showFeatures: !settings.home.showFeatures });
    toast.success(settings.home.showFeatures ? 'Características ocultadas' : 'Características visibles');
  };

  // Feature handlers
  const handleOpenFeatureModal = (feature?: FeatureCard) => {
    if (feature) {
      setEditingFeature(feature);
      setFeatureForm({
        icon: feature.icon,
        title: feature.title,
        description: feature.description,
        isActive: feature.isActive,
        order: feature.order,
      });
    } else {
      setEditingFeature(null);
      setFeatureForm({
        icon: 'sparkles',
        title: '',
        description: '',
        isActive: true,
        order: settings.home.features.length + 1,
      });
    }
    setIsFeatureModalOpen(true);
  };

  const handleSaveFeature = () => {
    if (editingFeature) {
      updateFeature(editingFeature.id, featureForm);
      toast.success('Característica actualizada');
    } else {
      addFeature(featureForm);
      toast.success('Característica creada');
    }
    setIsFeatureModalOpen(false);
  };

  const handleDeleteFeature = (id: string) => {
    if (confirm('¿Eliminar esta característica?')) {
      deleteFeature(id);
      toast.success('Característica eliminada');
    }
  };

  // Section handlers
  const handleOpenSectionModal = (section?: ProductSection) => {
    if (section) {
      setEditingSection(section);
      setSectionForm({
        title: section.title,
        subtitle: section.subtitle,
        showSubtitle: section.showSubtitle ?? true,
        filters: section.filters || {},
        maxProducts: section.maxProducts,
        showViewAll: section.showViewAll,
        viewAllLink: section.viewAllLink,
        isActive: section.isActive,
        order: section.order,
      });
    } else {
      setEditingSection(null);
      setSectionForm({
        title: '',
        subtitle: '',
        showSubtitle: true,
        filters: {},
        maxProducts: 5,
        showViewAll: true,
        viewAllLink: '/catalog',
        isActive: true,
        order: settings.home.productSections.length + 1,
      });
    }
    setIsSectionModalOpen(true);
  };

  // Helper para actualizar filtros y regenerar viewAllLink
  const updateSectionFilter = (key: keyof SectionFilters, value: any) => {
    const newFilters = {
      ...sectionForm.filters,
      [key]: value === '' || value === false ? undefined : value,
    };

    // Construir el viewAllLink basado en los filtros actualizados
    let link = '/catalog';
    const params: string[] = [];

    if (newFilters.category) params.push(`category=${newFilters.category}`);
    if (newFilters.type) params.push(`type=${newFilters.type}`);
    if (newFilters.featured) params.push('featured=true');
    if (newFilters.bestsellers) params.push('bestsellers=true');
    if (newFilters.newArrivals) params.push('newArrivals=true');
    if (newFilters.inStock) params.push('inStock=true');
    if (newFilters.sortBy) params.push(`sort=${newFilters.sortBy}`);

    if (params.length > 0) link += '?' + params.join('&');

    setSectionForm({
      ...sectionForm,
      filters: newFilters,
      viewAllLink: link,
    });
  };

  // Helper para generar descripción de filtros
  const getFilterDescription = (filters: SectionFilters) => {
    const parts: string[] = [];
    if (filters.featured) parts.push('Destacados');
    if (filters.bestsellers) parts.push('Más vendidos');
    if (filters.newArrivals) parts.push('Nuevos');
    if (filters.category) {
      const cat = dbCategories.find(c => c.slug === filters.category);
      parts.push(cat?.name || filters.category);
    }
    if (filters.type) {
      const type = dbTypes.find(t => t.slug === filters.type);
      parts.push(type?.name || filters.type);
    }
    if (filters.sortBy) {
      const sortLabels: Record<string, string> = {
        price: 'Por precio',
        newest: 'Más recientes',
        rating: 'Mejor valorados',
        reviewsCount: 'Más reseñas',
      };
      parts.push(sortLabels[filters.sortBy] || filters.sortBy);
    }
    if (filters.inStock) parts.push('En stock');
    return parts.length > 0 ? parts.join(' • ') : 'Sin filtros';
  };

  const handleSaveSection = () => {
    if (editingSection) {
      updateProductSection(editingSection.id, sectionForm);
      toast.success('Sección actualizada');
    } else {
      addProductSection(sectionForm);
      toast.success('Sección creada');
    }
    setIsSectionModalOpen(false);
  };

  const handleDeleteSection = (id: string) => {
    if (confirm('¿Eliminar esta sección?')) {
      deleteProductSection(id);
      toast.success('Sección eliminada');
    }
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Home className="w-8 h-8 text-orange-500" />
            Página de Inicio
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Personaliza el contenido de tu página principal
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Toggle Personalización */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <Palette className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Módulo de Personalización</h3>
                <p className="text-sm text-gray-500">
                  {settings.home.enableCustomizer
                    ? 'Los clientes pueden personalizar productos con sus diseños'
                    : 'Solo tienda tradicional sin opción de personalización'}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleCustomizer}
              className={`relative w-16 h-8 rounded-full transition-colors ${
                settings.home.enableCustomizer ? 'bg-purple-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  settings.home.enableCustomizer ? 'left-9' : 'left-1'
                }`}
              />
            </button>
          </div>
          {!settings.home.enableCustomizer && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              El botón "Personalizar" se ocultará del menú y el acceso a /customize estará deshabilitado.
            </div>
          )}
        </div>

        {/* Hero Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Image className="w-5 h-5 text-orange-500" />
            Hero (Sección Principal)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Badge (etiqueta superior)
              </label>
              <Input
                value={heroForm.badge}
                onChange={(e) => setHeroForm({ ...heroForm, badge: e.target.value })}
                placeholder="Ej: 100% Personalizable"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={heroForm.showBadge}
                onChange={(e) => setHeroForm({ ...heroForm, showBadge: e.target.checked })}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Mostrar badge</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título principal
              </label>
              <Input
                value={heroForm.title}
                onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })}
                placeholder="Ej: Dale Vida a tu"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Texto destacado (segunda línea)
              </label>
              <Input
                value={heroForm.titleHighlight || ''}
                onChange={(e) => setHeroForm({ ...heroForm, titleHighlight: e.target.value })}
                placeholder="Ej: Creatividad"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subtítulo
              </label>
              <textarea
                value={heroForm.subtitle}
                onChange={(e) => setHeroForm({ ...heroForm, subtitle: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Descripción del hero"
              />
            </div>

            {/* Botón Principal */}
            <div className="md:col-span-2 border-t pt-4 mt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Botón Principal</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={heroForm.showPrimaryButton ?? true}
                    onChange={(e) => setHeroForm({ ...heroForm, showPrimaryButton: e.target.checked })}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-600">Mostrar</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Texto botón principal
              </label>
              <Input
                value={heroForm.primaryButtonText}
                onChange={(e) => setHeroForm({ ...heroForm, primaryButtonText: e.target.value })}
                placeholder="Ej: Personalizar Ahora"
                disabled={!(heroForm.showPrimaryButton ?? true)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link botón principal
              </label>
              <Input
                value={heroForm.primaryButtonLink}
                onChange={(e) => setHeroForm({ ...heroForm, primaryButtonLink: e.target.value })}
                placeholder="/customize"
                disabled={!(heroForm.showPrimaryButton ?? true)}
              />
            </div>

            {/* Botón Secundario */}
            <div className="md:col-span-2 border-t pt-4 mt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Botón Secundario</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={heroForm.showSecondaryButton}
                    onChange={(e) => setHeroForm({ ...heroForm, showSecondaryButton: e.target.checked })}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-600">Mostrar</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Texto botón secundario
              </label>
              <Input
                value={heroForm.secondaryButtonText}
                onChange={(e) => setHeroForm({ ...heroForm, secondaryButtonText: e.target.value })}
                placeholder="Ej: Ver Catálogo"
                disabled={!heroForm.showSecondaryButton}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link botón secundario
              </label>
              <Input
                value={heroForm.secondaryButtonLink}
                onChange={(e) => setHeroForm({ ...heroForm, secondaryButtonLink: e.target.value })}
                placeholder="/catalog"
                disabled={!heroForm.showSecondaryButton}
              />
            </div>

            {/* Highlights */}
            <div className="md:col-span-2 border-t pt-4 mt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Puntos Destacados</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={heroForm.showHighlights ?? true}
                    onChange={(e) => setHeroForm({ ...heroForm, showHighlights: e.target.checked })}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-600">Mostrar</span>
                </label>
              </div>
              <Input
                value={heroForm.highlights.join(', ')}
                onChange={(e) => setHeroForm({
                  ...heroForm,
                  highlights: e.target.value.split(',').map(h => h.trim()).filter(Boolean)
                })}
                placeholder="Sin mínimos, Envío rápido, Alta calidad"
                disabled={!(heroForm.showHighlights ?? true)}
              />
              <p className="text-xs text-gray-500 mt-1">Separados por coma</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={heroForm.useGradientBackground}
                onChange={(e) => setHeroForm({ ...heroForm, useGradientBackground: e.target.checked })}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Usar gradiente de marca como fondo</span>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={handleSaveHero}>
              <Save className="w-4 h-4 mr-2" />
              Guardar Hero
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-orange-500" />
                Tarjetas de Características
              </h3>
              <button
                onClick={handleToggleFeatures}
                className={`p-1 rounded ${settings.home.showFeatures ? 'text-green-600' : 'text-gray-400'}`}
                title={settings.home.showFeatures ? 'Visible' : 'Oculto'}
              >
                {settings.home.showFeatures ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
              </button>
            </div>
            <Button onClick={() => handleOpenFeatureModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Característica
            </Button>
          </div>

          <div className="space-y-3">
            {settings.home.features
              .sort((a, b) => a.order - b.order)
              .map((feature) => {
                const IconComponent = iconComponents[feature.icon];
                return (
                  <div
                    key={feature.id}
                    className={`flex items-center gap-4 p-4 border rounded-lg ${
                      feature.isActive ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{feature.title}</h4>
                        {!feature.isActive && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Inactiva</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{feature.description}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenFeatureModal(feature)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFeature(feature.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            {settings.home.features.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay características configuradas
              </div>
            )}
          </div>
        </div>

        {/* Product Sections */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-orange-500" />
              Secciones de Productos
            </h3>
            <Button onClick={() => handleOpenSectionModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Sección
            </Button>
          </div>

          <div className="space-y-3">
            {settings.home.productSections
              .sort((a, b) => a.order - b.order)
              .map((section) => {
                const filterDesc = getFilterDescription(section.filters || {});
                return (
                  <div
                    key={section.id}
                    className={`flex items-center gap-4 p-4 border rounded-lg ${
                      section.isActive ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-gray-900">{section.title}</h4>
                        {!section.isActive && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Inactiva</span>
                        )}
                      </div>
                      {section.subtitle && (
                        <p className="text-sm text-gray-500">{section.subtitle}</p>
                      )}
                      <p className="text-xs text-orange-600 mt-1 font-medium">
                        {filterDesc}
                      </p>
                      <p className="text-xs text-gray-400">
                        Máx. {section.maxProducts} productos • {section.showViewAll ? 'Con "Ver todo"' : 'Sin "Ver todo"'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenSectionModal(section)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSection(section.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            {settings.home.productSections.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay secciones de productos configuradas
              </div>
            )}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Type className="w-5 h-5 text-orange-500" />
              CTA Final (Llamada a la Acción)
            </h3>
            <button
              onClick={() => updateHomeSettings({ cta: { ...settings.home.cta, isActive: !settings.home.cta.isActive } })}
              className={`p-1 rounded ${settings.home.cta.isActive ? 'text-green-600' : 'text-gray-400'}`}
              title={settings.home.cta.isActive ? 'Visible' : 'Oculto'}
            >
              {settings.home.cta.isActive ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Badge */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Badge</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ctaForm.showBadge ?? true}
                    onChange={(e) => setCtaForm({ ...ctaForm, showBadge: e.target.checked })}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-600">Mostrar</span>
                </label>
              </div>
              <Input
                value={ctaForm.badge}
                onChange={(e) => setCtaForm({ ...ctaForm, badge: e.target.value })}
                placeholder="Ej: Crea sin límites"
                disabled={!(ctaForm.showBadge ?? true)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título
              </label>
              <Input
                value={ctaForm.title}
                onChange={(e) => setCtaForm({ ...ctaForm, title: e.target.value })}
                placeholder="Ej: ¿Listo para crear algo único?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subtítulo
              </label>
              <Input
                value={ctaForm.subtitle}
                onChange={(e) => setCtaForm({ ...ctaForm, subtitle: e.target.value })}
                placeholder="Descripción del CTA"
              />
            </div>

            {/* Botón CTA */}
            <div className="md:col-span-2 border-t pt-4 mt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Botón</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ctaForm.showButton ?? true}
                    onChange={(e) => setCtaForm({ ...ctaForm, showButton: e.target.checked })}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-600">Mostrar</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Texto del botón
              </label>
              <Input
                value={ctaForm.buttonText}
                onChange={(e) => setCtaForm({ ...ctaForm, buttonText: e.target.value })}
                placeholder="Ej: Personalizar Ahora"
                disabled={!(ctaForm.showButton ?? true)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link del botón
              </label>
              <Input
                value={ctaForm.buttonLink}
                onChange={(e) => setCtaForm({ ...ctaForm, buttonLink: e.target.value })}
                placeholder="/customize"
                disabled={!(ctaForm.showButton ?? true)}
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={handleSaveCTA}>
              <Save className="w-4 h-4 mr-2" />
              Guardar CTA
            </Button>
          </div>
        </div>
      </div>

      {/* WhatsApp Button Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <MessageCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Botón de WhatsApp</h2>
              <p className="text-sm text-gray-500">Configura el botón flotante de contacto</p>
            </div>
          </div>
          <button
            onClick={() => setWhatsappForm({ ...whatsappForm, isActive: !whatsappForm.isActive })}
            className={`p-1 rounded ${whatsappForm.isActive ? 'text-green-600' : 'text-gray-400'}`}
            title={whatsappForm.isActive ? 'Visible' : 'Oculto'}
          >
            {whatsappForm.isActive ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de WhatsApp *
              </label>
              <Input
                value={whatsappForm.phoneNumber}
                onChange={(e) => setWhatsappForm({ ...whatsappForm, phoneNumber: e.target.value })}
                placeholder="573001234567"
              />
              <p className="text-xs text-gray-500 mt-1">Sin + ni espacios (ej: 573001234567)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color del botón
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={whatsappForm.buttonColor}
                  onChange={(e) => setWhatsappForm({ ...whatsappForm, buttonColor: e.target.value })}
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <Input
                  value={whatsappForm.buttonColor}
                  onChange={(e) => setWhatsappForm({ ...whatsappForm, buttonColor: e.target.value })}
                  placeholder="#25D366"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensaje predeterminado
              </label>
              <textarea
                value={whatsappForm.defaultMessage}
                onChange={(e) => setWhatsappForm({ ...whatsappForm, defaultMessage: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="¡Hola! Me interesa obtener más información..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Posición
              </label>
              <select
                value={whatsappForm.position}
                onChange={(e) => setWhatsappForm({ ...whatsappForm, position: e.target.value as 'bottom-right' | 'bottom-left' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="bottom-right">Abajo a la derecha</option>
                <option value="bottom-left">Abajo a la izquierda</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Texto del tooltip
              </label>
              <Input
                value={whatsappForm.tooltipText}
                onChange={(e) => setWhatsappForm({ ...whatsappForm, tooltipText: e.target.value })}
                placeholder="¿Necesitas ayuda?"
                disabled={!whatsappForm.showTooltip}
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={whatsappForm.showOnMobile}
                onChange={(e) => setWhatsappForm({ ...whatsappForm, showOnMobile: e.target.checked })}
                className="w-4 h-4 text-green-600 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Mostrar en móvil</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={whatsappForm.showOnDesktop}
                onChange={(e) => setWhatsappForm({ ...whatsappForm, showOnDesktop: e.target.checked })}
                className="w-4 h-4 text-green-600 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Mostrar en desktop</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={whatsappForm.pulseAnimation}
                onChange={(e) => setWhatsappForm({ ...whatsappForm, pulseAnimation: e.target.checked })}
                className="w-4 h-4 text-green-600 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Animación pulse</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={whatsappForm.showTooltip}
                onChange={(e) => setWhatsappForm({ ...whatsappForm, showTooltip: e.target.checked })}
                className="w-4 h-4 text-green-600 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Mostrar tooltip</span>
            </label>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={handleSaveWhatsApp}>
              <Save className="w-4 h-4 mr-2" />
              Guardar WhatsApp
            </Button>
          </div>
        </div>
      </div>

      {/* Feature Modal */}
      <Modal
        isOpen={isFeatureModalOpen}
        onClose={() => setIsFeatureModalOpen(false)}
        title={editingFeature ? 'Editar Característica' : 'Nueva Característica'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Icono</label>
            <div className="grid grid-cols-5 gap-2">
              {FEATURE_ICONS.map((iconOption) => {
                const IconComp = iconComponents[iconOption.id as FeatureCard['icon']];
                return (
                  <button
                    key={iconOption.id}
                    type="button"
                    onClick={() => setFeatureForm({ ...featureForm, icon: iconOption.id as FeatureCard['icon'] })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      featureForm.icon === iconOption.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    title={iconOption.label}
                  >
                    <IconComp className="w-6 h-6 mx-auto text-gray-600" />
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <Input
              value={featureForm.title}
              onChange={(e) => setFeatureForm({ ...featureForm, title: e.target.value })}
              placeholder="Ej: Alta Calidad"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
            <textarea
              value={featureForm.description}
              onChange={(e) => setFeatureForm({ ...featureForm, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="Descripción de la característica"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
            <Input
              type="number"
              min="1"
              value={featureForm.order}
              onChange={(e) => setFeatureForm({ ...featureForm, order: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={featureForm.isActive}
                onChange={(e) => setFeatureForm({ ...featureForm, isActive: e.target.checked })}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Característica activa</span>
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="admin-secondary" onClick={() => setIsFeatureModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSaveFeature} className="flex-1">
              {editingFeature ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Section Modal */}
      <Modal
        isOpen={isSectionModalOpen}
        onClose={() => setIsSectionModalOpen(false)}
        title={editingSection ? 'Editar Sección' : 'Nueva Sección de Productos'}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Título y Subtítulo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <Input
              value={sectionForm.title}
              onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
              placeholder="Ej: Productos Destacados"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
            <Input
              value={sectionForm.subtitle || ''}
              onChange={(e) => setSectionForm({ ...sectionForm, subtitle: e.target.value })}
              placeholder="Descripción opcional"
            />
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sectionForm.showSubtitle ?? true}
                onChange={(e) => setSectionForm({ ...sectionForm, showSubtitle: e.target.checked })}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-600">Mostrar subtítulo</span>
            </label>
          </div>

          {/* Filtros de selección */}
          <div className="border-t pt-4">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Filtros de Productos
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={sectionForm.filters?.featured || false}
                  onChange={(e) => updateSectionFilter('featured', e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Destacados</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={sectionForm.filters?.bestsellers || false}
                  onChange={(e) => updateSectionFilter('bestsellers', e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Más vendidos</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={sectionForm.filters?.newArrivals || false}
                  onChange={(e) => updateSectionFilter('newArrivals', e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Nuevos</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={sectionForm.filters?.inStock || false}
                  onChange={(e) => updateSectionFilter('inStock', e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">En stock</span>
              </label>
            </div>
          </div>

          {/* Filtro por Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={sectionForm.filters?.category || ''}
              onChange={(e) => {
                const categorySlug = e.target.value;
                // Construir el viewAllLink basado en los filtros
                let link = '/catalog';
                const params: string[] = [];

                if (categorySlug) params.push(`category=${categorySlug}`);
                if (sectionForm.filters?.featured) params.push('featured=true');
                if (sectionForm.filters?.bestsellers) params.push('bestsellers=true');
                if (sectionForm.filters?.newArrivals) params.push('newArrivals=true');
                if (sectionForm.filters?.inStock) params.push('inStock=true');
                if (sectionForm.filters?.sortBy) params.push(`sort=${sectionForm.filters.sortBy}`);

                if (params.length > 0) link += '?' + params.join('&');

                // Al cambiar categoría, limpiar el tipo de producto y actualizar link
                setSectionForm({
                  ...sectionForm,
                  filters: {
                    ...sectionForm.filters,
                    category: categorySlug || undefined,
                    type: undefined, // Reset tipo cuando cambia categoría
                  },
                  viewAllLink: link,
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Todas las categorías</option>
              {dbCategories.map((cat) => (
                <option key={cat.id} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Tipo de Producto - Solo si hay categoría seleccionada */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Producto</label>
            <select
              value={sectionForm.filters?.type || ''}
              onChange={(e) => {
                const typeSlug = e.target.value;
                // Construir el viewAllLink basado en los filtros
                let link = '/catalog';
                const params: string[] = [];

                if (sectionForm.filters?.category) params.push(`category=${sectionForm.filters.category}`);
                if (typeSlug) params.push(`type=${typeSlug}`);
                if (sectionForm.filters?.featured) params.push('featured=true');
                if (sectionForm.filters?.bestsellers) params.push('bestsellers=true');
                if (sectionForm.filters?.newArrivals) params.push('newArrivals=true');
                if (sectionForm.filters?.inStock) params.push('inStock=true');
                if (sectionForm.filters?.sortBy) params.push(`sort=${sectionForm.filters.sortBy}`);

                if (params.length > 0) link += '?' + params.join('&');

                setSectionForm({
                  ...sectionForm,
                  filters: {
                    ...sectionForm.filters,
                    type: typeSlug || undefined,
                  },
                  viewAllLink: link,
                });
              }}
              disabled={!sectionForm.filters?.category}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 ${
                !sectionForm.filters?.category ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
              }`}
            >
              <option value="">
                {sectionForm.filters?.category ? 'Todos los tipos' : 'Selecciona una categoría primero'}
              </option>
              {sectionForm.filters?.category &&
                dbTypes
                  .filter(t => t.categorySlug === sectionForm.filters?.category)
                  .map((type) => (
                    <option key={type.id} value={type.slug}>{type.name}</option>
                  ))
              }
            </select>
            {!sectionForm.filters?.category && (
              <p className="text-xs text-gray-500 mt-1">Selecciona una categoría para ver los tipos disponibles</p>
            )}
          </div>

          {/* Ordenamiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
            <select
              value={sectionForm.filters?.sortBy || ''}
              onChange={(e) => updateSectionFilter('sortBy', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Por defecto</option>
              <option value="price">Por precio</option>
              <option value="newest">Más recientes</option>
              <option value="rating">Mejor valorados</option>
              <option value="reviewsCount">Más reseñas</option>
            </select>
          </div>

          {/* Configuración */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Máximo de productos</label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={sectionForm.maxProducts}
                  onChange={(e) => setSectionForm({ ...sectionForm, maxProducts: parseInt(e.target.value) || 5 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                <Input
                  type="number"
                  min="1"
                  value={sectionForm.order}
                  onChange={(e) => setSectionForm({ ...sectionForm, order: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sectionForm.showViewAll}
                onChange={(e) => setSectionForm({ ...sectionForm, showViewAll: e.target.checked })}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Mostrar "Ver todo"</span>
            </label>
          </div>
          {sectionForm.showViewAll && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link "Ver todo"</label>
              <Input
                value={sectionForm.viewAllLink || ''}
                onChange={(e) => setSectionForm({ ...sectionForm, viewAllLink: e.target.value })}
                placeholder="/catalog"
              />
            </div>
          )}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sectionForm.isActive}
                onChange={(e) => setSectionForm({ ...sectionForm, isActive: e.target.checked })}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Sección activa</span>
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="admin-secondary" onClick={() => setIsSectionModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSaveSection} className="flex-1">
              {editingSection ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
