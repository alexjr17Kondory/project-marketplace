import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script para migrar datos existentes al sistema de variantes
 *
 * Este script:
 * 1. Obtiene todos los productos con sus colores y tallas
 * 2. Genera variantes para cada combinación producto+color+talla
 * 3. Asigna SKUs únicos
 * 4. Distribuye el stock del producto entre las variantes
 */

function generateSKU(productSku: string, colorSlug: string, sizeAbbr: string): string {
  return `${productSku}-${sizeAbbr}-${colorSlug.toUpperCase()}`.substring(0, 255);
}

function generateEAN13(): string {
  // Generar un código EAN-13 válido (solo para desarrollo)
  // En producción, deberías usar un sistema real de códigos de barras
  const randomPart = Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');

  // Calcular dígito verificador EAN-13
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(randomPart[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  return randomPart + checkDigit;
}

async function migrateProductsToVariants() {
  console.log('🚀 Iniciando migración de productos a variantes...\n');

  try {
    // Obtener todos los productos activos con sus relaciones
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
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

    console.log(`📦 Encontrados ${products.length} productos para migrar\n`);

    let totalVariantsCreated = 0;
    let skippedProducts = 0;

    for (const product of products) {
      console.log(`\n📝 Procesando: ${product.name} (SKU: ${product.sku})`);

      // Saltar productos sin colores o tallas configurados
      if (product.productColors.length === 0 || product.productSizes.length === 0) {
        console.log(`  ⚠️  Saltado: sin colores o tallas configuradas`);
        skippedProducts++;
        continue;
      }

      // Generar todas las combinaciones de color × talla
      const totalCombinations = product.productColors.length * product.productSizes.length;
      console.log(`  🎨 Colores: ${product.productColors.length}`);
      console.log(`  📏 Tallas: ${product.productSizes.length}`);
      console.log(`  🔢 Combinaciones a crear: ${totalCombinations}`);

      // Calcular stock por variante (distribuir equitativamente)
      const stockPerVariant = Math.floor(product.stock / totalCombinations);
      console.log(`  📊 Stock total: ${product.stock}`);
      console.log(`  📊 Stock por variante: ${stockPerVariant}`);

      let variantsCreatedForProduct = 0;

      for (const productColor of product.productColors) {
        for (const productSize of product.productSizes) {
          const sku = generateSKU(
            product.sku,
            productColor.color.slug,
            productSize.size.abbreviation
          );

          // Verificar si la variante ya existe
          const existingVariant = await prisma.productVariant.findFirst({
            where: {
              productId: product.id,
              colorId: productColor.colorId,
              sizeId: productSize.sizeId,
            },
          });

          if (existingVariant) {
            console.log(`    ⏭️  Variante ya existe: ${sku}`);
            continue;
          }

          // Generar código de barras único
          let barcode: string | null = null;
          let attempts = 0;
          const maxAttempts = 10;

          while (attempts < maxAttempts) {
            const testBarcode = generateEAN13();
            const exists = await prisma.productVariant.findUnique({
              where: { barcode: testBarcode },
            });

            if (!exists) {
              barcode = testBarcode;
              break;
            }
            attempts++;
          }

          if (!barcode) {
            console.log(`    ⚠️  No se pudo generar código de barras único para ${sku}`);
            barcode = null; // Dejar NULL, se puede asignar manualmente después
          }

          // Crear variante
          try {
            await prisma.productVariant.create({
              data: {
                productId: product.id,
                colorId: productColor.colorId,
                sizeId: productSize.sizeId,
                sku,
                barcode,
                stock: stockPerVariant,
                minStock: Math.max(1, Math.floor(stockPerVariant * 0.2)), // 20% del stock como mínimo
                isActive: true,
              },
            });

            variantsCreatedForProduct++;
            totalVariantsCreated++;
            console.log(`    ✅ Creada: ${sku} | ${productColor.color.name} | ${productSize.size.name} | Barcode: ${barcode || 'NULL'}`);
          } catch (error: any) {
            console.log(`    ❌ Error creando ${sku}: ${error.message}`);
          }
        }
      }

      console.log(`  ✨ Variantes creadas para este producto: ${variantsCreatedForProduct}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE MIGRACIÓN');
    console.log('='.repeat(60));
    console.log(`✅ Productos procesados: ${products.length}`);
    console.log(`⚠️  Productos saltados (sin config): ${skippedProducts}`);
    console.log(`🎉 Total de variantes creadas: ${totalVariantsCreated}`);
    console.log('='.repeat(60) + '\n');

    console.log('✅ Migración completada exitosamente!\n');
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar migración
migrateProductsToVariants()
  .then(() => {
    console.log('👋 Script finalizado.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script terminado con errores:', error);
    process.exit(1);
  });
