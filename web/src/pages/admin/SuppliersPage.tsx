import { useState, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import {
  Truck,
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Modal } from '../../components/shared/Modal';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { useToast } from '../../context/ToastContext';
import * as suppliersService from '../../services/suppliers.service';
import type { Supplier, SupplierStats } from '../../services/suppliers.service';

export default function SuppliersPage() {
  const { showToast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stats, setStats] = useState<SupplierStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    taxId: '',
    taxIdType: 'NIT',
    contactName: '',
    email: '',
    phone: '',
    altPhone: '',
    website: '',
    address: '',
    city: '',
    department: '',
    postalCode: '',
    country: 'Colombia',
    paymentTerms: '',
    paymentMethod: '',
    bankName: '',
    bankAccountType: '',
    bankAccount: '',
    notes: '',
    isActive: true,
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [suppliersData, statsData] = await Promise.all([
        suppliersService.getSuppliers(),
        suppliersService.getStats(),
      ]);
      setSuppliers(suppliersData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      showToast('Error al cargar proveedores', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Open create modal
  const handleCreate = async () => {
    try {
      const code = await suppliersService.generateCode();
      setFormData({
        code,
        name: '',
        taxId: '',
        taxIdType: 'NIT',
        contactName: '',
        email: '',
        phone: '',
        altPhone: '',
        website: '',
        address: '',
        city: '',
        department: '',
        postalCode: '',
        country: 'Colombia',
        paymentTerms: '',
        paymentMethod: '',
        bankName: '',
        bankAccountType: '',
        bankAccount: '',
        notes: '',
        isActive: true,
      });
      setEditingSupplier(null);
      setShowModal(true);
    } catch (error) {
      showToast('Error al generar código', 'error');
    }
  };

  // Open edit modal
  const handleEdit = (supplier: Supplier) => {
    setFormData({
      code: supplier.code,
      name: supplier.name,
      taxId: supplier.taxId || '',
      taxIdType: supplier.taxIdType || 'NIT',
      contactName: supplier.contactName || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      altPhone: supplier.altPhone || '',
      website: supplier.website || '',
      address: supplier.address || '',
      city: supplier.city || '',
      department: supplier.department || '',
      postalCode: supplier.postalCode || '',
      country: supplier.country || 'Colombia',
      paymentTerms: supplier.paymentTerms || '',
      paymentMethod: supplier.paymentMethod || '',
      bankName: supplier.bankName || '',
      bankAccountType: supplier.bankAccountType || '',
      bankAccount: supplier.bankAccount || '',
      notes: supplier.notes || '',
      isActive: supplier.isActive,
    });
    setEditingSupplier(supplier);
    setShowModal(true);
  };

  // Save supplier
  const handleSave = async () => {
    if (!formData.code || !formData.name) {
      showToast('El código y nombre son requeridos', 'error');
      return;
    }

    try {
      setSaving(true);
      if (editingSupplier) {
        await suppliersService.updateSupplier(editingSupplier.id, formData);
        showToast('Proveedor actualizado', 'success');
      } else {
        await suppliersService.createSupplier(formData);
        showToast('Proveedor creado', 'success');
      }
      setShowModal(false);
      loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete supplier
  const handleDelete = async () => {
    if (!supplierToDelete) return;

    try {
      setSaving(true);
      await suppliersService.deleteSupplier(supplierToDelete.id);
      showToast('Proveedor eliminado', 'success');
      setShowDeleteModal(false);
      setSupplierToDelete(null);
      loadData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Error al eliminar', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Table columns
  const columns = useMemo<ColumnDef<Supplier>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Código',
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium text-gray-900">
            {row.original.code}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Nombre',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-gray-900">{row.original.name}</p>
            {row.original.taxId && (
              <p className="text-xs text-gray-500">
                {row.original.taxIdType}: {row.original.taxId}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'contactName',
        header: 'Contacto',
        cell: ({ row }) => (
          <div className="space-y-1">
            {row.original.contactName && (
              <p className="text-sm text-gray-900">{row.original.contactName}</p>
            )}
            {row.original.phone && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {row.original.phone}
              </p>
            )}
            {row.original.email && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {row.original.email}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'city',
        header: 'Ubicación',
        cell: ({ row }) => (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            {row.original.city || '-'}
            {row.original.department && `, ${row.original.department}`}
          </div>
        ),
      },
      {
        accessorKey: '_count.purchaseOrders',
        header: 'OCs',
        cell: ({ row }) => (
          <span className="text-sm text-gray-600">
            {row.original._count?.purchaseOrders || 0}
          </span>
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Estado',
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              row.original.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {row.original.isActive ? 'Activo' : 'Inactivo'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEdit(row.original)}
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Editar"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setSupplierToDelete(row.original);
                setShowDeleteModal(true);
              }}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  // Filter data
  const filteredData = useMemo(() => {
    if (!searchTerm) return suppliers;
    const term = searchTerm.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.code.toLowerCase().includes(term) ||
        s.name.toLowerCase().includes(term) ||
        s.taxId?.toLowerCase().includes(term) ||
        s.contactName?.toLowerCase().includes(term) ||
        s.email?.toLowerCase().includes(term)
    );
  }, [suppliers, searchTerm]);

  // Table instance
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Truck className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
            <p className="text-sm text-gray-500">Gestión de proveedores</p>
          </div>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Proveedor
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Truck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Activos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Con Órdenes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.withOrders}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por código, nombre, NIT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
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
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No hay proveedores</p>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {table.getPageCount() > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Mostrando {table.getState().pagination.pageIndex * 10 + 1} -{' '}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * 10,
                filteredData.length
              )}{' '}
              de {filteredData.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        size="xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Código"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
          <Input
            label="Nombre / Razón Social"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Identificación
            </label>
            <select
              value={formData.taxIdType}
              onChange={(e) => setFormData({ ...formData, taxIdType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="NIT">NIT</option>
              <option value="RUT">RUT</option>
              <option value="CC">Cédula</option>
              <option value="CE">Cédula Extranjería</option>
            </select>
          </div>
          <Input
            label="Número de Identificación"
            value={formData.taxId}
            onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
          />
          <Input
            label="Nombre de Contacto"
            value={formData.contactName}
            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label="Teléfono"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label="Teléfono Alternativo"
            value={formData.altPhone}
            onChange={(e) => setFormData({ ...formData, altPhone: e.target.value })}
          />
          <Input
            label="Sitio Web"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          />
          <Input
            label="Dirección"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <Input
            label="Ciudad"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
          <Input
            label="Departamento"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          />
          <Input
            label="Términos de Pago"
            value={formData.paymentTerms}
            onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
            placeholder="Ej: 30 días"
          />
          <Input
            label="Método de Pago"
            value={formData.paymentMethod}
            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
            placeholder="Ej: Transferencia"
          />
          <Input
            label="Banco"
            value={formData.bankName}
            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
          />
          <Input
            label="Cuenta Bancaria"
            value={formData.bankAccount}
            onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
          />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">Proveedor activo</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar'
            )}
          </Button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Proveedor"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-gray-600">
              ¿Estás seguro de eliminar el proveedor{' '}
              <strong>{supplierToDelete?.name}</strong>?
            </p>
            <p className="text-sm text-gray-500 mt-2">Esta acción no se puede deshacer.</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={saving}>
            {saving ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
