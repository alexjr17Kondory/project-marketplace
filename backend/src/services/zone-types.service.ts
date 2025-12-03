import { PrismaClient, ZoneType } from '@prisma/client';

const prisma = new PrismaClient();

export const zoneTypesService = {
  // Listar todos los tipos de zona
  async getAllZoneTypes(): Promise<ZoneType[]> {
    return prisma.zoneType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  },

  // Obtener tipo de zona por ID
  async getZoneTypeById(id: number): Promise<ZoneType | null> {
    return prisma.zoneType.findUnique({
      where: { id },
    });
  },

  // Obtener tipo de zona por slug
  async getZoneTypeBySlug(slug: string): Promise<ZoneType | null> {
    return prisma.zoneType.findUnique({
      where: { slug },
    });
  },

  // Crear tipo de zona
  async createZoneType(data: {
    name: string;
    slug: string;
    description?: string;
    sortOrder?: number;
  }): Promise<ZoneType> {
    return prisma.zoneType.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        sortOrder: data.sortOrder || 0,
        isActive: true,
      },
    });
  },

  // Actualizar tipo de zona
  async updateZoneType(
    id: number,
    data: {
      name?: string;
      slug?: string;
      description?: string;
      sortOrder?: number;
      isActive?: boolean;
    }
  ): Promise<ZoneType> {
    return prisma.zoneType.update({
      where: { id },
      data,
    });
  },

  // Eliminar tipo de zona (soft delete)
  async deleteZoneType(id: number): Promise<ZoneType> {
    return prisma.zoneType.update({
      where: { id },
      data: { isActive: false },
    });
  },

  // Eliminar permanentemente
  async permanentDeleteZoneType(id: number): Promise<ZoneType> {
    return prisma.zoneType.delete({
      where: { id },
    });
  },
};
