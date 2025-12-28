import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetInputStock() {
  console.log('🔄 Reseteando stock de insumos a 0...\n');

  // Resetear stock de inputs base
  await prisma.input.updateMany({
    data: {
      currentStock: 0,
    },
  });
  console.log('✅ Stock de inputs base reseteado');

  // Resetear stock de variantes de inputs
  await prisma.inputVariant.updateMany({
    data: {
      currentStock: 0,
    },
  });
  console.log('✅ Stock de variantes de inputs reseteado');

  console.log('\n✨ Todos los stocks han sido reseteados a 0');
  console.log('💡 El stock se incrementará cuando se registren movimientos de entrada');
}

resetInputStock()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
