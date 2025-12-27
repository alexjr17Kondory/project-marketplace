import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { inputTypesService, type CreateInputTypeDto, type UpdateInputTypeDto } from '../../services/input-types.service';
import { catalogsService, type Size } from '../../services/catalogs.service';
import { Button } from '../../components/shared/Button';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';

export default function InputTypeDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = id !== 'new';

  const [formData, setFormData] = useState<CreateInputTypeDto>({
    name: '',
    description: '',
    sortOrder: 0,
    sizeIds: [],
  });

  const [availableSizes, setAvailableSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSizes();
    if (isEditing) {
      loadInputType();
    }
  }, [id]);

  const loadSizes = async () => {
    try {
      const sizes = await catalogsService.getSizes();
      setAvailableSizes(sizes.filter((s) => s.isActive));
    } catch (err) {
      console.error('Error al cargar tallas:', err);
    }
  };

  const loadInputType = async () => {
    try {
      setLoading(true);
      const data = await inputTypesService.getById(parseInt(id!));
      setFormData({
        name: data.name,
        description: data.description || '',
        sortOrder: data.sortOrder,
        sizeIds: data.inputTypeSizes?.map((its) => its.sizeId) || [],
      });
    } catch (err) {
      setError('Error al cargar el tipo de insumo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('El nombre es requerido');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // hasVariants se determina automáticamente por si hay tallas seleccionadas
      const hasVariants = formData.sizeIds && formData.sizeIds.length > 0;

      if (isEditing) {
        const updateData: UpdateInputTypeDto = {
          name: formData.name,
          description: formData.description || undefined,
          sortOrder: formData.sortOrder,
          hasVariants,
          sizeIds: formData.sizeIds || [],
        };
        await inputTypesService.update(parseInt(id!), updateData);
      } else {
        await inputTypesService.create({
          ...formData,
          hasVariants,
          sizeIds: formData.sizeIds || [],
        });
      }

      navigate('/admin-panel/input-types');
    } catch (err) {
      setError('Error al guardar el tipo de insumo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este tipo de insumo?')) return;

    try {
      setLoading(true);
      await inputTypesService.delete(parseInt(id!));
      navigate('/admin-panel/input-types');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar el tipo de insumo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'sortOrder' ? parseInt(value) || 0 : value,
    }));
  };

  const toggleSize = (sizeId: number) => {
    setFormData((prev) => ({
      ...prev,
      sizeIds: prev.sizeIds?.includes(sizeId)
        ? prev.sizeIds.filter((id) => id !== sizeId)
        : [...(prev.sizeIds || []), sizeId],
    }));
  };

  if (loading && isEditing) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Tipo de Insumo' : 'Nuevo Tipo de Insumo'}
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            {isEditing
              ? 'Modifica la información del tipo de insumo'
              : 'Crea un nuevo tipo de insumo para el inventario'}
          </p>
        </div>
        <button
          onClick={() => navigate('/admin-panel/input-types')}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Tipos de Insumo
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Nombre */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                placeholder="Ej: Camisetas Base, Sublimación, DTF"
                required
              />
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors resize-none"
                placeholder="Describe el tipo de insumo..."
              />
            </div>

            {/* Orden */}
            <div>
              <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-2">
                Orden de Clasificación
              </label>
              <input
                type="number"
                id="sortOrder"
                name="sortOrder"
                value={formData.sortOrder}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                placeholder="0"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Los números menores aparecen primero en el listado
              </p>
            </div>

            {/* Separador */}
            <hr className="border-gray-200" />

            {/* Tallas Disponibles */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tallas Disponibles
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Selecciona las tallas que aplican a este tipo de insumo (ej: camisetas, gorras).
                Si no se seleccionan tallas, los insumos de este tipo se manejarán por unidad simple (ej: tintas, papel).
              </p>
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                {availableSizes.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay tallas disponibles</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {availableSizes.map((size) => (
                      <label
                        key={size.id}
                        className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                          formData.sizeIds?.includes(size.id)
                            ? 'bg-orange-50 border-2 border-orange-500'
                            : 'bg-white border-2 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.sizeIds?.includes(size.id) || false}
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
              {formData.sizeIds && formData.sizeIds.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {formData.sizeIds.length} talla{formData.sizeIds.length !== 1 ? 's' : ''} seleccionada{formData.sizeIds.length !== 1 ? 's' : ''} - Los insumos generarán variantes (talla × color)
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-3">
            {isEditing && (
              <Button
                type="button"
                variant="admin-danger"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            )}
            <Button
              type="submit"
              variant="admin-primary"
              disabled={loading}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
