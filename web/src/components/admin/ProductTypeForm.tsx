import { useState, useEffect } from 'react';
import type { ProductType, Category, Size } from '../../services/catalogs.service';
import { catalogsService } from '../../services/catalogs.service';
import { useCatalogs } from '../../context/CatalogsContext';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { X } from 'lucide-react';

interface ProductTypeFormProps {
  productType?: ProductType;
  onSubmit: (data: Omit<ProductType, 'id'>, sizeIds: number[]) => void;
  onDelete?: () => void;
}

export const ProductTypeForm = ({ productType, onSubmit, onDelete }: ProductTypeFormProps) => {
  // Usar datos del contexto en lugar de hacer nuevas peticiones
  const { sizes: contextSizes, categories: contextCategories } = useCatalogs();

  const [formData, setFormData] = useState({
    name: productType?.name || '',
    slug: productType?.slug || '',
    description: productType?.description || '',
    categoryId: productType?.categoryId || null as number | null,
    isActive: productType?.isActive ?? true,
  });

  const [selectedSizeIds, setSelectedSizeIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedTypeId, setLoadedTypeId] = useState<number | null>(null);

  // Convertir tallas del contexto al formato esperado
  const availableSizes: Size[] = contextSizes.map(s => ({
    id: s.id,
    name: s.name,
    abbreviation: s.abbreviation,
    sortOrder: s.order,
    isActive: s.active,
  }));

  const categories: Category[] = contextCategories.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    isActive: c.isActive,
  }));

  useEffect(() => {
    // Solo cargar si es un tipo diferente al ya cargado
    if (productType?.id && productType.id !== loadedTypeId) {
      loadAssignedSizes();
    }
  }, [productType?.id]);

  const loadAssignedSizes = async () => {
    if (!productType?.id) return;

    try {
      setLoading(true);
      const assignedSizes = await catalogsService.getSizesByProductType(productType.id);
      setSelectedSizeIds(assignedSizes.map(s => s.id));
      setLoadedTypeId(productType.id); // Marcar como cargado
    } catch (error) {
      console.error('Error cargando tallas asignadas:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  const toggleSize = (sizeId: number) => {
    setSelectedSizeIds(prev =>
      prev.includes(sizeId)
        ? prev.filter(id => id !== sizeId)
        : [...prev, sizeId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSizeIds.length === 0) {
      alert('Debes seleccionar al menos una talla');
      return;
    }

    onSubmit(formData, selectedSizeIds);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        {/* Nombre */}
        <div className="col-span-12 md:col-span-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre *
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            placeholder="Ej: Camiseta, Taza, Gorra..."
          />
        </div>

        {/* Slug */}
        <div className="col-span-12 md:col-span-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slug *
          </label>
          <Input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            required
            placeholder="camiseta, taza, gorra..."
          />
        </div>

        {/* Categoría */}
        <div className="col-span-12 md:col-span-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoría
          </label>
          <select
            value={formData.categoryId || ''}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value ? Number(e.target.value) : null })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">Sin categoría</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Estado */}
        <div className="col-span-12 md:col-span-6 flex items-end">
          <label className="flex items-center gap-2 cursor-pointer pb-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
            />
            <span className="text-sm font-medium text-gray-700">Activo</span>
          </label>
        </div>

        {/* Descripción */}
        <div className="col-span-12">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            rows={3}
            placeholder="Descripción opcional del tipo de producto..."
          />
        </div>

        {/* Selector de Tallas */}
        <div className="col-span-12">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tallas Disponibles * (selecciona al menos una)
          </label>
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
            {availableSizes.length === 0 ? (
              <p className="text-sm text-gray-500">No hay tallas disponibles</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {availableSizes.map(size => (
                  <label
                    key={size.id}
                    className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedSizeIds.includes(size.id)
                        ? 'bg-orange-50 border-2 border-orange-500'
                        : 'bg-white border-2 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSizeIds.includes(size.id)}
                      onChange={() => toggleSize(size.id)}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {size.abbreviation}
                      </div>
                      <div className="text-xs text-gray-500">{size.name}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
          {selectedSizeIds.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              {selectedSizeIds.length} talla{selectedSizeIds.length !== 1 ? 's' : ''} seleccionada{selectedSizeIds.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex items-center justify-between pt-4 border-t">
        {productType && onDelete ? (
          <Button type="button" variant="admin-danger" onClick={onDelete}>
            <X className="w-4 h-4 mr-2" />
            Eliminar Tipo
          </Button>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-3">
          <Button type="submit" variant="admin-primary">
            {productType ? 'Actualizar Tipo' : 'Crear Tipo'}
          </Button>
        </div>
      </div>
    </form>
  );
};
