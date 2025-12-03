import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { catalogsService } from '../../services/catalogs.service';
import type { ProductType, Category, Size } from '../../services/catalogs.service';

export const ProductTypeDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = id !== 'new';

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    categoryId: null as number | null,
    isActive: true,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [availableSizes, setAvailableSizes] = useState<Size[]>([]);
  const [selectedSizeIds, setSelectedSizeIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar categorías y tallas disponibles
      const [categoriesData, sizesData] = await Promise.all([
        catalogsService.getCategories(),
        catalogsService.getSizes(),
      ]);

      setCategories(categoriesData);
      setAvailableSizes(sizesData);

      // Si estamos editando, cargar los datos del tipo
      if (isEditing && id) {
        const typeData = await catalogsService.getProductTypeById(Number(id));
        setFormData({
          name: typeData.name,
          slug: typeData.slug,
          description: typeData.description || '',
          categoryId: typeData.categoryId,
          isActive: typeData.isActive,
        });

        // Cargar las tallas asignadas a este tipo
        const assignedSizes = await catalogsService.getSizesByProductType(Number(id));
        setSelectedSizeIds(assignedSizes.map(s => s.id));
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar los datos');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSizeIds.length === 0) {
      alert('Debes seleccionar al menos una talla');
      return;
    }

    try {
      setSaving(true);

      if (isEditing && id) {
        // Actualizar tipo existente
        await catalogsService.updateProductType(Number(id), formData);
        // Actualizar tallas asignadas
        await catalogsService.assignSizesToProductType(Number(id), selectedSizeIds);
      } else {
        // Crear nuevo tipo
        const newType = await catalogsService.createProductType(formData);
        // Asignar tallas al nuevo tipo
        await catalogsService.assignSizesToProductType(newType.id, selectedSizeIds);
      }

      navigate('/admin/product-types');
    } catch (error) {
      console.error('Error guardando tipo:', error);
      alert('Error al guardar el tipo de producto');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/product-types')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Tipo de Producto' : 'Nuevo Tipo de Producto'}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Configura el tipo de producto y las tallas disponibles
          </p>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nombre */}
          <div>
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
          <div>
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
          <div>
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
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
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
          <div className="md:col-span-2">
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
        </div>

        {/* Selector de Tallas */}
        <div>
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

        {/* Botones */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="admin-secondary"
            onClick={() => navigate('/admin/product-types')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="admin-primary"
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Tipo'}
          </Button>
        </div>
      </form>
    </div>
  );
};
