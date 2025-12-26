import { PrismaClient, SessionStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ==================== TIPOS ====================

export interface CreateCashRegisterInput {
  name: string;
  location: string;
  code: string;
}

export interface UpdateCashRegisterInput {
  name?: string;
  location?: string;
  code?: string;
  isActive?: boolean;
}

export interface OpenSessionInput {
  cashRegisterId: number;
  sellerId: number;
  initialCash: number;
  notes?: string;
}

export interface CloseSessionInput {
  finalCash: number;
  notes?: string;
}

// ==================== CAJAS REGISTRADORAS ====================

/**
 * Crear caja registradora
 */
export async function createCashRegister(data: CreateCashRegisterInput) {
  // Verificar que el código sea único
  const existing = await prisma.cashRegister.findUnique({
    where: { code: data.code },
  });

  if (existing) {
    throw new Error('Ya existe una caja registradora con este código');
  }

  return await prisma.cashRegister.create({
    data: {
      name: data.name,
      location: data.location,
      code: data.code,
      isActive: true,
    },
  });
}

/**
 * Actualizar caja registradora
 */
export async function updateCashRegister(id: number, data: UpdateCashRegisterInput) {
  const cashRegister = await prisma.cashRegister.findUnique({
    where: { id },
  });

  if (!cashRegister) {
    throw new Error('Caja registradora no encontrada');
  }

  // Si se actualiza el código, verificar unicidad
  if (data.code && data.code !== cashRegister.code) {
    const existing = await prisma.cashRegister.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new Error('Ya existe una caja registradora con este código');
    }
  }

  return await prisma.cashRegister.update({
    where: { id },
    data: {
      name: data.name,
      location: data.location,
      code: data.code,
      isActive: data.isActive,
    },
  });
}

/**
 * Eliminar caja registradora
 */
export async function deleteCashRegister(id: number) {
  const cashRegister = await prisma.cashRegister.findUnique({
    where: { id },
    include: {
      cashSessions: {
        where: { status: SessionStatus.OPEN },
      },
    },
  });

  if (!cashRegister) {
    throw new Error('Caja registradora no encontrada');
  }

  if (cashRegister.cashSessions.length > 0) {
    throw new Error('No se puede eliminar una caja con sesiones abiertas');
  }

  return await prisma.cashRegister.delete({
    where: { id },
  });
}

/**
 * Obtener caja registradora por ID
 */
