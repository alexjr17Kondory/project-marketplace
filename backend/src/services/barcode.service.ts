import { PrismaClient } from '@prisma/client';
import * as bwipjs from 'bwip-js';
import PDFDocument from 'pdfkit';

const prisma = new PrismaClient();

// Importar servicio de plantillas de etiquetas
import * as labelTemplateService from './label-templates.service';

// ==================== TIPOS ====================

export interface BarcodeImageOptions {
  format?: 'png' | 'svg';
  width?: number;
  height?: number;
  includeText?: boolean;
}

export interface BarcodeLabelData {
  variantId: number;
  barcode: string;
  productName: string;
  sku: string;
  color: string;
  size: string;
  price: number;
  image: Buffer;
}

// ==================== UTILIDADES ====================

/**
 * Validar formato de código de barras
 */
export function validateBarcode(barcode: string, type: 'ean13' | 'code128' = 'ean13'): boolean {
  if (type === 'ean13') {
    // EAN-13 debe tener exactamente 13 dígitos
    if (!/^\d{13}$/.test(barcode)) {
      return false;
    }

    // Validar dígito verificador
    const digits = barcode.split('').map(Number);
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += (digits[i] as number) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;

    return checkDigit === (digits[12] as number);
  }

  if (type === 'code128') {
    // Code128 acepta alfanumérico
    return /^[\x00-\x7F]+$/.test(barcode) && barcode.length > 0;
  }

  return false;
}

// ==================== GENERACIÓN DE IMÁGENES ====================

/**
 * Generar imagen de código de barras
 */
export async function generateBarcodeImage(
  barcode: string,
  options: BarcodeImageOptions = {}
): Promise<Buffer> {
  const {
    format = 'png',
    width = 2,
    height = 50,
    includeText = true,
  } = options;

  try {
    // Determinar tipo de código de barras
    let barcodeType: string;
    if (/^\d{13}$/.test(barcode)) {
      barcodeType = 'ean13';
    } else if (/^\d{12}$/.test(barcode)) {
      barcodeType = 'upca';
    } else {
      barcodeType = 'code128';
    }

    const buffer = await bwipjs.toBuffer({
      bcid: barcodeType,
      text: barcode,
      scale: width,
      height: height,
      includetext: includeText,
      textxalign: 'center',
    });

    return buffer;
  } catch (error: any) {
    throw new Error(`Error generando código de barras: ${error.message}`);
  }
}

/**
 * Generar código de barras para una variante específica
 */
export async function generateVariantBarcodeImage(
  variantId: number,
  options: BarcodeImageOptions = {}
): Promise<Buffer> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
  });

  if (!variant) {
    throw new Error('Variante no encontrada');
  }

  if (!variant.barcode) {
    throw new Error('La variante no tiene código de barras asignado');
  }

  return await generateBarcodeImage(variant.barcode, options);
}

// ==================== GENERACIÓN DE ETIQUETAS ====================

/**
 * Generar datos completos de etiqueta para una variante
 */
export async function generateBarcodeLabel(variantId: number): Promise<BarcodeLabelData> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: {
      product: true,
      color: true,
      size: true,
    },
  });

  if (!variant) {
    throw new Error('Variante no encontrada');
  }

  if (!variant.barcode) {
    throw new Error('La variante no tiene código de barras asignado');
  }

  // Generar imagen del código de barras
  const barcodeImage = await generateBarcodeImage(variant.barcode, {
    width: 2,
    height: 40,
    includeText: true,
  });

  // Calcular precio final
  const basePrice = parseFloat(variant.product.basePrice.toString());
  const adjustment = variant.priceAdjustment
    ? parseFloat(variant.priceAdjustment.toString())
    : 0;
  const finalPrice = basePrice + adjustment;

  return {
    variantId: variant.id,
    barcode: variant.barcode,
    productName: variant.product.name,
    sku: variant.sku,
    color: variant.color?.name || 'N/A',
    size: variant.size?.name || 'N/A',
    price: finalPrice,
    image: barcodeImage,
  };
}

/**
 * Generar etiquetas para múltiples variantes
 */
export async function generateBarcodeLabels(
  variantIds: number[]
): Promise<BarcodeLabelData[]> {
  const labels: BarcodeLabelData[] = [];

  for (const variantId of variantIds) {
    try {
      const label = await generateBarcodeLabel(variantId);
      labels.push(label);
    } catch (error: any) {
      console.error(`Error generando etiqueta para variante ${variantId}:`, error.message);
      // Continuar con las siguientes variantes
    }
  }

  return labels;
}

