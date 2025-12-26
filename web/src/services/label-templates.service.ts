import api from './api.service';
import type {
  LabelTemplate,
  CreateLabelTemplateInput,
  UpdateLabelTemplateInput,
  LabelZone,
  CreateLabelZoneInput,
  UpdateLabelZoneInput,
} from '../types/label-template';

// ==================== PLANTILLAS ====================

/**
 * Obtener todas las plantillas de etiquetas
 */
export async function getLabelTemplates(includeZones: boolean = true): Promise<LabelTemplate[]> {
  const response = await api.get<LabelTemplate[]>('/label-templates', { includeZones });
  return response.data || [];
}

/**
 * Obtener plantilla por ID
 */
export async function getLabelTemplateById(id: number): Promise<LabelTemplate> {
  const response = await api.get<LabelTemplate>(`/label-templates/${id}`);
  if (!response.data) throw new Error('Plantilla no encontrada');
  return response.data;
}

/**
 * Obtener plantilla para un tipo de producto
 */
export async function getLabelTemplateForProductType(productTypeId: number): Promise<LabelTemplate> {
  const response = await api.get<LabelTemplate>(`/label-templates/product-type/${productTypeId}`);
  if (!response.data) throw new Error('Plantilla no encontrada');
  return response.data;
}

/**
 * Crear nueva plantilla
 */
export async function createLabelTemplate(data: CreateLabelTemplateInput): Promise<LabelTemplate> {
  const response = await api.post<LabelTemplate>('/label-templates', data);
  if (!response.data) throw new Error('Error al crear plantilla');
  return response.data;
}

/**
 * Actualizar plantilla
 */
export async function updateLabelTemplate(
  id: number,
  data: UpdateLabelTemplateInput
): Promise<LabelTemplate> {
  const response = await api.patch<LabelTemplate>(`/label-templates/${id}`, data);
  if (!response.data) throw new Error('Error al actualizar plantilla');
  return response.data;
}

/**
 * Eliminar plantilla
 */
export async function deleteLabelTemplate(id: number): Promise<void> {
  await api.delete(`/label-templates/${id}`);
}

/**
 * Duplicar plantilla
 */
export async function duplicateLabelTemplate(id: number, name: string): Promise<LabelTemplate> {
  const response = await api.post<LabelTemplate>(`/label-templates/${id}/duplicate`, { name });
  if (!response.data) throw new Error('Error al duplicar plantilla');
  return response.data;
}

// ==================== ZONAS ====================

/**
 * Crear zona en una plantilla
 */
export async function createLabelZone(
  templateId: number,
  data: Omit<CreateLabelZoneInput, 'labelTemplateId'>
): Promise<LabelZone> {
  const response = await api.post<LabelZone>(`/label-templates/${templateId}/zones`, data);
  if (!response.data) throw new Error('Error al crear zona');
  return response.data;
}

/**
 * Actualizar zona
 */
export async function updateLabelZone(zoneId: number, data: UpdateLabelZoneInput): Promise<LabelZone> {
  const response = await api.patch<LabelZone>(`/label-templates/zones/${zoneId}`, data);
  if (!response.data) throw new Error('Error al actualizar zona');
  return response.data;
}

/**
 * Actualizar múltiples zonas
 */
export async function updateLabelZones(
  templateId: number,
  zones: Array<{ id: number; data: UpdateLabelZoneInput }>
): Promise<LabelZone[]> {
  const response = await api.patch<LabelZone[]>(`/label-templates/${templateId}/zones/batch`, {
    zones,
  });
  return response.data || [];
}

/**
 * Eliminar zona
 */
export async function deleteLabelZone(zoneId: number): Promise<void> {
  await api.delete(`/label-templates/zones/${zoneId}`);
}
