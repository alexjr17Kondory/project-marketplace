import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Copy, Tag, X, Save, ArrowLeft } from 'lucide-react';
import * as labelTemplatesService from '../../../services/label-templates.service';
import { catalogsService } from '../../../services/catalogs.service';
import type { LabelTemplate, LabelZone } from '../../../types/label-template';
import type { ProductType } from '../../../services/catalogs.service';
import { LabelTemplateEditor } from '../../../components/admin/LabelTemplateEditor';

type ViewMode = 'list' | 'editor';

export default function LabelTemplatesPage() {
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingTemplate, setEditingTemplate] = useState<LabelTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  // Editor state
  const [editorData, setEditorData] = useState({
    name: '',
    backgroundImage: null as string | null,
    width: 170.08,
    height: 255.12,
    isDefault: false,
    productTypeIds: [] as number[],
    zones: [] as LabelZone[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesData, productTypesData] = await Promise.all([
        labelTemplatesService.getLabelTemplates(),
        catalogsService.getProductTypes(),
      ]);
      setTemplates(templatesData);
      setProductTypes(productTypesData.filter(pt => pt.isActive));
    } catch (err: any) {
      console.error('Error loading data:', err);
      alert(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await labelTemplatesService.getLabelTemplates();
      setTemplates(data);
    } catch (err: any) {
      console.error('Error loading templates:', err);
      alert(err.message || 'Error al cargar plantillas');
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setEditorData({
      name: '',
      backgroundImage: null,
      width: 170.08,
      height: 255.12,
      isDefault: false,
      productTypeIds: [],
      zones: [],
    });
    setViewMode('editor');
  };

  const handleEdit = async (template: LabelTemplate) => {
    try {
      // Cargar la plantilla completa con zonas
      const fullTemplate = await labelTemplatesService.getLabelTemplateById(template.id);

      setEditingTemplate(fullTemplate);
      setEditorData({
        name: fullTemplate.name,
        backgroundImage: fullTemplate.backgroundImage,
        width: fullTemplate.width,
        height: fullTemplate.height,
        isDefault: fullTemplate.isDefault,
        productTypeIds: fullTemplate.productTypes?.map(pt => pt.productTypeId) || [],
        zones: fullTemplate.zones || [],
      });
      setViewMode('editor');
    } catch (err: any) {
      console.error('Error loading template:', err);
      alert(err.message || 'Error al cargar plantilla');
    }
  };

  const handleSave = async () => {
    if (!editorData.name.trim()) {
      alert('El nombre es requerido');
      return;
    }

    if (editorData.width <= 0 || editorData.height <= 0) {
      alert('Las dimensiones deben ser mayores a 0');
      return;
    }

    setSaving(true);

    try {
      const templateData = {
        name: editorData.name,
        backgroundImage: editorData.backgroundImage,
        width: editorData.width,
        height: editorData.height,
        isDefault: editorData.isDefault,
        productTypeIds: editorData.productTypeIds,
      };

      let templateId: number;

      if (editingTemplate) {
        // Actualizar plantilla existente
        await labelTemplatesService.updateLabelTemplate(editingTemplate.id, templateData);
        templateId = editingTemplate.id;
      } else {
        // Crear nueva plantilla
        const created = await labelTemplatesService.createLabelTemplate(templateData);
        templateId = created.id;
      }

      // Guardar zonas
      // Primero, eliminar zonas que ya no existen (las que tienen ID positivo pero no están en la lista)
      if (editingTemplate) {
        const existingZoneIds = editorData.zones.filter(z => z.id > 0).map(z => z.id);
        const originalZoneIds = editingTemplate.zones?.map(z => z.id) || [];
        const zonesToDelete = originalZoneIds.filter(id => !existingZoneIds.includes(id));

        for (const zoneId of zonesToDelete) {
          await labelTemplatesService.deleteLabelZone(zoneId);
        }
      }

      // Luego, crear o actualizar cada zona
      for (const zone of editorData.zones) {
        if (zone.id < 0) {
          // Zona nueva (ID temporal negativo)
          await labelTemplatesService.createLabelZone(templateId, {
            zoneType: zone.zoneType,
            x: zone.x,
            y: zone.y,
            width: zone.width,
            height: zone.height,
            fontSize: zone.fontSize,
            fontWeight: zone.fontWeight,
            textAlign: zone.textAlign,
            fontColor: zone.fontColor,
            showLabel: zone.showLabel,
            rotation: zone.rotation,
            zIndex: zone.zIndex,
          });
        } else {
          // Zona existente
          await labelTemplatesService.updateLabelZone(zone.id, {
            x: zone.x,
            y: zone.y,
            width: zone.width,
            height: zone.height,
            fontSize: zone.fontSize,
            fontWeight: zone.fontWeight,
            textAlign: zone.textAlign,
            fontColor: zone.fontColor,
            showLabel: zone.showLabel,
            rotation: zone.rotation,
            zIndex: zone.zIndex,
          });
        }
      }

      await loadTemplates();
      setViewMode('list');
      alert(editingTemplate ? 'Plantilla actualizada correctamente' : 'Plantilla creada correctamente');
    } catch (err: any) {
      console.error('Error saving template:', err);
      alert(err.message || 'Error al guardar plantilla');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (editorData.zones.length > 0 || editorData.name.trim()) {
      if (!confirm('¿Descartar cambios?')) {
        return;
      }
    }
    setViewMode('list');
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar la plantilla "${name}"?`)) {
      return;
    }

    try {
      await labelTemplatesService.deleteLabelTemplate(id);
      await loadTemplates();
      alert('Plantilla eliminada');
    } catch (err: any) {
      alert(err.message || 'Error al eliminar plantilla');
    }
  };

  const handleDuplicate = async (id: number, name: string) => {
    const newName = prompt('Nombre para la plantilla duplicada:', `${name} (Copia)`);
    if (!newName) return;

    try {
      await labelTemplatesService.duplicateLabelTemplate(id, newName);
      await loadTemplates();
      alert('Plantilla duplicada');
    } catch (err: any) {
      alert(err.message || 'Error al duplicar plantilla');
    }
  };

  // Vista de Editor
  if (viewMode === 'editor') {
    return (
      <div className="p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Volver"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Tag className="w-8 h-8 text-orange-500" />
                {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
              </h1>
              <p className="text-gray-600 mt-1 text-sm">
                Diseña la etiqueta arrastrando las zonas de información
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              disabled={saving}
            >
              <Save size={20} />
              {saving ? 'Guardando...' : 'Guardar Plantilla'}
            </button>
          </div>
        </div>

        {/* Nombre de la plantilla */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Plantilla <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editorData.name}
                onChange={(e) => setEditorData({ ...editorData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Ej: Etiqueta Camisetas"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editorData.isDefault}
                  onChange={(e) => setEditorData({ ...editorData, isDefault: e.target.checked })}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">Plantilla por defecto</span>
              </label>
            </div>
          </div>

          {/* Selector de tipos de producto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipos de Producto (Opcional)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {productTypes.map((productType) => (
                <label
                  key={productType.id}
                  className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={editorData.productTypeIds.includes(productType.id)}
                    onChange={(e) => {
                      const newIds = e.target.checked
                        ? [...editorData.productTypeIds, productType.id]
                        : editorData.productTypeIds.filter(id => id !== productType.id);
                      setEditorData({ ...editorData, productTypeIds: newIds });
                    }}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">{productType.name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Si no seleccionas ninguno, la plantilla estará disponible para todos los tipos
            </p>
          </div>
        </div>

        {/* Editor Visual */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <LabelTemplateEditor
            backgroundImage={editorData.backgroundImage}
            width={editorData.width}
            height={editorData.height}
            zones={editorData.zones}
            onZonesChange={(zones) => setEditorData({ ...editorData, zones })}
            onBackgroundImageChange={(image) => setEditorData({ ...editorData, backgroundImage: image })}
          />
        </div>
      </div>
    );
  }

  // Vista de Lista
  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando plantillas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="w-8 h-8 text-orange-500" />
            Plantillas de Etiquetas
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Gestiona las plantillas para impresión de etiquetas de productos
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm md:text-base"
        >
          <Plus size={20} />
          Nueva Plantilla
        </button>
      </div>

      {/* Templates Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {templates.length === 0 ? (
          <div className="text-center py-12">
            <Tag size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay plantillas de etiquetas
            </h3>
            <p className="text-gray-600 mb-4">
              Crea tu primera plantilla para comenzar
            </p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Plus size={20} />
              Nueva Plantilla
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipos de Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dimensiones
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zonas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Imagen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Tag className="w-5 h-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {template.name}
                          </div>
                          {template.isDefault && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                              Por Defecto
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {template.productTypes && template.productTypes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {template.productTypes.slice(0, 3).map((pt) => (
                            <span
                              key={pt.id}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {pt.productType.name}
                            </span>
                          ))}
                          {template.productTypes.length > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                              +{template.productTypes.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Todos los tipos</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(template.width / 28.35).toFixed(1)} × {(template.height / 28.35).toFixed(1)} cm
                      <div className="text-xs text-gray-400">
                        ({template.width.toFixed(1)} × {template.height.toFixed(1)} pts)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {template.zones.length} zona{template.zones.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {template.backgroundImage ? (
                        <span className="text-green-600 font-medium">✓ Con imagen</span>
                      ) : (
                        <span className="text-gray-400">Fondo blanco</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        template.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {template.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(template)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDuplicate(template.id, template.name)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Duplicar"
                        >
                          <Copy size={18} />
                        </button>
                        {!template.isDefault && (
                          <button
                            onClick={() => handleDelete(template.id, template.name)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
