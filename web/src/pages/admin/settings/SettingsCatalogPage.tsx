import { useState, useEffect } from 'react';
import { useSettings } from '../../../context/SettingsContext';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../../components/shared/Button';
import { Input } from '../../../components/shared/Input';
import type { CatalogSettings, CatalogFilterConfig } from '../../../types/settings';
import { PRODUCT_CATEGORIES, PRODUCT_TYPES } from '../../../types/settings';
import {
  Filter,
  Save,
  ToggleLeft,
  ToggleRight,
  Tag,
  Layers,
  DollarSign,
  Package,
  Star,
} from 'lucide-react';

export const SettingsCatalogPage = () => {
  const { settings, updateCatalogSettings } = useSettings();
  const toast = useToast();

  const [catalogForm, setCatalogForm] = useState<CatalogSettings>(settings.catalog);

  useEffect(() => {
    setCatalogForm(settings.catalog);
  }, [settings.catalog]);

  const handleSave = () => {
    updateCatalogSettings(catalogForm);
    toast.success('Configuración del catálogo guardada');
  };

  const handleToggleFilter = (filterKey: keyof CatalogFilterConfig) => {
    if (typeof catalogForm.filters[filterKey] === 'boolean') {
      setCatalogForm({
        ...catalogForm,
        filters: {
          ...catalogForm.filters,
          [filterKey]: !catalogForm.filters[filterKey],
        },
      });
    }
  };

  const handleToggleCategory = (categoryId: string) => {
    const current = catalogForm.filters.enabledCategories;
    const updated = current.includes(categoryId)
      ? current.filter((c) => c !== categoryId)
      : [...current, categoryId];
    setCatalogForm({
      ...catalogForm,
      filters: {
        ...catalogForm.filters,
        enabledCategories: updated,
      },
    });
  };

  const handleToggleProductType = (typeId: string) => {
    const current = catalogForm.filters.enabledProductTypes;
    const updated = current.includes(typeId)
      ? current.filter((t) => t !== typeId)
      : [...current, typeId];
    setCatalogForm({
      ...catalogForm,
      filters: {
        ...catalogForm.filters,
        enabledProductTypes: updated,
      },
    });
  };

  const filterOptions = [
    {
      key: 'showCategoryFilter' as const,
      label: 'Filtro por Categoría',
      description: 'Permite filtrar productos por categoría (Ropa, Accesorios, etc.)',
      icon: Tag,
    },
    {
      key: 'showTypeFilter' as const,
      label: 'Filtro por Tipo',
      description: 'Permite filtrar por tipo específico (Camisetas, Tazas, etc.)',
      icon: Layers,
    },
    {
      key: 'showPriceFilter' as const,
      label: 'Filtro por Precio',
      description: 'Permite establecer rango de precios mínimo y máximo',
      icon: DollarSign,
    },
    {
      key: 'showStockFilter' as const,
      label: 'Filtro de Stock',
      description: 'Permite mostrar solo productos en stock',
      icon: Package,
    },
    {
      key: 'showFeaturedFilter' as const,
      label: 'Filtro de Destacados',
      description: 'Permite mostrar solo productos destacados',
      icon: Star,
    },
  ];

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Filter className="w-8 h-8 text-blue-500" />
            Configuración del Catálogo
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Configura los filtros y opciones del catálogo de productos
          </p>
        </div>
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Guardar Cambios
        </Button>
      </div>

      <div className="space-y-6">
        {/* Filtros habilitados */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Filtros del Catálogo
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Selecciona qué filtros estarán disponibles en el catálogo para los clientes
          </p>

          <div className="space-y-4">
            {filterOptions.map((option) => {
              const IconComponent = option.icon;
              const isEnabled = catalogForm.filters[option.key] as boolean;

              return (
                <div
                  key={option.key}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                    isEnabled ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isEnabled ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <IconComponent className={`w-5 h-5 ${isEnabled ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{option.label}</h4>
                      <p className="text-sm text-gray-500">{option.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleFilter(option.key)}
                    className={`p-1 rounded ${isEnabled ? 'text-blue-600' : 'text-gray-400'}`}
                  >
                    {isEnabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Categorías habilitadas */}
        {catalogForm.filters.showCategoryFilter && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Categorías Disponibles
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Selecciona qué categorías aparecerán en el filtro del catálogo
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {PRODUCT_CATEGORIES.map((category) => {
                const isEnabled = catalogForm.filters.enabledCategories.includes(category.id);
                return (
                  <button
                    key={category.id}
                    onClick={() => handleToggleCategory(category.id)}
                    className={`p-3 rounded-lg border-2 transition-all text-center ${
                      isEnabled
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <span className="font-medium">{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tipos de producto habilitados */}
        {catalogForm.filters.showTypeFilter && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Tipos de Producto Disponibles
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Selecciona qué tipos de producto aparecerán en el filtro del catálogo
            </p>

            {/* Agrupar por categoría */}
            {PRODUCT_CATEGORIES.map((category) => {
              const typesInCategory = PRODUCT_TYPES.filter((t) => t.category === category.id);
              if (typesInCategory.length === 0) return null;

              return (
                <div key={category.id} className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    {category.label}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {typesInCategory.map((type) => {
                      const isEnabled = catalogForm.filters.enabledProductTypes.includes(type.id);
                      return (
                        <button
                          key={type.id}
                          onClick={() => handleToggleProductType(type.id)}
                          className={`px-3 py-1.5 rounded-full border transition-all text-sm ${
                            isEnabled
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                        >
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Opciones generales */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Opciones Generales
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Productos por página (por defecto)
              </label>
              <Input
                type="number"
                min="4"
                max="48"
                step="4"
                value={catalogForm.defaultProductsPerPage}
                onChange={(e) =>
                  setCatalogForm({
                    ...catalogForm,
                    defaultProductsPerPage: parseInt(e.target.value) || 12,
                  })
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Cantidad inicial de productos a mostrar (4-48)
              </p>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Opciones de Ordenamiento</h4>
                <p className="text-sm text-gray-500">Mostrar selector de ordenamiento</p>
              </div>
              <button
                onClick={() =>
                  setCatalogForm({
                    ...catalogForm,
                    showSortOptions: !catalogForm.showSortOptions,
                  })
                }
                className={`p-1 rounded ${catalogForm.showSortOptions ? 'text-blue-600' : 'text-gray-400'}`}
              >
                {catalogForm.showSortOptions ? (
                  <ToggleRight className="w-8 h-8" />
                ) : (
                  <ToggleLeft className="w-8 h-8" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
