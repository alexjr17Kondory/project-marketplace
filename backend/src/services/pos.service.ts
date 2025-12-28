import { PrismaClient, SaleChannel, OrderStatus } from '@prisma/client';
import { getVariantByBarcode } from './variants.service';
import { getCurrentSession } from './cash-register.service';
import { getAvailableStockForTemplate } from './template-recipes.service';

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

  // Calcular stock: usar stock dinámico si es template, stock directo si es producto
  let stock = variant.stock;

  if (variant.product.isTemplate) {
    // Para templates, calcular stock basado en insumos
    const availableStock = await getAvailableStockForTemplate(variant.id);
    stock = availableStock;
  }

  // Verificar que haya stock disponible
  if (stock <= 0) {
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
    stock,
    available: stock > 0,
  };
}

/**
 * Buscar productos y templates por código de barras o nombre
 * - Si es código de barras (único): retorna resultado único
 * - Si es nombre: retorna lista de coincidencias
 */
export async function searchProductsAndTemplates(query: string) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return { type: 'list', results: [] };
  }

  // Primero intentar buscar por código de barras exacto en variantes de productos
  const variantByBarcode = await getVariantByBarcode(trimmedQuery);

  if (variantByBarcode) {
    // Si la variante pertenece a un template, buscar el template completo con sus zonas
    if (variantByBarcode.product.isTemplate) {
      const template = await prisma.product.findUnique({
        where: { id: variantByBarcode.product.id },
        include: {
          templateZones: {
            where: { isActive: true },
            include: {
              zoneType: true,
            },
          },
          productColors: {
            include: {
              color: true,
            },
          },
          productSizes: {
            include: {
              size: true,
            },
          },
        },
      });

      if (template && template.templateZones) {
        return {
          type: 'single',
          result: {
            type: 'template',
            productId: template.id,
            templateId: template.id,
            name: template.name,
            image: (Array.isArray(template.images) && template.images.length > 0
              ? template.images[0]
              : null),
            sku: template.sku,
            barcode: variantByBarcode.barcode,
            basePrice: template.basePrice,
            zoneTypeImages: template.zoneTypeImages,
            // Información de la variante escaneada
            scannedVariant: {
              variantId: variantByBarcode.id,
              colorId: variantByBarcode.colorId,
              colorName: variantByBarcode.color?.name || null,
              colorHex: variantByBarcode.color?.hexCode || null,
              sizeId: variantByBarcode.sizeId,
              sizeName: variantByBarcode.size?.name || null,
              sizeAbbr: variantByBarcode.size?.abbreviation || null,
            },
            colors: template.productColors?.map((pc: any) => ({
              id: pc.color.id,
              name: pc.color.name,
              slug: pc.color.slug,
              hexCode: pc.color.hexCode,
            })) || [],
            sizes: template.productSizes?.map((ps: any) => ({
              id: ps.size.id,
              name: ps.size.name,
              abbreviation: ps.size.abbreviation,
            })) || [],
            zones: template.templateZones.map((zone: any) => ({
              id: zone.id,
              name: zone.name,
              price: zone.price,
              zoneType: zone.zoneType?.name,
              zoneTypeSlug: zone.zoneType?.slug,
              isRequired: zone.isRequired,
              isBlocked: zone.isBlocked,
              positionX: zone.positionX,
              positionY: zone.positionY,
              maxWidth: zone.maxWidth,
              maxHeight: zone.maxHeight,
              shape: zone.shape,
            })),
          },
        };
      }
    }

    // Es un producto regular, calcular stock
    const stock = variantByBarcode.stock;

    // Si encuentra por código de barras, retornar resultado único
    return {
      type: 'single',
      result: {
        type: 'product',
        variantId: variantByBarcode.id,
        productId: variantByBarcode.product.id,
        name: variantByBarcode.product.name,
        image: (Array.isArray(variantByBarcode.product.images) && variantByBarcode.product.images.length > 0
          ? variantByBarcode.product.images[0]
          : null),
        color: variantByBarcode.color?.name || 'N/A',
        size: variantByBarcode.size?.name || 'N/A',
        sku: variantByBarcode.sku,
        barcode: variantByBarcode.barcode,
        price: variantByBarcode.finalPrice,
        stock,
        available: stock > 0,
      },
    };
  }

  // Intentar buscar template por código de barras exacto
  const templateByBarcode = await prisma.product.findUnique({
    where: {
      barcode: trimmedQuery,
      isActive: true,
      isTemplate: true,
    },
    include: {
      templateZones: {
        where: { isActive: true },
        include: {
          zoneType: true,
        },
      },
      productColors: {
        include: {
          color: true,
        },
      },
      productSizes: {
        include: {
          size: true,
        },
      },
    },
  });

  if (templateByBarcode && templateByBarcode.templateZones) {
    // Si encuentra template por código de barras, retornar resultado único
    return {
      type: 'single',
      result: {
        type: 'template',
        productId: templateByBarcode.id,
        templateId: templateByBarcode.id,
        name: templateByBarcode.name,
        image: (Array.isArray(templateByBarcode.images) && templateByBarcode.images.length > 0
          ? templateByBarcode.images[0]
          : null),
        sku: templateByBarcode.sku,
        barcode: templateByBarcode.barcode,
        basePrice: templateByBarcode.basePrice,
        zoneTypeImages: templateByBarcode.zoneTypeImages,
        colors: templateByBarcode.productColors?.map((pc: any) => ({
          id: pc.color.id,
          name: pc.color.name,
          slug: pc.color.slug,
          hexCode: pc.color.hexCode,
        })) || [],
        sizes: templateByBarcode.productSizes?.map((ps: any) => ({
          id: ps.size.id,
          name: ps.size.name,
          abbreviation: ps.size.abbreviation,
        })) || [],
        zones: templateByBarcode.templateZones.map((zone: any) => ({
          id: zone.id,
          name: zone.name,
          price: zone.price,
          zoneType: zone.zoneType?.name,
          zoneTypeSlug: zone.zoneType?.slug,
          isRequired: zone.isRequired,
          isBlocked: zone.isBlocked,
          positionX: zone.positionX,
          positionY: zone.positionY,
          maxWidth: zone.maxWidth,
          maxHeight: zone.maxHeight,
          shape: zone.shape,
        })),
      },
    };
  }

  // Si no encuentra por código de barras, buscar por nombre
  const searchTerm = trimmedQuery.toLowerCase();

  // Buscar productos regulares (no templates)
  const products = await prisma.product.findMany({
    where: {
      AND: [
        { isActive: true },
        { isTemplate: false },
        {
          OR: [
            { name: { contains: searchTerm } },
            { sku: { contains: searchTerm } },
          ],
        },
      ],
    },
    include: {
      variants: {
        where: { isActive: true },
        include: {
          color: true,
          size: true,
        },
        take: 1, // Solo tomar la primera variante para mostrar en búsqueda
      },
    },
    take: 20,
  });

  // Buscar templates
  const templates = await prisma.product.findMany({
    where: {
      AND: [
        { isActive: true },
        { isTemplate: true },
        {
          OR: [
            { name: { contains: searchTerm } },
            { sku: { contains: searchTerm } },
            { barcode: { contains: searchTerm } },
          ],
        },
      ],
    },
    include: {
      templateZones: {
        where: { isActive: true },
        include: {
          zoneType: true,
        },
      },
      productColors: {
        include: {
          color: true,
        },
      },
      productSizes: {
        include: {
          size: true,
        },
      },
    },
    take: 20,
  });

  const results = [];

  // Agregar productos regulares a resultados
  for (const product of products) {
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants[0];
      if (!variant) continue;

      // Calcular precio final
      const basePrice = parseFloat(product.basePrice.toString());
      const adjustment = variant.priceAdjustment ? parseFloat(variant.priceAdjustment.toString()) : 0;
      const finalPrice = basePrice + adjustment;

      results.push({
        type: 'product',
        variantId: variant.id,
        productId: product.id,
        name: product.name,
        image: (Array.isArray(product.images) && product.images.length > 0
          ? product.images[0]
          : null),
        color: variant.color?.name || 'N/A',
        size: variant.size?.name || 'N/A',
        sku: variant.sku || product.sku,
        barcode: variant.barcode,
        price: finalPrice,
        stock: variant.stock,
        available: variant.stock > 0,
      });
    }
  }

  // Agregar templates a resultados
  for (const template of templates) {
    if (template.templateZones) {
      results.push({
        type: 'template',
        productId: template.id,
        templateId: template.id,
        name: template.name,
        image: (Array.isArray(template.images) && template.images.length > 0
          ? template.images[0]
          : null),
        sku: template.sku,
        barcode: template.barcode,
        basePrice: template.basePrice,
        zoneTypeImages: template.zoneTypeImages,
        colors: template.productColors?.map((pc: any) => ({
          id: pc.color.id,
          name: pc.color.name,
          slug: pc.color.slug,
          hexCode: pc.color.hexCode,
        })) || [],
        sizes: template.productSizes?.map((ps: any) => ({
          id: ps.size.id,
          name: ps.size.name,
          abbreviation: ps.size.abbreviation,
        })) || [],
        zones: template.templateZones.map((zone: any) => ({
          id: zone.id,
          name: zone.name,
          price: zone.price,
          zoneType: zone.zoneType?.name,
          zoneTypeSlug: zone.zoneType?.slug,
          isRequired: zone.isRequired,
          isBlocked: zone.isBlocked,
          positionX: zone.positionX,
          positionY: zone.positionY,
          maxWidth: zone.maxWidth,
          maxHeight: zone.maxHeight,
          shape: zone.shape,
        })),
      });
    }
  }

  return {
    type: 'list',
    results,
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
      include: {
        product: true,
      },
    });

    if (!variant) {
      throw new Error(`Variante ${item.variantId} no encontrada`);
    }

    // Calcular stock disponible (dinámico para templates, directo para productos)
    let availableStock = variant.stock;

    if (variant.product.isTemplate) {
      // Para templates, usar stock dinámico basado en insumos
      availableStock = await getAvailableStockForTemplate(variant.id);
    }

    if (availableStock < item.quantity) {
      throw new Error(
        `Stock insuficiente para ${variant.sku}. Disponible: ${availableStock}, Solicitado: ${item.quantity}`
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
      if (variant.product.isTemplate) {
        // Para templates, descontar del inventario de TODOS los insumos (múltiples ingredientes)
        const recipes = await tx.templateRecipe.findMany({
          where: { variantId: variant.id },
        });

        // Procesar cada ingrediente/receta
        for (const recipe of recipes) {
          // Calcular cantidad de insumo a consumir
          const inputQuantityToConsume = Number(recipe.quantity) * item.quantity;

          // Descontar del stock del insumo
          await tx.inputVariant.update({
            where: { id: recipe.inputVariantId },
            data: {
              currentStock: {
                decrement: inputQuantityToConsume,
              },
            },
          });

          // Registrar movimiento de insumo
          const inputVariant = await tx.inputVariant.findUnique({
            where: { id: recipe.inputVariantId },
          });

          if (inputVariant) {
            await tx.inputVariantMovement.create({
              data: {
                inputVariantId: recipe.inputVariantId,
                movementType: 'SALIDA',
                quantity: -inputQuantityToConsume,
                previousStock: inputVariant.currentStock,
                newStock: Number(inputVariant.currentStock) - inputQuantityToConsume,
                referenceType: 'sale',
                referenceId: order.id,
                reason: `Venta POS - Template ${variant.product.name}`,
              },
            });
          }
        }
      } else {
        // Para productos regulares, descontar del stock de la variante
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        // Registrar movimiento de variante
        await tx.variantMovement.create({
          data: {
            variantId: variant.id,
            movementType: 'SALE',
            quantity: -item.quantity,
            previousStock: variant.stock,
            newStock: variant.stock - item.quantity,
            referenceType: 'sale',
            referenceId: order.id,
            reason: 'Venta POS',
          },
        });
      }
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
