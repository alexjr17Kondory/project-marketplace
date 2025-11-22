import { X, Ruler, Info } from 'lucide-react';
import type { SizeChart } from '../../data/sizeCharts';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  sizeChart: SizeChart;
}

export const SizeGuideModal = ({ isOpen, onClose, sizeChart }: SizeGuideModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 text-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Ruler className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Guía de Tallas</h2>
                <p className="text-xs text-white/80">{sizeChart.productName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          {/* Guía de medición */}
          <div className="mb-5 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-purple-500 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Cómo medir correctamente</h3>
                <p className="text-sm text-gray-700">{sizeChart.guide}</p>
              </div>
            </div>
          </div>

          {/* Tabla de tallas */}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <th className="px-4 py-3 text-left font-semibold border-r border-white/20">
                    Talla
                  </th>
                  {sizeChart.sizes[0].chest !== undefined && (
                    <th className="px-4 py-3 text-left font-semibold border-r border-white/20">
                      Pecho
                    </th>
                  )}
                  {sizeChart.sizes[0].length !== undefined && (
                    <th className="px-4 py-3 text-left font-semibold border-r border-white/20">
                      Largo
                    </th>
                  )}
                  {sizeChart.sizes[0].shoulders !== undefined && (
                    <th className="px-4 py-3 text-left font-semibold border-r border-white/20">
                      Hombros
                    </th>
                  )}
                  {sizeChart.sizes[0].sleeves !== undefined && (
                    <th className="px-4 py-3 text-left font-semibold border-r border-white/20">
                      Manga
                    </th>
                  )}
                  {sizeChart.sizes[0].diameter !== undefined && (
                    <th className="px-4 py-3 text-left font-semibold border-r border-white/20">
                      Diámetro
                    </th>
                  )}
                  {sizeChart.sizes[0].height !== undefined && (
                    <th className="px-4 py-3 text-left font-semibold border-r border-white/20">
                      Altura
                    </th>
                  )}
                  {sizeChart.sizes[0].width !== undefined && (
                    <th className="px-4 py-3 text-left font-semibold">
                      Ancho
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {sizeChart.sizes.map((size, index) => (
                  <tr
                    key={size.size}
                    className={`${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } hover:bg-purple-50 transition-colors`}
                  >
                    <td className="px-4 py-3 font-bold text-purple-600 border-r border-gray-200">
                      {size.size}
                    </td>
                    {size.chest !== undefined && (
                      <td className="px-4 py-3 border-r border-gray-200">{size.chest} cm</td>
                    )}
                    {size.length !== undefined && (
                      <td className="px-4 py-3 border-r border-gray-200">{size.length} cm</td>
                    )}
                    {size.shoulders !== undefined && (
                      <td className="px-4 py-3 border-r border-gray-200">{size.shoulders} cm</td>
                    )}
                    {size.sleeves !== undefined && (
                      <td className="px-4 py-3 border-r border-gray-200">{size.sleeves} cm</td>
                    )}
                    {size.diameter !== undefined && (
                      <td className="px-4 py-3 border-r border-gray-200">{size.diameter} cm</td>
                    )}
                    {size.height !== undefined && (
                      <td className="px-4 py-3 border-r border-gray-200">{size.height} cm</td>
                    )}
                    {size.width !== undefined && (
                      <td className="px-4 py-3">{size.width} cm</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Nota adicional */}
          <div className="mt-5 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong className="text-amber-700">Nota:</strong> Las medidas pueden variar ligeramente (±2cm) según el método de medición y el ajuste deseado.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
