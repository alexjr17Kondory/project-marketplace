import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { inputsService, type CreateInputDto, type UpdateInputDto, type Input, type InputVariant, type InputVariantMovement } from '../../services/inputs.service';
import { inputTypesService, type InputType } from '../../services/input-types.service';
import { catalogsService, type Color } from '../../services/catalogs.service';
import { Button } from '../../components/shared/Button';
import { ArrowLeft, Save, Trash2, Plus, X, Palette, Grid3X3, History, ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function InputDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const isEditing = id !== 'new';

  const [inputTypes, setInputTypes] = useState<InputType[]>([]);
  const [availableColors, setAvailableColors] = useState<Color[]>([]);
  const [currentInput, setCurrentInput] = useState<Input | null>(null);
  const [selectedInputType, setSelectedInputType] = useState<InputType | null>(null);

  const [formData, setFormData] = useState<CreateInputDto>({
    code: '',
    inputTypeId: 0,
    name: '',
    description: '',
    unitOfMeasure: 'unidad',
    minStock: 0,
    maxStock: undefined,
    unitCost: 0,
    supplier: '',
    supplierCode: '',
    notes: '',
    colorIds: [],
    sizeIds: [],
  });

  const [loading, setLoading] = useState(false);
  const [savingColor, setSavingColor] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Movements state
  const [selectedVariant, setSelectedVariant] = useState<InputVariant | null>(null);
  const [movements, setMovements] = useState<InputVariantMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [id]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [typesData, colorsData] = await Promise.all([
        inputTypesService.getAll(),
        catalogsService.getColors(),
      ]);

      const validTypes = Array.isArray(typesData) ? typesData.filter(t => t.isActive) : [];
      setInputTypes(validTypes);
      setAvailableColors(colorsData.filter(c => c.isActive));

      if (isEditing) {
        const data = await inputsService.getById(parseInt(id!));
        setCurrentInput(data);
        setFormData({
          code: data.code,
          inputTypeId: data.inputTypeId,
          name: data.name,
          description: data.description || '',
          unitOfMeasure: data.unitOfMeasure,
          minStock: Number(data.minStock),
          maxStock: data.maxStock ? Number(data.maxStock) : undefined,
          unitCost: Number(data.unitCost),
          supplier: data.supplier || '',
          supplierCode: data.supplierCode || '',
          notes: data.notes || '',
          colorIds: data.inputColors?.map(ic => ic.colorId) || [],
        });

        // Set the selected input type
        const inputType = validTypes.find(t => t.id === data.inputTypeId);
        setSelectedInputType(inputType || null);
      }
    } catch (err) {
      setError('Error al cargar datos');
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

    // Si el tipo tiene variantes y es nuevo, debe seleccionar al menos un color y una talla
    if (!isEditing && selectedInputType?.hasVariants) {
      if (!formData.colorIds || formData.colorIds.length === 0) {
        alert('Debe seleccionar al menos un color para insumos con variantes');
        return;
      }
      if (!formData.sizeIds || formData.sizeIds.length === 0) {
        alert('Debe seleccionar al menos una talla para insumos con variantes');
        return;
      }
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

      showToast('Insumo guardado correctamente', 'success');
      navigate('/admin-panel/inputs');
    } catch (err) {
      setError('Error al guardar el insumo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este insumo?')) return;

    try {
      setLoading(true);
      await inputsService.delete(parseInt(id!));
      showToast('Insumo eliminado', 'success');
      navigate('/admin-panel/inputs');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar el insumo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'inputTypeId') {
      const typeId = parseInt(value);
      const inputType = inputTypes.find(t => t.id === typeId);
      setSelectedInputType(inputType || null);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: ['inputTypeId', 'minStock', 'maxStock', 'unitCost'].includes(name)
        ? value === '' ? (name === 'maxStock' ? undefined : 0) : Number(value)
        : value,
    }));
  };

  const toggleColor = (colorId: number) => {
    setFormData((prev) => ({
      ...prev,
      colorIds: prev.colorIds?.includes(colorId)
        ? prev.colorIds.filter(id => id !== colorId)
        : [...(prev.colorIds || []), colorId],
    }));
  };

  const toggleSize = (sizeId: number) => {
    setFormData((prev) => ({
      ...prev,
      sizeIds: prev.sizeIds?.includes(sizeId)
        ? prev.sizeIds.filter(id => id !== sizeId)
        : [...(prev.sizeIds || []), sizeId],
    }));
  };

  // Add color to existing input
  const handleAddColor = async (colorId: number) => {
    if (!currentInput) return;

    try {
      setSavingColor(true);
      const updated = await inputsService.addColor(currentInput.id, colorId);
      setCurrentInput(updated);
      showToast('Color agregado', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al agregar color', 'error');
    } finally {
      setSavingColor(false);
    }
  };

  // Remove color from existing input
  const handleRemoveColor = async (colorId: number) => {
    if (!currentInput) return;

    if (!confirm('¿Eliminar este color? Se eliminarán las variantes asociadas si no tienen stock.')) return;

    try {
      setSavingColor(true);
      const updated = await inputsService.removeColor(currentInput.id, colorId);
      setCurrentInput(updated);
      showToast('Color eliminado', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error al eliminar color', 'error');
    } finally {
      setSavingColor(false);
    }
  };

  // Get available colors (not yet assigned)
  const getAvailableColorsForInput = () => {
    const assignedColorIds = currentInput?.inputColors?.map(ic => ic.colorId) || [];
    return availableColors.filter(c => !assignedColorIds.includes(c.id));
  };

  // Format currency
  const formatCurrency = (value: number | string) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(Number(value));
  };

  // Get sizes from input type
  const getSizes = () => {
    return selectedInputType?.inputTypeSizes?.map(its => its.size) ||
           currentInput?.inputType?.inputTypeSizes?.map(its => its.size) || [];
  };

  // Get variant by color and size
  const getVariant = (colorId: number, sizeId: number): InputVariant | undefined => {
    return currentInput?.variants?.find(v => v.colorId === colorId && v.sizeId === sizeId);
  };

  // Load movements for a variant
  const loadVariantMovements = async (variant: InputVariant) => {
    setSelectedVariant(variant);
    setLoadingMovements(true);
    try {
      const data = await inputsService.getVariantMovements(variant.id, 20);
      setMovements(data);
    } catch (err) {
      console.error('Error loading movements:', err);
      setMovements([]);
    } finally {
      setLoadingMovements(false);
    }
  };

  // Get movement type label and color
  const getMovementTypeInfo = (type: string) => {
    const types: Record<string, { label: string; color: string; icon: 'in' | 'out' | 'adjust' }> = {
      ENTRADA: { label: 'Entrada', color: 'bg-green-100 text-green-700', icon: 'in' },
      SALIDA: { label: 'Salida', color: 'bg-red-100 text-red-700', icon: 'out' },
      AJUSTE: { label: 'Ajuste', color: 'bg-yellow-100 text-yellow-700', icon: 'adjust' },
      RESERVA: { label: 'Reserva', color: 'bg-blue-100 text-blue-700', icon: 'out' },
      LIBERACION: { label: 'Liberación', color: 'bg-blue-100 text-blue-700', icon: 'in' },
      DEVOLUCION: { label: 'Devolución', color: 'bg-orange-100 text-orange-700', icon: 'in' },
      MERMA: { label: 'Merma', color: 'bg-gray-100 text-gray-700', icon: 'out' },
    };
    return types[type] || { label: type, color: 'bg-gray-100 text-gray-700', icon: 'adjust' };
  };

  // Calculate total stock
  const getTotalStock = () => {
    if (!currentInput?.variants) return 0;
    return currentInput.variants.reduce((sum, v) => sum + Number(v.currentStock), 0);
  };

  if (loading && isEditing && !currentInput) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg text-gray-600">Cargando...</div>
      </div>
    );
  }

  const hasVariants = selectedInputType?.hasVariants || currentInput?.inputType?.hasVariants;
  const sizes = getSizes();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Insumo' : 'Nuevo Insumo'}
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            {isEditing
              ? 'Modifica la información del insumo'
              : 'Crea un nuevo insumo para el inventario'}
          </p>
        </div>
        <button
          onClick={() => navigate('/admin-panel/inputs')}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Insumos
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className={`grid gap-6 ${isEditing && hasVariants ? 'lg:grid-cols-3' : ''}`}>
        {/* Form - full width when creating, 2 columns when editing with variants */}
        <div className={isEditing && hasVariants ? 'lg:col-span-2' : ''}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                {/* Código y Tipo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Ej: CAM-BASE-001"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="inputTypeId" className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Insumo <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="inputTypeId"
                      name="inputTypeId"
                      value={formData.inputTypeId}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                      disabled={isEditing}
                    >
                      <option value={0}>Seleccionar tipo...</option>
                      {inputTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name} {type.hasVariants ? '(con variantes)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Ej: Camiseta Cuello Redondo, Tinta Sublimación"
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
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    placeholder="Describe las características del insumo..."
                  />
                </div>

                {/* Unidad y Costo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="unitOfMeasure" className="block text-sm font-medium text-gray-700 mb-2">
                      Unidad de Medida <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="unitOfMeasure"
                      name="unitOfMeasure"
                      value={formData.unitOfMeasure}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    >
                      <option value="unidad">Unidad</option>
                      <option value="metro">Metro</option>
                      <option value="centimetro">Centímetro</option>
                      <option value="litro">Litro</option>
                      <option value="mililitro">Mililitro</option>
                      <option value="kilogramo">Kilogramo</option>
                      <option value="gramo">Gramo</option>
                      <option value="rollo">Rollo</option>
                      <option value="hoja">Hoja</option>
                      <option value="pliego">Pliego</option>
                      <option value="caja">Caja</option>
                      <option value="paquete">Paquete</option>
                      <option value="par">Par</option>
                      <option value="docena">Docena</option>
                    </select>
                  </div>

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
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Stock Mínimo y Máximo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="minStock" className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Mínimo
                    </label>
                    <input
                      type="number"
                      id="minStock"
                      name="minStock"
                      value={formData.minStock}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Colores y Tallas para nuevo insumo con variantes */}
                {!isEditing && hasVariants && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Colores */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Colores Disponibles <span className="text-red-500">*</span>
                      </label>
                      <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 max-h-64 overflow-y-auto">
                        {availableColors.length === 0 ? (
                          <p className="text-sm text-gray-500">No hay colores disponibles</p>
                        ) : (
                          <div className="space-y-2">
                            {availableColors.map(color => (
                              <label
                                key={color.id}
                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                  formData.colorIds?.includes(color.id)
                                    ? 'bg-orange-50 border border-orange-300'
                                    : 'hover:bg-white'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.colorIds?.includes(color.id) || false}
                                  onChange={() => toggleColor(color.id)}
                                  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                                />
                                <div
                                  className="w-8 h-8 rounded border border-gray-300 flex-shrink-0"
                                  style={{ backgroundColor: color.hexCode }}
                                  title={color.hexCode}
                                />
                                <span className="text-sm font-medium text-gray-700 flex-1">
                                  {color.name}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      {formData.colorIds && formData.colorIds.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.colorIds.length} color{formData.colorIds.length !== 1 ? 'es' : ''} seleccionado{formData.colorIds.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>

                    {/* Tallas (seleccionables de las disponibles en el tipo) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Tallas Disponibles <span className="text-red-500">*</span>
                      </label>
                      <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 max-h-64 overflow-y-auto">
                        {sizes.length === 0 ? (
                          <p className="text-sm text-gray-500">El tipo de insumo no tiene tallas asignadas</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {sizes.map(size => (
                              <label
                                key={size.id}
                                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                  formData.sizeIds?.includes(size.id)
                                    ? 'bg-orange-50 border border-orange-300'
                                    : 'bg-white hover:bg-gray-50 border border-gray-200'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.sizeIds?.includes(size.id) || false}
                                  onChange={() => toggleSize(size.id)}
                                  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                  {size.abbreviation} <span className="text-xs text-gray-500">({size.name})</span>
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      {formData.sizeIds && formData.sizeIds.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.sizeIds.length} talla{formData.sizeIds.length !== 1 ? 's' : ''} seleccionada{formData.sizeIds.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>

                    {/* Info de variantes que se crearán */}
                    {formData.colorIds && formData.colorIds.length > 0 && formData.sizeIds && formData.sizeIds.length > 0 && (
                      <div className="col-span-full bg-orange-50 rounded-lg p-3 border border-orange-200">
                        <p className="text-sm text-orange-700">
                          <strong>Se crearán {formData.colorIds.length * formData.sizeIds.length} variantes</strong> automáticamente
                          ({formData.colorIds.length} colores × {formData.sizeIds.length} tallas)
                        </p>
                      </div>
                    )}
                  </div>
                )}
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

        {/* Variants Panel - 1 column (only when editing and hasVariants) */}
        {isEditing && hasVariants && currentInput && (
          <div className="space-y-6">
            {/* Colors Management */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-gray-900">Colores</h3>
                </div>
              </div>

              {/* Current Colors */}
              <div className="space-y-2 mb-4">
                {currentInput.inputColors?.map((ic) => (
                  <div
                    key={ic.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full border border-gray-300"
                        style={{ backgroundColor: ic.color.hexCode }}
                      />
                      <span className="text-sm font-medium">{ic.color.name}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveColor(ic.colorId)}
                      disabled={savingColor}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {(!currentInput.inputColors || currentInput.inputColors.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-2">
                    Sin colores asignados
                  </p>
                )}
              </div>

              {/* Add Color */}
              {getAvailableColorsForInput().length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    Agregar color
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {getAvailableColorsForInput().map((color) => (
                      <button
                        key={color.id}
                        onClick={() => handleAddColor(color.id)}
                        disabled={savingColor}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-gray-300"
                          style={{ backgroundColor: color.hexCode }}
                        />
                        {color.name}
                        <Plus className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Variants Matrix */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Grid3X3 className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Matriz de Variantes</h3>
                </div>
                <span className="text-sm text-gray-500">
                  Total: {getTotalStock()} unidades
                </span>
              </div>

              {currentInput.variants && currentInput.variants.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-1 text-gray-500 font-medium">Color</th>
                        {sizes.map((size) => (
                          <th key={size.id} className="text-center py-2 px-1 text-gray-500 font-medium">
                            {size.abbreviation}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentInput.inputColors?.map((ic) => (
                        <tr key={ic.id} className="border-b last:border-b-0">
                          <td className="py-2 px-1">
                            <div className="flex items-center gap-1">
                              <span
                                className="w-3 h-3 rounded-full border border-gray-300"
                                style={{ backgroundColor: ic.color.hexCode }}
                              />
                              <span className="text-xs">{ic.color.name}</span>
                            </div>
                          </td>
                          {sizes.map((size) => {
                            const variant = getVariant(ic.colorId, size.id);
                            const isSelected = selectedVariant?.id === variant?.id;
                            return (
                              <td key={size.id} className="text-center py-2 px-1">
                                <button
                                  onClick={() => variant && loadVariantMovements(variant)}
                                  className={`inline-block min-w-[32px] px-1.5 py-0.5 text-xs rounded cursor-pointer transition-all ${
                                    isSelected
                                      ? 'ring-2 ring-orange-500 bg-orange-100 text-orange-700'
                                      : variant && Number(variant.currentStock) > 0
                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                  }`}
                                  title="Click para ver movimientos"
                                >
                                  {variant ? Number(variant.currentStock) : 0}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Agrega colores para generar variantes
                </p>
              )}
            </div>

            {/* Movements Panel */}
            {selectedVariant && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-900">Movimientos</h3>
                  </div>
                  <button
                    onClick={() => setSelectedVariant(null)}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Selected variant info */}
                <div className="mb-4 p-2 bg-gray-50 rounded-lg flex items-center gap-2">
                  {selectedVariant.color && (
                    <span
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: selectedVariant.color.hexCode }}
                    />
                  )}
                  <span className="text-sm font-medium">
                    {selectedVariant.color?.name || 'Sin color'} - {selectedVariant.size?.abbreviation || 'Sin talla'}
                  </span>
                  <span className="ml-auto text-sm text-gray-500">
                    Stock: {Number(selectedVariant.currentStock)}
                  </span>
                </div>

                {loadingMovements ? (
                  <div className="text-center py-4 text-sm text-gray-500">
                    Cargando movimientos...
                  </div>
                ) : movements.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {movements.map((mov) => {
                      const typeInfo = getMovementTypeInfo(mov.movementType);
                      return (
                        <div
                          key={mov.id}
                          className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg text-xs"
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {typeInfo.icon === 'in' && <ArrowDownCircle className="w-4 h-4 text-green-500" />}
                            {typeInfo.icon === 'out' && <ArrowUpCircle className="w-4 h-4 text-red-500" />}
                            {typeInfo.icon === 'adjust' && <RefreshCw className="w-4 h-4 text-yellow-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${typeInfo.color}`}>
                                {typeInfo.label}
                              </span>
                              <span className="font-medium text-gray-700">
                                {Number(mov.quantity) > 0 ? '+' : ''}{Number(mov.quantity)}
                              </span>
                            </div>
                            {mov.reason && (
                              <p className="text-gray-600 mt-0.5 truncate" title={mov.reason}>
                                {mov.reason}
                              </p>
                            )}
                            <p className="text-gray-400 mt-0.5">
                              {new Date(mov.createdAt).toLocaleDateString('es-CO', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-gray-400">Stock</p>
                            <p className="font-medium text-gray-700">{Number(mov.newStock)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Sin movimientos registrados
                  </p>
                )}
              </div>
            )}

            {/* Legend */}
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
              <p className="font-medium mb-1">Nota:</p>
              <p>El stock de cada variante se actualiza al recibir órdenes de compra. Haz clic en una celda para ver sus movimientos.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
