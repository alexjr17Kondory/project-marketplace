import api from './api.service';
import type { Product } from '../types/product';

// Helper para normalizar productos del backend
function normalizeProduct(product: any): Product {
  return {
    ...product,
    // Mapear los campos del backend a los del frontend
    category: product.categorySlug || product.category,
    type: product.typeSlug || product.type,
    // Mantener también los campos nuevos
    categorySlug: product.categorySlug,
    typeSlug: product.typeSlug,
    categoryId: product.categoryId,
    typeId: product.typeId,
    // Normalizar colores: hexCode -> hex para compatibilidad con el frontend
    colors: product.colors?.map((c: any) => ({
      ...c,
      hex: c.hexCode || c.hex, // Mantener compatibilidad con código existente
    })) || [],
    // Sizes ya vienen en el formato correcto del backend
  };
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  category?: string;
  type?: string;
  featured?: boolean;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductsResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const productsService = {
  // Obtener todos los productos con filtros
  async getAll(filters?: ProductFilters): Promise<ProductsResponse> {
    const response = await api.get<any[]>('/products', filters);
    return {
      data: (response.data || []).map(normalizeProduct),
      pagination: response.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  },

  // Obtener producto por ID
  async getById(id: number): Promise<Product | null> {
    try {
      const response = await api.get<any>(`/products/${id}`);
      return response.data ? normalizeProduct(response.data) : null;
    } catch {
      return null;
    }
  },

  // Obtener productos destacados
  async getFeatured(limit = 8): Promise<Product[]> {
    const response = await api.get<any[]>('/products/featured', { limit });
    return (response.data || []).map(normalizeProduct);
  },

  // Buscar productos
  async search(query: string, limit = 20): Promise<Product[]> {
    const response = await api.get<any[]>('/products', { search: query, limit });
    return (response.data || []).map(normalizeProduct);
  },

  // Crear producto (admin)
  async create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const response = await api.post<any>('/products', product);
    if (!response.data) throw new Error('Error creando producto');
    return normalizeProduct(response.data);
  },

  // Actualizar producto (admin)
  async update(id: number, updates: Partial<Product>): Promise<Product> {
    const response = await api.put<any>(`/products/${id}`, updates);
    if (!response.data) throw new Error('Error actualizando producto');
    return normalizeProduct(response.data);
  },

  // Eliminar producto (admin)
  async delete(id: number): Promise<void> {
    await api.delete(`/products/${id}`);
  },

  // Actualizar stock (admin)
  async updateStock(id: number, quantity: number, operation: 'add' | 'subtract' | 'set'): Promise<Product> {
    const response = await api.patch<any>(`/products/${id}/stock`, { quantity, operation });
    if (!response.data) throw new Error('Error actualizando stock');
    return normalizeProduct(response.data);
  },

  // Obtener categorías desde la tabla categories
  async getCategories(): Promise<Array<{ id: number; name: string; slug: string }>> {
    const response = await api.get<Array<{ id: number; name: string; slug: string }>>('/products/categories');
    return response.data || [];
  },

  // Obtener tipos de producto desde la tabla product_types con su categoría
  async getTypes(): Promise<Array<{ id: number; name: string; slug: string; categoryId: number | null; categorySlug: string | null }>> {
    const response = await api.get<Array<{ id: number; name: string; slug: string; categoryId: number | null; categorySlug: string | null }>>('/products/types');
    return response.data || [];
  },
};

export default productsService;
