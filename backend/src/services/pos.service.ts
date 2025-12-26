import { PrismaClient, SaleChannel, OrderStatus } from '@prisma/client';
import { getVariantByBarcode } from './variants.service';
import { getCurrentSession } from './cash-register.service';

const prisma = new PrismaClient();

// ==================== TIPOS ====================

export interface ScanProductInput {
  barcode: string;
}

export interface SaleItem {
  variantId: number;
  quantity: number;
  price: number;
  discount?: number;
}

export interface CreateSaleInput {
  cashRegisterId: number;
  sellerId: number;
  items: SaleItem[];
  customerId?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentMethod: 'cash' | 'card' | 'mixed';
  cashAmount?: number;
  cardAmount?: number;
  discount?: number;
  notes?: string;
}

export interface CalculateSaleResult {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  items: {
    variantId: number;
    productName: string;
    color: string;
    size: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    subtotal: number;
  }[];
}

// ==================== UTILIDADES ====================

/**
 * Generar número de orden POS
 */
function generatePOSOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');

  return `POS-${year}${month}${day}-${random}`;
}

// ==================== SERVICIO ====================

/**
 * Escanear producto por código de barras
 */
export async function scanProduct(barcode: string) {
  const variant = await getVariantByBarcode(barcode);

  if (!variant) {
    return null;
  }

  // Verificar que haya stock disponible
  if (variant.stock <= 0) {
    throw new Error('Producto sin stock disponible');
  }

  return {
    variantId: variant.id,
    product: {
      id: variant.product.id,
      name: variant.product.name,
      image: (Array.isArray(variant.product.images) && variant.product.images.length > 0
        ? variant.product.images[0]
        : null),
    },
    color: variant.color?.name || 'N/A',
    size: variant.size?.name || 'N/A',
    sku: variant.sku,
    barcode: variant.barcode,
    price: variant.finalPrice,
    stock: variant.stock,
    available: variant.stock > 0,
  };
}

/**
 * Calcular totales de venta
 */
export async function calculateSale(items: SaleItem[], globalDiscount: number = 0) {
  let subtotal = 0;
  const calculatedItems = [];

  for (const item of items) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: item.variantId },
      include: {
        product: true,
        color: true,
        size: true,
      },
    });

    if (!variant) {
      throw new Error(`Variante ${item.variantId} no encontrada`);
    }

    const unitPrice = item.price;
    const itemDiscount = item.discount || 0;
    const itemSubtotal = unitPrice * item.quantity - itemDiscount;

    subtotal += itemSubtotal;

    calculatedItems.push({
      variantId: variant.id,
      productName: variant.product.name,
      color: variant.color?.name || 'N/A',
      size: variant.size?.name || 'N/A',
      quantity: item.quantity,
      unitPrice,
      discount: itemDiscount,
      subtotal: itemSubtotal,
    });
  }

  const discount = globalDiscount;
  const tax = 0; // Puedes calcular IVA aquí si es necesario
  const total = subtotal - discount + tax;

  return {
    subtotal,
    discount,
    tax,
    total,
    items: calculatedItems,
  };
}

/**
 * Crear venta POS
 */
