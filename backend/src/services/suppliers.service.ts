import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SupplierFilters {
  search?: string;
  isActive?: boolean;
  city?: string;
}

interface CreateSupplierData {
  code: string;
  name: string;
  taxId?: string;
  taxIdType?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  altPhone?: string;
  website?: string;
  address?: string;
  city?: string;
  department?: string;
  postalCode?: string;
  country?: string;
  paymentTerms?: string;
  paymentMethod?: string;
  bankName?: string;
  bankAccountType?: string;
  bankAccount?: string;
  notes?: string;
  isActive?: boolean;
}

interface UpdateSupplierData extends Partial<CreateSupplierData> {}

// Obtener todos los proveedores con filtros
export async function getSuppliers(filters: SupplierFilters = {}) {
  const where: any = {};

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { code: { contains: filters.search } },
      { taxId: { contains: filters.search } },
      { contactName: { contains: filters.search } },
      { email: { contains: filters.search } },
    ];
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters.city) {
    where.city = filters.city;
  }

  const suppliers = await prisma.supplier.findMany({
    where,
    include: {
      _count: {
        select: { purchaseOrders: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return suppliers;
}

// Obtener un proveedor por ID
export async function getSupplierById(id: number) {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      purchaseOrders: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      },
      _count: {
        select: { purchaseOrders: true },
      },
    },
  });

  return supplier;
}

// Crear proveedor
export async function createSupplier(data: CreateSupplierData) {
  // Verificar código único
  const existing = await prisma.supplier.findUnique({
    where: { code: data.code },
  });

  if (existing) {
    throw new Error('Ya existe un proveedor con este código');
  }

  const supplier = await prisma.supplier.create({
    data: {
      code: data.code,
      name: data.name,
      taxId: data.taxId,
      taxIdType: data.taxIdType,
      contactName: data.contactName,
      email: data.email,
      phone: data.phone,
      altPhone: data.altPhone,
      website: data.website,
      address: data.address,
      city: data.city,
      department: data.department,
      postalCode: data.postalCode,
      country: data.country || 'Colombia',
      paymentTerms: data.paymentTerms,
      paymentMethod: data.paymentMethod,
      bankName: data.bankName,
      bankAccountType: data.bankAccountType,
      bankAccount: data.bankAccount,
      notes: data.notes,
      isActive: data.isActive ?? true,
    },
  });

  return supplier;
}

// Actualizar proveedor
export async function updateSupplier(id: number, data: UpdateSupplierData) {
  // Verificar que existe
  const existing = await prisma.supplier.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Proveedor no encontrado');
  }

  // Si se cambia el código, verificar que no exista
  if (data.code && data.code !== existing.code) {
    const codeExists = await prisma.supplier.findUnique({
      where: { code: data.code },
    });
    if (codeExists) {
      throw new Error('Ya existe un proveedor con este código');
    }
  }

  const supplier = await prisma.supplier.update({
    where: { id },
    data,
  });

  return supplier;
}

// Eliminar proveedor
export async function deleteSupplier(id: number) {
  // Verificar que no tenga órdenes de compra
  const ordersCount = await prisma.purchaseOrder.count({
    where: { supplierId: id },
  });

  if (ordersCount > 0) {
    throw new Error(
      `No se puede eliminar: el proveedor tiene ${ordersCount} órdenes de compra asociadas`
    );
  }

  await prisma.supplier.delete({ where: { id } });
  return { message: 'Proveedor eliminado correctamente' };
}

// Generar código único para proveedor
export async function generateSupplierCode(): Promise<string> {
  const lastSupplier = await prisma.supplier.findFirst({
    where: {
      code: { startsWith: 'PROV-' },
    },
    orderBy: { code: 'desc' },
  });

  if (!lastSupplier) {
    return 'PROV-001';
  }

  const lastNumber = parseInt(lastSupplier.code.replace('PROV-', ''), 10);
  const nextNumber = lastNumber + 1;
  return `PROV-${nextNumber.toString().padStart(3, '0')}`;
}

// Obtener estadísticas de proveedores
export async function getSupplierStats() {
  const [total, active, withOrders] = await Promise.all([
    prisma.supplier.count(),
    prisma.supplier.count({ where: { isActive: true } }),
    prisma.supplier.count({
      where: {
        purchaseOrders: { some: {} },
      },
    }),
  ]);

  return { total, active, withOrders };
}
