import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/errors';

// Tipos de estado
type ConversionStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'CANCELLED';

// Interfaces de respuesta
export interface ConversionInputItemResponse {
  id: number;
  inputId: number;
  inputCode: string;
  inputName: string;
  unitOfMeasure: string;
  unitCost: number;
  quantity: number;
  totalCost: number;
  notes: string | null;
}

export interface ConversionOutputItemResponse {
  id: number;
  variantId: number;
  productName: string;
  variantSku: string;
  colorName: string | null;
  sizeName: string | null;
  unitPrice: number;
  quantity: number;
  totalValue: number;
  notes: string | null;
}

export interface InventoryConversionResponse {
  id: number;
  conversionNumber: string;
  status: ConversionStatus;
  conversionDate: Date;
  createdById: number | null;
  createdByName: string | null;
  approvedById: number | null;
  approvedByName: string | null;
  approvedAt: Date | null;
  description: string | null;
  notes: string | null;
  inputItems: ConversionInputItemResponse[];
  outputItems: ConversionOutputItemResponse[];
  totalInputCost: number;
  totalOutputCost: number;
  createdAt: Date;
  updatedAt: Date;
}

// Generar número de conversión
async function generateConversionNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.inventoryConversion.count({
    where: {
      conversionNumber: {
        startsWith: `CONV-${year}`,
      },
    },
  });
  return `CONV-${year}-${String(count + 1).padStart(4, '0')}`;
}

// Formatear respuesta
function formatConversionResponse(conversion: any): InventoryConversionResponse {
  return {
    id: conversion.id,
    conversionNumber: conversion.conversionNumber,
    status: conversion.status as ConversionStatus,
    conversionDate: conversion.conversionDate,
    createdById: conversion.createdById,
    createdByName: conversion.createdByName,
    approvedById: conversion.approvedById,
    approvedByName: conversion.approvedByName,
    approvedAt: conversion.approvedAt,
    description: conversion.description,
    notes: conversion.notes,
    inputItems: conversion.inputItems?.map((item: any) => ({
      id: item.id,
      inputId: item.inputId,
      inputCode: item.inputCode,
      inputName: item.inputName,
      unitOfMeasure: item.unitOfMeasure,
      unitCost: Number(item.unitCost),
      quantity: Number(item.quantity),
      totalCost: Number(item.totalCost),
      notes: item.notes,
    })) || [],
    outputItems: conversion.outputItems?.map((item: any) => ({
      id: item.id,
      variantId: item.variantId,
      productName: item.productName,
      variantSku: item.variantSku,
      colorName: item.colorName,
      sizeName: item.sizeName,
      unitPrice: Number(item.unitPrice),
      quantity: item.quantity,
      totalValue: Number(item.totalValue),
      notes: item.notes,
    })) || [],
    totalInputCost: Number(conversion.totalInputCost),
    totalOutputCost: Number(conversion.totalOutputCost),
    createdAt: conversion.createdAt,
    updatedAt: conversion.updatedAt,
  };
}

// Recalcular totales
async function recalculateTotals(conversionId: number): Promise<void> {
  const inputItems = await prisma.conversionInputItem.findMany({
    where: { conversionId },
  });

  const outputItems = await prisma.conversionOutputItem.findMany({
    where: { conversionId },
  });

  const totalInputCost = inputItems.reduce(
    (sum, item) => sum + Number(item.totalCost),
    0
  );

  const totalOutputCost = outputItems.reduce(
    (sum, item) => sum + Number(item.totalValue),
    0
  );

  await prisma.inventoryConversion.update({
    where: { id: conversionId },
    data: { totalInputCost, totalOutputCost },
  });
}

