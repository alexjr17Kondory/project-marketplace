import { PrismaClient, Input, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Usamos any para evitar conflictos de tipos con Prisma Decimal
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InputWithRelations = any;

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
            hasVariants: true,
            inputTypeSizes: {
              include: {
                size: true,
              },
              orderBy: {
                size: { sortOrder: 'asc' },
              },
            },
          },
        },
        inputColors: {
          include: {
            color: true,
          },
        },
        variants: {
          where: { isActive: true },
          include: {
            color: true,
            size: true,
          },
          orderBy: [
            { color: { name: 'asc' } },
            { size: { sortOrder: 'asc' } },
          ],
        },
        _count: {
          select: {
            batches: true,
            movements: true,
            zoneInputs: true,
            variants: true,
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
        inputType: {
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
        },
        inputColors: {
          include: {
            color: true,
          },
        },
        variants: {
          where: { isActive: true },
          include: {
            color: true,
            size: true,
          },
          orderBy: [
            { color: { name: 'asc' } },
            { size: { sortOrder: 'asc' } },
          ],
        },
        batches: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            batches: true,
            movements: true,
            zoneInputs: true,
            variants: true,
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
    colorIds?: number[]; // Colores seleccionados
    sizeIds?: number[]; // Tallas seleccionadas (de las disponibles en el tipo)
  }): Promise<InputWithRelations> {
    // Verificar si el tipo de insumo tiene variantes
    const inputType = await prisma.inputType.findUnique({
      where: { id: data.inputTypeId },
      include: {
        inputTypeSizes: {
          include: { size: true },
        },
      },
    });

    const input = await prisma.input.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        inputTypeId: data.inputTypeId,
        unitOfMeasure: data.unitOfMeasure,
        unitCost: data.unitCost,
        currentStock: 0,
        minStock: data.minStock || 0,
        maxStock: data.maxStock || 0,
        supplier: data.supplier,
        supplierCode: data.supplierCode,
        notes: data.notes,
        isActive: true,
      },
    });

    // Si hay colores y tallas seleccionadas, crear variantes (como productos)
    const hasColors = data.colorIds && data.colorIds.length > 0;
    const hasSizes = data.sizeIds && data.sizeIds.length > 0;

    if (hasColors) {
      // Crear relaciones con colores
      await prisma.inputColor.createMany({
        data: data.colorIds!.map((colorId) => ({
          inputId: input.id,
          colorId,
        })),
      });

      // Si hay tallas, generar variantes (color x talla)
      if (hasSizes) {
        // Obtener las tallas seleccionadas
        const selectedSizes = await prisma.size.findMany({
          where: { id: { in: data.sizeIds } },
        });

        const variants: { inputId: number; colorId: number; sizeId: number; sku: string; unitCost: number }[] = [];

        for (const colorId of data.colorIds!) {
          for (const size of selectedSizes) {
            variants.push({
              inputId: input.id,
              colorId,
              sizeId: size.id,
              sku: `${data.code}-${colorId}-${size.abbreviation}`,
              unitCost: data.unitCost,
            });
          }
        }

        if (variants.length > 0) {
          await prisma.inputVariant.createMany({ data: variants });
        }
      }
    }

    return this.getInputById(input.id) as Promise<InputWithRelations>;
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

  // Agregar color a un insumo (y generar variantes)
  async addColorToInput(inputId: number, colorId: number): Promise<InputWithRelations> {
    const input = await prisma.input.findUnique({
      where: { id: inputId },
      include: {
        inputType: {
          include: {
            inputTypeSizes: {
              include: { size: true },
            },
          },
        },
      },
    });

    if (!input) {
      throw new Error('Insumo no encontrado');
    }

    if (!input.inputType.hasVariants) {
      throw new Error('Este tipo de insumo no soporta variantes');
    }

    // Verificar si el color ya existe
    const existingColor = await prisma.inputColor.findUnique({
      where: {
        inputId_colorId: { inputId, colorId },
      },
    });

    if (existingColor) {
      throw new Error('El color ya está asignado a este insumo');
    }

    // Crear relación con color
    await prisma.inputColor.create({
      data: { inputId, colorId },
    });

    // Generar variantes para este color
    const sizes = input.inputType.inputTypeSizes.map((its) => its.size);
    const variants = sizes.map((size) => ({
      inputId,
      colorId,
      sizeId: size.id,
      sku: `${input.code}-${colorId}-${size.abbreviation}`,
      unitCost: Number(input.unitCost),
    }));

    if (variants.length > 0) {
      await prisma.inputVariant.createMany({ data: variants });
    }

    return this.getInputById(inputId) as Promise<InputWithRelations>;
  },

  // Remover color de un insumo (y eliminar variantes)
  async removeColorFromInput(inputId: number, colorId: number): Promise<InputWithRelations> {
    // Verificar si hay variantes con stock
    const variantsWithStock = await prisma.inputVariant.findMany({
      where: {
        inputId,
        colorId,
        currentStock: { gt: 0 },
      },
    });

    if (variantsWithStock.length > 0) {
      throw new Error('No se puede eliminar el color porque hay variantes con stock');
    }

    // Eliminar variantes
    await prisma.inputVariant.deleteMany({
      where: { inputId, colorId },
    });

    // Eliminar relación con color
    await prisma.inputColor.delete({
      where: {
        inputId_colorId: { inputId, colorId },
      },
    });

    return this.getInputById(inputId) as Promise<InputWithRelations>;
  },

  // Actualizar variante de insumo
  async updateInputVariant(
    variantId: number,
    data: {
      unitCost?: number;
      minStock?: number;
      maxStock?: number;
      isActive?: boolean;
    }
  ) {
    return prisma.inputVariant.update({
      where: { id: variantId },
      data,
      include: {
        color: true,
        size: true,
      },
    });
  },

  // Obtener variante por ID
  async getInputVariantById(variantId: number) {
    return prisma.inputVariant.findUnique({
      where: { id: variantId },
      include: {
        input: {
          include: {
            inputType: true,
          },
        },
        color: true,
        size: true,
      },
    });
  },

  // Obtener variantes de un insumo
  async getInputVariants(inputId: number) {
    return prisma.inputVariant.findMany({
      where: {
        inputId,
        isActive: true,
      },
      include: {
        color: true,
        size: true,
      },
      orderBy: [
        { color: { name: 'asc' } },
        { size: { sortOrder: 'asc' } },
      ],
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
            hasVariants: true,
          },
        },
      },
      orderBy: { currentStock: 'asc' },
    }) as Promise<InputWithRelations[]>;
  },

  // Recalcular stock actual desde los lotes (para insumos sin variantes)
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

  // Recalcular stock de una variante
  async recalculateVariantStock(variantId: number) {
    // Por ahora solo actualizamos el stock directamente
    // En el futuro se puede agregar lógica de lotes para variantes
    return prisma.inputVariant.findUnique({
      where: { id: variantId },
    });
  },

  // Actualizar stock de variante (usado en compras)
  async updateVariantStock(variantId: number, quantity: number, operation: 'add' | 'subtract') {
    const variant = await prisma.inputVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      throw new Error('Variante no encontrada');
    }

    const newStock = operation === 'add'
      ? Number(variant.currentStock) + quantity
      : Number(variant.currentStock) - quantity;

    if (newStock < 0) {
      throw new Error('Stock insuficiente');
    }

    return prisma.inputVariant.update({
      where: { id: variantId },
      data: { currentStock: newStock },
    });
  },

  // Obtener movimientos de una variante de insumo
  async getVariantMovements(variantId: number, limit?: number) {
    return prisma.inputVariantMovement.findMany({
      where: { inputVariantId: variantId },
      orderBy: { createdAt: 'desc' },
      take: limit || 50,
    });
  },

  // Regenerar variantes (cuando cambian las tallas del tipo)
  async regenerateVariants(inputId: number): Promise<InputWithRelations> {
    const input = await prisma.input.findUnique({
      where: { id: inputId },
      include: {
        inputType: {
          include: {
            inputTypeSizes: {
              include: { size: true },
            },
          },
        },
        inputColors: true,
        variants: true,
      },
    });

    if (!input || !input.inputType.hasVariants) {
      throw new Error('Insumo no válido para regenerar variantes');
    }

    const sizes = input.inputType.inputTypeSizes.map((its) => its.size);
    const colors = input.inputColors.map((ic) => ic.colorId);

    // Crear nuevas variantes que no existan
    for (const colorId of colors) {
      for (const size of sizes) {
        const existing = input.variants.find(
          (v) => v.colorId === colorId && v.sizeId === size.id
        );

        if (!existing) {
          await prisma.inputVariant.create({
            data: {
              inputId,
              colorId,
              sizeId: size.id,
              sku: `${input.code}-${colorId}-${size.abbreviation}`,
              unitCost: Number(input.unitCost),
            },
          });
        }
      }
    }

    return this.getInputById(inputId) as Promise<InputWithRelations>;
  },
};
