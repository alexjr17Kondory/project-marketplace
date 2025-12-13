import JSZip from 'jszip';
import type { Design } from '../types/design';

interface ExportOptions {
  templateName?: string;
  selectedColor?: string;
  selectedSize?: string;
  includeOriginal?: boolean; // Incluir imagen original de alta calidad
  templateImages?: Map<string, string>; // Imágenes del template por vista (front, back, etc.)
  colorizedTemplateImages?: Map<string, string>; // Imágenes del template colorizadas
}

/**
 * Convierte base64 a Blob
 */
const base64ToBlob = (base64: string): Blob => {
  // Extraer el tipo MIME y los datos
  const matches = base64.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid base64 string');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  // Decodificar base64
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

/**
 * Obtiene la extensión del archivo basada en el tipo MIME
 */
const getExtensionFromBase64 = (base64: string): string => {
  if (base64.startsWith('data:image/png')) return 'png';
  if (base64.startsWith('data:image/jpeg') || base64.startsWith('data:image/jpg')) return 'jpg';
  if (base64.startsWith('data:image/gif')) return 'gif';
  if (base64.startsWith('data:image/webp')) return 'webp';
  if (base64.startsWith('data:image/svg')) return 'svg';
  return 'png'; // Default
};

/**
 * Carga una imagen desde URL o base64
 * Para URLs externas, intenta sin CORS primero y luego con CORS
 */
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    // Si es base64, no necesita CORS
    if (src.startsWith('data:')) {
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Error al cargar imagen base64`));
      img.src = src;
      return;
    }

    // Para URLs, intentar con crossOrigin
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Si falla con CORS, intentar sin CORS (no podremos leer pixels pero sí dibujar)
      console.warn('Reintentando carga de imagen sin CORS...');
      const img2 = new Image();
      img2.onload = () => resolve(img2);
      img2.onerror = () => reject(new Error(`Error al cargar imagen: ${src.substring(0, 50)}...`));
      img2.src = src;
    };
    img.src = src;
  });
};

/**
 * Genera una imagen compuesta del template con el diseño aplicado
 */
const generateCompositeImage = async (
  templateImageSrc: string,
  design: Design,
  outputSize: number = 1200
): Promise<string> => {
  // Cargar la imagen del template
  const templateImg = await loadImage(templateImageSrc);

  // Crear canvas con el tamaño del template (manteniendo aspecto)
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo crear contexto del canvas');

  // Calcular dimensiones manteniendo proporción
  const aspectRatio = templateImg.naturalWidth / templateImg.naturalHeight;
  let canvasWidth = outputSize;
  let canvasHeight = outputSize / aspectRatio;

  if (canvasHeight > outputSize) {
    canvasHeight = outputSize;
    canvasWidth = outputSize * aspectRatio;
  }

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // Dibujar el template
  ctx.drawImage(templateImg, 0, 0, canvasWidth, canvasHeight);

  // Si hay imagen de diseño, dibujarla
  const displayImage = design.colorizedImageData || design.imageData;
  if (displayImage) {
    const designImg = await loadImage(displayImage);

    // Calcular posición y tamaño del diseño
    // Los porcentajes están basados en el área del template
    const designWidth = (design.size.width / 100) * canvasWidth;
    const designHeight = (design.size.height / 100) * canvasHeight;
    const designX = ((design.position.x - design.size.width / 2) / 100) * canvasWidth;
    const designY = ((design.position.y - design.size.height / 2) / 100) * canvasHeight;

    // Guardar contexto para aplicar transformaciones
    ctx.save();

    // Aplicar máscara usando el template (solo visible donde hay prenda)
    ctx.globalCompositeOperation = 'source-atop';

    // Aplicar opacidad
    ctx.globalAlpha = design.opacity || 1;

    // Aplicar rotación si existe
    if (design.rotation) {
      const centerX = designX + designWidth / 2;
      const centerY = designY + designHeight / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((design.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    // Dibujar el diseño
    ctx.drawImage(designImg, designX, designY, designWidth, designHeight);

    // Restaurar contexto
    ctx.restore();

    // Redibujar el template encima para que los bordes y detalles se vean bien
    ctx.globalCompositeOperation = 'destination-over';
    ctx.drawImage(templateImg, 0, 0, canvasWidth, canvasHeight);
  }

  return canvas.toDataURL('image/png');
};

/**
 * Exporta todos los diseños a un archivo ZIP
 * La clave del Map ahora es el viewType (front, back, etc.)
 */
export const exportDesignsToZip = async (
  designs: Map<string, Design>,
  options: ExportOptions = {}
): Promise<void> => {
  const {
    templateName = 'diseño',
    selectedColor = '',
    selectedSize = '',
    includeOriginal = true,
    templateImages,
    colorizedTemplateImages,
  } = options;

  // Verificar que hay diseños para exportar
  const designsWithImages = Array.from(designs.values()).filter(
    (d) => d.imageData || d.originalImageData
  );

  if (designsWithImages.length === 0) {
    throw new Error('No hay diseños con imágenes para exportar');
  }

  const zip = new JSZip();

  // Crear carpeta para los diseños
  const folder = zip.folder('diseños');
  if (!folder) {
    throw new Error('Error al crear carpeta en ZIP');
  }

  // Crear archivo de información
  const info = {
    templateName,
    selectedColor,
    selectedSize,
    exportDate: new Date().toISOString(),
    designs: [] as Array<{
      zoneId: string;
      fileName: string;
      compositeFileName?: string;
      originalFileName?: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
      rotation: number;
      opacity: number;
      tintColor?: string;
    }>,
  };

  // Agregar cada diseño al ZIP (solo mockups)
  for (const design of designsWithImages) {
    const viewType = design.viewType || 'unknown';
    const viewName = `vista_${viewType}`;

    // Preparar info del diseño
    const designInfo: typeof info.designs[0] = {
      zoneId: design.zoneId,
      fileName: `${viewName}_mockup.png`,
      originalFileName: design.originalFileName,
      position: design.position,
      size: design.size,
      rotation: design.rotation,
      opacity: design.opacity,
      tintColor: design.tintColor,
    };

    // SOLO generar MOCKUP (imagen compuesta template + diseño)
    const templateImageSrc = colorizedTemplateImages?.get(viewType) || templateImages?.get(viewType);
    if (templateImageSrc) {
      try {
        console.log('Generando mockup para vista:', viewType);
        const compositeImage = await generateCompositeImage(templateImageSrc, design, 1200);
        const compositeFileName = `${viewName}_mockup.png`;
        const compositeBlob = base64ToBlob(compositeImage);
        folder.file(compositeFileName, compositeBlob);
        designInfo.compositeFileName = compositeFileName;
        console.log('Mockup generado correctamente:', compositeFileName);
      } catch (err) {
        console.warn('No se pudo generar mockup (continuando sin él):', err);
      }
    }

    info.designs.push(designInfo);
  }

  // Agregar archivo de información
  folder.file('info.json', JSON.stringify(info, null, 2));

  // Generar el ZIP
  const content = await zip.generateAsync({ type: 'blob' });

  // Crear nombre del archivo
  const timestamp = new Date().toISOString().slice(0, 10);
  const colorSuffix = selectedColor ? `_${selectedColor.replace('#', '')}` : '';
  const sizeSuffix = selectedSize ? `_${selectedSize}` : '';
  const zipFileName = `${templateName}${colorSuffix}${sizeSuffix}_${timestamp}.zip`;

  // Descargar
  downloadBlob(content, zipFileName);
};

/**
 * Descarga un Blob como archivo
 */
const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exporta un diseño individual
 */
export const exportSingleDesign = (design: Design, useOriginal = true): void => {
  const imageData = useOriginal && design.originalImageData
    ? design.originalImageData
    : design.colorizedImageData || design.imageData;

  if (!imageData) {
    throw new Error('No hay imagen para exportar');
  }

  const ext = getExtensionFromBase64(imageData);
  const fileName = design.originalFileName
    ? design.originalFileName.replace(/\.[^/.]+$/, `.${ext}`)
    : `diseño_${design.zoneId}.${ext}`;

  const blob = base64ToBlob(imageData);
  downloadBlob(blob, fileName);
};
