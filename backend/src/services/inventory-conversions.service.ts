import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/errors';

// Tipos de estado
type ConversionStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'CANCELLED';
type ConversionType = 'MANUAL' | 'TEMPLATE';

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
  conversionType: ConversionType;
  templateId: number | null;
  templateVariantId: number | null;
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
    conversionType: conversion.conversionType as ConversionType,
    templateId: conversion.templateId,
    templateVariantId: conversion.templateVariantId,
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
      inputVariantId: item.inputVariantId,
      inputCode: item.inputCode,
      inputName: item.inputName,
      variantSku: item.variantSku,
      colorName: item.colorName,
      sizeName: item.sizeName,
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

    // If conversion has a template, load template info
    let templateInfo = null;
    if (conversion.templateId) {
      const template = await prisma.product.findUnique({
        where: { id: conversion.templateId },
        select: {
          id: true,
          name: true,
          sku: true,
        },
      });
      templateInfo = template;
    }

    const response = formatConversionResponse(conversion);
    // Add template info to response
    (response as any).template = templateInfo;

    return response;
  },

  // Crear conversión
  async createConversion(data: {
    conversionType?: ConversionType;
    templateId?: number;
    templateVariantId?: number;
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
        conversionType: data.conversionType || 'MANUAL',
        templateId: data.templateId,
        templateVariantId: data.templateVariantId,
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

  // Crear conversión desde plantilla
  async createConversionFromTemplate(data: {
    templateVariantId: number;
    outputVariantId: number;
    quantity: number;
    conversionDate?: Date | string;
    createdById?: number;
    createdByName?: string;
    description?: string;
    notes?: string;
  }): Promise<InventoryConversionResponse> {
    // Obtener la variante de plantilla con su receta
    const templateVariant = await prisma.productVariant.findUnique({
      where: { id: data.templateVariantId },
      include: {
        product: true,
        color: true,
        size: true,
        templateRecipes: {
          include: {
            inputVariant: {
              include: {
                input: true,
                color: true,
                size: true,
              },
            },
          },
        },
      },
    });

    if (!templateVariant) {
      throw new NotFoundError('Variante de plantilla no encontrada');
    }

    if (!templateVariant.product.isTemplate) {
      throw new BadRequestError('La variante no pertenece a una plantilla');
    }

    if (!templateVariant.templateRecipes || templateVariant.templateRecipes.length === 0) {
      throw new BadRequestError('La variante de plantilla no tiene recetas asociadas');
    }

    // Obtener la variante de salida
    const outputVariant = await prisma.productVariant.findUnique({
      where: { id: data.outputVariantId },
      include: {
        product: true,
        color: true,
        size: true,
      },
    });

    if (!outputVariant) {
      throw new NotFoundError('Variante de producto no encontrada');
    }

    // Verificar stock disponible para TODOS los ingredientes
    for (const recipe of templateVariant.templateRecipes) {
      const inputQuantityRequired = data.quantity * Number(recipe.quantity);
      const inputVariant = recipe.inputVariant;

      if (Number(inputVariant.currentStock) < inputQuantityRequired) {
        throw new BadRequestError(
          `Stock insuficiente de ${inputVariant.input.name} (${inputVariant.sku}). Disponible: ${inputVariant.currentStock} ${inputVariant.input.unitOfMeasure}, Requerido: ${inputQuantityRequired}`
        );
      }
    }

    // Crear conversión
    const conversion = await this.createConversion({
      conversionType: 'TEMPLATE',
      templateId: templateVariant.productId,
      templateVariantId: data.templateVariantId,
      conversionDate: data.conversionDate,
      createdById: data.createdById,
      createdByName: data.createdByName,
      description: data.description || `Conversión de plantilla: ${templateVariant.product.name}`,
      notes: data.notes,
    });

    // Agregar TODOS los insumos automáticamente
    for (const recipe of templateVariant.templateRecipes) {
      const inputQuantityRequired = data.quantity * Number(recipe.quantity);
      const inputVariant = recipe.inputVariant;

      await this.addInputItem(conversion.id, {
        inputVariantId: inputVariant.id,
        quantity: inputQuantityRequired,
        notes: `Insumo para ${data.quantity} unidades de ${templateVariant.product.name}`,
      });
    }

    // Agregar producto de salida
    await this.addOutputItem(conversion.id, {
      variantId: data.outputVariantId,
      quantity: data.quantity,
      notes: `Generado desde plantilla ${templateVariant.sku}`,
    });

    return this.getConversionById(conversion.id);
  },

  // Agregar insumo a la conversión
  async addInputItem(
    conversionId: number,
    data: {
      inputVariantId: number;
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

    // Obtener datos de la variante del insumo
    const inputVariant = await prisma.inputVariant.findUnique({
      where: { id: data.inputVariantId },
      include: {
        input: true,
        color: true,
        size: true,
      },
    });

    if (!inputVariant) {
      throw new NotFoundError('Variante de insumo no encontrada');
    }

    // Verificar stock disponible
    if (Number(inputVariant.currentStock) < data.quantity) {
      throw new BadRequestError(
        `Stock insuficiente de ${inputVariant.input.name} (${inputVariant.sku}). Disponible: ${inputVariant.currentStock} ${inputVariant.input.unitOfMeasure}`
      );
    }

    // Verificar si ya existe esta variante en la conversión
    const existingItem = await prisma.conversionInputItem.findFirst({
      where: {
        conversionId,
        inputVariantId: data.inputVariantId,
      },
    });

    if (existingItem) {
      throw new BadRequestError('Esta variante de insumo ya está agregada a la conversión');
    }

    const totalCost = data.quantity * Number(inputVariant.unitCost);

    await prisma.conversionInputItem.create({
      data: {
        conversionId,
        inputVariantId: data.inputVariantId,
        inputCode: inputVariant.input.code,
        inputName: inputVariant.input.name,
        variantSku: inputVariant.sku,
        colorName: inputVariant.color?.name || null,
        sizeName: inputVariant.size?.name || null,
        unitOfMeasure: inputVariant.input.unitOfMeasure,
        unitCost: inputVariant.unitCost,
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
      const inputVariant = await prisma.inputVariant.findUnique({
        where: { id: item.inputVariantId },
        include: { input: true },
      });

      if (inputVariant && Number(inputVariant.currentStock) < data.quantity) {
        throw new BadRequestError(
          `Stock insuficiente de ${inputVariant.input.name} (${item.variantSku}). Disponible: ${inputVariant.currentStock} ${item.unitOfMeasure}`
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
      const inputVariant = await prisma.inputVariant.findUnique({
        where: { id: item.inputVariantId },
      });

      if (!inputVariant) {
        throw new BadRequestError(`Variante de insumo ${item.inputName} (${item.variantSku}) no encontrada`);
      }

      if (Number(inputVariant.currentStock) < Number(item.quantity)) {
        throw new BadRequestError(
          `Stock insuficiente de ${item.inputName} (${item.variantSku}). Disponible: ${inputVariant.currentStock} ${item.unitOfMeasure}, Requerido: ${item.quantity}`
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
      const inputVariant = await prisma.inputVariant.findUnique({
        where: { id: item.inputVariantId },
      });

      if (!inputVariant) {
        throw new BadRequestError(`Variante de insumo ${item.inputName} (${item.variantSku}) no encontrada`);
      }

      if (Number(inputVariant.currentStock) < Number(item.quantity)) {
        throw new BadRequestError(
          `Stock insuficiente de ${item.inputName} (${item.variantSku}). Disponible: ${inputVariant.currentStock} ${item.unitOfMeasure}, Requerido: ${item.quantity}`
        );
      }
    }

    // Aplicar cambios de inventario en una transacción
    await prisma.$transaction(async (tx) => {
      // 1. Consumir insumos (reducir stock de variantes)
      for (const item of conversion.inputItems) {
        const inputVariant = await tx.inputVariant.findUnique({
          where: { id: item.inputVariantId },
        });

        if (!inputVariant) continue;

        // Reducir stock de la variante de insumo
        await tx.inputVariant.update({
          where: { id: item.inputVariantId },
          data: {
            currentStock: {
              decrement: Number(item.quantity),
            },
          },
        });

        // Registrar movimiento de salida en InputVariantMovement
        await tx.inputVariantMovement.create({
          data: {
            inputVariantId: item.inputVariantId,
            movementType: 'SALIDA',
            quantity: -Number(item.quantity),
            previousStock: Number(inputVariant.currentStock),
            newStock: Number(inputVariant.currentStock) - Number(item.quantity),
            referenceType: 'conversion',
            referenceId: conversion.id,
            reason: `Conversión a producto ${conversion.conversionNumber}`,
            notes: item.notes,
          },
        });
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
