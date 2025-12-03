import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Utility to create slug from name
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Utility to create SKU
function createSku(type: string, index: number): string {
  const prefix = type.substring(0, 3).toUpperCase();
  return `${prefix}-${String(index).padStart(4, '0')}`;
}

async function main() {
  console.log('🌱 Iniciando seed de datos...\n');

  // ==================== ROLES ====================
  console.log('📋 Creando roles...');

  // Rol 1: SuperAdmin - Sistema, no modificable, acceso total
  const superAdminRole = await prisma.role.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'SuperAdmin',
      slug: 'superadmin',
      description: 'Administrador con acceso total al sistema',
      permissions: [
        'dashboard.view',
        'products.view', 'products.create', 'products.edit', 'products.delete',
        'orders.view', 'orders.create', 'orders.edit', 'orders.delete',
        'users.view', 'users.create', 'users.edit', 'users.delete',
        'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
        'settings.view', 'settings.edit',
        'reports.view', 'reports.export',
        'catalogs.view', 'catalogs.create', 'catalogs.edit', 'catalogs.delete',
      ],
      isSystem: true,
      isActive: true,
    },
  });
  console.log(`  ✅ Rol creado: ${superAdminRole.name} (ID: 1, sistema)`);

  // Rol 2: Cliente/Usuario - Sistema, no modificable, SIN acceso al panel admin
  const clientRole = await prisma.role.upsert({
    where: { id: 2 },
    update: {
      name: 'Cliente',
      slug: 'cliente',
      description: 'Cliente del marketplace - Sin acceso al panel administrativo',
      permissions: [
        'products.view',
        'orders.view',
        'orders.create',
      ],
    },
    create: {
      id: 2,
      name: 'Cliente',
      slug: 'cliente',
      description: 'Cliente del marketplace - Sin acceso al panel administrativo',
      permissions: [
        'products.view',
        'orders.view',
        'orders.create',
      ],
      isSystem: true,
      isActive: true,
    },
  });
  console.log(`  ✅ Rol creado: ${clientRole.name} (ID: 2, sistema, sin acceso admin)`);

  // Rol 3+: Administrador - Rol base para crear otros roles administrativos
  const adminRole = await prisma.role.upsert({
    where: { id: 3 },
    update: {
      name: 'Administrador',
      slug: 'administrador',
      description: 'Administrador del marketplace con acceso al panel',
      permissions: [
        'dashboard.view',
        'products.view', 'products.create', 'products.edit',
        'orders.view', 'orders.edit',
        'users.view',
        'catalogs.view', 'catalogs.create', 'catalogs.edit',
        'reports.view',
      ],
    },
    create: {
      id: 3,
      name: 'Administrador',
      slug: 'administrador',
      description: 'Administrador del marketplace con acceso al panel',
      permissions: [
        'dashboard.view',
        'products.view', 'products.create', 'products.edit',
        'orders.view', 'orders.edit',
        'users.view',
        'catalogs.view', 'catalogs.create', 'catalogs.edit',
        'reports.view',
      ],
      isSystem: false, // Este rol SI se puede modificar
      isActive: true,
    },
  });
  console.log(`  ✅ Rol creado: ${adminRole.name} (ID: 3, personalizable, con acceso admin)`);

  // ==================== USUARIOS ====================
  console.log('\n👥 Creando usuarios...');

  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@marketplace.com' },
    update: {},
    create: {
      email: 'admin@marketplace.com',
      passwordHash: adminPassword,
      name: 'Administrador',
      phone: '+57 300 000 0000',
      roleId: 1,
      status: 'ACTIVE',
    },
  });
  console.log(`  ✅ Usuario creado: ${admin.email} (contraseña: admin123)`);

  // Administrador - roleId 3 (acceso al panel admin)
  const vendedorPassword = await hashPassword('vendedor123');
  const vendedor = await prisma.user.upsert({
    where: { email: 'vendedor@marketplace.com' },
    update: { roleId: 3 },
    create: {
      email: 'vendedor@marketplace.com',
      passwordHash: vendedorPassword,
      name: 'Vendedor',
      phone: '+57 300 111 1111',
      roleId: 3, // Administrador
      status: 'ACTIVE',
    },
  });
  console.log(`  ✅ Usuario creado: ${vendedor.email} (Administrador, contraseña: vendedor123)`);

  // Cliente - roleId 2 (sin acceso al panel admin)
  const userPassword = await hashPassword('cliente123');
  const cliente = await prisma.user.upsert({
    where: { email: 'cliente@marketplace.com' },
    update: { roleId: 2 },
    create: {
      email: 'cliente@marketplace.com',
      passwordHash: userPassword,
      name: 'Cliente Demo',
      phone: '+57 311 111 1111',
      roleId: 2, // Cliente
      status: 'ACTIVE',
    },
  });
  console.log(`  ✅ Usuario creado: ${cliente.email} (Cliente, contraseña: cliente123)`);

  // ==================== CATEGORÍAS ====================
  console.log('\n📁 Creando categorías...');

  const categories = [
    { name: 'Ropa', slug: 'ropa', description: 'Camisetas, hoodies, buzos y prendas sublimables' },
    { name: 'Bebidas', slug: 'bebidas', description: 'Tazas, termos, vasos y recipientes sublimables' },
    { name: 'Hogar', slug: 'hogar', description: 'Decoración y artículos para el hogar' },
    { name: 'Accesorios', slug: 'accesorios', description: 'Gorras, llaveros, fundas y más' },
    { name: 'Oficina', slug: 'oficina', description: 'Artículos de oficina personalizables' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        isActive: true,
      },
    });
    console.log(`  ✅ Categoría: ${cat.name}`);
  }

  // ==================== TIPOS DE PRODUCTO ====================
  console.log('\n🏷️ Creando tipos de producto...');

  const productTypes = [
    { name: 'Camiseta', slug: 'camiseta', description: 'Camisetas sublimables' },
    { name: 'Hoodie', slug: 'hoodie', description: 'Sudaderas con capucha' },
    { name: 'Suéter', slug: 'sueter', description: 'Suéteres y buzos' },
    { name: 'Polo', slug: 'polo', description: 'Polos deportivos' },
    { name: 'Gorra', slug: 'gorra', description: 'Gorras y cachuchas' },
    { name: 'Taza', slug: 'taza', description: 'Tazas de cerámica' },
    { name: 'Taza Mágica', slug: 'taza-magica', description: 'Tazas termosensibles' },
    { name: 'Termo', slug: 'termo', description: 'Botellas térmicas' },
    { name: 'Vaso Térmico', slug: 'vaso-termico', description: 'Vasos tipo tumbler' },
    { name: 'Cuadro Aluminio', slug: 'cuadro-aluminio', description: 'Cuadros en aluminio' },
    { name: 'Posa Vasos', slug: 'posa-vasos', description: 'Sets de posa vasos' },
    { name: 'Cojín', slug: 'cojin', description: 'Cojines decorativos' },
    { name: 'Reloj', slug: 'reloj', description: 'Relojes de pared' },
    { name: 'Rompecabezas', slug: 'rompecabezas', description: 'Puzzles personalizados' },
    { name: 'Manta', slug: 'manta', description: 'Mantas sublimables' },
    { name: 'Llavero', slug: 'llavero', description: 'Llaveros MDF' },
    { name: 'Mouse Pad', slug: 'mouse-pad', description: 'Mouse pads gaming' },
    { name: 'Funda Celular', slug: 'funda-celular', description: 'Fundas para smartphone' },
    { name: 'Bolsa Tote', slug: 'bolsa-tote', description: 'Bolsas tote bag' },
    { name: 'Lanyard', slug: 'lanyard', description: 'Cordones para credenciales' },
    { name: 'Libreta', slug: 'libreta', description: 'Libretas y cuadernos' },
    { name: 'Calendario', slug: 'calendario', description: 'Calendarios personalizados' },
  ];

  for (const type of productTypes) {
    await prisma.productType.upsert({
      where: { slug: type.slug },
      update: { name: type.name, description: type.description },
      create: {
        name: type.name,
        slug: type.slug,
        description: type.description,
        isActive: true,
      },
    });
    console.log(`  ✅ Tipo: ${type.name}`);
  }

  // ==================== TALLAS ====================
  console.log('\n📏 Creando tallas...');

  const sizes = [
    { name: 'Extra Small', abbreviation: 'XS', order: 1 },
    { name: 'Small', abbreviation: 'S', order: 2 },
    { name: 'Medium', abbreviation: 'M', order: 3 },
    { name: 'Large', abbreviation: 'L', order: 4 },
    { name: 'Extra Large', abbreviation: 'XL', order: 5 },
    { name: 'Extra Extra Large', abbreviation: 'XXL', order: 6 },
    { name: 'Talla Única', abbreviation: 'Unica', order: 10 },
  ];

  for (const size of sizes) {
    await prisma.size.upsert({
      where: { abbreviation: size.abbreviation },
      update: {},
      create: {
        name: size.name,
        abbreviation: size.abbreviation,
        sortOrder: size.order,
        isActive: true,
      },
    });
    console.log(`  ✅ Talla: ${size.abbreviation}`);
  }

  // ==================== COLORES ====================
  console.log('\n🎨 Creando colores...');

  const colors = [
    { name: 'Negro', slug: 'negro', hex: '#000000' },
    { name: 'Blanco', slug: 'blanco', hex: '#FFFFFF' },
    { name: 'Gris', slug: 'gris', hex: '#9CA3AF' },
    { name: 'Gris Claro', slug: 'gris-claro', hex: '#D1D5DB' },
    { name: 'Rojo', slug: 'rojo', hex: '#DC2626' },
    { name: 'Azul', slug: 'azul', hex: '#2563EB' },
    { name: 'Azul Claro', slug: 'azul-claro', hex: '#93C5FD' },
    { name: 'Verde', slug: 'verde', hex: '#16A34A' },
    { name: 'Verde Neón', slug: 'verde-neon', hex: '#4ADE80' },
    { name: 'Amarillo', slug: 'amarillo', hex: '#FDE047' },
    { name: 'Naranja', slug: 'naranja', hex: '#F97316' },
    { name: 'Rosa', slug: 'rosa', hex: '#EC4899' },
    { name: 'Morado', slug: 'morado', hex: '#9333EA' },
    { name: 'Beige', slug: 'beige', hex: '#D4B896' },
    { name: 'Plateado', slug: 'plateado', hex: '#C0C0C0' },
  ];

  for (const color of colors) {
    await prisma.color.upsert({
      where: { slug: color.slug },
      update: {},
      create: {
        name: color.name,
        slug: color.slug,
        hexCode: color.hex,
        isActive: true,
      },
    });
    console.log(`  ✅ Color: ${color.name}`);
  }

  // ==================== PRODUCTOS ====================
  console.log('\n👕 Creando productos...');

  const products = [
    // ROPA
    {
      sku: 'CAM-0001',
      slug: 'camiseta-sublimacion-full-print',
      name: 'Camiseta Sublimación Full Print',
      description: 'Camiseta 100% poliéster ideal para sublimación completa. Colores vibrantes y duraderos.',
      type: 'camiseta',
      category: 'ropa',
      basePrice: 25000,
      stock: 150,
      featured: true,
      images: {
        front: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
        back: 'https://images.unsplash.com/photo-1622445275576-721325c6c4ff?w=800&q=80',
      },
      colors: [
        { name: 'Blanco', hex: '#FFFFFF' },
        { name: 'Negro', hex: '#000000' },
        { name: 'Gris', hex: '#9CA3AF' },
      ],
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      tags: ['sublimación', 'full print', 'poliéster'],
      rating: 4.8,
      reviewsCount: 156,
    },
    {
      sku: 'HOO-0001',
      slug: 'buzo-capucha-sublimable',
      name: 'Buzo con Capucha Sublimable',
      description: 'Hoodie de poliéster con interior afelpado. Perfecto para diseños personalizados en toda la prenda.',
      type: 'hoodie',
      category: 'ropa',
      basePrice: 65000,
      stock: 85,
      featured: true,
      images: {
        front: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80',
        back: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80',
      },
      colors: [
        { name: 'Blanco', hex: '#FFFFFF' },
        { name: 'Gris Claro', hex: '#D1D5DB' },
      ],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      tags: ['hoodie', 'sublimación', 'capucha'],
      rating: 4.9,
      reviewsCount: 203,
    },
    {
      sku: 'SUE-0001',
      slug: 'sueter-cuello-redondo',
      name: 'Suéter Cuello Redondo',
      description: 'Suéter sin capucha ideal para sublimación. Material suave y cómodo para uso diario.',
      type: 'sueter',
      category: 'ropa',
      basePrice: 55000,
      stock: 70,
      featured: true,
      images: {
        front: 'https://images.unsplash.com/photo-1572495532056-8583af1cbae0?w=800&q=80',
        back: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&q=80',
      },
      colors: [
        { name: 'Blanco', hex: '#FFFFFF' },
        { name: 'Gris Melange', hex: '#9CA3AF' },
      ],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      tags: ['suéter', 'buzo', 'sublimación'],
      rating: 4.7,
      reviewsCount: 89,
    },
    {
      sku: 'POL-0001',
      slug: 'polo-deportivo-sublimable',
      name: 'Polo Deportivo Sublimable',
      description: 'Polo en tela deportiva perfecta para sublimación. Ideal para uniformes y equipos.',
      type: 'polo',
      category: 'ropa',
      basePrice: 35000,
      stock: 100,
      featured: false,
      images: {
        front: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
        back: 'https://images.unsplash.com/photo-1628270069400-0cf93e08e2cd?w=800&q=80',
      },
      colors: [
        { name: 'Blanco', hex: '#FFFFFF' },
        { name: 'Azul Claro', hex: '#93C5FD' },
      ],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      tags: ['polo', 'deportivo', 'uniformes'],
      rating: 4.6,
      reviewsCount: 67,
    },
    {
      sku: 'CAM-0002',
      slug: 'camiseta-dry-fit-deportiva',
      name: 'Camiseta Dry Fit Deportiva',
      description: 'Camiseta deportiva de tela dry fit. Ideal para uniformes deportivos y gimnasios.',
      type: 'camiseta',
      category: 'ropa',
      basePrice: 28000,
      stock: 180,
      featured: true,
      images: {
        front: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&q=80',
        back: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80',
      },
      colors: [
        { name: 'Blanco', hex: '#FFFFFF' },
        { name: 'Amarillo', hex: '#FDE047' },
        { name: 'Verde Neón', hex: '#4ADE80' },
      ],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      tags: ['dry fit', 'deportivo', 'uniforme'],
      rating: 4.7,
      reviewsCount: 145,
    },
    // ACCESORIOS
    {
      sku: 'GOR-0001',
      slug: 'gorra-trucker-sublimable',
      name: 'Gorra Trucker Sublimable',
      description: 'Gorra con frente sublimable y malla trasera. Perfecta para logos y diseños llamativos.',
      type: 'gorra',
      category: 'accesorios',
      basePrice: 18000,
      stock: 200,
      featured: true,
      images: {
        front: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&q=80',
      },
      colors: [
        { name: 'Blanco/Negro', hex: '#FFFFFF' },
        { name: 'Blanco/Azul', hex: '#FFFFFF' },
        { name: 'Blanco/Rojo', hex: '#FFFFFF' },
      ],
      sizes: ['Unica'],
      tags: ['gorra', 'trucker', 'sublimación'],
      rating: 4.5,
      reviewsCount: 134,
    },
    {
      sku: 'GOR-0002',
      slug: 'gorra-dad-hat-sublimable',
      name: 'Gorra Dad Hat Sublimable',
      description: 'Gorra estilo vintage con frente sublimable. Cierre ajustable de hebilla.',
      type: 'gorra',
      category: 'accesorios',
      basePrice: 16000,
      stock: 150,
      featured: false,
      images: {
        front: 'https://images.unsplash.com/photo-1534215754734-18e55d13e346?w=800&q=80',
      },
      colors: [
        { name: 'Blanco', hex: '#FFFFFF' },
        { name: 'Beige', hex: '#D4B896' },
      ],
      sizes: ['Unica'],
      tags: ['gorra', 'dad hat', 'vintage'],
      rating: 4.5,
      reviewsCount: 78,
    },
    // DRINKWARE
    {
      sku: 'TAZ-0001',
      slug: 'taza-ceramica-11oz',
      name: 'Taza Cerámica 11oz',
      description: 'Taza de cerámica blanca premium para sublimación. Apta para microondas y lavavajillas.',
      type: 'taza',
      category: 'bebidas',
      basePrice: 15000,
      stock: 300,
      featured: true,
      images: {
        front: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80',
      },
      colors: [
        { name: 'Blanco', hex: '#FFFFFF' },
        { name: 'Interior Rojo', hex: '#DC2626' },
        { name: 'Interior Azul', hex: '#2563EB' },
        { name: 'Interior Negro', hex: '#000000' },
      ],
      sizes: ['11oz', '15oz'],
      tags: ['taza', 'cerámica', 'regalo'],
      rating: 4.9,
      reviewsCount: 342,
    },
    {
      sku: 'TAZ-0002',
      slug: 'taza-magica-cambia-color',
      name: 'Taza Mágica Cambia Color',
      description: 'Taza que revela el diseño con el calor. Efecto sorpresa perfecto para regalos.',
      type: 'taza-magica',
      category: 'bebidas',
      basePrice: 22000,
      stock: 150,
      featured: true,
      images: {
        front: 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=800&q=80',
      },
      colors: [
        { name: 'Negro Mágico', hex: '#000000' },
      ],
      sizes: ['11oz'],
      tags: ['taza mágica', 'termosensible', 'regalo'],
      rating: 4.8,
      reviewsCount: 198,
    },
    {
      sku: 'TER-0001',
      slug: 'termo-acero-inoxidable-500ml',
      name: 'Termo Acero Inoxidable 500ml',
      description: 'Botella térmica de acero inoxidable con recubrimiento para sublimación.',
      type: 'termo',
      category: 'bebidas',
      basePrice: 35000,
      stock: 120,
      featured: true,
      images: {
        front: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80',
      },
      colors: [
        { name: 'Blanco', hex: '#FFFFFF' },
        { name: 'Plateado', hex: '#C0C0C0' },
      ],
      sizes: ['350ml', '500ml', '750ml'],
      tags: ['termo', 'botella', 'acero'],
      rating: 4.7,
      reviewsCount: 156,
    },
    {
      sku: 'VAS-0001',
      slug: 'vaso-termico-20oz',
      name: 'Vaso Térmico 20oz',
      description: 'Tumbler de acero inoxidable con tapa. Ideal para sublimación con diseños de 360°.',
      type: 'vaso-termico',
      category: 'bebidas',
      basePrice: 28000,
      stock: 90,
      featured: false,
      images: {
        front: 'https://images.unsplash.com/photo-1571167530149-c1105da4c2c7?w=800&q=80',
      },
      colors: [
        { name: 'Blanco', hex: '#FFFFFF' },
        { name: 'Negro', hex: '#1F2937' },
      ],
      sizes: ['20oz', '30oz'],
      tags: ['vaso', 'tumbler', 'térmico'],
      rating: 4.6,
      reviewsCount: 87,
    },
    {
      sku: 'TAZ-0003',
      slug: 'set-tazas-parejas',
      name: 'Set Tazas Parejas',
      description: 'Set de 2 tazas de cerámica para parejas. Ideal para San Valentín y aniversarios.',
      type: 'taza',
      category: 'bebidas',
      basePrice: 28000,
      stock: 100,
      featured: true,
      images: {
        front: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&q=80',
      },
      colors: [
        { name: 'Blanco Set', hex: '#FFFFFF' },
      ],
      sizes: ['Set x2 (11oz)'],
      tags: ['tazas', 'parejas', 'regalo'],
      rating: 4.9,
      reviewsCount: 256,
    },
    // HOGAR
    {
      sku: 'CUA-0001',
      slug: 'cuadro-aluminio-20x30cm',
      name: 'Cuadro en Aluminio 20x30cm',
      description: 'Panel de aluminio sublimable de alta definición. Colores vibrantes y acabado premium.',
      type: 'cuadro-aluminio',
      category: 'hogar',
      basePrice: 45000,
      stock: 80,
      featured: true,
      images: {
        front: 'https://images.unsplash.com/photo-1513519245088-0e12902e35a6?w=800&q=80',
      },
      colors: [
        { name: 'Aluminio Brillante', hex: '#E5E7EB' },
        { name: 'Aluminio Mate', hex: '#D1D5DB' },
      ],
      sizes: ['15x20cm', '20x30cm', '30x40cm', '40x60cm'],
      tags: ['cuadro', 'aluminio', 'decoración'],
      rating: 4.9,
      reviewsCount: 234,
    },
    {
      sku: 'POS-0001',
      slug: 'posa-vasos-set-x4',
      name: 'Posa Vasos Set x4',
      description: 'Set de 4 posa vasos sublimables. Base de corcho antideslizante.',
      type: 'posa-vasos',
      category: 'hogar',
      basePrice: 25000,
      stock: 150,
      featured: true,
      images: {
        front: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
      },
      colors: [
        { name: 'Cuadrado', hex: '#FFFFFF' },
        { name: 'Redondo', hex: '#FFFFFF' },
      ],
      sizes: ['Set x4', 'Set x6'],
      tags: ['posa vasos', 'set', 'hogar'],
      rating: 4.7,
      reviewsCount: 123,
    },
    {
      sku: 'COJ-0001',
      slug: 'cojin-sublimable-40x40cm',
      name: 'Cojín Sublimable 40x40cm',
      description: 'Cojín con funda sublimable. Incluye relleno. Ideal para decoración personalizada.',
      type: 'cojin',
      category: 'hogar',
      basePrice: 32000,
      stock: 100,
      featured: false,
      images: {
        front: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80',
      },
      colors: [
        { name: 'Blanco', hex: '#FFFFFF' },
      ],
      sizes: ['30x30cm', '40x40cm', '50x50cm'],
      tags: ['cojín', 'almohada', 'decoración'],
      rating: 4.5,
      reviewsCount: 78,
    },
    {
      sku: 'REL-0001',
      slug: 'reloj-pared-20cm',
      name: 'Reloj de Pared 20cm',
      description: 'Reloj de pared circular sublimable. Mecanismo silencioso incluido.',
      type: 'reloj',
      category: 'hogar',
      basePrice: 38000,
      stock: 60,
      featured: false,
      images: {
        front: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800&q=80',
      },
      colors: [
        { name: 'Blanco', hex: '#FFFFFF' },
      ],
      sizes: ['20cm', '30cm'],
      tags: ['reloj', 'pared', 'decoración'],
      rating: 4.6,
      reviewsCount: 45,
    },
    {
      sku: 'ROM-0001',
      slug: 'rompecabezas-sublimable',
      name: 'Rompecabezas Sublimable',
      description: 'Puzzle personalizado de cartón premium. Disponible en varias piezas.',
      type: 'rompecabezas',
      category: 'hogar',
      basePrice: 28000,
      stock: 80,
      featured: true,
      images: {
        front: 'https://images.unsplash.com/photo-1494059980473-813e73ee784b?w=800&q=80',
      },
      colors: [
        { name: 'Cartón Premium', hex: '#F5F5F4' },
      ],
      sizes: ['A5 (24 piezas)', 'A4 (120 piezas)', 'A3 (252 piezas)'],
      tags: ['puzzle', 'rompecabezas', 'regalo'],
      rating: 4.8,
      reviewsCount: 167,
    },
    {
      sku: 'MAN-0001',
      slug: 'manta-polar-sublimable',
      name: 'Manta Polar Sublimable',
      description: 'Manta de polar suave 100x150cm. Sublimación en toda la superficie.',
      type: 'manta',
      category: 'hogar',
      basePrice: 75000,
      stock: 40,
      featured: false,
      images: {
        front: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
      },
      colors: [
        { name: 'Blanco', hex: '#FFFFFF' },
      ],
      sizes: ['100x150cm', '150x200cm'],
      tags: ['manta', 'polar', 'cobija'],
      rating: 4.7,
      reviewsCount: 56,
    },
    // ACCESORIOS ADICIONALES
    {
      sku: 'LLA-0001',
      slug: 'llavero-mdf-rectangular',
      name: 'Llavero MDF Rectangular',
      description: 'Llavero de MDF sublimable con argolla metálica. Perfecto para recuerdos.',
      type: 'llavero',
      category: 'accesorios',
      basePrice: 5000,
      stock: 500,
      featured: true,
      images: {
        front: 'https://images.unsplash.com/photo-1622556498246-755f44ca76f3?w=800&q=80',
      },
      colors: [
        { name: 'MDF Natural', hex: '#D4A574' },
      ],
      sizes: ['Rectangular', 'Circular', 'Corazon', 'Estrella'],
      tags: ['llavero', 'MDF', 'promocional'],
      rating: 4.4,
      reviewsCount: 234,
    },
    {
      sku: 'MOU-0001',
      slug: 'mousepad-gamer-xl',
      name: 'Mouse Pad Gamer XL',
      description: 'Mouse pad extendido 80x30cm con base antideslizante.',
      type: 'mouse-pad',
      category: 'accesorios',
      basePrice: 22000,
      stock: 120,
      featured: true,
      images: {
        front: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80',
      },
      colors: [
        { name: 'Negro', hex: '#000000' },
      ],
      sizes: ['Standard (25x20cm)', 'Grande (40x30cm)', 'XL (80x30cm)'],
      tags: ['mouse pad', 'gamer', 'escritorio'],
      rating: 4.8,
      reviewsCount: 189,
    },
    {
      sku: 'FUN-0001',
      slug: 'funda-celular-sublimable',
      name: 'Funda Celular Sublimable',
      description: 'Funda dura para smartphone con superficie sublimable.',
      type: 'funda-celular',
      category: 'accesorios',
      basePrice: 18000,
      stock: 200,
      featured: false,
      images: {
        front: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&q=80',
      },
      colors: [
        { name: 'Blanco', hex: '#FFFFFF' },
        { name: 'Transparente', hex: '#F3F4F6' },
      ],
      sizes: ['iPhone 13/14', 'iPhone 15', 'Samsung S23', 'Samsung S24'],
      tags: ['funda', 'celular', 'smartphone'],
      rating: 4.3,
      reviewsCount: 98,
    },
    {
      sku: 'BOL-0001',
      slug: 'bolsa-tote-bag-sublimable',
      name: 'Bolsa Tote Bag Sublimable',
      description: 'Bolsa de poliéster resistente para sublimación completa.',
      type: 'bolsa-tote',
      category: 'accesorios',
      basePrice: 20000,
      stock: 150,
      featured: false,
      images: {
        front: 'https://images.unsplash.com/photo-1597633125097-5a9ae3370364?w=800&q=80',
      },
      colors: [
        { name: 'Blanco', hex: '#FFFFFF' },
      ],
      sizes: ['Pequena', 'Mediana', 'Grande'],
      tags: ['bolsa', 'tote', 'ecológica'],
      rating: 4.5,
      reviewsCount: 87,
    },
    {
      sku: 'LAN-0001',
      slug: 'cordon-lanyard-sublimable',
      name: 'Cordón Lanyard Sublimable',
      description: 'Lanyard de poliéster para credenciales. Sublimación a doble cara.',
      type: 'lanyard',
      category: 'accesorios',
      basePrice: 8000,
      stock: 300,
      featured: false,
      images: {
        front: 'https://images.unsplash.com/photo-1612423284934-2850a4ea6b0f?w=800&q=80',
      },
      colors: [
        { name: 'Blanco', hex: '#FFFFFF' },
      ],
      sizes: ['Standard (90cm)', 'Corto (45cm)'],
      tags: ['lanyard', 'cordón', 'credencial'],
      rating: 4.4,
      reviewsCount: 112,
    },
    // OFICINA
    {
      sku: 'LIB-0001',
      slug: 'libreta-a5-tapa-dura',
      name: 'Libreta A5 Tapa Dura',
      description: 'Libreta con tapa dura sublimable. 100 hojas rayadas.',
      type: 'libreta',
      category: 'oficina',
      basePrice: 25000,
      stock: 100,
      featured: false,
      images: {
        front: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80',
      },
      colors: [
        { name: 'Blanco', hex: '#FFFFFF' },
      ],
      sizes: ['A6', 'A5', 'A4'],
      tags: ['libreta', 'cuaderno', 'oficina'],
      rating: 4.6,
      reviewsCount: 67,
    },
    {
      sku: 'CAL-0001',
      slug: 'calendario-escritorio',
      name: 'Calendario de Escritorio',
      description: 'Calendario de escritorio con base de cartón. 12 hojas sublimables.',
      type: 'calendario',
      category: 'oficina',
      basePrice: 28000,
      stock: 80,
      featured: false,
      images: {
        front: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=800&q=80',
      },
      colors: [
        { name: 'Blanco', hex: '#FFFFFF' },
      ],
      sizes: ['Escritorio', 'Pared A4', 'Pared A3'],
      tags: ['calendario', 'escritorio', 'oficina'],
      rating: 4.5,
      reviewsCount: 45,
    },
  ];

  for (const product of products) {
    // Get category and product type IDs
    const categoryRecord = await prisma.category.findUnique({
      where: { slug: product.category },
    });

    const productTypeRecord = await prisma.productType.findUnique({
      where: { slug: product.type },
    });

    // Upsert the product
    const createdProduct = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        categoryId: categoryRecord?.id,
        typeId: productTypeRecord?.id,
        basePrice: product.basePrice,
        stock: product.stock,
        featured: product.featured,
        images: product.images,
        tags: product.tags,
      },
      create: {
        sku: product.sku,
        slug: product.slug,
        name: product.name,
        description: product.description,
        categoryId: categoryRecord?.id,
        typeId: productTypeRecord?.id,
        basePrice: product.basePrice,
        stock: product.stock,
        featured: product.featured,
        images: product.images,
        tags: product.tags,
        isActive: true,
      },
    });

    // Handle product colors (many-to-many relationship)
    if (product.colors && Array.isArray(product.colors)) {
      for (const colorData of product.colors) {
        const colorSlug = slugify(colorData.name);

        // Find or create the color
        const colorRecord = await prisma.color.upsert({
          where: { slug: colorSlug },
          update: {},
          create: {
            name: colorData.name,
            slug: colorSlug,
            hexCode: colorData.hex,
            isActive: true,
          },
        });

        // Create the product-color relationship
        await prisma.productColor.upsert({
          where: {
            productId_colorId: {
              productId: createdProduct.id,
              colorId: colorRecord.id,
            },
          },
          update: {},
          create: {
            productId: createdProduct.id,
            colorId: colorRecord.id,
          },
        });
      }
    }

    // Handle product sizes (many-to-many relationship)
    if (product.sizes && Array.isArray(product.sizes)) {
      for (const sizeName of product.sizes) {
        // Find the size by name
        const sizeRecord = await prisma.size.findFirst({
          where: { name: sizeName },
        });

        if (sizeRecord) {
          // Create the product-size relationship
          await prisma.productSize.upsert({
            where: {
              productId_sizeId: {
                productId: createdProduct.id,
                sizeId: sizeRecord.id,
              },
            },
            update: {},
            create: {
              productId: createdProduct.id,
              sizeId: sizeRecord.id,
            },
          });
        }
      }
    }

    console.log(`  ✅ Producto: ${product.name} (SKU: ${product.sku})`);
  }

  // ==================== CONFIGURACIÓN ====================
  console.log('\n⚙️ Creando configuración inicial...');

  await prisma.setting.upsert({
    where: { key: 'store_settings' },
    update: {},
    create: {
      key: 'store_settings',
      value: {
        storeName: 'Sublimados Marketplace',
        storeDescription: 'Tu tienda de productos personalizados con sublimación',
        storeEmail: 'contacto@sublimados.com',
        storePhone: '+57 300 123 4567',
        storeAddress: 'Bogotá, Colombia',
        socialMedia: {
          facebook: 'https://facebook.com/sublimados',
          instagram: 'https://instagram.com/sublimados',
          whatsapp: '573001234567',
        },
      },
    },
  });
  console.log('  ✅ Configuración de tienda');

  await prisma.setting.upsert({
    where: { key: 'order_settings' },
    update: {},
    create: {
      key: 'order_settings',
      value: {
        shippingCost: 12000,
        freeShippingThreshold: 150000,
        taxRate: 0.19,
        minOrderAmount: 15000,
        maxOrderItems: 50,
      },
    },
  });
  console.log('  ✅ Configuración de pedidos');

  await prisma.setting.upsert({
    where: { key: 'payment_settings' },
    update: {},
    create: {
      key: 'payment_settings',
      value: {
        enabledMethods: ['cash', 'transfer', 'nequi'],
        bankInfo: {
          bankName: 'Bancolombia',
          accountType: 'Ahorros',
          accountNumber: '123-456789-00',
          accountHolder: 'Sublimados SAS',
        },
        nequiNumber: '3001234567',
      },
    },
  });
  console.log('  ✅ Configuración de pagos');

  await prisma.setting.upsert({
    where: { key: 'notification_settings' },
    update: {},
    create: {
      key: 'notification_settings',
      value: {
        emailNotifications: true,
        orderConfirmation: true,
        orderStatusUpdates: true,
        lowStockAlerts: true,
        lowStockThreshold: 10,
      },
    },
  });
  console.log('  ✅ Configuración de notificaciones');

  // ==================== TIPOS DE ZONA ====================
  console.log('\n📐 Creando tipos de zona...');

  const zoneTypes = [
    { name: 'Frente', slug: 'front', description: 'Zonas frontales del producto', order: 1 },
    { name: 'Espalda', slug: 'back', description: 'Zonas traseras del producto', order: 2 },
    { name: 'Mangas', slug: 'sleeve', description: 'Zonas de mangas y laterales', order: 3 },
    { name: 'Alrededor', slug: 'around', description: 'Diseño alrededor del producto (cilíndricos)', order: 4 },
    { name: 'Superior', slug: 'top', description: 'Parte superior del producto', order: 5 },
  ];

  for (const zoneType of zoneTypes) {
    await prisma.zoneType.upsert({
      where: { slug: zoneType.slug },
      update: { name: zoneType.name, description: zoneType.description },
      create: {
        name: zoneType.name,
        slug: zoneType.slug,
        description: zoneType.description,
        sortOrder: zoneType.order,
        isActive: true,
      },
    });
    console.log(`  ✅ Tipo de Zona: ${zoneType.name}`);
  }

  // ==================== TEMPLATES (PRODUCTOS CON ZONAS) ====================
  console.log('\n🎨 Creando templates de ejemplo...');

  // Buscar tipos de zona que acabamos de crear
  const frontZoneType = await prisma.zoneType.findUnique({ where: { slug: 'front' } });
  const backZoneType = await prisma.zoneType.findUnique({ where: { slug: 'back' } });
  const sleeveZoneType = await prisma.zoneType.findUnique({ where: { slug: 'sleeve' } });
  const aroundZoneType = await prisma.zoneType.findUnique({ where: { slug: 'around' } });

  // Buscar categorías y tipos
  const ropaCategoryRecord = await prisma.category.findUnique({ where: { slug: 'ropa' } });
  const camisetaTypeRecord = await prisma.productType.findUnique({ where: { slug: 'camiseta' } });
  const tazaTypeRecord = await prisma.productType.findUnique({ where: { slug: 'taza' } });

  // Template 1: Camiseta con zonas Front, Back y Mangas
  const templateCamiseta = await prisma.product.upsert({
    where: { sku: 'TMPL-CAM-001' },
    update: {},
    create: {
      sku: 'TMPL-CAM-001',
      slug: 'camiseta-personalizable',
      name: 'Camiseta Personalizable',
      description: 'Camiseta 100% algodón con áreas personalizables en frente, espalda y mangas',
      categoryId: ropaCategoryRecord?.id,
      typeId: camisetaTypeRecord?.id,
      basePrice: 35000,
      stock: 500,
      featured: true,
      isTemplate: true,
      images: {
        front: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
        back: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&q=80',
      },
      tags: ['camiseta', 'personalizable', 'template'],
      isActive: true,
    },
  });
  console.log(`  ✅ Template: ${templateCamiseta.name}`);

  // Crear zonas para la camiseta
  if (frontZoneType) {
    const zone1 = await prisma.templateZone.create({
      data: {
        templateId: templateCamiseta.id,
        zoneTypeId: frontZoneType.id,
        zoneId: 'front-regular',
        name: 'Pecho Central (20x15cm)',
        description: 'Área central del frente ideal para logos y textos',
        positionX: 50,
        positionY: 30,
        maxWidth: 200,
        maxHeight: 150,
        isEditable: true,
        isRequired: false,
        sortOrder: 1,
        isActive: true,
      },
    });
    console.log(`    ✅ Zona: ${zone1.name}`);
  }

  if (backZoneType) {
    const zone2 = await prisma.templateZone.create({
      data: {
        templateId: templateCamiseta.id,
        zoneTypeId: backZoneType.id,
        zoneId: 'back-large',
        name: 'Espalda Completa (25x30cm)',
        description: 'Área completa de la espalda para diseños grandes',
        positionX: 50,
        positionY: 40,
        maxWidth: 250,
        maxHeight: 300,
        isEditable: true,
        isRequired: false,
        sortOrder: 2,
        isActive: true,
      },
    });
    console.log(`    ✅ Zona: ${zone2.name}`);
  }

  if (sleeveZoneType) {
    const zone3 = await prisma.templateZone.create({
      data: {
        templateId: templateCamiseta.id,
        zoneTypeId: sleeveZoneType.id,
        zoneId: 'sleeve-left',
        name: 'Manga Izquierda (8x8cm)',
        description: 'Área pequeña en la manga izquierda',
        positionX: 20,
        positionY: 25,
        maxWidth: 80,
        maxHeight: 80,
        isEditable: true,
        isRequired: false,
        sortOrder: 3,
        isActive: true,
      },
    });
    console.log(`    ✅ Zona: ${zone3.name}`);

    const zone4 = await prisma.templateZone.create({
      data: {
        templateId: templateCamiseta.id,
        zoneTypeId: sleeveZoneType.id,
        zoneId: 'sleeve-right',
        name: 'Manga Derecha (8x8cm)',
        description: 'Área pequeña en la manga derecha',
        positionX: 80,
        positionY: 25,
        maxWidth: 80,
        maxHeight: 80,
        isEditable: true,
        isRequired: false,
        sortOrder: 4,
        isActive: true,
      },
    });
    console.log(`    ✅ Zona: ${zone4.name}`);
  }

  // Template 2: Taza con zona alrededor
  const templateTaza = await prisma.product.upsert({
    where: { sku: 'TMPL-TAZ-001' },
    update: {},
    create: {
      sku: 'TMPL-TAZ-001',
      slug: 'taza-personalizable',
      name: 'Taza Personalizable 11oz',
      description: 'Taza de cerámica blanca 11oz con área de personalización completa',
      categoryId: await prisma.category.findUnique({ where: { slug: 'hogar' } }).then(c => c?.id),
      typeId: tazaTypeRecord?.id,
      basePrice: 15000,
      stock: 300,
      featured: true,
      isTemplate: true,
      images: {
        front: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80',
      },
      tags: ['taza', 'personalizable', 'template', 'sublimacion'],
      isActive: true,
    },
  });
  console.log(`  ✅ Template: ${templateTaza.name}`);

  // Crear zona alrededor para la taza
  if (aroundZoneType) {
    const zoneTaza = await prisma.templateZone.create({
      data: {
        templateId: templateTaza.id,
        zoneTypeId: aroundZoneType.id,
        zoneId: 'around-full',
        name: 'Área Completa 360° (35x20cm)',
        description: 'Área completa alrededor de la taza para diseños panorámicos',
        positionX: 0,
        positionY: 20,
        maxWidth: 350,
        maxHeight: 200,
        isEditable: true,
        isRequired: true,
        sortOrder: 1,
        isActive: true,
      },
    });
    console.log(`    ✅ Zona: ${zoneTaza.name}`);
  }

  // ==================== TIPOS DE INSUMO ====================
  console.log('\n🧵 Creando tipos de insumo...');

  const inputTypes = [
    {
      name: 'DTF (Direct to Film)',
      slug: 'dtf',
      description: 'Transferencia directa a film para aplicación en prendas',
      order: 1,
    },
    {
      name: 'Vinilo Textil',
      slug: 'vinilo-textil',
      description: 'Vinilo termotransferible para telas',
      order: 2,
    },
    {
      name: 'Sublimación',
      slug: 'sublimacion',
      description: 'Tinta sublimable para impresión en poliéster',
      order: 3,
    },
    {
      name: 'Vinilo Adhesivo',
      slug: 'vinilo-adhesivo',
      description: 'Vinilo autoadhesivo para superficies rígidas',
      order: 4,
    },
    {
      name: 'Serigrafía',
      slug: 'serigrafia',
      description: 'Tintas para serigrafía textil',
      order: 5,
    },
    {
      name: 'Bordado',
      slug: 'bordado',
      description: 'Hilos y materiales para bordado',
      order: 6,
    },
  ];

  for (const inputType of inputTypes) {
    await prisma.inputType.upsert({
      where: { slug: inputType.slug },
      update: { name: inputType.name, description: inputType.description },
      create: {
        name: inputType.name,
        slug: inputType.slug,
        description: inputType.description,
        sortOrder: inputType.order,
        isActive: true,
      },
    });
    console.log(`  ✅ Tipo de Insumo: ${inputType.name}`);
  }

  // ==================== INSUMOS ====================
  console.log('\n📦 Creando insumos de ejemplo...');

  // Obtener IDs de tipos de insumo
  const sublimacionType = await prisma.inputType.findUnique({ where: { slug: 'sublimacion' } });
  const vitroimpressionType = await prisma.inputType.findUnique({ where: { slug: 'vitroimpression' } });
  const dtfType = await prisma.inputType.findUnique({ where: { slug: 'dtf' } });

  if (sublimacionType) {
    // Insumos de Sublimación
    await prisma.input.upsert({
      where: { code: 'SUB-TELA-POLY-BL' },
      update: {},
      create: {
        code: 'SUB-TELA-POLY-BL',
        inputTypeId: sublimacionType.id,
        name: 'Tela Polyester Blanca',
        description: 'Tela 100% polyester para sublimación, color blanco',
        unitOfMeasure: 'metros',
        currentStock: 150,
        minStock: 50,
        maxStock: 300,
        unitCost: 8500,
        isActive: true,
      },
    });

    await prisma.input.upsert({
      where: { code: 'SUB-TINTA-CYAN' },
      update: {},
      create: {
        code: 'SUB-TINTA-CYAN',
        inputTypeId: sublimacionType.id,
        name: 'Tinta Sublimación Cyan',
        description: 'Tinta para impresora de sublimación, color cyan',
        unitOfMeasure: 'ml',
        currentStock: 2500,
        minStock: 500,
        maxStock: 5000,
        unitCost: 45,
        isActive: true,
      },
    });

    await prisma.input.upsert({
      where: { code: 'SUB-TINTA-MAG' },
      update: {},
      create: {
        code: 'SUB-TINTA-MAG',
        inputTypeId: sublimacionType.id,
        name: 'Tinta Sublimación Magenta',
        description: 'Tinta para impresora de sublimación, color magenta',
        unitOfMeasure: 'ml',
        currentStock: 2300,
        minStock: 500,
        maxStock: 5000,
        unitCost: 45,
        isActive: true,
      },
    });
  }

  if (dtfType) {
    // Insumos DTF
    await prisma.input.upsert({
      where: { code: 'DTF-FILM-A3' },
      update: {},
      create: {
        code: 'DTF-FILM-A3',
        inputTypeId: dtfType.id,
        name: 'Film DTF A3',
        description: 'Película para impresión DTF, tamaño A3',
        unitOfMeasure: 'hojas',
        currentStock: 500,
        minStock: 100,
        maxStock: 1000,
        unitCost: 2500,
        isActive: true,
      },
    });

    await prisma.input.upsert({
      where: { code: 'DTF-POLVO-ADH' },
      update: {},
      create: {
        code: 'DTF-POLVO-ADH',
        inputTypeId: dtfType.id,
        name: 'Polvo Adhesivo DTF',
        description: 'Polvo termoadhesivo for transfers DTF',
        unitOfMeasure: 'kg',
        currentStock: 25,
        minStock: 5,
        maxStock: 50,
        unitCost: 85000,
        isActive: true,
      },
    });
  }

  if (vitroimpressionType) {
    // Insumos Vitroimpresión
    await prisma.input.upsert({
      where: { code: 'VIT-TAZA-11OZ' },
      update: {},
      create: {
        code: 'VIT-TAZA-11OZ',
        inputTypeId: vitroimpressionType.id,
        name: 'Taza Cerámica Blanca 11oz',
        description: 'Taza de cerámica apta para sublimación, 11 onzas',
        unitOfMeasure: 'unidades',
        currentStock: 200,
        minStock: 50,
        maxStock: 500,
        unitCost: 4500,
        isActive: true,
      },
    });
  }

  console.log('  ✅ Insumos de ejemplo creados');

  console.log('\n✨ Seed completado exitosamente!\n');
  console.log('📊 Resumen:');
  console.log(`   - ${products.length} productos`);
  console.log(`   - 2 templates con zonas personalizables (Camiseta y Taza)`);
  console.log(`   - ${categories.length} categorías`);
  console.log(`   - ${productTypes.length} tipos de producto`);
  console.log(`   - ${sizes.length} tallas`);
  console.log(`   - ${colors.length} colores`);
  console.log(`   - ${zoneTypes.length} tipos de zona`);
  console.log(`   - ${inputTypes.length} tipos de insumo`);
  console.log(`   - 6 insumos de ejemplo`);
  console.log('\n👤 Usuarios de prueba (1 por rol):');
  console.log('   📧 SuperAdmin: admin@marketplace.com / admin123 (roleId: 1)');
  console.log('   📧 Cliente: cliente@marketplace.com / cliente123 (roleId: 2)');
  console.log('   📧 Administrador: vendedor@marketplace.com / vendedor123 (roleId: 3)');
  console.log('\n🔒 Roles del sistema (no editables): SuperAdmin (1), Cliente (2)');
  console.log('✏️  Roles personalizables: Administrador (3+)');
  console.log('\n🎨 Templates disponibles en /admin-panel/templates');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
