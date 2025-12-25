import { Prisma, PaymentStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/errors';

// Mapeo de estados para mostrar al usuario
const STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Pendiente',
  PROCESSING: 'En Proceso',
  APPROVED: 'Aprobado',
  DECLINED: 'Rechazado',
  FAILED: 'Fallido',
  CANCELLED: 'Cancelado',
  EXPIRED: 'Expirado',
  REFUNDED: 'Reembolsado',
  PARTIAL_REFUND: 'Reembolso Parcial',
};

export interface PaymentResponse {
  id: number;
  orderId: number;
  orderNumber?: string;
  transactionId: string | null;
  paymentMethod: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  statusLabel: string;
  receiptUrl: string | null;
  receiptData: string | null;
  payerName: string | null;
  payerEmail: string | null;
  payerPhone: string | null;
  payerDocument: string | null;
  failureReason: string | null;
  failureCode: string | null;
  verifiedBy: number | null;
  verifiedByName?: string;
  verifiedAt: Date | null;
  notes: string | null;
  refundedAmount: number;
  refundedAt: Date | null;
  refundReason: string | null;
  initiatedAt: Date;
  paidAt: Date | null;
  failedAt: Date | null;
  cancelledAt: Date | null;
  expiredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentInput {
  orderId: number;
  transactionId?: string;
  paymentMethod: string;
  amount: number;
  currency?: string;
  payerName?: string;
  payerEmail?: string;
  payerPhone?: string;
  payerDocument?: string;
}

export interface UpdatePaymentInput {
  status?: PaymentStatus;
  transactionId?: string;
  receiptUrl?: string;
  receiptData?: string;
  failureReason?: string;
  failureCode?: string;
  notes?: string;
}

export interface VerifyPaymentInput {
  verifiedBy: number;
  notes?: string;
  approved: boolean;
}

export interface RefundPaymentInput {
  amount?: number; // Si no se especifica, reembolso completo
  reason: string;
}

export interface ListPaymentsQuery {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  paymentMethod?: string;
  orderId?: number;
  transactionId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: 'initiatedAt' | 'amount' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedPayments {
  data: PaymentResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

function formatPaymentResponse(payment: any): PaymentResponse {
  return {
    id: payment.id,
    orderId: payment.orderId,
    orderNumber: payment.order?.orderNumber,
    transactionId: payment.transactionId,
    paymentMethod: payment.paymentMethod,
    amount: Number(payment.amount),
    currency: payment.currency,
    status: payment.status,
    statusLabel: STATUS_LABELS[payment.status as PaymentStatus],
    receiptUrl: payment.receiptUrl,
    receiptData: payment.receiptData,
    payerName: payment.payerName,
    payerEmail: payment.payerEmail,
    payerPhone: payment.payerPhone,
    payerDocument: payment.payerDocument,
    failureReason: payment.failureReason,
    failureCode: payment.failureCode,
    verifiedBy: payment.verifiedBy,
    verifiedByName: undefined, // TODO: implementar si se necesita
    verifiedAt: payment.verifiedAt,
    notes: payment.notes,
    refundedAmount: Number(payment.refundedAmount),
    refundedAt: payment.refundedAt,
    refundReason: payment.refundReason,
    initiatedAt: payment.initiatedAt,
    paidAt: payment.paidAt,
    failedAt: payment.failedAt,
    cancelledAt: payment.cancelledAt,
    expiredAt: payment.expiredAt,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}

// Crear intento de pago
export async function createPayment(data: CreatePaymentInput): Promise<PaymentResponse> {
  // Verificar que la orden existe
  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
  });

  if (!order) {
    throw new NotFoundError('Pedido no encontrado');
  }

  // Crear el pago
  const payment = await prisma.payment.create({
    data: {
      orderId: data.orderId,
      transactionId: data.transactionId || null,
      paymentMethod: data.paymentMethod,
      amount: data.amount,
      currency: data.currency || 'COP',
      status: 'PENDING',
      payerName: data.payerName || null,
      payerEmail: data.payerEmail || null,
      payerPhone: data.payerPhone || null,
      payerDocument: data.payerDocument || null,
      initiatedAt: new Date(),
    },
    include: {
      order: {
        select: { orderNumber: true },
      },
    },
  });

  return formatPaymentResponse(payment);
}

// Listar pagos
export async function listPayments(query: ListPaymentsQuery): Promise<PaginatedPayments> {
  const {
    page = 1,
    limit = 20,
    status,
    paymentMethod,
    orderId,
    transactionId,
    startDate,
    endDate,
    search,
    sortBy = 'initiatedAt',
    sortOrder = 'desc',
  } = query;

  const skip = (page - 1) * limit;

  const where: Prisma.PaymentWhereInput = {};

  if (status) {
    where.status = status;
  }

  if (paymentMethod) {
    where.paymentMethod = paymentMethod;
  }

  if (orderId) {
    where.orderId = orderId;
  }

  if (transactionId) {
    where.transactionId = { contains: transactionId };
  }

  if (startDate || endDate) {
    where.initiatedAt = {};
    if (startDate) {
      where.initiatedAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.initiatedAt.lte = new Date(endDate);
    }
  }

  if (search) {
    where.OR = [
      { transactionId: { contains: search } },
      { payerName: { contains: search } },
      { payerEmail: { contains: search } },
      { payerDocument: { contains: search } },
      { order: { orderNumber: { contains: search } } },
    ];
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        order: {
          select: { orderNumber: true },
        },
      },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    data: payments.map(formatPaymentResponse),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Obtener pagos de un pedido
export async function getPaymentsByOrderId(orderId: number): Promise<PaymentResponse[]> {
  const payments = await prisma.payment.findMany({
    where: { orderId },
    include: {
      order: {
        select: { orderNumber: true },
      },
    },
    orderBy: { initiatedAt: 'desc' },
  });

  return payments.map(formatPaymentResponse);
}

// Obtener pago por ID
export async function getPaymentById(id: number): Promise<PaymentResponse> {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      order: {
        select: { orderNumber: true },
      },
    },
  });

