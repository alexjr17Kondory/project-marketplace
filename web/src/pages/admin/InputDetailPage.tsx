import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { inputsService, type CreateInputDto, type UpdateInputDto } from '../../services/inputs.service';
import { inputTypesService, type InputType } from '../../services/input-types.service';
import { ArrowLeft, Save, X } from 'lucide-react';

export default function InputDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = id !== 'new';

  const [inputTypes, setInputTypes] = useState<InputType[]>([]);

  const [formData, setFormData] = useState<CreateInputDto>({
    code: '',
    inputTypeId: 0,
    name: '',
    description: '',
    unitOfMeasure: '',
    minStock: 0,
    maxStock: undefined,
    unitCost: 0,
    supplier: '',
    supplierCode: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInputTypes();
    if (isEditing) {
      loadInput();
    }
  }, [id]);

  const loadInputTypes = async () => {
    try {
      const data = await inputTypesService.getAll();
      const validData = Array.isArray(data) ? data : [];
      setInputTypes(validData.filter(t => t.isActive));
    } catch (err) {
      setInputTypes([]);
      console.error('Error al cargar tipos de insumo:', err);
    }
  };

  const loadInput = async () => {
    try {
      setLoading(true);
      const data = await inputsService.getById(parseInt(id!));
      setFormData({
        code: data.code,
        inputTypeId: data.inputTypeId,
        name: data.name,
        description: data.description || '',
        unitOfMeasure: data.unitOfMeasure,
        minStock: data.minStock,
        maxStock: data.maxStock || undefined,
        unitCost: data.unitCost,
        supplier: data.supplier || '',
        supplierCode: data.supplierCode || '',
        notes: data.notes || '',
      });
    } catch (err) {
      setError('Error al cargar el insumo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim()) {
      alert('El código es requerido');
      return;
    }

    if (!formData.name.trim()) {
      alert('El nombre es requerido');
      return;
    }

    if (!formData.inputTypeId || formData.inputTypeId === 0) {
      alert('Debe seleccionar un tipo de insumo');
      return;
    }

    if (!formData.unitOfMeasure.trim()) {
      alert('La unidad de medida es requerida');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isEditing) {
        const updateData: UpdateInputDto = {
          code: formData.code,
          inputTypeId: formData.inputTypeId,
          name: formData.name,
          description: formData.description || undefined,
          unitOfMeasure: formData.unitOfMeasure,
          minStock: formData.minStock,
          maxStock: formData.maxStock,
          unitCost: formData.unitCost,
          supplier: formData.supplier || undefined,
          supplierCode: formData.supplierCode || undefined,
          notes: formData.notes || undefined,
        };
        await inputsService.update(parseInt(id!), updateData);
      } else {
        await inputsService.create(formData);
      }

      navigate('/admin-panel/inputs');
    } catch (err) {
      setError('Error al guardar el insumo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ['inputTypeId', 'minStock', 'maxStock', 'unitCost'].includes(name)
        ? value === '' ? (name === 'maxStock' ? undefined : 0) : Number(value)
        : value,
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
            onClick={() => navigate('/admin-panel/inputs')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Editar Insumo' : 'Nuevo Insumo'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isEditing
                ? 'Modifica la información del insumo'
                : 'Crea un nuevo insumo para el inventario'}
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
            {/* Código */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Código <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                placeholder="Ej: INS-001, VIN-BLN-002"
                required
              />
            </div>

            {/* Tipo de Insumo */}
            <div>
              <label htmlFor="inputTypeId" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Insumo <span className="text-red-500">*</span>
              </label>
              <select
                id="inputTypeId"
                name="inputTypeId"
                value={formData.inputTypeId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                required
              >
                <option value={0}>Seleccionar tipo...</option>
                {inputTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

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
                placeholder="Ej: Tinta Sublimación Negro, Vinilo Blanco"
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
                placeholder="Describe las características del insumo..."
              />
            </div>

            {/* Unidad de Medida */}
            <div>
              <label htmlFor="unitOfMeasure" className="block text-sm font-medium text-gray-700 mb-2">
                Unidad de Medida <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="unitOfMeasure"
                name="unitOfMeasure"
                value={formData.unitOfMeasure}
                onChange={handleChange}
                placeholder="Ej: metros, kg, unidades, litros"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                required
              />
            </div>

            {/* Stock Mínimo y Máximo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="minStock" className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Mínimo <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="minStock"
                  name="minStock"
                  value={formData.minStock}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                  placeholder="0.00"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cantidad mínima antes de alertar por bajo stock
                </p>
              </div>

              <div>
                <label htmlFor="maxStock" className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Máximo
                </label>
                <input
                  type="number"
                  id="maxStock"
                  name="maxStock"
                  value={formData.maxStock || ''}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Opcional - Cantidad máxima recomendada
                </p>
              </div>
            </div>

            {/* Costo Unitario */}
            <div>
              <label htmlFor="unitCost" className="block text-sm font-medium text-gray-700 mb-2">
                Costo Unitario <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  id="unitCost"
                  name="unitCost"
                  value={formData.unitCost}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                  placeholder="0.00"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Costo por unidad de medida
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/admin-panel/inputs')}
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
              {loading ? 'Guardando...' : 'Guardar Insumo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
