import { PrismaClient, LabelZoneType } from '@prisma/client';

const prisma = new PrismaClient();

// ==================== TIPOS ====================

export interface CreateLabelTemplateInput {
  name: string;
  productTypeIds?: number[];
  backgroundImage?: string | null;
  width?: number;
  height?: number;
  isDefault?: boolean;
}

export interface UpdateLabelTemplateInput {
  name?: string;
  productTypeIds?: number[];
  backgroundImage?: string | null;
  width?: number;
  height?: number;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface CreateLabelZoneInput {
  labelTemplateId: number;
  zoneType: LabelZoneType;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: string;
  fontColor?: string;
  showLabel?: boolean;
  rotation?: number;
  zIndex?: number;
}

export interface UpdateLabelZoneInput {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: string;
  fontColor?: string;
  showLabel?: boolean;
  rotation?: number;
  zIndex?: number;
}

// ==================== PLANTILLAS ====================

/**
 * Obtener todas las plantillas de etiquetas
 */
export async function getLabelTemplates(includeZones: boolean = true) {
  return await prisma.labelTemplate.findMany({
    where: { isActive: true },
    include: {
      productTypes: {
        include: {
          productType: true,
        },
      },
      zones: includeZones ? {
        orderBy: { zIndex: 'asc' },
      } : false,
    },
    orderBy: [
      { isDefault: 'desc' }, // Plantilla por defecto primero
      { name: 'asc' },
    ],
  });
}

/**
 * Obtener plantilla por ID
 */
export async function getLabelTemplateById(id: number) {
  const template = await prisma.labelTemplate.findUnique({
    where: { id },
    include: {
      productTypes: {
        include: {
          productType: true,
        },
      },
      zones: {
        orderBy: { zIndex: 'asc' },
      },
    },
  });

  if (!template) {
    throw new Error('Plantilla no encontrada');
  }

  return template;
}

/**
 * Obtener plantilla para un tipo de producto específico
 * Si no existe, devuelve la plantilla por defecto
 */
export async function getLabelTemplateForProductType(productTypeId: number) {
  // Buscar plantilla específica para el tipo de producto
  const specificTemplate = await prisma.labelTemplate.findFirst({
    where: {
      productTypes: {
        some: {
          productTypeId,
        },
      },
      isActive: true,
    },
    include: {
      productTypes: {
        include: {
          productType: true,
        },
      },
      zones: {
        orderBy: { zIndex: 'asc' },
      },
    },
  });

  if (specificTemplate) {
    return specificTemplate;
  }

  // Si no existe, buscar la plantilla por defecto
  const defaultTemplate = await prisma.labelTemplate.findFirst({
    where: {
      isDefault: true,
      isActive: true,
    },
    include: {
      productTypes: {
        include: {
          productType: true,
        },
      },
      zones: {
        orderBy: { zIndex: 'asc' },
      },
    },
  });

  if (!defaultTemplate) {
    throw new Error('No se encontró plantilla por defecto');
  }

  return defaultTemplate;
}

/**
 * Crear nueva plantilla de etiqueta
 */
export async function createLabelTemplate(data: CreateLabelTemplateInput) {
  // Si se marca como por defecto, desmarcar las demás
  if (data.isDefault) {
    await prisma.labelTemplate.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
  }

  const template = await prisma.labelTemplate.create({
    data: {
      name: data.name,
      backgroundImage: data.backgroundImage || null,
      width: data.width || 170.08, // 6 cm
      height: data.height || 255.12, // 9 cm
      isDefault: data.isDefault || false,
      isActive: true,
      productTypes: data.productTypeIds && data.productTypeIds.length > 0
        ? {
            create: data.productTypeIds.map(productTypeId => ({
              productTypeId,
            })),
          }
        : undefined,
    },
    include: {
      productTypes: {
        include: {
          productType: true,
        },
      },
      zones: true,
    },
  });

  return template;
}

/**
 * Actualizar plantilla de etiqueta
 */
export async function updateLabelTemplate(id: number, data: UpdateLabelTemplateInput) {
  // Verificar que existe
  const existing = await prisma.labelTemplate.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Plantilla no encontrada');
  }

  // Si se marca como por defecto, desmarcar las demás
  if (data.isDefault) {
    await prisma.labelTemplate.updateMany({
      where: {
        isDefault: true,
        id: { not: id },
      },
      data: { isDefault: false },
    });
  }

  // Si se actualizan los product types, primero eliminar los existentes
  if (data.productTypeIds !== undefined) {
    await prisma.labelTemplateProductType.deleteMany({
      where: { labelTemplateId: id },
    });
  }

  const template = await prisma.labelTemplate.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.backgroundImage !== undefined && { backgroundImage: data.backgroundImage }),
      ...(data.width && { width: data.width }),
      ...(data.height && { height: data.height }),
      ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.productTypeIds !== undefined && {
        productTypes: data.productTypeIds.length > 0
          ? {
              create: data.productTypeIds.map(productTypeId => ({
                productTypeId,
              })),
            }
          : undefined,
      }),
    },
    include: {
      productTypes: {
        include: {
          productType: true,
        },
      },
      zones: {
        orderBy: { zIndex: 'asc' },
      },
    },
  });

  return template;
}

/**
 * Eliminar plantilla de etiqueta
 */
