import { PrismaClient, LabelZoneType } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedLabelTemplates() {
  console.log('🏷️  Seeding label templates...');

  // Crear plantilla por defecto
  const defaultTemplate = await prisma.labelTemplate.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Plantilla Por Defecto',
      backgroundImage: null, // Sin imagen de fondo
      width: 170.08, // 6 cm
      height: 255.12, // 9 cm
      isDefault: true,
      isActive: true,
    },
  });

  console.log(`   ✓ Plantilla por defecto creada: ${defaultTemplate.name}`);

  // Crear zonas de la plantilla por defecto (6cm × 9cm = 170.08 × 255.12 points)
  const zones = [
    {
      id: 1,
      labelTemplateId: defaultTemplate.id,
      zoneType: LabelZoneType.PRODUCT_NAME,
      x: 5,
      y: 10,
      width: 160.08, // Full width minus margins
      height: 30,
      fontSize: 10,
      fontWeight: 'bold',
      textAlign: 'center',
      fontColor: '#000000',
      rotation: 0,
      zIndex: 1,
    },
    {
      id: 2,
      labelTemplateId: defaultTemplate.id,
      zoneType: LabelZoneType.SIZE,
      x: 5,
      y: 45,
      width: 75,
      height: 18,
      fontSize: 9,
      fontWeight: 'normal',
      textAlign: 'center',
      fontColor: '#000000',
      rotation: 0,
      zIndex: 2,
    },
    {
      id: 3,
      labelTemplateId: defaultTemplate.id,
      zoneType: LabelZoneType.COLOR,
      x: 90,
      y: 45,
      width: 75,
      height: 18,
      fontSize: 9,
      fontWeight: 'normal',
      textAlign: 'center',
      fontColor: '#000000',
      rotation: 0,
      zIndex: 3,
    },
    {
      id: 4,
      labelTemplateId: defaultTemplate.id,
      zoneType: LabelZoneType.BARCODE,
      x: 10,
      y: 75,
      width: 150,
      height: 70,
      fontSize: 10,
      fontWeight: 'normal',
      textAlign: 'center',
      fontColor: '#000000',
      rotation: 0,
      zIndex: 4,
    },
    {
      id: 5,
      labelTemplateId: defaultTemplate.id,
      zoneType: LabelZoneType.BARCODE_TEXT,
      x: 5,
      y: 150,
      width: 160.08,
      height: 15,
      fontSize: 8,
      fontWeight: 'normal',
      textAlign: 'center',
      fontColor: '#000000',
      rotation: 0,
      zIndex: 5,
    },
    {
      id: 6,
      labelTemplateId: defaultTemplate.id,
      zoneType: LabelZoneType.SKU,
      x: 5,
      y: 170,
      width: 160.08,
      height: 12,
      fontSize: 7,
      fontWeight: 'normal',
      textAlign: 'center',
      fontColor: '#666666',
      rotation: 0,
      zIndex: 6,
    },
    {
      id: 7,
      labelTemplateId: defaultTemplate.id,
      zoneType: LabelZoneType.PRICE,
      x: 5,
      y: 190,
      width: 160.08,
      height: 35,
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
      fontColor: '#000000',
      rotation: 0,
      zIndex: 7,
    },
  ];

  for (const zone of zones) {
    await prisma.labelZone.upsert({
      where: { id: zone.id },
      update: {},
      create: zone,
    });
  }

  console.log(`   ✓ ${zones.length} zonas creadas para la plantilla por defecto`);
  console.log('✅ Label templates seeded successfully!\n');
}
