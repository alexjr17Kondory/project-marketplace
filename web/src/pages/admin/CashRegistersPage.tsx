import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Power, PowerOff, Monitor, MapPin, Users } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/shared/Modal';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import * as cashRegisterService from '../../services/cash-register.service';
import type { CashRegister, CashSession } from '../../services/cash-register.service';

export default function CashRegistersPage() {
  const { showToast } = useToast();
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingRegister, setEditingRegister] = useState<CashRegister | null>(null);
  const [deletingRegister, setDeletingRegister] = useState<CashRegister | null>(null);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Monitor className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cajas Registradoras</h1>
            <p className="text-gray-600 mt-1">
              Gestiona las cajas registradoras del punto de venta
            </p>
          </div>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nueva Caja
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Cajas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{cashRegisters.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Monitor className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Activas</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {cashRegisters.filter((r) => r.isActive).length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Power className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">En Uso</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">
                {cashRegisters.filter((r) => r.cashSessions && r.cashSessions.length > 0).length}
              </p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {cashRegisters.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Monitor className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay cajas registradoras
          </h3>
          <p className="text-gray-600 mb-6">
            Crea tu primera caja registradora para comenzar a usar el sistema POS
          </p>
          <Button onClick={handleCreate} className="inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Crear Caja Registradora
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Caja
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicacion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sesion Activa
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cashRegisters.map((register) => {
                const activeSession = getActiveSession(register);
                return (
                  <tr key={register.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          register.isActive ? 'bg-indigo-100' : 'bg-gray-100'
                        }`}>
                          <Monitor className={`w-5 h-5 ${
                            register.isActive ? 'text-indigo-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {register.name}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            {register.code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {register.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${
                          register.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          register.isActive ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        {register.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {activeSession ? (
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
                      ) : (
                        <span className="text-sm text-gray-400">Sin sesion</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

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
