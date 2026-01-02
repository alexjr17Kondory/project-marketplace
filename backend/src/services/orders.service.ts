import { Prisma, OrderStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { getAvailableStockForTemplate } from './template-recipes.service';

// Tipos de movimiento
type VariantMovementType = 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'RETURN' | 'DAMAGE' | 'INITIAL';
type InputMovementType = 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'RESERVA' | 'LIBERACION' | 'DEVOLUCION' | 'MERMA';
import type {
  CreateOrderInput,
  UpdateOrderStatusInput,
  ListOrdersQuery,
} from '../validators/orders.validator';

// Mapeo de estados para mostrar al usuario
const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  PROCESSING: 'En Proceso',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

export interface OrderItemResponse {
  id: number;
  productId: number;
  productName: string;
  productImage: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  customization: any;
}

export interface OrderResponse {
  id: number;
  orderNumber: string;
  userId: number;
  userName?: string;
  userEmail?: string;
  items: OrderItemResponse[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  tax: number;
  total: number;
  status: OrderStatus;
  statusLabel: string;
  paymentMethod: string;
  paymentRef: string | null;
  shipping: any;
  trackingNumber: string | null;
  trackingUrl: string | null;
  notes: string | null;
  statusHistory: any;
  paidAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedOrders {
  data: OrderResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

function formatOrderResponse(order: any): OrderResponse {
  const items: OrderItemResponse[] = order.items?.map((item: any) => ({
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    productImage: item.productImage,
    size: item.size,
    color: item.color,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    subtotal: Number(item.unitPrice) * item.quantity,
    customization: item.customization,
  })) || [];

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    userId: order.userId,
    userName: order.user?.name,
    userEmail: order.user?.email,
    items,
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    discount: Number(order.discount),
    tax: Number(order.tax),
    total: Number(order.total),
    status: order.status,
    statusLabel: STATUS_LABELS[order.status as OrderStatus],
    paymentMethod: order.paymentMethod,
    paymentRef: order.paymentRef,
    shipping: order.shipping,
    trackingNumber: order.trackingNumber,
    trackingUrl: order.trackingUrl,
    notes: order.notes,
    statusHistory: order.statusHistory,
    paidAt: order.paidAt,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

// Generar número de orden único
async function generateOrderNumber(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  // Contar pedidos del día
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));

  const count = await prisma.order.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  const sequence = (count + 1).toString().padStart(4, '0');
  return `ORD-${year}${month}${day}-${sequence}`;
}

// Obtener configuración de envío e impuestos
async function getOrderSettings() {
  // Obtener order_settings y payment_settings
  const [orderSettings, paymentSettings] = await Promise.all([
    prisma.setting.findUnique({ where: { key: 'order_settings' } }),
    prisma.setting.findUnique({ where: { key: 'payment_settings' } }),
  ]);

  const orderValue = orderSettings?.value as any || {};
  const paymentValue = paymentSettings?.value as any || {};

  return {
    shippingCost: orderValue.shippingCost || 12000,
    taxRate: orderValue.taxRate || 0.19,
    freeShippingThreshold: orderValue.freeShippingThreshold || 150000,
    // taxIncluded indica si el IVA ya está incluido en el precio del producto
    // Por defecto true (estándar en Colombia)
    taxIncluded: paymentValue.taxIncluded ?? true,
  };
}

// Crear pedido
export async function createOrder(userId: number, data: CreateOrderInput): Promise<OrderResponse> {
  const settings = await getOrderSettings();

  // Validar productos y calcular subtotal
  let subtotal = 0;
  const orderItems: any[] = [];
  // Almacenar info de variantes para actualizar stock después
  const variantStockUpdates: { variantId: number; quantity: number; isTemplate: boolean }[] = [];

  for (const item of data.items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      include: {
        variants: {
          include: {
            color: true,
            size: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundError(`Producto ${item.productId} no encontrado`);
    }

    if (!product.isActive) {
      throw new BadRequestError(`El producto "${product.name}" no está disponible`);
    }

    // Buscar la variante que coincida con color y size
    // Nota: size puede venir como abbreviation o name, color puede venir como hexCode (case insensitive)
    const variant = product.variants.find((v) => {
      const colorMatch = v.color?.hexCode?.toLowerCase() === item.color?.toLowerCase();
      const sizeMatch = v.size?.name === item.size || v.size?.abbreviation === item.size;
      return colorMatch && sizeMatch;
    });

    if (!variant) {
      throw new BadRequestError(
        `No se encontró variante para "${product.name}" con color ${item.color} y talla ${item.size}`
      );
    }

    // Validar stock según el tipo de producto
    if (product.isTemplate) {
      // Para templates (productos personalizables), validar stock de insumos
      const availableStock = await getAvailableStockForTemplate(variant.id);
      if (availableStock < item.quantity) {
        throw new BadRequestError(
          `Stock insuficiente para "${product.name}" (${item.size}, ${item.color}). Disponible: ${availableStock}`
        );
      }
    } else {
      // Para productos regulares, validar stock de la variante
      if (variant.stock < item.quantity) {
        throw new BadRequestError(
          `Stock insuficiente para "${product.name}" (${item.size}, ${item.color}). Disponible: ${variant.stock}`
        );
      }
    }

    // Guardar info de la variante para actualizar stock
    variantStockUpdates.push({
      variantId: variant.id,
      quantity: item.quantity,
      isTemplate: product.isTemplate,
    });

    const unitPrice = Number(product.basePrice);
    subtotal += unitPrice * item.quantity;

    // Obtener primera imagen del producto
    const images = Array.isArray(product.images) ? product.images : [];
    const productImage = images[0] || '';

    orderItems.push({
      productId: product.id,
      productName: product.name,
      productImage: productImage,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      unitPrice: unitPrice,
      customization: item.customization || null,
    });
  }

  // Calcular costos
  const shippingCost = subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingCost;

  // Calcular impuesto:
  // - Si taxIncluded=true: el IVA ya está incluido en el precio, no se suma al total
  // - Si taxIncluded=false: se calcula y suma el IVA al subtotal
  const tax = settings.taxIncluded ? 0 : Math.round(subtotal * settings.taxRate);
  const total = subtotal + shippingCost + tax;

  // Generar número de orden
  const orderNumber = await generateOrderNumber();

  // Crear pedido con transacción
  const order = await prisma.$transaction(async (tx) => {
    // Crear el pedido
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        userId,
        subtotal,
        shippingCost,
        discount: 0,
        tax,
        total,
        status: 'PENDING',
        paymentMethod: data.paymentMethod,
        paymentRef: data.paymentRef || null,
        shipping: data.shipping,
        notes: data.notes || null,
        statusHistory: [
          {
            status: 'PENDING',
            timestamp: new Date().toISOString(),
            note: 'Pedido creado',
          },
        ],
        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
        user: {
          select: { name: true, email: true },
        },
      },
    });

    // Actualizar stock de variantes (solo para productos regulares, no templates)
    // Para templates el stock se controla en los insumos y se consume al pagar
    for (const stockUpdate of variantStockUpdates) {
      if (!stockUpdate.isTemplate) {
        // Obtener stock actual antes de decrementar
        const currentVariant = await tx.productVariant.findUnique({
          where: { id: stockUpdate.variantId },
          include: { product: { select: { name: true } } },
        });

        if (currentVariant) {
          const previousStock = currentVariant.stock;
          const newStock = previousStock - stockUpdate.quantity;

          // Decrementar stock
          await tx.productVariant.update({
            where: { id: stockUpdate.variantId },
            data: {
              stock: {
                decrement: stockUpdate.quantity,
              },
            },
          });

          // Registrar movimiento de inventario
          await tx.variantMovement.create({
            data: {
              variantId: stockUpdate.variantId,
              movementType: 'SALE' as VariantMovementType,
              quantity: -stockUpdate.quantity,
              previousStock,
              newStock,
              referenceType: 'order',
              referenceId: newOrder.id,
              reason: `Venta online - Orden ${orderNumber}`,
            },
          });
        }
      }
    }

    return newOrder;
  });

  return formatOrderResponse(order);
}

// Listar pedidos (admin)
export async function listOrders(query: ListOrdersQuery): Promise<PaginatedOrders> {
  const { page, limit, status, userId, startDate, endDate, search, sortBy, sortOrder } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.OrderWhereInput = {};

  if (status) {
    where.status = status;
  }

  if (userId) {
    where.userId = userId;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }

  if (search) {
    where.OR = [
      { orderNumber: { contains: search } },
      { user: { name: { contains: search } } },
      { user: { email: { contains: search } } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: true,
        user: {
          select: { name: true, email: true },
        },
      },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    data: orders.map(formatOrderResponse),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Obtener pedidos del usuario
export async function getUserOrders(userId: number, query: ListOrdersQuery): Promise<PaginatedOrders> {
  return listOrders({ ...query, userId });
}

// Obtener pedido por ID
export async function getOrderById(id: number, userId?: number): Promise<OrderResponse> {
  const where: Prisma.OrderWhereUniqueInput = { id };

  const order = await prisma.order.findUnique({
    where,
    include: {
      items: true,
      user: {
        select: { name: true, email: true },
      },
    },
  });

  if (!order) {
    throw new NotFoundError('Pedido no encontrado');
  }

  // Si se proporciona userId, verificar que sea el dueño
  if (userId && order.userId !== userId) {
    throw new NotFoundError('Pedido no encontrado');
  }

  return formatOrderResponse(order);
}

// Obtener pedido por número de orden
export async function getOrderByNumber(orderNumber: string, userId?: number): Promise<OrderResponse> {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      user: {
        select: { name: true, email: true },
      },
    },
  });

  if (!order) {
    throw new NotFoundError('Pedido no encontrado');
  }

  if (userId && order.userId !== userId) {
    throw new NotFoundError('Pedido no encontrado');
  }

  return formatOrderResponse(order);
}

// Actualizar estado del pedido (admin)
export async function updateOrderStatus(
  id: number,
  data: UpdateOrderStatusInput
): Promise<OrderResponse> {
  const order = await prisma.order.findUnique({
    where: { id },
  });

  if (!order) {
    throw new NotFoundError('Pedido no encontrado');
  }

  // Validar transiciones de estado
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['PAID', 'CANCELLED'],
    PAID: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: [],
    CANCELLED: [],
  };

  if (!validTransitions[order.status].includes(data.status)) {
    throw new BadRequestError(
      `No se puede cambiar de ${STATUS_LABELS[order.status]} a ${STATUS_LABELS[data.status]}`
    );
  }

  // Preparar datos de actualización
  const updateData: Prisma.OrderUpdateInput = {
    status: data.status,
    statusHistory: [
      ...(order.statusHistory as any[]),
      {
        status: data.status,
        timestamp: new Date().toISOString(),
        note: data.notes || `Estado cambiado a ${STATUS_LABELS[data.status]}`,
      },
    ],
  };

  // Agregar campos específicos según el estado
  if (data.status === 'PAID') {
    updateData.paidAt = new Date();

    // Consumir insumos para templates cuando se paga la orden
    const items = await prisma.orderItem.findMany({
      where: { orderId: id },
    });

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          variants: {
            include: {
              color: true,
              size: true,
            },
          },
        },
      });

      if (product?.isTemplate) {
        // Buscar la variante del template
        const variant = product.variants.find((v) => {
          const colorMatch = v.color?.hexCode?.toLowerCase() === item.color?.toLowerCase();
          const sizeMatch = v.size?.name === item.size || v.size?.abbreviation === item.size;
          return colorMatch && sizeMatch;
        });

        if (variant) {
          // Obtener recetas del template
          const recipes = await prisma.templateRecipe.findMany({
            where: { variantId: variant.id },
          });

          if (recipes.length > 0) {
            // Consumir cada insumo de la receta
            for (const recipe of recipes) {
              const inputQuantityToConsume = Number(recipe.quantity) * item.quantity;

              // Obtener stock actual del insumo
              const inputVariant = await prisma.inputVariant.findUnique({
                where: { id: recipe.inputVariantId },
                include: { input: { select: { name: true } } },
              });

              if (inputVariant) {
                const previousStock = Number(inputVariant.currentStock);
                const newStock = previousStock - inputQuantityToConsume;

                // Descontar stock del insumo
                await prisma.inputVariant.update({
                  where: { id: recipe.inputVariantId },
                  data: {
                    currentStock: {
                      decrement: inputQuantityToConsume,
                    },
                  },
                });

                // Registrar movimiento de insumo
                await prisma.inputVariantMovement.create({
                  data: {
                    inputVariantId: recipe.inputVariantId,
                    movementType: 'SALIDA' as InputMovementType,
                    quantity: -inputQuantityToConsume,
                    previousStock,
                    newStock,
                    referenceType: 'order',
                    referenceId: id,
                    reason: `Venta online - Orden ${order.orderNumber} - Template ${product.name}`,
                  },
                });
              }
            }
          } else {
            // Fallback: usar ProductInput con matching por color/talla (igual que validación de stock)
            const productInputs = await prisma.productInput.findMany({
              where: { productId: product.id },
              include: {
                input: {
                  include: {
                    variants: {
                      where: { isActive: true },
                      include: {
                        color: true,
                        size: true,
                      },
                    },
                  },
                },
              },
            });

            // Aplanar variantes de insumos
            const inputVariants = productInputs.flatMap((pi) => pi.input.variants);

            // Buscar variante de insumo que coincida en color y talla
            const matchingInputVariant = inputVariants.find((iv) => {
              const colorMatch = variant.colorId === null || iv.colorId === variant.colorId;
              const sizeMatch = variant.sizeId === null || iv.sizeId === variant.sizeId;
              return colorMatch && sizeMatch;
            });

            if (matchingInputVariant) {
              const inputQuantityToConsume = item.quantity; // 1:1 para fallback
              const previousStock = Number(matchingInputVariant.currentStock);
              const newStock = previousStock - inputQuantityToConsume;

              // Descontar stock del insumo
              await prisma.inputVariant.update({
                where: { id: matchingInputVariant.id },
                data: {
                  currentStock: {
                    decrement: inputQuantityToConsume,
                  },
                },
              });

              // Registrar movimiento de insumo
              await prisma.inputVariantMovement.create({
                data: {
                  inputVariantId: matchingInputVariant.id,
                  movementType: 'SALIDA' as InputMovementType,
                  quantity: -inputQuantityToConsume,
                  previousStock,
                  newStock,
                  referenceType: 'order',
                  referenceId: id,
                  reason: `Venta online - Orden ${order.orderNumber} - Template ${product.name} (fallback)`,
                },
              });
            }
          }
        }
      }
    }
  } else if (data.status === 'SHIPPED') {
    updateData.shippedAt = new Date();
    if (data.trackingNumber) {
      updateData.trackingNumber = data.trackingNumber;
    }
    if (data.trackingUrl) {
      updateData.trackingUrl = data.trackingUrl;
    }
  } else if (data.status === 'DELIVERED') {
    updateData.deliveredAt = new Date();
  } else if (data.status === 'CANCELLED') {
    // Restaurar stock según el tipo de producto y el estado previo
    const items = await prisma.orderItem.findMany({
      where: { orderId: id },
    });

    // Si la orden estaba pagada (PAID, PROCESSING, SHIPPED), los insumos de templates ya fueron consumidos
    const wasPaid = ['PAID', 'PROCESSING', 'SHIPPED'].includes(order.status);

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          variants: {
            include: {
              color: true,
              size: true,
            },
          },
        },
      });

      if (!product) continue;

      // Buscar la variante correspondiente
      const variant = product.variants.find((v) => {
        const colorMatch = v.color?.hexCode?.toLowerCase() === item.color?.toLowerCase();
        const sizeMatch = v.size?.name === item.size || v.size?.abbreviation === item.size;
        return colorMatch && sizeMatch;
      });

      if (!variant) continue;

      if (product.isTemplate) {
        // Templates: restaurar insumos solo si la orden ya estaba pagada
        if (wasPaid) {
          const recipes = await prisma.templateRecipe.findMany({
            where: { variantId: variant.id },
          });

          if (recipes.length > 0) {
            for (const recipe of recipes) {
              const inputQuantityToRestore = Number(recipe.quantity) * item.quantity;

              const inputVariant = await prisma.inputVariant.findUnique({
                where: { id: recipe.inputVariantId },
                include: { input: { select: { name: true } } },
              });

              if (inputVariant) {
                const previousStock = Number(inputVariant.currentStock);
                const newStock = previousStock + inputQuantityToRestore;

                // Restaurar stock del insumo
                await prisma.inputVariant.update({
                  where: { id: recipe.inputVariantId },
                  data: {
                    currentStock: {
                      increment: inputQuantityToRestore,
                    },
                  },
                });

                // Registrar movimiento de devolución
                await prisma.inputVariantMovement.create({
                  data: {
                    inputVariantId: recipe.inputVariantId,
                    movementType: 'DEVOLUCION' as InputMovementType,
                    quantity: inputQuantityToRestore,
                    previousStock,
                    newStock,
                    referenceType: 'order_cancel',
                    referenceId: id,
                    reason: `Cancelación orden ${order.orderNumber} - Template ${product.name}`,
                  },
                });
              }
            }
          } else {
            // Fallback: usar ProductInput con matching por color/talla
            const productInputs = await prisma.productInput.findMany({
              where: { productId: product.id },
              include: {
                input: {
                  include: {
                    variants: {
                      where: { isActive: true },
                      include: {
                        color: true,
                        size: true,
                      },
                    },
                  },
                },
              },
            });

            const inputVariants = productInputs.flatMap((pi) => pi.input.variants);

            const matchingInputVariant = inputVariants.find((iv) => {
              const colorMatch = variant.colorId === null || iv.colorId === variant.colorId;
              const sizeMatch = variant.sizeId === null || iv.sizeId === variant.sizeId;
              return colorMatch && sizeMatch;
            });

            if (matchingInputVariant) {
              const inputQuantityToRestore = item.quantity;
              const previousStock = Number(matchingInputVariant.currentStock);
              const newStock = previousStock + inputQuantityToRestore;

              await prisma.inputVariant.update({
                where: { id: matchingInputVariant.id },
                data: {
                  currentStock: {
                    increment: inputQuantityToRestore,
                  },
                },
              });

              await prisma.inputVariantMovement.create({
                data: {
                  inputVariantId: matchingInputVariant.id,
                  movementType: 'DEVOLUCION' as InputMovementType,
                  quantity: inputQuantityToRestore,
                  previousStock,
                  newStock,
                  referenceType: 'order_cancel',
                  referenceId: id,
                  reason: `Cancelación orden ${order.orderNumber} - Template ${product.name} (fallback)`,
                },
              });
            }
          }
        }
      } else {
        // Productos regulares: restaurar stock de variante y registrar movimiento
        const previousStock = variant.stock;
        const newStock = previousStock + item.quantity;

        await prisma.productVariant.update({
          where: { id: variant.id },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });

        // Registrar movimiento de devolución
        await prisma.variantMovement.create({
          data: {
            variantId: variant.id,
            movementType: 'RETURN' as VariantMovementType,
            quantity: item.quantity,
            previousStock,
            newStock,
            referenceType: 'order_cancel',
            referenceId: id,
            reason: `Cancelación orden ${order.orderNumber}`,
          },
        });
      }
    }
  }

  const updated = await prisma.order.update({
    where: { id },
    data: updateData,
    include: {
      items: true,
      user: {
        select: { name: true, email: true },
      },
    },
  });

  return formatOrderResponse(updated);
}

