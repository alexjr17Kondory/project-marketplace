import { PrismaClient, TemplateZone, ZoneInput } from '@prisma/client';

const prisma = new PrismaClient();

type TemplateZoneWithInput = TemplateZone & {
  zoneInput: ZoneInput | null;
  zoneType: {
    id: number;
    name: string;
    slug: string;
  };
};

export const templateZonesService = {
  // Obtener todas las zonas de un template
  async getZonesByTemplateId(templateId: number): Promise<TemplateZoneWithInput[]> {
    return prisma.templateZone.findMany({
      where: { templateId, isActive: true },
      include: {
        zoneInput: {
          include: {
            input: {
              select: {
                id: true,
                code: true,
                name: true,
                unitOfMeasure: true,
              },
            },
          },
        },
        zoneType: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  },

  // Obtener zona por ID
  async getZoneById(id: number): Promise<TemplateZoneWithInput | null> {
    return prisma.templateZone.findUnique({
      where: { id },
      include: {
        zoneInput: {
          include: {
            input: true,
          },
        },
        zoneType: true,
      },
    });
  },

  // Crear zona para un template
  async createZone(data: {
    templateId: number;
    zoneTypeId: number;
    zoneId: string;
    name: string;
    description?: string;
    shape?: string; // 'rect' | 'circle' | 'polygon'
    maxWidth: number;
    maxHeight: number;
    positionX: number;
    positionY: number;
    radius?: number; // Para círculos
    points?: Array<{ x: number; y: number }>; // Para polígonos
    isEditable?: boolean;
    isRequired?: boolean;
    isBlocked?: boolean; // true = zona bloqueada (roja)
    sortOrder?: number;
  }): Promise<TemplateZone> {
    return prisma.templateZone.create({
      data: {
        templateId: data.templateId,
        zoneTypeId: data.zoneTypeId,
        zoneId: data.zoneId,
        name: data.name,
        description: data.description,
        shape: data.shape || 'rect',
        maxWidth: data.maxWidth,
        maxHeight: data.maxHeight,
        positionX: data.positionX,
        positionY: data.positionY,
        radius: data.radius,
        points: data.points,
        isEditable: data.isEditable ?? true,
        isRequired: data.isRequired ?? false,
        isBlocked: data.isBlocked ?? false,
        sortOrder: data.sortOrder || 0,
        isActive: true,
      },
    });
  },

  // Actualizar zona
  async updateZone(
    id: number,
    data: {
      zoneTypeId?: number;
      zoneId?: string;
      name?: string;
      description?: string;
      shape?: string;
      maxWidth?: number;
      maxHeight?: number;
      positionX?: number;
      positionY?: number;
      radius?: number;
      points?: Array<{ x: number; y: number }>;
      isEditable?: boolean;
      isRequired?: boolean;
      isBlocked?: boolean;
      sortOrder?: number;
      isActive?: boolean;
    }
  ): Promise<TemplateZone> {
    return prisma.templateZone.update({
      where: { id },
      data,
    });
  },

  // Eliminar zona (soft delete)
  async deleteZone(id: number): Promise<TemplateZone> {
    return prisma.templateZone.update({
      where: { id },
      data: { isActive: false },
    });
  },

  // Eliminar permanentemente
  async permanentDeleteZone(id: number): Promise<TemplateZone> {
    return prisma.templateZone.delete({
      where: { id },
    });
  },

  // Crear/actualizar insumo de una zona
  async upsertZoneInput(
    templateZoneId: number,
    data: {
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
  ): Promise<ZoneInput> {
    // Verificar si ya existe un insumo para esta zona
    const existing = await prisma.zoneInput.findUnique({
      where: { templateZoneId },
    });

    if (existing) {
      // Actualizar
      return prisma.zoneInput.update({
        where: { templateZoneId },
        data: {
          inputId: data.inputId,
          imageUrl: data.imageUrl,
          imageData: data.imageData,
          originalImageData: data.originalImageData,
          fileName: data.fileName,
          fileSize: data.fileSize,
          positionX: data.positionX ?? existing.positionX,
          positionY: data.positionY ?? existing.positionY,
          width: data.width ?? existing.width,
          height: data.height ?? existing.height,
          rotation: data.rotation ?? existing.rotation,
          opacity: data.opacity ?? existing.opacity,
          isLocked: data.isLocked ?? existing.isLocked,
        },
      });
    } else {
      // Crear
      return prisma.zoneInput.create({
        data: {
          templateZoneId,
          inputId: data.inputId,
          imageUrl: data.imageUrl,
          imageData: data.imageData,
          originalImageData: data.originalImageData,
          fileName: data.fileName,
          fileSize: data.fileSize,
          positionX: data.positionX || 0,
          positionY: data.positionY || 0,
          width: data.width || 100,
          height: data.height || 100,
          rotation: data.rotation || 0,
          opacity: data.opacity || 1,
          isLocked: data.isLocked || false,
        },
      });
    }
  },

  // Eliminar insumo de una zona
  async deleteZoneInput(templateZoneId: number): Promise<ZoneInput> {
    return prisma.zoneInput.delete({
      where: { templateZoneId },
    });
  },
};