export const inventoryConversionsService = {
  // Listar conversiones
  async listConversions(filters?: {
    status?: ConversionStatus;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<InventoryConversionResponse[]> {
    const where: Prisma.InventoryConversionWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.fromDate || filters?.toDate) {
      where.conversionDate = {};
      if (filters.fromDate) {
        where.conversionDate.gte = filters.fromDate;
      }
      if (filters.toDate) {
        where.conversionDate.lte = filters.toDate;
      }
    }

    const conversions = await prisma.inventoryConversion.findMany({
      where,
      include: {
        inputItems: true,
        outputItems: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return conversions.map(formatConversionResponse);
  },

  // Obtener conversión por ID
  async getConversionById(id: number): Promise<InventoryConversionResponse> {
    const conversion = await prisma.inventoryConversion.findUnique({
      where: { id },
      include: {
        inputItems: {
          orderBy: { inputName: 'asc' },
        },
        outputItems: {
          orderBy: { productName: 'asc' },
        },
      },
    });

    if (!conversion) {
      throw new NotFoundError('Conversión de inventario no encontrada');
    }

    return formatConversionResponse(conversion);
  },

  // Crear conversión
  async createConversion(data: {
    conversionDate?: Date | string;
    createdById?: number;
    createdByName?: string;
    description?: string;
    notes?: string;
  }): Promise<InventoryConversionResponse> {
    const conversionNumber = await generateConversionNumber();

    // Parsear fecha si viene como string
    let parsedConversionDate: Date;
    if (data.conversionDate) {
      parsedConversionDate = typeof data.conversionDate === 'string'
        ? new Date(data.conversionDate + 'T00:00:00')
        : data.conversionDate;
    } else {
      parsedConversionDate = new Date();
    }

    const conversion = await prisma.inventoryConversion.create({
      data: {
        conversionNumber,
        status: 'DRAFT',
        conversionDate: parsedConversionDate,
        createdById: data.createdById,
        createdByName: data.createdByName,
        description: data.description,
        notes: data.notes,
      },
      include: {
        inputItems: true,
        outputItems: true,
      },
    });

    return formatConversionResponse(conversion);
  },

  // Agregar insumo a la conversión
  async addInputItem(
    conversionId: number,
    data: {
      inputId: number;
      quantity: number;
      notes?: string;
    }
  ): Promise<InventoryConversionResponse> {
    const conversion = await prisma.inventoryConversion.findUnique({
      where: { id: conversionId },
    });

    if (!conversion) {
      throw new NotFoundError('Conversión de inventario no encontrada');
    }

    if (conversion.status !== 'DRAFT') {
      throw new BadRequestError('Solo se pueden modificar conversiones en borrador');
    }

    // Obtener datos del insumo
    const input = await prisma.input.findUnique({
      where: { id: data.inputId },
    });

    if (!input) {
      throw new NotFoundError('Insumo no encontrado');
    }

    // Verificar stock disponible
    if (Number(input.currentStock) < data.quantity) {
      throw new BadRequestError(
        `Stock insuficiente de ${input.name}. Disponible: ${input.currentStock} ${input.unitOfMeasure}`
      );
    }

    // Verificar si ya existe este insumo en la conversión
    const existingItem = await prisma.conversionInputItem.findFirst({
      where: {
        conversionId,
        inputId: data.inputId,
      },
    });

    if (existingItem) {
      throw new BadRequestError('Este insumo ya está agregado a la conversión');
    }

    const totalCost = data.quantity * Number(input.unitCost);

    await prisma.conversionInputItem.create({
      data: {
        conversionId,
        inputId: data.inputId,
        inputCode: input.code,
        inputName: input.name,
        unitOfMeasure: input.unitOfMeasure,
        unitCost: input.unitCost,
        quantity: data.quantity,
        totalCost,
        notes: data.notes,
      },
    });

    // Recalcular totales
    await recalculateTotals(conversionId);

    return this.getConversionById(conversionId);
  },

  // Actualizar item de insumo
  async updateInputItem(
    conversionId: number,
    itemId: number,
    data: {
      quantity?: number;
      notes?: string;
    }
  ): Promise<InventoryConversionResponse> {
    const conversion = await prisma.inventoryConversion.findUnique({
      where: { id: conversionId },
    });

    if (!conversion) {
      throw new NotFoundError('Conversión de inventario no encontrada');
    }

    if (conversion.status !== 'DRAFT') {
      throw new BadRequestError('Solo se pueden modificar conversiones en borrador');
    }

    const item = await prisma.conversionInputItem.findFirst({
      where: { id: itemId, conversionId },
    });

    if (!item) {
      throw new NotFoundError('Item no encontrado');
    }

    // Si se actualiza cantidad, verificar stock
    if (data.quantity !== undefined) {
      const input = await prisma.input.findUnique({
        where: { id: item.inputId },
      });

      if (input && Number(input.currentStock) < data.quantity) {
        throw new BadRequestError(
          `Stock insuficiente de ${input.name}. Disponible: ${input.currentStock} ${input.unitOfMeasure}`
        );
      }

      const totalCost = data.quantity * Number(item.unitCost);
      await prisma.conversionInputItem.update({
        where: { id: itemId },
        data: {
          quantity: data.quantity,
          totalCost,
          notes: data.notes,
        },
      });
    } else if (data.notes !== undefined) {
      await prisma.conversionInputItem.update({
        where: { id: itemId },
        data: { notes: data.notes },
      });
    }

    // Recalcular totales
    await recalculateTotals(conversionId);

    return this.getConversionById(conversionId);
  },

  // Eliminar item de insumo
  async removeInputItem(
    conversionId: number,
    itemId: number
  ): Promise<InventoryConversionResponse> {
    const conversion = await prisma.inventoryConversion.findUnique({
      where: { id: conversionId },
    });

    if (!conversion) {
      throw new NotFoundError('Conversión de inventario no encontrada');
    }

    if (conversion.status !== 'DRAFT') {
      throw new BadRequestError('Solo se pueden modificar conversiones en borrador');
    }

    await prisma.conversionInputItem.delete({
      where: { id: itemId },
    });

    // Recalcular totales
    await recalculateTotals(conversionId);

    return this.getConversionById(conversionId);
  },

  // Agregar producto/variante a la conversión
  async addOutputItem(
    conversionId: number,
    data: {
      variantId: number;
      quantity: number;
      notes?: string;
    }
  ): Promise<InventoryConversionResponse> {
    const conversion = await prisma.inventoryConversion.findUnique({
      where: { id: conversionId },
    });

    if (!conversion) {
      throw new NotFoundError('Conversión de inventario no encontrada');
    }

    if (conversion.status !== 'DRAFT') {
      throw new BadRequestError('Solo se pueden modificar conversiones en borrador');
    }

    // Obtener datos de la variante
    const variant = await prisma.productVariant.findUnique({
      where: { id: data.variantId },
      include: {
        product: true,
        color: true,
        size: true,
      },
    });

    if (!variant) {
      throw new NotFoundError('Variante de producto no encontrada');
    }

    // Verificar si ya existe esta variante en la conversión
    const existingItem = await prisma.conversionOutputItem.findFirst({
      where: {
        conversionId,
        variantId: data.variantId,
      },
    });

    if (existingItem) {
      throw new BadRequestError('Esta variante ya está agregada a la conversión');
    }

    const unitPrice = Number(variant.product.basePrice) + Number(variant.priceAdjustment || 0);
    const totalValue = data.quantity * unitPrice;

    await prisma.conversionOutputItem.create({
      data: {
        conversionId,
        variantId: data.variantId,
        productName: variant.product.name,
        variantSku: variant.sku,
        colorName: variant.color?.name || null,
        sizeName: variant.size?.name || null,
        unitPrice,
        quantity: data.quantity,
        totalValue,
        notes: data.notes,
      },
    });

    // Recalcular totales
    await recalculateTotals(conversionId);

    return this.getConversionById(conversionId);
  },

  // Actualizar item de producto
  async updateOutputItem(
    conversionId: number,
    itemId: number,
    data: {
      quantity?: number;
      notes?: string;
    }
  ): Promise<InventoryConversionResponse> {
    const conversion = await prisma.inventoryConversion.findUnique({
      where: { id: conversionId },
    });

    if (!conversion) {
      throw new NotFoundError('Conversión de inventario no encontrada');
    }

    if (conversion.status !== 'DRAFT') {
      throw new BadRequestError('Solo se pueden modificar conversiones en borrador');
    }

    const item = await prisma.conversionOutputItem.findFirst({
      where: { id: itemId, conversionId },
    });

    if (!item) {
      throw new NotFoundError('Item no encontrado');
    }

    if (data.quantity !== undefined) {
      const totalValue = data.quantity * Number(item.unitPrice);
      await prisma.conversionOutputItem.update({
        where: { id: itemId },
        data: {
          quantity: data.quantity,
          totalValue,
          notes: data.notes,
        },
      });
    } else if (data.notes !== undefined) {
      await prisma.conversionOutputItem.update({
        where: { id: itemId },
        data: { notes: data.notes },
      });
    }

    // Recalcular totales
    await recalculateTotals(conversionId);

    return this.getConversionById(conversionId);
  },

  // Eliminar item de producto
  async removeOutputItem(
    conversionId: number,
    itemId: number
  ): Promise<InventoryConversionResponse> {
    const conversion = await prisma.inventoryConversion.findUnique({
      where: { id: conversionId },
    });

    if (!conversion) {
      throw new NotFoundError('Conversión de inventario no encontrada');
    }

    if (conversion.status !== 'DRAFT') {
      throw new BadRequestError('Solo se pueden modificar conversiones en borrador');
    }

    await prisma.conversionOutputItem.delete({
      where: { id: itemId },
    });

    // Recalcular totales
    await recalculateTotals(conversionId);

    return this.getConversionById(conversionId);
  },

  // Enviar a aprobación
  async submitForApproval(id: number): Promise<InventoryConversionResponse> {
    const conversion = await prisma.inventoryConversion.findUnique({
      where: { id },
      include: {
        inputItems: true,
        outputItems: true,
      },
    });

    if (!conversion) {
      throw new NotFoundError('Conversión de inventario no encontrada');
    }

    if (conversion.status !== 'DRAFT') {
      throw new BadRequestError('Solo se pueden enviar a aprobación conversiones en borrador');
    }

    // Verificar que haya items
    if (conversion.inputItems.length === 0) {
      throw new BadRequestError('Debe agregar al menos un insumo a consumir');
    }

    if (conversion.outputItems.length === 0) {
      throw new BadRequestError('Debe agregar al menos un producto a generar');
    }

    // Verificar disponibilidad de stock
    for (const item of conversion.inputItems) {
      const input = await prisma.input.findUnique({
        where: { id: item.inputId },
      });

      if (!input) {
        throw new BadRequestError(`Insumo ${item.inputName} no encontrado`);
      }

      if (Number(input.currentStock) < Number(item.quantity)) {
        throw new BadRequestError(
          `Stock insuficiente de ${item.inputName}. Disponible: ${input.currentStock} ${item.unitOfMeasure}, Requerido: ${item.quantity}`
        );
      }
    }

    const updated = await prisma.inventoryConversion.update({
      where: { id },
      data: { status: 'PENDING' },
      include: {
        inputItems: true,
        outputItems: true,
      },
    });

    return formatConversionResponse(updated);
  },

  // Aprobar conversión y aplicar cambios de inventario
  async approveConversion(
    id: number,
    data: {
      approvedById: number;
      approvedByName: string;
    }
  ): Promise<InventoryConversionResponse> {
    const conversion = await prisma.inventoryConversion.findUnique({
      where: { id },
      include: {
        inputItems: true,
        outputItems: true,
      },
    });

    if (!conversion) {
      throw new NotFoundError('Conversión de inventario no encontrada');
    }

    if (conversion.status !== 'PENDING') {
      throw new BadRequestError('Solo se pueden aprobar conversiones pendientes');
    }

    // Verificar disponibilidad de stock nuevamente
    for (const item of conversion.inputItems) {
      const input = await prisma.input.findUnique({
        where: { id: item.inputId },
      });

      if (!input) {
        throw new BadRequestError(`Insumo ${item.inputName} no encontrado`);
      }

      if (Number(input.currentStock) < Number(item.quantity)) {
        throw new BadRequestError(
          `Stock insuficiente de ${item.inputName}. Disponible: ${input.currentStock} ${item.unitOfMeasure}, Requerido: ${item.quantity}`
        );
      }
    }

    // Aplicar cambios de inventario en una transacción
    await prisma.$transaction(async (tx) => {
      // 1. Consumir insumos (reducir stock)
      for (const item of conversion.inputItems) {
        // Reducir stock del insumo
        await tx.input.update({
          where: { id: item.inputId },
          data: {
            currentStock: {
              decrement: Number(item.quantity),
            },
          },
        });

        // Buscar lote activo para registrar movimiento
        const batch = await tx.inputBatch.findFirst({
          where: {
            inputId: item.inputId,
            isActive: true,
            currentQuantity: { gte: Number(item.quantity) },
          },
          orderBy: { createdAt: 'asc' }, // FIFO
        });

        if (batch) {
          // Reducir cantidad del lote
          await tx.inputBatch.update({
            where: { id: batch.id },
            data: {
              currentQuantity: {
                decrement: Number(item.quantity),
              },
            },
          });

          // Registrar movimiento de salida
          await tx.inputBatchMovement.create({
            data: {
              inputId: item.inputId,
              inputBatchId: batch.id,
              movementType: 'SALIDA',
              quantity: -Number(item.quantity),
              referenceType: 'conversion',
              referenceId: conversion.id,
              reason: `Conversión a producto ${conversion.conversionNumber}`,
              notes: item.notes,
            },
          });
        }
      }

      // 2. Generar productos (aumentar stock de variantes)
      for (const item of conversion.outputItems) {
        // Aumentar stock de la variante
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });

        // Registrar movimiento de entrada
        await tx.variantMovement.create({
          data: {
            variantId: item.variantId,
            movementType: 'PURCHASE', // Usamos PURCHASE como tipo de entrada
            quantity: item.quantity,
            previousStock: 0, // Se actualizará si es necesario
            newStock: item.quantity,
            referenceType: 'conversion',
            referenceId: conversion.id,
            reason: `Conversión desde insumos ${conversion.conversionNumber}`,
            notes: item.notes,
          },
        });
      }

      // 3. Marcar como aprobada
      await tx.inventoryConversion.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById: data.approvedById,
          approvedByName: data.approvedByName,
          approvedAt: new Date(),
        },
      });
    });

    return this.getConversionById(id);
  },

  // Cancelar conversión
  async cancelConversion(id: number): Promise<InventoryConversionResponse> {
    const conversion = await prisma.inventoryConversion.findUnique({
      where: { id },
    });

    if (!conversion) {
      throw new NotFoundError('Conversión de inventario no encontrada');
    }

    if (conversion.status === 'APPROVED') {
      throw new BadRequestError('No se pueden cancelar conversiones aprobadas');
    }

    const updated = await prisma.inventoryConversion.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        inputItems: true,
        outputItems: true,
      },
    });

    return formatConversionResponse(updated);
  },

  // Eliminar conversión (solo borradores)
  async deleteConversion(id: number): Promise<void> {
    const conversion = await prisma.inventoryConversion.findUnique({
      where: { id },
    });

    if (!conversion) {
      throw new NotFoundError('Conversión de inventario no encontrada');
    }

    if (conversion.status !== 'DRAFT' && conversion.status !== 'CANCELLED') {
      throw new BadRequestError('Solo se pueden eliminar conversiones en borrador o canceladas');
    }

    await prisma.inventoryConversion.delete({ where: { id } });
  },

  // Obtener estadísticas
  async getConversionStats(): Promise<{
    total: number;
    byStatus: Record<ConversionStatus, number>;
    lastConversion: Date | null;
    totalInputCost: number;
    totalOutputValue: number;
  }> {
    const [total, draft, pending, approved, cancelled, totals, lastConversion] = await Promise.all([
      prisma.inventoryConversion.count(),
      prisma.inventoryConversion.count({ where: { status: 'DRAFT' } }),
      prisma.inventoryConversion.count({ where: { status: 'PENDING' } }),
      prisma.inventoryConversion.count({ where: { status: 'APPROVED' } }),
      prisma.inventoryConversion.count({ where: { status: 'CANCELLED' } }),
      prisma.inventoryConversion.aggregate({
        where: { status: 'APPROVED' },
        _sum: {
          totalInputCost: true,
          totalOutputCost: true,
        },
      }),
      prisma.inventoryConversion.findFirst({
        where: { status: 'APPROVED' },
        orderBy: { approvedAt: 'desc' },
        select: { approvedAt: true },
      }),
    ]);

    return {
      total,
      byStatus: {
        DRAFT: draft,
        PENDING: pending,
        APPROVED: approved,
        CANCELLED: cancelled,
      },
      lastConversion: lastConversion?.approvedAt || null,
      totalInputCost: Number(totals._sum.totalInputCost || 0),
      totalOutputValue: Number(totals._sum.totalOutputCost || 0),
    };
  },
};
