import { useState } from 'react';
import { useSettings } from '../../../context/SettingsContext';
import { useToast } from '../../../context/ToastContext';
import { Button } from '../../../components/shared/Button';
import { Input } from '../../../components/shared/Input';
import { Modal } from '../../../components/shared/Modal';
import { RichTextEditor } from '../../../components/shared/RichTextEditor';
import type { LegalSettings } from '../../../types/settings';
import {
  FileText,
  Shield,
  RefreshCw,
  Edit2,
  Eye,
  Save,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

export const SettingsLegalPage = () => {
  const { settings, updateLegalPage } = useSettings();
  const toast = useToast();

  // Legal page editing states
  const [editingLegalPage, setEditingLegalPage] = useState<keyof LegalSettings | null>(null);
  const [legalForm, setLegalForm] = useState({
    title: '',
    content: '',
    isActive: true,
  });

  const legalPageInfo: Record<keyof LegalSettings, { icon: typeof FileText; label: string; slug: string }> = {
    termsAndConditions: { icon: FileText, label: 'Términos y Condiciones', slug: 'terms' },
    privacyPolicy: { icon: Shield, label: 'Política de Privacidad', slug: 'privacy' },
    returnsPolicy: { icon: RefreshCw, label: 'Política de Devoluciones', slug: 'returns' },
  };

  const handleOpenLegalEditor = (pageKey: keyof LegalSettings) => {
    const page = settings.legal[pageKey];
    setLegalForm({
      title: page.title,
      content: page.content,
      isActive: page.isActive,
    });
    setEditingLegalPage(pageKey);
  };

  const handleSaveLegalPage = () => {
    if (!editingLegalPage) return;
    updateLegalPage(editingLegalPage, legalForm);
    toast.success('Página legal actualizada');
    setEditingLegalPage(null);
  };

  const handleToggleLegalPage = (pageKey: keyof LegalSettings) => {
    const page = settings.legal[pageKey];
    updateLegalPage(pageKey, { isActive: !page.isActive });
    toast.success(`Página ${!page.isActive ? 'activada' : 'desactivada'}`);
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-8 h-8 text-orange-500" />
            Páginas Legales
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Administra el contenido de tus páginas legales
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              Páginas Legales
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Administra el contenido de tus páginas legales. Estas páginas son accesibles desde el pie de página.
            </p>
          </div>

          <div className="space-y-4">
            {(Object.keys(legalPageInfo) as Array<keyof LegalSettings>).map((pageKey) => {
              const info = legalPageInfo[pageKey];
              const page = settings.legal[pageKey];
              const Icon = info.icon;
              const formattedDate = new Date(page.lastUpdated).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={pageKey}
                  className={`border rounded-lg p-4 ${page.isActive ? 'border-gray-200' : 'border-gray-100 bg-gray-50'}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${page.isActive ? 'bg-orange-100' : 'bg-gray-100'}`}>
                        <Icon className={`w-5 h-5 ${page.isActive ? 'text-orange-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{page.title}</h4>
                          {!page.isActive && (
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                              Inactiva
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          /legal/{info.slug} • Última actualización: {formattedDate}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {page.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleLegalPage(pageKey)}
                        className={`p-2 rounded-lg ${page.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                        title={page.isActive ? 'Desactivar' : 'Activar'}
                      >
                        {page.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => handleOpenLegalEditor(pageKey)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <a
                        href={`/legal/${info.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                        title="Ver página"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legal Page Editor Modal */}
      <Modal
        isOpen={!!editingLegalPage}
        onClose={() => setEditingLegalPage(null)}
        title={editingLegalPage ? `Editar ${legalPageInfo[editingLegalPage].label}` : 'Editar Página'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título de la Página
            </label>
            <Input
              value={legalForm.title}
              onChange={(e) => setLegalForm({ ...legalForm, title: e.target.value })}
              placeholder="Ej: Términos y Condiciones"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contenido
            </label>
            <RichTextEditor
              content={legalForm.content}
              onChange={(html) => setLegalForm({ ...legalForm, content: html })}
            />
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={legalForm.isActive}
                onChange={(e) => setLegalForm({ ...legalForm, isActive: e.target.checked })}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">Página activa (visible en el sitio)</span>
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="admin-secondary" onClick={() => setEditingLegalPage(null)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSaveLegalPage} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
