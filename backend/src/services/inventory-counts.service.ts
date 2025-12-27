import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/errors';

// Tipos de estado
type InventoryCountStatus = 'DRAFT' | 'IN_PROGRESS' | 'PENDING_APPROVAL' | 'APPROVED' | 'CANCELLED';
type InventoryCountType = 'FULL' | 'PARTIAL';

// Respuesta de conteo
export interface InventoryCountResponse {
  id: number;
  countNumber: string;
  countType: InventoryCountType;
  status: InventoryCountStatus;
  countDate: Date;
  countedById: number | null;
  countedByName: string | null;
  approvedById: number | null;
  approvedByName: string | null;
  approvedAt: Date | null;
  notes: string | null;
  totalItems: number;
  itemsWithDiff: number;
  totalDiffValue: number;
  items: InventoryCountItemResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryCountItemResponse {
  id: number;
  inputId: number;
  inputCode: string;
  inputName: string;
  unitOfMeasure: string;
  unitCost: number;
  systemQuantity: number;
  countedQuantity: number | null;
  difference: number | null;
  differenceValue: number | null;
  isCounted: boolean;
  notes: string | null;
}

// Generar número de conteo
async function generateCountNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.inventoryCount.count({
    where: {
      countNumber: {
        startsWith: `INV-${year}`,
      },
    },
  });
  return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
}

// Formatear respuesta
function formatCountResponse(count: any): InventoryCountResponse {
  return {
    id: count.id,
    countNumber: count.countNumber,
    countType: count.countType as InventoryCountType,
    status: count.status as InventoryCountStatus,
    countDate: count.countDate,
    countedById: count.countedById,
    countedByName: count.countedByName,
    approvedById: count.approvedById,
    approvedByName: count.approvedByName,
    approvedAt: count.approvedAt,
    notes: count.notes,
    totalItems: count.totalItems,
    itemsWithDiff: count.itemsWithDiff,
    totalDiffValue: Number(count.totalDiffValue),
    items: count.items?.map((item: any) => ({
      id: item.id,
      inputId: item.inputId,
      inputCode: item.inputCode,
      inputName: item.inputName,
      unitOfMeasure: item.unitOfMeasure,
      unitCost: Number(item.unitCost),
      systemQuantity: Number(item.systemQuantity),
      countedQuantity: item.countedQuantity !== null ? Number(item.countedQuantity) : null,
      difference: item.difference !== null ? Number(item.difference) : null,
      differenceValue: item.differenceValue !== null ? Number(item.differenceValue) : null,
      isCounted: item.isCounted,
      notes: item.notes,
    })) || [],
    createdAt: count.createdAt,
    updatedAt: count.updatedAt,
  };
}