// Cancelar pedido (usuario)
export async function cancelOrder(id: number, userId: number): Promise<OrderResponse> {
  const order = await prisma.order.findUnique({
    where: { id },
  });

  if (!order) {
    throw new NotFoundError('Pedido no encontrado');
  }

  if (order.userId !== userId) {
    throw new NotFoundError('Pedido no encontrado');
  }

  // Solo se puede cancelar si está pendiente
  if (order.status !== 'PENDING') {
    throw new BadRequestError('Solo se pueden cancelar pedidos pendientes');
  }

  return updateOrderStatus(id, { status: 'CANCELLED', notes: 'Cancelado por el usuario' });
}

// Obtener estadísticas de pedidos (admin)
export async function getOrderStats() {
  const [total, pending, processing, shipped, delivered, cancelled, revenue] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.count({ where: { status: 'PROCESSING' } }),
    prisma.order.count({ where: { status: 'SHIPPED' } }),
    prisma.order.count({ where: { status: 'DELIVERED' } }),
    prisma.order.count({ where: { status: 'CANCELLED' } }),
    prisma.order.aggregate({
      where: { status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
      _sum: { total: true },
    }),
  ]);

  return {
    total,
    byStatus: {
      pending,
      processing,
      shipped,
      delivered,
      cancelled,
    },
    revenue: Number(revenue._sum.total) || 0,
  };
}