  if (!payment) {
    throw new NotFoundError('Pago no encontrado');
  }

  return formatPaymentResponse(payment);
}

// Obtener pago por transactionId
export async function getPaymentByTransactionId(transactionId: string): Promise<PaymentResponse> {
  const payment = await prisma.payment.findUnique({
    where: { transactionId },
    include: {
      order: {
        select: { orderNumber: true },
      },
    },
  });

  if (!payment) {
    throw new NotFoundError('Pago no encontrado');
  }

  return formatPaymentResponse(payment);
}

// Actualizar pago
export async function updatePayment(id: number, data: UpdatePaymentInput): Promise<PaymentResponse> {
  const payment = await prisma.payment.findUnique({
    where: { id },
  });

  if (!payment) {
    throw new NotFoundError('Pago no encontrado');
  }

  // No se puede modificar un pago aprobado, reembolsado o parcialmente reembolsado
  if (['APPROVED', 'REFUNDED', 'PARTIAL_REFUND'].includes(payment.status)) {
    throw new BadRequestError(`No se puede modificar un pago en estado ${STATUS_LABELS[payment.status]}`);
  }

  const updateData: Prisma.PaymentUpdateInput = {};

  if (data.status) {
    updateData.status = data.status;

    // Actualizar timestamps según el nuevo estado
    if (data.status === 'APPROVED') {
      updateData.paidAt = new Date();
    } else if (data.status === 'FAILED') {
      updateData.failedAt = new Date();
    } else if (data.status === 'CANCELLED') {
      updateData.cancelledAt = new Date();
    } else if (data.status === 'EXPIRED') {
      updateData.expiredAt = new Date();
    }
  }

  if (data.transactionId !== undefined) {
    updateData.transactionId = data.transactionId;
  }

  if (data.receiptUrl !== undefined) {
    updateData.receiptUrl = data.receiptUrl;
  }

  if (data.receiptData !== undefined) {
    updateData.receiptData = data.receiptData;
  }

  if (data.failureReason !== undefined) {
    updateData.failureReason = data.failureReason;
  }

  if (data.failureCode !== undefined) {
    updateData.failureCode = data.failureCode;
  }

  if (data.notes !== undefined) {
    updateData.notes = data.notes;
  }

  const updated = await prisma.payment.update({
    where: { id },
    data: updateData,
    include: {
      order: {
        select: { orderNumber: true },
      },
    },
  });

  return formatPaymentResponse(updated);
}

