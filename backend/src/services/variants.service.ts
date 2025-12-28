import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ==================== TIPOS ====================

export interface CreateVariantInput {
  productId: number;
  colorId?: number | null;
  sizeId?: number | null;
  sku?: string;
  barcode?: string;
  stock?: number;
  minStock?: number;
  priceAdjustment?: number;
}

export interface UpdateVariantInput {
  sku?: string;
  barcode?: string;
  stock?: number;
  minStock?: number;
  priceAdjustment?: number;
  isActive?: boolean;
}

export interface VariantFilter {
  productId?: number;
  colorId?: number;
  sizeId?: number;
  isActive?: boolean;
  lowStock?: boolean; // Filtrar variantes con stock bajo
}

// ==================== UTILIDADES ====================

function generateSKU(
  productSku: string,
  colorSlug: string | null,
  sizeAbbr: string | null
): string {
  // Caso 1: Producto con color y talla
  if (colorSlug && sizeAbbr) {
    return `${productSku}-${sizeAbbr}-${colorSlug.toUpperCase()}`.substring(0, 255);
  }

  // Caso 2: Solo color (sin talla)
  if (colorSlug && !sizeAbbr) {
    return `${productSku}-${colorSlug.toUpperCase()}`.substring(0, 255);
  }

  // Caso 3: Solo talla (sin color)
  if (!colorSlug && sizeAbbr) {
    return `${productSku}-${sizeAbbr}`.substring(0, 255);
  }

  // Caso 4: Sin color ni talla (variante única)
  return `${productSku}-UNICO`.substring(0, 255);
}

export function generateEAN13(): string {
  // Generar un código EAN-13 válido (solo para desarrollo)
  const randomPart = Math.floor(Math.random() * 1000000000000)
    .toString()
    .padStart(12, '0');

  // Calcular dígito verificador EAN-13
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(randomPart[i] as string, 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  return randomPart + checkDigit;
}

export async function generateUniqueBarcode(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const barcode = generateEAN13();
    const exists = await prisma.productVariant.findUnique({
      where: { barcode },
    });

    if (!exists) {
      return barcode;
    }
    attempts++;
  }

  throw new Error('No se pudo generar un código de barras único');
}

// ==================== SERVICIO ====================

/**
 * Crear una variante de producto manualmente
 */
export async function createVariant(data: CreateVariantInput) {
  // Verificar que el producto existe
  const product = await prisma.product.findUnique({
    where: { id: data.productId },
  });

  if (!product) {
    throw new Error('Producto no encontrado');
  }

  // Variables para almacenar color y size
  let color = null;
  let size = null;

  // Verificar que el color existe (si se proporciona)
  if (data.colorId) {
    color = await prisma.color.findUnique({
      where: { id: data.colorId },
    });

    if (!color) {
      throw new Error('Color no encontrado');
    }
  }

  // Verificar que la talla existe (si se proporciona)
  if (data.sizeId) {
    size = await prisma.size.findUnique({
      where: { id: data.sizeId },
    });

    if (!size) {
      throw new Error('Talla no encontrada');
    }
  }

  // Verificar que no exista ya esta combinación
  const existing = await prisma.productVariant.findFirst({
    where: {
      productId: data.productId,
      colorId: data.colorId ?? null,
      sizeId: data.sizeId ?? null,
    },
  });

  if (existing) {
    throw new Error('Ya existe una variante con esta combinación');
  }

  // Generar SKU si no se proporciona
  const sku =
    data.sku ||
    generateSKU(
      product.sku as string,
      color?.slug || null,
      size?.abbreviation || null
    );

  // Verificar que el SKU no exista
  const existingSku = await prisma.productVariant.findUnique({
    where: { sku },
  });

  if (existingSku) {
    throw new Error('El SKU ya existe');
  }

  // Generar barcode si no se proporciona
  let barcode = data.barcode || null;
  if (!barcode) {
    try {
      barcode = await generateUniqueBarcode();
    } catch (error) {
      // Si falla, dejar NULL (se puede asignar manualmente después)
      barcode = null;
    }
  } else {
    // Verificar que el barcode no exista
    const existingBarcode = await prisma.productVariant.findUnique({
      where: { barcode },
    });

    if (existingBarcode) {
      throw new Error('El código de barras ya existe');
    }
  }

  // Crear variante - construir data dinámicamente
  const createData: any = {
    productId: data.productId,
    sku,
    barcode,
    stock: data.stock || 0,
    minStock: data.minStock || 0,
    isActive: true,
  };

  // Solo incluir colorId si existe
  if (data.colorId) {
    createData.colorId = data.colorId;
  }

  // Solo incluir sizeId si existe
  if (data.sizeId) {
    createData.sizeId = data.sizeId;
  }

  // Solo incluir priceAdjustment si existe
  if (data.priceAdjustment) {
    createData.priceAdjustment = data.priceAdjustment;
  }

  return await prisma.productVariant.create({
    data: createData,
    include: {
      product: true,
      color: true,
      size: true,
    },
  });
}

