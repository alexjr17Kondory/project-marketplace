import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateProductVariants() {
  console.log('🔄 Generando variantes de productos...\n');

  // Obtener todos los productos con sus colores y tallas
  const products = await prisma.product.findMany({
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

  let totalVariants = 0;

  for (const product of products) {
    const colors = product.productColors.map(pc => pc.color);
    const sizes = product.productSizes.map(ps => ps.size);

    if (colors.length === 0 || sizes.length === 0) {
      console.log(`⏭️  ${product.name} - No tiene colores o tallas asignadas`);
      continue;
    }

    let productVariants = 0;

    // Generar variantes para cada combinación color × talla
    for (const color of colors) {
      for (const size of sizes) {
        const sku = `${product.sku}-${color.slug.toUpperCase().substring(0, 3)}-${size.abbreviation}`;

        // Verificar si ya existe
        const existing = await prisma.productVariant.findUnique({
          where: { sku },
        });

        if (!existing) {
          await prisma.productVariant.create({
            data: {
              productId: product.id,
              sku,
              colorId: color.id,
              sizeId: size.id,
              stock: 10, // Stock inicial
              minStock: 2,
              isActive: true,
            },
          });
          productVariants++;
          totalVariants++;
        }
      }
    }

    if (productVariants > 0) {
      console.log(`✅ ${product.name} - Generadas ${productVariants} variantes`);
    }
  }

  console.log(`\n🎉 Total de variantes generadas: ${totalVariants}`);
}

generateProductVariants()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
