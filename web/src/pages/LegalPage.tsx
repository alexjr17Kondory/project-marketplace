import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Shield, RefreshCw, Calendar } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import type { LegalSettings } from '../types/settings';

// Mapeo de slugs a keys del objeto legal
const slugToKey: Record<string, keyof LegalSettings> = {
  terms: 'termsAndConditions',
  privacy: 'privacyPolicy',
  returns: 'returnsPolicy',
};

// Iconos por tipo de página
const pageIcons: Record<keyof LegalSettings, typeof FileText> = {
  termsAndConditions: FileText,
  privacyPolicy: Shield,
  returnsPolicy: RefreshCw,
};

export const LegalPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { settings } = useSettings();

  // Obtener la página legal correspondiente
  const pageKey = slug ? slugToKey[slug] : undefined;
  const legalPage = pageKey ? settings.legal[pageKey] : undefined;

  if (!legalPage || !legalPage.isActive) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Página no encontrada</h1>
            <p className="text-gray-600 mb-6">La página legal que buscas no existe o no está disponible.</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const Icon = pageIcons[pageKey!];
  const formattedDate = new Date(legalPage.lastUpdated).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Navegación */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </div>

        {/* Contenido */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <Icon className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{legalPage.title}</h1>
                <div className="flex items-center gap-2 mt-2 text-orange-100 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>Última actualización: {formattedDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido de la página */}
          <div className="p-6 md:p-8">
            <div
              className="prose prose-gray max-w-none
                prose-headings:text-gray-900 prose-headings:font-bold
                prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
                prose-p:text-gray-600 prose-p:leading-relaxed
                prose-ul:text-gray-600 prose-ol:text-gray-600
                prose-li:my-1
                prose-strong:text-gray-900"
              dangerouslySetInnerHTML={{ __html: legalPage.content }}
            />
          </div>

          {/* Footer de la página */}
          <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
              <p>{settings.general.siteName} - Todos los derechos reservados</p>
              <div className="flex items-center gap-4">
                {slug !== 'terms' && (
                  <Link to="/legal/terms" className="hover:text-orange-600 transition-colors">
                    Términos
                  </Link>
                )}
                {slug !== 'privacy' && (
                  <Link to="/legal/privacy" className="hover:text-orange-600 transition-colors">
                    Privacidad
                  </Link>
                )}
                {slug !== 'returns' && (
                  <Link to="/legal/returns" className="hover:text-orange-600 transition-colors">
                    Devoluciones
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
