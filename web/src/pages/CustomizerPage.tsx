import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { canvasService } from '../services/canvas.service';
import { templatesService, type Template } from '../services/templates.service';
import { templateZonesService, type TemplateZone } from '../services/template-zones.service';
import { useCatalogs } from '../context/CatalogsContext';
import { getProductById } from '../data/mockProducts';
import { getPrintZones } from '../data/productTypeConfigs';
import { getSizeChart, getAvailableSizes } from '../data/sizeCharts';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { ProductSelector } from '../components/customizer/ProductSelector';
import { TemplateSelector } from '../components/customizer/TemplateSelector';
import { ColorPicker } from '../components/customizer/ColorPicker';
import { ViewToggle } from '../components/customizer/ViewToggle';
import { ImageUploader, type ImageUploadData } from '../components/customizer/ImageUploader';
import { DesignControls } from '../components/customizer/DesignControls';
import { ZoneSelector } from '../components/customizer/ZoneSelector';
import { SizeSelector } from '../components/customizer/SizeSelector';
import { SizeGuideModal } from '../components/customizer/SizeGuideModal';
import type { ProductType, PrintZone } from '../types/product';
import type { Design, CustomizedProduct } from '../types/design';

export const CustomizerPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { addCustomizedProduct } = useCart();
  const { settings } = useSettings();
  const { productTypes } = useCatalogs();

  // Colores de marca dinámicos
  const brandColors = settings.appearance?.brandColors || settings.general.brandColors || {
    primary: '#7c3aed',
    secondary: '#ec4899',
    accent: '#f59e0b',
  };
  const gradientStyle = `linear-gradient(to right, ${brandColors.primary}, ${brandColors.secondary}, ${brandColors.accent})`;

  // State
  const [productType, setProductType] = useState<ProductType>('tshirt');
  const [productTypeId, setProductTypeId] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateZones, setTemplateZones] = useState<TemplateZone[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('#FFFFFF');
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [currentView, setCurrentView] = useState<'front' | 'back'>('front');
  const [selectedZone, setSelectedZone] = useState<PrintZone>('front-regular');
  const [selectedTemplateZone, setSelectedTemplateZone] = useState<TemplateZone | null>(null);
  const [designs, setDesigns] = useState<Map<PrintZone, Design>>(new Map());
  const [isUploading, setIsUploading] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // Actualizar productTypeId cuando cambie el productType
  useEffect(() => {
    if (productTypes && productTypes.length > 0) {
      // Mapear el productType string al ID numérico del catálogo
      const matchingType = productTypes.find(
        pt => pt.slug === productType || pt.name.toLowerCase().includes(productType.toLowerCase())
      );
      setProductTypeId(matchingType?.id || null);
    }
  }, [productType, productTypes]);

  // Cargar zonas del template cuando se selecciona uno
  useEffect(() => {
    const loadTemplateZones = async () => {
      if (selectedTemplate) {
        try {
          const zones = await templateZonesService.getByTemplateId(selectedTemplate.id);
          const validZones = Array.isArray(zones) ? zones : [];
          setTemplateZones(validZones.filter(z => z.isActive).sort((a, b) => a.sortOrder - b.sortOrder));
          // Seleccionar la primera zona si existe
          if (validZones.length > 0) {
            setSelectedTemplateZone(validZones[0]);
          }
        } catch (error) {
          console.error('Error al cargar zonas del template:', error);
          setTemplateZones([]);
        }
      } else {
        setTemplateZones([]);
        setSelectedTemplateZone(null);
      }
    };
    loadTemplateZones();
  }, [selectedTemplate]);

  // Constantes del canvas para conversión de porcentajes a píxeles
  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 600;

  // Obtener zonas de impresión disponibles para el producto actual
  // Si hay un template con zonas definidas, usar esas; sino usar las hardcodeadas
  // Las zonas del template están en porcentajes, las hardcodeadas en píxeles
  const allZones = templateZones.length > 0
    ? templateZones.map(zone => ({
        id: `zone-${zone.id}` as PrintZone,
        name: zone.name,
        // Convertir porcentajes a píxeles
        position: {
          x: Math.round((zone.positionX / 100) * CANVAS_WIDTH),
          y: Math.round((zone.positionY / 100) * CANVAS_HEIGHT),
        },
        maxWidth: Math.round((zone.maxWidth / 100) * CANVAS_WIDTH),
        maxHeight: Math.round((zone.maxHeight / 100) * CANVAS_HEIGHT),
        isRequired: zone.isRequired,
        zoneType: zone.zoneType?.slug || 'text',
      }))
    : getPrintZones(productType);

  // Filtrar zonas según la vista actual (front/back)
  const availableZones = templateZones.length > 0
    ? allZones // Si hay zonas del template, mostrar todas (no filtrar por vista)
    : allZones.filter(zone => {
        if (currentView === 'front') {
          return zone.id.includes('front') || zone.id.includes('sleeve') || zone.id.includes('chest');
        } else {
          return zone.id.includes('back');
        }
      });

  // Obtener tallas disponibles y guía de tallas
  const availableSizes = getAvailableSizes(productType);
  const sizeChart = getSizeChart(productType);

  // Obtener factor de escala de la talla seleccionada
  const currentSizeMeasurements = sizeChart?.sizes.find(s => s.size === selectedSize);
  const sizeScale = currentSizeMeasurements?.scale || 1.0;

  // Obtener producto inicial si viene en la URL
  useEffect(() => {
    const productId = searchParams.get('product');
    if (productId) {
      const product = getProductById(productId);
      if (product) {
        setProductType(product.type);
        if (product.colors.length > 0) {
          setSelectedColor(product.colors[0].hex);
        }
      }
    }
  }, [searchParams]);

  // Inicializar canvas
  useEffect(() => {
    if (canvasRef.current) {
      canvasService.init(canvasRef.current);
      canvasService.resize(600, 600);
      renderCanvas();
    }
  }, []);

  // Actualizar zona seleccionada cuando cambien las zonas disponibles
  useEffect(() => {
    if (availableZones.length > 0) {
      // Si la zona actual no está en las zonas disponibles, seleccionar la primera
      const currentZoneExists = availableZones.some(z => z.id === selectedZone);
      if (!currentZoneExists) {
        setSelectedZone(availableZones[0].id);
      }
    }
  }, [availableZones]);

  // Cambiar zona seleccionada cuando cambie la vista (solo para zonas hardcodeadas)
  useEffect(() => {
    if (templateZones.length === 0) {
      // Solo aplicar este comportamiento cuando no haya zonas de template
      if (currentView === 'front' && !selectedZone.includes('front') && !selectedZone.includes('sleeve')) {
        setSelectedZone('front-regular');
      } else if (currentView === 'back' && !selectedZone.includes('back')) {
        setSelectedZone('back-large');
      }
    }
  }, [currentView, templateZones]);

  // Re-renderizar cuando cambien las propiedades
  useEffect(() => {
    renderCanvas();
  }, [productType, selectedColor, currentView, designs, selectedZone, sizeScale, selectedTemplate, templateZones]);

  const renderCanvas = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Si hay un modelo seleccionado, mostrar su imagen
    if (selectedTemplate) {
      // Determinar qué imagen usar:
      // 1. Primero intentar con zoneTypeImages basado en la zona seleccionada
      // 2. Luego con currentView (front/back)
      // 3. Finalmente fallback a images.front
      let imageUrl: string | undefined;

      // Obtener el tipo de zona de la zona seleccionada (si es una zona del template)
      const selectedZoneData = templateZones.find(z => `zone-${z.id}` === selectedZone);
      const zoneTypeSlug = selectedZoneData?.zoneType?.slug;

      // Si hay zoneTypeImages y tenemos un slug de tipo de zona, usar esa imagen
      if (selectedTemplate.zoneTypeImages && zoneTypeSlug) {
        imageUrl = selectedTemplate.zoneTypeImages[zoneTypeSlug];
      }

      // Si no hay imagen de tipo de zona, usar las imágenes estándar basadas en currentView
      if (!imageUrl && selectedTemplate.images) {
        imageUrl = currentView === 'front'
          ? selectedTemplate.images.front
          : (selectedTemplate.images.back || selectedTemplate.images.front);
      }

      if (imageUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Dibujar el diseño de la zona actual encima del modelo
          const currentDesign = designs.get(selectedZone);
          if (currentDesign) {
            canvasService.drawDesign(currentDesign);
          }
        };
        img.onerror = () => {
          // Si falla la carga de la imagen, usar el método original
          drawProductBase(ctx);
        };
        img.src = imageUrl;
        return;
      }
    }

    // Si no hay modelo, dibujar el producto base
    drawProductBase(ctx);
  };

  const drawProductBase = (ctx?: CanvasRenderingContext2D) => {
    const zoneConfig = availableZones.find(z => z.id === selectedZone);
    canvasService.drawProductBase(productType, selectedColor, currentView, zoneConfig, sizeScale);

    // Dibujar SOLO el diseño de la zona actualmente seleccionada
    const currentDesign = designs.get(selectedZone);
    if (currentDesign) {
      canvasService.drawDesign(currentDesign);
    }
  };

  const handleImageUpload = (imageData: string, uploadData?: ImageUploadData) => {
    setIsUploading(true);

    // Obtener configuración de la zona seleccionada
    const zoneConfig = availableZones.find(z => z.id === selectedZone);
    const defaultWidth = zoneConfig?.maxWidth || 200;
    const defaultHeight = zoneConfig?.maxHeight || 200;
    const posX = zoneConfig?.position.x || 200;
    const posY = zoneConfig?.position.y || 200;

    // Crear diseño para la zona actual
    const newDesign: Design = {
      id: `design-${selectedZone}-${Date.now()}`,
      zoneId: selectedZone,
      imageUrl: '',
      imageData: imageData, // Versión comprimida para preview/canvas
      originalImageData: uploadData?.original, // Versión original para producción
      originalFileName: uploadData?.fileName,
      originalFileSize: uploadData?.fileSize,
      position: { x: posX, y: posY },
      size: { width: Math.min(defaultWidth, 200), height: Math.min(defaultHeight, 200) },
      rotation: 0,
      opacity: 1,
    };

    // Actualizar el Map con el diseño de esta zona
    setDesigns(prev => new Map(prev).set(selectedZone, newDesign));
    setIsUploading(false);
  };

  const handleDesignUpdate = (updates: Partial<Design>) => {
    const currentDesign = designs.get(selectedZone);
    if (!currentDesign) return;

    const updatedDesign = { ...currentDesign, ...updates };
    setDesigns(prev => new Map(prev).set(selectedZone, updatedDesign));
  };

  const handleDesignDelete = () => {
    setDesigns(prev => {
      const newMap = new Map(prev);
      newMap.delete(selectedZone);
      return newMap;
    });
  };

  const handleProductTypeChange = (type: ProductType) => {
    setProductType(type);
    // Limpiar todos los diseños al cambiar de producto
    setDesigns(new Map());

    // Actualizar la talla a la primera disponible del nuevo producto
    const newSizes = getAvailableSizes(type);
    if (newSizes.length > 0) {
      setSelectedSize(newSizes[0]);
    }

    // Limpiar modelo seleccionado
    setSelectedTemplate(null);
  };

  const handleTemplateSelect = (template: Template | null) => {
    setSelectedTemplate(template);

    // Si se selecciona un modelo, actualizar el color si está disponible
    if (template && template.colors && template.colors.length > 0) {
      setSelectedColor(template.colors[0].hexCode);
    }
  };

  const handleAddToCart = (quantity: number = 1) => {
    // Calcular precio base (modelo o producto genérico)
    const basePrice = selectedTemplate?.basePrice || 29.99;
    const productName = selectedTemplate?.name || `${productType} Personalizado`;

    // Verificar que hay al menos un diseño
    if (designs.size === 0) {
      alert('Por favor sube al menos una imagen en alguna zona');
      return;
    }

    // Exportar canvas como imagen
    const previewImage = canvasService.exportAsImage('png', 0.95);
    if (!previewImage) {
      alert('Error al generar vista previa');
      return;
    }

    // Convertir Map a Array de diseños
    const allDesigns = Array.from(designs.values());

    // Calcular precio de personalización ($2.000 COP por cada zona con diseño)
    const pricePerZone = 2000; // $2.000 COP por zona
    const customizationPrice = designs.size * pricePerZone;
    const totalPrice = basePrice + customizationPrice;

    // Generar imágenes de producción (con diseños originales en alta calidad)
    const frontDesign = allDesigns.find(d => d.zoneId.includes('front') || d.zoneId.includes('chest') || d.zoneId.includes('sleeve'));
    const backDesign = allDesigns.find(d => d.zoneId.includes('back'));

    // Crear objeto CustomizedProduct
    const customizedProduct: CustomizedProduct = {
      id: `custom-${Date.now()}`,
      productId: selectedTemplate?.id.toString() || `${productType}-001`,
      productType: productType,
      productName: productName,
      basePrice: basePrice,
      selectedColor: selectedColor,
      selectedSize: selectedSize,
      designs: allDesigns,
      previewImages: {
        front: previewImage, // Comprimido para preview
      },
      productionImages: {
        // Imágenes originales sin compresión para producción
        front: frontDesign?.originalImageData || frontDesign?.imageData,
        back: backDesign?.originalImageData || backDesign?.imageData,
      },
      customizationPrice: customizationPrice,
      totalPrice: totalPrice,
      createdAt: new Date(),
    };

    // Agregar al carrito como UNA prenda con la cantidad especificada
    addCustomizedProduct(customizedProduct, quantity);

    alert(`¡${quantity} producto(s) personalizado(s) agregado(s) al carrito!`);
    navigate('/cart');
  };

  // Colores disponibles
  const availableColors = selectedTemplate?.colors.map(c => c.hexCode) || [
    '#FFFFFF', // Blanco
    '#000000', // Negro
    '#EF4444', // Rojo
    '#3B82F6', // Azul
    '#10B981', // Verde
    '#F59E0B', // Amarillo
    '#8B5CF6', // Morado
    '#EC4899', // Rosa
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="text-white py-6 shadow-lg" style={{ background: gradientStyle }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/catalog')}
                className="hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Personalizador</h1>
                <p className="text-sm text-white/90">Crea tu diseño único</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Product Config */}
          <aside className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <ProductSelector
                selectedType={productType}
                onTypeChange={handleProductTypeChange}
              />
            </div>

            {/* Selector de Modelos */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <TemplateSelector
                productTypeId={productTypeId}
                selectedTemplate={selectedTemplate}
                onTemplateSelect={handleTemplateSelect}
              />
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <ColorPicker
                colors={availableColors}
                selectedColor={selectedColor}
                onColorChange={setSelectedColor}
              />
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <SizeSelector
                sizes={availableSizes}
                selectedSize={selectedSize}
                onSizeChange={setSelectedSize}
                onShowSizeGuide={() => setShowSizeGuide(true)}
              />
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              {templateZones.length > 0 && (
                <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                  Usando zonas personalizadas del template
                </div>
              )}
              <ZoneSelector
                zones={availableZones}
                selectedZone={selectedZone}
                onZoneChange={setSelectedZone}
              />
            </div>
          </aside>

          {/* Center - Canvas */}
          <main className="lg:col-span-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              {/* Preview del modelo seleccionado */}
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
                        Modelo: {selectedTemplate.name}
                      </p>
                      <p className="text-xs text-purple-600">
                        Precio base: ${selectedTemplate.basePrice.toLocaleString('es-CO')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={600}
                  className="border border-gray-200 rounded-lg max-w-full h-auto"
                />
              </div>

              {/* Action Buttons */}
              <div className="mt-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm text-gray-600">
                    {designs.size > 0 && `${designs.size} zona${designs.size > 1 ? 's' : ''} con diseño`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {/* Selector de Cantidad */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Cantidad:</label>
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
                        className="w-14 text-center py-2 border-x border-gray-300 focus:outline-none"
                      />
                      <button
                        onClick={() => setQuantity(Math.min(99, quantity + 1))}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Botón Agregar al Carrito */}
                  <button
                    onClick={() => handleAddToCart(quantity)}
                    disabled={designs.size === 0}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2.5 px-6 rounded-lg transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Agregar al Carrito
                  </button>
                </div>
              </div>
            </div>
          </main>

          {/* Right Sidebar - Design Controls */}
          <aside className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Subir Imagen</h3>
              <ImageUploader onImageUpload={handleImageUpload} isUploading={isUploading} />
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Controles de Diseño</h3>
              <DesignControls
                design={designs.get(selectedZone) || null}
                onUpdate={handleDesignUpdate}
                onDelete={handleDesignDelete}
              />
            </div>
          </aside>
        </div>
      </div>

      {/* Modal de guía de tallas */}
      {sizeChart && (
        <SizeGuideModal
          isOpen={showSizeGuide}
          onClose={() => setShowSizeGuide(false)}
          sizeChart={sizeChart}
        />
      )}
    </div>
  );
};