/**
 * Generar todas las variantes para un producto
 * Soporta 4 casos:
 * 1. Producto con colores y tallas → genera todas las combinaciones
 * 2. Producto solo con colores → genera una variante por color
 * 3. Producto solo con tallas → genera una variante por talla
 * 4. Producto sin colores ni tallas → genera una variante única
 */
export async function generateVariantsForProduct(
  productId: number,
  initialStock: number = 0
) {
  // Obtener producto con sus colores y tallas
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
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

  if (!product) {
    throw new Error('Producto no encontrado');
  }

  const hasColors = product.productColors.length > 0;
  const hasSizes = product.productSizes.length > 0;

  const createdVariants = [];
  const errors = [];

  // CASO 1: Producto con colores Y tallas → generar todas las combinaciones
  if (hasColors && hasSizes) {
    for (const productColor of product.productColors) {
      for (const productSize of product.productSizes) {
        try {
          // Verificar si ya existe
          const existing = await prisma.productVariant.findFirst({
            where: {
              productId,
              colorId: productColor.colorId,
              sizeId: productSize.sizeId,
            },
          });

          if (existing) {
            continue; // Saltar si ya existe
          }

          // Crear variante
          const variant = await createVariant({
            productId,
            colorId: productColor.colorId,
            sizeId: productSize.sizeId,
            stock: initialStock,
          });

          createdVariants.push(variant);
        } catch (error: any) {
          errors.push({
            color: productColor.color.name,
            size: productSize.size.name,
            error: error.message,
          });
        }
      }
    }
  }
  // CASO 2: Solo colores (sin tallas) → una variante por color
  else if (hasColors && !hasSizes) {
    for (const productColor of product.productColors) {
      try {
        // Verificar si ya existe
        const existing = await prisma.productVariant.findFirst({
          where: {
            productId,
            colorId: productColor.colorId,
            sizeId: null,
          },
        });

        if (existing) {
          continue;
        }

        // Crear variante sin talla
        const variant = await createVariant({
          productId,
          colorId: productColor.colorId,
          sizeId: null,
          stock: initialStock,
        });

        createdVariants.push(variant);
      } catch (error: any) {
        errors.push({
          color: productColor.color.name,
          size: 'N/A',
          error: error.message,
        });
      }
    }
  }
  // CASO 3: Solo tallas (sin colores) → una variante por talla
  else if (!hasColors && hasSizes) {
    for (const productSize of product.productSizes) {
      try {
        // Verificar si ya existe
        const existing = await prisma.productVariant.findFirst({
          where: {
            productId,
            colorId: null,
            sizeId: productSize.sizeId,
          },
        });

        if (existing) {
          continue;
        }

        // Crear variante sin color
        const variant = await createVariant({
          productId,
          colorId: null,
          sizeId: productSize.sizeId,
          stock: initialStock,
        });

        createdVariants.push(variant);
      } catch (error: any) {
        errors.push({
          color: 'N/A',
          size: productSize.size.name,
          error: error.message,
        });
      }
    }
  }
  // CASO 4: Sin colores ni tallas → variante única
  else {
    try {
      // Verificar si ya existe una variante única
      const existing = await prisma.productVariant.findFirst({
        where: {
          productId,
          colorId: null,
          sizeId: null,
        },
      });

      if (!existing) {
        // Crear variante única
        const variant = await createVariant({
          productId,
          colorId: null,
          sizeId: null,
          stock: initialStock,
        });

        createdVariants.push(variant);
      }
    } catch (error: any) {
      errors.push({
        color: 'N/A',
        size: 'N/A',
        error: error.message,
      });
    }
  }

  return {
    created: createdVariants,
    errors,
    total: createdVariants.length,
  };
}

