import { Info } from 'lucide-react';

interface SizeSelectorProps {
  sizes: string[];
  selectedSize: string;
  onSizeChange: (size: string) => void;
  onShowSizeGuide: () => void;
}

export const SizeSelector = ({ sizes, selectedSize, onSizeChange, onShowSizeGuide }: SizeSelectorProps) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Talla</h3>
        <button
          onClick={onShowSizeGuide}
          className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 hover:underline transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          Guía de tallas
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => onSizeChange(size)}
            className={`
              px-4 py-2.5 rounded-lg border-2 font-semibold text-sm transition-all
              ${
                selectedSize === size
                  ? 'border-purple-600 bg-purple-50 text-purple-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50/50'
              }
            `}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
};