export async function deleteLabelTemplate(id: number) {
  const template = await prisma.labelTemplate.findUnique({
    where: { id },
  });

  if (!template) {
    throw new Error('Plantilla no encontrada');
  }

  // No permitir eliminar la plantilla por defecto si es la única
  if (template.isDefault) {
    const otherTemplates = await prisma.labelTemplate.count({
      where: {
        id: { not: id },
        isActive: true,
      },
    });

    if (otherTemplates === 0) {
      throw new Error('No se puede eliminar la única plantilla por defecto');
    }
  }

  // Eliminar (las zonas se eliminan en cascada)
  await prisma.labelTemplate.delete({
    where: { id },
  });

  return { success: true };
}

// ==================== ZONAS ====================

/**
 * Crear zona en una plantilla
 */
export async function createLabelZone(data: CreateLabelZoneInput) {
  // Verificar que la plantilla existe
  const template = await prisma.labelTemplate.findUnique({
    where: { id: data.labelTemplateId },
  });

  if (!template) {
    throw new Error('Plantilla no encontrada');
  }

  // Verificar que no exista ya una zona del mismo tipo en esta plantilla
  const existingZone = await prisma.labelZone.findFirst({
    where: {
      labelTemplateId: data.labelTemplateId,
      zoneType: data.zoneType,
    },
  });

  if (existingZone) {
    throw new Error(`Ya existe una zona de tipo ${data.zoneType} en esta plantilla`);
  }

  const zone = await prisma.labelZone.create({
    data: {
      labelTemplateId: data.labelTemplateId,
      zoneType: data.zoneType,
      x: data.x,
      y: data.y,
      width: data.width,
      height: data.height,
      fontSize: data.fontSize || 10,
      fontWeight: data.fontWeight || 'normal',
      textAlign: data.textAlign || 'center',
      fontColor: data.fontColor || '#000000',
      showLabel: data.showLabel !== undefined ? data.showLabel : true,
      rotation: data.rotation || 0,
      zIndex: data.zIndex || 0,
    },
  });

  return zone;
}

/**
 * Actualizar zona
 */
export async function updateLabelZone(id: number, data: UpdateLabelZoneInput) {
  const zone = await prisma.labelZone.findUnique({
    where: { id },
  });

  if (!zone) {
    throw new Error('Zona no encontrada');
  }

  const updated = await prisma.labelZone.update({
    where: { id },
    data: {
      ...(data.x !== undefined && { x: data.x }),
      ...(data.y !== undefined && { y: data.y }),
      ...(data.width !== undefined && { width: data.width }),
      ...(data.height !== undefined && { height: data.height }),
      ...(data.fontSize !== undefined && { fontSize: data.fontSize }),
      ...(data.fontWeight && { fontWeight: data.fontWeight }),
      ...(data.textAlign && { textAlign: data.textAlign }),
      ...(data.fontColor && { fontColor: data.fontColor }),
      ...(data.showLabel !== undefined && { showLabel: data.showLabel }),
      ...(data.rotation !== undefined && { rotation: data.rotation }),
      ...(data.zIndex !== undefined && { zIndex: data.zIndex }),
    },
  });

  return updated;
}

/**
 * Actualizar múltiples zonas de una plantilla
 */
export async function updateLabelZones(
  labelTemplateId: number,
  zones: Array<{ id: number; data: UpdateLabelZoneInput }>
) {
  const template = await prisma.labelTemplate.findUnique({
    where: { id: labelTemplateId },
  });

  if (!template) {
    throw new Error('Plantilla no encontrada');
  }

  const updatedZones = [];

  for (const { id, data } of zones) {
    const zone = await updateLabelZone(id, data);
    updatedZones.push(zone);
  }

  return updatedZones;
}

/**
 * Eliminar zona
 */
export async function deleteLabelZone(id: number) {
  const zone = await prisma.labelZone.findUnique({
    where: { id },
  });

  if (!zone) {
    throw new Error('Zona no encontrada');
  }

  await prisma.labelZone.delete({
    where: { id },
  });

  return { success: true };
}

/**
 * Duplicar plantilla (crear copia)
 */
export async function duplicateLabelTemplate(id: number, newName: string) {
  const original = await prisma.labelTemplate.findUnique({
    where: { id },
    include: {
      zones: true,
      productTypes: true,
    },
  });

  if (!original) {
    throw new Error('Plantilla no encontrada');
  }

  // Crear nueva plantilla
  const newTemplate = await prisma.labelTemplate.create({
    data: {
      name: newName,
      backgroundImage: original.backgroundImage,
      width: original.width,
      height: original.height,
      isDefault: false, // La copia nunca es por defecto
      isActive: true,
      productTypes: original.productTypes.length > 0
        ? {
            create: original.productTypes.map(pt => ({
              productTypeId: pt.productTypeId,
            })),
          }
        : undefined,
    },
  });

  // Copiar zonas
  for (const zone of original.zones) {
    await prisma.labelZone.create({
      data: {
        labelTemplateId: newTemplate.id,
        zoneType: zone.zoneType,
        x: zone.x,
        y: zone.y,
        width: zone.width,
        height: zone.height,
        fontSize: zone.fontSize,
        fontWeight: zone.fontWeight,
        textAlign: zone.textAlign,
        fontColor: zone.fontColor,
        rotation: zone.rotation,
        zIndex: zone.zIndex,
      },
    });
  }

  // Retornar plantilla completa con zonas
  return await getLabelTemplateById(newTemplate.id);
}
