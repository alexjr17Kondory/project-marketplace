import { useSearchParams } from 'react-router-dom';
import { Palette, Sparkles } from 'lucide-react';

export const CustomizerPage = () => {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('product');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 text-white py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <Palette className="w-8 h-8" />
            <h1 className="text-3xl md:text-4xl font-bold">Personalizador de Productos</h1>
          </div>
          <p className="text-lg text-white/90">
            Crea diseños únicos para tus productos favoritos
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-6">
            <Sparkles className="w-12 h-12 text-purple-600" />
          </div>

          {/* Title */}
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Personalizador en Desarrollo
          </h2>

          {/* Description */}
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Estamos trabajando en una experiencia increíble de personalización. Pronto podrás:
          </p>

          {/* Features List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-8">
            <div className="bg-purple-50 rounded-xl p-6 text-left">
              <div className="text-2xl mb-2">🖼️</div>
              <h3 className="font-bold text-gray-900 mb-2">Subir tus imágenes</h3>
              <p className="text-sm text-gray-600">
                Carga tus diseños personalizados y ajústalos como quieras
              </p>
            </div>

            <div className="bg-pink-50 rounded-xl p-6 text-left">
              <div className="text-2xl mb-2">🎨</div>
              <h3 className="font-bold text-gray-900 mb-2">Elegir colores</h3>
              <p className="text-sm text-gray-600">
                Selecciona entre una amplia gama de colores para tu producto
              </p>
            </div>

            <div className="bg-amber-50 rounded-xl p-6 text-left">
              <div className="text-2xl mb-2">↔️</div>
              <h3 className="font-bold text-gray-900 mb-2">Vista 360°</h3>
              <p className="text-sm text-gray-600">
                Visualiza tu diseño desde todos los ángulos
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 text-left">
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="font-bold text-gray-900 mb-2">Vista previa en tiempo real</h3>
              <p className="text-sm text-gray-600">
                Mira cómo quedará tu producto antes de comprarlo
              </p>
            </div>
          </div>

          {/* Status */}
          {productId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto mb-6">
              <p className="text-blue-800 text-sm">
                <strong>Producto seleccionado:</strong> ID {productId}
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 max-w-2xl mx-auto">
            <p className="text-purple-900 font-semibold mb-2">
              Estado actual: Fase 1 - Semana 3 en desarrollo
            </p>
            <p className="text-purple-700 text-sm">
              Esta funcionalidad se está implementando según el roadmap del proyecto.
              <br />
              Por ahora, puedes explorar el catálogo y ver los productos disponibles.
            </p>
          </div>

          {/* CTA */}
          <div className="mt-8">
            <a
              href="/catalog"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all hover:scale-105"
            >
              Ver Catálogo
              <Palette className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
