import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { inputTypesService, type CreateInputTypeDto, type UpdateInputTypeDto } from '../../services/input-types.service';
import { ArrowLeft, Save, X } from 'lucide-react';

export default function InputTypeDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = id !== 'new';

  const [formData, setFormData] = useState<CreateInputTypeDto>({
    name: '',
    description: '',
    sortOrder: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing) {
      loadInputType();
    }
  }, [id]);

  const loadInputType = async () => {
    try {
      setLoading(true);
      const data = await inputTypesService.getById(parseInt(id!));
      setFormData({
        name: data.name,
        description: data.description || '',
        sortOrder: data.sortOrder,
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

      if (isEditing) {
        const updateData: UpdateInputTypeDto = {
          name: formData.name,
          description: formData.description || undefined,
          sortOrder: formData.sortOrder,
        };
        await inputTypesService.update(parseInt(id!), updateData);
      } else {
        await inputTypesService.create(formData);
      }

      navigate('/admin-panel/input-types');
    } catch (err) {
      setError('Error al guardar el tipo de insumo');
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
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate('/admin-panel/input-types')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Editar Tipo de Insumo' : 'Nuevo Tipo de Insumo'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isEditing
                ? 'Modifica la información del tipo de insumo'
                : 'Crea un nuevo tipo de insumo para el inventario'}
            </p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 md:p-8">
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
                placeholder="Ej: Sublimación, DTF, Vinilo"
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
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/admin-panel/input-types')}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Guardando...' : 'Guardar Tipo de Insumo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
