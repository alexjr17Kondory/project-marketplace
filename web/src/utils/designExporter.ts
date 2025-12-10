import JSZip from 'jszip';
import type { Design } from '../types/design';
import type { PrintZone } from '../types/product';

interface ExportOptions {
  templateName?: string;
  selectedColor?: string;
  selectedSize?: string;
  includeOriginal?: boolean; // Incluir imagen original de alta calidad
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
 * Exporta todos los diseños a un archivo ZIP
 */
export const exportDesignsToZip = async (
  designs: Map<PrintZone, Design>,
  options: ExportOptions = {}
): Promise<void> => {
  const {
    templateName = 'diseño',
    selectedColor = '',
    selectedSize = '',
    includeOriginal = true,
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
      originalFileName?: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
      rotation: number;
      opacity: number;
      tintColor?: string;
    }>,
  };

  // Agregar cada diseño al ZIP
  for (const design of designsWithImages) {
    const zoneId = design.zoneId.replace('zone-', '');
    const zoneName = `zona_${zoneId}`;

    // Imagen para preview (comprimida o coloreada)
    const previewImage = design.colorizedImageData || design.imageData;
    if (previewImage) {
      const ext = getExtensionFromBase64(previewImage);
      const fileName = `${zoneName}_preview.${ext}`;
      const blob = base64ToBlob(previewImage);
      folder.file(fileName, blob);

      info.designs.push({
        zoneId: design.zoneId,
        fileName,
        originalFileName: design.originalFileName,
        position: design.position,
        size: design.size,
        rotation: design.rotation,
        opacity: design.opacity,
        tintColor: design.tintColor,
      });
    }

    // Imagen original (alta calidad) si está disponible
    if (includeOriginal && design.originalImageData) {
      const ext = getExtensionFromBase64(design.originalImageData);
      const originalName = design.originalFileName
        ? design.originalFileName.replace(/\.[^/.]+$/, '') // Remover extensión original
        : zoneName;
      const fileName = `${originalName}_original.${ext}`;
      const blob = base64ToBlob(design.originalImageData);
      folder.file(fileName, blob);
    }
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
