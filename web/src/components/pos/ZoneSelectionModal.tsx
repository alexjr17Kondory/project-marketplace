import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { X, CheckCircle, Package, Eye, Loader2 } from 'lucide-react';
import type { TemplateSearchResult, TemplateZoneInfo } from '../../services/pos.service';
import { applyColorToImage } from '../../utils/imageColorizer';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getAuthToken = () => {
  const authData = localStorage.getItem('marketplace_auth');
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      return parsed.token;
    } catch {
      return null;
    }
  }
  return null;
};

interface ZoneSelectionModalProps {
  template: TemplateSearchResult;
  onConfirm: (selectedZones: TemplateZoneInfo[], totalPrice: number) => void;
  onCancel: () => void;
}

export default function ZoneSelectionModal({ template, onConfirm, onCancel }: ZoneSelectionModalProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Initialize with required zones selected - one zone per type
  // Map: zoneTypeSlug -> zoneId
  const initialSelection = useMemo(() => {
    const map = new Map<string, number>();
    template.zones.filter(z => z.isRequired && !z.isBlocked).forEach(z => {
      map.set(z.zoneTypeSlug, z.id);
    });
    return map;
  }, [template.zones]);

  const [selectedZonesByType, setSelectedZonesByType] = useState<Map<string, number>>(initialSelection);

  // State to control which zone type is currently being viewed
  const [viewingZoneTypeSlug, setViewingZoneTypeSlug] = useState<string | null>(() => {
    // Initialize with first zone type
    if (template.zones.length > 0) {
      return template.zones[0].zoneTypeSlug;
    }
    return null;
  });

  // Stock state
  const [stockInfo, setStockInfo] = useState<{
    availableStock: number;
    variantId: number | null;
    sku: string;
  } | null>(null);
  const [isLoadingStock, setIsLoadingStock] = useState(false);

  // Image colorization state
  const [colorizedImage, setColorizedImage] = useState<string | null>(null);

  // Calculate total price based on selected zones
  const totalPrice = useMemo(() => {
    let total = Number(template.basePrice);
    const selectedIds = Array.from(selectedZonesByType.values());
    template.zones.forEach(zone => {
      if (selectedIds.includes(zone.id) && !zone.isBlocked) {
        total += Number(zone.price);
      }
    });
    return total;
  }, [selectedZonesByType, template]);

  // Get selected zones
  const selectedZones = useMemo(() => {
    const selectedIds = Array.from(selectedZonesByType.values());
    return template.zones.filter(z => selectedIds.includes(z.id) && !z.isBlocked);
  }, [selectedZonesByType, template.zones]);

  // Toggle zone selection - single selection per zone type
  const toggleZone = (zoneId: number) => {
    const zone = template.zones.find(z => z.id === zoneId);

    // Can't select blocked zones
    if (!zone || zone.isBlocked) return;

    // Change view to this zone's type when clicking on it
    setViewingZoneTypeSlug(zone.zoneTypeSlug);

    // Can't deselect required zones
    if (zone.isRequired) return;

    setSelectedZonesByType(prev => {
      const newMap = new Map(prev);
      const currentSelectedId = newMap.get(zone.zoneTypeSlug);

      // If this zone is already selected, deselect it (only if not required)
      if (currentSelectedId === zoneId && !zone.isRequired) {
        newMap.delete(zone.zoneTypeSlug);
      } else {
        // Select this zone (replaces any other zone of the same type)
        newMap.set(zone.zoneTypeSlug, zoneId);
      }

      return newMap;
    });
  };

  // Handle image load
  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Fetch stock for scanned variant
  useEffect(() => {
    if (!template.scannedVariant) return;

    const fetchStock = async () => {
      setIsLoadingStock(true);
      try {
        const response = await axios.get(
          `${API_URL}/template-recipes/variant-stock/${template.templateId}`,
          {
            params: {
              colorId: template.scannedVariant.colorId,
              sizeId: template.scannedVariant.sizeId,
            },
            headers: {
              Authorization: `Bearer ${getAuthToken()}`,
            },
          }
        );

        if (response.data.success && response.data.data) {
          setStockInfo({
            availableStock: response.data.data.availableStock || 0,
            variantId: response.data.data.variantId || null,
            sku: response.data.data.sku || '',
          });
        } else {
          setStockInfo({ availableStock: 0, variantId: null, sku: '' });
        }
      } catch (error) {
        console.error('Error fetching stock:', error);
        setStockInfo({ availableStock: 0, variantId: null, sku: '' });
      } finally {
        setIsLoadingStock(false);
      }
    };

    fetchStock();
  }, [template.scannedVariant, template.templateId]);

  // Calculate the area real of the visible image considering object-contain
  const getImageContentArea = useCallback(() => {
    if (!imageRef.current) return null;

    const img = imageRef.current;
    const containerWidth = img.clientWidth;
    const containerHeight = img.clientHeight;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    if (!naturalWidth || !naturalHeight) return null;

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

    return { renderedWidth, renderedHeight, offsetX, offsetY };
  }, []);

  // Calculate zone display dimensions in pixels
  const getZoneDisplayDimensions = (zone: TemplateZoneInfo) => {
    const contentArea = getImageContentArea();

    if (!contentArea) {
      return {
        left: `${zone.positionX}%`,
        top: `${zone.positionY}%`,
        width: `${zone.maxWidth}%`,
        height: `${zone.maxHeight}%`,
      };
    }

    const { renderedWidth, renderedHeight, offsetX, offsetY } = contentArea;

    const leftPx = offsetX + (zone.positionX / 100) * renderedWidth;
    const topPx = offsetY + (zone.positionY / 100) * renderedHeight;
    const widthPx = (zone.maxWidth / 100) * renderedWidth;
    const heightPx = (zone.maxHeight / 100) * renderedHeight;

    return {
      left: `${leftPx}px`,
      top: `${topPx}px`,
      width: `${widthPx}px`,
      height: `${heightPx}px`,
    };
  };

  // Current view zone type is controlled by state
  const currentViewZoneType = viewingZoneTypeSlug;

  // Get original image: prioritize zone-type-specific image, then original image
  const originalImage = useMemo(() => {
    if (currentViewZoneType && template.zoneTypeImages?.[currentViewZoneType]) {
      return template.zoneTypeImages[currentViewZoneType];
    }
    return template.image;
  }, [currentViewZoneType, template.zoneTypeImages, template.image]);

  // Use colorized image if available, otherwise use original
  const currentImage = colorizedImage || originalImage;

  // Colorize image when it loads or changes
  useEffect(() => {
    if (!originalImage || !template.scannedVariant?.colorHex) {
      setColorizedImage(null);
      return;
    }

    applyColorToImage(originalImage, template.scannedVariant.colorHex)
      .then(setColorizedImage)
      .catch(err => {
        console.error('Error colorizing image:', err);
        setColorizedImage(null);
      });
  }, [originalImage, template.scannedVariant?.colorHex]);

  // Handle confirm
  const handleConfirm = () => {
    onConfirm(selectedZones, totalPrice);
  };

  // Group zones by type
  const zonesByType = useMemo(() => {
    const groups: { [key: string]: TemplateZoneInfo[] } = {};
    template.zones.filter(z => !z.isBlocked).forEach(zone => {
      const type = zone.zoneType || 'Otro';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(zone);
    });
    return groups;
  }, [template.zones]);

  // Colors for zone types
  const typeColors: { [key: string]: { bg: string; border: string; text: string; selectedBg: string; selectedBorder: string } } = {
    'DTF': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', selectedBg: 'bg-purple-100', selectedBorder: 'border-purple-500' },
    'Bordado': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', selectedBg: 'bg-blue-100', selectedBorder: 'border-blue-500' },
    'Sublimación': { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', selectedBg: 'bg-pink-100', selectedBorder: 'border-pink-500' },
    'Vinilo': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', selectedBg: 'bg-green-100', selectedBorder: 'border-green-500' },
    'Otro': { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', selectedBg: 'bg-gray-100', selectedBorder: 'border-gray-500' },
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{template.name}</h2>
            <p className="text-sm text-gray-600 mt-1">Selecciona las zonas de personalización</p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Two Columns */}
        <div className="flex-1 overflow-y-auto flex">
          {/* Left Column - Image with Zone Markers */}
          <div className="w-1/3 bg-gray-50 p-6 flex flex-col items-center justify-center border-r border-gray-200">
            {currentImage ? (
              <div className="relative w-full max-w-sm">
                <img
                  ref={imageRef}
                  src={currentImage}
                  alt={template.name}
                  onLoad={handleImageLoad}
                  className="w-full rounded-lg shadow-lg object-contain"
                />
                {/* SKU Badge */}
                <div className="absolute top-2 right-2 bg-white px-3 py-1 rounded-full shadow-md">
                  <span className="text-xs font-semibold text-gray-700">SKU: {template.sku}</span>
                </div>
                {/* Zone Markers - Show only zones of current view type */}
                {imageLoaded && selectedZones
                  .filter(zone => zone.zoneTypeSlug === currentViewZoneType)
                  .map(zone => {
                    const displayDimensions = getZoneDisplayDimensions(zone);
                    const colors = typeColors[zone.zoneType] || typeColors['Otro'];

                    // Extraer el color base del Tailwind color class
                    const getBorderColor = () => {
                      if (zone.zoneType === 'DTF') return 'rgb(168, 85, 247)'; // purple-500
                      if (zone.zoneType === 'Bordado') return 'rgb(59, 130, 246)'; // blue-500
                      if (zone.zoneType === 'Sublimación') return 'rgb(236, 72, 153)'; // pink-500
                      if (zone.zoneType === 'Vinilo') return 'rgb(34, 197, 94)'; // green-500
                      return 'rgb(107, 114, 128)'; // gray-500
                    };

                    const getBackgroundColor = () => {
                      if (zone.zoneType === 'DTF') return 'rgba(168, 85, 247, 0.25)'; // purple
                      if (zone.zoneType === 'Bordado') return 'rgba(59, 130, 246, 0.25)'; // blue
                      if (zone.zoneType === 'Sublimación') return 'rgba(236, 72, 153, 0.25)'; // pink
                      if (zone.zoneType === 'Vinilo') return 'rgba(34, 197, 94, 0.25)'; // green
                      return 'rgba(107, 114, 128, 0.25)'; // gray
                    };

                    return (
                      <div
                        key={zone.id}
                        className="absolute pointer-events-none"
                        style={{
                          left: displayDimensions.left,
                          top: displayDimensions.top,
                          width: displayDimensions.width,
                          height: displayDimensions.height,
                          border: `3px solid ${getBorderColor()}`,
                          backgroundColor: getBackgroundColor(),
                          borderRadius: zone.shape === 'circle' ? '50%' : '0.5rem',
                          boxShadow: `0 0 0 2px rgba(255, 255, 255, 0.8), 0 4px 6px rgba(0, 0, 0, 0.2)`,
                        }}
                      >
                        <div
                          className="absolute -top-6 left-0 px-2 py-1 text-xs font-bold text-white rounded shadow-lg"
                          style={{
                            backgroundColor: getBorderColor(),
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                          }}
                        >
                          {zone.name}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="w-full max-w-sm aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                <Package className="w-24 h-24 text-gray-400" />
              </div>
            )}

            {/* Info Compacta - Todo en una card */}
            <div className="mt-4 w-full max-w-sm">
              <div className="bg-white border-2 border-gray-300 rounded-lg p-3 space-y-2">
                {/* Precio Base */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <span className="text-xs font-medium text-gray-600">Precio Base</span>
                  <span className="text-lg font-bold text-indigo-600">
                    ${Number(template.basePrice).toLocaleString()}
                  </span>
                </div>

                {/* Color y Talla */}
                {template.scannedVariant && (
                  <>
                    {/* Color */}
                    {template.scannedVariant.colorName && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600">Color</span>
                        <div className="flex items-center gap-1.5">
                          {template.scannedVariant.colorHex && (
                            <div
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: template.scannedVariant.colorHex }}
                            />
                          )}
                          <span className="text-xs font-semibold text-gray-900">
                            {template.scannedVariant.colorName}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Talla */}
                    {template.scannedVariant.sizeName && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600">Talla</span>
                        <span className="text-xs font-semibold text-gray-900">
                          {template.scannedVariant.sizeAbbr || template.scannedVariant.sizeName}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* Stock */}
                {stockInfo ? (
                  <div className={`flex items-center justify-between pt-2 border-t ${
                    stockInfo.availableStock > 0 ? 'border-green-200' : 'border-red-200'
                  }`}>
                    <span className="text-xs font-medium text-gray-600">Stock Disponible</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${
                        stockInfo.availableStock > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stockInfo.availableStock}
                      </span>
                      {stockInfo.availableStock === 0 && (
                        <span className="text-xs text-red-600 font-medium">⚠️</span>
                      )}
                    </div>
                  </div>
                ) : isLoadingStock ? (
                  <div className="flex items-center gap-2 text-xs text-gray-600 pt-2 border-t border-gray-200">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Cargando stock...</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Right Column - Zones */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {Object.entries(zonesByType).map(([type, zones]) => {
                const colors = typeColors[type] || typeColors['Otro'];
                // Get the slug of this type from the first zone
                const typeSlug = zones[0]?.zoneTypeSlug;
                const isViewing = typeSlug === currentViewZoneType;

                return (
                  <div key={type}>
                    {/* Type Header - Clickeable para cambiar vista */}
                    <button
                      onClick={() => setViewingZoneTypeSlug(typeSlug)}
                      className={`w-full ${colors.bg} ${colors.border} border-l-4 rounded-r-lg px-4 py-2 mb-3 flex items-center justify-between transition-all cursor-pointer ${
                        isViewing
                          ? `${colors.selectedBg} ring-2 ring-inset ${colors.selectedBorder} shadow-md`
                          : `hover:${colors.selectedBg} hover:shadow-sm`
                      }`}
                      title={isViewing ? `Viendo ${type}` : `Click para ver ${type}`}
                    >
                      <h3 className={`font-semibold ${colors.text} flex items-center gap-2`}>
                        <Eye className={`w-5 h-5 ${isViewing ? 'fill-current' : ''}`} />
                        {type}
                      </h3>
                      {isViewing && (
                        <span className={`text-xs px-2 py-1 rounded-full ${colors.selectedBg} ${colors.text} font-medium`}>
                          Visible
                        </span>
                      )}
                    </button>

                    {/* Zones Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {zones.map(zone => {
                        const selectedIdForType = selectedZonesByType.get(zone.zoneTypeSlug);
                        const isSelected = selectedIdForType === zone.id;
                        const isDisabled = zone.isRequired;

                        return (
                          <button
                            key={zone.id}
                            onClick={() => toggleZone(zone.id)}
                            disabled={isDisabled}
                            className={`
                              relative border-2 rounded-lg p-4 transition-all text-left
                              ${isSelected
                                ? `${colors.selectedBg} ${colors.selectedBorder} shadow-md`
                                : `bg-white ${colors.border} hover:shadow-sm`}
                              ${isDisabled ? 'opacity-70' : 'cursor-pointer hover:scale-105'}
                            `}
                          >
                            {/* Checkmark */}
                            <div className="absolute top-2 right-2">
                              {isSelected ? (
                                <CheckCircle className={`w-5 h-5 ${colors.text}`} />
                              ) : (
                                <div className={`w-5 h-5 border-2 ${colors.border} rounded-full`} />
                              )}
                            </div>

                            {/* Zone Name */}
                            <h4 className="font-medium text-gray-900 pr-6 mb-2">{zone.name}</h4>

                            {/* Price */}
                            <p className={`text-lg font-bold ${colors.text}`}>
                              +${Number(zone.price).toLocaleString()}
                            </p>

                            {/* Required Badge */}
                            {zone.isRequired && (
                              <div className="mt-2">
                                <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded">
                                  Requerida
                                </span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Blocked Zones Warning */}
              {template.zones.filter(z => z.isBlocked).length > 0 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="text-sm font-medium text-red-900 mb-2">⚠️ Zonas No Disponibles</h4>
                  <div className="space-y-1">
                    {template.zones.filter(z => z.isBlocked).map(zone => (
                      <div key={zone.id} className="text-xs text-red-600">
                        • {zone.name} ({zone.zoneType})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Summary and Actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between gap-6">
            {/* Summary */}
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-sm text-gray-600">Total con</span>
                <span className="text-sm font-semibold text-gray-900">
                  {selectedZones.length} zona{selectedZones.length !== 1 ? 's' : ''} seleccionada{selectedZones.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-green-600">
                  ${totalPrice.toLocaleString()}
                </span>
                {selectedZones.length > 0 && (
                  <span className="text-sm text-gray-500">
                    (Base ${Number(template.basePrice).toLocaleString()} + Zonas ${(totalPrice - Number(template.basePrice)).toLocaleString()})
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Agregar al Carrito
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
