import { PrismaClient, PurchaseOrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface PurchaseOrderFilters {
  search?: string;
  status?: PurchaseOrderStatus;
  supplierId?: number;
  fromDate?: Date;
  toDate?: Date;
}

interface PurchaseOrderItemData {
  variantId?: number;
  inputId?: number;
  inputVariantId?: number;
  description?: string;
  quantity: number;
  unitCost: number;
  notes?: string;
}

interface CreatePurchaseOrderData {
  supplierId: number;
  expectedDate?: Date;
  notes?: string;
  items: PurchaseOrderItemData[];
  createdById?: number;
}

interface UpdatePurchaseOrderData {
  supplierId?: number;
  expectedDate?: Date;
  notes?: string;
  supplierInvoice?: string;
  items?: PurchaseOrderItemData[];
}

interface ReceiveItemData {
  itemId: number;
  quantityReceived: number;
}

// Obtener todas las órdenes de compra
export async function getPurchaseOrders(filters: PurchaseOrderFilters = {}) {
  const where: any = {};

  if (filters.search) {
    where.OR = [
      { orderNumber: { contains: filters.search } },
      { supplier: { name: { contains: filters.search } } },
      { supplierInvoice: { contains: filters.search } },
    ];
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.supplierId) {
    where.supplierId = filters.supplierId;
  }

  if (filters.fromDate || filters.toDate) {
    where.orderDate = {};
    if (filters.fromDate) where.orderDate.gte = filters.fromDate;
    if (filters.toDate) where.orderDate.lte = filters.toDate;
  }

  const orders = await prisma.purchaseOrder.findMany({
    where,
    include: {
      supplier: {
        select: { id: true, code: true, name: true },
      },
      items: {
        include: {
          variant: {
            select: { id: true, sku: true, product: { select: { name: true } } },
          },
          input: {
            select: { id: true, code: true, name: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return orders;
}

// Obtener una orden por ID
export async function getPurchaseOrderById(id: number) {
  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: {
        include: {
          variant: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
              color: { select: { id: true, name: true, hexCode: true } },
              size: { select: { id: true, name: true, abbreviation: true } },
            },
          },
          input: {
            include: {
              inputType: { select: { id: true, name: true } },
            },
          },
          inputVariant: {
            include: {
              input: { select: { id: true, name: true, code: true } },
              color: { select: { id: true, name: true, hexCode: true } },
              size: { select: { id: true, name: true, abbreviation: true } },
            },
          },
        },
      },
    },
  });

  return order;
}

// Generar número de orden
export async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `OC-${year}-`;

  const lastOrder = await prisma.purchaseOrder.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: 'desc' },
  });

  if (!lastOrder) {
    return `${prefix}0001`;
  }

  const lastNumber = parseInt(lastOrder.orderNumber.replace(prefix, ''), 10);
  return `${prefix}${(lastNumber + 1).toString().padStart(4, '0')}`;
}

// Crear orden de compra
export async function createPurchaseOrder(data: CreatePurchaseOrderData) {
  const orderNumber = await generateOrderNumber();

  // Calcular totales
  let subtotal = 0;
  const itemsData = data.items.map((item) => {
    const itemSubtotal = item.quantity * item.unitCost;
    subtotal += itemSubtotal;
    return {
      variantId: item.variantId || null,
      inputId: item.inputId || null,
      inputVariantId: item.inputVariantId || null,
      description: item.description,
      quantity: item.quantity,
      unitCost: item.unitCost,
      subtotal: itemSubtotal,
      notes: item.notes,
    };
  });

  const order = await prisma.purchaseOrder.create({
    data: {
      orderNumber,
      supplierId: data.supplierId,
      status: 'DRAFT',
      subtotal,
      total: subtotal, // Por ahora sin impuestos ni descuentos
      expectedDate: data.expectedDate,
      notes: data.notes,
      createdById: data.createdById,
      items: {
        create: itemsData,
      },
    },
    include: {
      supplier: true,
      items: true,
    },
  });

  return order;
}

