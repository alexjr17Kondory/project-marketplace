import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { inputsService, type Input, type InputFilters } from '../../services/inputs.service';
import { inputTypesService, type InputType } from '../../services/input-types.service';
import { Plus, Settings, Search, Filter } from 'lucide-react';

export default function InputsPage() {
  const navigate = useNavigate();
  const [inputs, setInputs] = useState<Input[]>([]);
  const [inputTypes, setInputTypes] = useState<InputType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<InputFilters>({
    inputTypeId: undefined,
    search: '',
    lowStock: false,
  });

  useEffect(() => {
    loadInputTypes();
    loadInputs();
  }, []);

  useEffect(() => {
    loadInputs();
  }, [filters]);

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

  const loadInputs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inputsService.getAll(filters);
      setInputs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Error al cargar los insumos');
      setInputs([]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (input: Input) => {
    if (input.currentStock <= input.minStock) {
      return { color: 'bg-red-100 text-red-800', label: 'Stock Bajo' };
    }
    if (input.maxStock && input.currentStock >= input.maxStock) {
      return { color: 'bg-yellow-100 text-yellow-800', label: 'Stock Alto' };
    }
    return { color: 'bg-green-100 text-green-800', label: 'Stock OK' };
  };

  if (loading && inputs.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg text-gray-600">Cargando insumos...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventario de Insumos</h1>
            <p className="text-sm text-gray-500 mt-1">
              Administra los insumos del inventario y su stock
            </p>
          </div>
          <button
            onClick={() => navigate('/admin-panel/inputs/new')}
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Insumo
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-medium text-gray-700">Filtros</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Insumo
            </label>
            <select
              value={filters.inputTypeId || ''}
              onChange={(e) => setFilters({ ...filters, inputTypeId: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Todos los tipos</option>
              {inputTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Nombre del insumo..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-end">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.lowStock}
                onChange={(e) => setFilters({ ...filters, lowStock: e.target.checked })}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Solo stock bajo</span>
            </label>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Actual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Min/Max
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Costo Unitario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado Stock
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inputs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-gray-500">No hay insumos registrados</p>
                  </td>
                </tr>
              ) : (
                inputs.map((input) => {
                  const stockStatus = getStockStatus(input);
                  return (
                    <tr key={input.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{input.name}</div>
                        {input.description && (
                          <div className="text-xs text-gray-500 mt-1">{input.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {input.inputType?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {input.currentStock} {input.unitOfMeasure}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {input.minStock} / {input.maxStock || '∞'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${Number(input.unitCost).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                          {stockStatus.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => navigate(`/admin-panel/inputs/${input.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