/**
 * Generar etiquetas para todas las variantes de un producto
 */
export async function generateProductBarcodeLabels(productId: number): Promise<BarcodeLabelData[]> {
  const variants = await prisma.productVariant.findMany({
    where: {
      productId,
      barcode: { not: null },
      isActive: true,
    },
  });

  const variantIds = variants.map((v) => v.id);
  return await generateBarcodeLabels(variantIds);
}

// ==================== ASIGNACIÓN DE CÓDIGOS ====================

/**
 * Asignar código de barras a una variante (si no tiene)
 */
export async function assignBarcodeToVariant(
  variantId: number,
  barcode?: string
): Promise<{ variantId: number; barcode: string }> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
  });

  if (!variant) {
    throw new Error('Variante no encontrada');
  }

  if (variant.barcode) {
    throw new Error('La variante ya tiene código de barras asignado');
  }

  // Si se proporciona código manual, validar unicidad
  if (barcode) {
    const existing = await prisma.productVariant.findUnique({
      where: { barcode },
    });

    if (existing) {
      throw new Error('El código de barras ya está en uso');
    }

    await prisma.productVariant.update({
      where: { id: variantId },
      data: { barcode },
    });

    return { variantId, barcode };
  }

  // Generar código EAN-13 automáticamente
  const { generateEAN13, generateUniqueBarcode } = await import('./variants.service');
  const newBarcode = await generateUniqueBarcode();

  await prisma.productVariant.update({
    where: { id: variantId },
    data: { barcode: newBarcode },
  });

  return { variantId, barcode: newBarcode };
}

/**
 * Generar y asignar códigos de barras para todas las variantes sin código
 */
