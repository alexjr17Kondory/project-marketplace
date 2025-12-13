import api from './api.service';

export interface DesignImage {
  id: number;
  name: string;
  description?: string;
  thumbnailUrl: string;
  fullUrl: string;
  category?: string;
  tags?: string[];
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DesignImageFilters {
  isActive?: boolean;
  category?: string;
  search?: string;
}

export interface CreateDesignImageInput {
  name: string;
  description?: string;
  thumbnailUrl: string;
  fullUrl: string;
  category?: string;
  tags?: string[];
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateDesignImageInput {
  name?: string;
  description?: string;
  thumbnailUrl?: string;
  fullUrl?: string;
  category?: string;
  tags?: string[];
  sortOrder?: number;
  isActive?: boolean;
}

// Listar todas las imágenes de diseño
async function getAll(filters?: DesignImageFilters): Promise<DesignImage[]> {
  const params = new URLSearchParams();

  if (filters?.isActive !== undefined) {
    params.append('isActive', String(filters.isActive));
  }
  if (filters?.category) {
    params.append('category', filters.category);
  }
  if (filters?.search) {
    params.append('search', filters.search);
  }

  const queryString = params.toString();
  const url = queryString ? `/design-images?${queryString}` : '/design-images';

  const response = await api.get(url);
  console.log('API response design-images:', response);
  // La respuesta viene en response.data (axios) y dentro tiene { success, data }
  const result = response.data?.data || response.data || [];
  console.log('Datos extraídos:', Array.isArray(result) ? result.length : 'no es array', result);
  return Array.isArray(result) ? result : [];
}

// Obtener imagen por ID
async function getById(id: number): Promise<DesignImage> {
  const response = await api.get(`/design-images/${id}`);
  return response.data.data;
}

// Obtener categorías únicas
async function getCategories(): Promise<string[]> {
  const response = await api.get('/design-images/categories');
  return response.data.data;
}

// Crear imagen de diseño
async function create(data: CreateDesignImageInput): Promise<DesignImage> {
  const response = await api.post('/design-images', data);
  return response.data.data;
}

// Actualizar imagen de diseño
async function update(id: number, data: UpdateDesignImageInput): Promise<DesignImage> {
  const response = await api.put(`/design-images/${id}`, data);
  return response.data.data;
}

// Eliminar imagen de diseño (soft delete)
async function remove(id: number, permanent = false): Promise<void> {
  await api.delete(`/design-images/${id}${permanent ? '?permanent=true' : ''}`);
}

// Actualizar orden de múltiples imágenes
async function updateSortOrder(items: { id: number; sortOrder: number }[]): Promise<void> {
  await api.put('/design-images/sort-order', { items });
}

export const designImagesService = {
  getAll,
  getById,
  getCategories,
  create,
  update,
  remove,
  updateSortOrder,
};
