import api from './api.service';

export interface ZoneType {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateZoneTypeDto {
  name: string;
  slug: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateZoneTypeDto {
  name?: string;
  slug?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export const zoneTypesService = {
  async getAll(): Promise<ZoneType[]> {
    const response = await api.get<ZoneType[]>('/zone-types');
    return response.data || [];
  },

  async getById(id: number): Promise<ZoneType> {
    const response = await api.get<ZoneType>(`/zone-types/${id}`);
    return response.data!;
  },

  async create(data: CreateZoneTypeDto): Promise<ZoneType> {
    const response = await api.post<ZoneType>('/zone-types', data);
    return response.data!;
  },

  async update(id: number, data: UpdateZoneTypeDto): Promise<ZoneType> {
    const response = await api.put<ZoneType>(`/zone-types/${id}`, data);
    return response.data!;
  },

  async delete(id: number, permanent = false): Promise<void> {
    await api.delete(`/zone-types/${id}?permanent=${permanent}`);
  },
};
