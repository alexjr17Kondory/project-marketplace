import { PrismaClient, InputType } from '@prisma/client';

const prisma = new PrismaClient();

// Tipo extendido con relaciones
interface InputTypeWithSizes extends InputType {
  inputTypeSizes?: {
    id: number;
    sizeId: number;
    size: {
      id: number;
      name: string;
      abbreviation: string;
      sortOrder: number;
    };
  }[];
}

// Función para generar slug desde el nombre
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const inputTypesService = {
  // Listar todos los tipos de insumo
  async getAllInputTypes(): Promise<InputTypeWithSizes[]> {
    return prisma.inputType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        inputTypeSizes: {
          include: {
            size: true,
          },
          orderBy: {
            size: { sortOrder: 'asc' },
          },
        },
      },
    });
  },

  // Obtener tipo de insumo por ID
  async getInputTypeById(id: number): Promise<InputTypeWithSizes | null> {
    return prisma.inputType.findUnique({
      where: { id },
      include: {
        inputTypeSizes: {
          include: {
            size: true,
          },
          orderBy: {
            size: { sortOrder: 'asc' },
          },
        },
      },
    });
  },

  // Obtener tipo de insumo por slug
  async getInputTypeBySlug(slug: string): Promise<InputTypeWithSizes | null> {
    return prisma.inputType.findUnique({
      where: { slug },
      include: {
        inputTypeSizes: {
          include: {
            size: true,
          },
          orderBy: {
            size: { sortOrder: 'asc' },
          },
        },
      },
    });
  },

  // Crear tipo de insumo
  async createInputType(data: {
    name: string;
    slug?: string;
    description?: string;
    sortOrder?: number;
    hasVariants?: boolean;
    sizeIds?: number[];
  }): Promise<InputTypeWithSizes> {
    const slug = data.slug || generateSlug(data.name);

    return prisma.inputType.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        sortOrder: data.sortOrder || 0,
        hasVariants: data.hasVariants || false,
        isActive: true,
        // Crear relaciones con tallas si se proporcionan
        inputTypeSizes: data.sizeIds && data.sizeIds.length > 0
          ? {
              create: data.sizeIds.map((sizeId) => ({
                sizeId,
              })),
            }
          : undefined,
      },
      include: {
        inputTypeSizes: {
          include: {
            size: true,
          },
          orderBy: {
            size: { sortOrder: 'asc' },
          },
        },
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
      hasVariants?: boolean;
      isActive?: boolean;
      sizeIds?: number[];
    }
  ): Promise<InputTypeWithSizes> {
    // Si se proporcionan sizeIds, actualizamos las relaciones
    if (data.sizeIds !== undefined) {
      // Eliminar relaciones existentes
      await prisma.inputTypeSize.deleteMany({
        where: { inputTypeId: id },
      });

      // Crear nuevas relaciones
      if (data.sizeIds.length > 0) {
        await prisma.inputTypeSize.createMany({
          data: data.sizeIds.map((sizeId) => ({
            inputTypeId: id,
            sizeId,
          })),
        });
      }
    }

    // Actualizar el tipo de insumo
    const { sizeIds, ...updateData } = data;
    return prisma.inputType.update({
      where: { id },
      data: updateData,
      include: {
        inputTypeSizes: {
          include: {
            size: true,
          },
          orderBy: {
            size: { sortOrder: 'asc' },
          },
        },
      },
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

  // Agregar talla a un tipo de insumo
  async addSizeToInputType(inputTypeId: number, sizeId: number) {
    return prisma.inputTypeSize.create({
      data: {
        inputTypeId,
        sizeId,
      },
      include: {
        size: true,
      },
    });
  },

  // Remover talla de un tipo de insumo
  async removeSizeFromInputType(inputTypeId: number, sizeId: number) {
    return prisma.inputTypeSize.delete({
      where: {
        inputTypeId_sizeId: {
          inputTypeId,
          sizeId,
        },
      },
    });
  },
};
