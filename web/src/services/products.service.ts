import api from './api.service';
import type { Product } from '../types/product';

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
    const response = await api.get<Product[]>('/products', filters);
    return {
      data: response.data || [],
      pagination: response.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  },

  // Obtener producto por ID
  async getById(id: number): Promise<Product | null> {
    try {
      const response = await api.get<Product>(`/products/${id}`);
      return response.data || null;
    } catch {
      return null;
    }
  },

  // Obtener productos destacados
  async getFeatured(limit = 8): Promise<Product[]> {
    const response = await api.get<Product[]>('/products/featured', { limit });
    return response.data || [];
  },

  // Buscar productos
  async search(query: string, limit = 20): Promise<Product[]> {
    const response = await api.get<Product[]>('/products', { search: query, limit });
    return response.data || [];
  },

  // Crear producto (admin)
  async create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const response = await api.post<Product>('/products', product);
    if (!response.data) throw new Error('Error creando producto');
    return response.data;
  },

  // Actualizar producto (admin)
  async update(id: number, updates: Partial<Product>): Promise<Product> {
    const response = await api.put<Product>(`/products/${id}`, updates);
    if (!response.data) throw new Error('Error actualizando producto');
    return response.data;
  },

  // Eliminar producto (admin)
  async delete(id: number): Promise<void> {
    await api.delete(`/products/${id}`);
  },

  // Actualizar stock (admin)
  async updateStock(id: number, quantity: number, operation: 'add' | 'subtract' | 'set'): Promise<Product> {
    const response = await api.patch<Product>(`/products/${id}/stock`, { quantity, operation });
    if (!response.data) throw new Error('Error actualizando stock');
    return response.data;
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