export async function createSale(data: CreateSaleInput) {
  // Verificar que hay una sesión abierta
  const session = await getCurrentSession(data.sellerId);

  if (!session) {
    throw new Error('No tienes una sesión de caja abierta');
  }

  if (session.cashRegisterId !== data.cashRegisterId) {
    throw new Error('La sesión abierta no corresponde a esta caja');
  }

  // Calcular totales
  const calculation = await calculateSale(data.items, data.discount);

  // Validar pago
  if (data.paymentMethod === 'mixed') {
    const totalPaid = (data.cashAmount || 0) + (data.cardAmount || 0);
    if (Math.abs(totalPaid - calculation.total) > 0.01) {
      throw new Error('El monto total pagado no coincide con el total de la venta');
    }
  }

  // Verificar stock de todos los items
  for (const item of data.items) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: item.variantId },
    });

    if (!variant) {
      throw new Error(`Variante ${item.variantId} no encontrada`);
    }

    if (variant.stock < item.quantity) {
      throw new Error(
        `Stock insuficiente para ${variant.sku}. Disponible: ${variant.stock}, Solicitado: ${item.quantity}`
      );
    }
  }

  // Crear orden en transacción
  return await prisma.$transaction(async (tx) => {
    // Crear orden
    const order = await tx.order.create({
      data: {
        orderNumber: generatePOSOrderNumber(),
        userId: data.customerId || null,
        customerEmail: data.customerEmail || 'venta-pos@local.com',
        customerName: data.customerName || 'Cliente POS',
        customerPhone: data.customerPhone || null,
        subtotal: calculation.subtotal,
        discount: calculation.discount,
        tax: calculation.tax,
        total: calculation.total,
        status: OrderStatus.PAID,
        paymentMethod: data.paymentMethod,
        paymentRef: `POS-${Date.now()}`,
        saleChannel: SaleChannel.POS,
        sellerId: data.sellerId,
        cashRegisterId: data.cashRegisterId,
        statusHistory: [
          {
            status: 'PAID',
            timestamp: new Date().toISOString(),
            note: `Venta POS - ${data.paymentMethod}`,
          },
        ],
        paidAt: new Date(),
        notes: data.notes || null,
      },
    });

    // Crear items de la orden
    for (const item of data.items) {
      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
        include: {
          product: true,
          color: true,
          size: true,
        },
      });

      if (!variant) {
        throw new Error(`Variante ${item.variantId} no encontrada`);
      }

      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: variant.productId,
          variantId: variant.id,
          productName: variant.product.name,
          productImage: (Array.isArray(variant.product.images) && variant.product.images.length > 0
            ? String(variant.product.images[0])
            : ''),
          size: variant.size?.name || 'N/A',
          color: variant.color?.name || 'N/A',
          quantity: item.quantity,
          unitPrice: item.price,
        },
      });

      // Descontar stock
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    // Actualizar contadores de sesión
    await tx.cashSession.update({
      where: { id: session.id },
      data: {
        salesCount: {
          increment: 1,
        },
        totalSales: {
          increment: calculation.total,
        },
      },
    });

    return order;
  });
}

/**
 * Cancelar venta POS (restaurar stock)
 */
export async function cancelSale(orderId: number, sellerId: number, reason: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
    },
  });

  if (!order) {
    throw new Error('Venta no encontrada');
  }

  if (order.saleChannel !== SaleChannel.POS) {
    throw new Error('Solo se pueden cancelar ventas POS desde este módulo');
  }

  if (order.sellerId !== sellerId) {
    throw new Error('Solo puedes cancelar tus propias ventas');
  }

  if (order.status === OrderStatus.CANCELLED) {
    throw new Error('La venta ya está cancelada');
  }

  // Cancelar en transacción
  return await prisma.$transaction(async (tx) => {
    // Actualizar estado de orden
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        notes: order.notes
          ? `${order.notes}\nCANCELADO: ${reason}`
          : `CANCELADO: ${reason}`,
      },
    });

    // Restaurar stock
    for (const item of order.items) {
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }
    }

    // Actualizar contadores de sesión (restar venta)
    if (order.cashRegisterId && order.sellerId) {
      const session = await tx.cashSession.findFirst({
        where: {
          cashRegisterId: order.cashRegisterId,
          sellerId: order.sellerId,
          status: 'OPEN',
        },
      });

      if (session) {
        await tx.cashSession.update({
          where: { id: session.id },
          data: {
            salesCount: {
              decrement: 1,
            },
            totalSales: {
              decrement: parseFloat(order.total.toString()),
            },
          },
        });
      }
    }

    return updatedOrder;
  });
}

/**
 * Obtener historial de ventas
 */
export async function getSalesHistory(filter: {
  sellerId?: number;
  cashRegisterId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  status?: OrderStatus;
}) {
  return await prisma.order.findMany({
    where: {
      saleChannel: SaleChannel.POS,
      sellerId: filter.sellerId,
      cashRegisterId: filter.cashRegisterId,
      status: filter.status,
      createdAt: {
        gte: filter.dateFrom,
        lte: filter.dateTo,
      },
    },
    include: {
      items: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Obtener detalle de venta
 */
export async function getSaleById(id: number) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: true,
              color: true,
              size: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      cashRegister: true,
    },
  });

  if (!order) {
    return null;
  }

  if (order.saleChannel !== SaleChannel.POS) {
    return null;
  }

  return order;
}