export const inventoryCountsService = {
  // Listar conteos
  async listCounts(filters?: {
    status?: InventoryCountStatus;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<InventoryCountResponse[]> {
    const where: Prisma.InventoryCountWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.fromDate || filters?.toDate) {
      where.countDate = {};
      if (filters.fromDate) {
        where.countDate.gte = filters.fromDate;
      }
      if (filters.toDate) {
        where.countDate.lte = filters.toDate;
      }
    }

    const counts = await prisma.inventoryCount.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return counts.map(formatCountResponse);
  },

  // Obtener conteo por ID
  async getCountById(id: number): Promise<InventoryCountResponse> {
    const count = await prisma.inventoryCount.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { inputName: 'asc' },
        },
      },
    });

    if (!count) {
      throw new NotFoundError('Conteo de inventario no encontrado');
    }

    return formatCountResponse(count);
  },

  // Crear conteo
  async createCount(data: {
    countType: InventoryCountType;
    countDate?: Date | string;
    countedById?: number;
    countedByName?: string;
    notes?: string;
    inputIds?: number[]; // Para conteo parcial
  }): Promise<InventoryCountResponse> {
    const countNumber = await generateCountNumber();

    // Parsear fecha si viene como string
    let parsedCountDate: Date;
    if (data.countDate) {
      parsedCountDate = typeof data.countDate === 'string'
        ? new Date(data.countDate + 'T00:00:00')
        : data.countDate;
    } else {
      parsedCountDate = new Date();
    }

    // Obtener insumos a contar
    let inputs: any[];
    if (data.countType === 'PARTIAL' && data.inputIds && data.inputIds.length > 0) {
      inputs = await prisma.input.findMany({
        where: {
          id: { in: data.inputIds },
          isActive: true,
        },
      });
    } else {
      // Conteo completo: todos los insumos activos
      inputs = await prisma.input.findMany({
        where: { isActive: true },
      });
    }

    if (inputs.length === 0) {
      throw new BadRequestError('No hay insumos para contar');
    }

    // Crear conteo con items
    const count = await prisma.inventoryCount.create({
      data: {
        countNumber,
        countType: data.countType,
        status: 'DRAFT',
        countDate: parsedCountDate,
        countedById: data.countedById,
        countedByName: data.countedByName,
        notes: data.notes,
        totalItems: inputs.length,
        items: {
          create: inputs.map(input => ({
            inputId: input.id,
            inputCode: input.code,
            inputName: input.name,
            unitOfMeasure: input.unitOfMeasure,
            unitCost: input.unitCost,
            systemQuantity: input.currentStock,
            isCounted: false,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return formatCountResponse(count);
  },

  // Iniciar conteo (cambiar a IN_PROGRESS)
  async startCount(id: number): Promise<InventoryCountResponse> {
    const count = await prisma.inventoryCount.findUnique({ where: { id } });

    if (!count) {
      throw new NotFoundError('Conteo de inventario no encontrado');
    }

    if (count.status !== 'DRAFT') {
      throw new BadRequestError('Solo se pueden iniciar conteos en estado borrador');
    }

    const updated = await prisma.inventoryCount.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
      include: { items: true },
    });

    return formatCountResponse(updated);
  },

  // Actualizar cantidad contada de un item
  async updateItemCount(
    countId: number,
    itemId: number,
    data: {
      countedQuantity: number;
      notes?: string;
    }
  ): Promise<InventoryCountItemResponse> {
    const count = await prisma.inventoryCount.findUnique({ where: { id: countId } });

    if (!count) {
      throw new NotFoundError('Conteo de inventario no encontrado');
    }

    if (count.status !== 'DRAFT' && count.status !== 'IN_PROGRESS') {
      throw new BadRequestError('No se pueden modificar conteos que no est\u00e9n en borrador o en progreso');
    }

    const item = await prisma.inventoryCountItem.findFirst({
      where: { id: itemId, inventoryCountId: countId },
    });

    if (!item) {
      throw new NotFoundError('Item de conteo no encontrado');
    }

    const systemQty = Number(item.systemQuantity);
    const countedQty = data.countedQuantity;
    const difference = countedQty - systemQty;
    const differenceValue = difference * Number(item.unitCost);

    const updated = await prisma.inventoryCountItem.update({
      where: { id: itemId },
      data: {
        countedQuantity: countedQty,
        difference,
        differenceValue,
        isCounted: true,
        notes: data.notes,
      },
    });

    // Actualizar estado del conteo a IN_PROGRESS si estaba en DRAFT
    if (count.status === 'DRAFT') {
      await prisma.inventoryCount.update({
        where: { id: countId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    return {
      id: updated.id,
      inputId: updated.inputId,
      inputCode: updated.inputCode,
      inputName: updated.inputName,
      unitOfMeasure: updated.unitOfMeasure,
      unitCost: Number(updated.unitCost),
      systemQuantity: Number(updated.systemQuantity),
      countedQuantity: updated.countedQuantity !== null ? Number(updated.countedQuantity) : null,
      difference: updated.difference !== null ? Number(updated.difference) : null,
      differenceValue: updated.differenceValue !== null ? Number(updated.differenceValue) : null,
      isCounted: updated.isCounted,
      notes: updated.notes,
    };
  },

  // Finalizar conteo (enviar a aprobación)
  async submitForApproval(id: number): Promise<InventoryCountResponse> {
    const count = await prisma.inventoryCount.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!count) {
      throw new NotFoundError('Conteo de inventario no encontrado');
    }

    if (count.status !== 'IN_PROGRESS') {
      throw new BadRequestError('Solo se pueden enviar a aprobación conteos en progreso');
    }

    // Verificar que todos los items estén contados
    const uncountedItems = count.items.filter(item => !item.isCounted);
    if (uncountedItems.length > 0) {
      throw new BadRequestError(`Hay ${uncountedItems.length} item(s) sin contar`);
    }

    // Calcular estadísticas
    const itemsWithDiff = count.items.filter(
      item => item.difference !== null && Number(item.difference) !== 0
    ).length;

    const totalDiffValue = count.items.reduce(
      (sum, item) => sum + (item.differenceValue ? Math.abs(Number(item.differenceValue)) : 0),
      0
    );

    const updated = await prisma.inventoryCount.update({
      where: { id },
      data: {
        status: 'PENDING_APPROVAL',
        itemsWithDiff,
        totalDiffValue,
      },
      include: { items: true },
    });

    return formatCountResponse(updated);
  },

  // Aprobar conteo y aplicar ajustes
  async approveCount(
    id: number,
    data: {
      approvedById: number;
      approvedByName: string;
    }
  ): Promise<InventoryCountResponse> {
    const count = await prisma.inventoryCount.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!count) {
      throw new NotFoundError('Conteo de inventario no encontrado');
    }

    if (count.status !== 'PENDING_APPROVAL') {
      throw new BadRequestError('Solo se pueden aprobar conteos pendientes de aprobación');
    }

    // Aplicar ajustes de inventario
    for (const item of count.items) {
      if (item.difference !== null && Number(item.difference) !== 0) {
        const difference = Number(item.difference);

        // Actualizar stock del insumo
        await prisma.input.update({
          where: { id: item.inputId },
          data: {
            currentStock: {
              increment: difference,
            },
          },
        });

        // Buscar un lote activo para registrar el movimiento
        let batch = await prisma.inputBatch.findFirst({
          where: {
            inputId: item.inputId,
            isActive: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        // Si no existe lote, crear uno de ajuste
        if (!batch) {
          batch = await prisma.inputBatch.create({
            data: {
              inputId: item.inputId,
              batchNumber: `AJUSTE-${count.countNumber}`,
              initialQuantity: Number(item.countedQuantity) || 0,
              currentQuantity: Number(item.countedQuantity) || 0,
              reservedQuantity: 0,
              unitCost: Number(item.unitCost),
              totalCost: (Number(item.countedQuantity) || 0) * Number(item.unitCost),
              isActive: true,
              notes: `Lote creado automáticamente por conteo físico ${count.countNumber}`,
            },
          });
        } else {
          // Actualizar cantidad del lote existente
          await prisma.inputBatch.update({
            where: { id: batch.id },
            data: {
              currentQuantity: {
                increment: difference,
              },
            },
          });
        }

        // Registrar movimiento de ajuste
        await prisma.inputBatchMovement.create({
          data: {
            inputId: item.inputId,
            inputBatchId: batch.id,
            movementType: 'AJUSTE',
            quantity: difference,
            referenceType: 'inventory_count',
            referenceId: count.id,
            reason: `Ajuste por conteo físico ${count.countNumber}`,
            notes: item.notes,
          },
        });
      }
    }

    // Marcar como aprobado
    const updated = await prisma.inventoryCount.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: data.approvedById,
        approvedByName: data.approvedByName,
        approvedAt: new Date(),
      },
      include: { items: true },
    });

    return formatCountResponse(updated);
  },

  // Cancelar conteo
  async cancelCount(id: number): Promise<InventoryCountResponse> {
    const count = await prisma.inventoryCount.findUnique({ where: { id } });

    if (!count) {
      throw new NotFoundError('Conteo de inventario no encontrado');
    }

    if (count.status === 'APPROVED') {
      throw new BadRequestError('No se pueden cancelar conteos aprobados');
    }

    const updated = await prisma.inventoryCount.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { items: true },
    });

    return formatCountResponse(updated);
  },

  // Eliminar conteo (solo borradores)
  async deleteCount(id: number): Promise<void> {
    const count = await prisma.inventoryCount.findUnique({ where: { id } });

    if (!count) {
      throw new NotFoundError('Conteo de inventario no encontrado');
    }

    if (count.status !== 'DRAFT' && count.status !== 'CANCELLED') {
      throw new BadRequestError('Solo se pueden eliminar conteos en borrador o cancelados');
    }

    await prisma.inventoryCount.delete({ where: { id } });
  },

  // Obtener estadísticas de conteos
  async getCountStats(): Promise<{
    total: number;
    byStatus: Record<InventoryCountStatus, number>;
    lastCount: Date | null;
  }> {
    const [total, draft, inProgress, pending, approved, cancelled, lastCount] = await Promise.all([
      prisma.inventoryCount.count(),
      prisma.inventoryCount.count({ where: { status: 'DRAFT' } }),
      prisma.inventoryCount.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.inventoryCount.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.inventoryCount.count({ where: { status: 'APPROVED' } }),
      prisma.inventoryCount.count({ where: { status: 'CANCELLED' } }),
      prisma.inventoryCount.findFirst({
        where: { status: 'APPROVED' },
        orderBy: { approvedAt: 'desc' },
        select: { approvedAt: true },
      }),
    ]);

    return {
      total,
      byStatus: {
        DRAFT: draft,
        IN_PROGRESS: inProgress,
        PENDING_APPROVAL: pending,
        APPROVED: approved,
        CANCELLED: cancelled,
      },
      lastCount: lastCount?.approvedAt || null,
    };
  },
};
