import api from './api.service';

export type InventoryCountStatus = 'DRAFT' | 'IN_PROGRESS' | 'PENDING_APPROVAL' | 'APPROVED' | 'CANCELLED';
export type InventoryCountType = 'FULL' | 'PARTIAL';

export interface InventoryCountItem {
  id: number;
  inputId: number;
  inputCode: string;
  inputName: string;
  unitOfMeasure: string;
  unitCost: number;
  systemQuantity: number;
  countedQuantity: number | null;
  difference: number | null;
  differenceValue: number | null;
  isCounted: boolean;
  notes: string | null;
}

export interface InventoryCount {
  id: number;
  countNumber: string;
  countType: InventoryCountType;
  status: InventoryCountStatus;
  countDate: string;
  countedById: number | null;
  countedByName: string | null;
  approvedById: number | null;
  approvedByName: string | null;
  approvedAt: string | null;
  notes: string | null;
  totalItems: number;
  itemsWithDiff: number;
  totalDiffValue: number;
  items: InventoryCountItem[];
  createdAt: string;
  updatedAt: string;
}

export interface InventoryCountFilters {
  status?: InventoryCountStatus;
  fromDate?: string;
  toDate?: string;
}

export interface InventoryCountStats {
  total: number;
  byStatus: Record<InventoryCountStatus, number>;
  lastCount: string | null;
}

export interface CreateInventoryCountInput {
  countType: InventoryCountType;
  countDate?: string;
  notes?: string;
  inputIds?: number[]; // Para conteo parcial
}

// Obtener todos los conteos
export async function getInventoryCounts(filters?: InventoryCountFilters): Promise<InventoryCount[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.fromDate) params.append('fromDate', filters.fromDate);
  if (filters?.toDate) params.append('toDate', filters.toDate);

  const response = await api.get<InventoryCount[]>(`/inventory-counts?${params.toString()}`);
  return response.data || [];
}

// Obtener estadísticas
export async function getStats(): Promise<InventoryCountStats> {
  const response = await api.get<InventoryCountStats>('/inventory-counts/stats');
  return response.data!;
}

// Obtener conteo por ID
export async function getInventoryCountById(id: number): Promise<InventoryCount> {
  const response = await api.get<InventoryCount>(`/inventory-counts/${id}`);
  return response.data!;
}

// Crear conteo
export async function createInventoryCount(data: CreateInventoryCountInput): Promise<InventoryCount> {
  const response = await api.post<InventoryCount>('/inventory-counts', data);
  return response.data!;
}

// Iniciar conteo
export async function startCount(id: number): Promise<InventoryCount> {
  const response = await api.patch<InventoryCount>(`/inventory-counts/${id}/start`);
  return response.data!;
}

// Actualizar cantidad contada de un item
export async function updateItemCount(
  countId: number,
  itemId: number,
  data: { countedQuantity: number; notes?: string }
): Promise<InventoryCountItem> {
  const response = await api.patch<InventoryCountItem>(
    `/inventory-counts/${countId}/items/${itemId}`,
    data
  );
  return response.data!;
}

// Enviar a aprobación
export async function submitForApproval(id: number): Promise<InventoryCount> {
  const response = await api.patch<InventoryCount>(`/inventory-counts/${id}/submit`);
  return response.data!;
}

// Aprobar conteo
export async function approveCount(id: number): Promise<InventoryCount> {
  const response = await api.patch<InventoryCount>(`/inventory-counts/${id}/approve`);
  return response.data!;
}

// Cancelar conteo
export async function cancelCount(id: number): Promise<InventoryCount> {
  const response = await api.patch<InventoryCount>(`/inventory-counts/${id}/cancel`);
  return response.data!;
}

// Eliminar conteo
export async function deleteInventoryCount(id: number): Promise<void> {
  await api.delete(`/inventory-counts/${id}`);
}

// Helpers para UI
export const STATUS_LABELS: Record<InventoryCountStatus, string> = {
  DRAFT: 'Borrador',
  IN_PROGRESS: 'En Progreso',
  PENDING_APPROVAL: 'Pendiente Aprobación',
  APPROVED: 'Aprobado',
  CANCELLED: 'Cancelado',
};

export const STATUS_COLORS: Record<InventoryCountStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export const TYPE_LABELS: Record<InventoryCountType, string> = {
  FULL: 'Completo',
  PARTIAL: 'Parcial',
};
