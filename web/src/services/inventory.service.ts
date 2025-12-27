import api from './api.service';

export type MovementType =
  | 'PURCHASE'
  | 'SALE'
  | 'ADJUSTMENT'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'RETURN'
  | 'DAMAGE'
  | 'INITIAL';

export interface VariantMovement {
  id: number;
  variantId: number;
  movementType: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceType?: string;
  referenceId?: number;
  reason?: string;
  notes?: string;
  userId?: number;
  unitCost?: number;
  createdAt: string;
  variant?: {
    id: number;
    sku: string;
    product: { id: number; name: string; sku: string };
    color?: { id: number; name: string; hexCode: string };
    size?: { id: number; name: string; abbreviation: string };
  };
}

export interface MovementFilters {
  variantId?: number;
  productId?: number;
  movementType?: MovementType;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

export interface InventoryStats {
  totalVariants: number;
  lowStock: number;
  outOfStock: number;
  totalStock: number;
  todayMovements: number;
}

export interface LowStockVariant {
  id: number;
  sku: string;
  barcode?: string;
  stock: number;
  minStock: number;
  product: { id: number; name: string; sku: string };
  color?: { name: string; hexCode: string };
  size?: { name: string; abbreviation: string };
}

// Obtener movimientos
export async function getMovements(filters?: MovementFilters): Promise<VariantMovement[]> {
  const params = new URLSearchParams();
  if (filters?.variantId) params.append('variantId', String(filters.variantId));
  if (filters?.productId) params.append('productId', String(filters.productId));
  if (filters?.movementType) params.append('movementType', filters.movementType);
  if (filters?.fromDate) params.append('fromDate', filters.fromDate);
  if (filters?.toDate) params.append('toDate', filters.toDate);
  if (filters?.search) params.append('search', filters.search);

  const response = await api.get<VariantMovement[]>(`/inventory/movements?${params.toString()}`);
  return response.data || [];
}

// Obtener movimientos de una variante
export async function getVariantMovements(variantId: number): Promise<VariantMovement[]> {
  const response = await api.get<VariantMovement[]>(`/inventory/movements/variant/${variantId}`);
  return response.data || [];
}

// Crear movimiento
export async function createMovement(data: {
  variantId: number;
  movementType: MovementType;
  quantity: number;
  reason?: string;
  notes?: string;
  unitCost?: number;
}): Promise<VariantMovement> {
  const response = await api.post<VariantMovement>('/inventory/movements', data);
  return response.data!;
}

// Ajuste masivo
export async function bulkAdjustment(
  items: { variantId: number; newStock: number; reason?: string }[]
): Promise<VariantMovement[]> {
  const response = await api.post<VariantMovement[]>('/inventory/bulk-adjustment', { items });
  return response.data || [];
}

// Obtener estadísticas
export async function getStats(): Promise<InventoryStats> {
  const response = await api.get<InventoryStats>('/inventory/stats');
  return response.data!;
}

// Obtener variantes con stock bajo
export async function getLowStock(): Promise<LowStockVariant[]> {
  const response = await api.get<LowStockVariant[]>('/inventory/low-stock');
  return response.data || [];
}

// Obtener resumen de movimientos
export async function getSummary(fromDate?: string, toDate?: string): Promise<{ movementType: string; _count: number; _sum: { quantity: number } }[]> {
  const params = new URLSearchParams();
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);

  const response = await api.get<{ movementType: string; _count: number; _sum: { quantity: number } }[]>(`/inventory/summary?${params.toString()}`);
  return response.data || [];
}

// Helper para obtener el label del tipo de movimiento
export function getMovementTypeLabel(type: MovementType): string {
  const labels: Record<MovementType, string> = {
    PURCHASE: 'Compra',
    SALE: 'Venta',
    ADJUSTMENT: 'Ajuste',
    TRANSFER_IN: 'Transferencia Entrada',
    TRANSFER_OUT: 'Transferencia Salida',
    RETURN: 'Devolución',
    DAMAGE: 'Daño/Merma',
    INITIAL: 'Stock Inicial',
  };
  return labels[type] || type;
}