// Actualizar orden de compra (solo en estado DRAFT)
export async function updatePurchaseOrder(id: number, data: UpdatePurchaseOrderData) {
  const existing = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!existing) {
    throw new Error('Orden de compra no encontrada');
  }

  if (existing.status !== 'DRAFT') {
    throw new Error('Solo se pueden editar órdenes en estado borrador');
  }

  // Si se actualizan los items, recalcular totales
  let subtotal = existing.subtotal.toNumber();

  if (data.items) {
    // Eliminar items existentes
    await prisma.purchaseOrderItem.deleteMany({
      where: { purchaseOrderId: id },
    });

    // Crear nuevos items
    subtotal = 0;
    for (const item of data.items) {
      const itemSubtotal = item.quantity * item.unitCost;
      subtotal += itemSubtotal;

      await prisma.purchaseOrderItem.create({
        data: {
          purchaseOrderId: id,
          variantId: item.variantId || null,
          inputId: item.inputId || null,
          inputVariantId: item.inputVariantId || null,
          description: item.description,
          quantity: item.quantity,
          unitCost: item.unitCost,
          subtotal: itemSubtotal,
          notes: item.notes,
        },
      });
    }
  }

  const order = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      supplierId: data.supplierId,
      expectedDate: data.expectedDate,
      notes: data.notes,
      supplierInvoice: data.supplierInvoice,
      subtotal,
      total: subtotal,
    },
    include: {
      supplier: true,
      items: true,
    },
  });

  return order;
}

// Cambiar estado de orden
export async function updateOrderStatus(id: number, status: PurchaseOrderStatus) {
  const order = await prisma.purchaseOrder.findUnique({ where: { id } });

  if (!order) {
    throw new Error('Orden de compra no encontrada');
  }

  // Validar transiciones de estado
  const validTransitions: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
    DRAFT: ['SENT', 'CANCELLED'],
    SENT: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PARTIAL', 'RECEIVED', 'CANCELLED'],
    PARTIAL: ['RECEIVED', 'CANCELLED'],
    RECEIVED: [],
    CANCELLED: [],
  };

  if (!validTransitions[order.status].includes(status)) {
    throw new Error(`No se puede cambiar de ${order.status} a ${status}`);
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      status,
      receivedDate: status === 'RECEIVED' ? new Date() : undefined,
    },
    include: {
      supplier: true,
      items: true,
    },
  });

  return updated;
}

// Recibir items (recepción parcial o total)
export async function receiveItems(orderId: number, itemsToReceive: ReceiveItemData[], userId?: number) {
  const order = await prisma.purchaseOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new Error('Orden de compra no encontrada');
  }

  if (!['CONFIRMED', 'PARTIAL'].includes(order.status)) {
    throw new Error('La orden debe estar confirmada para recibir mercancía');
  }

  // Procesar cada item
  for (const receiveData of itemsToReceive) {
    const item = order.items.find((i) => i.id === receiveData.itemId);
    if (!item) continue;

    const newReceived = item.quantityReceived.toNumber() + receiveData.quantityReceived;
    const maxQuantity = item.quantity.toNumber();

    if (newReceived > maxQuantity) {
      throw new Error(`No se puede recibir más de ${maxQuantity} unidades para el item ${item.id}`);
    }

    // Actualizar cantidad recibida del item
    await prisma.purchaseOrderItem.update({
      where: { id: item.id },
      data: { quantityReceived: newReceived },
    });

    // Actualizar stock de variante o insumo
    if (item.variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
      });

      if (variant) {
        const previousStock = variant.stock;
        const newStock = previousStock + receiveData.quantityReceived;

        await prisma.productVariant.update({
          where: { id: item.variantId },
          data: { stock: newStock },
        });

        // Registrar movimiento
        await prisma.variantMovement.create({
          data: {
            variantId: item.variantId,
            movementType: 'PURCHASE',
            quantity: receiveData.quantityReceived,
            previousStock,
            newStock,
            referenceType: 'purchase_order',
            referenceId: orderId,
            reason: `Recepción de OC ${order.orderNumber}`,
            userId,
            unitCost: item.unitCost,
          },
        });
      }
    }

    if (item.inputId) {
      const input = await prisma.input.findUnique({
        where: { id: item.inputId },
      });

      if (input) {
        const previousStock = input.currentStock.toNumber();
        const newStock = previousStock + receiveData.quantityReceived;

        await prisma.input.update({
          where: { id: item.inputId },
          data: { currentStock: newStock },
        });

        // Crear o usar lote existente para el insumo
        let batch = await prisma.inputBatch.findFirst({
          where: {
            inputId: item.inputId,
            isActive: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        if (!batch) {
          // Crear nuevo lote
          batch = await prisma.inputBatch.create({
            data: {
              inputId: item.inputId,
              batchNumber: `OC-${order.orderNumber}-${item.id}`,
              initialQuantity: receiveData.quantityReceived,
              currentQuantity: receiveData.quantityReceived,
              unitCost: item.unitCost,
              totalCost: item.unitCost.toNumber() * receiveData.quantityReceived,
              purchaseDate: new Date(),
              isActive: true,
            },
          });
        } else {
          // Actualizar lote existente
          await prisma.inputBatch.update({
            where: { id: batch.id },
            data: {
              currentQuantity: batch.currentQuantity.toNumber() + receiveData.quantityReceived,
            },
          });
        }

        // Registrar movimiento de insumo
        await prisma.inputBatchMovement.create({
          data: {
            inputId: item.inputId,
            inputBatchId: batch.id,
            movementType: 'ENTRADA',
            quantity: receiveData.quantityReceived,
            reason: `Recepción de OC ${order.orderNumber}`,
            referenceType: 'purchase_order',
            referenceId: orderId,
            userId,
          },
        });
      }
    }

    // Manejar variantes de insumo
    if (item.inputVariantId) {
      const inputVariant = await prisma.inputVariant.findUnique({
        where: { id: item.inputVariantId },
      });

      if (inputVariant) {
        const previousStock = inputVariant.currentStock.toNumber();
        const newStock = previousStock + receiveData.quantityReceived;

        await prisma.inputVariant.update({
          where: { id: item.inputVariantId },
          data: { currentStock: newStock },
        });

        // Registrar movimiento de variante de insumo
        await prisma.inputVariantMovement.create({
          data: {
            inputVariantId: item.inputVariantId,
            movementType: 'ENTRADA',
            quantity: receiveData.quantityReceived,
            previousStock,
            newStock,
            referenceType: 'purchase_order',
            referenceId: orderId,
            reason: `Recepción de OC ${order.orderNumber}`,
            userId,
            unitCost: item.unitCost,
          },
        });

        // También actualizar el stock total del insumo padre
        const parentInput = await prisma.input.findUnique({
          where: { id: inputVariant.inputId },
          include: { variants: { where: { isActive: true } } },
        });

        if (parentInput) {
          // Recalcular stock total sumando todas las variantes
          const totalVariantStock = parentInput.variants.reduce(
            (sum, v) => sum + v.currentStock.toNumber(),
            0
          ) + receiveData.quantityReceived; // Incluir el incremento actual

          await prisma.input.update({
            where: { id: inputVariant.inputId },
            data: { currentStock: totalVariantStock },
          });
        }
      }
    }
  }

  // Verificar si la orden está completa o parcial
  const updatedOrder = await prisma.purchaseOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!updatedOrder) {
    throw new Error('Error al obtener orden actualizada');
  }

  const allReceived = updatedOrder.items.every(
    (item) => item.quantityReceived.toNumber() >= item.quantity.toNumber()
  );

  const someReceived = updatedOrder.items.some(
    (item) => item.quantityReceived.toNumber() > 0
  );

  let newStatus: PurchaseOrderStatus = order.status;
  if (allReceived) {
    newStatus = 'RECEIVED';
  } else if (someReceived) {
    newStatus = 'PARTIAL';
  }

  if (newStatus !== order.status) {
    await prisma.purchaseOrder.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        receivedDate: newStatus === 'RECEIVED' ? new Date() : undefined,
      },
    });
  }

  return getPurchaseOrderById(orderId);
}

