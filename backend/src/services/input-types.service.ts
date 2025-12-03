import { PrismaClient, InputType } from '@prisma/client';

const prisma = new PrismaClient();

export const inputTypesService = {
  // Listar todos los tipos de insumo
  async getAllInputTypes(): Promise<InputType[]> {
    return prisma.inputType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  },

  // Obtener tipo de insumo por ID
  async getInputTypeById(id: number): Promise<InputType | null> {
    return prisma.inputType.findUnique({
      where: { id },
    });
  },

  // Obtener tipo de insumo por slug
  async getInputTypeBySlug(slug: string): Promise<InputType | null> {
    return prisma.inputType.findUnique({
      where: { slug },
    });
  },

  // Crear tipo de insumo
  async createInputType(data: {
    name: string;
    slug: string;
    description?: string;
    sortOrder?: number;
  }): Promise<InputType> {
    return prisma.inputType.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        sortOrder: data.sortOrder || 0,
        isActive: true,
      },
    });
  },

  // Actualizar tipo de insumo
  async updateInputType(
    id: number,
    data: {
      name?: string;
      slug?: string;
      description?: string;
      sortOrder?: number;
      isActive?: boolean;
    }
  ): Promise<InputType> {
    return prisma.inputType.update({
      where: { id },
      data,
    });
  },

  // Eliminar tipo de insumo (soft delete)
  async deleteInputType(id: number): Promise<InputType> {
    return prisma.inputType.update({
      where: { id },
      data: { isActive: false },
    });
  },

  // Eliminar permanentemente
  async permanentDeleteInputType(id: number): Promise<InputType> {
    return prisma.inputType.delete({
      where: { id },
    });
  },
};
