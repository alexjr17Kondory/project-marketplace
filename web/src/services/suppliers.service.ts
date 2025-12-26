import api from './api.service';

export interface Supplier {
  id: number;
  code: string;
  name: string;
  taxId?: string;
  taxIdType?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  altPhone?: string;
  website?: string;
  address?: string;
  city?: string;
  department?: string;
  postalCode?: string;
  country: string;
  paymentTerms?: string;
  paymentMethod?: string;
  bankName?: string;
  bankAccountType?: string;
  bankAccount?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    purchaseOrders: number;
  };
}

export interface SupplierFilters {
  search?: string;
  isActive?: boolean;
  city?: string;
}

export interface SupplierStats {
  total: number;
  active: number;
  withOrders: number;
}

// Obtener todos los proveedores
export async function getSuppliers(filters?: SupplierFilters): Promise<Supplier[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
  if (filters?.city) params.append('city', filters.city);

  const response = await api.get<Supplier[]>(`/suppliers?${params.toString()}`);
  return response.data || [];
}

// Obtener un proveedor por ID
export async function getSupplierById(id: number): Promise<Supplier> {
  const response = await api.get<Supplier>(`/suppliers/${id}`);
  return response.data!;
}

// Crear proveedor
export async function createSupplier(data: Partial<Supplier>): Promise<Supplier> {
  const response = await api.post<Supplier>('/suppliers', data);
  return response.data!;
}

// Actualizar proveedor
export async function updateSupplier(id: number, data: Partial<Supplier>): Promise<Supplier> {
  const response = await api.put<Supplier>(`/suppliers/${id}`, data);
  return response.data!;
}

// Eliminar proveedor
export async function deleteSupplier(id: number): Promise<void> {
  await api.delete(`/suppliers/${id}`);
}

// Generar código
export async function generateCode(): Promise<string> {
  const response = await api.get<{ code: string }>('/suppliers/generate-code');
  return response.data!.code;
}

// Obtener estadísticas
export async function getStats(): Promise<SupplierStats> {
  const response = await api.get<SupplierStats>('/suppliers/stats');
  return response.data!;
}
