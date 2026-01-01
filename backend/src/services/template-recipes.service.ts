import { prisma } from '../config/database';

/**
 * Crear receta para una variante de template
 */
export async function createTemplateRecipe(data: {
  variantId: number;
  inputVariantId: number;
  quantity?: number;
}) {
  // Verificar que la variante es de un template
  const variant = await prisma.productVariant.findUnique({
    where: { id: data.variantId },
    include: { product: true },
  });

  if (!variant) {
    throw new Error('Variante no encontrada');
  }

  if (!variant.product.isTemplate) {
    throw new Error('La variante no pertenece a un template');
  }

  // Verificar que el insumo existe
  const inputVariant = await prisma.inputVariant.findUnique({
    where: { id: data.inputVariantId },
  });

  if (!inputVariant) {
    throw new Error('Variante de insumo no encontrada');
  }

  // Crear o actualizar la receta usando el composite key
  return await prisma.templateRecipe.upsert({
    where: {
      variantId_inputVariantId: {
        variantId: data.variantId,
        inputVariantId: data.inputVariantId,
      },
    },
    update: {
      quantity: data.quantity || 1,
    },
    create: {
      variantId: data.variantId,
      inputVariantId: data.inputVariantId,
      quantity: data.quantity || 1,
    },
    include: {
      variant: {
        include: {
          product: true,
          color: true,
          size: true,
        },
      },
      inputVariant: {
        include: {
          input: true,
          color: true,
          size: true,
        },
      },
    },
  });
}

/**
 * Obtener todas las recetas de una variante de template (ahora soporta múltiples ingredientes)
 */
export async function getTemplateRecipes(variantId: number) {
  return await prisma.templateRecipe.findMany({
    where: { variantId },
    include: {
      variant: {
        include: {
          product: true,
          color: true,
          size: true,
        },
      },
      inputVariant: {
        include: {
          input: true,
          color: true,
          size: true,
        },
      },
    },
  });
}

/**
 * Obtener todas las recetas de un template (por productId)
 */
export async function getTemplateRecipesByProduct(productId: number) {
  return await prisma.templateRecipe.findMany({
    where: {
      variant: {
        productId,
      },
    },
    include: {
      variant: {
        include: {
          product: true,
          color: true,
          size: true,
        },
      },
      inputVariant: {
        include: {
          input: true,
          color: true,
          size: true,
        },
      },
    },
  });
}

/**
 * Eliminar receta específica de una variante de template
 */
export async function deleteTemplateRecipe(variantId: number, inputVariantId: number) {
  return await prisma.templateRecipe.delete({
    where: {
      variantId_inputVariantId: {
        variantId,
        inputVariantId,
      },
    },
  });
}

/**
 * Eliminar todas las recetas de una variante de template
 */
export async function deleteAllTemplateRecipes(variantId: number) {
  return await prisma.templateRecipe.deleteMany({
    where: { variantId },
  });
}

/**
 * Calcular stock disponible para una variante de template
 * Primero busca en TemplateRecipe (mapeo explícito)
 * Si no existe, usa ProductInput con matching por color/talla (igual que admin)
 */
