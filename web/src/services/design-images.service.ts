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
  const url = queryString ? `${API_URL}/design-images?${queryString}` : `${API_URL}/design-images`;

  const response = await axios.get(url, { headers: getAuthHeader() });
  console.log('API response design-images:', response);
  // La respuesta viene en response.data (axios) y dentro tiene { success, data }
  const result = response.data?.data || response.data || [];
  console.log('Datos extraídos:', Array.isArray(result) ? result.length : 'no es array', result);
  return Array.isArray(result) ? result : [];
}

// Obtener imagen por ID
async function getById(id: number): Promise<DesignImage> {
  const response = await axios.get(`${API_URL}/design-images/${id}`, {
    headers: getAuthHeader(),
  });
  return response.data.data;
}

// Obtener categorías únicas
async function getCategories(): Promise<string[]> {
  const response = await axios.get(`${API_URL}/design-images/categories`, {
    headers: getAuthHeader(),
  });
  return response.data.data;
}

// Crear imagen de diseño
async function create(data: CreateDesignImageInput): Promise<DesignImage> {
  const response = await axios.post(`${API_URL}/design-images`, data, {
    headers: getAuthHeader(),
  });
  return response.data.data;
}

// Actualizar imagen de diseño
async function update(id: number, data: UpdateDesignImageInput): Promise<DesignImage> {
  const response = await axios.put(`${API_URL}/design-images/${id}`, data, {
    headers: getAuthHeader(),
  });
  return response.data.data;
}

// Eliminar imagen de diseño (soft delete)
async function remove(id: number, permanent = false): Promise<void> {
  await axios.delete(`${API_URL}/design-images/${id}${permanent ? '?permanent=true' : ''}`, {
    headers: getAuthHeader(),
  });
}

// Actualizar orden de múltiples imágenes
async function updateSortOrder(items: { id: number; sortOrder: number }[]): Promise<void> {
  await axios.put(`${API_URL}/design-images/sort-order`, { items }, {
    headers: getAuthHeader(),
  });
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
