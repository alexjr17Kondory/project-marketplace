import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSampleProductVariants() {
  console.log('🔄 Creando variantes de productos de ejemplo...\n');

  // Obtener productos, colores y tallas
  const camiseta = await prisma.product.findFirst({ where: { sku: 'CAM-0001' } });
  const taza = await prisma.product.findFirst({ where: { sku: 'TAZ-0001' } });

  const colorNegro = await prisma.color.findFirst({ where: { slug: 'negro' } });
  const colorBlanco = await prisma.color.findFirst({ where: { slug: 'blanco' } });
  const colorAzul = await prisma.color.findFirst({ where: { slug: 'azul' } });

  const tallaS = await prisma.size.findFirst({ where: { abbreviation: 'S' } });
  const tallaM = await prisma.size.findFirst({ where: { abbreviation: 'M' } });
  const tallaL = await prisma.size.findFirst({ where: { abbreviation: 'L' } });
  const tallaUnica = await prisma.size.findFirst({ where: { abbreviation: 'Unica' } });

  let totalCreated = 0;

  // Crear variantes para camiseta
  if (camiseta && colorNegro && colorBlanco && colorAzul && tallaS && tallaM && tallaL) {
    const colores = [colorNegro, colorBlanco, colorAzul];
    const tallas = [tallaS, tallaM, tallaL];

    for (const color of colores) {
      for (const talla of tallas) {
        const sku = `${camiseta.sku}-${color.slug.toUpperCase().substring(0, 3)}-${talla.abbreviation}`;

        const existing = await prisma.productVariant.findUnique({ where: { sku } });

        if (!existing) {
          await prisma.productVariant.create({
            data: {
              productId: camiseta.id,
              sku,
              colorId: color.id,
              sizeId: talla.id,
              stock: 20,
              minStock: 5,
              isActive: true,
            },
          });
          totalCreated++;
          console.log(`✅ Creada variante: ${sku}`);
        }
      }
    }
  }

  // Crear variantes para taza (solo colores, talla única)
  if (taza && colorBlanco && tallaUnica) {
    const colores = [colorBlanco];

    for (const color of colores) {
      const sku = `${taza.sku}-${color.slug.toUpperCase().substring(0, 3)}-${tallaUnica.abbreviation}`;

      const existing = await prisma.productVariant.findUnique({ where: { sku } });

      if (!existing) {
        await prisma.productVariant.create({
          data: {
            productId: taza.id,
            sku,
            colorId: color.id,
            sizeId: tallaUnica.id,
            stock: 50,
            minStock: 10,
            isActive: true,
          },
        });
        totalCreated++;
        console.log(`✅ Creada variante: ${sku}`);
      }
    }
  }

  console.log(`\n🎉 Total de variantes creadas: ${totalCreated}`);
}

createSampleProductVariants()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