export async function getAvailableStockForTemplate(variantId: number): Promise<number> {
  // 1. Primero intentar con TemplateRecipe (mapeo explícito)
  const recipes = await prisma.templateRecipe.findMany({
    where: { variantId },
    include: {
      inputVariant: true,
    },
  });

  if (recipes && recipes.length > 0) {
    // Calcular stock disponible desde cada ingrediente (bottleneck approach)
    const stocksFromIngredients = recipes.map((recipe) => {
      const inputStock = Number(recipe.inputVariant.currentStock);
      const recipeQuantity = Number(recipe.quantity);
      return Math.floor(inputStock / recipeQuantity);
    });

    return Math.min(...stocksFromIngredients);
  }

  // 2. Fallback: usar ProductInput con matching por color/talla (igual que admin)
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: {
      color: true,
      size: true,
      product: true,
    },
  });

  if (!variant) {
    return 0;
  }

  // Obtener insumos asociados al template vía ProductInput
  const productInputs = await prisma.productInput.findMany({
    where: { productId: variant.productId },
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

  if (productInputs.length === 0) {
    return 0;
  }

  // Aplanar variantes de insumos
  const inputVariants = productInputs.flatMap((pi) => pi.input.variants);

  // Buscar variante de insumo que coincida en color y talla
  // Si el template tiene color, el insumo debe tener el mismo color
  // Si el template no tiene color, cualquier insumo sirve
  const matchingInputVariant = inputVariants.find((iv) => {
    const colorMatch = variant.colorId === null || iv.colorId === variant.colorId;
    const sizeMatch = variant.sizeId === null || iv.sizeId === variant.sizeId;
    return colorMatch && sizeMatch;
  });

  if (matchingInputVariant) {
    return Number(matchingInputVariant.currentStock);
  }

  return 0;
}

/**
 * Obtener stock disponible para todas las variantes de un template
 * Primero usa TemplateRecipe, si no existe usa ProductInput (igual que admin)
 */
export async function getAvailableStockForAllVariants(productId: number) {
  // Obtener variantes del template con sus recetas
  const variants = await prisma.productVariant.findMany({
    where: { productId },
    include: {
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

  // Obtener insumos asociados vía ProductInput (para fallback)
  const productInputs = await prisma.productInput.findMany({
    where: { productId },
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

  // Aplanar variantes de insumos para el fallback
  const allInputVariants = productInputs.flatMap((pi) =>
    pi.input.variants.map((iv) => ({
      ...iv,
      inputName: pi.input.name,
    }))
  );

  return variants.map((variant) => {
    const recipes = variant.templateRecipes;
    let availableStock = 0;
    let recipeInfo = null;

    // 1. Primero intentar con TemplateRecipe
    if (recipes && recipes.length > 0) {
      const stocksFromIngredients = recipes.map((recipe) => {
        const inputStock = Number(recipe.inputVariant.currentStock);
        const recipeQuantity = Number(recipe.quantity);
        return Math.floor(inputStock / recipeQuantity);
      });

      availableStock = Math.min(...stocksFromIngredients);

      recipeInfo = recipes.map((recipe) => ({
        inputName: recipe.inputVariant.input?.name || 'N/A',
        inputColor: recipe.inputVariant.color?.name || 'N/A',
        inputSize: recipe.inputVariant.size?.name || 'N/A',
        inputStock: Number(recipe.inputVariant.currentStock),
        quantity: Number(recipe.quantity),
      }));
    }
    // 2. Fallback: usar ProductInput con matching por color/talla
    else if (allInputVariants.length > 0) {
      const matchingInputVariant = allInputVariants.find((iv) => {
        const colorMatch = variant.colorId === null || iv.colorId === variant.colorId;
        const sizeMatch = variant.sizeId === null || iv.sizeId === variant.sizeId;
        return colorMatch && sizeMatch;
      });

      if (matchingInputVariant) {
        availableStock = Number(matchingInputVariant.currentStock);
        recipeInfo = [{
          inputName: matchingInputVariant.inputName,
          inputColor: matchingInputVariant.color?.name || 'N/A',
          inputSize: matchingInputVariant.size?.name || 'N/A',
          inputStock: Number(matchingInputVariant.currentStock),
          quantity: 1,
        }];
      }
    }

    return {
      variantId: variant.id,
      sku: variant.sku,
      color: variant.color?.name || 'N/A',
      size: variant.size?.name || 'N/A',
      recipes: recipeInfo,
      availableStock,
    };
  });
}

/**
 * Obtener stock disponible para una variante específica de template
 * basado en color y talla - usa TemplateRecipe (igual que checkout)
 * Soporta búsqueda por colorId/sizeId O por colorHex/sizeName
 */
export async function getVariantStockByColorSize(
  productId: number,
  colorId: number | null,
  sizeId: number | null,
  colorHex?: string | null,
  sizeName?: string | null
) {
  let variant = null;

  // Si tenemos colorId y sizeId, buscar directamente
  if (colorId !== null || sizeId !== null) {
    variant = await prisma.productVariant.findFirst({
      where: {
        productId,
        colorId,
        sizeId,
      },
      include: {
        color: true,
        size: true,
      },
    });
  }

  // Si no encontramos y tenemos hexCode/sizeName, buscar por esos valores
  // (igual que hace el checkout)
  if (!variant && (colorHex || sizeName)) {
    const allVariants = await prisma.productVariant.findMany({
      where: { productId },
      include: {
        color: true,
        size: true,
      },
    });

    variant = allVariants.find((v) => {
      const colorMatch = !colorHex || v.color?.hexCode?.toLowerCase() === colorHex.toLowerCase();
      const sizeMatch = !sizeName || v.size?.name === sizeName || v.size?.abbreviation === sizeName;
      return colorMatch && sizeMatch;
    }) || null;
  }

  if (!variant) {
    return {
      variantId: null,
      sku: '',
      availableStock: 0,
      message: 'Variante no encontrada',
    };
  }

  // Usar la misma lógica que checkout: buscar recetas en TemplateRecipe
  const availableStock = await getAvailableStockForTemplate(variant.id);

  // Obtener detalles de recetas para la respuesta
  const recipes = await prisma.templateRecipe.findMany({
    where: { variantId: variant.id },
    include: {
      inputVariant: {
        include: {
          input: true,
        },
      },
    },
  });

  return {
    variantId: variant.id,
    sku: variant.sku,
    availableStock,
    recipes: recipes.length > 0 ? recipes.map((r) => ({
      inputName: r.inputVariant.input?.name || 'N/A',
      inputStock: Number(r.inputVariant.currentStock),
      recipeQuantity: Number(r.quantity),
    })) : null,
  };
}

/**
 * Asociar insumos a un template
 * Crea una relación simple entre template e insumos (sin depender de variantes)
 */
export async function associateInputsToTemplate(productId: number, inputIds: number[]) {
  // Verificar que el producto es un template
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product || !product.isTemplate) {
    throw new Error('El producto no es un template');
  }

  // Eliminar asociaciones existentes
  await prisma.productInput.deleteMany({
    where: { productId },
  });

  // Crear las nuevas asociaciones
  if (inputIds.length > 0) {
    await prisma.productInput.createMany({
      data: inputIds.map(inputId => ({
        productId,
        inputId,
      })),
      skipDuplicates: true,
    });
  }

  return {
    created: inputIds.length,
    message: `${inputIds.length} insumo(s) asociado(s) exitosamente`,
  };
}

/**
 * Obtener IDs de insumos asociados a un template
 */
export async function getAssociatedInputIds(productId: number): Promise<number[]> {
  const productInputs = await prisma.productInput.findMany({
    where: { productId },
    select: { inputId: true },
  });

  return productInputs.map(pi => pi.inputId);
}
