import { useState, useMemo } from 'react';
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
import { useCatalogs } from '../../context/CatalogsContext';
import { useToast } from '../../context/ToastContext';
import { ProductTypeForm } from '../../components/admin/ProductTypeForm';
import { Modal } from '../../components/shared/Modal';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import type { ProductType } from '../../services/catalogs.service';
import { Settings, Plus, Package, ArrowLeft, Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

type ViewMode = 'list' | 'add' | 'edit';

const columnHelper = createColumnHelper<ProductType>();

export const ProductTypesPage = () => {
  const { productTypes, categories, createProductType, updateProductTypeWithSizes, deleteProductType } = useCatalogs();
  const toast = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedType, setSelectedType] = useState<ProductType | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return 'Sin categoría';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Sin categoría';
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
            Nombre
            <ArrowUpDown className="w-4 h-4" />
          </button>
        ),
        cell: (info) => (
          <div>
            <div className="text-sm font-medium text-gray-900">{info.getValue()}</div>
            {info.row.original.description && (
              <div className="text-sm text-gray-500">{info.row.original.description}</div>
            )}
          </div>
        ),
      }),
      columnHelper.accessor('categoryId', {
        header: 'Categoría',
        cell: (info) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {getCategoryName(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor('slug', {
        header: 'Slug',
        cell: (info) => (
          <span className="text-sm text-gray-500">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('isActive', {
        header: 'Estado',
        cell: (info) => (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              info.getValue()
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {info.getValue() ? 'Activo' : 'Inactivo'}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <div className="text-right">Acciones</div>,
        cell: (info) => (
          <div className="flex justify-end">
            <button
              onClick={() => startEdit(info.row.original)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Editar"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        ),
      }),
    ],
    [categories]
  );

  const table = useReactTable({
    data: productTypes,
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

  const handleAddType = async (typeData: Omit<ProductType, 'id'>, sizeIds: number[]) => {
    await createProductType(typeData, sizeIds);
    toast.success('Tipo de producto creado correctamente');
    setViewMode('list');
  };

  const handleEditType = async (typeData: Omit<ProductType, 'id'>, sizeIds: number[]) => {
    if (selectedType) {
      await updateProductTypeWithSizes(selectedType.id, typeData, sizeIds);
      toast.success('Tipo de producto actualizado correctamente');
      setViewMode('list');
      setSelectedType(null);
    }
  };

  const handleDeleteType = async (id: number) => {
    await deleteProductType(id);
    toast.success('Tipo de producto eliminado correctamente');
    setDeleteConfirmId(null);
    setSelectedType(null);
    setViewMode('list');
  };

  const startEdit = (type: ProductType) => {
    setSelectedType(type);
    setViewMode('edit');
  };

  const cancelEdit = () => {
    setViewMode('list');
    setSelectedType(null);
  };

  if (viewMode === 'add') {
    return (
      <div className="p-6">
        {/* Header con botón volver */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agregar Nuevo Tipo de Producto</h1>
            <p className="text-gray-600 mt-1 text-sm">Configura el tipo y sus tallas disponibles</p>
          </div>
          <button
            onClick={cancelEdit}
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Tipos
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <ProductTypeForm onSubmit={handleAddType} />
        </div>
      </div>
    );
  }

  if (viewMode === 'edit' && selectedType) {
    return (
      <div className="p-6">
        {/* Header con botón volver */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Tipo de Producto</h1>
            <p className="text-gray-600 mt-1 text-sm">Actualiza el tipo y sus tallas asignadas</p>
          </div>
          <button
            onClick={cancelEdit}
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Tipos
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <ProductTypeForm
            productType={selectedType}
            onSubmit={handleEditType}
            onDelete={() => setDeleteConfirmId(selectedType.id)}
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
                ¿Estás seguro de que deseas eliminar este tipo de producto? Esta acción no se puede deshacer.
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
                  onClick={() => handleDeleteType(deleteConfirmId)}
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tipos de Producto</h1>
          <p className="text-gray-600 mt-1 text-sm">Gestiona los tipos y sus tallas asignadas</p>
        </div>
        <Button onClick={() => setViewMode('add')} variant="admin-orange" size="sm">
          <Plus className="w-4 h-4" />
          Agregar Tipo
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar tipos de producto..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Product Types Table */}
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
              {table.getRowModel().rows.length > 0 ? (
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
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {globalFilter ? 'No se encontraron tipos' : 'No hay tipos de producto'}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {globalFilter
                        ? 'Intenta con otra búsqueda'
                        : 'Comienza agregando tu primer tipo de producto'}
                    </p>
                    {!globalFilter && (
                      <Button onClick={() => setViewMode('add')} variant="admin-orange" size="sm">
                        <Plus className="w-4 h-4" />
                        Agregar Tipo
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
              de <span className="font-medium">{table.getFilteredRowModel().rows.length}</span> tipos
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
    </div>
  );
};