// Helper para obtener el color del tipo de movimiento
export function getMovementTypeColor(type: MovementType): string {
  const colors: Record<MovementType, string> = {
    PURCHASE: 'bg-green-100 text-green-800',
    SALE: 'bg-blue-100 text-blue-800',
    ADJUSTMENT: 'bg-yellow-100 text-yellow-800',
    TRANSFER_IN: 'bg-indigo-100 text-indigo-800',
    TRANSFER_OUT: 'bg-purple-100 text-purple-800',
    RETURN: 'bg-teal-100 text-teal-800',
    DAMAGE: 'bg-red-100 text-red-800',
    INITIAL: 'bg-gray-100 text-gray-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}

// Helper para determinar si el movimiento es entrada o salida
export function isIncoming(type: MovementType): boolean {
  return ['PURCHASE', 'TRANSFER_IN', 'RETURN', 'INITIAL'].includes(type);
}

// ============ INPUT BATCH MOVEMENTS (Insumos) ============

export type InputMovementType =
  | 'ENTRADA'
  | 'SALIDA'
  | 'AJUSTE'
  | 'RESERVA'
  | 'LIBERACION'
  | 'CONSUMO'
  | 'DEVOLUCION';

export interface InputBatchMovement {
  id: number;
  type: 'batch' | 'variant';
  inputId: number | null;
  movementType: InputMovementType;
  quantity: number | string;
  reason?: string;
  notes?: string;
  referenceType?: string;
  referenceId?: number;
  userId?: number;
  createdAt: string;
  input: {
    id: number;
    code: string;
    name: string;
    unitOfMeasure: string;
  } | null;
  inputBatch?: {
    batchNumber: string;
  } | null;
  inputVariant?: {
    id: number;
    sku: string;
    color?: {
      id: number;
      name: string;
      hexCode: string;
    };
    size?: {
      id: number;
      name: string;
      abbreviation: string;
    };
  } | null;
}

export interface InputMovementFilters {
  inputId?: number;
  movementType?: InputMovementType;
  referenceType?: string;
  limit?: number;
}

export interface InputMovementsStats {
  totalInputs: number;
  totalStock: number;
  lowStock: number;
  todayMovements: number;
}

// Obtener movimientos de insumos
export async function getInputMovements(filters?: InputMovementFilters): Promise<InputBatchMovement[]> {
  const params = new URLSearchParams();
  if (filters?.inputId) params.append('inputId', String(filters.inputId));
  if (filters?.movementType) params.append('movementType', filters.movementType);
  if (filters?.referenceType) params.append('referenceType', filters.referenceType);
  if (filters?.limit) params.append('limit', String(filters.limit));

  const response = await api.get<InputBatchMovement[]>(`/input-batches/movements/all?${params.toString()}`);
  return response.data || [];
}

// Obtener estadísticas de movimientos de insumos
export async function getInputMovementsStats(): Promise<InputMovementsStats> {
  const response = await api.get<InputMovementsStats>('/input-batches/movements/stats');
  return response.data!;
}

// Helper para obtener el label del tipo de movimiento de insumo
export function getInputMovementTypeLabel(type: InputMovementType): string {
  const labels: Record<InputMovementType, string> = {
    ENTRADA: 'Entrada',
    SALIDA: 'Salida',
    AJUSTE: 'Ajuste',
    RESERVA: 'Reserva',
    LIBERACION: 'Liberación',
    CONSUMO: 'Consumo',
    DEVOLUCION: 'Devolución',
  };
  return labels[type] || type;
}

// Helper para obtener el color del tipo de movimiento de insumo
export function getInputMovementTypeColor(type: InputMovementType): string {
  const colors: Record<InputMovementType, string> = {
    ENTRADA: 'bg-green-100 text-green-800',
    SALIDA: 'bg-red-100 text-red-800',
    AJUSTE: 'bg-yellow-100 text-yellow-800',
    RESERVA: 'bg-blue-100 text-blue-800',
    LIBERACION: 'bg-purple-100 text-purple-800',
    CONSUMO: 'bg-orange-100 text-orange-800',
    DEVOLUCION: 'bg-teal-100 text-teal-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}

// Helper para determinar si el movimiento de insumo es entrada o salida
export function isInputIncoming(type: InputMovementType): boolean {
  return ['ENTRADA', 'LIBERACION', 'DEVOLUCION'].includes(type);
}
