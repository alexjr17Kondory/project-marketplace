import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Loader2, Package, Eye, EyeOff, Download } from 'lucide-react';
import { canvasService } from '../services/canvas.service';
import { templatesService, type Template } from '../services/templates.service';
import { templateZonesService, type TemplateZone } from '../services/template-zones.service';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { ColorPicker } from '../components/customizer/ColorPicker';
import { ImageUploader, type ImageUploadData } from '../components/customizer/ImageUploader';
import { DesignControls } from '../components/customizer/DesignControls';
import { SizeGuideModal } from '../components/customizer/SizeGuideModal';
import { applyColorToImage } from '../utils/imageColorizer';
import { exportDesignsToZip } from '../utils/designExporter';
import type { ProductType, PrintZone } from '../types/product';
import type { Design, CustomizedProduct } from '../types/design';

export const CustomizerPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { addCustomizedProduct, updateCustomizedProduct, getCartItemById } = useCart();
  const { settings } = useSettings();

  // Estado para modo edición
  const [editingCartItemId, setEditingCartItemId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Colores de marca dinámicos
  const brandColors = settings.appearance?.brandColors || settings.general.brandColors || {
    primary: '#7c3aed',
    secondary: '#ec4899',
    accent: '#f59e0b',
  };
  const gradientStyle = `linear-gradient(to right, ${brandColors.primary}, ${brandColors.secondary}, ${brandColors.accent})`;

  // State principal
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateZones, setTemplateZones] = useState<TemplateZone[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('#FFFFFF');
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [currentZoneType, setCurrentZoneType] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<PrintZone | null>(null);
  const [designs, setDesigns] = useState<Map<PrintZone, Design>>(new Map());
  const [isUploading, setIsUploading] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ naturalWidth: 0, naturalHeight: 0 });
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [showZoneBorders, setShowZoneBorders] = useState(true);
  const [colorizedTemplateImage, setColorizedTemplateImage] = useState<string | null>(null);
  const [isColorizingTemplate, setIsColorizingTemplate] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Ref para la imagen del template
  const templateImageRef = useRef<HTMLImageElement>(null);

  // Constantes del canvas
  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 600;

  // Calcular el área real de la imagen visible considerando object-contain
  const getImageContentArea = useCallback(() => {
    const { naturalWidth, naturalHeight } = imageDimensions;
    const { width: containerWidth, height: containerHeight } = containerDimensions;

    console.log('[getImageContentArea] Dimensiones:', {
      containerWidth,
      containerHeight,
      naturalWidth,
      naturalHeight,
    });

    if (!naturalWidth || !naturalHeight) {
      console.log('[getImageContentArea] No hay dimensiones naturales');
      return null;
    }

    if (!containerWidth || !containerHeight) {
      console.log('[getImageContentArea] No hay dimensiones del contenedor');
      return null;
    }

    // Calcular el aspect ratio de la imagen y del contenedor
    const imageRatio = naturalWidth / naturalHeight;
    const containerRatio = containerWidth / containerHeight;

    let renderedWidth: number;
    let renderedHeight: number;
    let offsetX: number;
    let offsetY: number;

    if (imageRatio > containerRatio) {
      // La imagen es más ancha que el contenedor (barras arriba y abajo)
      renderedWidth = containerWidth;
      renderedHeight = containerWidth / imageRatio;
      offsetX = 0;
      offsetY = (containerHeight - renderedHeight) / 2;
    } else {
      // La imagen es más alta que el contenedor (barras a los lados)
      renderedHeight = containerHeight;
      renderedWidth = containerHeight * imageRatio;
      offsetX = (containerWidth - renderedWidth) / 2;
      offsetY = 0;
    }

    console.log('[getImageContentArea] Resultado:', {
      renderedWidth,
      renderedHeight,
      offsetX,
      offsetY,
    });

    return {
      renderedWidth,
      renderedHeight,
      offsetX,
      offsetY,
      containerWidth,
      containerHeight,
    };
  }, [imageDimensions, containerDimensions]);

  // Calcular dimensiones del recuadro en píxeles basándose en el área real de la imagen
  const getZoneDisplayDimensions = useCallback((zone: {
    positionXPercent: number;
    positionYPercent: number;
    widthPercent: number;
    heightPercent: number;
  }) => {
    const contentArea = getImageContentArea();

    if (!contentArea) {
      return {
        left: `${zone.positionXPercent}%`,
        top: `${zone.positionYPercent}%`,
        width: `${zone.widthPercent}%`,
        height: `${zone.heightPercent}%`,
      };
    }

    const { renderedWidth, renderedHeight, offsetX, offsetY } = contentArea;

    // Calcular posición y tamaño en píxeles basados en el área real de la imagen
    const leftPx = offsetX + (zone.positionXPercent / 100) * renderedWidth;
    const topPx = offsetY + (zone.positionYPercent / 100) * renderedHeight;
    const widthPx = (zone.widthPercent / 100) * renderedWidth;
    const heightPx = (zone.heightPercent / 100) * renderedHeight;

    return {
      left: `${leftPx}px`,
      top: `${topPx}px`,
      width: `${widthPx}px`,
      height: `${heightPx}px`,
    };
  }, [getImageContentArea]);

  // Manejar carga de imagen del template
  const handleTemplateImageLoad = useCallback(() => {
    if (templateImageRef.current) {
      const img = templateImageRef.current;
      const { naturalWidth, naturalHeight, clientWidth, clientHeight } = img;
      console.log('[handleTemplateImageLoad] Imagen cargada:', {
        naturalWidth,
        naturalHeight,
        clientWidth,
        clientHeight,
        complete: img.complete,
      });
      if (naturalWidth > 0 && naturalHeight > 0) {
        setImageDimensions({ naturalWidth, naturalHeight });

        // Forzar un re-cálculo de dimensiones del contenedor después del siguiente paint
        // Necesitamos esperar a que el browser renderice la imagen para obtener clientWidth/Height correctos
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (templateImageRef.current) {
              const { clientWidth: cw, clientHeight: ch } = templateImageRef.current;
              console.log('[handleTemplateImageLoad RAF2] Dimensiones del contenedor:', { cw, ch });
              setContainerDimensions({ width: cw, height: ch });
              setImageLoaded(true);
            }
          });
        });
      }
    }
  }, []);

  // Cargar todos los templates al inicio
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoadingTemplates(true);
        // Usar endpoint público que no requiere autenticación
        const activeTemplates = await templatesService.getPublicTemplates();
        setTemplates(activeTemplates);

        // Si viene un template en la URL, seleccionarlo
        const templateId = searchParams.get('template');
        if (templateId) {
          const template = activeTemplates.find(t => t.id === parseInt(templateId));
          if (template) {
            handleTemplateSelect(template);
          }
        }
      } catch (error) {
        console.error('Error cargando templates:', error);
      } finally {
        setLoadingTemplates(false);
      }
    };
    loadTemplates();
  }, []);

  // Cargar producto del carrito para editar
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && templates.length > 0) {
      const cartItem = getCartItemById(editId);
      if (cartItem && cartItem.type === 'customized') {
        const { customizedProduct } = cartItem;

        setIsEditMode(true);
        setEditingCartItemId(editId);
        setSelectedColor(customizedProduct.selectedColor);
        setSelectedSize(customizedProduct.selectedSize);

        // Cargar diseños existentes
        const designsMap = new Map<PrintZone, Design>();
        customizedProduct.designs.forEach(design => {
          designsMap.set(design.zoneId, design);
        });
        setDesigns(designsMap);

        // Cargar template
        if (customizedProduct.templateId) {
          const template = templates.find(t => t.id === customizedProduct.templateId);
          if (template) {
            handleTemplateSelect(template);
          } else {
            // Cargar desde API si no está en la lista
            templatesService.getTemplateById(customizedProduct.templateId)
              .then(t => handleTemplateSelect(t))
              .catch(console.error);
          }
        }
      }
    }
  }, [searchParams, templates, getCartItemById]);

  // Cargar zonas del template
  useEffect(() => {
    const loadTemplateZones = async () => {
      if (selectedTemplate) {
        try {
          console.log('[CustomizerPage] Cargando zonas para template:', selectedTemplate.id);
          const zones = await templateZonesService.getByTemplateId(selectedTemplate.id);
          console.log('[CustomizerPage] Zonas recibidas:', zones);
          const validZones = Array.isArray(zones) ? zones : [];
          const activeZones = validZones.filter(z => z.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
          console.log('[CustomizerPage] Zonas activas:', activeZones);
          setTemplateZones(activeZones);

          // Obtener tipos de zona únicos y establecer el primero
          const zoneTypes = [...new Set(activeZones.map(z => z.zoneType?.slug).filter(Boolean))] as string[];
          console.log('[CustomizerPage] Tipos de zona encontrados:', zoneTypes);
          if (zoneTypes.length > 0) {
            // Siempre establecer el primer tipo de zona del nuevo template
            setCurrentZoneType(zoneTypes[0]);
            console.log('[CustomizerPage] Tipo de zona establecido:', zoneTypes[0]);

            // Seleccionar primera zona de ese tipo
            const firstZoneOfType = activeZones.find(z => z.zoneType?.slug === zoneTypes[0]);
            if (firstZoneOfType) {
              setSelectedZone(`zone-${firstZoneOfType.id}` as PrintZone);
              console.log('[CustomizerPage] Zona seleccionada:', firstZoneOfType.id);
            }
          }
        } catch (error) {
          console.error('Error al cargar zonas:', error);
          setTemplateZones([]);
        }
      } else {
        setTemplateZones([]);
        setCurrentZoneType(null);
        setSelectedZone(null);
      }
    };
    loadTemplateZones();
  }, [selectedTemplate]);

  // Obtener tipos de zona únicos del template (usando Map para deduplicar por slug)
  const availableZoneTypes = Array.from(
    new Map(
      templateZones
        .filter(z => z.zoneType?.slug)
        .map(z => [z.zoneType!.slug, { slug: z.zoneType!.slug, name: z.zoneType!.name }])
    ).values()
  );

  // Zonas filtradas por tipo de zona actual
  const zonesForCurrentType = templateZones.filter(
    z => z.zoneType?.slug === currentZoneType
  );

  // Convertir zonas a formato del canvas
  // positionX/Y son la esquina superior izquierda en porcentaje
  const availableZones = zonesForCurrentType.map(zone => ({
    id: `zone-${zone.id}` as PrintZone,
    name: zone.name,
    // Guardar porcentajes originales para el renderizado
    positionXPercent: zone.positionX,
    positionYPercent: zone.positionY,
    widthPercent: zone.maxWidth,
    heightPercent: zone.maxHeight,
    // También calcular en píxeles para otros usos
    position: {
      x: Math.round((zone.positionX / 100) * CANVAS_WIDTH),
      y: Math.round((zone.positionY / 100) * CANVAS_HEIGHT),
    },
    maxWidth: Math.round((zone.maxWidth / 100) * CANVAS_WIDTH),
    maxHeight: Math.round((zone.maxHeight / 100) * CANVAS_HEIGHT),
    isRequired: zone.isRequired,
    zoneType: zone.zoneType?.slug || 'unknown',
  }));

  // Debug: mostrar zonas disponibles (se ejecuta en cada render)
  useEffect(() => {
    console.log('[CustomizerPage RENDER] Estado actual:', {
      currentZoneType,
      zonesForCurrentType: zonesForCurrentType.length,
      availableZones: availableZones.length,
      imageLoaded,
      imageDimensions,
      templateZonesCount: templateZones.length,
    });
    if (availableZones.length > 0) {
      console.log('[CustomizerPage RENDER] Primera zona:', availableZones[0]);
    }
  }, [currentZoneType, zonesForCurrentType, availableZones, imageLoaded, imageDimensions, templateZones]);

  // Colores del template o fallback (deduplicados por hexCode)
  const availableColors = selectedTemplate?.colors?.length
    ? [...new Set(selectedTemplate.colors.map(c => c.hexCode))]
    : ['#FFFFFF', '#000000', '#EF4444', '#3B82F6', '#10B981'];

  // Tallas del template o fallback
  const availableSizes = selectedTemplate?.sizes?.length
    ? selectedTemplate.sizes.map(s => s.abbreviation)
    : ['S', 'M', 'L', 'XL'];

  // Inicializar canvas
  useEffect(() => {
    if (canvasRef.current) {
      canvasService.init(canvasRef.current);
      canvasService.resize(CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  }, []);

  // Re-renderizar canvas cuando cambian los diseños
  useEffect(() => {
    renderCanvas();
  }, [designs, selectedZone]);

  // Obtener la imagen actual para el tipo de zona seleccionado
  // IMPORTANTE: Las zonas se definen sobre zoneTypeImages, no sobre images.front/back
  const getCurrentTemplateImage = useCallback((): string | undefined => {
    if (!selectedTemplate) return undefined;

    let imageUrl: string | undefined;

    // PRIORIDAD 1: Usar zoneTypeImages que es donde se definen las zonas en el admin
    if (selectedTemplate.zoneTypeImages && currentZoneType) {
      imageUrl = selectedTemplate.zoneTypeImages[currentZoneType];
      console.log('[getCurrentTemplateImage] Usando zoneTypeImages para:', currentZoneType, imageUrl ? 'encontrada' : 'no encontrada');
    }

    // PRIORIDAD 2: Fallback a images.front/back si no hay zoneTypeImages
    if (!imageUrl && selectedTemplate.images) {
      if (currentZoneType === 'back') {
        imageUrl = selectedTemplate.images.back || selectedTemplate.images.front;
      } else {
        imageUrl = selectedTemplate.images.front;
      }
      console.log('[getCurrentTemplateImage] Fallback a images para:', currentZoneType);
    }

    return imageUrl;
  }, [selectedTemplate, currentZoneType]);

  // Resetear imageLoaded cuando cambia el template o el tipo de zona
  // y verificar si la imagen ya está cacheada después de un tick
  useEffect(() => {
    console.log('[useEffect reset] Cambiando template/zoneType:', selectedTemplate?.id, currentZoneType);
    setImageLoaded(false);
    setImageDimensions({ naturalWidth: 0, naturalHeight: 0 });
    setContainerDimensions({ width: 0, height: 0 });

    // Usar un pequeño timeout para verificar imágenes cacheadas después del reset
    // Esto es especialmente importante para imágenes base64 que cargan inmediatamente
    const timeoutId = setTimeout(() => {
      if (templateImageRef.current) {
        const img = templateImageRef.current;
        console.log('[useEffect reset timeout] Verificando imagen:', {
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
        });
        if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
          console.log('[useEffect reset] Imagen cacheada/base64 detectada, cargando dimensiones');
          handleTemplateImageLoad();
        }
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [selectedTemplate?.id, currentZoneType, handleTemplateImageLoad]);

  // Aplicar color a la imagen del template cuando cambia el color seleccionado
  useEffect(() => {
    const colorizeTemplate = async () => {
      const originalImage = getCurrentTemplateImage();
      if (!originalImage) {
        setColorizedTemplateImage(null);
        return;
      }

      // Si el color es blanco o no hay color, usar imagen original
      if (!selectedColor || selectedColor.toUpperCase() === '#FFFFFF' || selectedColor.toUpperCase() === '#FFF') {
        setColorizedTemplateImage(null);
        return;
      }

      setIsColorizingTemplate(true);
      try {
        const colorized = await applyColorToImage(originalImage, selectedColor);
        setColorizedTemplateImage(colorized);
      } catch (error) {
        console.error('Error al colorizar template:', error);
        setColorizedTemplateImage(null);
      } finally {
        setIsColorizingTemplate(false);
      }
    };

    colorizeTemplate();
  }, [selectedColor, getCurrentTemplateImage]);

  const renderCanvas = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // El canvas ahora solo se usa para exportar la vista previa final
    // La visualización principal es con la imagen + overlays HTML
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setDesigns(new Map());
    // Resetear el tipo de zona para que se cargue el nuevo del template
    setCurrentZoneType(null);
    setSelectedZone(null);
    setImageLoaded(false);

    // Establecer color y talla por defecto del template
    if (template.colors?.length) {
      setSelectedColor(template.colors[0].hexCode);
    }
    if (template.sizes?.length) {
      setSelectedSize(template.sizes[0].abbreviation);
    }
  };

  const handleImageUpload = (imageData: string, uploadData?: ImageUploadData) => {
    if (!selectedZone) return;

    setIsUploading(true);
    const zoneConfig = availableZones.find(z => z.id === selectedZone);

    // Tamaño inicial: 80% del tamaño de la zona para que quepa con margen
    const initialWidth = Math.round((zoneConfig?.maxWidth || 200) * 0.8);
    const initialHeight = Math.round((zoneConfig?.maxHeight || 200) * 0.8);

    const newDesign: Design = {
      id: `design-${selectedZone}-${Date.now()}`,
      zoneId: selectedZone,
      imageUrl: '',
      imageData: imageData,
      originalImageData: uploadData?.original,
      originalFileName: uploadData?.fileName,
      originalFileSize: uploadData?.fileSize,
      // Posición como porcentaje dentro de la zona (0-100)
      // 50 = centrado
      position: {
        x: 50,
        y: 50,
      },
      size: {
        width: initialWidth,
        height: initialHeight,
      },
      rotation: 0,
      opacity: 1,
    };

    setDesigns(prev => new Map(prev).set(selectedZone, newDesign));
    setIsUploading(false);
  };

  const handleDesignUpdate = (updates: Partial<Design>) => {
    if (!selectedZone) return;
    const currentDesign = designs.get(selectedZone);
    if (!currentDesign) return;

    const updatedDesign = { ...currentDesign, ...updates };
    setDesigns(prev => new Map(prev).set(selectedZone, updatedDesign));
  };

  const handleDesignDelete = () => {
    if (!selectedZone) return;
    setDesigns(prev => {
      const newMap = new Map(prev);
      newMap.delete(selectedZone);
      return newMap;
    });
  };

  // Generar imagen de preview usando el canvas oculto
  const generatePreviewImage = async (): Promise<string | null> => {
    if (!canvasRef.current || !selectedTemplate) return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Obtener imagen del template
    const imageUrl = getCurrentTemplateImage();
    if (!imageUrl) return null;

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Dibujar imagen del template
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Dibujar los diseños en sus zonas correspondientes
        const drawDesigns = async () => {
          for (const zone of availableZones) {
            const design = designs.get(zone.id);
            if (design?.imageData) {
              const designImg = new Image();
              designImg.crossOrigin = 'anonymous';
              await new Promise<void>((res) => {
                designImg.onload = () => {
                  // Calcular posición en el canvas usando porcentajes
                  const x = (zone.positionXPercent / 100) * canvas.width;
                  const y = (zone.positionYPercent / 100) * canvas.height;
                  const w = (zone.widthPercent / 100) * canvas.width;
                  const h = (zone.heightPercent / 100) * canvas.height;

                  ctx.save();
                  ctx.globalAlpha = design.opacity || 1;

                  // Aplicar rotación si existe
                  if (design.rotation) {
                    ctx.translate(x + w / 2, y + h / 2);
                    ctx.rotate((design.rotation * Math.PI) / 180);
                    ctx.translate(-(x + w / 2), -(y + h / 2));
                  }

                  // Mantener proporciones del diseño
                  const aspectRatio = designImg.width / designImg.height;
                  let drawW = w;
                  let drawH = h;
                  if (aspectRatio > w / h) {
                    drawH = w / aspectRatio;
                  } else {
                    drawW = h * aspectRatio;
                  }
                  const drawX = x + (w - drawW) / 2;
                  const drawY = y + (h - drawH) / 2;

                  ctx.drawImage(designImg, drawX, drawY, drawW, drawH);
                  ctx.restore();
                  res();
                };
                designImg.onerror = () => res();
                designImg.src = design.imageData;
              });
            }
          }

          // Exportar como imagen
          const dataUrl = canvas.toDataURL('image/png', 0.95);
          resolve(dataUrl);
        };

        drawDesigns();
      };
      img.onerror = () => resolve(null);
      img.src = imageUrl;
    });
  };

  const handleAddToCart = async () => {
    if (!selectedTemplate || designs.size === 0) {
      alert('Por favor selecciona un modelo y sube al menos una imagen');
      return;
    }

    const previewImage = await generatePreviewImage();
    if (!previewImage) {
      alert('Error al generar vista previa');
      return;
    }

    const allDesigns = Array.from(designs.values());
    const basePrice = selectedTemplate.basePrice;
    const pricePerZone = 2000;
    const customizationPrice = designs.size * pricePerZone;
    const totalPrice = basePrice + customizationPrice;

    const selectedColorData = selectedTemplate.colors?.find(c => c.hexCode === selectedColor);
    const savedZones = templateZones.map(zone => ({
      zoneId: `zone-${zone.id}`,
      zoneName: zone.name,
      zoneTypeSlug: zone.zoneType?.slug || 'unknown',
      positionX: zone.positionX,
      positionY: zone.positionY,
      maxWidth: zone.maxWidth,
      maxHeight: zone.maxHeight,
    }));

    const frontDesign = allDesigns.find(d =>
      d.zoneId.includes('front') || d.zoneId.includes('chest')
    );
    const backDesign = allDesigns.find(d => d.zoneId.includes('back'));

    const customizedProduct: CustomizedProduct = {
      id: `custom-${Date.now()}`,
      productId: selectedTemplate.id.toString(),
      productType: (selectedTemplate.typeSlug || 'tshirt') as ProductType,
      productName: selectedTemplate.name,
      basePrice: basePrice,
      selectedColor: selectedColor,
      selectedColorName: selectedColorData?.name || selectedColor,
      selectedSize: selectedSize,
      designs: allDesigns,
      previewImages: { front: previewImage },
      productionImages: {
        front: frontDesign?.originalImageData || frontDesign?.imageData,
        back: backDesign?.originalImageData || backDesign?.imageData,
      },
      customizationPrice: customizationPrice,
      totalPrice: totalPrice,
      createdAt: new Date(),
      templateId: selectedTemplate.id,
      templateSlug: selectedTemplate.slug,
      templateImages: selectedTemplate.images,
      zoneTypeImages: selectedTemplate.zoneTypeImages || undefined,
      savedZones: savedZones.length > 0 ? savedZones : undefined,
    };

    if (isEditMode && editingCartItemId) {
      updateCustomizedProduct(editingCartItemId, customizedProduct);
      alert('¡Diseño actualizado exitosamente!');
    } else {
      addCustomizedProduct(customizedProduct, quantity);
      alert(`¡${quantity} producto(s) agregado(s) al carrito!`);
    }

    navigate('/cart');
  };

  // Exportar diseños como ZIP
  const handleExportDesigns = async () => {
    if (designs.size === 0) {
      alert('No hay diseños para exportar');
      return;
    }

    setIsExporting(true);
    try {
      await exportDesignsToZip(designs, {
        templateName: selectedTemplate?.name || 'diseño',
        selectedColor: selectedColor,
        selectedSize: selectedSize,
        includeOriginal: true,
      });
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar los diseños');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="text-white py-6 shadow-lg" style={{ background: gradientStyle }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(isEditMode ? '/cart' : '/catalog')}
              className="hover:bg-white/10 p-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {isEditMode ? 'Editar Diseño' : 'Personalizador'}
              </h1>
              <p className="text-sm text-white/90">
                {isEditMode ? 'Modifica tu diseño' : 'Crea tu diseño único'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Selección de Modelo */}
          <aside className="lg:col-span-3 space-y-6">
            {/* Selector de Modelos */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Selecciona un Modelo</h3>

              {loadingTemplates ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No hay modelos disponibles</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`relative rounded-lg border-2 overflow-hidden transition-all hover:scale-105 ${
                        selectedTemplate?.id === template.id
                          ? 'border-purple-600 ring-2 ring-purple-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {template.images?.front && (
                        <img
                          src={template.images.front}
                          alt={template.name}
                          className="w-full aspect-square object-cover"
                        />
                      )}
                      <div className="p-2 bg-white">
                        <p className="text-xs font-semibold truncate">{template.name}</p>
                        <p className="text-xs text-gray-500">
                          ${template.basePrice.toLocaleString('es-CO')}
                        </p>
                      </div>
                      {selectedTemplate?.id === template.id && (
                        <div className="absolute top-1 right-1 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                          ✓
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Colores - solo si hay template */}
            {selectedTemplate && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <ColorPicker
                  colors={availableColors}
                  selectedColor={selectedColor}
                  onColorChange={setSelectedColor}
                />
              </div>
            )}

            {/* Tallas - solo si hay template */}
            {selectedTemplate && availableSizes.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Talla</h3>
                  <button
                    onClick={() => setShowSizeGuide(true)}
                    className="text-xs text-purple-600 hover:text-purple-700"
                  >
                    Guía de tallas
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                        selectedSize === size
                          ? 'border-purple-600 bg-purple-50 text-purple-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selector de Vista/Tipo de Zona */}
            {selectedTemplate && availableZoneTypes.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Vista</h3>
                <div className="flex flex-wrap gap-2">
                  {availableZoneTypes.map((zt) => (
                    <button
                      key={zt.slug}
                      onClick={() => {
                        setCurrentZoneType(zt.slug);
                        // Seleccionar primera zona de este tipo
                        const firstZone = templateZones.find(z => z.zoneType?.slug === zt.slug);
                        if (firstZone) {
                          setSelectedZone(`zone-${firstZone.id}` as PrintZone);
                        }
                      }}
                      className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                        currentZoneType === zt.slug
                          ? 'border-purple-600 bg-purple-50 text-purple-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {zt.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Zonas de Impresión */}
            {selectedTemplate && availableZones.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Zonas de Impresión</h3>
                <div className="space-y-2">
                  {availableZones.map((zone) => (
                    <button
                      key={zone.id}
                      onClick={() => setSelectedZone(zone.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                        selectedZone === zone.id
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{zone.name}</span>
                        {designs.has(zone.id) && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Con diseño
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        Máx: {zone.maxWidth}x{zone.maxHeight}px
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Center: Canvas */}
          <main className="lg:col-span-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              {selectedTemplate && (
                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    {selectedTemplate.images?.front && (
                      <img
                        src={selectedTemplate.images.front}
                        alt={selectedTemplate.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-purple-900">
                        {selectedTemplate.name}
                      </p>
                      <p className="text-xs text-purple-600">
                        ${selectedTemplate.basePrice.toLocaleString('es-CO')} COP
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Área de visualización con imagen + zonas como overlays */}
              <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-100" style={{ minHeight: '500px' }}>
                {selectedTemplate ? (
                  <>
                    {/* Imagen del template - usa coloreada si existe */}
                    {getCurrentTemplateImage() ? (
                      <img
                        key={`${selectedTemplate.id}-${currentZoneType}-${selectedColor}`}
                        ref={templateImageRef}
                        src={colorizedTemplateImage || getCurrentTemplateImage()}
                        alt={selectedTemplate.name}
                        onLoad={(e) => {
                          const img = e.currentTarget;
                          console.log('[img onLoad] Evento onLoad disparado', {
                            naturalWidth: img.naturalWidth,
                            naturalHeight: img.naturalHeight,
                            complete: img.complete,
                          });
                          handleTemplateImageLoad();
                        }}
                        onError={(e) => {
                          console.error('[img onError] Error loading image:', getCurrentTemplateImage()?.substring(0, 100));
                          // Si falla, marcar como cargada para mostrar mensaje de error
                          setImageLoaded(true);
                        }}
                        className="w-full h-auto max-h-[600px] object-contain transition-opacity duration-200"
                        style={{ opacity: imageLoaded ? 1 : 0 }}
                      />
                    ) : null}

                    {/* Loading mientras carga la imagen o coloriza */}
                    {(!imageLoaded || isColorizingTemplate) && getCurrentTemplateImage() && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                      </div>
                    )}

                    {/* Mensaje si no hay imagen */}
                    {!getCurrentTemplateImage() && (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <p className="text-sm">No hay imagen disponible para esta vista</p>
                      </div>
                    )}

                    {/* Botón para mostrar/ocultar bordes de zonas */}
                    {imageLoaded && availableZones.length > 0 && (
                      <button
                        onClick={() => setShowZoneBorders(!showZoneBorders)}
                        className="absolute top-2 right-2 z-20 bg-white/90 hover:bg-white shadow-md rounded-lg px-3 py-2 flex items-center gap-2 text-sm font-medium text-gray-700 transition-all"
                        title={showZoneBorders ? 'Ocultar zonas' : 'Mostrar zonas'}
                      >
                        {showZoneBorders ? (
                          <>
                            <EyeOff className="w-4 h-4" />
                            <span className="hidden sm:inline">Ocultar zonas</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">Mostrar zonas</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Zonas como overlays HTML - posicionamiento preciso */}
                    {imageLoaded && availableZones.map((zone) => {
                      const isSelected = zone.id === selectedZone;
                      const hasDesign = designs.has(zone.id);
                      const dimensions = getZoneDisplayDimensions(zone);

                      return (
                        <div
                          key={zone.id}
                          onClick={() => setSelectedZone(zone.id)}
                          className={`absolute cursor-pointer transition-all ${
                            showZoneBorders
                              ? isSelected
                                ? 'border-2 border-purple-600 bg-purple-500/20 shadow-lg z-10'
                                : 'border border-dashed border-gray-400/60 hover:border-gray-500 hover:bg-gray-500/10'
                              : ''
                          }`}
                          style={{
                            left: dimensions.left,
                            top: dimensions.top,
                            width: dimensions.width,
                            height: dimensions.height,
                          }}
                        >
                          {/* Etiqueta de la zona - solo visible si showZoneBorders */}
                          {showZoneBorders && (
                            <div
                              className={`absolute -top-6 left-0 px-2 py-0.5 text-xs font-medium rounded-t whitespace-nowrap ${
                                isSelected
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-500 text-white'
                              }`}
                            >
                              {zone.name}
                              {hasDesign && (
                                <span className="ml-1 text-green-300">✓</span>
                              )}
                            </div>
                          )}

                          {/* Mostrar diseño si existe */}
                          {hasDesign && (() => {
                            const design = designs.get(zone.id)!;
                            const zoneWidth = zone.maxWidth; // px en escala canvas
                            const zoneHeight = zone.maxHeight; // px en escala canvas

                            // Tamaño como porcentaje de la zona
                            const widthPercent = (design.size.width / zoneWidth) * 100;
                            const heightPercent = (design.size.height / zoneHeight) * 100;

                            // position.x/y ahora son porcentajes (0-100) donde 50 = centrado
                            // Calcular la posición CSS para centrar el diseño en el punto indicado
                            // left = posición% - (ancho%/2)
                            const leftPercent = design.position.x - (widthPercent / 2);
                            const topPercent = design.position.y - (heightPercent / 2);

                            // Usar imagen coloreada si existe, sino la original
                            const displayImage = design.colorizedImageData || design.imageData;

                            return (
                              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                <img
                                  src={displayImage}
                                  alt="Diseño"
                                  className="absolute"
                                  style={{
                                    left: `${leftPercent}%`,
                                    top: `${topPercent}%`,
                                    width: `${widthPercent}%`,
                                    height: `${heightPercent}%`,
                                    opacity: design.opacity || 1,
                                    transform: `rotate(${design.rotation || 0}deg)`,
                                    transformOrigin: 'center center',
                                    objectFit: 'contain',
                                  }}
                                />
                              </div>
                            );
                          })()}

                          {/* Indicador de zona seleccionada vacía - solo visible si showZoneBorders */}
                          {showZoneBorders && isSelected && !hasDesign && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-purple-600">
                              <Package className="w-8 h-8 mb-1 opacity-50" />
                              <span className="text-xs font-medium opacity-70">
                                Sube una imagen
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                ) : (
                  // Sin template seleccionado
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                    <Package className="w-16 h-16 mb-4" />
                    <p className="text-lg font-medium">Selecciona un modelo</p>
                    <p className="text-sm">para comenzar a personalizar</p>
                  </div>
                )}

                {/* Canvas oculto para exportar imagen final */}
                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  className="hidden"
                />
              </div>

              {/* Botones de acción */}
              <div className="mt-6">
                {designs.size > 0 && (
                  <p className="text-sm text-gray-600 mb-3">
                    {designs.size} zona{designs.size > 1 ? 's' : ''} con diseño
                  </p>
                )}

                <div className="flex items-center gap-3">
                  {!isEditMode && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">Cantidad:</label>
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
                          className="w-14 text-center py-2 border-x border-gray-300"
                        />
                        <button
                          onClick={() => setQuantity(Math.min(99, quantity + 1))}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Botón de descarga ZIP */}
                  <button
                    onClick={handleExportDesigns}
                    disabled={designs.size === 0 || isExporting}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    title="Descargar diseños como ZIP"
                  >
                    {isExporting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                    <span className="hidden sm:inline">
                      {isExporting ? 'Exportando...' : 'Descargar'}
                    </span>
                  </button>

                  <button
                    onClick={handleAddToCart}
                    disabled={!selectedTemplate || designs.size === 0}
                    className={`flex-1 font-bold py-2.5 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                      isEditMode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-800 hover:bg-gray-700 text-white'
                    }`}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {isEditMode ? 'Guardar Cambios' : 'Agregar al Carrito'}
                  </button>
                </div>
              </div>
            </div>
          </main>

          {/* Right: Controles de Diseño */}
          <aside className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Subir Imagen</h3>
              {selectedTemplate && selectedZone ? (
                <ImageUploader onImageUpload={handleImageUpload} isUploading={isUploading} />
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Selecciona un modelo y una zona para subir tu imagen
                </p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Controles de Diseño</h3>
              <DesignControls
                design={selectedZone ? designs.get(selectedZone) || null : null}
                onUpdate={handleDesignUpdate}
                onDelete={handleDesignDelete}
                zoneConfig={selectedZone ? availableZones.find(z => z.id === selectedZone) || null : null}
              />
            </div>
          </aside>
        </div>
      </div>

      {/* Modal guía de tallas */}
      <SizeGuideModal
        isOpen={showSizeGuide}
        onClose={() => setShowSizeGuide(false)}
        sizeChart={null}
      />
    </div>
  );
};