// Eliminar orden (solo en DRAFT o CANCELLED)
export async function deletePurchaseOrder(id: number) {
  const order = await prisma.purchaseOrder.findUnique({ where: { id } });

  if (!order) {
    throw new Error('Orden de compra no encontrada');
  }

  if (!['DRAFT', 'CANCELLED'].includes(order.status)) {
    throw new Error('Solo se pueden eliminar órdenes en borrador o canceladas');
  }

  await prisma.purchaseOrder.delete({ where: { id } });
  return { message: 'Orden eliminada correctamente' };
}

// Estadísticas de órdenes de compra
export async function getPurchaseOrderStats() {
  const [total, draft, sent, confirmed, partial, received, cancelled] = await Promise.all([
    prisma.purchaseOrder.count(),
    prisma.purchaseOrder.count({ where: { status: 'DRAFT' } }),
    prisma.purchaseOrder.count({ where: { status: 'SENT' } }),
    prisma.purchaseOrder.count({ where: { status: 'CONFIRMED' } }),
    prisma.purchaseOrder.count({ where: { status: 'PARTIAL' } }),
    prisma.purchaseOrder.count({ where: { status: 'RECEIVED' } }),
    prisma.purchaseOrder.count({ where: { status: 'CANCELLED' } }),
  ]);

  // Total de compras del mes actual
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthlyTotal = await prisma.purchaseOrder.aggregate({
    where: {
      status: 'RECEIVED',
      receivedDate: { gte: startOfMonth },
    },
    _sum: { total: true },
  });

  return {
    total,
    byStatus: { draft, sent, confirmed, partial, received, cancelled },
    pendingCount: draft + sent + confirmed + partial,
    monthlyTotal: monthlyTotal._sum.total?.toNumber() || 0,
  };
}
