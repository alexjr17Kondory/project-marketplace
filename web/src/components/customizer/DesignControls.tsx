import { useState, useEffect } from 'react';
import { Move, Maximize2, RotateCw, Trash2, Link, Unlink, Palette, Loader2 } from 'lucide-react';
import type { Design } from '../../types/design';
import { DESIGN_COLORS, applyColorToImage } from '../../utils/imageColorizer';

interface DesignControlsProps {
  design: Design | null;
  onUpdate: (updates: Partial<Design>) => void;
  onDelete: () => void;
  zoneConfig?: {
    position: { x: number; y: number };
    maxWidth: number;
    maxHeight: number;
  } | null;
}

export const DesignControls = ({ design, onUpdate, onDelete, zoneConfig }: DesignControlsProps) => {
  // Estado para mantener la proporción y la relación de aspecto
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [isColorizing, setIsColorizing] = useState(false);

  // Calcular la relación de aspecto cuando el diseño cambie
  useEffect(() => {
    if (design) {
      const ratio = design.size.width / design.size.height;
      setAspectRatio(ratio);
    }
  }, [design?.id]); // Solo recalcular cuando cambie el diseño (nueva imagen)

  // Manejar cambio de color del diseño
  const handleColorChange = async (color: string) => {
    if (!design || !design.imageData) return;

    // Si es vacío, restaurar imagen original
    if (!color) {
      onUpdate({
        tintColor: undefined,
        colorizedImageData: undefined,
      });
      return;
    }

    setIsColorizing(true);
    try {
      // Usar siempre la imagen original para aplicar el nuevo color
      const sourceImage = design.originalImageData || design.imageData;
      const colorizedImage = await applyColorToImage(sourceImage, color);
      onUpdate({
        tintColor: color,
        colorizedImageData: colorizedImage,
      });
    } catch (error) {
      console.error('Error al aplicar color:', error);
    } finally {
      setIsColorizing(false);
    }
  };

  if (!design) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p className="text-sm">Sube una imagen para comenzar a personalizarla</p>
      </div>
    );
  }

  // Obtener límites de la zona o usar valores por defecto
  const zoneMaxWidth = zoneConfig?.maxWidth || 200;
  const zoneMaxHeight = zoneConfig?.maxHeight || 200;

  // Manejar cambio de ancho manteniendo proporción
  const handleWidthChange = (newWidth: number) => {
    if (keepAspectRatio) {
      const newHeight = Math.round(newWidth / aspectRatio);
      onUpdate({ size: { width: newWidth, height: Math.min(newHeight, zoneMaxHeight) } });
    } else {
      onUpdate({ size: { ...design.size, width: newWidth } });
    }
  };

  // Manejar cambio de alto manteniendo proporción
  const handleHeightChange = (newHeight: number) => {
    if (keepAspectRatio) {
      const newWidth = Math.round(newHeight * aspectRatio);
      onUpdate({ size: { width: Math.min(newWidth, zoneMaxWidth), height: newHeight } });
    } else {
      onUpdate({ size: { ...design.size, height: newHeight } });
    }
  };

  // position.x/y ahora son porcentajes directos (0-100) donde 50 = centrado
  const handlePositionXChange = (percent: number) => {
    onUpdate({ position: { ...design.position, x: percent } });
  };

  const handlePositionYChange = (percent: number) => {
    onUpdate({ position: { ...design.position, y: percent } });
  };

  return (
    <div className="space-y-6">
      {/* Position Controls - Porcentaje directo (0-100) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Move className="w-4 h-4" />
          <span>Posición en zona</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Horizontal</label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={design.position.x}
              onChange={(e) => handlePositionXChange(Number(e.target.value))}
              className="w-full accent-purple-600"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Izq</span>
              <span className="text-xs text-gray-500 font-medium">{Math.round(design.position.x)}%</span>
              <span className="text-xs text-gray-400">Der</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Vertical</label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={design.position.y}
              onChange={(e) => handlePositionYChange(Number(e.target.value))}
              className="w-full accent-purple-600"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Arriba</span>
              <span className="text-xs text-gray-500 font-medium">{Math.round(design.position.y)}%</span>
              <span className="text-xs text-gray-400">Abajo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Size Controls - Basado en el tamaño máximo de la zona */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Maximize2 className="w-4 h-4" />
            <span>Tamaño</span>
          </div>
          <button
            onClick={() => setKeepAspectRatio(!keepAspectRatio)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
              keepAspectRatio
                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={keepAspectRatio ? 'Click para desbloquear proporción' : 'Click para mantener proporción'}
          >
            {keepAspectRatio ? (
              <>
                <Link className="w-3 h-3" />
                <span>Bloqueado</span>
              </>
            ) : (
              <>
                <Unlink className="w-3 h-3" />
                <span>Libre</span>
              </>
            )}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Ancho</label>
            <input
              type="range"
              min="20"
              max={zoneMaxWidth}
              step="5"
              value={design.size.width}
              onChange={(e) => handleWidthChange(Number(e.target.value))}
              className="w-full accent-purple-600"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">20px</span>
              <span className="text-xs text-gray-500 font-medium">{Math.round(design.size.width)}px</span>
              <span className="text-xs text-gray-400">{zoneMaxWidth}px</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Alto</label>
            <input
              type="range"
              min="20"
              max={zoneMaxHeight}
              step="5"
              value={design.size.height}
              onChange={(e) => handleHeightChange(Number(e.target.value))}
              className="w-full accent-purple-600"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">20px</span>
              <span className="text-xs text-gray-500 font-medium">{Math.round(design.size.height)}px</span>
              <span className="text-xs text-gray-400">{zoneMaxHeight}px</span>
            </div>
          </div>
        </div>
        {keepAspectRatio && (
          <p className="text-xs text-purple-600 flex items-center gap-1 bg-purple-50 px-2 py-1 rounded">
            <Link className="w-3 h-3" />
            <span>La proporción se mantiene automáticamente</span>
          </p>
        )}
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
          className="w-full accent-purple-600"
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
          className="w-full accent-purple-600"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0%</span>
          <span className="font-semibold text-gray-900">{Math.round(design.opacity * 100)}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Color del Diseño - Solo para PNG */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Palette className="w-4 h-4" />
            <span>Color del diseño</span>
          </div>
          {isColorizing && (
            <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
          )}
        </div>
        <div className="grid grid-cols-6 gap-2">
          {DESIGN_COLORS.map((colorOption) => (
            <button
              key={colorOption.value || 'original'}
              onClick={() => handleColorChange(colorOption.value)}
              disabled={isColorizing}
              className={`relative w-8 h-8 rounded-full border-2 transition-all hover:scale-110 disabled:opacity-50 ${
                (design.tintColor || '') === colorOption.value
                  ? 'border-purple-600 ring-2 ring-purple-200'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              style={{
                backgroundColor: colorOption.value || 'transparent',
                backgroundImage: !colorOption.value
                  ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)'
                  : undefined,
                backgroundSize: !colorOption.value ? '8px 8px' : undefined,
                backgroundPosition: !colorOption.value ? '0 0, 4px 4px' : undefined,
              }}
              title={colorOption.name}
            >
              {(design.tintColor || '') === colorOption.value && (
                <span className="absolute inset-0 flex items-center justify-center text-xs">
                  {colorOption.value === '#FFFFFF' || !colorOption.value ? '✓' : (
                    <span className="text-white drop-shadow-md">✓</span>
                  )}
                </span>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          {design.tintColor
            ? `Color aplicado: ${DESIGN_COLORS.find(c => c.value === design.tintColor)?.name || design.tintColor}`
            : 'Selecciona un color para aplicar al diseño'}
        </p>
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