export async function getCashRegisterById(id: number) {
  const cashRegister = await prisma.cashRegister.findUnique({
    where: { id },
    include: {
      cashSessions: {
        orderBy: { openedAt: 'desc' },
        take: 10,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!cashRegister) {
    return null;
  }

  return cashRegister;
}

/**
 * Listar todas las cajas registradoras
 */
export async function getCashRegisters(activeOnly: boolean = false) {
  return await prisma.cashRegister.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    include: {
      cashSessions: {
        where: { status: SessionStatus.OPEN },
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}

// ==================== SESIONES DE CAJA ====================

/**
 * Abrir sesión de caja
 */
export async function openSession(data: OpenSessionInput) {
  // Verificar que la caja existe y está activa
  const cashRegister = await prisma.cashRegister.findUnique({
    where: { id: data.cashRegisterId },
  });

  if (!cashRegister) {
    throw new Error('Caja registradora no encontrada');
  }

  if (!cashRegister.isActive) {
    throw new Error('La caja registradora no está activa');
  }

  // Verificar que no hay otra sesión abierta en esta caja
  const existingSession = await prisma.cashSession.findFirst({
    where: {
      cashRegisterId: data.cashRegisterId,
      status: SessionStatus.OPEN,
    },
  });

  if (existingSession) {
    throw new Error('Ya existe una sesión abierta en esta caja');
  }

  // Verificar que el vendedor existe
  const seller = await prisma.user.findUnique({
    where: { id: data.sellerId },
  });

  if (!seller) {
    throw new Error('Vendedor no encontrado');
  }

  // Crear sesión
  return await prisma.cashSession.create({
    data: {
      cashRegisterId: data.cashRegisterId,
      sellerId: data.sellerId,
      initialCash: data.initialCash,
      openedAt: new Date(),
      status: SessionStatus.OPEN,
      notes: data.notes || null,
      salesCount: 0,
      totalSales: 0,
    },
    include: {
      cashRegister: true,
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Cerrar sesión de caja (arqueo)
 */
export async function closeSession(sessionId: number, data: CloseSessionInput) {
  const session = await prisma.cashSession.findUnique({
    where: { id: sessionId },
    include: {
      cashRegister: true,
    },
  });

  if (!session) {
    throw new Error('Sesión no encontrada');
  }

  if (session.status === SessionStatus.CLOSED) {
    throw new Error('La sesión ya está cerrada');
  }

  // Calcular ventas de la sesión
  const sales = await prisma.order.findMany({
    where: {
      cashRegisterId: session.cashRegisterId,
      sellerId: session.sellerId,
      createdAt: {
        gte: session.openedAt,
      },
      status: {
        in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
      },
    },
  });

  const salesCount = sales.length;
  const totalSales = sales.reduce((sum, order) => {
    return sum + parseFloat(order.total.toString());
  }, 0);

  // Calcular efectivo esperado (inicial + ventas en efectivo)
  const cashSales = sales.filter((order) => {
    const paymentMethod = order.paymentMethod;
    return paymentMethod === 'cash' || paymentMethod === 'efectivo';
  });

  const totalCashSales = cashSales.reduce((sum, order) => {
    return sum + parseFloat(order.total.toString());
  }, 0);

  const expectedCash = parseFloat(session.initialCash.toString()) + totalCashSales;
  const difference = data.finalCash - expectedCash;

  // Actualizar sesión
  return await prisma.cashSession.update({
    where: { id: sessionId },
    data: {
      closedAt: new Date(),
      finalCash: data.finalCash,
      expectedCash,
      difference,
      salesCount,
      totalSales,
      status: SessionStatus.CLOSED,
      notes: data.notes ? `${session.notes || ''}\n${data.notes}` : session.notes,
    },
    include: {
      cashRegister: true,
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Obtener sesión actual del cajero
 */
export async function getCurrentSession(sellerId: number) {
  console.log('[getCurrentSession] Looking for session with sellerId:', sellerId, 'type:', typeof sellerId);

  const session = await prisma.cashSession.findFirst({
    where: {
      sellerId,
      status: SessionStatus.OPEN,
    },
    include: {
      cashRegister: true,
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  console.log('[getCurrentSession] Session found:', session ? `YES (id: ${session.id})` : 'NO');
  return session;
}

/**
 * Obtener sesión por ID
 */
export async function getSessionById(id: number) {
  const session = await prisma.cashSession.findUnique({
    where: { id },
    include: {
      cashRegister: true,
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  return session;
}

/**
 * Obtener reporte de sesión
 */
export async function getSessionReport(sessionId: number) {
  const session = await prisma.cashSession.findUnique({
    where: { id: sessionId },
    include: {
      cashRegister: true,
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!session) {
    throw new Error('Sesión no encontrada');
  }

  // Obtener ventas de la sesión
  const sales = await prisma.order.findMany({
    where: {
      cashRegisterId: session.cashRegisterId,
      sellerId: session.sellerId,
      createdAt: {
        gte: session.openedAt,
        ...(session.closedAt ? { lte: session.closedAt } : {}),
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Agrupar ventas por método de pago
  const paymentMethods = sales.reduce((acc: any, order) => {
    const method = order.paymentMethod || 'unknown';
    if (!acc[method]) {
      acc[method] = { count: 0, total: 0 };
    }
    acc[method].count++;
    acc[method].total += parseFloat(order.total.toString());
    return acc;
  }, {});

  return {
    session,
    sales,
    summary: {
      totalSales: sales.length,
      totalAmount: sales.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0),
      paymentMethods,
      duration:
        session.closedAt && session.openedAt
          ? Math.round((session.closedAt.getTime() - session.openedAt.getTime()) / 1000 / 60) // minutos
          : null,
    },
  };
}

/**
 * Listar sesiones con filtros
 */
export async function getSessions(filter: {
  cashRegisterId?: number;
  sellerId?: number;
  status?: SessionStatus;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  return await prisma.cashSession.findMany({
    where: {
      cashRegisterId: filter.cashRegisterId,
      sellerId: filter.sellerId,
      status: filter.status,
      openedAt: {
        gte: filter.dateFrom,
        lte: filter.dateTo,
      },
    },
    include: {
      cashRegister: true,
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { openedAt: 'desc' },
  });
}
