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
} from '@tanstack/react-table';
import { Plus, Edit, Trash2, Power, PowerOff, Monitor, MapPin, Users, Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/shared/Modal';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import * as cashRegisterService from '../../services/cash-register.service';
import type { CashRegister, CashSession } from '../../services/cash-register.service';

const columnHelper = createColumnHelper<CashRegister>();

export default function CashRegistersPage() {
  const { showToast } = useToast();
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingRegister, setEditingRegister] = useState<CashRegister | null>(null);
  const [deletingRegister, setDeletingRegister] = useState<CashRegister | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    code: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCashRegisters();
  }, []);

  const loadCashRegisters = async () => {
    try {
      setLoading(true);
      const data = await cashRegisterService.getCashRegisters();
      setCashRegisters(data);
    } catch (error) {
      console.error('Error loading cash registers:', error);
      showToast('Error al cargar las cajas registradoras', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRegister(null);
    setFormData({ name: '', location: '', code: '' });
    setFormErrors({});
    setShowModal(true);
  };

  const handleEdit = (register: CashRegister) => {
    setEditingRegister(register);
    setFormData({
      name: register.name,
      location: register.location,
      code: register.code,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleToggleActive = async (register: CashRegister) => {
    try {
      await cashRegisterService.updateCashRegister(register.id, { isActive: !register.isActive });
      showToast(
        `Caja ${register.isActive ? 'desactivada' : 'activada'} correctamente`,
        'success'
      );
      await loadCashRegisters();
    } catch (error: any) {
      console.error('Error toggling register:', error);
      showToast(error.response?.data?.message || 'Error al actualizar la caja', 'error');
    }
  };

  const handleDeleteClick = (register: CashRegister) => {
    setDeletingRegister(register);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRegister) return;

    try {
      await cashRegisterService.deleteCashRegister(deletingRegister.id);
      showToast('Caja eliminada correctamente', 'success');
      setShowDeleteModal(false);
      setDeletingRegister(null);
      await loadCashRegisters();
    } catch (error: any) {
      console.error('Error deleting register:', error);
      showToast(error.response?.data?.message || 'Error al eliminar la caja', 'error');
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'El nombre es requerido';
    }

    if (!formData.location.trim()) {
      errors.location = 'La ubicacion es requerida';
    }

    if (!formData.code.trim()) {
      errors.code = 'El codigo es requerido';
    } else if (formData.code.length < 3) {
      errors.code = 'El codigo debe tener al menos 3 caracteres';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      if (editingRegister) {
        await cashRegisterService.updateCashRegister(editingRegister.id, formData);
        showToast('Caja actualizada correctamente', 'success');
      } else {
        await cashRegisterService.createCashRegister(formData);
        showToast('Caja creada correctamente', 'success');
      }

      await loadCashRegisters();
      setShowModal(false);
      setFormData({ name: '', location: '', code: '' });
    } catch (error: any) {
      console.error('Error saving register:', error);
      showToast(error.response?.data?.message || 'Error al guardar la caja registradora', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getActiveSession = (register: CashRegister): CashSession | null => {
    if (register.cashSessions && register.cashSessions.length > 0) {
      return register.cashSessions[0];
    }
    return null;
  };

  // Stats
  const stats = useMemo(() => ({
    total: cashRegisters.length,
    active: cashRegisters.filter((r) => r.isActive).length,
    inUse: cashRegisters.filter((r) => r.cashSessions && r.cashSessions.length > 0).length,
  }), [cashRegisters]);

  // Table columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 hover:text-gray-900"
          >
            Caja
            <ArrowUpDown className="w-4 h-4" />
          </button>
        ),
        cell: (info) => {
          const register = info.row.original;
          return (
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                register.isActive ? 'bg-indigo-100' : 'bg-gray-100'
              }`}>
                <Monitor className={`w-5 h-5 ${
                  register.isActive ? 'text-indigo-600' : 'text-gray-400'
                }`} />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{register.name}</div>
                <div className="text-xs text-gray-500 font-mono">{register.code}</div>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('location', {
        header: 'Ubicacion',
        cell: (info) => (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400" />
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor('isActive', {
        header: 'Estado',
        cell: (info) => {
          const isActive = info.getValue();
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${
                isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                isActive ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              {isActive ? 'Activa' : 'Inactiva'}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'session',
        header: 'Sesion Activa',
        cell: ({ row }) => {
          const activeSession = getActiveSession(row.original);
          if (activeSession) {
            return (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {activeSession.seller?.name || 'Usuario'}
                  </div>
                  <div className="text-xs text-gray-500">
                    Desde {new Date(activeSession.openedAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          }
          return <span className="text-sm text-gray-400">Sin sesion</span>;
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <div className="text-right">Acciones</div>,
        cell: ({ row }) => {
          const register = row.original;
          const activeSession = getActiveSession(register);
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => handleEdit(register)}
                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Editar"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleToggleActive(register)}
                className={`p-2 rounded-lg transition-colors ${
                  register.isActive
                    ? 'text-amber-600 hover:bg-amber-50'
                    : 'text-green-600 hover:bg-green-50'
                }`}
                title={register.isActive ? 'Desactivar' : 'Activar'}
              >
                {register.isActive ? (
                  <PowerOff className="w-4 h-4" />
                ) : (
                  <Power className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => handleDeleteClick(register)}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar"
                disabled={!!activeSession}
              >
                <Trash2 className={`w-4 h-4 ${activeSession ? 'opacity-30' : ''}`} />
              </button>
            </div>
          );
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data: cashRegisters,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-gray-500">Cargando cajas registradoras...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Cajas Registradoras</h1>
          <p className="text-gray-600 mt-1 text-sm">Gestiona las cajas registradoras del punto de venta</p>
        </div>
        <Button onClick={handleCreate} variant="admin-primary">
          <Plus className="w-5 h-5 mr-2" />
          Nueva Caja
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Cajas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Monitor className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Activas</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Power className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">En Uso</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.inUse}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar cajas..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
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
                    <Monitor className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {globalFilter ? 'No se encontraron cajas' : 'No hay cajas registradoras'}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {globalFilter
                        ? 'Intenta con otra busqueda'
                        : 'Crea tu primera caja registradora para comenzar'}
                    </p>
                    {!globalFilter && (
                      <Button onClick={handleCreate} variant="admin-primary">
                        <Plus className="w-5 h-5 mr-2" />
                        Nueva Caja
                      </Button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
              de <span className="font-medium">{table.getFilteredRowModel().rows.length}</span> cajas
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingRegister ? 'Editar Caja Registradora' : 'Nueva Caja Registradora'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Caja Principal"
              error={formErrors.name}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ubicacion <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ej: Piso 1 - Entrada Principal"
              error={formErrors.location}
            />
          </div>

          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Codigo <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="Ej: CAJA-01"
              error={formErrors.code}
              className="font-mono"
            />
            <p className="mt-1 text-xs text-gray-500">
              Codigo unico para identificar la caja
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
              disabled={submitting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? 'Guardando...' : editingRegister ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingRegister(null);
        }}
        title="Eliminar Caja Registradora"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-700">
                Estas a punto de eliminar la caja <strong>{deletingRegister?.name}</strong>.
                Esta accion no se puede deshacer.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setDeletingRegister(null);
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleDeleteConfirm}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
