import api from './api.service';

export interface TemplateZone {
  id: number;
  templateId: number;
  zoneTypeId: number;
  zoneId: string; // 'front-regular', 'back-large', etc.
  name: string;
  description?: string | null;
  shape: 'rect' | 'circle' | 'polygon'; // Forma de la zona
  positionX: number;
  positionY: number;
  maxWidth: number;  // Dimensiones máximas de la zona (en %)
  maxHeight: number;
  radius?: number | null; // Para círculos
  points?: Array<{ x: number; y: number }> | null; // Para polígonos
  price: number; // Precio adicional por personalizar esta zona
  isEditable: boolean;
  isRequired: boolean;
  isBlocked: boolean; // true = zona bloqueada (roja), false = zona de diseño
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  zoneType?: {
    id: number;
    name: string;
    slug: string;
  };
  zoneInput?: ZoneInput | null;
}

export interface ZoneInput {
  id: number;
  templateZoneId: number;
  inputId: number | null;
  imageUrl: string;
  imageData?: string | null;
  originalImageData?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  input?: {
    id: number;
    name: string;
    unitOfMeasure: string;
  } | null;
}

export interface CreateTemplateZoneDto {
  templateId: number;
  zoneTypeId: number;
  zoneId?: string;
  name: string;
  description?: string;
  shape?: 'rect' | 'circle' | 'polygon';
  positionX: number;
  positionY: number;
  maxWidth: number;
  maxHeight: number;
  radius?: number;
  points?: Array<{ x: number; y: number }>;
  price?: number;
  isEditable?: boolean;
  isRequired?: boolean;
  isBlocked?: boolean;
  sortOrder?: number;
}

export interface UpdateTemplateZoneDto {
  zoneTypeId?: number;
  zoneId?: string;
  name?: string;
  description?: string;
  shape?: 'rect' | 'circle' | 'polygon';
  positionX?: number;
  positionY?: number;
  maxWidth?: number;
  maxHeight?: number;
  radius?: number;
  points?: Array<{ x: number; y: number }>;
  price?: number;
  isEditable?: boolean;
  isRequired?: boolean;
  isBlocked?: boolean;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateZoneInputDto {
  inputId?: number;
  imageUrl: string;
  imageData?: string;
  originalImageData?: string;
  fileName?: string;
  fileSize?: number;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;
  isLocked?: boolean;
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
