import { api } from './api.service';

export interface Template {
  id: number;
  sku: string;
  slug: string;
  name: string;
  description: string;
  categoryId: number | null;
  categorySlug: string | null;
  categoryName: string | null;
  typeId: number | null;
  typeSlug: string | null;
  typeName: string | null;
  basePrice: number;
  images: {
    front: string;
    back?: string;
    side?: string;
  };
  zoneTypeImages: Record<string, string> | null;
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
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTemplateInput {
  name: string;
  description: string;
  sku: string;
  slug: string;
  categoryId?: number;
  typeId?: number;
  basePrice: number;
  images: {
    front: string;
    back?: string;
    side?: string;
  };
  zoneTypeImages?: Record<string, string>;
  tags?: string[];
  colorIds?: number[];
  sizeIds?: number[];
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  categoryId?: number | null;
  typeId?: number | null;
  basePrice?: number;
  images?: {
    front: string;
    back?: string;
    side?: string;
  };
  zoneTypeImages?: Record<string, string> | null;
  tags?: string[];
  isActive?: boolean;
  colorIds?: number[];
  sizeIds?: number[];
}

class TemplatesService {
  private baseUrl = '/templates';

  // Listar todos los templates (admin)
  async getAllTemplates(): Promise<Template[]> {
    const response = await api.get<Template[]>(this.baseUrl);
    return response.data || [];
  }

  // Obtener templates por tipo de producto (para personalizador)
  async getTemplatesByType(typeSlug: string): Promise<Template[]> {
    const response = await api.get<Template[]>(
      `${this.baseUrl}/type/${typeSlug}`
    );
    return response.data || [];
  }

  // Obtener template por ID
  async getTemplateById(id: number): Promise<Template> {
    const response = await api.get<Template>(
      `${this.baseUrl}/${id}`
    );
    return response.data!;
  }

  // Crear template
  async createTemplate(data: CreateTemplateInput): Promise<Template> {
    const response = await api.post<Template>(
      this.baseUrl,
      data
    );
    return response.data!;
  }

  // Actualizar template
  async updateTemplate(id: number, data: UpdateTemplateInput): Promise<Template> {
    const response = await api.put<Template>(
      `${this.baseUrl}/${id}`,
      data
    );
    return response.data!;
  }

  // Eliminar template
  async deleteTemplate(id: number): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }
}

export const templatesService = new TemplatesService();
