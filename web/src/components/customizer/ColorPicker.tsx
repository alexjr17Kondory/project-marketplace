interface ColorPickerProps {
  colors: string[];
  selectedColor: string;
  onColorChange: (color: string) => void;
  label?: string;
}

export const ColorPicker = ({ colors, selectedColor, onColorChange, label = 'Color' }: ColorPickerProps) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-900">{label}</label>
      <div className="grid grid-cols-5 gap-2">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => onColorChange(color)}
            className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 ${
              selectedColor === color
                ? 'border-purple-600 ring-2 ring-purple-600 ring-offset-2'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            style={{ backgroundColor: color }}
            title={color}
          >
            {selectedColor === color && (
              <div className="w-full h-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white drop-shadow-lg"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
