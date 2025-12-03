import { PrismaClient, Input, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

type InputWithRelations = Input & {
  inputType: {
    id: number;
    name: string;
    slug: string;
  };
  batches?: any[];
  _count?: {
    batches: number;
    movements: number;
    zoneInputs: number;
  };
};

export const inputsService = {
  // Listar todos los insumos
  async getAllInputs(filters?: {
    inputTypeId?: number;
    search?: string;
    lowStock?: boolean;
  }): Promise<InputWithRelations[]> {
    const where: Prisma.InputWhereInput = {
      isActive: true,
    };

    if (filters?.inputTypeId) {
      where.inputTypeId = filters.inputTypeId;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { code: { contains: filters.search } },
        { supplier: { contains: filters.search } },
      ];
    }

    if (filters?.lowStock) {
      where.AND = [
        { currentStock: { lte: prisma.input.fields.minStock } },
      ];
    }

    return prisma.input.findMany({
      where,
      include: {
        inputType: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            batches: true,
            movements: true,
            zoneInputs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  // Obtener insumo por ID
  async getInputById(id: number): Promise<InputWithRelations | null> {
    return prisma.input.findUnique({
      where: { id },
      include: {
        inputType: true,
        batches: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            batches: true,
            movements: true,
            zoneInputs: true,
          },
        },
      },
    });
  },

  // Obtener insumo por código
  async getInputByCode(code: string): Promise<Input | null> {
    return prisma.input.findUnique({
      where: { code },
    });
  },

  // Crear insumo
  async createInput(data: {
    code: string;
    name: string;
    description?: string;
    inputTypeId: number;
    unitOfMeasure: string;
    unitCost: number;
    minStock?: number;
    maxStock?: number;
    supplier?: string;
    supplierCode?: string;
    notes?: string;
  }): Promise<Input> {
    return prisma.input.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        inputTypeId: data.inputTypeId,
        unitOfMeasure: data.unitOfMeasure,
        unitCost: data.unitCost,
        currentStock: 0, // Se actualiza con los lotes
        minStock: data.minStock || 0,
        maxStock: data.maxStock || 0,
        supplier: data.supplier,
        supplierCode: data.supplierCode,
        notes: data.notes,
        isActive: true,
      },
    });
  },

  // Actualizar insumo
  async updateInput(
    id: number,
    data: {
      code?: string;
      name?: string;
      description?: string;
      inputTypeId?: number;
      unitOfMeasure?: string;
      unitCost?: number;
      minStock?: number;
      maxStock?: number;
      supplier?: string;
      supplierCode?: string;
      notes?: string;
      isActive?: boolean;
    }
  ): Promise<Input> {
    return prisma.input.update({
      where: { id },
      data,
    });
  },

  // Eliminar insumo (soft delete)
  async deleteInput(id: number): Promise<Input> {
    return prisma.input.update({
      where: { id },
      data: { isActive: false },
    });
  },

  // Obtener insumos con stock bajo
  async getLowStockInputs(): Promise<InputWithRelations[]> {
    return prisma.input.findMany({
      where: {
        isActive: true,
        currentStock: {
          lte: prisma.input.fields.minStock,
        },
      },
      include: {
        inputType: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { currentStock: 'asc' },
    });
  },

  // Recalcular stock actual desde los lotes
  async recalculateStock(inputId: number): Promise<Input> {
    const batches = await prisma.inputBatch.findMany({
      where: {
        inputId,
        isActive: true,
      },
      select: {
        currentQuantity: true,
      },
    });

    const totalStock = batches.reduce(
      (sum, batch) => sum + Number(batch.currentQuantity),
      0
    );

    return prisma.input.update({
      where: { id: inputId },
      data: { currentStock: totalStock },
    });
  },
};
