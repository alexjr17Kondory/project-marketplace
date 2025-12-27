import { PrismaClient, InputBatch, InputBatchMovement, MovementType, Prisma } from '@prisma/client';
import { inputsService } from './inputs.service';

const prisma = new PrismaClient();

type InputBatchWithRelations = InputBatch & {
  input: {
    id: number;
    code: string;
    name: string;
    unitOfMeasure: string;
  };
  movements?: InputBatchMovement[];
};

export const inputBatchesService = {
  // Listar lotes por insumo
  async getBatchesByInputId(inputId: number): Promise<InputBatchWithRelations[]> {
    return prisma.inputBatch.findMany({
      where: { inputId, isActive: true },
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
      orderBy: { createdAt: 'desc' },
    });
  },

  // Obtener lote por ID
  async getBatchById(id: number): Promise<InputBatchWithRelations | null> {
    return prisma.inputBatch.findUnique({
      where: { id },
      include: {
        input: true,
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });
  },

  // Crear lote (entrada de inventario)
  async createBatch(data: {
    inputId: number;
    batchNumber: string;
    supplier?: string;
    invoiceRef?: string;
    initialQuantity: number;
    unitCost: number;
    purchaseDate?: Date;
    expiryDate?: Date;
    notes?: string;
    userId?: number;
  }): Promise<InputBatch> {
    const totalCost = data.initialQuantity * data.unitCost;

    // Crear lote
    const batch = await prisma.inputBatch.create({
      data: {
        inputId: data.inputId,
        batchNumber: data.batchNumber,
        supplier: data.supplier,
        invoiceRef: data.invoiceRef,
        initialQuantity: data.initialQuantity,
        currentQuantity: data.initialQuantity, // Al inicio, current = initial
        reservedQuantity: 0,
        unitCost: data.unitCost,
        totalCost,
        purchaseDate: data.purchaseDate,
        expiryDate: data.expiryDate,
        notes: data.notes,
        isActive: true,
      },
    });

    // Registrar movimiento de ENTRADA
    await this.createMovement({
      inputId: data.inputId,
      inputBatchId: batch.id,
      movementType: 'ENTRADA',
      quantity: data.initialQuantity,
      reason: `Entrada de lote ${data.batchNumber}`,
      notes: data.notes,
      referenceType: 'purchase',
      userId: data.userId,
    });

    // Recalcular stock del insumo
    await inputsService.recalculateStock(data.inputId);

    return batch;
  },

  // Actualizar lote
  async updateBatch(
    id: number,
    data: {
      batchNumber?: string;
      supplier?: string;
      invoiceRef?: string;
      purchaseDate?: Date;
      expiryDate?: Date;
      notes?: string;
      isActive?: boolean;
    }
  ): Promise<InputBatch> {
    return prisma.inputBatch.update({
      where: { id },
      data,
    });
  },

  // Ajustar cantidad del lote
  async adjustBatchQuantity(
    id: number,
    newQuantity: number,
    reason: string,
    userId?: number
  ): Promise<InputBatch> {
    const batch = await prisma.inputBatch.findUnique({
      where: { id },
    });

    if (!batch) {
      throw new Error('Lote no encontrado');
    }

    const difference = newQuantity - Number(batch.currentQuantity);

    // Actualizar cantidad del lote
    const updated = await prisma.inputBatch.update({
      where: { id },
      data: { currentQuantity: newQuantity },
    });

    // Registrar movimiento de AJUSTE
    await this.createMovement({
      inputId: batch.inputId,
      inputBatchId: id,
      movementType: 'AJUSTE',
      quantity: Math.abs(difference),
      reason: reason,
      referenceType: 'adjustment',
      userId,
    });

    // Recalcular stock del insumo
    await inputsService.recalculateStock(batch.inputId);

    return updated;
  },

  // Reservar cantidad del lote (para una orden)
  async reserveFromBatch(
    id: number,
    quantity: number,
    orderId: number,
    userId?: number
  ): Promise<InputBatch> {
    const batch = await prisma.inputBatch.findUnique({
      where: { id },
    });

    if (!batch) {
      throw new Error('Lote no encontrado');
    }

    const available = Number(batch.currentQuantity) - Number(batch.reservedQuantity);
    if (available < quantity) {
      throw new Error(`Stock insuficiente. Disponible: ${available}, Solicitado: ${quantity}`);
    }

    // Actualizar reservas
    const updated = await prisma.inputBatch.update({
      where: { id },
      data: {
        reservedQuantity: Number(batch.reservedQuantity) + quantity,
        currentQuantity: Number(batch.currentQuantity) - quantity,
      },
    });

    // Registrar movimiento de RESERVA
    await this.createMovement({
      inputId: batch.inputId,
      inputBatchId: id,
      movementType: 'RESERVA',
      quantity,
      reason: `Reserva para orden #${orderId}`,
      referenceType: 'order',
      referenceId: orderId,
      userId,
    });

    // Recalcular stock del insumo
    await inputsService.recalculateStock(batch.inputId);

    return updated;
  },

  // Liberar reserva del lote
  async releaseReservation(
    id: number,
    quantity: number,
    orderId: number,
    userId?: number
  ): Promise<InputBatch> {
    const batch = await prisma.inputBatch.findUnique({
      where: { id },
    });

    if (!batch) {
      throw new Error('Lote no encontrado');
    }

    // Actualizar reservas
    const updated = await prisma.inputBatch.update({
      where: { id },
      data: {
        reservedQuantity: Number(batch.reservedQuantity) - quantity,
        currentQuantity: Number(batch.currentQuantity) + quantity,
      },
    });

    // Registrar movimiento de LIBERACION
    await this.createMovement({
      inputId: batch.inputId,
      inputBatchId: id,
      movementType: 'LIBERACION',
      quantity,
      reason: `Liberación de reserva de orden #${orderId}`,
      referenceType: 'order',
      referenceId: orderId,
      userId,
    });

    // Recalcular stock del insumo
    await inputsService.recalculateStock(batch.inputId);

    return updated;
  },

  // Registrar salida (uso en producción)
  async recordOutput(
    id: number,
    quantity: number,
    productionId: number,
    userId?: number
  ): Promise<InputBatch> {
    const batch = await prisma.inputBatch.findUnique({
      where: { id },
    });

    if (!batch) {
      throw new Error('Lote no encontrado');
    }

    // Reducir de reservas (se asume que ya estaba reservado)
    const updated = await prisma.inputBatch.update({
      where: { id },
      data: {
        reservedQuantity: Number(batch.reservedQuantity) - quantity,
      },
    });

    // Registrar movimiento de SALIDA
    await this.createMovement({
      inputId: batch.inputId,
      inputBatchId: id,
      movementType: 'SALIDA',
      quantity,
      reason: `Uso en producción #${productionId}`,
      referenceType: 'production',
      referenceId: productionId,
      userId,
    });

    // Recalcular stock del insumo
    await inputsService.recalculateStock(batch.inputId);

    return updated;
  },

  // Crear movimiento de inventario
  async createMovement(data: {
    inputId: number;
    inputBatchId: number;
    movementType: MovementType;
    quantity: number;
    reason?: string;
    notes?: string;
    referenceType?: string;
    referenceId?: number;
    userId?: number;
  }): Promise<InputBatchMovement> {
    return prisma.inputBatchMovement.create({
      data: {
        inputId: data.inputId,
        inputBatchId: data.inputBatchId,
        movementType: data.movementType,
        quantity: data.quantity,
        reason: data.reason,
        notes: data.notes,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        userId: data.userId,
      },
    });
  },

  // Obtener todos los movimientos de insumos con filtros (incluye batch y variant movements)
  async getAllMovements(filters: {
    inputId?: number;
    movementType?: MovementType;
    referenceType?: string;
    limit?: number;
  } = {}): Promise<any[]> {
    const limitPerType = Math.ceil((filters.limit || 500) / 2);

    // Fetch InputBatchMovement
    const batchWhere: Prisma.InputBatchMovementWhereInput = {};
    if (filters.inputId) {
      batchWhere.inputId = filters.inputId;
    }
    if (filters.movementType) {
      batchWhere.movementType = filters.movementType;
    }
    if (filters.referenceType) {
      batchWhere.referenceType = filters.referenceType;
    }

    const batchMovements = await prisma.inputBatchMovement.findMany({
      where: batchWhere,
      orderBy: { createdAt: 'desc' },
      take: limitPerType,
      include: {
        input: {
          select: {
            id: true,
            code: true,
            name: true,
            unitOfMeasure: true,
          },
        },
        inputBatch: {
          select: {
            batchNumber: true,
          },
        },
      },
    });

    // Fetch InputVariantMovement
    const variantWhere: Prisma.InputVariantMovementWhereInput = {};
    if (filters.movementType) {
      variantWhere.movementType = filters.movementType;
    }
    if (filters.referenceType) {
      variantWhere.referenceType = filters.referenceType;
    }

    const variantMovements = await prisma.inputVariantMovement.findMany({
      where: variantWhere,
      orderBy: { createdAt: 'desc' },
      take: limitPerType,
      include: {
        inputVariant: {
          include: {
            input: {
              select: {
                id: true,
                code: true,
                name: true,
                unitOfMeasure: true,
              },
            },
            color: {
              select: {
                id: true,
                name: true,
                hexCode: true,
              },
            },
            size: {
              select: {
                id: true,
                name: true,
                abbreviation: true,
              },
            },
          },
        },
      },
    });

    // Combine and normalize both types of movements
    const normalizedBatchMovements = batchMovements.map((m) => ({
      id: m.id,
      type: 'batch' as const,
      inputId: m.inputId,
      movementType: m.movementType,
      quantity: m.quantity,
      reason: m.reason,
      notes: m.notes,
      referenceType: m.referenceType,
      referenceId: m.referenceId,
      userId: m.userId,
      createdAt: m.createdAt,
      input: m.input,
      inputBatch: m.inputBatch,
      inputVariant: null,
    }));

    const normalizedVariantMovements = variantMovements.map((m) => ({
      id: m.id,
      type: 'variant' as const,
      inputId: m.inputVariant?.input?.id || null,
      movementType: m.movementType,
      quantity: m.quantity,
      reason: m.reason,
      notes: m.notes,
      referenceType: m.referenceType,
      referenceId: m.referenceId,
      userId: m.userId,
      createdAt: m.createdAt,
      input: m.inputVariant?.input || null,
      inputBatch: null,
      inputVariant: m.inputVariant ? {
        id: m.inputVariant.id,
        sku: m.inputVariant.sku,
        color: m.inputVariant.color,
        size: m.inputVariant.size,
      } : null,
    }));

    // Combine and sort by date
    const allMovements = [...normalizedBatchMovements, ...normalizedVariantMovements]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, filters.limit || 500);

    return allMovements;
  },

  // Obtener estadísticas de movimientos de insumos
  async getInputMovementsStats(): Promise<{
    totalInputs: number;
    totalStock: number;
    lowStock: number;
    todayMovements: number;
  }> {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

    const [totalInputs, lowStockInputs, totalStockAgg, batchTodayMovements, variantTodayMovements] = await Promise.all([
      prisma.input.count({ where: { isActive: true } }),
      prisma.input.findMany({
        where: { isActive: true },
        select: { currentStock: true, minStock: true },
      }),
      prisma.input.aggregate({
        where: { isActive: true },
        _sum: { currentStock: true },
      }),
      prisma.inputBatchMovement.count({
        where: {
          createdAt: { gte: todayStart },
        },
      }),
      prisma.inputVariantMovement.count({
        where: {
          createdAt: { gte: todayStart },
        },
      }),
    ]);

    const lowStock = lowStockInputs.filter(
      (i) => Number(i.currentStock) <= Number(i.minStock) && Number(i.currentStock) > 0
    ).length;

    return {
      totalInputs,
      totalStock: Number(totalStockAgg._sum.currentStock || 0),
      lowStock,
      todayMovements: batchTodayMovements + variantTodayMovements,
    };
  },

  // Obtener movimientos por insumo
  async getMovementsByInputId(
    inputId: number,
    limit: number = 100
  ): Promise<InputBatchMovement[]> {
    return prisma.inputBatchMovement.findMany({
      where: { inputId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        inputBatch: {
          select: {
            batchNumber: true,
          },
        },
      },
    });
  },

  // Obtener movimientos por lote
  async getMovementsByBatchId(
    inputBatchId: number,
    limit: number = 100
  ): Promise<InputBatchMovement[]> {
    return prisma.inputBatchMovement.findMany({
      where: { inputBatchId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },
};
