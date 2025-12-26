import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeader = () => {
  const authData = localStorage.getItem('marketplace_auth');
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      return parsed.token ? { Authorization: `Bearer ${parsed.token}` } : {};
    } catch {
      return {};
    }
  }
  return {};
};

// ==================== TIPOS ====================

export interface BarcodeLabelData {
  variantId: number;
  barcode: string;
  productName: string;
  sku: string;
  color: string;
  size: string;
  price: number;
  image: string; // Base64 encoded image
}

export interface BarcodeImageOptions {
  format?: 'png' | 'svg';
  width?: number;
  height?: number;
  includeText?: boolean;
}

// ==================== API ====================

/**
 * Obtener imagen del código de barras de una variante
 * Devuelve una URL blob para mostrar la imagen
 */
export async function getVariantBarcodeImage(
  variantId: number,
  options: BarcodeImageOptions = {}
): Promise<string> {
  const params = new URLSearchParams();

  if (options.format) params.append('format', options.format);
  if (options.width) params.append('width', options.width.toString());
  if (options.height) params.append('height', options.height.toString());
  if (options.includeText !== undefined)
    params.append('includeText', options.includeText.toString());

  const response = await axios.get(`${API_URL}/barcodes/image/${variantId}?${params.toString()}`, {
    headers: getAuthHeader(),
    responseType: 'blob',
  });

  // Crear URL blob para la imagen
  return URL.createObjectURL(response.data);
}

/**
 * Generar imagen de código de barras genérico
 */
export async function generateBarcodeImage(
  barcode: string,
  options: BarcodeImageOptions = {}
): Promise<string> {
  const response = await axios.post(
    `${API_URL}/barcodes/image`,
    {
      barcode,
      ...options,
    },
    {
      headers: getAuthHeader(),
      responseType: 'blob',
    }
  );

  return URL.createObjectURL(response.data);
}

/**
 * Obtener datos completos de etiqueta para una variante
 */
export async function getVariantBarcodeLabel(variantId: number): Promise<BarcodeLabelData> {
  const response = await axios.get(`${API_URL}/barcodes/label/${variantId}`, {
    headers: getAuthHeader(),
  });
  return response.data.data;
}

/**
 * Generar etiquetas para múltiples variantes
 */
export async function generateBatchLabels(variantIds: number[]): Promise<BarcodeLabelData[]> {
  const response = await axios.post(`${API_URL}/barcodes/labels/batch`, { variantIds }, {
    headers: getAuthHeader(),
  });
  return response.data.data;
}

/**
 * Generar etiquetas para todas las variantes de un producto
 */
export async function generateProductLabels(productId: number): Promise<BarcodeLabelData[]> {
  const response = await axios.get(`${API_URL}/barcodes/labels/product/${productId}`, {
    headers: getAuthHeader(),
  });
  return response.data.data;
}

/**
 * Asignar código de barras a una variante
 */
export async function assignBarcode(
  variantId: number,
  barcode?: string
): Promise<{ variantId: number; barcode: string }> {
  const response = await axios.post(`${API_URL}/barcodes/assign/${variantId}`, { barcode }, {
    headers: getAuthHeader(),
  });
  return response.data.data;
}

/**
 * Asignar códigos de barras a todas las variantes sin código
 */
export async function assignAllBarcodes(): Promise<{
  success: number;
  failed: number;
  errors: { variantId: number; error: string }[];
}> {
  const response = await axios.post(`${API_URL}/barcodes/assign-all`, {}, {
    headers: getAuthHeader(),
  });
  return response.data.data;
}

/**
 * Validar formato de código de barras
 */
export async function validateBarcode(
  barcode: string,
  type: 'ean13' | 'code128' = 'ean13'
): Promise<{ barcode: string; type: string; isValid: boolean }> {
  const response = await axios.post(`${API_URL}/barcodes/validate`, { barcode, type }, {
    headers: getAuthHeader(),
  });
  return response.data.data;
}

/**
 * Generar PDF con etiquetas de códigos de barras
 * @param items Array de {variantId, quantity}
 * @param templateId ID de la plantilla personalizada (opcional)
 * @returns Blob con el PDF generado
 */
export async function generateBarcodeLabels(
  items: { variantId: number; quantity: number }[],
  templateId?: number
): Promise<Blob> {
  const response = await axios.post(
    `${API_URL}/barcodes/print`,
    { items, templateId },
    {
      headers: getAuthHeader(),
      responseType: 'blob',
    }
  );
  return response.data;
}
