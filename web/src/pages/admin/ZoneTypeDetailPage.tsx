import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { zoneTypesService, type CreateZoneTypeDto, type UpdateZoneTypeDto } from '../../services/zone-types.service';
import { Button } from '../../components/shared/Button';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';

export default function ZoneTypeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [formData, setFormData] = useState<CreateZoneTypeDto>({
    name: '',
    slug: '',
    description: '',
    sortOrder: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isNew && id) {
      loadZoneType(parseInt(id));
    }
  }, [id, isNew]);

  const loadZoneType = async (zoneTypeId: number) => {
    try {
      setLoading(true);
      const data = await zoneTypesService.getById(zoneTypeId);
      setFormData({
        name: data.name,
        slug: data.slug,
        description: data.description || '',
        sortOrder: data.sortOrder,
      });
    } catch (err) {
      setError('Error al cargar el tipo de zona');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isNew) {
        await zoneTypesService.create(formData);
      } else {
        await zoneTypesService.update(parseInt(id!), formData);
      }
      navigate('/admin-panel/zone-types');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el tipo de zona');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este tipo de zona?')) return;

    try {
      setLoading(true);
      await zoneTypesService.delete(parseInt(id!));
      navigate('/admin-panel/zone-types');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar el tipo de zona');
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

  // Auto-generar slug desde el nombre
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    setFormData((prev) => ({
      ...prev,
      name,
      slug,
    }));
  };

  if (loading && !isNew) {
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
            {isNew ? 'Nuevo Tipo de Zona' : 'Editar Tipo de Zona'}
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            {isNew
              ? 'Crea un nuevo tipo de zona para las plantillas'
              : 'Modifica la información del tipo de zona'}
          </p>
        </div>
        <button
          onClick={() => navigate('/admin-panel/zone-types')}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Tipos de Zona
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
                onChange={handleNameChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                placeholder="Ej: Frente, Espalda, Mangas"
                required
              />
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors font-mono text-sm"
                placeholder="frente"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Identificador único (se genera automáticamente desde el nombre)
              </p>
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
                placeholder="Describe el tipo de zona..."
              />
            </div>

            {/* Orden */}
            <div>
              <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-2">
                Orden de Aparición
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
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-3">
            {!isNew && (
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
