import { useState, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { templatesService, type Template } from '../../services/templates.service';
import { TemplateForm, type TemplateFormData } from '../../components/admin/TemplateForm';
import { TemplateZonesManager } from '../../components/admin/TemplateZonesManager';
import { VisualZoneEditor } from '../../components/admin/VisualZoneEditor';
import { TemplateRecipesSection } from '../../components/admin/TemplateRecipesSection';
import { templateRecipesService } from '../../services/template-recipes.service';
import { useToast } from '../../context/ToastContext';
import { useCatalogs } from '../../context/CatalogsContext';
import { Modal } from '../../components/shared/Modal';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import {
  Settings,
  Plus,
  Layers,
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Palette,
  Printer,
  Grid3x3
} from 'lucide-react';
import * as variantsService from '../../services/variants.service';

type ViewMode = 'list' | 'add' | 'edit';

const columnHelper = createColumnHelper<Template>();

export const TemplatesPage = () => {
  const { showToast } = useToast();
  const { categories, productTypes } = useCatalogs();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [generatingVariantsFor, setGeneratingVariantsFor] = useState<Template | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [templatesWithVariants, setTemplatesWithVariants] = useState<Set<number>>(new Set());
  const [selectedInputIds, setSelectedInputIds] = useState<number[]>([]);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await templatesService.getAllTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error al cargar modelos:', error);
      showToast('Error al cargar modelos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTemplate = async (data: TemplateFormData) => {
    try {
      await templatesService.createTemplate({
        name: data.name,
        description: data.description,
        sku: data.sku,
        slug: data.slug,
        categoryId: data.categoryId || undefined,
        typeId: data.typeId || undefined,
        basePrice: data.basePrice,
        images: data.images,
        tags: data.tags,
        colorIds: data.colorIds,
        sizeIds: data.sizeIds,
      });

      showToast('Modelo creado exitosamente', 'success');
      await loadTemplates();
      setViewMode('list');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Error al crear modelo', 'error');
    }
  };

  const handleEditTemplate = async (data: TemplateFormData) => {
    if (!selectedTemplate) return;

    try {
      console.log('=== GUARDANDO TEMPLATE ===');
      console.log('Template ID:', selectedTemplate.id);
      console.log('Selected Input IDs:', selectedInputIds);

      // Actualizar datos del template
      await templatesService.updateTemplate(selectedTemplate.id, {
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        typeId: data.typeId,
        basePrice: data.basePrice,
        images: data.images,
        tags: data.tags,
        isActive: data.isActive,
        colorIds: data.colorIds,
        sizeIds: data.sizeIds,
      });

      // Guardar insumos asociados
      console.log('Llamando a associateInputs...');
      const result = await templateRecipesService.associateInputs(selectedTemplate.id, selectedInputIds);
      console.log('Resultado de associateInputs:', result);

      showToast('Modelo y recetas actualizados exitosamente', 'success');
      await loadTemplates();
      setViewMode('list');
      setSelectedTemplate(null);
      setSelectedInputIds([]);
    } catch (error: any) {
      console.error('Error al guardar:', error);
      showToast(error.response?.data?.message || 'Error al actualizar modelo', 'error');
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    try {
      await templatesService.deleteTemplate(id);
      showToast('Modelo eliminado exitosamente', 'success');
      await loadTemplates();
      setDeleteConfirmId(null);
      setViewMode('list');
      setSelectedTemplate(null);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Error al eliminar modelo', 'error');
    }
  };

  const startEdit = async (template: Template) => {
    setSelectedTemplate(template);
    setViewMode('edit');

    // Cargar insumos asociados a este template
    try {
      console.log('=== CARGANDO INPUTS ASOCIADOS ===');
      console.log('Template ID:', template.id);
      const inputIds = await templateRecipesService.getAssociatedInputIds(template.id);
      console.log('Input IDs cargados:', inputIds);
      setSelectedInputIds(inputIds);
    } catch (error) {
      console.error('Error loading associated inputs:', error);
      setSelectedInputIds([]);
    }
  };

  const cancelEdit = () => {
    setViewMode('list');
    setSelectedTemplate(null);
    setSelectedInputIds([]);
  };

  const handlePrintBarcodes = (template: Template) => {
    navigate(`/admin-panel/barcodes/print/${template.id}`);
  };

  // Verificar qué templates tienen variantes
  const checkTemplateVariants = async () => {
    const templateIds = new Set<number>();
    for (const template of templates) {
      try {
        const variants = await variantsService.getVariants({ productId: template.id });
        if (variants.length > 0) {
          templateIds.add(template.id);
        }
      } catch (error) {
        console.error(`Error checking variants for template ${template.id}:`, error);
      }
    }
    setTemplatesWithVariants(templateIds);
  };

  // Cargar información de variantes al montar o cuando cambian los templates
  useMemo(() => {
    if (templates.length > 0 && viewMode === 'list') {
      checkTemplateVariants();
    }
  }, [templates, viewMode]);

  const handleGenerateVariants = async () => {
    if (!generatingVariantsFor) return;

    try {
      setIsGenerating(true);
      const result = await variantsService.generateVariantsForProduct(
        generatingVariantsFor.id,
        0 // Stock inicial
      );

      if (result.created > 0) {
        showToast(`${result.created} variantes creadas exitosamente`, 'success');
        // Actualizar lista de templates con variantes
        setTemplatesWithVariants(prev => new Set(prev).add(generatingVariantsFor.id));
      }

      if (result.errors && result.errors.length > 0) {
        showToast(`${result.errors.length} errores al crear variantes`, 'error');
      }

      setGeneratingVariantsFor(null);
    } catch (error: any) {
      showToast('Error al generar variantes: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Definir columnas
  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 hover:text-gray-900"
          >
            Modelo
            <ArrowUpDown className="w-4 h-4" />
          </button>
        ),
        cell: (info) => (
          <div className="flex items-center">
            {info.row.original.images?.front && (
              <img
                src={info.row.original.images.front}
                alt={info.getValue()}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">{info.getValue()}</div>
              <div className="text-sm text-gray-500">{info.row.original.sku}</div>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('typeName', {
        header: 'Tipo',
        cell: (info) => (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <Layers className="w-3 h-3" />
            {info.getValue() || 'Sin tipo'}
          </span>
        ),
      }),
      columnHelper.accessor('categoryName', {
        header: 'Categoría',
        cell: (info) => info.getValue() || <span className="text-gray-400">Sin categoría</span>,
      }),
      columnHelper.accessor('colors', {
        header: 'Colores',
        cell: (info) => {
          const colors = info.getValue() || [];
          return (
            <div className="flex items-center gap-1">
              <Palette className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{colors.length}</span>
            </div>
          );
        },
        enableSorting: false,
      }),
      columnHelper.accessor('sizes', {
        header: 'Tallas',
        cell: (info) => {
          const sizes = info.getValue() || [];
          return (
            <div className="flex flex-wrap gap-1">
              {sizes.slice(0, 3).map(size => (
                <span
                  key={size.id}
                  className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium"
                >
                  {size.abbreviation}
                </span>
              ))}
              {sizes.length > 3 && (
                <span className="text-xs text-gray-400">
                  +{sizes.length - 3}
                </span>
              )}
            </div>
          );
        },
        enableSorting: false,
      }),
      columnHelper.accessor('basePrice', {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 hover:text-gray-900"
          >
            Precio Base
            <ArrowUpDown className="w-4 h-4" />
          </button>
        ),
        cell: (info) => `$${info.getValue().toLocaleString('es-CO')}`,
      }),
      columnHelper.display({
        id: 'status',
        header: 'Estado',
        cell: (info) => (
          <span
            className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
              info.row.original.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {info.row.original.isActive ? 'Activo' : 'Inactivo'}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <div className="text-right">Acciones</div>,
        cell: (info) => {
          const template = info.row.original;
          const hasVariants = templatesWithVariants.has(template.id);

          return (
            <div className="flex justify-end gap-2">
              {hasVariants ? (
                <button
                  onClick={() => handlePrintBarcodes(template)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Imprimir Códigos de Barras"
                >
                  <Printer className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setGeneratingVariantsFor(template)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  title="Generar Variantes"
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => startEdit(template)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Editar"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          );
        },
      }),
    ],
    [templatesWithVariants]
  );

  const table = useReactTable({
    data: templates,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Si no están cargados los catálogos, mostrar loading
  if (!categories || !productTypes) {
    return (
      <div className="p-4 md:p-8">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
          Cargando catálogos...
        </div>
      </div>
    );
  }

  // Vista de formulario (agregar)
  if (viewMode === 'add') {
    return (
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agregar Nuevo Modelo</h1>
            <p className="text-gray-600 mt-1 text-sm">Completa la información del modelo base</p>
          </div>
          <button
            onClick={cancelEdit}
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Modelos
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <TemplateForm onSubmit={handleAddTemplate} onCancel={cancelEdit} />
        </div>
      </div>
    );
  }

  // Vista de formulario (editar)
  if (viewMode === 'edit' && selectedTemplate) {
    return (
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Modelo</h1>
            <p className="text-gray-600 mt-1 text-sm">Actualiza la información del modelo</p>
          </div>
          <button
            onClick={cancelEdit}
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Modelos
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 mb-6">
          <TemplateForm
            template={selectedTemplate}
            onSubmit={handleEditTemplate}
            onCancel={cancelEdit}
            onDelete={() => setDeleteConfirmId(selectedTemplate.id)}
          />
        </div>

        {/* Template Recipes Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Insumos / Recetas</h2>
          <TemplateRecipesSection
            templateId={selectedTemplate.id}
            selectedInputIds={selectedInputIds}
            onInputsChange={setSelectedInputIds}
          />
        </div>

        {/* Template Zones Section - Editor Visual */}
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          {!selectedTemplate.images?.front && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4">
              <p className="text-sm">
                <strong>Nota:</strong> Agrega una imagen frontal al modelo para visualizar las zonas sobre la imagen.
              </p>
            </div>
          )}
          <VisualZoneEditor
            templateId={selectedTemplate.id}
            templateImage={selectedTemplate.images?.front || ''}
            templateImageBack={selectedTemplate.images?.back}
            zoneTypeImages={selectedTemplate.zoneTypeImages || undefined}
            onZoneTypeImagesChange={async (images) => {
              try {
                await templatesService.updateTemplate(selectedTemplate.id, {
                  zoneTypeImages: images,
                });
                // Actualizar el template seleccionado localmente
                setSelectedTemplate(prev => prev ? { ...prev, zoneTypeImages: images } : null);
                showToast('Imágenes guardadas', 'success');
              } catch (error) {
                console.error('Error al guardar imágenes:', error);
                showToast('Error al guardar las imágenes', 'error');
              }
            }}
          />
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <Modal
            isOpen={true}
            onClose={() => setDeleteConfirmId(null)}
            title="Confirmar Eliminación"
          >
            <div className="space-y-4">
              <p className="text-gray-600">
                ¿Estás seguro de que deseas eliminar este modelo? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="admin-secondary"
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="admin-danger"
                  onClick={() => handleDeleteTemplate(deleteConfirmId)}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // Vista de lista
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modelos / Templates</h1>
          <p className="text-gray-600 mt-1 text-sm">Gestiona los modelos base para personalización</p>
        </div>
        <Button onClick={() => setViewMode('add')} variant="admin-orange" size="sm">
          <Plus className="w-4 h-4" />
          Agregar Modelo
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar modelos..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Templates Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-12">
                    <div className="text-gray-500">Cargando modelos...</div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="text-center py-12">
                    <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {globalFilter ? 'No se encontraron modelos' : 'No hay modelos'}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {globalFilter
                        ? 'Intenta con otra búsqueda'
                        : 'Comienza agregando tu primer modelo al catálogo'}
                    </p>
                    {!globalFilter && (
                      <Button onClick={() => setViewMode('add')} variant="admin-orange" size="sm">
                        <Plus className="w-4 h-4" />
                        Agregar Modelo
                      </Button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {table.getRowModel().rows.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-700">
              Mostrando{' '}
              <span className="font-medium">
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
              </span>{' '}
              a{' '}
              <span className="font-medium">
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}
              </span>{' '}
              de <span className="font-medium">{table.getFilteredRowModel().rows.length}</span> modelos
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex gap-1">
                {Array.from({ length: table.getPageCount() }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => table.setPageIndex(page - 1)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      table.getState().pagination.pageIndex === page - 1
                        ? 'bg-orange-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Generate Variants Modal */}
      {generatingVariantsFor && (
        <Modal
          isOpen={true}
          onClose={() => !isGenerating && setGeneratingVariantsFor(null)}
          title="Generar Variantes"
        >
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Grid3x3 className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 mb-1">
                    {generatingVariantsFor.name}
                  </h4>
                  <p className="text-sm text-blue-700">
                    Se generarán todas las combinaciones de colores y tallas configuradas para este template con códigos de barras únicos.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <p className="flex items-center gap-2">
                <span className="font-medium">•</span>
                Cada variante tendrá un código de barras EAN-13 único
              </p>
              <p className="flex items-center gap-2">
                <span className="font-medium">•</span>
                El stock inicial será 0 (puedes ajustarlo después)
              </p>
              <p className="flex items-center gap-2">
                <span className="font-medium">•</span>
                Las variantes existentes no se duplicarán
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="admin-secondary"
                onClick={() => setGeneratingVariantsFor(null)}
                disabled={isGenerating}
              >
                Cancelar
              </Button>
              <Button
                variant="admin-primary"
                onClick={handleGenerateVariants}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generando...' : 'Generar Variantes'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
