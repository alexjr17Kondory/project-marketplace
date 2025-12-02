import { prisma } from '../config/database';
import { NotFoundError, ConflictError } from '../utils/errors';
import type {
  CreateSizeInput,
  UpdateSizeInput,
  CreateColorInput,
  UpdateColorInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateProductTypeInput,
  UpdateProductTypeInput,
} from '../validators/catalogs.validator';

// Generar slug desde nombre
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ==================== TALLAS ====================

export async function listSizes(includeInactive = false) {
  const where = includeInactive ? {} : { isActive: true };

  return prisma.size.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
  });
}

export async function getSizeById(id: number) {
  const size = await prisma.size.findUnique({ where: { id } });

  if (!size) {
    throw new NotFoundError('Talla no encontrada');
  }

  return size;
}

export async function createSize(data: CreateSizeInput) {
  // Verificar nombre único
  const existing = await prisma.size.findFirst({
    where: { name: data.name },
  });

  if (existing) {
    throw new ConflictError('Ya existe una talla con ese nombre');
  }

  return prisma.size.create({ data });
}

export async function updateSize(id: number, data: UpdateSizeInput) {
  const size = await prisma.size.findUnique({ where: { id } });

  if (!size) {
    throw new NotFoundError('Talla no encontrada');
  }

  if (data.name && data.name !== size.name) {
    const existing = await prisma.size.findFirst({
      where: { name: data.name, id: { not: id } },
    });

    if (existing) {
      throw new ConflictError('Ya existe una talla con ese nombre');
    }
  }

  return prisma.size.update({ where: { id }, data });
}

export async function deleteSize(id: number) {
  const size = await prisma.size.findUnique({ where: { id } });

  if (!size) {
    throw new NotFoundError('Talla no encontrada');
  }

  await prisma.size.delete({ where: { id } });
}

// ==================== COLORES ====================

export async function listColors(includeInactive = false) {
  const where = includeInactive ? {} : { isActive: true };

  return prisma.color.findMany({
    where,
    orderBy: { name: 'asc' },
  });
}

export async function getColorById(id: number) {
  const color = await prisma.color.findUnique({ where: { id } });

  if (!color) {
    throw new NotFoundError('Color no encontrado');
  }

  return color;
}

export async function createColor(data: CreateColorInput) {
  const existing = await prisma.color.findFirst({
    where: { OR: [{ name: data.name }, { hexCode: data.hexCode }] },
  });

  if (existing) {
    throw new ConflictError('Ya existe un color con ese nombre o código hex');
  }

  const slug = generateSlug(data.name);

  return prisma.color.create({
    data: {
      ...data,
      slug,
    },
  });
}

export async function updateColor(id: number, data: UpdateColorInput) {
  const color = await prisma.color.findUnique({ where: { id } });

  if (!color) {
    throw new NotFoundError('Color no encontrado');
  }

  if (data.name || data.hexCode) {
    const existing = await prisma.color.findFirst({
      where: {
        id: { not: id },
        OR: [
          data.name ? { name: data.name } : {},
          data.hexCode ? { hexCode: data.hexCode } : {},
        ].filter((o) => Object.keys(o).length > 0),
      },
    });

    if (existing) {
      throw new ConflictError('Ya existe un color con ese nombre o código hex');
    }
  }

  return prisma.color.update({ where: { id }, data });
}

export async function deleteColor(id: number) {
  const color = await prisma.color.findUnique({ where: { id } });

  if (!color) {
    throw new NotFoundError('Color no encontrado');
  }

  await prisma.color.delete({ where: { id } });
}

// ==================== CATEGORÍAS ====================

export async function listCategories(includeInactive = false) {
  const where = includeInactive ? {} : { isActive: true };

  return prisma.category.findMany({
    where,
    orderBy: { name: 'asc' },
  });
}

export async function getCategoryById(id: number) {
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) {
    throw new NotFoundError('Categoría no encontrada');
  }

  return category;
}

export async function createCategory(data: CreateCategoryInput) {
  const existing = await prisma.category.findFirst({
    where: { name: data.name },
  });

  if (existing) {
    throw new ConflictError('Ya existe una categoría con ese nombre');
  }

  const slug = generateSlug(data.name);

  return prisma.category.create({
    data: {
      ...data,
      slug,
    },
  });
}

