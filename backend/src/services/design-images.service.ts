import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface DesignImageFilters {
  isActive?: boolean;
  category?: string;
  search?: string;
}

export interface CreateDesignImageInput {
  name: string;
  description?: string;
  thumbnailUrl: string;
  fullUrl: string;
  category?: string;
  tags?: string[];
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateDesignImageInput {
  name?: string;
  description?: string;
  thumbnailUrl?: string;
  fullUrl?: string;
  category?: string;
  tags?: string[];
  sortOrder?: number;
  isActive?: boolean;
}

// Listar todas las imágenes de diseño
async function getAllDesignImages(filters?: DesignImageFilters) {
  const where: Prisma.DesignImageWhereInput = {};

  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters?.category) {
    where.category = filters.category;
  }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { description: { contains: filters.search } },
    ];
  }

  return prisma.designImage.findMany({
    where,
    orderBy: [
      { sortOrder: 'asc' },
      { name: 'asc' },
    ],
  });
}

// Obtener imagen por ID
async function getDesignImageById(id: number) {
  return prisma.designImage.findUnique({
    where: { id },
  });
}

// Obtener categorías únicas
async function getCategories() {
  const results = await prisma.designImage.findMany({
    where: { isActive: true },
    select: { category: true },
    distinct: ['category'],
  });

  return results
    .filter(r => r.category)
    .map(r => r.category as string)
    .sort();
}

// Crear imagen de diseño
async function createDesignImage(data: CreateDesignImageInput) {
  return prisma.designImage.create({
    data: {
      name: data.name,
      description: data.description,
      thumbnailUrl: data.thumbnailUrl,
      fullUrl: data.fullUrl,
      category: data.category,
      tags: data.tags,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
    },
  });
}

// Actualizar imagen de diseño
async function updateDesignImage(id: number, data: UpdateDesignImageInput) {
  return prisma.designImage.update({
    where: { id },
    data,
  });
}

// Eliminar imagen de diseño (soft delete)
async function deleteDesignImage(id: number) {
  return prisma.designImage.update({
    where: { id },
    data: { isActive: false },
  });
}

// Eliminar imagen de diseño permanentemente
async function permanentDeleteDesignImage(id: number) {
  return prisma.designImage.delete({
    where: { id },
  });
}

// Actualizar orden de varias imágenes
async function updateSortOrder(items: { id: number; sortOrder: number }[]) {
  const updates = items.map(item =>
    prisma.designImage.update({
      where: { id: item.id },
      data: { sortOrder: item.sortOrder },
    })
  );

  return prisma.$transaction(updates);
}

export const designImagesService = {
  getAllDesignImages,
  getDesignImageById,
  getCategories,
  createDesignImage,
  updateDesignImage,
  deleteDesignImage,
  permanentDeleteDesignImage,
  updateSortOrder,
};
