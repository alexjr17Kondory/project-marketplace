import { Prisma, Prisma as PrismaTypes } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';
import { generateUniqueBarcode } from './variants.service';

// Helper para manejar valores JSON nulos en Prisma
const jsonNullOrValue = (value: any): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined => {
  if (value === null) return Prisma.JsonNull;
  if (value === undefined) return undefined;
  return value;
};

// Include para templates con todas sus relaciones
const templateInclude = {
  category: {
    select: {
      slug: true,
      name: true,
    },
  },
  productType: {
    select: {
      slug: true,
      name: true,
    },
  },
  productColors: {
    include: {
      color: {
        select: {
          id: true,
          name: true,
          slug: true,
          hexCode: true,
        },
      },
    },
  },
  productSizes: {
    include: {
      size: {
        select: {
          id: true,
          name: true,
          abbreviation: true,
        },
      },
    },
  },
};

// Zona de diseño (puede ser habilitada o bloqueada)
export interface DesignZone {
  id: string;
  type: 'allowed' | 'blocked'; // 'allowed' = donde SÍ se puede poner diseño, 'blocked' = donde NO
  shape: 'rect' | 'circle' | 'polygon';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: Array<{ x: number; y: number }>;
  name?: string;
}

// Alias para compatibilidad
export type ExclusionZone = DesignZone;

