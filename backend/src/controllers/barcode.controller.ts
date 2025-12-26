import { Request, Response } from 'express';
import * as barcodeService from '../services/barcode.service';

/**
 * Generar imagen de código de barras para una variante
 * GET /api/barcodes/image/:variantId
 */
export async function getVariantBarcodeImage(req: Request, res: Response): Promise<void> {
  try {
    const { variantId } = req.params;
    const { format = 'png', width, height, includeText } = req.query;

    const options = {
      format: format as 'png' | 'svg',
      width: width ? Number(width) : undefined,
      height: height ? Number(height) : undefined,
      includeText: includeText === 'true',
    };

    const imageBuffer = await barcodeService.generateVariantBarcodeImage(
      Number(variantId),
      options
    );

    // Establecer headers apropiados
    res.setHeader('Content-Type', `image/${format}`);
    res.setHeader('Content-Disposition', `inline; filename=barcode-${variantId}.${format}`);
    res.send(imageBuffer);
  } catch (error: any) {
    console.error('Error generating barcode image:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al generar imagen del código de barras',
    });
  }
}

/**
 * Generar imagen de código de barras genérico
 * POST /api/barcodes/image
 */
export async function generateBarcodeImage(req: Request, res: Response): Promise<void> {
  try {
    const { barcode, format = 'png', width, height, includeText = true } = req.body;

    if (!barcode) {
      res.status(400).json({
        success: false,
        message: 'El código de barras es requerido',
      });
      return;
    }

    const options = {
      format: format as 'png' | 'svg',
      width: width ? Number(width) : undefined,
      height: height ? Number(height) : undefined,
      includeText: Boolean(includeText),
    };

    const imageBuffer = await barcodeService.generateBarcodeImage(barcode, options);

    res.setHeader('Content-Type', `image/${format}`);
    res.setHeader('Content-Disposition', `inline; filename=barcode-${barcode}.${format}`);
    res.send(imageBuffer);
  } catch (error: any) {
    console.error('Error generating barcode image:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al generar imagen del código de barras',
    });
  }
}

/**
 * Generar datos de etiqueta completa para una variante
 * GET /api/barcodes/label/:variantId
 */
export async function getVariantBarcodeLabel(req: Request, res: Response): Promise<void> {
  try {
    const { variantId } = req.params;

    const labelData = await barcodeService.generateBarcodeLabel(Number(variantId));

    // Convertir el Buffer a base64 para enviarlo como JSON
    const response = {
      ...labelData,
      image: labelData.image.toString('base64'),
    };

    res.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('Error generating barcode label:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al generar etiqueta',
    });
  }
}

/**
 * Generar etiquetas para múltiples variantes
 * POST /api/barcodes/labels/batch
 */
export async function generateBatchLabels(req: Request, res: Response): Promise<void> {
  try {
    const { variantIds } = req.body;

    if (!Array.isArray(variantIds) || variantIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'variantIds debe ser un array no vacío',
      });
      return;
    }

    const labels = await barcodeService.generateBarcodeLabels(variantIds);

    // Convertir Buffers a base64
    const response = labels.map((label) => ({
      ...label,
      image: label.image.toString('base64'),
    }));

    res.json({
      success: true,
      data: response,
      total: response.length,
    });
  } catch (error: any) {
    console.error('Error generating batch labels:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al generar etiquetas',
    });
  }
}

/**
 * Generar etiquetas para todas las variantes de un producto
 * GET /api/barcodes/labels/product/:productId
 */
export async function generateProductLabels(req: Request, res: Response): Promise<void> {
  try {
    const { productId } = req.params;

    const labels = await barcodeService.generateProductBarcodeLabels(Number(productId));

    // Convertir Buffers a base64
    const response = labels.map((label) => ({
      ...label,
      image: label.image.toString('base64'),
    }));

    res.json({
      success: true,
      data: response,
      total: response.length,
    });
  } catch (error: any) {
    console.error('Error generating product labels:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al generar etiquetas del producto',
    });
  }
}

/**
 * Asignar código de barras a una variante
 * POST /api/barcodes/assign/:variantId
 */
export async function assignBarcode(req: Request, res: Response): Promise<void> {
  try {
    const { variantId } = req.params;
    const { barcode } = req.body;

    const result = await barcodeService.assignBarcodeToVariant(Number(variantId), barcode);

    res.json({
      success: true,
      message: 'Código de barras asignado exitosamente',
      data: result,
    });
  } catch (error: any) {
    console.error('Error assigning barcode:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al asignar código de barras',
    });
  }
}

/**
 * Asignar códigos de barras a todas las variantes sin código
 * POST /api/barcodes/assign-all
 */
export async function assignAllBarcodes(req: Request, res: Response): Promise<void> {
  try {
    const result = await barcodeService.assignBarcodeToAllVariants();

    res.json({
      success: true,
      message: `${result.success} códigos asignados, ${result.failed} fallidos`,
      data: result,
    });
  } catch (error: any) {
    console.error('Error assigning barcodes:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al asignar códigos de barras',
    });
  }
}

/**
 * Validar formato de código de barras
 * POST /api/barcodes/validate
 */
export async function validateBarcode(req: Request, res: Response): Promise<void> {
  try {
    const { barcode, type = 'ean13' } = req.body;

    if (!barcode) {
      res.status(400).json({
        success: false,
        message: 'El código de barras es requerido',
      });
      return;
    }

    const isValid = barcodeService.validateBarcode(barcode, type);

    res.json({
      success: true,
      data: {
        barcode,
        type,
        isValid,
      },
    });
  } catch (error: any) {
    console.error('Error validating barcode:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al validar código de barras',
    });
  }
}

/**
 * Generar PDF con etiquetas de códigos de barras
 * POST /api/barcodes/print
 */
export async function printBarcodeLabels(req: Request, res: Response): Promise<void> {
  try {
    const { items, templateId } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: 'El array de items es requerido',
      });
      return;
    }

    // Generar PDF con o sin plantilla personalizada
    const pdfBuffer = templateId
      ? await barcodeService.generateBarcodeLabelsPDFWithTemplate(items, Number(templateId))
      : await barcodeService.generateBarcodeLabelsPDF(items);

    // Configurar headers para descarga de PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=etiquetas-codigos-barras.pdf');
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Error generating barcode labels PDF:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al generar etiquetas',
    });
  }
}
