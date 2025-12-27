import api from './api.service';

export interface InputTypeSize {
  id: number;
  sizeId: number;
  size: {
    id: number;
    name: string;
    abbreviation: string;
    sortOrder: number;
  };
}

export interface InputType {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  hasVariants: boolean;
  isActive: boolean;
  inputTypeSizes: InputTypeSize[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInputTypeDto {
  name: string;
  slug?: string;
  description?: string;
  sortOrder?: number;
  hasVariants?: boolean;
  sizeIds?: number[];
}

export interface UpdateInputTypeDto {
  name?: string;
  slug?: string;
  description?: string;
  sortOrder?: number;
  hasVariants?: boolean;
  isActive?: boolean;
  sizeIds?: number[];
}

export const inputTypesService = {
  async getAll(): Promise<InputType[]> {
    const response = await api.get<InputType[]>('/input-types');
    return response.data || [];
  },

  async getById(id: number): Promise<InputType> {
    const response = await api.get<InputType>(`/input-types/${id}`);
    return response.data!;
  },

  async create(data: CreateInputTypeDto): Promise<InputType> {
    const response = await api.post<InputType>('/input-types', data);
    return response.data!;
  },

  async update(id: number, data: UpdateInputTypeDto): Promise<InputType> {
    const response = await api.put<InputType>(`/input-types/${id}`, data);
    return response.data!;
  },

  async delete(id: number, permanent = false): Promise<void> {
    await api.delete(`/input-types/${id}?permanent=${permanent}`);
  },
};
