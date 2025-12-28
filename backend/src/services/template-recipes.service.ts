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
 * basado en TODOS los insumos asociados (bottleneck approach)
 */
export async function getAvailableStockForTemplate(variantId: number): Promise<number> {
  const recipes = await prisma.templateRecipe.findMany({
    where: { variantId },
    include: {
      inputVariant: true,
    },
  });

  if (!recipes || recipes.length === 0) {
    // Si no tiene recetas, no tiene stock disponible
    return 0;
  }

  // Calcular stock disponible desde cada ingrediente
  const stocksFromIngredients = recipes.map((recipe) => {
    const inputStock = Number(recipe.inputVariant.currentStock);
    const recipeQuantity = Number(recipe.quantity);
    return Math.floor(inputStock / recipeQuantity);
  });

  // El stock disponible está limitado por el ingrediente con menos disponibilidad (bottleneck)
  return Math.min(...stocksFromIngredients);
}

/**
 * Obtener stock disponible para todas las variantes de un template
 */
export async function getAvailableStockForAllVariants(productId: number) {
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

  return variants.map((variant) => {
    let availableStock = 0;
    let recipes = null;

    if (variant.templateRecipes && variant.templateRecipes.length > 0) {
      // Calcular stock desde cada ingrediente (bottleneck approach)
      const stocksFromIngredients = variant.templateRecipes.map((recipe) => {
        const inputStock = Number(recipe.inputVariant.currentStock);
        const recipeQuantity = Number(recipe.quantity);
        return Math.floor(inputStock / recipeQuantity);
      });

      // El stock disponible está limitado por el ingrediente con menos disponibilidad
      availableStock = Math.min(...stocksFromIngredients);

      // Retornar información de todas las recetas
      recipes = variant.templateRecipes.map((recipe) => ({
        inputName: recipe.inputVariant.input.name,
        inputColor: recipe.inputVariant.color?.name || 'N/A',
        inputSize: recipe.inputVariant.size?.name || 'N/A',
        inputStock: Number(recipe.inputVariant.currentStock),
        quantity: Number(recipe.quantity),
      }));
    }

    return {
      variantId: variant.id,
      sku: variant.sku,
      color: variant.color?.name || 'N/A',
      size: variant.size?.name || 'N/A',
      recipes, // Ahora retorna array de recetas en lugar de una sola
      availableStock,
    };
  });
}

/**
 * Obtener stock disponible para una variante específica de template
 * basado en color y talla
 */
export async function getVariantStockByColorSize(
  productId: number,
  colorId: number | null,
  sizeId: number | null
) {
  // Buscar la variante del template que coincida con color y talla
  const variant = await prisma.productVariant.findFirst({
    where: {
      productId,
      colorId,
      sizeId,
    },
    include: {
      templateRecipes: {
        include: {
          inputVariant: true,
        },
      },
      color: true,
      size: true,
    },
  });

  if (!variant) {
    return {
      variantId: null,
      sku: '',
      availableStock: 0,
      message: 'Variante no encontrada',
    };
  }

  if (!variant.templateRecipes || variant.templateRecipes.length === 0) {
    return {
      variantId: variant.id,
      sku: variant.sku,
      availableStock: 0,
      message: 'Esta variante no tiene recetas asociadas',
    };
  }

  // Calcular stock disponible desde TODOS los ingredientes (bottleneck approach)
  const stocksFromIngredients = variant.templateRecipes.map((recipe) => {
    const inputStock = Number(recipe.inputVariant.currentStock);
    const recipeQuantity = Number(recipe.quantity);
    return Math.floor(inputStock / recipeQuantity);
  });

  const availableStock = Math.min(...stocksFromIngredients);

  return {
    variantId: variant.id,
    sku: variant.sku,
    availableStock,
    recipes: variant.templateRecipes.map((recipe) => ({
      inputStock: Number(recipe.inputVariant.currentStock),
      recipeQuantity: Number(recipe.quantity),
    })),
  };
}

/**
 * Asociar insumos a un template
 * Crea automáticamente las asociaciones entre variantes que coincidan en color y talla
 */
export async function associateInputsToTemplate(productId: number, inputIds: number[]) {
  // Verificar que el producto es un template
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product || !product.isTemplate) {
    throw new Error('El producto no es un template');
  }

  // Obtener todas las variantes del template
  const templateVariants = await prisma.productVariant.findMany({
    where: { productId },
    include: {
      color: true,
      size: true,
    },
  });

  // Obtener todas las variantes de los insumos seleccionados
  const inputVariants = await prisma.inputVariant.findMany({
    where: {
      input: {
        id: { in: inputIds },
      },
    },
    include: {
      color: true,
      size: true,
      input: true,
    },
  });

  // Primero, eliminar todas las recetas existentes de este template
  await prisma.templateRecipe.deleteMany({
    where: {
      variant: {
        productId,
      },
    },
  });

  // Crear las asociaciones nuevas
  const recipesToCreate = [];

  for (const templateVariant of templateVariants) {
    // Buscar variante de insumo que coincida en color y talla
    const matchingInputVariant = inputVariants.find((inputVariant) => {
      const colorMatches =
        (templateVariant.colorId === null && inputVariant.colorId === null) ||
        (templateVariant.colorId !== null &&
          inputVariant.colorId !== null &&
          templateVariant.colorId === inputVariant.colorId);

      const sizeMatches =
        (templateVariant.sizeId === null && inputVariant.sizeId === null) ||
        (templateVariant.sizeId !== null &&
          inputVariant.sizeId !== null &&
          templateVariant.sizeId === inputVariant.sizeId);

      return colorMatches && sizeMatches;
    });

    if (matchingInputVariant) {
      recipesToCreate.push({
        variantId: templateVariant.id,
        inputVariantId: matchingInputVariant.id,
        quantity: 1,
      });
    }
  }

  // Crear las recetas en lote
  if (recipesToCreate.length > 0) {
    await prisma.templateRecipe.createMany({
      data: recipesToCreate,
      skipDuplicates: true,
    });
  }

  return {
    created: recipesToCreate.length,
    templateVariants: templateVariants.length,
  };
}

/**
 * Obtener IDs de insumos asociados a un template
 */
export async function getAssociatedInputIds(productId: number): Promise<number[]> {
  const recipes = await prisma.templateRecipe.findMany({
    where: {
      variant: {
        productId,
      },
    },
    include: {
      inputVariant: {
        include: {
          input: true,
        },
      },
    },
  });

  // Obtener IDs únicos de insumos
  const uniqueInputIds = new Set(recipes.map((recipe) => recipe.inputVariant.input.id));
  const inputIds = Array.from(uniqueInputIds);

  return inputIds;
}