export interface TemplateResponse {
  id: number;
  sku: string;
  slug: string;
  name: string;
  description: string;
  barcode: string | null;
  categoryId: number | null;
  categorySlug: string | null;
  categoryName: string | null;
  typeId: number | null;
  typeSlug: string | null;
  typeName: string | null;
  basePrice: number;
  images: { front: string; back?: string; side?: string };
  zoneTypeImages: Record<string, string> | null; // { "front": "url", "back": "url" }
  designZones: Record<string, DesignZone[]> | null; // Zonas habilitadas y bloqueadas por vista
  exclusionZones: Record<string, ExclusionZone[]> | null; // @deprecated - usar designZones
  colors: Array<{ id: number; name: string; slug: string; hexCode: string }>;
  sizes: Array<{ id: number; name: string; abbreviation: string }>;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function formatTemplateResponse(template: any): TemplateResponse {
  return {
    id: template.id,
    sku: template.sku,
    slug: template.slug,
    name: template.name,
    description: template.description,
    barcode: template.barcode || null,
    categoryId: template.categoryId,
    categorySlug: template.category?.slug || null,
    categoryName: template.category?.name || null,
    typeId: template.typeId,
    typeSlug: template.productType?.slug || null,
    typeName: template.productType?.name || null,
    basePrice: Number(template.basePrice),
    images: template.images || { front: '' },
    zoneTypeImages: template.zoneTypeImages || null,
    designZones: template.designZones || null,
    exclusionZones: template.exclusionZones || null, // @deprecated
    colors: template.productColors?.map((pc: any) => ({
      id: pc.color.id,
      name: pc.color.name,
      slug: pc.color.slug,
      hexCode: pc.color.hexCode,
    })) || [],
    sizes: template.productSizes?.map((ps: any) => ({
      id: ps.size.id,
      name: ps.size.name,
      abbreviation: ps.size.abbreviation,
    })) || [],
    tags: Array.isArray(template.tags) ? template.tags : [],
    isActive: template.isActive,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
}

// Listar todos los templates (modelos)
export async function listTemplates(): Promise<TemplateResponse[]> {
  const templates = await prisma.product.findMany({
    where: {
      isTemplate: true,
    },
    include: templateInclude,
    orderBy: { name: 'asc' },
  });

  return templates.map(formatTemplateResponse);
}

// Listar templates por tipo de producto (para el personalizador)
export async function getTemplatesByType(typeSlug: string): Promise<TemplateResponse[]> {
  const productType = await prisma.productType.findUnique({
    where: { slug: typeSlug },
    select: { id: true },
  });

  if (!productType) {
    throw new NotFoundError('Tipo de producto no encontrado');
  }

  const templates = await prisma.product.findMany({
    where: {
      isTemplate: true,
      typeId: productType.id,
      isActive: true,
    },
    include: templateInclude,
    orderBy: { name: 'asc' },
  });

  return templates.map(formatTemplateResponse);
}

// Listar templates públicos (activos)
export async function listPublicTemplates(): Promise<TemplateResponse[]> {
  const templates = await prisma.product.findMany({
    where: {
      isTemplate: true,
      isActive: true,
    },
    include: templateInclude,
    orderBy: { createdAt: 'desc' },
  });

  return templates.map(formatTemplateResponse);
}

// Obtener template por ID
export async function getTemplateById(id: number): Promise<TemplateResponse> {
  const template = await prisma.product.findFirst({
    where: {
      id,
      isTemplate: true,
    },
    include: templateInclude,
  });

  if (!template) {
    throw new NotFoundError('Template no encontrado');
  }

  return formatTemplateResponse(template);
}

// Crear template
export async function createTemplate(data: {
  name: string;
  description: string;
  sku: string;
  slug: string;
  barcode?: string;
  categoryId?: number;
  typeId?: number;
  basePrice: number;
  images: { front: string; back?: string; side?: string };
  zoneTypeImages?: Record<string, string>;
  designZones?: Record<string, DesignZone[]>;
  exclusionZones?: Record<string, ExclusionZone[]>; // @deprecated
  tags?: string[];
  colorIds?: number[];
  sizeIds?: number[];
}): Promise<TemplateResponse> {
  // Generar barcode automáticamente si no se proporciona
  let barcode = data.barcode || null;
  if (!barcode) {
    try {
      barcode = await generateUniqueBarcode();
    } catch (error) {
      // Si falla, dejar NULL (se puede asignar manualmente después)
      barcode = null;
    }
  } else {
    // Verificar que el barcode no exista
    const existingBarcode = await prisma.product.findUnique({
      where: { barcode },
    });

    if (existingBarcode) {
      throw new Error('El código de barras ya existe');
    }
  }

  const template = await prisma.product.create({
    data: {
      name: data.name,
      description: data.description,
      sku: data.sku,
      slug: data.slug,
      barcode,
      categoryId: data.categoryId || null,
      typeId: data.typeId || null,
      basePrice: data.basePrice,
      images: data.images,
      zoneTypeImages: jsonNullOrValue(data.zoneTypeImages || null),
      designZones: jsonNullOrValue(data.designZones || null),
      exclusionZones: jsonNullOrValue(data.exclusionZones || null), // @deprecated
      tags: data.tags || [],
      isTemplate: true, // Marcar como template
      isActive: true,
      featured: false,
      stock: 0, // Los templates no tienen stock
      // Crear relaciones con colores
      productColors: data.colorIds ? {
        create: data.colorIds.map((colorId) => ({
          colorId,
        })),
      } : undefined,
      // Crear relaciones con tallas
      productSizes: data.sizeIds ? {
        create: data.sizeIds.map((sizeId) => ({
          sizeId,
        })),
      } : undefined,
    },
    include: templateInclude,
  });

  return formatTemplateResponse(template);
}

// Actualizar template
export async function updateTemplate(
  id: number,
  data: {
    name?: string;
    description?: string;
    categoryId?: number | null;
    typeId?: number | null;
    basePrice?: number;
    images?: { front: string; back?: string; side?: string };
    zoneTypeImages?: Record<string, string> | null;
    designZones?: Record<string, DesignZone[]> | null;
    exclusionZones?: Record<string, ExclusionZone[]> | null; // @deprecated
    tags?: string[];
    isActive?: boolean;
    colorIds?: number[];
    sizeIds?: number[];
  }
): Promise<TemplateResponse> {
  // Verificar que existe y es un template
  const existing = await prisma.product.findFirst({
    where: { id, isTemplate: true },
  });

  if (!existing) {
    throw new NotFoundError('Template no encontrado');
  }

  // Si se proporcionan colorIds, actualizar relación
  if (data.colorIds !== undefined) {
    await prisma.productColor.deleteMany({
      where: { productId: id },
    });

    if (data.colorIds.length > 0) {
      await prisma.productColor.createMany({
        data: data.colorIds.map((colorId) => ({
          productId: id,
          colorId,
        })),
      });
    }
  }

  // Si se proporcionan sizeIds, actualizar relación
  if (data.sizeIds !== undefined) {
    await prisma.productSize.deleteMany({
      where: { productId: id },
    });

    if (data.sizeIds.length > 0) {
      await prisma.productSize.createMany({
        data: data.sizeIds.map((sizeId) => ({
          productId: id,
          sizeId,
        })),
      });
    }
  }

  const template = await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      categoryId: data.categoryId !== undefined ? data.categoryId : undefined,
      typeId: data.typeId !== undefined ? data.typeId : undefined,
      basePrice: data.basePrice,
      images: data.images,
      zoneTypeImages: data.zoneTypeImages !== undefined ? jsonNullOrValue(data.zoneTypeImages) : undefined,
      designZones: data.designZones !== undefined ? jsonNullOrValue(data.designZones) : undefined,
      exclusionZones: data.exclusionZones !== undefined ? jsonNullOrValue(data.exclusionZones) : undefined, // @deprecated
      tags: data.tags,
      isActive: data.isActive,
    },
    include: templateInclude,
  });

  return formatTemplateResponse(template);
}

// Eliminar template
export async function deleteTemplate(id: number): Promise<void> {
  const existing = await prisma.product.findFirst({
    where: { id, isTemplate: true },
  });

  if (!existing) {
    throw new NotFoundError('Template no encontrado');
  }

  await prisma.product.delete({
    where: { id },
  });
}
