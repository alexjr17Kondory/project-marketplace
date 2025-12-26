import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '../shared/Button';
import {
  Plus,
  Trash2,
  Move,
  Eye,
  EyeOff,
  Save,
  Upload,
  X,
  Lock,
  Unlock,
  Type,
  Maximize2,
} from 'lucide-react';
import type { LabelZone, LabelZoneType } from '../../types/label-template';
import { ZONE_TYPE_LABELS, ZONE_SAMPLE_DATA } from '../../types/label-template';

interface LabelTemplateEditorProps {
  backgroundImage: string | null;
  width: number;  // en points (6cm = 170.08 points)
  height: number; // en points (9cm = 255.12 points)
  zones: LabelZone[];
  onZonesChange: (zones: LabelZone[]) => void;
  onBackgroundImageChange?: (imageUrl: string | null) => void;
}

interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  startX: number;
  startY: number;
  startZoneX: number;
  startZoneY: number;
  startWidth: number;
  startHeight: number;
  resizeHandle: string | null;
}

// Convertir points a cm (72 DPI: 1 cm = 28.35 points)
const pointsToCm = (points: number): number => {
  return Math.round((points / 28.35) * 10) / 10;
};

const cmToPoints = (cm: number): number => {
  return Math.round(cm * 28.35 * 10) / 10;
};