export async function assignBarcodeToAllVariants(): Promise<{
  success: number;
  failed: number;
  errors: { variantId: number; error: string }[];
}> {
  const variantsWithoutBarcode = await prisma.productVariant.findMany({
    where: {
      barcode: null,
      isActive: true,
    },
  });

  const results = {
    success: 0,
    failed: 0,
    errors: [] as { variantId: number; error: string }[],
  };

  for (const variant of variantsWithoutBarcode) {
    try {
      await assignBarcodeToVariant(variant.id);
      results.success++;
    } catch (error: any) {
      results.failed++;
      results.errors.push({
        variantId: variant.id,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Generar PDF con etiquetas de códigos de barras
 * @param items Array de {variantId, quantity}
 * @returns Buffer del PDF generado
 */
export async function generateBarcodeLabelsPDF(
  items: { variantId: number; quantity: number }[]
): Promise<Buffer> {
  // Obtener todas las variantes
  const variantIds = items.map((item) => item.variantId);
  const variants = await prisma.productVariant.findMany({
    where: {
      id: { in: variantIds },
    },
    include: {
      product: true,
      color: true,
      size: true,
    },
  });

  // Crear mapa de variantes
  const variantsMap = new Map(variants.map((v) => [v.id, v]));

  // Configuración de página A4 (21 x 29.7 cm = 595.28 x 841.89 puntos)
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 30;
  const labelCols = 5; // 5 columnas para etiquetas verticales estrechas
  const labelRows = 4; // 4 filas = 20 etiquetas por página
  const spacing = 12;

  // Calcular dimensiones de cada etiqueta (vertical: mucho más alta que ancha)
  // Resultado: ~95 puntos ancho × ~184 puntos alto (ratio 1:1.94)
  const labelWidth = (pageWidth - margin * 2 - spacing * (labelCols - 1)) / labelCols;
  const labelHeight = (pageHeight - margin * 2 - spacing * (labelRows - 1)) / labelRows;

  // Crear documento PDF
  const doc = new PDFDocument({
    size: 'A4',
    margin: margin,
  });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  // Preparar todas las etiquetas a imprimir
  const allLabels: any[] = [];
  for (const item of items) {
    const variant = variantsMap.get(item.variantId);
    if (!variant || !variant.barcode) continue;

    const finalPrice =
      parseFloat(variant.product.basePrice.toString()) +
      (variant.priceAdjustment ? parseFloat(variant.priceAdjustment.toString()) : 0);

    // Agregar la cantidad de etiquetas solicitada
    for (let i = 0; i < item.quantity; i++) {
      allLabels.push({ variant, finalPrice });
    }
  }

  // Generar etiquetas en grid
  let labelIndex = 0;
  while (labelIndex < allLabels.length) {
    // Nueva página cada 20 etiquetas (4 columnas × 5 filas)
    if (labelIndex > 0 && labelIndex % (labelCols * labelRows) === 0) {
      doc.addPage();
    }

    // Calcular posición en el grid
    const pagePosition = labelIndex % (labelCols * labelRows);
    const row = Math.floor(pagePosition / labelCols);
    const col = pagePosition % labelCols;

    const x = margin + col * (labelWidth + spacing);
    const y = margin + row * (labelHeight + spacing);

    const { variant, finalPrice } = allLabels[labelIndex];

    try {
      // Generar código de barras
      const barcodeBuffer = await bwipjs.toBuffer({
        bcid: 'ean13',
        text: variant.barcode,
        scale: 1.5,
        height: 10,
        includetext: false, // No incluir texto en la imagen
        textxalign: 'center',
      });

      // Dibujar borde de la etiqueta (opcional, para debugging)
      // doc.rect(x, y, labelWidth, labelHeight).stroke();

      // Posición Y inicial dentro de la etiqueta
      let currentY = y + 5;

      // 1. Nombre del producto (negrita, centrado, más pequeño para etiqueta vertical)
      doc
        .fontSize(7)
        .font('Helvetica-Bold')
        .text(variant.product.name, x + 3, currentY, {
          width: labelWidth - 6,
          align: 'center',
          lineBreak: true,
        });

      currentY += 16;

      // 2. Talla
      const sizeName = variant.size?.name || variant.size?.abbreviation || 'Única';
      doc
        .fontSize(7)
        .font('Helvetica')
        .text(`Talla: ${sizeName}`, x + 3, currentY, {
          width: labelWidth - 6,
          align: 'center',
        });

      currentY += 12;

      // 3. Código de barras (centrado, vertical)
      const barcodeWidth = labelWidth * 0.9;
      const barcodeHeight = 40;
      const barcodeX = x + (labelWidth - barcodeWidth) / 2;

      doc.image(barcodeBuffer, barcodeX, currentY, {
        width: barcodeWidth,
        height: barcodeHeight,
      });

      currentY += barcodeHeight + 2;

      // Número del código de barras debajo
      doc
        .fontSize(6)
        .font('Helvetica')
        .text(variant.barcode, x + 3, currentY, {
          width: labelWidth - 6,
          align: 'center',
        });

      currentY += 10;

      // 4. SKU (pequeño)
      doc
        .fontSize(5)
        .font('Helvetica')
        .text(`SKU: ${variant.sku}`, x + 3, currentY, {
          width: labelWidth - 6,
          align: 'center',
        });

      currentY += 8;

      // 5. Precio (grande, negrita)
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`$${finalPrice.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, x + 3, currentY, {
          width: labelWidth - 6,
          align: 'center',
        });
    } catch (error) {
      console.error(`Error generating barcode for variant ${variant.id}:`, error);
    }

    labelIndex++;
  }

  // Finalizar documento
  doc.end();

  // Esperar a que el documento se termine de generar
  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on('error', reject);
  });
}

/**
 * Generar PDF con etiquetas usando plantilla personalizada
 * @param items Array de {variantId, quantity}
 * @param templateId ID de la plantilla a usar (opcional)
 * @returns Buffer del PDF generado
 */
export async function generateBarcodeLabelsPDFWithTemplate(
  items: { variantId: number; quantity: number }[],
  templateId?: number
): Promise<Buffer> {
  // Si no se especifica plantilla, usar la función por defecto
  if (!templateId) {
    return generateBarcodeLabelsPDF(items);
  }

  // Obtener plantilla con sus zonas
  const template = await labelTemplateService.getLabelTemplateById(templateId);

  console.log('=== TEMPLATE DEBUG ===');
  console.log('Template ID:', templateId);
  console.log('Template Name:', template?.name);
  console.log('Template Dimensions:', template?.width, 'x', template?.height);
  console.log('Has Background Image:', !!template?.backgroundImage);
  console.log('Background Image Length:', template?.backgroundImage?.length || 0);
  console.log('Number of Zones:', template?.zones?.length || 0);
  console.log('Zones:', template?.zones?.map(z => ({ type: z.zoneType, x: z.x, y: z.y, w: z.width, h: z.height })));
  console.log('===================');

  if (!template || !template.zones || template.zones.length === 0) {
    throw new Error('Plantilla no encontrada o sin zonas definidas');
  }

  // Obtener todas las variantes
  const variantIds = items.map((item) => item.variantId);
  const variants = await prisma.productVariant.findMany({
    where: {
      id: { in: variantIds },
    },
    include: {
      product: {
        include: {
          productType: true,
        },
      },
      color: true,
      size: true,
    },
  });

  // Crear mapa de variantes
  const variantsMap = new Map(variants.map((v) => [v.id, v]));

  // Convertir dimensiones de la plantilla de points a puntos PDF (72 DPI)
  const labelWidthPt = template.width;
  const labelHeightPt = template.height;

  // Determinar dimensiones de página según el tipo configurado
  const pageType = template.pageType || 'A4';
  let pageWidth: number;
  let pageHeight: number;
  let pdfSize: string | [number, number];

  switch (pageType) {
    case 'A3':
      pageWidth = 841.89;  // 29.7 cm
      pageHeight = 1190.55; // 42 cm
      pdfSize = 'A3';
      break;
    case 'LETTER':
      pageWidth = 612;     // 21.6 cm
      pageHeight = 792;    // 27.9 cm
      pdfSize = 'LETTER';
      break;
    case 'CUSTOM':
      // Para custom, usar A4 como fallback
      pageWidth = 595.28;
      pageHeight = 841.89;
      pdfSize = 'A4';
      break;
    case 'A4':
    default:
      pageWidth = 595.28;  // 21 cm
      pageHeight = 841.89; // 29.7 cm
      pdfSize = 'A4';
      break;
  }

  // Usar márgenes y espaciado configurados en la plantilla (valores optimizados por defecto)
  const margin = template.pageMargin ?? 20; // 0.7 cm optimizado
  const spacing = template.labelSpacing ?? 5.67; // 0.2 cm optimizado

  // Calcular cuántas etiquetas caben por página
  const labelCols = Math.floor((pageWidth - margin * 2 + spacing) / (labelWidthPt + spacing));
  const labelRows = Math.floor((pageHeight - margin * 2 + spacing) / (labelHeightPt + spacing));
  const labelsPerPage = labelCols * labelRows;

  console.log('=== PAGE CONFIGURATION ===');
  console.log('Page Type:', pageType);
  console.log('Page Dimensions:', pageWidth, 'x', pageHeight, 'pts');
  console.log('Margin:', margin, 'pts');
  console.log('Spacing:', spacing, 'pts');
  console.log('Label Size:', labelWidthPt, 'x', labelHeightPt, 'pts');
  console.log('Grid:', labelCols, 'cols x', labelRows, 'rows =', labelsPerPage, 'labels per page');
  console.log('========================');

  // Crear documento PDF
  const doc = new PDFDocument({
    size: pdfSize,
    margin: margin,
  });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  // Preparar todas las etiquetas a imprimir
  const allLabels: any[] = [];
  for (const item of items) {
    const variant = variantsMap.get(item.variantId);
    if (!variant || !variant.barcode) continue;

    const finalPrice =
      parseFloat(variant.product.basePrice.toString()) +
      (variant.priceAdjustment ? parseFloat(variant.priceAdjustment.toString()) : 0);

    // Agregar la cantidad de etiquetas solicitada
    for (let i = 0; i < item.quantity; i++) {
      allLabels.push({ variant, finalPrice });
    }
  }

  // Generar etiquetas en grid
  let labelIndex = 0;
  while (labelIndex < allLabels.length) {
    // Nueva página si es necesario
    if (labelIndex > 0 && labelIndex % labelsPerPage === 0) {
      doc.addPage();
    }

    // Calcular posición en el grid
    const pagePosition = labelIndex % labelsPerPage;
    const row = Math.floor(pagePosition / labelCols);
    const col = pagePosition % labelCols;

    const labelX = margin + col * (labelWidthPt + spacing);
    const labelY = margin + row * (labelHeightPt + spacing);

    const { variant, finalPrice } = allLabels[labelIndex];

    try {
      // Renderizar imagen de fondo si existe
      if (template.backgroundImage) {
        console.log('Rendering background image for label', labelIndex);
        console.log('Label position:', labelX, labelY);
        console.log('Label size:', labelWidthPt, labelHeightPt);

        // La imagen está en base64, convertirla a buffer
        const base64Data = template.backgroundImage.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');

        console.log('Image buffer size:', imageBuffer.length, 'bytes');

        // Guardar estado del documento y crear región de recorte
        doc.save();

        // Crear una región de recorte para evitar que la imagen se desborde
        doc.rect(labelX, labelY, labelWidthPt, labelHeightPt).clip();

        // Usar 'cover' para llenar completamente el área de la etiqueta
        // manteniendo la proporción de la imagen
        doc.image(imageBuffer, labelX, labelY, {
          cover: [labelWidthPt, labelHeightPt],
          align: 'center',
          valign: 'center',
        });

        // Restaurar estado del documento
        doc.restore();
        console.log('Background image rendered successfully');
      } else {
        console.log('No background image, rendering white background');
        // Fondo blanco con borde
        doc
          .rect(labelX, labelY, labelWidthPt, labelHeightPt)
          .fillAndStroke('#FFFFFF', '#CCCCCC');
      }

      // Renderizar cada zona según la plantilla
      for (const zone of template.zones) {
        const zoneX = labelX + zone.x;
        const zoneY = labelY + zone.y;

        // Debug: Log de posición de zona
        if (labelIndex === 0) { // Solo para la primera etiqueta
          console.log(`Zone ${zone.zoneType}:`, {
            labelPos: { x: labelX, y: labelY },
            zoneRelative: { x: zone.x, y: zone.y },
            zoneAbsolute: { x: zoneX, y: zoneY },
            zoneDimensions: { w: zone.width, h: zone.height }
          });
        }

        let content = '';

        // Determinar contenido según tipo de zona
        // showLabel determina si se muestra el prefijo (ej: "Talla:", "Color:", "SKU:")
        const showLabel = zone.showLabel !== false; // Por defecto true si no está definido

        switch (zone.zoneType) {
          case 'PRODUCT_NAME':
            content = variant.product.name;
            break;
          case 'SIZE':
            const sizeValue = variant.size?.abbreviation || variant.size?.name || 'Única';
            content = showLabel ? `Talla: ${sizeValue}` : sizeValue;
            break;
          case 'COLOR':
            const colorValue = variant.color?.name || 'N/A';
            content = showLabel ? `Color: ${colorValue}` : colorValue;
            break;
          case 'BARCODE':
            // Generar solo la imagen del código de barras (las líneas)
            const barcodeBuffer = await bwipjs.toBuffer({
              bcid: 'ean13',
              text: variant.barcode,
              scale: 2,
              height: 12,
              includetext: false,
              textxalign: 'center',
            });

            doc.image(barcodeBuffer, zoneX, zoneY, {
              width: zone.width,
              height: zone.height,
              fit: [zone.width, zone.height],
            });

            continue; // No renderizar texto, solo imagen
          case 'BARCODE_TEXT':
            // Solo el número del código de barras
            content = variant.barcode;
            break;
          case 'SKU':
            content = showLabel ? `SKU: ${variant.sku}` : variant.sku;
            break;
          case 'PRICE':
            content = `$${finalPrice.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
            break;
          case 'CUSTOM_TEXT':
            content = ''; // Texto personalizado vacío por ahora
            break;
          default:
            content = '';
        }

        // Renderizar texto si hay contenido
        if (content) {
          // Guardar estado y crear región de recorte para que el texto no se desborde
          doc.save();

          // Configurar fuente antes de medir
          doc
            .fontSize(zone.fontSize)
            .font(zone.fontWeight === 'bold' ? 'Helvetica-Bold' : 'Helvetica');

          // Calcular altura del texto para centrarlo verticalmente
          const textHeight = doc.heightOfString(content, {
            width: zone.width,
            align: zone.textAlign as any,
            lineBreak: true,
          });

          // Calcular offset vertical para centrar (solo si el texto cabe en la zona)
          const offsetY = Math.max(0, (zone.height - textHeight) / 2);

          // Crear rectángulo de recorte (clipping) para limitar el texto a las dimensiones de la zona
          doc.rect(zoneX, zoneY, zone.width, zone.height).clip();

          // Renderizar texto centrado vertical y horizontalmente
          doc
            .fillColor(zone.fontColor)
            .text(content, zoneX, zoneY + offsetY, {
              width: zone.width,
              height: zone.height,
              align: zone.textAlign as any, // Centrado horizontal
              lineBreak: true,
              ellipsis: true,
            });

          // Restaurar estado (quitar clipping)
          doc.restore();
        }
      }
    } catch (error) {
      console.error(`Error generating label for variant ${variant.id}:`, error);
    }

    labelIndex++;
  }

  // Finalizar documento
  doc.end();

  // Esperar a que el documento se termine de generar
  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on('error', reject);
  });
}
