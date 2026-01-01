import { prisma } from '../config/database';
import { getAvailableStockForTemplate } from './template-recipes.service';

export interface CartItemInput {
  productId?: number;
  variantId?: number;
  isCustomized: boolean;
  customization?: any;
  quantity: number;
  unitPrice: number;
}

export interface ProductInfo {
  id: number;
  name: string;
  description: string | null;
  images: {
    front: string | null;
    back: string | null;
    side: string | null;
    extra1: string | null;
    extra2: string | null;
  };
  basePrice: number;
}

export interface VariantInfo {
  id: number;
  colorName: string;
  colorHex: string;
  sizeName: string;
  sizeAbbreviation: string;
}

export interface CartItemWithStock {
  id: number;
  productId: number | null;
  variantId: number | null;
  isCustomized: boolean;
  customization: any;
  quantity: number;
  unitPrice: number;
  availableStock: number;
  hasStock: boolean;
  // Información del producto para renderizado en frontend
  product?: ProductInfo;
  variant?: VariantInfo;
}

/**
 * Obtener o crear carrito para un usuario
 */
export async function getOrCreateCart(userId: number) {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  return cart;
}

/**
 * Obtener carrito con validacion de stock
 */
export async function getCartWithStock(userId: number): Promise<CartItemWithStock[]> {
  const cart = await getOrCreateCart(userId);

  const itemsWithStock: CartItemWithStock[] = [];

  for (const item of cart.items) {
    let availableStock = 0;
    let productInfo: ProductInfo | undefined;
    let variantInfo: VariantInfo | undefined;

    if (item.isCustomized && item.customization) {
      // Para productos personalizados, obtener stock del template
      const customization = item.customization as any;
      if (customization.templateId) {
        // Buscar variante por color/size
        const variant = await prisma.productVariant.findFirst({
          where: {
            productId: customization.templateId,
            color: customization.selectedColor ? { hexCode: customization.selectedColor } : undefined,
            size: customization.selectedSize ? {
              OR: [
                { name: customization.selectedSize },
                { abbreviation: customization.selectedSize }
              ]
            } : undefined,
          },
        });

        if (variant) {
          availableStock = await getAvailableStockForTemplate(variant.id);
        }
      }
      // Para productos personalizados, la info del producto está en customization
    } else if (item.variantId) {
      // Para productos normales con variante
      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
        include: {
          product: true,
          color: true,
          size: true,
        },
      });

      if (variant) {
        availableStock = variant.stock || 0;

        // Obtener información del producto
        const productImages = variant.product.images as { front?: string; back?: string; side?: string; extra1?: string; extra2?: string } || {};
        productInfo = {
          id: variant.product.id,
          name: variant.product.name,
          description: variant.product.description,
          images: {
            front: productImages.front || null,
            back: productImages.back || null,
            side: productImages.side || null,
            extra1: productImages.extra1 || null,
            extra2: productImages.extra2 || null,
          },
          basePrice: Number(variant.product.basePrice),
        };

        // Obtener información de la variante
        variantInfo = {
          id: variant.id,
          colorName: variant.color?.name || '',
          colorHex: variant.color?.hexCode || '',
          sizeName: variant.size?.name || '',
          sizeAbbreviation: variant.size?.abbreviation || '',
        };
      }
    } else if (item.productId) {
      // Para productos sin variante
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (product) {
        availableStock = product.stock || 0;

        // Obtener información del producto
        const productImages = product.images as { front?: string; back?: string; side?: string; extra1?: string; extra2?: string } || {};
        productInfo = {
          id: product.id,
          name: product.name,
          description: product.description,
          images: {
            front: productImages.front || null,
            back: productImages.back || null,
            side: productImages.side || null,
            extra1: productImages.extra1 || null,
            extra2: productImages.extra2 || null,
          },
          basePrice: Number(product.basePrice),
        };
      }
    }

    itemsWithStock.push({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      isCustomized: item.isCustomized,
      customization: item.customization,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      availableStock,
      hasStock: availableStock >= item.quantity,
      product: productInfo,
      variant: variantInfo,
    });
  }

  return itemsWithStock;
}

/**
 * Agregar item al carrito
 */