/**
 * Actualizar una variante
 */
export async function updateVariant(id: number, data: UpdateVariantInput) {
  // Verificar que existe
  const variant = await prisma.productVariant.findUnique({
    where: { id },
  });

  if (!variant) {
    throw new Error('Variante no encontrada');
  }

  // Si se actualiza el SKU, verificar unicidad
  if (data.sku && data.sku !== variant.sku) {
    const existing = await prisma.productVariant.findUnique({
      where: { sku: data.sku },
    });

    if (existing) {
      throw new Error('El SKU ya existe');
    }
  }

  // Si se actualiza el barcode, verificar unicidad
  if (data.barcode && data.barcode !== variant.barcode) {
    const existing = await prisma.productVariant.findUnique({
      where: { barcode: data.barcode },
    });

    if (existing) {
      throw new Error('El código de barras ya existe');
    }
  }

  return await prisma.productVariant.update({
    where: { id },
    data: {
      sku: data.sku,
      barcode: data.barcode,
      stock: data.stock,
      minStock: data.minStock,
      priceAdjustment: data.priceAdjustment,
      isActive: data.isActive,
    },
    include: {
      product: true,
      color: true,
      size: true,
    },
  });
}

/**
 * Eliminar una variante
 */
export async function deleteVariant(id: number) {
  const variant = await prisma.productVariant.findUnique({
    where: { id },
  });

  if (!variant) {
    throw new Error('Variante no encontrada');
  }

  return await prisma.productVariant.delete({
    where: { id },
  });
}

/**
 * CRÍTICO PARA POS: Buscar variante por código de barras
 */
export async function getVariantByBarcode(barcode: string) {
  console.log('=== VARIANT BARCODE SEARCH ===');
  console.log('Searching for barcode:', barcode);

  const variant = await prisma.productVariant.findUnique({
    where: { barcode },
    include: {
      product: {
        include: {
          category: true,
          productType: true,
        },
      },
      color: true,
      size: true,
    },
  });

  console.log('Variant found:', variant ? `ID: ${variant.id}, SKU: ${variant.sku}` : 'NULL');
  console.log('==============================');

  if (!variant) {
    return null;
  }

  // Calcular precio final (base + ajuste)
  const finalPrice =
    parseFloat(variant.product.basePrice.toString()) +
    (variant.priceAdjustment ? parseFloat(variant.priceAdjustment.toString()) : 0);

  return {
    ...variant,
    finalPrice,
  };
}

/**
 * Buscar variante por SKU
 */
export async function getVariantBySku(sku: string) {
  const variant = await prisma.productVariant.findUnique({
    where: { sku },
    include: {
      product: true,
      color: true,
      size: true,
    },
  });

  if (!variant) {
    return null;
  }

  const finalPrice =
    parseFloat(variant.product.basePrice.toString()) +
    (variant.priceAdjustment ? parseFloat(variant.priceAdjustment.toString()) : 0);

  return {
    ...variant,
    finalPrice,
  };
}

/**
 * Obtener variante por ID
 */
