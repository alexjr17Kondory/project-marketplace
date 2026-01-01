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

export interface ProductVariant {
  id: number;
  productId: number;
  colorId: number | null;
  sizeId: number | null;
  sku: string;
  barcode: string | null;
  stock: number;
  minStock: number;
  priceAdjustment: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  product: {
    id: number;
    name: string;
    sku: string;
    basePrice: number;
    images: string[];
    isTemplate: boolean;
  };
  color: {
    id: number;
    name: string;
    hexCode: string;
    slug: string;
  } | null;
  size: {
    id: number;
    name: string;
    abbreviation: string;
  } | null;
  finalPrice: number;
}

export interface CreateVariantInput {
  productId: number;
  colorId?: number | null;
  sizeId?: number | null;
  sku?: string;
  barcode?: string;
  stock?: number;
  minStock?: number;
  priceAdjustment?: number;
}

export interface UpdateVariantInput {
  sku?: string;
  barcode?: string;
  stock?: number;
  minStock?: number;
  priceAdjustment?: number;
  isActive?: boolean;
}

export interface VariantFilter {
  productId?: number;
  colorId?: number;
  sizeId?: number;
  isActive?: boolean;
  lowStock?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ==================== API ====================

/**
 * Listar variantes con filtros
 */
export async function getVariants(filter: VariantFilter = {}): Promise<ProductVariant[]> {
  const params = new URLSearchParams();

  if (filter.productId) params.append('productId', filter.productId.toString());
  if (filter.colorId) params.append('colorId', filter.colorId.toString());
  if (filter.sizeId) params.append('sizeId', filter.sizeId.toString());
  if (filter.isActive !== undefined) params.append('isActive', filter.isActive.toString());
  if (filter.lowStock) params.append('lowStock', 'true');

  const response = await axios.get(`${API_URL}/variants?${params.toString()}`, {
    headers: getAuthHeader(),
  });
  return response.data.data;
}

/**
 * Obtener una variante por ID
 */
export async function getVariantById(id: number): Promise<ProductVariant> {
  const response = await axios.get(`${API_URL}/variants/${id}`, {
    headers: getAuthHeader(),
  });
  return response.data.data;
}

/**
 * Buscar variante por código de barras
 */
export async function getVariantByBarcode(barcode: string): Promise<ProductVariant | null> {
  try {
    const response = await axios.get(`${API_URL}/variants/barcode/${barcode}`, {
      headers: getAuthHeader(),
    });
    return response.data.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Buscar variante por SKU
 */
export async function getVariantBySku(sku: string): Promise<ProductVariant | null> {
  try {
    const response = await axios.get(`${API_URL}/variants/sku/${sku}`, {
      headers: getAuthHeader(),
    });
    return response.data.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Crear una variante manualmente
 */
export async function createVariant(data: CreateVariantInput): Promise<ProductVariant> {
  const response = await axios.post(`${API_URL}/variants`, data, {
    headers: getAuthHeader(),
  });
  return response.data.data;
}

/**
 * Actualizar una variante
 */
export async function updateVariant(id: number, data: UpdateVariantInput): Promise<ProductVariant> {
  const response = await axios.patch(`${API_URL}/variants/${id}`, data, {
    headers: getAuthHeader(),
  });
  return response.data.data;
}

/**
 * Eliminar una variante
 */
export async function deleteVariant(id: number): Promise<void> {
  await axios.delete(`${API_URL}/variants/${id}`, {
    headers: getAuthHeader(),
  });
}

/**
 * Generar variantes automáticamente para un producto
 */
export async function generateVariantsForProduct(
  productId: number,
  initialStock: number = 0
): Promise<{ created: ProductVariant[]; errors: any[]; total: number }> {
  const response = await axios.post(`${API_URL}/variants/generate/${productId}`, { initialStock }, {
    headers: getAuthHeader(),
  });
  return response.data.data;
}

/**
 * Ajustar stock de una variante
 */
export async function adjustStock(
  id: number,
  quantity: number,
  reason?: string
): Promise<ProductVariant> {
  const response = await axios.post(`${API_URL}/variants/${id}/adjust-stock`, { quantity, reason }, {
    headers: getAuthHeader(),
  });
  return response.data.data;
}

/**
 * Obtener variantes con stock bajo
 */
export async function getLowStockVariants(): Promise<ProductVariant[]> {
  const response = await axios.get(`${API_URL}/variants/low-stock`, {
    headers: getAuthHeader(),
  });
  return response.data.data;
}

/**
 * Obtener solo variantes de PRODUCTOS (no templates) - con paginación del servidor
 */
export async function getProductVariants(filter: VariantFilter = {}): Promise<PaginatedResult<ProductVariant>> {
  const params = new URLSearchParams();

  if (filter.productId) params.append('productId', filter.productId.toString());
  if (filter.colorId) params.append('colorId', filter.colorId.toString());
  if (filter.sizeId) params.append('sizeId', filter.sizeId.toString());
  if (filter.isActive !== undefined) params.append('isActive', filter.isActive.toString());
  if (filter.lowStock) params.append('lowStock', 'true');
  if (filter.page) params.append('page', filter.page.toString());
  if (filter.limit) params.append('limit', filter.limit.toString());
  if (filter.search) params.append('search', filter.search);

  const response = await axios.get(`${API_URL}/variants/products?${params.toString()}`, {
    headers: getAuthHeader(),
  });
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
}

/**
 * Obtener solo variantes de TEMPLATES (plantillas) - con paginación y stock calculado desde insumos
 */
export async function getTemplateVariants(filter: VariantFilter = {}): Promise<PaginatedResult<ProductVariant>> {
  const params = new URLSearchParams();

  if (filter.productId) params.append('productId', filter.productId.toString());
  if (filter.colorId) params.append('colorId', filter.colorId.toString());
  if (filter.sizeId) params.append('sizeId', filter.sizeId.toString());
  if (filter.isActive !== undefined) params.append('isActive', filter.isActive.toString());
  if (filter.lowStock) params.append('lowStock', 'true');
  if (filter.page) params.append('page', filter.page.toString());
  if (filter.limit) params.append('limit', filter.limit.toString());
  if (filter.search) params.append('search', filter.search);

  const response = await axios.get(`${API_URL}/variants/templates?${params.toString()}`, {
    headers: getAuthHeader(),
  });
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
}

/**
 * Buscar variante por productId, colorHex y sizeName
 * Útil para verificar stock desde el carrito
 */
export async function getVariantByProductColorSize(
  productId: number,
  colorHex: string,
  sizeName: string
): Promise<ProductVariant | null> {
  try {
    const params = new URLSearchParams({
      productId: productId.toString(),
      colorHex,
      sizeName,
    });

    const response = await axios.get(`${API_URL}/variants/lookup?${params.toString()}`, {
      headers: getAuthHeader(),
    });
    return response.data.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}