export async function addItem(userId: number, itemData: CartItemInput) {
  const cart = await getOrCreateCart(userId);

  // Si es producto personalizado, buscar por customization match
  if (itemData.isCustomized && itemData.customization) {
    // Para productos personalizados, cada uno es unico (no se combinan)
    return await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: itemData.productId || null,
        variantId: itemData.variantId || null,
        isCustomized: true,
        customization: itemData.customization,
        quantity: itemData.quantity,
        unitPrice: itemData.unitPrice,
      },
    });
  }

  // Para productos normales, buscar si ya existe
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId: itemData.productId,
      variantId: itemData.variantId,
      isCustomized: false,
    },
  });

  if (existingItem) {
    // Sumar cantidad
    return await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: existingItem.quantity + itemData.quantity,
      },
    });
  }

  // Crear nuevo item
  return await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId: itemData.productId || null,
      variantId: itemData.variantId || null,
      isCustomized: false,
      quantity: itemData.quantity,
      unitPrice: itemData.unitPrice,
    },
  });
}

/**
 * Actualizar cantidad de un item
 */
export async function updateItemQuantity(userId: number, itemId: number, quantity: number) {
  const cart = await getOrCreateCart(userId);

  // Verificar que el item pertenece al carrito del usuario
  const item = await prisma.cartItem.findFirst({
    where: {
      id: itemId,
      cartId: cart.id,
    },
  });

  if (!item) {
    throw new Error('Item no encontrado en el carrito');
  }

  if (quantity <= 0) {
    // Eliminar item si cantidad es 0 o negativa
    await prisma.cartItem.delete({
      where: { id: itemId },
    });
    return null;
  }

  return await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
  });
}

/**
 * Actualizar customization de un item personalizado
 */
export async function updateItemCustomization(
  userId: number,
  itemId: number,
  customization: any,
  unitPrice: number
) {
  const cart = await getOrCreateCart(userId);

  // Verificar que el item pertenece al carrito del usuario
  const item = await prisma.cartItem.findFirst({
    where: {
      id: itemId,
      cartId: cart.id,
      isCustomized: true,
    },
  });

  if (!item) {
    throw new Error('Item personalizado no encontrado en el carrito');
  }

  return await prisma.cartItem.update({
    where: { id: itemId },
    data: {
      customization,
      unitPrice,
    },
  });
}

/**
 * Eliminar item del carrito
 */
export async function removeItem(userId: number, itemId: number) {
  const cart = await getOrCreateCart(userId);

  // Verificar que el item pertenece al carrito del usuario
  const item = await prisma.cartItem.findFirst({
    where: {
      id: itemId,
      cartId: cart.id,
    },
  });

  if (!item) {
    throw new Error('Item no encontrado en el carrito');
  }

  await prisma.cartItem.delete({
    where: { id: itemId },
  });
}

/**
 * Vaciar carrito
 */
export async function clearCart(userId: number) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (cart) {
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  }
}

/**
 * Sincronizar items de localStorage con carrito en DB
 * Hace merge inteligente: suma cantidades si el producto ya existe
 */
export async function syncCart(userId: number, localItems: CartItemInput[]) {
  const cart = await getOrCreateCart(userId);

  for (const localItem of localItems) {
    if (localItem.isCustomized) {
      // Productos personalizados siempre se agregan como nuevos
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: localItem.productId || null,
          variantId: localItem.variantId || null,
          isCustomized: true,
          customization: localItem.customization,
          quantity: localItem.quantity,
          unitPrice: localItem.unitPrice,
        },
      });
    } else {
      // Para productos normales, buscar si ya existe
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: localItem.productId,
          variantId: localItem.variantId,
          isCustomized: false,
        },
      });

      if (existingItem) {
        // Sumar cantidad
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: existingItem.quantity + localItem.quantity,
          },
        });
      } else {
        // Crear nuevo item
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: localItem.productId || null,
            variantId: localItem.variantId || null,
            isCustomized: false,
            quantity: localItem.quantity,
            unitPrice: localItem.unitPrice,
          },
        });
      }
    }
  }

  // Retornar carrito actualizado con stock
  return await getCartWithStock(userId);
}
