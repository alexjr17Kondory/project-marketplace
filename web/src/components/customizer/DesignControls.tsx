import { Move, Maximize2, RotateCw, Trash2 } from 'lucide-react';
import type { Design } from '../../types/design';

interface DesignControlsProps {
  design: Design | null;
  onUpdate: (updates: Partial<Design>) => void;
  onDelete: () => void;
}

export const DesignControls = ({ design, onUpdate, onDelete }: DesignControlsProps) => {
  if (!design) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p className="text-sm">Sube una imagen para comenzar a personalizarla</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Position Controls */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Move className="w-4 h-4" />
          <span>Posición</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">X</label>
            <input
              type="range"
              min="0"
              max="600"
              value={design.position.x}
              onChange={(e) =>
                onUpdate({ position: { ...design.position, x: Number(e.target.value) } })
              }
              className="w-full"
            />
            <span className="text-xs text-gray-500">{design.position.x}px</span>
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Y</label>
            <input
              type="range"
              min="0"
              max="600"
              value={design.position.y}
              onChange={(e) =>
                onUpdate({ position: { ...design.position, y: Number(e.target.value) } })
              }
              className="w-full"
            />
            <span className="text-xs text-gray-500">{design.position.y}px</span>
          </div>
        </div>
      </div>

      {/* Size Controls */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Maximize2 className="w-4 h-4" />
          <span>Tamaño</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Ancho</label>
            <input
              type="range"
              min="50"
              max="400"
              value={design.size.width}
              onChange={(e) =>
                onUpdate({ size: { ...design.size, width: Number(e.target.value) } })
              }
              className="w-full"
            />
            <span className="text-xs text-gray-500">{design.size.width}px</span>
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Alto</label>
            <input
              type="range"
              min="50"
              max="400"
              value={design.size.height}
              onChange={(e) =>
                onUpdate({ size: { ...design.size, height: Number(e.target.value) } })
              }
              className="w-full"
            />
            <span className="text-xs text-gray-500">{design.size.height}px</span>
          </div>
        </div>
      </div>

      {/* Rotation Control */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <RotateCw className="w-4 h-4" />
          <span>Rotación</span>
        </div>
        <input
          type="range"
          min="0"
          max="360"
          value={design.rotation}
          onChange={(e) => onUpdate({ rotation: Number(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0°</span>
          <span className="font-semibold text-gray-900">{design.rotation}°</span>
          <span>360°</span>
        </div>
      </div>

      {/* Opacity Control */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <span>Opacidad</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={design.opacity}
          onChange={(e) => onUpdate({ opacity: Number(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0%</span>
          <span className="font-semibold text-gray-900">{Math.round(design.opacity * 100)}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Delete Button */}
      <button
        onClick={onDelete}
        className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <Trash2 className="w-5 h-5" />
        Eliminar Diseño
      </button>
    </div>
  );
};