export async function getVariantById(id: number) {
  const variant = await prisma.productVariant.findUnique({
    where: { id },
    include: {
      product: true,
      color: true,
      size: true,
    },
  });

  if (!variant) {
    return null;
  }

  const finalPrice =
    parseFloat(variant.product.basePrice.toString()) +
    (variant.priceAdjustment ? parseFloat(variant.priceAdjustment.toString()) : 0);

  return {
    ...variant,
    finalPrice,
  };
}

/**
 * Listar variantes con filtros
 */
export async function getVariants(filter: VariantFilter = {}) {
  const where: Prisma.ProductVariantWhereInput = {};

  if (filter.productId) {
    where.productId = filter.productId;
  }

  if (filter.colorId) {
    where.colorId = filter.colorId;
  }

  if (filter.sizeId) {
    where.sizeId = filter.sizeId;
  }

  if (filter.isActive !== undefined) {
    where.isActive = filter.isActive;
  }

  const variants = await prisma.productVariant.findMany({
    where,
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          basePrice: true,
          images: true,
          isTemplate: true,
        },
      },
      color: true,
      size: true,
      templateRecipes: {
        include: {
          inputVariant: true,
        },
      },
    },
    orderBy: [{ productId: 'asc' }, { colorId: 'asc' }, { sizeId: 'asc' }],
  });

  // Calcular stock real para cada variante
  const variantsWithCalculatedStock = variants.map((variant) => {
    let calculatedStock = variant.stock;

    // Si es un template y tiene recetas, calcular stock desde los insumos
    // El stock es limitado por el insumo con menor disponibilidad (cuello de botella)
    if (variant.product.isTemplate && variant.templateRecipes.length > 0) {
      const stocksFromIngredients = variant.templateRecipes.map((recipe) => {
        const inputStock = Number(recipe.inputVariant.currentStock);
        const recipeQuantity = Number(recipe.quantity);
        return Math.floor(inputStock / recipeQuantity);
      });

      // El stock final es el mínimo de todos los insumos (cuello de botella)
      calculatedStock = Math.min(...stocksFromIngredients);
    }

    return {
      ...variant,
      calculatedStock,
    };
  });

  // Filtrar variantes con stock bajo (después de la consulta, usando calculatedStock)
  let filteredVariants = variantsWithCalculatedStock;
  if (filter.lowStock) {
    filteredVariants = variantsWithCalculatedStock.filter((v) => v.calculatedStock <= v.minStock);
  }

  return filteredVariants.map((variant) => {
    const finalPrice =
      parseFloat(variant.product.basePrice.toString()) +
      (variant.priceAdjustment ? parseFloat(variant.priceAdjustment.toString()) : 0);

    return {
      ...variant,
      stock: variant.calculatedStock, // Usar el stock calculado
      finalPrice,
    };
  });
}

/**
 * Ajustar stock de una variante
 */
export async function adjustStock(id: number, quantity: number, reason?: string) {
  const variant = await prisma.productVariant.findUnique({
    where: { id },
  });

  if (!variant) {
    throw new Error('Variante no encontrada');
  }

  const newStock = variant.stock + quantity;

  if (newStock < 0) {
    throw new Error('Stock insuficiente');
  }

  return await prisma.productVariant.update({
    where: { id },
    data: {
      stock: newStock,
    },
    include: {
      product: true,
      color: true,
      size: true,
    },
  });
}

/**
 * Verificar y obtener variantes con stock bajo
 */
export async function checkLowStock() {
  const variants = await prisma.$queryRaw<any[]>`
    SELECT pv.*, p.name as productName, c.name as colorName, s.name as sizeName
    FROM product_variants pv
    JOIN products p ON pv.productId = p.id
    JOIN colors c ON pv.colorId = c.id
    JOIN sizes s ON pv.sizeId = s.id
    WHERE pv.stock <= pv.minStock
    AND pv.isActive = true
    ORDER BY pv.stock ASC
  `;

  return variants;
}

/**
 * Obtener todas las variantes de un producto
 */
export async function getVariantsByProduct(productId: number) {
  return await getVariants({ productId });
}
