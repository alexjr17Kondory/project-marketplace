import { useEffect, useState } from 'react';
import { Package, Loader } from 'lucide-react';
import { inputsService, type Input } from '../../services/inputs.service';
import { useToast } from '../../context/ToastContext';

interface TemplateRecipesSectionProps {
  templateId: number;
  selectedInputIds: number[];
  onInputsChange: (inputIds: number[]) => void;
}

export function TemplateRecipesSection({
  selectedInputIds,
  onInputsChange,
}: TemplateRecipesSectionProps) {
  const { showToast } = useToast();
  const [inputs, setInputs] = useState<Input[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInputs();
  }, []);

  useEffect(() => {
    console.log('TemplateRecipesSection - selectedInputIds cambiaron:', selectedInputIds);
  }, [selectedInputIds]);

  const loadInputs = async () => {
    setLoading(true);
    try {
      const allInputs = await inputsService.getAll();
      // Filtrar solo insumos activos (sin importar si tienen variantes o stock)
      setInputs(allInputs.filter((input) => input.isActive));
    } catch (error: any) {
      console.error('Error loading inputs:', error);
      showToast('Error al cargar insumos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleInput = (inputId: number) => {
    if (selectedInputIds.includes(inputId)) {
      onInputsChange(selectedInputIds.filter(id => id !== inputId));
    } else {
      onInputsChange([...selectedInputIds, inputId]);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-3" />
        <p className="text-sm text-gray-500">Cargando insumos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Package className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 text-sm text-blue-800">
            <p className="font-medium mb-1">Insumos del Template</p>
            <p>
              Selecciona los insumos base (camisetas/suéteres) que se usarán para este template.
              El sistema asociará automáticamente las variantes del insumo con las variantes del template que coincidan en color y talla.
            </p>
          </div>
        </div>
      </div>

      {/* Inputs Selection */}
      <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
        {inputs.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No hay insumos con variantes disponibles
          </p>
        ) : (
          <div className="space-y-2">
            {inputs.map((input) => {
              const variantCount = input._count?.variants || 0;
              const totalStock = input.variants?.reduce((sum, v) => sum + Number(v.currentStock), 0) || 0;

              return (
                <label
                  key={input.id}
                  className="flex items-center gap-3 p-3 hover:bg-white rounded-lg cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedInputIds.includes(input.id)}
                    onChange={() => toggleInput(input.id)}
                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {input.name}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded">
                        {input.inputType?.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>Código: {input.code}</span>
                      <span>•</span>
                      <span>{variantCount} variantes</span>
                      <span>•</span>
                      <span>Stock total: {totalStock} {input.unitOfMeasure}</span>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Count */}
      {selectedInputIds.length > 0 && (
        <p className="text-xs text-gray-500">
          {selectedInputIds.length} insumo{selectedInputIds.length !== 1 ? 's' : ''} seleccionado{selectedInputIds.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
