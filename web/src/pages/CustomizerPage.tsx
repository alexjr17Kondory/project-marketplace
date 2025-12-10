import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Loader2, Package, Eye, EyeOff, Download, Move } from 'lucide-react';
import { canvasService } from '../services/canvas.service';
import { templatesService, type Template, type DesignZone } from '../services/templates.service';
import { templateZonesService, type TemplateZone } from '../services/template-zones.service';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { ColorPicker } from '../components/customizer/ColorPicker';
import { ImageUploader, type ImageUploadData } from '../components/customizer/ImageUploader';
import { DesignControls } from '../components/customizer/DesignControls';
import { SizeGuideModal } from '../components/customizer/SizeGuideModal';
import { applyColorToImage } from '../utils/imageColorizer';
import { exportDesignsToZip } from '../utils/designExporter';
import { detectPngBounds, clampPositionToBounds, type PngBounds } from '../utils/pngBoundsDetector';
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
  // Diseños por vista (front, back, etc.) - uno por vista, posicionamiento libre
  const [designs, setDesigns] = useState<Map<string, Design>>(new Map());
  const [isUploading, setIsUploading] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ naturalWidth: 0, naturalHeight: 0 });
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [showZoneGuides, setShowZoneGuides] = useState(true); // Zonas como guías visuales
  const [colorizedTemplateImage, setColorizedTemplateImage] = useState<string | null>(null);
  const [isColorizingTemplate, setIsColorizingTemplate] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Límites del contenido visible del PNG (para restringir el diseño)
  const [pngBounds, setPngBounds] = useState<PngBounds | null>(null);
  // Zona seleccionada para ajustar el tamaño del diseño
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  // Zonas de diseño (habilitadas y bloqueadas) del template actual
  const [allowedZones, setAllowedZones] = useState<DesignZone[]>([]);
  const [blockedZones, setBlockedZones] = useState<DesignZone[]>([]);

  // Estado para drag & drop del diseño
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [designStartPos, setDesignStartPos] = useState({ x: 0, y: 0 });

  // Ref para la imagen del template y el contenedor
  const templateImageRef = useRef<HTMLImageElement>(null);
  const designContainerRef = useRef<HTMLDivElement>(null);

  // Constantes del canvas
  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 600;

  // Función auxiliar para verificar si un punto está dentro de un polígono (triángulo)
  const isPointInPolygon = useCallback((
    point: { x: number; y: number },
    polygonPoints: Array<{ x: number; y: number }>,
    zoneX: number,
    zoneY: number,
    zoneWidth: number,
    zoneHeight: number
  ): boolean => {
    // Convertir puntos relativos (0-100%) a coordenadas absolutas
    const absolutePoints = polygonPoints.map(p => ({
      x: zoneX + (p.x / 100) * zoneWidth,
      y: zoneY + (p.y / 100) * zoneHeight
    }));

    let inside = false;
    for (let i = 0, j = absolutePoints.length - 1; i < absolutePoints.length; j = i++) {
      const xi = absolutePoints[i].x, yi = absolutePoints[i].y;
      const xj = absolutePoints[j].x, yj = absolutePoints[j].y;

      if (((yi > point.y) !== (yj > point.y)) &&
          (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }, []);

  // Función para verificar si el diseño colisiona con una zona
  const checkZoneCollision = useCallback((
    position: { x: number; y: number },
    size: { width: number; height: number },
    zone: DesignZone
  ): boolean => {
    // Calcular los bordes del diseño (posición es el centro)
    const designLeft = position.x - size.width / 2;
    const designRight = position.x + size.width / 2;
    const designTop = position.y - size.height / 2;
    const designBottom = position.y + size.height / 2;

    if (zone.shape === 'circle' && zone.radius) {
      // Para círculos, verificar si el rectángulo del diseño intersecta con el círculo
      const centerX = zone.x + zone.radius;
      const centerY = zone.y + zone.radius;
      // Encontrar el punto más cercano del rectángulo al centro del círculo
      const closestX = Math.max(designLeft, Math.min(centerX, designRight));
      const closestY = Math.max(designTop, Math.min(centerY, designBottom));
      const distance = Math.sqrt(Math.pow(closestX - centerX, 2) + Math.pow(closestY - centerY, 2));
      return distance <= zone.radius;
    }

    if (zone.shape === 'polygon' && zone.points && zone.points.length >= 3) {
      // Para polígonos (triángulos), verificar si alguna esquina del diseño está dentro
      const zoneWidth = zone.width || 30;
      const zoneHeight = zone.height || 30;

      // Verificar las 4 esquinas del diseño
      const corners = [
        { x: designLeft, y: designTop },
        { x: designRight, y: designTop },
        { x: designRight, y: designBottom },
        { x: designLeft, y: designBottom },
        { x: position.x, y: position.y } // También el centro
      ];

      for (const corner of corners) {
        if (isPointInPolygon(corner, zone.points, zone.x, zone.y, zoneWidth, zoneHeight)) {
          return true;
        }
      }

      // Verificar si el centro del triángulo está dentro del diseño
      const triangleCenter = {
        x: zone.x + zoneWidth / 2,
        y: zone.y + zoneHeight * 0.67 // El centroide del triángulo está a 2/3 de la altura
      };

      if (triangleCenter.x >= designLeft && triangleCenter.x <= designRight &&
          triangleCenter.y >= designTop && triangleCenter.y <= designBottom) {
        return true;
      }

      return false;
    }

    // Rectángulo: verificar intersección
    const zoneLeft = zone.x;
    const zoneRight = zone.x + (zone.width || 0);
    const zoneTop = zone.y;
    const zoneBottom = zone.y + (zone.height || 0);

    return !(
      designRight < zoneLeft ||
      designLeft > zoneRight ||
      designBottom < zoneTop ||
      designTop > zoneBottom
    );
  }, [isPointInPolygon]);

  // Función para verificar si la posición del diseño es válida
  // Retorna true si el diseño está en una posición válida
  const isDesignPositionValid = useCallback((
    position: { x: number; y: number },
    size: { width: number; height: number }
  ): boolean => {
    // Verificar colisión con zonas bloqueadas - si colisiona, posición inválida
    for (const zone of blockedZones) {
      if (checkZoneCollision(position, size, zone)) {
        return false;
      }
    }

    // Si hay zonas habilitadas, el diseño debe estar dentro de al menos una
    if (allowedZones.length > 0) {
      let isInAnyAllowedZone = false;
      for (const zone of allowedZones) {
        if (checkZoneCollision(position, size, zone)) {
          isInAnyAllowedZone = true;
          break;
        }
      }
      // Si no está en ninguna zona habilitada, posición inválida
      if (!isInAnyAllowedZone) {
        return false;
      }
    }

    return true;
  }, [allowedZones, blockedZones, checkZoneCollision]);

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

  // Cargar zonas del template (solo como guías visuales)
  useEffect(() => {
    const loadTemplateZones = async () => {
      if (selectedTemplate) {
        try {
          console.log('[CustomizerPage] Cargando zonas para template:', selectedTemplate.id);
          const zones = await templateZonesService.getByTemplateId(selectedTemplate.id);
          console.log('[CustomizerPage] Zonas recibidas:', zones);
          const validZones = Array.isArray(zones) ? zones : [];
          const activeZones = validZones.filter(z => z.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
          console.log('[CustomizerPage] Zonas activas (guías):', activeZones);
          setTemplateZones(activeZones);

          // Obtener tipos de zona únicos y establecer el primero (para cambiar vistas)
          const zoneTypes = [...new Set(activeZones.map(z => z.zoneType?.slug).filter(Boolean))] as string[];
          console.log('[CustomizerPage] Tipos de vista encontrados:', zoneTypes);
          if (zoneTypes.length > 0) {
            setCurrentZoneType(zoneTypes[0]);
            console.log('[CustomizerPage] Vista establecida:', zoneTypes[0]);
          }
        } catch (error) {
          console.error('Error al cargar zonas:', error);
          setTemplateZones([]);
        }
      } else {
        setTemplateZones([]);
        setCurrentZoneType(null);
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

  // Zonas filtradas por tipo de zona actual (excluyendo bloqueadas para las guías)
  const zonesForCurrentType = templateZones.filter(
    z => z.zoneType?.slug === currentZoneType && !z.isBlocked
  );

  // Convertir zonas a formato del canvas (solo zonas NO bloqueadas para las guías)
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
  }, [designs, currentZoneType]);

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

  // Detectar los límites del contenido visible del PNG
  useEffect(() => {
    const detectBounds = async () => {
      const templateImage = getCurrentTemplateImage();
      if (!templateImage || !imageLoaded) {
        setPngBounds(null);
        return;
      }

      try {
        const bounds = await detectPngBounds(templateImage);
        console.log('[detectBounds] Límites detectados:', bounds);
        setPngBounds(bounds);
      } catch (error) {
        console.error('Error al detectar límites del PNG:', error);
        // Fallback: usar toda el área
        setPngBounds({
          left: 0,
          top: 0,
          right: 100,
          bottom: 100,
          width: 100,
          height: 100,
        });
      }
    };

    detectBounds();
  }, [getCurrentTemplateImage, imageLoaded]);

  // Cargar zonas de diseño (habilitadas y bloqueadas) desde la base de datos
  useEffect(() => {
    const loadZonesFromDB = async () => {
      if (!selectedTemplate?.id || !currentZoneType) {
        setAllowedZones([]);
        setBlockedZones([]);
        return;
      }

      try {
        // Cargar zonas desde la tabla template_zones
        const templateZones = await templateZonesService.getByTemplateId(selectedTemplate.id);

        // Filtrar por el tipo de zona actual (front, back, etc.)
        const zonesForCurrentView = templateZones.filter(
          (z) => z.zoneType?.slug === currentZoneType && z.isActive
        );

        console.log('[CustomizerPage] Zonas de BD para', currentZoneType, ':', zonesForCurrentView);

        // Convertir TemplateZone a formato DesignZone para compatibilidad
        const convertToDesignZone = (zone: TemplateZone): DesignZone => ({
          id: zone.zoneId || `zone-${zone.id}`,
          type: zone.isBlocked ? 'blocked' : 'allowed',
          shape: zone.shape || 'rect',
          x: zone.positionX,
          y: zone.positionY,
          width: zone.maxWidth,
          height: zone.maxHeight,
          radius: zone.radius || undefined,
          points: zone.points || undefined,
          name: zone.name,
        });

        // Separar zonas por isBlocked
        const allowed = zonesForCurrentView
          .filter((z) => !z.isBlocked)
          .map(convertToDesignZone);
        const blocked = zonesForCurrentView
          .filter((z) => z.isBlocked)
          .map(convertToDesignZone);

        console.log('[CustomizerPage] Zonas habilitadas:', allowed.length, 'Zonas bloqueadas:', blocked.length);
        setAllowedZones(allowed);
        setBlockedZones(blocked);
      } catch (error) {
        console.error('[CustomizerPage] Error al cargar zonas:', error);
        setAllowedZones([]);
        setBlockedZones([]);
      }
    };

    loadZonesFromDB();
  }, [selectedTemplate?.id, currentZoneType]);

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
    setImageLoaded(false);

    // Establecer color y talla por defecto del template
    if (template.colors?.length) {
      setSelectedColor(template.colors[0].hexCode);
    }
    if (template.sizes?.length) {
      setSelectedSize(template.sizes[0].abbreviation);
    }
  };

  // Diseño actual para la vista seleccionada
  const currentDesign = currentZoneType ? designs.get(currentZoneType) : null;

  const handleImageUpload = (imageData: string, uploadData?: ImageUploadData) => {
    if (!currentZoneType) return;

    setIsUploading(true);

    // Tamaño inicial: 30% del template (se puede ajustar con controles)
    const newDesign: Design = {
      id: `design-${currentZoneType}-${Date.now()}`,
      zoneId: `view-${currentZoneType}` as PrintZone,
      viewType: currentZoneType,
      imageUrl: '',
      imageData: imageData,
      originalImageData: uploadData?.original,
      originalFileName: uploadData?.fileName,
      originalFileSize: uploadData?.fileSize,
      // Posición centrada en el template (50%, 50%)
      position: {
        x: 50,
        y: 50,
      },
      // Tamaño como porcentaje del template
      size: {
        width: 30,  // 30% del ancho del template
        height: 30, // 30% del alto del template
      },
      rotation: 0,
      opacity: 1,
    };

    setDesigns(prev => new Map(prev).set(currentZoneType, newDesign));
    setIsUploading(false);
  };

  // Funciones de Drag & Drop para mover el diseño libremente
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!currentDesign || !designContainerRef.current) return;

    e.preventDefault();
    setIsDragging(true);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setDragStart({ x: clientX, y: clientY });
    setDesignStartPos({ x: currentDesign.position.x, y: currentDesign.position.y });
  };

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !currentDesign || !designContainerRef.current || !currentZoneType) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const container = designContainerRef.current;
    const rect = container.getBoundingClientRect();

    // Calcular el movimiento en píxeles y convertir a porcentaje
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;

    // Convertir delta de píxeles a porcentaje del contenedor
    const deltaXPercent = (deltaX / rect.width) * 100;
    const deltaYPercent = (deltaY / rect.height) * 100;

    // Nueva posición calculada
    let newX = designStartPos.x + deltaXPercent;
    let newY = designStartPos.y + deltaYPercent;

    // Aplicar límites basados en el contorno del PNG si están disponibles
    if (pngBounds) {
      const clampedPos = clampPositionToBounds(
        { x: newX, y: newY },
        { width: currentDesign.size.width, height: currentDesign.size.height },
        pngBounds
      );
      newX = clampedPos.x;
      newY = clampedPos.y;
    } else {
      // Fallback: limitar a los bordes del contenedor (0-100)
      newX = Math.max(0, Math.min(100, newX));
      newY = Math.max(0, Math.min(100, newY));
    }

    // Actualizar diseño - el movimiento es siempre fluido
    // Las zonas bloqueadas se manejan visualmente con máscara SVG
    setDesigns(prev => {
      const updated = new Map(prev);
      const design = updated.get(currentZoneType);
      if (design) {
        updated.set(currentZoneType, {
          ...design,
          position: { x: newX, y: newY }
        });
      }
      return updated;
    });
  }, [isDragging, currentDesign, currentZoneType, dragStart, designStartPos, pngBounds]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Event listeners para drag & drop
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const handleDesignUpdate = (updates: Partial<Design>) => {
    if (!currentZoneType) return;
    const design = designs.get(currentZoneType);
    if (!design) return;

    const updatedDesign = { ...design, ...updates };
    setDesigns(prev => new Map(prev).set(currentZoneType, updatedDesign));
  };

  const handleDesignDelete = () => {
    if (!currentZoneType) return;
    setDesigns(prev => {
      const newMap = new Map(prev);
      newMap.delete(currentZoneType);
      return newMap;
    });
  };

  // Generar imagen de preview usando el canvas oculto
  const generatePreviewImage = async (): Promise<string | null> => {
    if (!canvasRef.current || !selectedTemplate) return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Obtener imagen del template (coloreada si aplica)
    const imageUrl = colorizedTemplateImage || getCurrentTemplateImage();
    if (!imageUrl) return null;

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Dibujar imagen del template
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Dibujar el diseño de la vista actual con posicionamiento libre
        const drawDesign = async () => {
          const design = currentZoneType ? designs.get(currentZoneType) : null;
          if (design?.imageData) {
            const designImg = new Image();
            designImg.crossOrigin = 'anonymous';
            await new Promise<void>((res) => {
              designImg.onload = () => {
                // Calcular tamaño en píxeles del canvas
                const w = (design.size.width / 100) * canvas.width;
                const h = (design.size.height / 100) * canvas.height;

                // Calcular posición (centro del diseño en porcentaje)
                const centerX = (design.position.x / 100) * canvas.width;
                const centerY = (design.position.y / 100) * canvas.height;
                const x = centerX - w / 2;
                const y = centerY - h / 2;

                ctx.save();
                ctx.globalAlpha = design.opacity || 1;

                // Aplicar rotación si existe
                if (design.rotation) {
                  ctx.translate(centerX, centerY);
                  ctx.rotate((design.rotation * Math.PI) / 180);
                  ctx.translate(-centerX, -centerY);
                }

                // Usar imagen coloreada si existe
                const displayImage = design.colorizedImageData || design.imageData;
                const colorizedImg = new Image();
                colorizedImg.crossOrigin = 'anonymous';
                colorizedImg.onload = () => {
                  ctx.drawImage(colorizedImg, x, y, w, h);
                  ctx.restore();
                  res();
                };
                colorizedImg.onerror = () => {
                  ctx.drawImage(designImg, x, y, w, h);
                  ctx.restore();
                  res();
                };
                colorizedImg.src = displayImage;
              };
              designImg.onerror = () => res();
              designImg.src = design.imageData;
            });
          }

          // Exportar como imagen
          const dataUrl = canvas.toDataURL('image/png', 0.95);
          resolve(dataUrl);
        };

        drawDesign();
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
    const pricePerView = 2000; // Precio por cada vista con diseño
    const customizationPrice = designs.size * pricePerView;
    const totalPrice = basePrice + customizationPrice;

    const selectedColorData = selectedTemplate.colors?.find(c => c.hexCode === selectedColor);

    // Guardar zonas como referencia (ya no son obligatorias para posicionar)
    const savedZones = templateZones.map(zone => ({
      zoneId: `zone-${zone.id}`,
      zoneName: zone.name,
      zoneTypeSlug: zone.zoneType?.slug || 'unknown',
      positionX: zone.positionX,
      positionY: zone.positionY,
      maxWidth: zone.maxWidth,
      maxHeight: zone.maxHeight,
    }));

    // Buscar diseños por vista
    const frontDesign = allDesigns.find(d => d.viewType === 'front');
    const backDesign = allDesigns.find(d => d.viewType === 'back');

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

            {/* Selector de Vista (Front/Back) */}
            {selectedTemplate && availableZoneTypes.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Vista</h3>
                <div className="flex flex-wrap gap-2">
                  {availableZoneTypes.map((zt) => (
                    <button
                      key={zt.slug}
                      onClick={() => setCurrentZoneType(zt.slug)}
                      className={`px-4 py-2 rounded-lg border-2 font-medium transition-all relative ${
                        currentZoneType === zt.slug
                          ? 'border-purple-600 bg-purple-50 text-purple-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {zt.name}
                      {designs.has(zt.slug) && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                      )}
                    </button>
                  ))}
                </div>
                {currentDesign && (
                  <p className="text-xs text-green-600 mt-2">
                    ✓ Esta vista tiene un diseño
                  </p>
                )}
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
                        onError={() => {
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

                    {/* Botones para mostrar/ocultar zonas */}
                    <div className="absolute top-2 right-2 z-20 flex flex-col gap-2">
                      {/* Botón para guías de zonas */}
                      {imageLoaded && availableZones.length > 0 && (
                        <button
                          onClick={() => setShowZoneGuides(!showZoneGuides)}
                          className="bg-white/90 hover:bg-white shadow-md rounded-lg px-3 py-2 flex items-center gap-2 text-sm font-medium text-gray-700 transition-all"
                          title={showZoneGuides ? 'Ocultar guías' : 'Mostrar guías'}
                        >
                          {showZoneGuides ? (
                            <>
                              <EyeOff className="w-4 h-4" />
                              <span className="hidden sm:inline">Ocultar guías</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" />
                              <span className="hidden sm:inline">Mostrar guías</span>
                            </>
                          )}
                        </button>
                      )}

                    </div>

                    {/* Contenedor de guías de zonas (sin máscara para que se vean) */}
                    <div className="absolute inset-0" style={{ pointerEvents: 'auto' }}>
                      {/* Zonas como GUÍAS visuales - Seleccionables para ajustar tamaño */}
                      {imageLoaded && showZoneGuides && availableZones.map((zone) => {
                        const dimensions = getZoneDisplayDimensions(zone);
                        const isSelected = selectedZone === zone.id;

                        return (
                          <div
                            key={zone.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Si hay diseño, ajustar su tamaño a la zona seleccionada
                              if (currentDesign && currentZoneType) {
                                // Calcular el centro de la zona
                                const zoneCenterX = zone.positionXPercent + (zone.widthPercent / 2);
                                const zoneCenterY = zone.positionYPercent + (zone.heightPercent / 2);

                                // Aplicar límites del PNG si están disponibles
                                let finalX = zoneCenterX;
                                let finalY = zoneCenterY;
                                if (pngBounds) {
                                  const clampedPos = clampPositionToBounds(
                                    { x: zoneCenterX, y: zoneCenterY },
                                    { width: zone.widthPercent, height: zone.heightPercent },
                                    pngBounds
                                  );
                                  finalX = clampedPos.x;
                                  finalY = clampedPos.y;
                                }

                                setDesigns(prev => {
                                  const updated = new Map(prev);
                                  const design = updated.get(currentZoneType);
                                  if (design) {
                                    updated.set(currentZoneType, {
                                      ...design,
                                      position: { x: finalX, y: finalY },
                                      size: { width: zone.widthPercent, height: zone.heightPercent },
                                    });
                                  }
                                  return updated;
                                });
                              }
                              setSelectedZone(isSelected ? null : zone.id);
                            }}
                            className={`absolute border-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-purple-500 bg-purple-100/20'
                                : 'border-dashed border-blue-400/50 hover:border-blue-500 hover:bg-blue-50/10'
                            }`}
                            style={{
                              left: dimensions.left,
                              top: dimensions.top,
                              width: dimensions.width,
                              height: dimensions.height,
                            }}
                          >
                            {/* Etiqueta de la guía */}
                            <div className={`absolute -top-5 left-0 px-1.5 py-0.5 text-xs font-medium rounded-t whitespace-nowrap ${
                              isSelected ? 'bg-purple-600 text-white' : 'bg-blue-500/70 text-white'
                            }`}>
                              {zone.name} {isSelected && '- Clic para ajustar'}
                            </div>
                          </div>
                        );
                      })}

                      {/* Las zonas habilitadas y bloqueadas NO se muestran, solo aplican máscara */}
                    </div>

                    {/* SVG con definiciones de máscaras para zonas bloqueadas */}
                    {blockedZones.length > 0 && (() => {
                      // Obtener el área real de la imagen para transformar coordenadas
                      const contentArea = getImageContentArea();

                      return (
                        <svg
                          className="absolute"
                          style={{ width: 0, height: 0, position: 'absolute' }}
                        >
                          <defs>
                            <mask id="blocked-zones-container-mask" maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox">
                              {/* Fondo blanco = visible */}
                              <rect x="0" y="0" width="1" height="1" fill="white" />
                              {/* Zonas bloqueadas en negro = invisible */}
                              {blockedZones.map((zone) => {
                                // Las coordenadas de zona están en porcentaje (0-100) relativo a la IMAGEN
                                // Necesitamos convertirlas a porcentaje (0-1) relativo al CONTENEDOR
                                let containerLeft: number;
                                let containerTop: number;
                                let containerWidth: number;
                                let containerHeight: number;

                                if (contentArea) {
                                  const { renderedWidth, renderedHeight, offsetX, offsetY, containerWidth: cw, containerHeight: ch } = contentArea;
                                  // Convertir de % de imagen a px, luego a % del contenedor
                                  containerLeft = (offsetX + (zone.x / 100) * renderedWidth) / cw;
                                  containerTop = (offsetY + (zone.y / 100) * renderedHeight) / ch;
                                  containerWidth = ((zone.width || 0) / 100) * renderedWidth / cw;
                                  containerHeight = ((zone.height || 0) / 100) * renderedHeight / ch;
                                } else {
                                  // Fallback si no hay contentArea
                                  containerLeft = zone.x / 100;
                                  containerTop = zone.y / 100;
                                  containerWidth = (zone.width || 0) / 100;
                                  containerHeight = (zone.height || 0) / 100;
                                }

                                if (zone.shape === 'circle') {
                                  // Usar elipse para cubrir todo el área definida (width x height)
                                  const cx = containerLeft + containerWidth / 2;
                                  const cy = containerTop + containerHeight / 2;
                                  const rx = containerWidth / 2;  // Radio horizontal
                                  const ry = containerHeight / 2; // Radio vertical
                                  return (
                                    <ellipse
                                      key={zone.id}
                                      cx={cx}
                                      cy={cy}
                                      rx={rx}
                                      ry={ry}
                                      fill="black"
                                    />
                                  );
                                }
                                if (zone.shape === 'polygon' && zone.points) {
                                  const points = zone.points.map(p => {
                                    const px = containerLeft + (p.x / 100) * containerWidth;
                                    const py = containerTop + (p.y / 100) * containerHeight;
                                    return `${px},${py}`;
                                  }).join(' ');
                                  return (
                                    <polygon
                                      key={zone.id}
                                      points={points}
                                      fill="black"
                                    />
                                  );
                                }
                                return (
                                  <rect
                                    key={zone.id}
                                    x={containerLeft}
                                    y={containerTop}
                                    width={containerWidth}
                                    height={containerHeight}
                                    fill="black"
                                  />
                                );
                              })}
                            </mask>
                          </defs>
                        </svg>
                      );
                    })()}

                    {/* Contenedor del diseño con máscara del PNG */}
                    {/* La máscara hace que el diseño se recorte al contorno de la prenda */}
                    <div
                      ref={designContainerRef}
                      className="absolute inset-0"
                      style={{
                        pointerEvents: 'none', // El contenedor no captura eventos, solo el diseño
                        // Usar la imagen del template como máscara para recortar el diseño
                        WebkitMaskImage: getCurrentTemplateImage()
                          ? `url(${getCurrentTemplateImage()})`
                          : undefined,
                        maskImage: getCurrentTemplateImage()
                          ? `url(${getCurrentTemplateImage()})`
                          : undefined,
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                      } as React.CSSProperties}
                    >
                      {/* Capa adicional con máscara de zonas bloqueadas */}
                      <div
                        className="absolute inset-0"
                        style={blockedZones.length > 0 ? {
                          mask: 'url(#blocked-zones-container-mask)',
                          WebkitMask: 'url(#blocked-zones-container-mask)',
                        } : undefined}
                      >
                        {/* Diseño posicionable libremente */}
                        {currentDesign && (() => {
                          const design = currentDesign;
                          const displayImage = design.colorizedImageData || design.imageData;

                          // Calcular posición y tamaño como porcentajes del contenedor
                          const leftPercent = design.position.x - (design.size.width / 2);
                          const topPercent = design.position.y - (design.size.height / 2);

                          return (
                            <div
                              className={`absolute cursor-move select-none ${
                                isDragging ? 'ring-2 ring-purple-500 ring-offset-2' : 'hover:ring-2 hover:ring-purple-300'
                              }`}
                              style={{
                                left: `${leftPercent}%`,
                                top: `${topPercent}%`,
                                width: `${design.size.width}%`,
                                height: `${design.size.height}%`,
                                opacity: design.opacity || 1,
                                transform: `rotate(${design.rotation || 0}deg)`,
                                transformOrigin: 'center center',
                                pointerEvents: 'auto', // El diseño sí captura eventos para arrastrarlo
                              }}
                              onMouseDown={handleDragStart}
                              onTouchStart={handleDragStart}
                            >
                              <img
                                src={displayImage}
                                alt="Diseño"
                                className="w-full h-full object-contain pointer-events-none"
                                draggable={false}
                              />
                              {/* Indicador de arrastre */}
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
                                <Move className="w-3 h-3" />
                                <span>Arrastra para mover</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Indicador cuando no hay diseño (fuera de la máscara) */}
                    {!currentDesign && imageLoaded && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pointer-events-none">
                        <Package className="w-12 h-12 mb-2 opacity-50" />
                        <span className="text-sm font-medium opacity-70">
                          Sube una imagen para esta vista
                        </span>
                      </div>
                    )}
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
              {selectedTemplate && currentZoneType ? (
                <>
                  <ImageUploader onImageUpload={handleImageUpload} isUploading={isUploading} />
                  {currentDesign && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Subir una nueva imagen reemplazará la actual
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Selecciona un modelo para subir tu imagen
                </p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Controles de Diseño</h3>
              <DesignControls
                design={currentDesign || null}
                onUpdate={handleDesignUpdate}
                onDelete={handleDesignDelete}
                zoneConfig={null}
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