export const LabelTemplateEditor = ({
  backgroundImage,
  width,
  height,
  zones,
  onZonesChange,
  onBackgroundImageChange,
}: LabelTemplateEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [showZones, setShowZones] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [zonesReady, setZonesReady] = useState(false);

  // Estado para crear nueva zona
  const [isCreatingZone, setIsCreatingZone] = useState(false);
  const [newZoneType, setNewZoneType] = useState<LabelZoneType | ''>('');
  const [newZoneWidthCm, setNewZoneWidthCm] = useState<number>(3);
  const [newZoneHeightCm, setNewZoneHeightCm] = useState<number>(1);

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isResizing: false,
    startX: 0,
    startY: 0,
    startZoneX: 0,
    startZoneY: 0,
    startWidth: 0,
    startHeight: 0,
    resizeHandle: null,
  });

  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      // Capturar las dimensiones naturales de la imagen
      setImageDimensions({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      });

      // Usar requestAnimationFrame para esperar a que el navegador calcule el layout
      requestAnimationFrame(() => {
        setImageLoaded(true);
        setUploadingImage(false);
        setImageError(false);
      });
    }
  }, []);

  const handleImageError = useCallback(() => {
    console.error('Error al cargar la imagen de fondo');
    setImageLoaded(false);
    setUploadingImage(false);
    setImageError(true);
  }, []);

  // Si no hay imagen de fondo, marcar como cargado inmediatamente
  useEffect(() => {
    if (!backgroundImage) {
      setImageLoaded(true);
      setUploadingImage(false);
      setImageError(false);
      setZonesReady(true);
    } else {
      setImageLoaded(false);
      setImageError(false);
      setZonesReady(false);
    }
  }, [backgroundImage]);

  // Verificar si la imagen ya está cargada (desde caché o base64)
  useEffect(() => {
    if (!backgroundImage) return;

    let attempts = 0;
    const maxAttempts = 50; // 5 segundos máximo (50 * 100ms)

    // Verificar periódicamente hasta que la imagen esté cargada
    const checkInterval = setInterval(() => {
      if (imageRef.current) {
        const img = imageRef.current as HTMLImageElement;

        // Si la imagen ya está completa (cargada desde caché o base64), disparar onLoad inmediatamente
        if (img.complete && img.naturalWidth > 0) {
          handleImageLoad();
          clearInterval(checkInterval);
        }
      }

      attempts++;
      if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, [backgroundImage, handleImageLoad]);

  // Verificar si las zonas están listas para renderizarse
  useEffect(() => {
    if (!imageLoaded || !backgroundImage) return;

    // Dar un pequeño delay para que el navegador calcule las dimensiones
    const timer = setTimeout(() => {
      setZonesReady(true);
    }, 150);

    return () => clearTimeout(timer);
  }, [imageLoaded, backgroundImage]);

  const getRelativePosition = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!containerRef.current || !imageRef.current) return { x: 0, y: 0 };

    const element = imageRef.current;

    // Si no hay imagen de fondo, el elemento es un div con el rectángulo blanco
    if (!backgroundImage) {
      // El rectángulo blanco está dentro del div contenedor
      const whiteRect = element.querySelector('#label-white-rect') as HTMLDivElement;
      if (!whiteRect) return { x: 0, y: 0 };

      const rect = whiteRect.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // El rectángulo ya tiene el tamaño correcto en píxeles, calcular la escala
      const scale = rect.width / width;

      const x = mouseX / scale;
      const y = mouseY / scale;

      return {
        x: Math.max(0, Math.min(width, x)),
        y: Math.max(0, Math.min(height, y))
      };
    }

    // Si hay imagen de fondo
    const img = element as HTMLImageElement;
    const rect = img.getBoundingClientRect();
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    if (!naturalWidth || !naturalHeight) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      return { x, y };
    }

    // Calcular el área real renderizada de la imagen (considerando object-contain)
    const containerWidth = rect.width;
    const containerHeight = rect.height;
    const imageRatio = naturalWidth / naturalHeight;
    const containerRatio = containerWidth / containerHeight;

    let renderedWidth: number;
    let renderedHeight: number;
    let offsetX: number;
    let offsetY: number;

    if (imageRatio > containerRatio) {
      renderedWidth = containerWidth;
      renderedHeight = containerWidth / imageRatio;
      offsetX = 0;
      offsetY = (containerHeight - renderedHeight) / 2;
    } else {
      renderedHeight = containerHeight;
      renderedWidth = containerHeight * imageRatio;
      offsetX = (containerWidth - renderedWidth) / 2;
      offsetY = 0;
    }

    // Calcular posición relativa dentro del área real de la imagen
    const mouseX = e.clientX - rect.left - offsetX;
    const mouseY = e.clientY - rect.top - offsetY;

    // Convertir a points (coordenadas absolutas de la etiqueta)
    const x = (mouseX / renderedWidth) * width;
    const y = (mouseY / renderedHeight) * height;

    return {
      x: Math.max(0, Math.min(width, x)),
      y: Math.max(0, Math.min(height, y))
    };
  }, [width, height, backgroundImage]);

  const handleZoneMouseDown = (e: React.MouseEvent, zone: LabelZone, handle?: string) => {
    e.preventDefault();
    e.stopPropagation();

    setSelectedZoneId(zone.id);
    const pos = getRelativePosition(e);

    if (handle) {
      setDragState({
        isDragging: false,
        isResizing: true,
        startX: pos.x,
        startY: pos.y,
        startZoneX: zone.x,
        startZoneY: zone.y,
        startWidth: zone.width,
        startHeight: zone.height,
        resizeHandle: handle,
      });
    } else {
      setDragState({
        isDragging: true,
        isResizing: false,
        startX: pos.x,
        startY: pos.y,
        startZoneX: zone.x,
        startZoneY: zone.y,
        startWidth: zone.width,
        startHeight: zone.height,
        resizeHandle: null,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.isDragging && !dragState.isResizing) return;
      if (selectedZoneId === null) return;

      const pos = getRelativePosition(e);
      const deltaX = pos.x - dragState.startX;
      const deltaY = pos.y - dragState.startY;

      const updatedZones = zones.map(zone => {
        if (zone.id !== selectedZoneId) return zone;

        if (dragState.isDragging) {
          const newX = Math.max(0, Math.min(width - zone.width, dragState.startZoneX + deltaX));
          const newY = Math.max(0, Math.min(height - zone.height, dragState.startZoneY + deltaY));
          return { ...zone, x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 };
        } else if (dragState.isResizing) {
          let newWidth = dragState.startWidth;
          let newHeight = dragState.startHeight;
          let newX = dragState.startZoneX;
          let newY = dragState.startZoneY;

          const aspectRatio = dragState.startWidth / dragState.startHeight;

          switch (dragState.resizeHandle) {
            case 'se':
              newWidth = Math.max(10, dragState.startWidth + deltaX);
              if (lockAspectRatio) {
                newHeight = newWidth / aspectRatio;
              } else {
                newHeight = Math.max(10, dragState.startHeight + deltaY);
              }
              break;
            case 'sw':
              newWidth = Math.max(10, dragState.startWidth - deltaX);
              if (lockAspectRatio) {
                newHeight = newWidth / aspectRatio;
              } else {
                newHeight = Math.max(10, dragState.startHeight + deltaY);
              }
              newX = dragState.startZoneX + (dragState.startWidth - newWidth);
              break;
            case 'ne':
              newWidth = Math.max(10, dragState.startWidth + deltaX);
              if (lockAspectRatio) {
                newHeight = newWidth / aspectRatio;
                newY = dragState.startZoneY + (dragState.startHeight - newHeight);
              } else {
                newHeight = Math.max(10, dragState.startHeight - deltaY);
                newY = dragState.startZoneY + (dragState.startHeight - newHeight);
              }
              break;
            case 'nw':
              newWidth = Math.max(10, dragState.startWidth - deltaX);
              if (lockAspectRatio) {
                newHeight = newWidth / aspectRatio;
                newX = dragState.startZoneX + (dragState.startWidth - newWidth);
                newY = dragState.startZoneY + (dragState.startHeight - newHeight);
              } else {
                newHeight = Math.max(10, dragState.startHeight - deltaY);
                newX = dragState.startZoneX + (dragState.startWidth - newWidth);
                newY = dragState.startZoneY + (dragState.startHeight - newHeight);
              }
              break;
          }

          newWidth = Math.max(10, newWidth);
          newHeight = Math.max(10, newHeight);
          newX = Math.max(0, Math.min(width - newWidth, newX));
          newY = Math.max(0, Math.min(height - newHeight, newY));
          newWidth = Math.min(width - newX, newWidth);
          newHeight = Math.min(height - newY, newHeight);

          return {
            ...zone,
            x: Math.round(newX * 10) / 10,
            y: Math.round(newY * 10) / 10,
            width: Math.round(newWidth * 10) / 10,
            height: Math.round(newHeight * 10) / 10
          };
        }
        return zone;
      });

      onZonesChange(updatedZones);
    };

    const handleMouseUp = () => {
      if (dragState.isDragging || dragState.isResizing) {
        setDragState({
          isDragging: false,
          isResizing: false,
          startX: 0,
          startY: 0,
          startZoneX: 0,
          startZoneY: 0,
          startWidth: 0,
          startHeight: 0,
          resizeHandle: null,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, selectedZoneId, getRelativePosition, lockAspectRatio, zones, width, height, onZonesChange]);

  const getImageContentArea = useCallback(() => {
    if (!imageRef.current) return null;

    const element = imageRef.current;

    // Si no hay imagen de fondo, obtener el rectángulo blanco
    if (!backgroundImage) {
      const whiteRect = element.querySelector('#label-white-rect') as HTMLDivElement;
      if (!whiteRect) return null;

      const rect = whiteRect.getBoundingClientRect();

      // Validar que las dimensiones sean válidas antes de devolver
      if (!rect.width || !rect.height || rect.width <= 0 || rect.height <= 0) {
        return null;
      }

      // Las zonas están DENTRO del rectángulo blanco, no necesitan offset
      return {
        renderedWidth: rect.width,
        renderedHeight: rect.height,
        offsetX: 0,
        offsetY: 0,
      };
    }

    // Si hay imagen de fondo
    const img = element as HTMLImageElement;
    const containerWidth = img.clientWidth;
    const containerHeight = img.clientHeight;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    // Validar dimensiones naturales y de contenedor
    if (!naturalWidth || !naturalHeight || naturalWidth <= 0 || naturalHeight <= 0) {
      return null;
    }

    if (!containerWidth || !containerHeight || containerWidth <= 0 || containerHeight <= 0) {
      return null;
    }

    const imageRatio = naturalWidth / naturalHeight;
    const containerRatio = containerWidth / containerHeight;

    let renderedWidth: number;
    let renderedHeight: number;
    let offsetX: number;
    let offsetY: number;

    if (imageRatio > containerRatio) {
      renderedWidth = containerWidth;
      renderedHeight = containerWidth / imageRatio;
      offsetX = 0;
      offsetY = (containerHeight - renderedHeight) / 2;
    } else {
      renderedHeight = containerHeight;
      renderedWidth = containerHeight * imageRatio;
      offsetX = (containerWidth - renderedWidth) / 2;
      offsetY = 0;
    }

    // Validar que las dimensiones calculadas sean válidas
    if (!renderedWidth || !renderedHeight || renderedWidth <= 0 || renderedHeight <= 0) {
      return null;
    }

    return { renderedWidth, renderedHeight, offsetX, offsetY };
  }, [backgroundImage]);

  const getZoneDisplayDimensions = (zone: LabelZone) => {
    const contentArea = getImageContentArea();

    if (!contentArea) {
      // Si no hay área de contenido válida, no renderizar (dimensiones 0)
      return null;
    }

    const { renderedWidth, renderedHeight, offsetX, offsetY } = contentArea;

    // Convertir coordenadas de points a píxeles de pantalla
    const leftPx = offsetX + (zone.x / width) * renderedWidth;
    const topPx = offsetY + (zone.y / height) * renderedHeight;
    const widthPx = (zone.width / width) * renderedWidth;
    const heightPx = (zone.height / height) * renderedHeight;

    return {
      left: `${leftPx}px`,
      top: `${topPx}px`,
      width: `${widthPx}px`,
      height: `${heightPx}px`,
    };
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar 5MB');
      return;
    }

    setUploadingImage(true);
    setImageLoaded(false); // Asegurar que se muestra el loading

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;

      // Precargar la imagen antes de establecerla
      const img = new Image();
      img.onload = () => {
        onBackgroundImageChange?.(dataUrl);
        setUploadingImage(false);
        // imageLoaded se pondrá en true automáticamente por el useEffect
      };
      img.onerror = () => {
        alert('Error al cargar la imagen');
        setUploadingImage(false);
        setImageLoaded(true);
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      alert('Error al leer el archivo');
      setUploadingImage(false);
      setImageLoaded(true);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreateZone = () => {
    if (!newZoneType) {
      alert('Selecciona un tipo de zona');
      return;
    }

    if (newZoneWidthCm <= 0 || newZoneHeightCm <= 0) {
      alert('Las dimensiones deben ser mayores a 0');
      return;
    }

    const zoneWidth = cmToPoints(newZoneWidthCm);
    const zoneHeight = cmToPoints(newZoneHeightCm);

    // Centrar la zona inicialmente
    const posX = Math.max(0, (width - zoneWidth) / 2);
    const posY = Math.max(0, (height - zoneHeight) / 2);

    // Crear ID temporal negativo para zonas nuevas (antes de guardar en DB)
    const tempId = -Date.now();

    const newZone: LabelZone = {
      id: tempId,
      labelTemplateId: 0, // Se asignará al guardar
      zoneType: newZoneType,
      x: Math.round(posX * 10) / 10,
      y: Math.round(posY * 10) / 10,
      width: Math.round(zoneWidth * 10) / 10,
      height: Math.round(zoneHeight * 10) / 10,
      fontSize: 10,
      fontWeight: 'normal',
      textAlign: 'center',
      fontColor: '#000000',
      showLabel: true,
      rotation: 0,
      zIndex: zones.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onZonesChange([...zones, newZone]);
    setIsCreatingZone(false);
    setNewZoneType('');
    setNewZoneWidthCm(3);
    setNewZoneHeightCm(1);
    setSelectedZoneId(tempId);
  };

  const handleDeleteZone = (zoneId: number) => {
    if (!confirm('¿Eliminar esta zona?')) return;
    const newZones = zones.filter(z => z.id !== zoneId);
    onZonesChange(newZones);
    if (selectedZoneId === zoneId) setSelectedZoneId(null);
  };

  const getZoneColor = (zone: LabelZone) => {
    const colors: Record<string, string> = {
      PRODUCT_NAME: 'rgba(59, 130, 246, 0.4)',
      SIZE: 'rgba(16, 185, 129, 0.4)',
      COLOR: 'rgba(245, 158, 11, 0.4)',
      BARCODE: 'rgba(139, 92, 246, 0.4)',
      BARCODE_TEXT: 'rgba(236, 72, 153, 0.4)',
      SKU: 'rgba(99, 102, 241, 0.4)',
      PRICE: 'rgba(239, 68, 68, 0.4)',
      CUSTOM_TEXT: 'rgba(107, 114, 128, 0.4)',
    };
    return colors[zone.zoneType] || 'rgba(156, 163, 175, 0.4)';
  };

  const getBorderColor = (zone: LabelZone) => {
    const colors: Record<string, string> = {
      PRODUCT_NAME: 'rgb(59, 130, 246)',
      SIZE: 'rgb(16, 185, 129)',
      COLOR: 'rgb(245, 158, 11)',
      BARCODE: 'rgb(139, 92, 246)',
      BARCODE_TEXT: 'rgb(236, 72, 153)',
      SKU: 'rgb(99, 102, 241)',
      PRICE: 'rgb(239, 68, 68)',
      CUSTOM_TEXT: 'rgb(107, 114, 128)',
    };
    return colors[zone.zoneType] || 'rgb(156, 163, 175)';
  };

  const selectedZone = zones.find(z => z.id === selectedZoneId);

  const zoneTypeOptions: LabelZoneType[] = [
    'PRODUCT_NAME',
    'SIZE',
    'COLOR',
    'BARCODE',
    'BARCODE_TEXT',
    'SKU',
    'PRICE',
    'CUSTOM_TEXT',
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Type className="w-5 h-5" />
          Editor de Etiqueta
        </h3>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowZones(!showZones)}
            className={`p-2 rounded-lg border ${showZones ? 'bg-orange-50 border-orange-300' : 'bg-white border-gray-300'}`}
            title={showZones ? 'Ocultar zonas' : 'Mostrar zonas'}
          >
            {showZones ? <Eye className="w-5 h-5 text-orange-600" /> : <EyeOff className="w-5 h-5 text-gray-500" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-4 space-y-3">
          {/* Subir imagen de fondo */}
          <div className="border border-gray-300 rounded-lg p-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagen de Fondo
            </label>
            {backgroundImage ? (
              <div className="space-y-2">
                <img
                  src={backgroundImage}
                  alt="Fondo de etiqueta"
                  className="w-full h-32 object-contain rounded border border-gray-200 bg-white"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="flex-1 text-xs text-orange-600 hover:text-orange-800 py-1 disabled:opacity-50"
                  >
                    {uploadingImage ? 'Cargando...' : 'Cambiar imagen'}
                  </button>
                  <button
                    onClick={() => onBackgroundImageChange?.(null)}
                    disabled={uploadingImage}
                    className="p-1 text-red-500 hover:bg-red-50 rounded disabled:opacity-50"
                    title="Eliminar imagen"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="w-full flex items-center justify-center gap-2 px-3 py-3 border-2 border-dashed border-gray-300 rounded-md text-sm text-gray-500 hover:border-orange-400 hover:text-orange-600 transition-colors bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4" />
                {uploadingImage ? 'Cargando imagen...' : 'Subir imagen'}
              </button>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Dimensiones: {pointsToCm(width)}cm × {pointsToCm(height)}cm
            </p>
          </div>

          {/* Crear nueva zona */}
          {!isCreatingZone ? (
            <Button
              onClick={() => setIsCreatingZone(true)}
              variant="admin-secondary"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar Zona
            </Button>
          ) : (
            <div className="border rounded-lg p-3 space-y-3 bg-gray-50 border-gray-300">
              <label className="block text-xs font-medium text-gray-700">
                Tipo de Información
              </label>
              <select
                value={newZoneType}
                onChange={(e) => setNewZoneType(e.target.value as LabelZoneType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Seleccionar tipo...</option>
                {zoneTypeOptions.map(type => (
                  <option key={type} value={type}>{ZONE_TYPE_LABELS[type]}</option>
                ))}
              </select>

              <div className="bg-white border border-gray-200 rounded-md p-2">
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Dimensiones (cm)
                </label>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Ancho</label>
                    <input
                      type="number"
                      value={newZoneWidthCm}
                      onChange={(e) => setNewZoneWidthCm(parseFloat(e.target.value) || 0)}
                      min="0.5"
                      max={pointsToCm(width)}
                      step="0.5"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-center"
                    />
                  </div>
                  <span className="text-gray-400 pt-4">×</span>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Alto</label>
                    <input
                      type="number"
                      value={newZoneHeightCm}
                      onChange={(e) => setNewZoneHeightCm(parseFloat(e.target.value) || 0)}
                      min="0.5"
                      max={pointsToCm(height)}
                      step="0.5"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-center"
                    />
                  </div>
                  <span className="text-xs text-gray-500 pt-4">cm</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setIsCreatingZone(false)} variant="admin-secondary" className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleCreateZone} variant="admin-primary" className="flex-1">
                  Crear Zona
                </Button>
              </div>
            </div>
          )}

          {/* Lista de zonas */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {zones.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No hay zonas. Agrega una nueva zona.
              </p>
            ) : (
              zones.map(zone => (
                <div
                  key={zone.id}
                  onClick={() => setSelectedZoneId(zone.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedZoneId === zone.id
                      ? 'border-orange-500 bg-orange-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: getBorderColor(zone) }}
                      />
                      <span className="font-medium text-sm">{ZONE_TYPE_LABELS[zone.zoneType]}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteZone(zone.id); }}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">
                    <span className="font-medium text-gray-700">
                      {pointsToCm(zone.width)} × {pointsToCm(zone.height)} cm
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Detalles de zona seleccionada */}
          {selectedZone && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm text-gray-900">{ZONE_TYPE_LABELS[selectedZone.zoneType]}</h4>
                <button
                  onClick={() => setLockAspectRatio(!lockAspectRatio)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                    lockAspectRatio
                      ? 'bg-orange-100 text-orange-700 border border-orange-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-300'
                  }`}
                  title={lockAspectRatio ? 'Proporciones bloqueadas' : 'Proporciones libres'}
                >
                  {lockAspectRatio ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  {lockAspectRatio ? 'Bloqueado' : 'Libre'}
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-md p-2">
                <div className="text-xs text-gray-500 mb-1">Dimensiones</div>
                <div className="font-medium text-gray-900">
                  {pointsToCm(selectedZone.width)} × {pointsToCm(selectedZone.height)} cm
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-gray-500">Posición X</label>
                  <div className="font-mono bg-white px-2 py-1 rounded border border-gray-200">
                    {pointsToCm(selectedZone.x)} cm
                  </div>
                </div>
                <div>
                  <label className="text-gray-500">Posición Y</label>
                  <div className="font-mono bg-white px-2 py-1 rounded border border-gray-200">
                    {pointsToCm(selectedZone.y)} cm
                  </div>
                </div>
              </div>

              {/* Toggle para mostrar/ocultar label */}
              {['SIZE', 'COLOR', 'SKU'].includes(selectedZone.zoneType) && (
                <div className="flex items-center justify-between bg-white border border-gray-200 rounded-md p-2">
                  <div className="text-xs">
                    <div className="text-gray-700 font-medium">Mostrar etiqueta</div>
                    <div className="text-gray-500">Ej: "Talla:", "Color:", "SKU:"</div>
                  </div>
                  <button
                    onClick={() => {
                      const newZones = zones.map(z =>
                        z.id === selectedZone.id
                          ? { ...z, showLabel: !z.showLabel }
                          : z
                      );
                      onZonesChange(newZones);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      selectedZone.showLabel !== false ? 'bg-orange-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        selectedZone.showLabel !== false ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-700">
                Vista previa: <strong>
                  {selectedZone.showLabel !== false
                    ? ZONE_SAMPLE_DATA[selectedZone.zoneType]
                    : ZONE_SAMPLE_DATA[selectedZone.zoneType].replace(/^(Talla:|Color:|SKU:)\s*/, '')
                  }
                </strong>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Vista previa de la etiqueta */}
        <div className="col-span-12 lg:col-span-8">
          <div
            ref={containerRef}
            className="relative bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center p-8"
            style={{ minHeight: '500px' }}
          >
            {uploadingImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-20">
                <div className="text-gray-700 font-medium">Cargando imagen...</div>
              </div>
            )}

            {backgroundImage ? (
              <div
                className="relative"
                style={{
                  width: `${width}px`,
                  height: `${height}px`,
                  maxWidth: '100%',
                  maxHeight: '700px',
                }}
              >
                <img
                  ref={imageRef}
                  src={backgroundImage}
                  alt="Etiqueta"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  className="w-full h-full object-contain"
                  style={{
                    display: imageLoaded ? 'block' : 'none',
                  }}
                />

                {!imageLoaded && !uploadingImage && !imageError && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-gray-500">Cargando...</div>
                  </div>
                )}

                {imageError && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-red-500 text-sm">Error al cargar la imagen</div>
                  </div>
                )}

                {/* Renderizar zonas DENTRO del contenedor de la imagen */}
                {showZones && imageLoaded && zonesReady && zones.map(zone => {
                  const displayDimensions = getZoneDisplayDimensions(zone);

                  // No renderizar si no hay dimensiones válidas
                  if (!displayDimensions) return null;

                  const borderColor = getBorderColor(zone);
                  const fillColor = getZoneColor(zone);
                  const isSelected = selectedZoneId === zone.id;

                  return (
                    <div
                      key={zone.id}
                      className={`absolute border-2 cursor-move transition-all ${
                        isSelected ? 'shadow-lg z-10 opacity-100' : 'z-0 opacity-30 hover:opacity-50'
                      }`}
                      style={{
                        left: displayDimensions.left,
                        top: displayDimensions.top,
                        width: displayDimensions.width,
                        height: displayDimensions.height,
                        backgroundColor: fillColor,
                        borderColor: borderColor,
                        borderStyle: 'solid',
                      }}
                      onMouseDown={(e) => handleZoneMouseDown(e, zone)}
                    >
                      {isSelected && (
                        <div
                          className="absolute -top-6 left-0 px-2 py-0.5 text-xs font-medium text-white rounded-t whitespace-nowrap"
                          style={{ backgroundColor: borderColor }}
                        >
                          {ZONE_TYPE_LABELS[zone.zoneType]}
                        </div>
                      )}

                      {isSelected && (
                        <>
                          {/* Handles de redimensionamiento */}
                          <div
                            className="absolute -top-1 -left-1 w-3 h-3 bg-white border-2 rounded-sm cursor-nw-resize"
                            style={{ borderColor }}
                            onMouseDown={(e) => handleZoneMouseDown(e, zone, 'nw')}
                          />
                          <div
                            className="absolute -top-1 -right-1 w-3 h-3 bg-white border-2 rounded-sm cursor-ne-resize"
                            style={{ borderColor }}
                            onMouseDown={(e) => handleZoneMouseDown(e, zone, 'ne')}
                          />
                          <div
                            className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border-2 rounded-sm cursor-sw-resize"
                            style={{ borderColor }}
                            onMouseDown={(e) => handleZoneMouseDown(e, zone, 'sw')}
                          />
                          <div
                            className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 rounded-sm cursor-se-resize"
                            style={{ borderColor }}
                            onMouseDown={(e) => handleZoneMouseDown(e, zone, 'se')}
                          />

                          <div className="absolute inset-0 flex items-center justify-center opacity-50 pointer-events-none">
                            <Move className="w-6 h-6 text-gray-800" />
                          </div>
                        </>
                      )}

                      {/* Mostrar texto de muestra solo en zona seleccionada */}
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center px-1 text-xs font-medium text-gray-700 pointer-events-none overflow-hidden">
                          {ZONE_SAMPLE_DATA[zone.zoneType]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                ref={imageRef as React.RefObject<HTMLDivElement>}
                className="flex items-center justify-center"
              >
                <div
                  id="label-white-rect"
                  className="relative bg-white border-2 border-gray-300 shadow-sm"
                  style={{
                    width: `${width}px`,
                    height: `${height}px`,
                    maxWidth: '100%',
                    aspectRatio: `${width} / ${height}`,
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm pointer-events-none">
                    {pointsToCm(width)} cm × {pointsToCm(height)} cm
                  </div>

                  {/* Renderizar zonas DENTRO del rectángulo blanco */}
                  {showZones && zonesReady && zones.map(zone => {
                    const displayDimensions = getZoneDisplayDimensions(zone);

                    // No renderizar si no hay dimensiones válidas
                    if (!displayDimensions) return null;

                    const borderColor = getBorderColor(zone);
                    const fillColor = getZoneColor(zone);
                    const isSelected = selectedZoneId === zone.id;

                    return (
                      <div
                        key={zone.id}
                        className={`absolute border-2 cursor-move transition-all ${
                          isSelected ? 'shadow-lg z-10 opacity-100' : 'z-0 opacity-30 hover:opacity-50'
                        }`}
                        style={{
                          left: displayDimensions.left,
                          top: displayDimensions.top,
                          width: displayDimensions.width,
                          height: displayDimensions.height,
                          backgroundColor: fillColor,
                          borderColor: borderColor,
                          borderStyle: 'solid',
                        }}
                        onMouseDown={(e) => handleZoneMouseDown(e, zone)}
                      >
                        {isSelected && (
                          <div
                            className="absolute -top-6 left-0 px-2 py-0.5 text-xs font-medium text-white rounded-t whitespace-nowrap"
                            style={{ backgroundColor: borderColor }}
                          >
                            {ZONE_TYPE_LABELS[zone.zoneType]}
                          </div>
                        )}

                        {isSelected && (
                          <>
                            {/* Handles de redimensionamiento */}
                            <div
                              className="absolute -top-1 -left-1 w-3 h-3 bg-white border-2 rounded-sm cursor-nw-resize"
                              style={{ borderColor }}
                              onMouseDown={(e) => handleZoneMouseDown(e, zone, 'nw')}
                            />
                            <div
                              className="absolute -top-1 -right-1 w-3 h-3 bg-white border-2 rounded-sm cursor-ne-resize"
                              style={{ borderColor }}
                              onMouseDown={(e) => handleZoneMouseDown(e, zone, 'ne')}
                            />
                            <div
                              className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border-2 rounded-sm cursor-sw-resize"
                              style={{ borderColor }}
                              onMouseDown={(e) => handleZoneMouseDown(e, zone, 'sw')}
                            />
                            <div
                              className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 rounded-sm cursor-se-resize"
                              style={{ borderColor }}
                              onMouseDown={(e) => handleZoneMouseDown(e, zone, 'se')}
                            />

                            <div className="absolute inset-0 flex items-center justify-center opacity-50 pointer-events-none">
                              <Move className="w-6 h-6 text-gray-800" />
                            </div>
                          </>
                        )}

                        {/* Mostrar texto de muestra solo en zona seleccionada */}
                        {isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center px-1 text-xs font-medium text-gray-700 pointer-events-none overflow-hidden">
                            {ZONE_SAMPLE_DATA[zone.zoneType]}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Move className="w-3 h-3" /> Arrastra para mover
            </span>
            <span className="flex items-center gap-1">
              <Maximize2 className="w-3 h-3" /> Esquinas para redimensionar
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
