import api from './api.service';

export interface TemplateZone {
  id: number;
  templateId: number;
  zoneTypeId: number;
  name: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  isRequired: boolean;
  maxCharacters: number | null;
  allowedColors: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  zoneType?: {
    id: number;
    name: string;
    slug: string;
  };
  zoneInput?: ZoneInput;
}

export interface ZoneInput {
  id: number;
  zoneId: number;
  inputId: number;
  quantityPerUnit: number;
  createdAt: string;
  updatedAt: string;
  input?: {
    id: number;
    name: string;
    unit: string;
  };
}

export interface CreateTemplateZoneDto {
  templateId: number;
  zoneTypeId: number;
  name: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  isRequired?: boolean;
  maxCharacters?: number;
  allowedColors?: string;
  sortOrder?: number;
}

export interface UpdateTemplateZoneDto {
  zoneTypeId?: number;
  name?: string;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  isRequired?: boolean;
  maxCharacters?: number;
  allowedColors?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateZoneInputDto {
  inputId: number;
  quantityPerUnit: number;
}

export const templateZonesService = {
  async getByTemplateId(templateId: number): Promise<TemplateZone[]> {
    const response = await api.get<TemplateZone[]>(`/template-zones/template/${templateId}`);
    return response.data || [];
  },

  async getById(id: number): Promise<TemplateZone> {
    const response = await api.get<TemplateZone>(`/template-zones/${id}`);
    return response.data!;
  },

  async create(data: CreateTemplateZoneDto): Promise<TemplateZone> {
    const response = await api.post<TemplateZone>(`/template-zones/template/${data.templateId}`, data);
    return response.data!;
  },

  async update(id: number, data: UpdateTemplateZoneDto): Promise<TemplateZone> {
    const response = await api.put<TemplateZone>(`/template-zones/${id}`, data);
    return response.data!;
  },

  async delete(id: number, permanent = false): Promise<void> {
    await api.delete(`/template-zones/${id}?permanent=${permanent}`);
  },

  async upsertZoneInput(zoneId: number, data: CreateZoneInputDto): Promise<ZoneInput> {
    const response = await api.post<ZoneInput>(`/template-zones/${zoneId}/input`, data);
    return response.data!;
  },

  async deleteZoneInput(zoneId: number): Promise<void> {
    await api.delete(`/template-zones/${zoneId}/input`);
  },
};
