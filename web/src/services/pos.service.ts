import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Helper para obtener token desde marketplace_auth
const getAuthToken = (): string | null => {
  const authData = localStorage.getItem('marketplace_auth');
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      return parsed.token || null;
    } catch {
      return null;
    }
  }
  return null;
};

// ==================== TYPES ====================

export interface ScanProductResponse {
  variantId: number;
  product: {
    id: number;
    name: string;
    image: string;
  };
  color: string;
  size: string;
  sku: string;
  barcode: string | null;
  price: number;
  stock: number;
  available: boolean;
}

export interface SaleItem {
  variantId: number;
  quantity: number;
  price: number;
}

export interface CalculateSaleRequest {
  items: SaleItem[];
  discount?: number;
}

export interface CalculateSaleResponse {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

export interface CreateSaleRequest {
  cashRegisterId: number;
  items: SaleItem[];
  customerId?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentMethod: 'cash' | 'card' | 'mixed';
  cashAmount?: number;
  cardAmount?: number;
  discount?: number;
  notes?: string;
}

export interface Sale {
  id: number;
  orderNumber: string;
  cashRegisterId: number;
  sellerId: number;
  customerId: number | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  items: any[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SalesHistoryFilter {
  cashRegisterId?: number;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
}

export interface ProductSearchResult {
  type: 'product';
  variantId: number;
  productId: number;
  name: string;
  image: string | null;
  color: string;
  size: string;
  sku: string;
  barcode: string | null;
  price: number;
  stock: number;
  available: boolean;
}

export interface TemplateZoneInfo {
  id: number;
  name: string;
  price: number;
  zoneType: string;
  zoneTypeSlug: string;
  isRequired: boolean;
  isBlocked: boolean;
  positionX: number;
  positionY: number;
  maxWidth: number;
  maxHeight: number;
  shape: 'rect' | 'circle' | 'polygon';
}

export interface TemplateSearchResult {
  type: 'template';
  productId: number;
  templateId: number;
  name: string;
  image: string | null;
  sku: string;
  basePrice: number;
  zoneTypeImages: Record<string, string> | null;
  scannedVariant?: {
    variantId: number;
    colorId: number | null;
    colorName: string | null;
    colorHex: string | null;
    sizeId: number | null;
    sizeName: string | null;
    sizeAbbr: string | null;
  };
  colors: Array<{
    id: number;
    name: string;
    slug: string;
    hexCode: string;
  }>;
  sizes: Array<{
    id: number;
    name: string;
    abbreviation: string;
  }>;
  zones: TemplateZoneInfo[];
}

export type SearchResult = ProductSearchResult | TemplateSearchResult;

export interface SearchResponse {
  type: 'single' | 'list';
  result?: ProductSearchResult; // For single barcode scan
  results?: SearchResult[]; // For name-based search
}

// ==================== API FUNCTIONS ====================

/**
 * Scan product by barcode
 */
export async function scanProduct(barcode: string): Promise<ScanProductResponse> {
  const response = await axios.post(
    `${API_URL}/pos/scan`,
    { barcode },
    {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    }
  );
  return response.data.data;
}

/**
 * Search products and templates by barcode or name
 */
export async function searchProductsAndTemplates(query: string): Promise<SearchResponse> {
  const response = await axios.post(
    `${API_URL}/pos/search`,
    { query },
    {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    }
  );
  return response.data.data;
}

/**
 * Calculate sale totals
 */
export async function calculateSale(
  items: SaleItem[],
  discount: number = 0
): Promise<CalculateSaleResponse> {
  const response = await axios.post(
    `${API_URL}/pos/calculate`,
    { items, discount },
    {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    }
  );
  return response.data.data;
}

/**
 * Create a POS sale
 */
export async function createSale(data: CreateSaleRequest): Promise<Sale> {
  const response = await axios.post(`${API_URL}/pos/sale`, data, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });
  return response.data.data;
}

/**
 * Cancel a POS sale
 */
export async function cancelSale(saleId: number, reason: string): Promise<Sale> {
  const response = await axios.post(
    `${API_URL}/pos/sale/${saleId}/cancel`,
    { reason },
    {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    }
  );
  return response.data.data;
}

/**
 * Get sales history
 */
export async function getSalesHistory(filter?: SalesHistoryFilter): Promise<Sale[]> {
  const params = new URLSearchParams();
  if (filter?.cashRegisterId) params.append('cashRegisterId', filter.cashRegisterId.toString());
  if (filter?.dateFrom) params.append('dateFrom', filter.dateFrom);
  if (filter?.dateTo) params.append('dateTo', filter.dateTo);
  if (filter?.status) params.append('status', filter.status);

  const response = await axios.get(`${API_URL}/pos/sales?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });
  return response.data.data;
}

/**
 * Get sale detail
 */
export async function getSaleDetail(saleId: number): Promise<Sale> {
  const response = await axios.get(`${API_URL}/pos/sale/${saleId}`, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });
  return response.data.data;
}