// Verificar pago manualmente (admin)
export async function verifyPayment(id: number, data: VerifyPaymentInput): Promise<PaymentResponse> {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { order: true },
  });

  if (!payment) {
    throw new NotFoundError('Pago no encontrado');
  }

  if (payment.status !== 'PENDING' && payment.status !== 'PROCESSING') {
    throw new BadRequestError(
      `No se puede verificar un pago en estado ${STATUS_LABELS[payment.status]}`
    );
  }

  const newStatus: PaymentStatus = data.approved ? 'APPROVED' : 'DECLINED';

  // Actualizar pago y orden en transacción
  const updated = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id },
      data: {
        status: newStatus,
        verifiedBy: data.verifiedBy,
        verifiedAt: new Date(),
        notes: data.notes || null,
        paidAt: data.approved ? new Date() : null,
        failedAt: data.approved ? null : new Date(),
      },
      include: {
        order: {
          select: { orderNumber: true },
        },
      },
    });

    // Si se aprueba, actualizar el estado del pedido
    if (data.approved && payment.order.status === 'PENDING') {
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: 'PAID',
          paymentRef: payment.transactionId || `PAY-${payment.id}`,
          paidAt: new Date(),
          statusHistory: [
            ...(payment.order.statusHistory as any[]),
            {
              status: 'PAID',
              timestamp: new Date().toISOString(),
              note: 'Pago verificado y aprobado',
            },
          ],
        },
      });
    }

    return updatedPayment;
  });

  return formatPaymentResponse(updated);
}

// Reembolsar pago
export async function refundPayment(id: number, data: RefundPaymentInput): Promise<PaymentResponse> {
  const payment = await prisma.payment.findUnique({
    where: { id },
  });

  if (!payment) {
    throw new NotFoundError('Pago no encontrado');
  }

  if (payment.status !== 'APPROVED') {
    throw new BadRequestError('Solo se pueden reembolsar pagos aprobados');
  }

  const totalAmount = Number(payment.amount);
  const alreadyRefunded = Number(payment.refundedAmount);
  const refundAmount = data.amount !== undefined ? data.amount : totalAmount - alreadyRefunded;

  if (refundAmount <= 0) {
    throw new BadRequestError('El monto a reembolsar debe ser mayor a cero');
  }

  if (alreadyRefunded + refundAmount > totalAmount) {
    throw new BadRequestError('El monto total de reembolsos excede el monto del pago');
  }

  const newRefundedAmount = alreadyRefunded + refundAmount;
  const isFullRefund = newRefundedAmount >= totalAmount;
  const newStatus: PaymentStatus = isFullRefund ? 'REFUNDED' : 'PARTIAL_REFUND';

  const updated = await prisma.payment.update({
    where: { id },
    data: {
      status: newStatus,
      refundedAmount: newRefundedAmount,
      refundedAt: new Date(),
      refundReason: data.reason,
    },
    include: {
      order: {
        select: { orderNumber: true },
      },
    },
  });

  return formatPaymentResponse(updated);
}

// Cancelar pago (solo si está pendiente)
export async function cancelPayment(id: number, reason?: string): Promise<PaymentResponse> {
  const payment = await prisma.payment.findUnique({
    where: { id },
  });

  if (!payment) {
    throw new NotFoundError('Pago no encontrado');
  }

  if (payment.status !== 'PENDING' && payment.status !== 'PROCESSING') {
    throw new BadRequestError(
      `No se puede cancelar un pago en estado ${STATUS_LABELS[payment.status]}`
    );
  }

  const updated = await prisma.payment.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      notes: reason || 'Pago cancelado',
    },
    include: {
      order: {
        select: { orderNumber: true },
      },
    },
  });

  return formatPaymentResponse(updated);
}

// Obtener estadísticas de pagos
export async function getPaymentStats() {
  const [total, byStatus, byMethod, revenue, pending] = await Promise.all([
    prisma.payment.count(),
    prisma.payment.groupBy({
      by: ['status'],
      _count: true,
    }),
    prisma.payment.groupBy({
      by: ['paymentMethod'],
      _count: true,
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: 'APPROVED' },
      _sum: { amount: true, refundedAmount: true },
    }),
    prisma.payment.count({ where: { status: 'PENDING' } }),
  ]);

  const statusCounts = byStatus.reduce(
    (acc, item) => {
      acc[item.status] = item._count;
      return acc;
    },
    {} as Record<string, number>
  );

  const methodStats = byMethod.map((item) => ({
    method: item.paymentMethod,
    count: item._count,
    total: Number(item._sum.amount) || 0,
  }));

  return {
    total,
    pending,
    byStatus: statusCounts,
    byMethod: methodStats,
    revenue: {
      total: Number(revenue._sum.amount) || 0,
      refunded: Number(revenue._sum.refundedAmount) || 0,
      net: (Number(revenue._sum.amount) || 0) - (Number(revenue._sum.refundedAmount) || 0),
    },
  };
}
