import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { seedLabelTemplates } from './seeds/label-templates.seed';

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
    update: {
      permissions: [
        // Dashboard
        'dashboard.view',
        // Products
        'products.view', 'products.create', 'products.edit', 'products.delete', 'products.manage',
        // Orders
        'orders.view', 'orders.create', 'orders.edit', 'orders.delete', 'orders.manage',
        // Users
        'users.view', 'users.create', 'users.edit', 'users.delete',
        // Admins
        'admins.view', 'admins.create', 'admins.edit', 'admins.delete',
        // Roles
        'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
        // Settings
        'settings.view', 'settings.edit',
        'settings.general', 'settings.appearance', 'settings.home',
        'settings.catalog', 'settings.shipping', 'settings.payment', 'settings.legal',
        // Reports
        'reports.view', 'reports.export',
        // Catalogs
        'catalogs.view', 'catalogs.create', 'catalogs.edit', 'catalogs.delete',
        // POS
        'pos.access', 'pos.create_sale', 'pos.view_sales', 'pos.cancel_sale',
        'pos.cash_register', 'pos.open_close_session', 'pos.view_reports',
      ],
    },
    create: {
      id: 1,
      name: 'SuperAdmin',
      slug: 'superadmin',
      description: 'Administrador con acceso total al sistema',
      permissions: [
        // Dashboard
        'dashboard.view',
        // Products
        'products.view', 'products.create', 'products.edit', 'products.delete', 'products.manage',
        // Orders
        'orders.view', 'orders.create', 'orders.edit', 'orders.delete', 'orders.manage',
        // Users
        'users.view', 'users.create', 'users.edit', 'users.delete',
        // Admins
        'admins.view', 'admins.create', 'admins.edit', 'admins.delete',
        // Roles
        'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
        // Settings
        'settings.view', 'settings.edit',
        'settings.general', 'settings.appearance', 'settings.home',
        'settings.catalog', 'settings.shipping', 'settings.payment', 'settings.legal',
        // Reports
        'reports.view', 'reports.export',
        // Catalogs
        'catalogs.view', 'catalogs.create', 'catalogs.edit', 'catalogs.delete',
        // POS
        'pos.access', 'pos.create_sale', 'pos.view_sales', 'pos.cancel_sale',
        'pos.cash_register', 'pos.open_close_session', 'pos.view_reports',
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

  // Rol 4: Cajero - Para usuarios del sistema POS
  const cajeroRole = await prisma.role.upsert({
    where: { id: 4 },
    update: {
      name: 'Cajero',
      slug: 'cajero',
      description: 'Cajero con acceso al sistema POS para ventas físicas',
      permissions: [
        'pos.access',
        'pos.create_sale',
        'pos.view_sales',
        'pos.cash_register',
        'pos.open_close_session',
        'products.view',
      ],
    },
    create: {
      id: 4,
      name: 'Cajero',
      slug: 'cajero',
      description: 'Cajero con acceso al sistema POS para ventas físicas',
      permissions: [
        'pos.access',
        'pos.create_sale',
        'pos.view_sales',
        'pos.cash_register',
        'pos.open_close_session',
        'products.view',
      ],
      isSystem: false,
      isActive: true,
    },
  });
  console.log(`  ✅ Rol creado: ${cajeroRole.name} (ID: 4, cajero POS)`);

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

  // Cajero - roleId 4 (acceso al sistema POS)
  const cajeroPassword = await hashPassword('cajero123');
  const cajero = await prisma.user.upsert({
    where: { email: 'cajero@marketplace.com' },
    update: { roleId: 4 },
    create: {
      email: 'cajero@marketplace.com',
      passwordHash: cajeroPassword,
      name: 'Cajero POS',
      phone: '+57 312 222 2222',
      roleId: 4, // Cajero
      status: 'ACTIVE',
    },
  });
  console.log(`  ✅ Usuario creado: ${cajero.email} (Cajero, contraseña: cajero123)`);

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

  // ==================== TALLAS ====================
  console.log('\n📏 Creando tallas...');

  const sizes = [
    // Tallas de ropa
    { name: 'Extra Small', abbreviation: 'XS', order: 1 },
    { name: 'Small', abbreviation: 'S', order: 2 },
    { name: 'Medium', abbreviation: 'M', order: 3 },
    { name: 'Large', abbreviation: 'L', order: 4 },
    { name: 'Extra Large', abbreviation: 'XL', order: 5 },
    { name: 'Extra Extra Large', abbreviation: 'XXL', order: 6 },
    { name: 'Talla Única', abbreviation: 'Unica', order: 7 },
    // Tallas de tazas
    { name: '11 onzas', abbreviation: '11oz', order: 20 },
    { name: '15 onzas', abbreviation: '15oz', order: 21 },
    { name: '20 onzas', abbreviation: '20oz', order: 22 },
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

  // Solo los colores que se usan en los productos
  const colors = [
    { name: 'Negro', slug: 'negro', hex: '#000000' },
    { name: 'Blanco', slug: 'blanco', hex: '#FFFFFF' },
    { name: 'Gris', slug: 'gris', hex: '#9CA3AF' },
    { name: 'Azul', slug: 'azul', hex: '#2563EB' },
    { name: 'Rojo', slug: 'rojo', hex: '#DC2626' },
    { name: 'Verde', slug: 'verde', hex: '#16A34A' },
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

  // ==================== TIPOS DE PRODUCTO ====================
  console.log('\n🏷️ Creando tipos de producto...');

  // Buscar categorías
  const ropaCat = await prisma.category.findUnique({ where: { slug: 'ropa' } });
  const bebidasCat = await prisma.category.findUnique({ where: { slug: 'bebidas' } });

  // Solo 3 tipos para las 3 plantillas
  const productTypes = [
    {
      name: 'Suéter',
      slug: 'sueter',
      description: 'Suéteres personalizables',
      categoryId: ropaCat?.id,
      sizes: ['M', 'L', 'XL']
    },
    {
      name: 'Blusa',
      slug: 'blusa',
      description: 'Blusas personalizables',
      categoryId: ropaCat?.id,
      sizes: ['Unica']
    },
    {
      name: 'Taza',
      slug: 'taza',
      description: 'Tazas de cerámica',
      categoryId: bebidasCat?.id,
      sizes: ['11oz', '15oz', '20oz']
    },
  ];

  for (const type of productTypes) {
    const productType = await prisma.productType.upsert({
      where: { slug: type.slug },
      update: {
        name: type.name,
        description: type.description,
        categoryId: type.categoryId
      },
      create: {
        name: type.name,
        slug: type.slug,
        description: type.description,
        categoryId: type.categoryId,
        isActive: true,
      },
    });
    console.log(`  ✅ Tipo: ${type.name}`);

    // Asignar tallas al tipo de producto
    if (type.sizes && type.sizes.length > 0) {
      for (const sizeAbbr of type.sizes) {
        const size = await prisma.size.findFirst({ where: { abbreviation: sizeAbbr } });
        if (size) {
          await prisma.productTypeSize.upsert({
            where: {
              productTypeId_sizeId: {
                productTypeId: productType.id,
                sizeId: size.id,
              },
            },
            update: {},
            create: {
              productTypeId: productType.id,
              sizeId: size.id,
            },
          });
        }
      }
      console.log(`    ✅ Asignadas ${type.sizes.length} tallas`);
    }
  }

  // ==================== PRODUCTOS ====================
  // Los productos de ejemplo se crean después de los insumos
  // console.log('\n👕 Creando productos...');

  /*const products = [
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
  }*/

  // ==================== CAJAS REGISTRADORAS ====================
  console.log('\n💰 Creando cajas registradoras...');

  await prisma.cashRegister.upsert({
    where: { code: 'CAJA-001' },
    update: {},
    create: {
      name: 'Caja Principal',
      code: 'CAJA-001',
      location: 'Punto de Venta Principal',
      isActive: true,
    },
  });
  console.log('  ✅ Caja Principal (CAJA-001)');

  await prisma.cashRegister.upsert({
    where: { code: 'CAJA-002' },
    update: {},
    create: {
      name: 'Caja Secundaria',
      code: 'CAJA-002',
      location: 'Punto de Venta Secundario',
      isActive: true,
    },
  });
  console.log('  ✅ Caja Secundaria (CAJA-002)');

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

  // Home Settings con Hero Cards por defecto
  await prisma.setting.upsert({
    where: { key: 'home_settings' },
    update: {},
    create: {
      key: 'home_settings',
      value: {
        enableCustomizer: true,
        hero: {
          cards: [
            {
              id: 'main',
              position: 'main',
              order: 0,
              title: 'Diseñado por ti,',
              titleLine2: 'hecho por Vexa',
              subtitle: 'Personaliza camisetas, hoodies y más con tus propios diseños.',
              showSubtitle: true,
              showBadge: false,
              badge: '',
              buttons: [
                {
                  id: 'btn-1',
                  text: 'Crear diseño',
                  link: '/customizer',
                  style: 'primary',
                  icon: 'palette',
                  isActive: true,
                },
                {
                  id: 'btn-2',
                  text: 'Ver catálogo',
                  link: '/catalog',
                  style: 'secondary',
                  icon: 'shoppingBag',
                  isActive: true,
                },
              ],
              background: {
                type: 'gradient',
                overlayOpacity: 0,
              },
              isActive: true,
            },
            {
              id: 'side-1',
              position: 'side',
              order: 1,
              title: 'Personaliza',
              subtitle: 'Tu creatividad',
              showSubtitle: true,
              showBadge: false,
              badge: '',
              buttons: [
                {
                  id: 'btn-side-1',
                  text: 'Personalizar',
                  link: '/customizer',
                  style: 'primary',
                  isActive: true,
                },
              ],
              background: {
                type: 'gradient',
                gradientColors: {
                  from: '#ec4899',
                  to: '#ec4899',
                },
                overlayOpacity: 20,
              },
              isActive: true,
            },
            {
              id: 'side-2',
              position: 'side',
              order: 2,
              title: 'Lo más vendido',
              subtitle: 'Tendencias',
              showSubtitle: true,
              showBadge: false,
              badge: '',
              buttons: [
                {
                  id: 'btn-side-2',
                  text: 'Ver más',
                  link: '/catalog?featured=true',
                  style: 'primary',
                  isActive: true,
                },
              ],
              background: {
                type: 'gradient',
                gradientColors: {
                  from: '#f59e0b',
                  to: '#f59e0b',
                },
                overlayOpacity: 20,
              },
              isActive: true,
            },
          ],
          showSideCards: true,
          sideCardsVisibleOnMobile: false,
        },
        showFeatures: true,
        features: [
          {
            id: 'feature-1',
            icon: 'palette',
            title: 'Personalización Fácil',
            description: 'Editor visual intuitivo para crear diseños únicos',
            isActive: true,
            order: 1,
          },
          {
            id: 'feature-2',
            icon: 'sparkles',
            title: 'Alta Calidad',
            description: 'Productos premium con impresión HD',
            isActive: true,
            order: 2,
          },
          {
            id: 'feature-3',
            icon: 'truck',
            title: 'Envío Rápido',
            description: 'Entrega en tiempo récord',
            isActive: true,
            order: 3,
          },
          {
            id: 'feature-4',
            icon: 'shield',
            title: 'Garantía',
            description: 'Satisfacción garantizada o devolución',
            isActive: true,
            order: 4,
          },
        ],
        productSections: [
          {
            id: 'section-featured',
            title: 'Productos Destacados',
            subtitle: 'Los favoritos de nuestros clientes',
            showSubtitle: true,
            filters: { featured: true },
            maxProducts: 8,
            showViewAll: true,
            viewAllLink: '/catalog?featured=true',
            isActive: true,
            order: 1,
          },
          {
            id: 'section-new',
            title: 'Novedades',
            subtitle: 'Recién llegados a la tienda',
            showSubtitle: true,
            filters: { newArrivals: true },
            maxProducts: 8,
            showViewAll: true,
            viewAllLink: '/catalog?newArrivals=true',
            isActive: true,
            order: 2,
          },
        ],
        cta: {
          badge: 'Crea sin límites',
          showBadge: true,
          title: '¿Listo para crear algo único?',
          subtitle: 'Tu creatividad merece la mejor calidad. Empieza a diseñar ahora.',
          buttonText: 'Empezar a diseñar',
          buttonLink: '/customizer',
          showButton: true,
          isActive: true,
        },
        whatsappButton: {
          isActive: true,
          phoneNumber: '573001234567',
          defaultMessage: '¡Hola! Me interesa obtener más información sobre sus productos.',
          position: 'bottom-right',
          showOnMobile: true,
          showOnDesktop: true,
          buttonColor: '#25D366',
          pulseAnimation: true,
          showTooltip: true,
          tooltipText: '¿Necesitas ayuda?',
        },
      },
    },
  });
  console.log('  ✅ Configuración del Home (Hero Cards, Features, Secciones)');

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
  const sueterTypeRecord = await prisma.productType.findUnique({ where: { slug: 'sueter' } });
  const blusaTypeRecord = await prisma.productType.findUnique({ where: { slug: 'blusa' } });
  const tazaTypeRecord = await prisma.productType.findUnique({ where: { slug: 'taza' } });
  const bebidasCategoryRecord = await prisma.category.findUnique({ where: { slug: 'bebidas' } });

  // Buscar colores y tallas para usar en templates y productos
  const colorNegro = await prisma.color.findFirst({ where: { slug: 'negro' } });
  const colorBlanco = await prisma.color.findFirst({ where: { slug: 'blanco' } });
  const colorGris = await prisma.color.findFirst({ where: { slug: 'gris' } });
  const colorAzul = await prisma.color.findFirst({ where: { slug: 'azul' } });
  const colorRojo = await prisma.color.findFirst({ where: { slug: 'rojo' } });

  const tallaSM = await prisma.size.findFirst({ where: { abbreviation: 'S' } });
  const tallaM = await prisma.size.findFirst({ where: { abbreviation: 'M' } });
  const tallaL = await prisma.size.findFirst({ where: { abbreviation: 'L' } });
  const tallaXL = await prisma.size.findFirst({ where: { abbreviation: 'XL' } });
  const tallaUnica = await prisma.size.findFirst({ where: { abbreviation: 'Unica' } });

  // Template 1: Suéter en U con zonas Front y Back
  const templateSueter = await prisma.product.upsert({
    where: { sku: 'TMPL-SUE-001' },
    update: {},
    create: {
      sku: 'TMPL-SUE-001',
      slug: 'sueter-personalizable',
      name: 'Suéter en U Personalizable',
      description: 'Suéter con cuello en U con áreas personalizables en frente y espalda',
      categoryId: ropaCategoryRecord?.id,
      typeId: sueterTypeRecord?.id,
      basePrice: 45000,
      stock: 0,
      featured: true,
      isTemplate: true,
      images: {},
      tags: ['sueter', 'personalizable', 'template'],
      isActive: true,
    },
  });
  console.log(`  ✅ Template: ${templateSueter.name}`);

  // Asociar colores al template suéter
  const coloresSueter = [colorNegro, colorGris, colorAzul].filter(c => c !== null);
  for (const color of coloresSueter) {
    await prisma.productColor.upsert({
      where: {
        productId_colorId: {
          productId: templateSueter.id,
          colorId: color!.id,
        },
      },
      update: {},
      create: {
        productId: templateSueter.id,
        colorId: color!.id,
      },
    });
  }
  console.log(`    ✅ Asociados ${coloresSueter.length} colores`);

  // Asociar tallas al template suéter
  const tallasSueter = [tallaM, tallaL, tallaXL].filter(t => t !== null);
  for (const talla of tallasSueter) {
    await prisma.productSize.upsert({
      where: {
        productId_sizeId: {
          productId: templateSueter.id,
          sizeId: talla!.id,
        },
      },
      update: {},
      create: {
        productId: templateSueter.id,
        sizeId: talla!.id,
      },
    });
  }
  console.log(`    ✅ Asociadas ${tallasSueter.length} tallas`);

  // Crear zonas para el suéter
  if (frontZoneType) {
    await prisma.templateZone.create({
      data: {
        templateId: templateSueter.id,
        zoneTypeId: frontZoneType.id,
        zoneId: 'front-regular',
        name: 'Frente (20x15cm)',
        description: 'Área frontal para diseños',
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
    console.log(`    ✅ Zona: Frente`);
  }

  if (backZoneType) {
    await prisma.templateZone.create({
      data: {
        templateId: templateSueter.id,
        zoneTypeId: backZoneType.id,
        zoneId: 'back-large',
        name: 'Espalda (25x30cm)',
        description: 'Área de la espalda para diseños grandes',
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
    console.log(`    ✅ Zona: Espalda`);
  }

  // Template 2: Blusa Única Talla con zonas Front y Back
  const templateBlusa = await prisma.product.upsert({
    where: { sku: 'TMPL-BLU-001' },
    update: {},
    create: {
      sku: 'TMPL-BLU-001',
      slug: 'blusa-personalizable',
      name: 'Blusa Única Talla Personalizable',
      description: 'Blusa talla única con áreas personalizables en frente y espalda',
      categoryId: ropaCategoryRecord?.id,
      typeId: blusaTypeRecord?.id,
      basePrice: 35000,
      stock: 0,
      featured: true,
      isTemplate: true,
      images: {},
      tags: ['blusa', 'personalizable', 'template'],
      isActive: true,
    },
  });
  console.log(`  ✅ Template: ${templateBlusa.name}`);

  // Asociar colores al template blusa
  const coloresBlusa = [colorBlanco, colorNegro, colorAzul].filter(c => c !== null);
  for (const color of coloresBlusa) {
    await prisma.productColor.upsert({
      where: {
        productId_colorId: {
          productId: templateBlusa.id,
          colorId: color!.id,
        },
      },
      update: {},
      create: {
        productId: templateBlusa.id,
        colorId: color!.id,
      },
    });
  }
  console.log(`    ✅ Asociados ${coloresBlusa.length} colores`);

  // Asociar talla única al template blusa
  if (tallaUnica) {
    await prisma.productSize.upsert({
      where: {
        productId_sizeId: {
          productId: templateBlusa.id,
          sizeId: tallaUnica.id,
        },
      },
      update: {},
      create: {
        productId: templateBlusa.id,
        sizeId: tallaUnica.id,
      },
    });
    console.log(`    ✅ Asociada talla única`);
  }

  // Crear zonas para la blusa
  if (frontZoneType) {
    await prisma.templateZone.create({
      data: {
        templateId: templateBlusa.id,
        zoneTypeId: frontZoneType.id,
        zoneId: 'front-regular',
        name: 'Frente (18x13cm)',
        description: 'Área frontal para diseños',
        positionX: 50,
        positionY: 30,
        maxWidth: 180,
        maxHeight: 130,
        isEditable: true,
        isRequired: false,
        sortOrder: 1,
        isActive: true,
      },
    });
    console.log(`    ✅ Zona: Frente`);
  }

  if (backZoneType) {
    await prisma.templateZone.create({
      data: {
        templateId: templateBlusa.id,
        zoneTypeId: backZoneType.id,
        zoneId: 'back-large',
        name: 'Espalda (22x28cm)',
        description: 'Área de la espalda para diseños',
        positionX: 50,
        positionY: 40,
        maxWidth: 220,
        maxHeight: 280,
        isEditable: true,
        isRequired: false,
        sortOrder: 2,
        isActive: true,
      },
    });
    console.log(`    ✅ Zona: Espalda`);
  }

  // Template 3: Taza con zona alrededor
  const templateTaza = await prisma.product.upsert({
    where: { sku: 'TMPL-TAZ-001' },
    update: {},
    create: {
      sku: 'TMPL-TAZ-001',
      slug: 'taza-personalizable',
      name: 'Taza Personalizable 11oz',
      description: 'Taza de cerámica blanca 11oz con área de personalización completa',
      categoryId: bebidasCategoryRecord?.id,
      typeId: tazaTypeRecord?.id,
      basePrice: 18000,
      stock: 0,
      featured: true,
      isTemplate: true,
      images: {},
      tags: ['taza', 'personalizable', 'template', 'sublimacion'],
      isActive: true,
    },
  });
  console.log(`  ✅ Template: ${templateTaza.name}`);

  // Asociar color blanco al template taza
  if (colorBlanco) {
    await prisma.productColor.upsert({
      where: {
        productId_colorId: {
          productId: templateTaza.id,
          colorId: colorBlanco.id,
        },
      },
      update: {},
      create: {
        productId: templateTaza.id,
        colorId: colorBlanco.id,
      },
    });
    console.log(`    ✅ Asociado color blanco`);
  }

  // Asociar tallas de taza (11oz, 15oz, 20oz)
  const talla15oz = await prisma.size.findFirst({ where: { abbreviation: '15oz' } });
  const talla20oz = await prisma.size.findFirst({ where: { abbreviation: '20oz' } });
  const talla11oz = await prisma.size.findFirst({ where: { abbreviation: '11oz' } });
  const tallasTaza = [talla11oz, talla15oz, talla20oz].filter(t => t !== null);
  for (const talla of tallasTaza) {
    await prisma.productSize.upsert({
      where: {
        productId_sizeId: {
          productId: templateTaza.id,
          sizeId: talla!.id,
        },
      },
      update: {},
      create: {
        productId: templateTaza.id,
        sizeId: talla!.id,
      },
    });
  }
  console.log(`    ✅ Asociadas ${tallasTaza.length} tallas de taza`);

  // Crear zona alrededor para la taza
  if (aroundZoneType) {
    await prisma.templateZone.create({
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
    console.log(`    ✅ Zona: Alrededor`);
  }

  // ==================== TIPOS DE INSUMO ====================
  console.log('\n🧵 Creando tipos de insumo...');

  const inputTypes = [
    {
      name: 'DTF (Direct to Film)',
      slug: 'dtf',
      description: 'Transferencia directa a film para aplicación en prendas',
      hasVariants: false,
      order: 1,
    },
    {
      name: 'Prendas',
      slug: 'prendas',
      description: 'Prendas de vestir para sublimación o personalización',
      hasVariants: true, // Tiene tallas y colores
      order: 2,
    },
    {
      name: 'Insumo Único',
      slug: 'insumo-unico',
      description: 'Insumos que no tienen variantes de color o talla',
      hasVariants: false,
      order: 3,
    },
    {
      name: 'Empaque',
      slug: 'empaque',
      description: 'Materiales de empaque y presentación',
      hasVariants: false,
      order: 4,
    },
    {
      name: 'Adhesivos',
      slug: 'adhesivos',
      description: 'Cintas, pegamentos y adhesivos',
      hasVariants: false,
      order: 5,
    },
  ];

  for (const inputType of inputTypes) {
    await prisma.inputType.upsert({
      where: { slug: inputType.slug },
      update: {
        name: inputType.name,
        description: inputType.description,
        hasVariants: inputType.hasVariants,
      },
      create: {
        name: inputType.name,
        slug: inputType.slug,
        description: inputType.description,
        hasVariants: inputType.hasVariants,
        sortOrder: inputType.order,
        isActive: true,
      },
    });
    console.log(`  ✅ Tipo de Insumo: ${inputType.name}${inputType.hasVariants ? ' (con variantes)' : ''}`);
  }

  // ==================== INSUMOS ====================
  console.log('\n📦 Creando insumos...');

  // Obtener IDs de tipos de insumo
  const prendasType = await prisma.inputType.findUnique({ where: { slug: 'prendas' } });
  const insumoUnicoType = await prisma.inputType.findUnique({ where: { slug: 'insumo-unico' } });
  const dtfType = await prisma.inputType.findUnique({ where: { slug: 'dtf' } });
  const empaqueType = await prisma.inputType.findUnique({ where: { slug: 'empaque' } });
  const adhesivosType = await prisma.inputType.findUnique({ where: { slug: 'adhesivos' } });

  // Camisa en U no se usa en este proyecto
  /*// 1. CAMISA EN U (con variantes)
  if (prendasType) {
    const camisaEnU = await prisma.input.upsert({
      where: { code: 'INS-CAM-U' },
      update: {},
      create: {
        code: 'INS-CAM-U',
        inputTypeId: prendasType.id,
        name: 'Camisa en U',
        description: 'Camiseta con cuello en U para personalización',
        unitOfMeasure: 'unidades',
        currentStock: 0, // Se calcula desde variantes
        minStock: 20,
        maxStock: 200,
        unitCost: 12000,
        supplier: 'Abba',
        notes: 'Tiene variantes de talla y color',
        isActive: true,
      },
    });
    console.log(`  ✅ Insumo: ${camisaEnU.name} (con variantes)`);

    // Asignar colores al inputType para generar variantes
    if (prendasType) {
      // Primero, agregar las tallas al InputType
      const tallasParaVariantes = [tallaSM, tallaM, tallaL, tallaXL].filter(t => t !== null);
      for (const talla of tallasParaVariantes) {
        await prisma.inputTypeSize.upsert({
          where: {
            inputTypeId_sizeId: {
              inputTypeId: prendasType.id,
              sizeId: talla!.id,
            },
          },
          update: {},
          create: {
            inputTypeId: prendasType.id,
            sizeId: talla!.id,
          },
        });
      }

      // Asignar colores a la camisa
      const coloresParaVariantes = [colorNegro, colorBlanco, colorGris, colorAzul].filter(c => c !== null);
      for (const color of coloresParaVariantes) {
        await prisma.inputColor.upsert({
          where: {
            inputId_colorId: {
              inputId: camisaEnU.id,
              colorId: color!.id,
            },
          },
          update: {},
          create: {
            inputId: camisaEnU.id,
            colorId: color!.id,
          },
        });

        // Crear variantes para cada combinación color + talla
        for (const talla of tallasParaVariantes) {
          const sku = `CAM-U-${color!.slug.toUpperCase().substring(0, 3)}-${talla!.abbreviation}`;
          await prisma.inputVariant.upsert({
            where: { sku },
            update: {},
            create: {
              inputId: camisaEnU.id,
              sku,
              colorId: color!.id,
              sizeId: talla!.id,
              currentStock: 0,
              minStock: 5,
              maxStock: 50,
              unitCost: 12000,
              isActive: true,
            },
          });
        }
      }
      console.log(`    ✅ Generadas ${coloresParaVariantes.length * tallasParaVariantes.length} variantes`);
    }
  }*/

  // 1. SUÉTER EN U (con variantes)
  if (prendasType) {
    const sueterEnU = await prisma.input.upsert({
      where: { code: 'INS-SUE-U' },
      update: {},
      create: {
        code: 'INS-SUE-U',
        inputTypeId: prendasType.id,
        name: 'Suéter en U',
        description: 'Suéter con cuello en U para personalización',
        unitOfMeasure: 'unidades',
        currentStock: 0,
        minStock: 15,
        maxStock: 150,
        unitCost: 25000,
        supplier: 'Abba',
        notes: 'Tiene variantes de talla y color',
        isActive: true,
      },
    });
    console.log(`  ✅ Insumo: ${sueterEnU.name} (con variantes)`);

    // Asignar colores y tallas
    const coloresSueter = [colorNegro, colorGris, colorAzul].filter(c => c !== null);
    const tallasSueter = [tallaM, tallaL, tallaXL].filter(t => t !== null);

    // Asociar colores al insumo
    for (const color of coloresSueter) {
      await prisma.inputColor.upsert({
        where: {
          inputId_colorId: {
            inputId: sueterEnU.id,
            colorId: color!.id,
          },
        },
        update: {},
        create: {
          inputId: sueterEnU.id,
          colorId: color!.id,
        },
      });
    }
    console.log(`    ✅ Asociados ${coloresSueter.length} colores`);

    // Asociar tallas al insumo (similar a los colores)
    for (const talla of tallasSueter) {
      await prisma.inputSize.upsert({
        where: {
          inputId_sizeId: {
            inputId: sueterEnU.id,
            sizeId: talla!.id,
          },
        },
        update: {},
        create: {
          inputId: sueterEnU.id,
          sizeId: talla!.id,
        },
      });
    }
    console.log(`    ✅ Asociadas ${tallasSueter.length} tallas al insumo`);

    // Asociar tallas al InputType para que estén disponibles al crear nuevos insumos
    for (const talla of tallasSueter) {
      await prisma.inputTypeSize.upsert({
        where: {
          inputTypeId_sizeId: {
            inputTypeId: prendasType.id,
            sizeId: talla!.id,
          },
        },
        update: {},
        create: {
          inputTypeId: prendasType.id,
          sizeId: talla!.id,
        },
      });
    }

    // Generar variantes para cada combinación color + talla
    for (const color of coloresSueter) {
      for (const talla of tallasSueter) {
        const sku = `SUE-U-${color!.slug.toUpperCase().substring(0, 3)}-${talla!.abbreviation}`;
        await prisma.inputVariant.upsert({
          where: { sku },
          update: {},
          create: {
            inputId: sueterEnU.id,
            sku,
            colorId: color!.id,
            sizeId: talla!.id,
            currentStock: 0,
            minStock: 3,
            maxStock: 30,
            unitCost: 25000,
            isActive: true,
          },
        });
      }
    }
    console.log(`    ✅ Generadas ${coloresSueter.length * tallasSueter.length} variantes de insumo`);
  }

  // 2. BLUSA ÚNICA TALLA (sin variantes)
  if (insumoUnicoType) {
    const blusaUnicaTalla = await prisma.input.upsert({
      where: { code: 'INS-BLU-UNI' },
      update: {},
      create: {
        code: 'INS-BLU-UNI',
        inputTypeId: insumoUnicoType.id,
        name: 'Blusa Única Talla',
        description: 'Blusa estándar talla única para personalización',
        unitOfMeasure: 'unidades',
        currentStock: 0,
        minStock: 10,
        maxStock: 100,
        unitCost: 15000,
        supplier: 'Fabrica',
        notes: 'No tiene variantes',
        isActive: true,
      },
    });
    console.log(`  ✅ Insumo: ${blusaUnicaTalla.name} (sin variantes)`);
  }

  // 3. DTF
  if (dtfType) {
    const dtf = await prisma.input.upsert({
      where: { code: 'INS-DTF-001' },
      update: {},
      create: {
        code: 'INS-DTF-001',
        inputTypeId: dtfType.id,
        name: 'DTF',
        description: 'Film DTF para transferencia directa',
        unitOfMeasure: 'metros',
        currentStock: 0,
        minStock: 20,
        maxStock: 200,
        unitCost: 8500,
        supplier: 'Amazon',
        notes: 'Direct to Film transfer',
        isActive: true,
      },
    });
    console.log(`  ✅ Insumo: ${dtf.name}`);
  }

  // 4. CINTA TÉRMICA
  if (adhesivosType) {
    const cintaTermica = await prisma.input.upsert({
      where: { code: 'INS-CIN-TER' },
      update: {},
      create: {
        code: 'INS-CIN-TER',
        inputTypeId: adhesivosType.id,
        name: 'Cinta Térmica',
        description: 'Cinta adhesiva activada por calor',
        unitOfMeasure: 'metros',
        currentStock: 0,
        minStock: 50,
        maxStock: 500,
        unitCost: 3500,
        supplier: 'Fabrica',
        notes: 'Para aplicación con plancha térmica',
        isActive: true,
      },
    });
    console.log(`  ✅ Insumo: ${cintaTermica.name}`);
  }

  // 5. BOLSAS 25x70
  if (empaqueType) {
    const bolsas = await prisma.input.upsert({
      where: { code: 'INS-BOL-2570' },
      update: {},
      create: {
        code: 'INS-BOL-2570',
        inputTypeId: empaqueType.id,
        name: 'Bolsas 25x70',
        description: 'Bolsas de polipropileno 25x70cm para empaque',
        unitOfMeasure: 'unidades',
        currentStock: 0,
        minStock: 100,
        maxStock: 1000,
        unitCost: 250,
        supplier: 'Manicomio',
        notes: 'Bolsas transparentes para productos',
        isActive: true,
      },
    });
    console.log(`  ✅ Insumo: ${bolsas.name}`);
  }

  // 6. ETIQUETA (PEGATINA)
  if (insumoUnicoType) {
    const etiqueta = await prisma.input.upsert({
      where: { code: 'INS-ETI-PEG' },
      update: {},
      create: {
        code: 'INS-ETI-PEG',
        inputTypeId: insumoUnicoType.id,
        name: 'Etiqueta (Pegatina)',
        description: 'Etiquetas adhesivas para branding',
        unitOfMeasure: 'unidades',
        currentStock: 0,
        minStock: 200,
        maxStock: 2000,
        unitCost: 150,
        supplier: 'Manicomio',
        notes: 'Stickers con logo de la marca',
        isActive: true,
      },
    });
    console.log(`  ✅ Insumo: ${etiqueta.name}`);
  }

  console.log('  ✅ Todos los insumos creados');

  // ==================== PRODUCTOS DE EJEMPLO ====================
  console.log('\n📦 Creando productos de ejemplo...');

  // Obtener IDs necesarios
  const sueterType = await prisma.productType.findFirst({ where: { slug: 'sueter' } });
  const blusaType = await prisma.productType.findFirst({ where: { slug: 'blusa' } });
  const tazaType = await prisma.productType.findFirst({ where: { slug: 'taza' } });

  // 1. PRODUCTO: Suéter en U (con variantes de color/talla)
  if (ropaCategoryRecord && sueterType) {
    const sueterProducto = await prisma.product.upsert({
      where: { sku: 'PROD-SUE-001' },
      update: {},
      create: {
        sku: 'PROD-SUE-001',
        slug: 'sueter-en-u',
        name: 'Suéter en U',
        description: 'Suéter con cuello en U personalizado',
        categoryId: ropaCategoryRecord.id,
        typeId: sueterType.id,
        basePrice: 45000,
        stock: 0,
        featured: true,
        images: {},
        tags: ['sueter', 'personalizado'],
        isActive: true,
      },
    });
    console.log(`  ✅ Producto: ${sueterProducto.name} (con variantes)`);

    // Asociar colores al producto suéter
    const coloresSueterProd = [colorNegro, colorGris, colorAzul].filter(c => c !== null);
    for (const color of coloresSueterProd) {
      await prisma.productColor.upsert({
        where: {
          productId_colorId: {
            productId: sueterProducto.id,
            colorId: color!.id,
          },
        },
        update: {},
        create: {
          productId: sueterProducto.id,
          colorId: color!.id,
        },
      });
    }
    console.log(`    ✅ Asociados ${coloresSueterProd.length} colores al producto`);

    // Asociar tallas al producto suéter
    const tallasSueterProd = [tallaM, tallaL, tallaXL].filter(t => t !== null);
    for (const talla of tallasSueterProd) {
      await prisma.productSize.upsert({
        where: {
          productId_sizeId: {
            productId: sueterProducto.id,
            sizeId: talla!.id,
          },
        },
        update: {},
        create: {
          productId: sueterProducto.id,
          sizeId: talla!.id,
        },
      });
    }
    console.log(`    ✅ Asociadas ${tallasSueterProd.length} tallas al producto`);

    // Generación de variantes comentada - se crearán manualmente
    /*let variantesCreadas = 0;
    for (const color of coloresSueterProd) {
      for (const talla of tallasSueterProd) {
        const sku = `${sueterProducto.sku}-${color!.slug.toUpperCase().substring(0, 3)}-${talla!.abbreviation}`;

        await prisma.productVariant.upsert({
          where: { sku },
          update: {},
          create: {
            productId: sueterProducto.id,
            sku,
            colorId: color!.id,
            sizeId: talla!.id,
            stock: 0,
            minStock: 3,
            isActive: true,
          },
        });
        variantesCreadas++;
      }
    }
    console.log(`    ✅ Generadas ${variantesCreadas} variantes de producto`);*/
  }

  // 2. PRODUCTO: Blusa Única Talla (sin variantes)
  if (ropaCategoryRecord && blusaType && tallaUnica) {
    const blusaProducto = await prisma.product.upsert({
      where: { sku: 'PROD-BLU-001' },
      update: {},
      create: {
        sku: 'PROD-BLU-001',
        slug: 'blusa-unica-talla',
        name: 'Blusa Única Talla',
        description: 'Blusa talla única personalizada',
        categoryId: ropaCategoryRecord.id,
        typeId: blusaType.id,
        basePrice: 35000,
        stock: 0,
        featured: true,
        images: {},
        tags: ['blusa', 'personalizada'],
        isActive: true,
      },
    });
    console.log(`  ✅ Producto: ${blusaProducto.name} (sin variantes)`);

    // Asociar colores al producto blusa
    const coloresBlusaProd = [colorBlanco, colorNegro].filter(c => c !== null);
    for (const color of coloresBlusaProd) {
      await prisma.productColor.upsert({
        where: {
          productId_colorId: {
            productId: blusaProducto.id,
            colorId: color!.id,
          },
        },
        update: {},
        create: {
          productId: blusaProducto.id,
          colorId: color!.id,
        },
      });
    }
    console.log(`    ✅ Asociados ${coloresBlusaProd.length} colores al producto`);

    // Asociar talla única al producto blusa
    await prisma.productSize.upsert({
      where: {
        productId_sizeId: {
          productId: blusaProducto.id,
          sizeId: tallaUnica.id,
        },
      },
      update: {},
      create: {
        productId: blusaProducto.id,
        sizeId: tallaUnica.id,
      },
    });
    console.log(`    ✅ Asociada talla única al producto`);

    // Generación de variante comentada - se creará manualmente
    /*const sku = `${blusaProducto.sku}-UNI`;
    await prisma.productVariant.upsert({
      where: { sku },
      update: {},
      create: {
        productId: blusaProducto.id,
        sku,
        sizeId: tallaUnica.id,
        stock: 0,
        minStock: 10,
        isActive: true,
      },
    });
    console.log(`    ✅ Generada 1 variante de producto (talla única)`);*/
  }

  // 3. PRODUCTO: Taza 11oz
  if (bebidasCategoryRecord && tazaType && talla11oz) {
    const tazaProducto = await prisma.product.upsert({
      where: { sku: 'PROD-TAZ-001' },
      update: {},
      create: {
        sku: 'PROD-TAZ-001',
        slug: 'taza-11oz',
        name: 'Taza 11oz',
        description: 'Taza de cerámica 11oz personalizada',
        categoryId: bebidasCategoryRecord.id,
        typeId: tazaType.id,
        basePrice: 18000,
        stock: 0,
        featured: true,
        images: {},
        tags: ['taza', 'personalizada', 'sublimada'],
        isActive: true,
      },
    });
    console.log(`  ✅ Producto: ${tazaProducto.name}`);

    // Asociar color blanco al producto taza
    if (colorBlanco) {
      await prisma.productColor.upsert({
        where: {
          productId_colorId: {
            productId: tazaProducto.id,
            colorId: colorBlanco.id,
          },
        },
        update: {},
        create: {
          productId: tazaProducto.id,
          colorId: colorBlanco.id,
        },
      });
      console.log(`    ✅ Asociado color blanco al producto`);
    }

    // Asociar talla 11oz al producto taza
    await prisma.productSize.upsert({
      where: {
        productId_sizeId: {
          productId: tazaProducto.id,
          sizeId: talla11oz.id,
        },
      },
      update: {},
      create: {
        productId: tazaProducto.id,
        sizeId: talla11oz.id,
      },
    });
    console.log(`    ✅ Asociada talla 11oz al producto`);

    // Generación de variante comentada - se creará manualmente
    /*const sku = `${tazaProducto.sku}-11OZ`;
    await prisma.productVariant.upsert({
      where: { sku },
      update: {},
      create: {
        productId: tazaProducto.id,
        sku,
        sizeId: talla11oz.id,
        stock: 0,
        minStock: 10,
        isActive: true,
      },
    });
    console.log(`    ✅ Generada 1 variante (11oz)`);*/
  }

  // 4-18. MÁS PRODUCTOS DE EJEMPLO PARA PROBAR CARRUSEL
  const productosExtra = [
    { sku: 'PROD-SUE-002', slug: 'sueter-cuello-redondo', name: 'Suéter Cuello Redondo', price: 42000, type: sueterType, category: ropaCategoryRecord },
    { sku: 'PROD-SUE-003', slug: 'sueter-oversize', name: 'Suéter Oversize', price: 48000, type: sueterType, category: ropaCategoryRecord },
    { sku: 'PROD-SUE-004', slug: 'sueter-deportivo', name: 'Suéter Deportivo', price: 52000, type: sueterType, category: ropaCategoryRecord },
    { sku: 'PROD-SUE-005', slug: 'sueter-premium', name: 'Suéter Premium', price: 65000, type: sueterType, category: ropaCategoryRecord },
    { sku: 'PROD-BLU-002', slug: 'blusa-manga-larga', name: 'Blusa Manga Larga', price: 38000, type: blusaType, category: ropaCategoryRecord },
    { sku: 'PROD-BLU-003', slug: 'blusa-cuello-v', name: 'Blusa Cuello V', price: 32000, type: blusaType, category: ropaCategoryRecord },
    { sku: 'PROD-BLU-004', slug: 'blusa-estampada', name: 'Blusa Estampada', price: 36000, type: blusaType, category: ropaCategoryRecord },
    { sku: 'PROD-BLU-005', slug: 'blusa-casual', name: 'Blusa Casual', price: 28000, type: blusaType, category: ropaCategoryRecord },
    { sku: 'PROD-TAZ-002', slug: 'taza-magica', name: 'Taza Mágica Térmica', price: 25000, type: tazaType, category: bebidasCategoryRecord },
    { sku: 'PROD-TAZ-003', slug: 'taza-viajera', name: 'Taza Viajera 15oz', price: 32000, type: tazaType, category: bebidasCategoryRecord },
    { sku: 'PROD-TAZ-004', slug: 'taza-corazon', name: 'Taza Corazón', price: 22000, type: tazaType, category: bebidasCategoryRecord },
    { sku: 'PROD-TAZ-005', slug: 'taza-brillante', name: 'Taza Brillante', price: 24000, type: tazaType, category: bebidasCategoryRecord },
    { sku: 'PROD-SUE-006', slug: 'hoodie-basico', name: 'Hoodie Básico', price: 55000, type: sueterType, category: ropaCategoryRecord },
    { sku: 'PROD-SUE-007', slug: 'hoodie-crop', name: 'Hoodie Crop Top', price: 48000, type: sueterType, category: ropaCategoryRecord },
    { sku: 'PROD-SUE-008', slug: 'hoodie-zip', name: 'Hoodie con Cierre', price: 62000, type: sueterType, category: ropaCategoryRecord },
  ];

  for (const prod of productosExtra) {
    if (prod.type && prod.category) {
      const producto = await prisma.product.upsert({
        where: { sku: prod.sku },
        update: {},
        create: {
          sku: prod.sku,
          slug: prod.slug,
          name: prod.name,
          description: `${prod.name} personalizable de alta calidad`,
          categoryId: prod.category.id,
          typeId: prod.type.id,
          basePrice: prod.price,
          stock: 0,
          featured: Math.random() > 0.5, // Algunos destacados aleatoriamente
          images: {},
          tags: JSON.parse(JSON.stringify([prod.slug.split('-')[0], 'personalizado'])),
          isActive: true,
        },
      });

      // Asociar colores
      const coloresProducto = [colorNegro, colorBlanco, colorGris, colorAzul].filter(c => c !== null).slice(0, 3);
      for (const color of coloresProducto) {
        await prisma.productColor.upsert({
          where: { productId_colorId: { productId: producto.id, colorId: color!.id } },
          update: {},
          create: { productId: producto.id, colorId: color!.id },
        });
      }

      // Asociar tallas
      const tallasProducto = [tallaM, tallaL, tallaXL, tallaUnica].filter(t => t !== null).slice(0, 3);
      for (const talla of tallasProducto) {
        await prisma.productSize.upsert({
          where: { productId_sizeId: { productId: producto.id, sizeId: talla!.id } },
          update: {},
          create: { productId: producto.id, sizeId: talla!.id },
        });
      }

      console.log(`  ✅ Producto extra: ${prod.name}`);
    }
  }

  console.log('  ✅ Productos de ejemplo creados');

  // ==================== PROVEEDORES ====================
  console.log('\n🚚 Creando proveedores...');

  const suppliers = [
    {
      code: 'PROV-001',
      name: 'Amazon',
      taxId: '900111111-1',
      taxIdType: 'NIT',
      contactName: 'Amazon Colombia',
      email: 'ventas@amazon.com.co',
      phone: '+57 300 000 0001',
      address: 'Centro Logístico',
      city: 'Bogotá',
      department: 'Cundinamarca',
      country: 'Colombia',
      paymentTerms: 'Contado',
      paymentMethod: 'Tarjeta de crédito',
      notes: 'Marketplace online - Insumos generales',
      isActive: true,
    },
    {
      code: 'PROV-002',
      name: 'Abba',
      taxId: '900222222-2',
      taxIdType: 'NIT',
      contactName: 'Abba Textiles',
      email: 'ventas@abba.com.co',
      phone: '+57 300 000 0002',
      address: 'Zona Industrial Norte',
      city: 'Medellín',
      department: 'Antioquia',
      country: 'Colombia',
      paymentTerms: '30 días',
      paymentMethod: 'Transferencia bancaria',
      bankName: 'Bancolombia',
      bankAccountType: 'Corriente',
      bankAccount: '111222333',
      notes: 'Proveedor de prendas y textiles',
      isActive: true,
    },
    {
      code: 'PROV-003',
      name: 'Fabrica',
      taxId: '900333333-3',
      taxIdType: 'NIT',
      contactName: 'La Fabrica',
      email: 'contacto@lafabrica.com.co',
      phone: '+57 300 000 0003',
      address: 'Carrera 50 #23-45',
      city: 'Bogotá',
      department: 'Cundinamarca',
      country: 'Colombia',
      paymentTerms: '15 días',
      paymentMethod: 'Transferencia bancaria',
      bankName: 'Davivienda',
      bankAccountType: 'Ahorros',
      bankAccount: '444555666',
      notes: 'Fabricante de insumos para sublimación',
      isActive: true,
    },
    {
      code: 'PROV-004',
      name: 'Manicomio',
      taxId: '900444444-4',
      taxIdType: 'NIT',
      contactName: 'Manicomio Store',
      email: 'ventas@manicomio.com.co',
      phone: '+57 300 000 0004',
      address: 'Local 123, Centro Comercial',
      city: 'Cali',
      department: 'Valle del Cauca',
      country: 'Colombia',
      paymentTerms: 'Contado',
      paymentMethod: 'Efectivo / Transferencia',
      notes: 'Proveedor local de empaques y materiales',
      isActive: true,
    },
  ];

  for (const supplier of suppliers) {
    await prisma.supplier.upsert({
      where: { code: supplier.code },
      update: {
        name: supplier.name,
        contactName: supplier.contactName,
        email: supplier.email,
        phone: supplier.phone,
      },
      create: supplier,
    });
    console.log(`  ✅ Proveedor: ${supplier.name} (${supplier.code})`);
  }

  console.log('\n✨ Seed completado exitosamente!\n');
  console.log('📊 Resumen:');
  console.log(`   - 3 plantillas/templates (Suéter U, Blusa, Taza) con zonas`);
  console.log(`   - 3 productos (Suéter U, Blusa, Taza)`);
  console.log(`   - 6 insumos (DTF, Suéter U, Blusa, Cinta, Bolsas, Etiqueta)`);
  console.log(`   - ${categories.length} categorías`);
  console.log(`   - ${productTypes.length} tipos de producto`);
  console.log(`   - ${sizes.length} tallas`);
  console.log(`   - ${colors.length} colores`);
  console.log(`   - ${zoneTypes.length} tipos de zona`);
  console.log(`   - ${inputTypes.length} tipos de insumo`);
  console.log(`   - ${suppliers.length} proveedores`);
  // ==================== LABEL TEMPLATES ====================
  await seedLabelTemplates();

  console.log('\n👤 Usuarios de prueba (1 por rol):');
  console.log('   📧 SuperAdmin: admin@marketplace.com / admin123 (roleId: 1)');
  console.log('   📧 Cliente: cliente@marketplace.com / cliente123 (roleId: 2)');
  console.log('   📧 Administrador: vendedor@marketplace.com / vendedor123 (roleId: 3)');
  console.log('   📧 Cajero: cajero@marketplace.com / cajero123 (roleId: 4)');
  console.log('\n🔒 Roles del sistema (no editables): SuperAdmin (1), Cliente (2)');
  console.log('✏️  Roles personalizables: Administrador (3), Cajero (4)');
  console.log('\n🎨 Templates disponibles en /admin-panel/templates');
  console.log('🏷️  Plantillas de etiquetas disponibles en /admin-panel/settings/label-templates');
  console.log('💰 Sistema POS disponible en /pos (login con cajero@marketplace.com)');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