export async function updateCategory(id: number, data: UpdateCategoryInput) {
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) {
    throw new NotFoundError('Categoría no encontrada');
  }

  if (data.name && data.name !== category.name) {
    const existing = await prisma.category.findFirst({
      where: { name: data.name, id: { not: id } },
    });

    if (existing) {
      throw new ConflictError('Ya existe una categoría con ese nombre');
    }
  }

  return prisma.category.update({ where: { id }, data });
}

export async function deleteCategory(id: number) {
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) {
    throw new NotFoundError('Categoría no encontrada');
  }

  // Verificar que no hay productos con esta categoría
  const productsCount = await prisma.product.count({
    where: { categoryId: id },
  });

  if (productsCount > 0) {
    throw new ConflictError(
      `No se puede eliminar: hay ${productsCount} productos usando esta categoría`
    );
  }

  await prisma.category.delete({ where: { id } });
}

// ==================== TIPOS DE PRODUCTO ====================

export async function listProductTypes(includeInactive = false) {
  const where = includeInactive ? {} : { isActive: true };

  const types = await prisma.productType.findMany({
    where,
    include: {
      category: {
        select: {
          slug: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Mapear para incluir categorySlug
  return types.map(type => ({
    id: type.id,
    name: type.name,
    slug: type.slug,
    description: type.description,
    categoryId: type.categoryId,
    categorySlug: type.category?.slug || null,
    isActive: type.isActive,
    createdAt: type.createdAt,
    updatedAt: type.updatedAt,
  }));
}

export async function getProductTypeById(id: number) {
  const productType = await prisma.productType.findUnique({ where: { id } });

  if (!productType) {
    throw new NotFoundError('Tipo de producto no encontrado');
  }

  return productType;
}

export async function createProductType(data: CreateProductTypeInput) {
  const existing = await prisma.productType.findFirst({
    where: { name: data.name },
  });

  if (existing) {
    throw new ConflictError('Ya existe un tipo de producto con ese nombre');
  }

  const slug = generateSlug(data.name);

  return prisma.productType.create({
    data: {
      ...data,
      slug,
    },
  });
}

export async function updateProductType(id: number, data: UpdateProductTypeInput) {
  const productType = await prisma.productType.findUnique({ where: { id } });

  if (!productType) {
    throw new NotFoundError('Tipo de producto no encontrado');
  }

  if (data.name && data.name !== productType.name) {
    const existing = await prisma.productType.findFirst({
      where: { name: data.name, id: { not: id } },
    });

    if (existing) {
      throw new ConflictError('Ya existe un tipo de producto con ese nombre');
    }
  }

  return prisma.productType.update({ where: { id }, data });
}

export async function deleteProductType(id: number) {
  const productType = await prisma.productType.findUnique({ where: { id } });

  if (!productType) {
    throw new NotFoundError('Tipo de producto no encontrado');
  }

  // Verificar que no hay productos con este tipo
  const productsCount = await prisma.product.count({
    where: { typeId: id },
  });

  if (productsCount > 0) {
    throw new ConflictError(
      `No se puede eliminar: hay ${productsCount} productos usando este tipo`
    );
  }

  await prisma.productType.delete({ where: { id } });
}

// ==================== TALLAS POR TIPO DE PRODUCTO ====================

// Obtener tallas disponibles para un tipo de producto
export async function getSizesByProductType(productTypeId: number) {
  const productType = await prisma.productType.findUnique({
    where: { id: productTypeId },
    include: {
      productTypeSizes: {
        include: {
          size: true,
        },
        orderBy: {
          size: {
            sortOrder: 'asc',
          },
        },
      },
    },
  });

  if (!productType) {
    throw new NotFoundError('Tipo de producto no encontrado');
  }

  return productType.productTypeSizes.map(pts => pts.size);
}

// Asignar tallas a un tipo de producto
export async function assignSizesToProductType(productTypeId: number, sizeIds: number[]) {
  const productType = await prisma.productType.findUnique({
    where: { id: productTypeId },
  });

  if (!productType) {
    throw new NotFoundError('Tipo de producto no encontrado');
  }

  // Eliminar asignaciones existentes
  await prisma.productTypeSize.deleteMany({
    where: { productTypeId },
  });

  // Crear nuevas asignaciones
  if (sizeIds.length > 0) {
    await prisma.productTypeSize.createMany({
      data: sizeIds.map(sizeId => ({
        productTypeId,
        sizeId,
      })),
      skipDuplicates: true,
    });
  }

  return getSizesByProductType(productTypeId);
}
