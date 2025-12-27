import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Loader2 } from 'lucide-react';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Modal } from '../../components/shared/Modal';
import { useToast } from '../../context/ToastContext';
import * as suppliersService from '../../services/suppliers.service';

export default function SupplierDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const isEditing = id !== 'new';

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

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (isEditing) {
      loadSupplier();
    } else {
      generateCode();
    }
  }, [id]);

  const generateCode = async () => {
    try {
      const code = await suppliersService.generateCode();
      setFormData(prev => ({ ...prev, code }));
    } catch (error) {
      showToast('Error al generar código', 'error');
    }
  };

  const loadSupplier = async () => {
    try {
      setLoading(true);
      const supplier = await suppliersService.getSupplierById(Number(id));
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
    } catch (error) {
      showToast('Error al cargar proveedor', 'error');
      navigate('/admin-panel/suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.name) {
      showToast('El código y nombre son requeridos', 'error');
      return;
    }

    try {
      setSaving(true);
      if (isEditing) {
        await suppliersService.updateSupplier(Number(id), formData);
        showToast('Proveedor actualizado', 'success');
      } else {
        await suppliersService.createSupplier(formData);
        showToast('Proveedor creado', 'success');
      }
      navigate('/admin-panel/suppliers');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSaving(true);
      await suppliersService.deleteSupplier(Number(id));
      showToast('Proveedor eliminado', 'success');
      navigate('/admin-panel/suppliers');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Error al eliminar', 'error');
    } finally {
      setSaving(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            {isEditing
              ? 'Modifica la información del proveedor'
              : 'Crea un nuevo proveedor para el sistema'}
          </p>
        </div>
        <button
          onClick={() => navigate('/admin-panel/suppliers')}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Proveedores
        </button>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6">
          {/* Información básica */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Código *"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
              <Input
                label="Nombre / Razón Social *"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
            </div>
          </div>

          {/* Información de contacto */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de Contacto</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>
          </div>

          {/* Dirección */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dirección</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input
                  label="Dirección"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
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
                label="Código Postal"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              />
              <Input
                label="País"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
          </div>

          {/* Información de pago */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de Pago</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Cuenta
                </label>
                <select
                  value={formData.bankAccountType}
                  onChange={(e) => setFormData({ ...formData, bankAccountType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Ahorros">Ahorros</option>
                  <option value="Corriente">Corriente</option>
                </select>
              </div>
              <Input
                label="Número de Cuenta"
                value={formData.bankAccount}
                onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
              />
            </div>
          </div>

          {/* Notas y estado */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Adicional</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  placeholder="Notas adicionales sobre el proveedor..."
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-gray-700">Proveedor activo</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            {isEditing && (
              <Button
                type="button"
                variant="admin-danger"
                onClick={() => setShowDeleteModal(true)}
                disabled={saving}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            )}
            <Button
              type="submit"
              variant="admin-primary"
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? 'Guardar' : 'Crear'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Proveedor"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            ¿Estás seguro de eliminar este proveedor? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="admin-secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="admin-danger"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
