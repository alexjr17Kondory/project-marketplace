import api from './api.service';

export interface Input {
  id: number;
  code: string;
  inputTypeId: number;
  name: string;
  description: string | null;
  unitOfMeasure: string;
  currentStock: number | string; // Decimal comes as string from backend
  minStock: number | string; // Decimal comes as string from backend
  maxStock: number | string | null; // Decimal comes as string from backend
  unitCost: number | string; // Decimal comes as string from backend
  supplier: string | null;
  supplierCode: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  inputType?: {
    id: number;
    name: string;
    slug: string;
  };
  _count?: {
    batches: number;
    movements: number;
    zoneInputs: number;
  };
}

export interface CreateInputDto {
  code: string;
  inputTypeId: number;
  name: string;
  description?: string;
  unitOfMeasure: string;
  minStock: number;
  maxStock?: number;
  unitCost: number;
  supplier?: string;
  supplierCode?: string;
  notes?: string;
}

export interface UpdateInputDto {
  code?: string;
  inputTypeId?: number;
  name?: string;
  description?: string;
  unitOfMeasure?: string;
  minStock?: number;
  maxStock?: number;
  unitCost?: number;
  supplier?: string;
  supplierCode?: string;
  notes?: string;
  isActive?: boolean;
}

export interface InputFilters {
  inputTypeId?: number;
  search?: string;
  lowStock?: boolean;
}

export const inputsService = {
  async getAll(filters?: InputFilters): Promise<Input[]> {
    const params = new URLSearchParams();
    if (filters?.inputTypeId) params.append('inputTypeId', filters.inputTypeId.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.lowStock) params.append('lowStock', 'true');

    const response = await api.get<Input[]>(`/inputs?${params.toString()}`);
    return response.data || [];
  },

  async getLowStock(): Promise<Input[]> {
    const response = await api.get<Input[]>('/inputs/low-stock');
    return response.data || [];
  },

  async getById(id: number): Promise<Input> {
    const response = await api.get<Input>(`/inputs/${id}`);
    return response.data!;
  },

  async create(data: CreateInputDto): Promise<Input> {
    const response = await api.post<Input>('/inputs', data);
    return response.data!;
  },

  async update(id: number, data: UpdateInputDto): Promise<Input> {
    const response = await api.put<Input>(`/inputs/${id}`, data);
    return response.data!;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/inputs/${id}`);
  },

  async recalculateStock(id: number): Promise<Input> {
    const response = await api.post<Input>(`/inputs/${id}/recalculate-stock`);
    return response.data!;
  },
};
