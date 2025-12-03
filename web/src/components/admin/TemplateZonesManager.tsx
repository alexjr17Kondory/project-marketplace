import { useState, useEffect } from 'react';
import { templateZonesService, type TemplateZone, type CreateTemplateZoneDto, type CreateZoneInputDto } from '../../services/template-zones.service';
import { zoneTypesService, type ZoneType } from '../../services/zone-types.service';
import { inputsService, type Input } from '../../services/inputs.service';
import { Button } from '../shared/Button';

interface TemplateZonesManagerProps {
  templateId: number;
}

export const TemplateZonesManager = ({ templateId }: TemplateZonesManagerProps) => {
  const [zones, setZones] = useState<TemplateZone[]>([]);
  const [zoneTypes, setZoneTypes] = useState<ZoneType[]>([]);
  const [inputs, setInputs] = useState<Input[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [editingZone, setEditingZone] = useState<TemplateZone | null>(null);
  const [showInputForm, setShowInputForm] = useState<number | null>(null);

  const [zoneFormData, setZoneFormData] = useState<CreateTemplateZoneDto>({
    templateId,
    zoneTypeId: 0,
    name: '',
    positionX: 0,
    positionY: 0,
    width: 100,
    height: 100,
    isRequired: false,
    maxCharacters: undefined,
    allowedColors: '',
    sortOrder: 0,
  });

  const [inputFormData, setInputFormData] = useState<CreateZoneInputDto>({
    inputId: 0,
    quantityPerUnit: 1,
  });

  useEffect(() => {
    loadData();
  }, [templateId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [zonesData, typesData, inputsData] = await Promise.all([
        templateZonesService.getByTemplateId(templateId),
        zoneTypesService.getAll(),
        inputsService.getAll(),
      ]);

      // Validate that data is an array before using filter
      const validZones = Array.isArray(zonesData) ? zonesData : [];
      const validTypes = Array.isArray(typesData) ? typesData : [];
      const validInputs = Array.isArray(inputsData) ? inputsData : [];

      setZones(validZones);
      setZoneTypes(validTypes.filter(t => t.isActive));
      setInputs(validInputs.filter(i => i.isActive));
    } catch (err) {
      setError('Error al cargar las zonas');
      setZones([]);
      setZoneTypes([]);
      setInputs([]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateZone = async () => {
    if (!zoneFormData.zoneTypeId || zoneFormData.zoneTypeId === 0) {
      alert('Debe seleccionar un tipo de zona');
      return;
    }

    if (!zoneFormData.name.trim()) {
      alert('El nombre de la zona es requerido');
      return;
    }

    try {
      await templateZonesService.create(zoneFormData);
      await loadData();
      resetZoneForm();
    } catch (err) {
      alert('Error al crear la zona');
      console.error(err);
    }
  };

  const handleUpdateZone = async () => {
    if (!editingZone) return;

    try {
      await templateZonesService.update(editingZone.id, {
        zoneTypeId: zoneFormData.zoneTypeId,
        name: zoneFormData.name,
        positionX: zoneFormData.positionX,
        positionY: zoneFormData.positionY,
        width: zoneFormData.width,
        height: zoneFormData.height,
        isRequired: zoneFormData.isRequired,
        maxCharacters: zoneFormData.maxCharacters,
        allowedColors: zoneFormData.allowedColors,
        sortOrder: zoneFormData.sortOrder,
      });
      await loadData();
      resetZoneForm();
    } catch (err) {
      alert('Error al actualizar la zona');
      console.error(err);
    }
  };

  const handleDeleteZone = async (zoneId: number) => {
    if (!confirm('¿Estás seguro de eliminar esta zona?')) return;

    try {
      await templateZonesService.delete(zoneId);
      await loadData();
    } catch (err) {
      alert('Error al eliminar la zona');
      console.error(err);
    }
  };

  const handleEditZone = (zone: TemplateZone) => {
    setEditingZone(zone);
    setZoneFormData({
      templateId,
      zoneTypeId: zone.zoneTypeId,
      name: zone.name,
      positionX: zone.positionX,
      positionY: zone.positionY,
      width: zone.width,
      height: zone.height,
      isRequired: zone.isRequired,
      maxCharacters: zone.maxCharacters || undefined,
      allowedColors: zone.allowedColors || '',
      sortOrder: zone.sortOrder,
    });
    setShowZoneForm(true);
  };

  const resetZoneForm = () => {
    setShowZoneForm(false);
    setEditingZone(null);
    setZoneFormData({
      templateId,
      zoneTypeId: 0,
      name: '',
      positionX: 0,
      positionY: 0,
      width: 100,
      height: 100,
      isRequired: false,
      maxCharacters: undefined,
      allowedColors: '',
      sortOrder: 0,
    });
  };

  const handleAssignInput = async (zoneId: number) => {
    if (!inputFormData.inputId || inputFormData.inputId === 0) {
      alert('Debe seleccionar un insumo');
      return;
    }

    try {
      await templateZonesService.upsertZoneInput(zoneId, inputFormData);
      await loadData();
      setShowInputForm(null);
      setInputFormData({ inputId: 0, quantityPerUnit: 1 });
    } catch (err) {
      alert('Error al asignar el insumo');
      console.error(err);
    }
  };

  const handleRemoveInput = async (zoneId: number) => {
    if (!confirm('¿Estás seguro de eliminar el insumo de esta zona?')) return;

    try {
      await templateZonesService.deleteZoneInput(zoneId);
      await loadData();
    } catch (err) {
      alert('Error al eliminar el insumo');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Cargando zonas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Zonas del Template</h3>
        <Button
          type="button"
          onClick={() => setShowZoneForm(true)}
          variant="admin-secondary"
        >
          Agregar Zona
        </Button>
      </div>

      {/* Zone Form */}
      {showZoneForm && (
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
          <h4 className="text-md font-semibold mb-3">
            {editingZone ? 'Editar Zona' : 'Nueva Zona'}
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Zona *
              </label>
              <select
                value={zoneFormData.zoneTypeId}
                onChange={(e) => setZoneFormData({ ...zoneFormData, zoneTypeId: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              >
                <option value={0}>Seleccionar tipo...</option>
                {zoneTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={zoneFormData.name}
                onChange={(e) => setZoneFormData({ ...zoneFormData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Posición X (px)
              </label>
              <input
                type="number"
                value={zoneFormData.positionX}
                onChange={(e) => setZoneFormData({ ...zoneFormData, positionX: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Posición Y (px)
              </label>
              <input
                type="number"
                value={zoneFormData.positionY}
                onChange={(e) => setZoneFormData({ ...zoneFormData, positionY: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ancho (px)
              </label>
              <input
                type="number"
                value={zoneFormData.width}
                onChange={(e) => setZoneFormData({ ...zoneFormData, width: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alto (px)
              </label>
              <input
                type="number"
                value={zoneFormData.height}
                onChange={(e) => setZoneFormData({ ...zoneFormData, height: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Caracteres
              </label>
              <input
                type="number"
                value={zoneFormData.maxCharacters || ''}
                onChange={(e) => setZoneFormData({ ...zoneFormData, maxCharacters: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Orden
              </label>
              <input
                type="number"
                value={zoneFormData.sortOrder}
                onChange={(e) => setZoneFormData({ ...zoneFormData, sortOrder: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Colores Permitidos (hex separados por coma)
              </label>
              <input
                type="text"
                value={zoneFormData.allowedColors}
                onChange={(e) => setZoneFormData({ ...zoneFormData, allowedColors: e.target.value })}
                placeholder="#000000, #FFFFFF"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={zoneFormData.isRequired}
                  onChange={(e) => setZoneFormData({ ...zoneFormData, isRequired: e.target.checked })}
                  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-gray-700">Zona requerida</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Button
              type="button"
              onClick={resetZoneForm}
              variant="admin-secondary"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={editingZone ? handleUpdateZone : handleCreateZone}
              variant="admin-primary"
            >
              {editingZone ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </div>
      )}

      {/* Zones List */}
      <div className="space-y-3">
        {zones.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            No hay zonas definidas para este template
          </p>
        ) : (
          zones.map((zone) => (
            <div key={zone.id} className="bg-white border border-gray-300 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold">{zone.name}</h4>
                  <p className="text-sm text-gray-600">
                    Tipo: {zone.zoneType?.name} | Posición: ({zone.positionX}, {zone.positionY}) | Tamaño: {zone.width}x{zone.height}px
                  </p>
                  {zone.isRequired && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded">
                      Requerida
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditZone(zone)}
                    className="text-blue-600 hover:text-blue-900 text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteZone(zone.id)}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              {/* Zone Input Assignment */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Insumo Asociado:</span>
                  {zone.zoneInput ? (
                    <button
                      onClick={() => handleRemoveInput(zone.id)}
                      className="text-red-600 hover:text-red-900 text-xs"
                    >
                      Eliminar
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowInputForm(zone.id)}
                      className="text-blue-600 hover:text-blue-900 text-xs"
                    >
                      Asignar Insumo
                    </button>
                  )}
                </div>

                {zone.zoneInput ? (
                  <div className="bg-gray-50 p-2 rounded text-sm">
                    <span className="font-medium">{zone.zoneInput.input?.name}</span>
                    <span className="text-gray-600"> - {zone.zoneInput.quantityPerUnit} {zone.zoneInput.input?.unit} por unidad</span>
                  </div>
                ) : showInputForm === zone.id ? (
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Insumo
                        </label>
                        <select
                          value={inputFormData.inputId}
                          onChange={(e) => setInputFormData({ ...inputFormData, inputId: parseInt(e.target.value) })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value={0}>Seleccionar...</option>
                          {inputs.map((input) => (
                            <option key={input.id} value={input.id}>
                              {input.name} ({input.unit})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Cantidad por unidad
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={inputFormData.quantityPerUnit}
                          onChange={(e) => setInputFormData({ ...inputFormData, quantityPerUnit: parseFloat(e.target.value) })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => {
                          setShowInputForm(null);
                          setInputFormData({ inputId: 0, quantityPerUnit: 1 });
                        }}
                        className="text-xs text-gray-600 hover:text-gray-900"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleAssignInput(zone.id)}
                        className="text-xs text-blue-600 hover:text-blue-900"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">Sin insumo asignado</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
