import { PrismaClient, VariantMovementType } from '@prisma/client';

const prisma = new PrismaClient();

interface MovementFilters {
  variantId?: number;
  productId?: number;
  movementType?: VariantMovementType;
  fromDate?: Date;
  toDate?: Date;
  search?: string;
}

interface CreateMovementData {
  variantId: number;
  movementType: VariantMovementType;
  quantity: number;
  reason?: string;
  notes?: string;
  userId?: number;
  referenceType?: string;
  referenceId?: number;
  unitCost?: number;
}

// Obtener movimientos de inventario
export async function getMovements(filters: MovementFilters = {}) {
  const where: any = {};

  if (filters.variantId) {
    where.variantId = filters.variantId;
  }

  if (filters.productId) {
    where.variant = { productId: filters.productId };
  }

  if (filters.movementType) {
    where.movementType = filters.movementType;
  }

  if (filters.fromDate || filters.toDate) {
    where.createdAt = {};
    if (filters.fromDate) where.createdAt.gte = filters.fromDate;
    if (filters.toDate) where.createdAt.lte = filters.toDate;
  }

  if (filters.search) {
    where.OR = [
      { reason: { contains: filters.search } },
      { notes: { contains: filters.search } },
      { variant: { sku: { contains: filters.search } } },
      { variant: { product: { name: { contains: filters.search } } } },
    ];
  }

  const movements = await prisma.variantMovement.findMany({
    where,
    include: {
      variant: {
        include: {
          product: { select: { id: true, name: true, sku: true } },
          color: { select: { id: true, name: true, hexCode: true } },
          size: { select: { id: true, name: true, abbreviation: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 500, // Limitar resultados
  });

  return movements;
}

// Obtener movimientos de una variante específica
export async function getVariantMovements(variantId: number) {
  const movements = await prisma.variantMovement.findMany({
    where: { variantId },
    orderBy: { createdAt: 'desc' },
  });

  return movements;
}

// Crear movimiento de inventario (ajuste manual)
export async function createMovement(data: CreateMovementData) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: data.variantId },
  });

  if (!variant) {
    throw new Error('Variante no encontrada');
  }

  const previousStock = variant.stock;
  let newStock = previousStock;

  // Calcular nuevo stock según el tipo de movimiento
  switch (data.movementType) {
    case 'PURCHASE':
    case 'TRANSFER_IN':
    case 'RETURN':
    case 'INITIAL':
      newStock = previousStock + data.quantity;
      break;
    case 'SALE':
    case 'TRANSFER_OUT':
    case 'DAMAGE':
      newStock = previousStock - data.quantity;
      if (newStock < 0) {
        throw new Error(`Stock insuficiente. Stock actual: ${previousStock}`);
      }
      break;
    case 'ADJUSTMENT':
      // Para ajustes, la cantidad puede ser positiva o negativa
      newStock = previousStock + data.quantity;
      if (newStock < 0) {
        throw new Error(`El ajuste resultaría en stock negativo`);
      }
      break;
  }

  // Crear movimiento y actualizar stock en transacción
  const result = await prisma.$transaction(async (tx) => {
    // Actualizar stock de la variante
    await tx.productVariant.update({
      where: { id: data.variantId },
      data: { stock: newStock },
    });

    // Crear registro del movimiento
    const movement = await tx.variantMovement.create({
      data: {
        variantId: data.variantId,
        movementType: data.movementType,
        quantity: data.movementType === 'ADJUSTMENT' ? data.quantity : Math.abs(data.quantity),
        previousStock,
        newStock,
        reason: data.reason,
        notes: data.notes,
        userId: data.userId,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        unitCost: data.unitCost,
      },
      include: {
        variant: {
          include: {
            product: { select: { name: true } },
            color: { select: { name: true } },
            size: { select: { name: true } },
          },
        },
      },
    });

    return movement;
  });

  return result;
}

// Ajuste masivo de inventario
export async function bulkAdjustment(
  items: { variantId: number; newStock: number; reason?: string }[],
  userId?: number
) {
  const results = [];

  for (const item of items) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: item.variantId },
    });

    if (!variant) {
      results.push({ variantId: item.variantId, error: 'Variante no encontrada' });
      continue;
    }

    const difference = item.newStock - variant.stock;
    if (difference === 0) {
      results.push({ variantId: item.variantId, message: 'Sin cambios' });
      continue;
    }

    try {
      const movement = await createMovement({
        variantId: item.variantId,
        movementType: 'ADJUSTMENT',
        quantity: difference,
        reason: item.reason || 'Ajuste masivo de inventario',
        userId,
      });

      results.push({ variantId: item.variantId, success: true, movement });
    } catch (error: any) {
      results.push({ variantId: item.variantId, error: error.message });
    }
  }

  return results;
}

// Obtener resumen de movimientos por tipo
export async function getMovementsSummary(fromDate?: Date, toDate?: Date) {
  const where: any = {};

  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = fromDate;
    if (toDate) where.createdAt.lte = toDate;
  }

  const summary = await prisma.variantMovement.groupBy({
    by: ['movementType'],
    where,
    _count: true,
    _sum: { quantity: true },
  });

  return summary;
}

// Obtener variantes con stock bajo
export async function getLowStockVariants() {
  const variants = await prisma.productVariant.findMany({
    where: {
      isActive: true,
      stock: { lte: prisma.productVariant.fields.minStock },
    },
    include: {
      product: { select: { id: true, name: true, sku: true } },
      color: { select: { name: true, hexCode: true } },
      size: { select: { name: true, abbreviation: true } },
    },
    orderBy: { stock: 'asc' },
  });

  return variants;
}

// Obtener estadísticas de inventario
export async function getInventoryStats() {
  const [totalVariants, lowStock, outOfStock, totalStock] = await Promise.all([
    prisma.productVariant.count({ where: { isActive: true } }),
    prisma.productVariant.count({
      where: {
        isActive: true,
        stock: { gt: 0 },
        minStock: { gt: 0 },
      },
    }).then(async () => {
      // Contar variantes donde stock <= minStock y minStock > 0
      const variants = await prisma.productVariant.findMany({
        where: { isActive: true, minStock: { gt: 0 } },
        select: { stock: true, minStock: true },
      });
      return variants.filter((v) => v.stock <= v.minStock && v.stock > 0).length;
    }),
    prisma.productVariant.count({ where: { isActive: true, stock: 0 } }),
    prisma.productVariant.aggregate({
      where: { isActive: true },
      _sum: { stock: true },
    }),
  ]);

  // Movimientos de hoy
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayMovements = await prisma.variantMovement.count({
    where: { createdAt: { gte: today } },
  });

  return {
    totalVariants,
    lowStock,
    outOfStock,
    totalStock: totalStock._sum.stock || 0,
    todayMovements,
  };
}
