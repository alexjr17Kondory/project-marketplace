import crypto from 'crypto';
import { prisma } from '../config/database';
import * as emailService from './email.service';
import * as settingsService from './settings.service';
import * as ordersService from './orders.service';

// Estados de transacción de Wompi
export type WompiTransactionStatus = 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR' | 'PENDING';

export interface WompiEvent {
  event: string;
  data: {
    transaction: {
      id: string;
      created_at: string;
      finalized_at: string;
      amount_in_cents: number;
      reference: string;
      customer_email: string;
      currency: string;
      payment_method_type: string;
      payment_method: {
        type: string;
        extra: any;
        installments: number;
      };
      status: WompiTransactionStatus;
      status_message: string | null;
      billing_data: any;
      shipping_address: any;
      redirect_url: string;
      payment_source_id: number | null;
      payment_link_id: number | null;
      customer_data: {
        full_name: string;
        phone_number: string;
      };
      bill_id: string | null;
    };
  };
  sent_at: string;
  timestamp: number;
  signature: {
    checksum: string;
    properties: string[];
  };
  environment: 'test' | 'prod';
}

/**
 * Validar la firma del webhook de Wompi
 */
export function validateWebhookSignature(event: WompiEvent): boolean {
  const eventsSecret = process.env['WOMPI_EVENTS_SECRET'];

  if (!eventsSecret) {
    console.warn('⚠️ WOMPI_EVENTS_SECRET no configurado. Saltando validación de firma.');
    return true; // En desarrollo, permitir sin validación
  }

  try {
    const { properties, checksum } = event.signature;
    const transaction = event.data.transaction;

    // Construir string para hash según las propiedades
    const values = properties.map((prop) => {
      const keys = prop.split('.');
      let value: any = event;
      for (const key of keys) {
        value = value[key];
      }
      return value;
    });

    // Agregar timestamp y secret
    const stringToHash = values.join('') + event.timestamp + eventsSecret;

    // Calcular SHA256
    const calculatedChecksum = crypto
      .createHash('sha256')
      .update(stringToHash)
      .digest('hex');

    return calculatedChecksum === checksum;
  } catch (error) {
    console.error('Error validando firma de Wompi:', error);
    return false;
  }
}

/**
 * Procesar evento de transacción de Wompi
 */
export async function processTransactionEvent(event: WompiEvent): Promise<{
  success: boolean;
  message: string;
  orderId?: number;
}> {
  const transaction = event.data.transaction;
  const { reference, status, amount_in_cents, id: transactionId } = transaction;

  console.log(`📦 Procesando transacción Wompi: ${transactionId}`);
  console.log(`   Referencia: ${reference}, Estado: ${status}`);

  try {
    // La referencia debería ser el número de orden
    const order = await prisma.order.findUnique({
      where: { orderNumber: reference },
      include: {
        user: { select: { email: true, name: true } },
        items: true,
      },
    });

    if (!order) {
      console.warn(`⚠️ Orden no encontrada: ${reference}`);
      return {
        success: false,
        message: `Orden no encontrada: ${reference}`,
      };
    }

    // Verificar que el monto coincida (en centavos)
    const expectedAmount = Math.round(Number(order.total) * 100);
    if (amount_in_cents !== expectedAmount) {
      console.warn(`⚠️ Monto no coincide. Esperado: ${expectedAmount}, Recibido: ${amount_in_cents}`);
      // Continuar de todos modos pero loguear la discrepancia
    }

    // Procesar según el estado
    switch (status) {
      case 'APPROVED':
        await handleApprovedTransaction(order, transactionId);
        break;

      case 'DECLINED':
      case 'ERROR':
        await handleFailedTransaction(order, status, transaction.status_message);
        break;

      case 'VOIDED':
        await handleVoidedTransaction(order, transactionId);
        break;

      case 'PENDING':
        // No hacer nada, esperar siguiente evento
        console.log(`⏳ Transacción pendiente: ${transactionId}`);
        break;

      default:
        console.warn(`⚠️ Estado desconocido: ${status}`);
    }

    return {
      success: true,
      message: `Transacción procesada: ${status}`,
      orderId: order.id,
    };
  } catch (error) {
    console.error('Error procesando transacción:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Manejar transacción aprobada
 */
async function handleApprovedTransaction(order: any, transactionId: string) {
  // Solo actualizar si el pedido está pendiente
  if (order.status !== 'PENDING') {
    console.log(`ℹ️ Orden ${order.orderNumber} ya no está pendiente (${order.status})`);
    return;
  }

  // Actualizar paymentRef primero (antes de cambiar estado)
  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentRef: transactionId,
    },
  });

  // Usar updateOrderStatus para que se procesen los movimientos de inventario
  // (consumo de insumos para templates, etc.)
  await ordersService.updateOrderStatus(order.id, {
    status: 'PAID',
    notes: `Pago confirmado via Wompi. Transacción: ${transactionId}`,
  });

  console.log(`✅ Orden ${order.orderNumber} marcada como PAID (con consumo de insumos)`);

  // Enviar email de confirmación
  if (order.user?.email) {
    await emailService.sendOrderStatusUpdate(order.user.email, {
      orderNumber: order.orderNumber,
      customerName: order.user.name,
      newStatus: 'PAID',
      statusLabel: 'Pago Confirmado',
      message: 'Tu pago ha sido procesado exitosamente. Estamos preparando tu pedido.',
    });
  }
}

/**
 * Manejar transacción fallida
 */
async function handleFailedTransaction(
  order: any,
  status: string,
  statusMessage: string | null
) {
  // Solo actualizar si el pedido está pendiente
  if (order.status !== 'PENDING') {
    console.log(`ℹ️ Orden ${order.orderNumber} ya no está pendiente (${order.status})`);
    return;
  }

  // Agregar nota al historial pero no cambiar estado
  await prisma.order.update({
    where: { id: order.id },
    data: {
      statusHistory: [
        ...(order.statusHistory as any[]),
        {
          status: order.status,
          timestamp: new Date().toISOString(),
          note: `Pago fallido: ${status}. ${statusMessage || 'Sin detalles'}`,
        },
      ],
    },
  });

  console.log(`❌ Pago fallido para orden ${order.orderNumber}: ${status}`);

  // Enviar email notificando el fallo
  if (order.user?.email) {
    await emailService.sendOrderStatusUpdate(order.user.email, {
      orderNumber: order.orderNumber,
      customerName: order.user.name,
      newStatus: 'PENDING',
      statusLabel: 'Pago No Procesado',
      message: `Hubo un problema con tu pago: ${statusMessage || 'Transacción rechazada'}. Por favor intenta de nuevo.`,
    });
  }
}

/**
 * Manejar transacción anulada
 */
async function handleVoidedTransaction(order: any, transactionId: string) {
  // Si la orden ya fue pagada y se anuló, marcar como cancelada
  if (order.status === 'PAID') {
    // Usar updateOrderStatus para restaurar stock correctamente
    // (restaura ProductVariant.stock para productos regulares y InputVariant.currentStock para templates)
    await ordersService.updateOrderStatus(order.id, {
      status: 'CANCELLED',
      notes: `Pago anulado via Wompi. Transacción: ${transactionId}`,
    });

    console.log(`🚫 Orden ${order.orderNumber} cancelada por pago anulado (stock restaurado)`);
  }
}

/**
 * Obtener URL base de Wompi según el modo (test o producción)
 */
function getWompiBaseUrl(isTestMode: boolean): string {
  return isTestMode
    ? 'https://sandbox.wompi.co/v1'
    : 'https://production.wompi.co/v1';
}

/**
 * Verificar estado de una transacción directamente con Wompi
 */
export async function verifyTransaction(transactionId: string): Promise<WompiTransactionStatus | null> {
  const credentials = await settingsService.getWompiCredentials();

  if (!credentials.publicKey) {
    console.warn('⚠️ WOMPI_PUBLIC_KEY no configurada');
    return null;
  }

  const baseUrl = getWompiBaseUrl(credentials.isTestMode);

  try {
    const response = await fetch(
      `${baseUrl}/transactions/${transactionId}`,
      {
        headers: {
          Authorization: `Bearer ${credentials.publicKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = (await response.json()) as { data: { status: WompiTransactionStatus } };
    return data.data.status;
  } catch (error) {
    console.error('Error verificando transacción:', error);
    return null;
  }
}

/**
 * Obtener detalles completos de una transacción de Wompi
 */
export async function getTransactionDetails(transactionId: string): Promise<{
  status: WompiTransactionStatus;
  reference: string;
  amountInCents: number;
} | null> {
  const credentials = await settingsService.getWompiCredentials();

  if (!credentials.publicKey) {
    console.warn('⚠️ WOMPI_PUBLIC_KEY no configurada');
    return null;
  }

  const baseUrl = getWompiBaseUrl(credentials.isTestMode);

  try {
    const response = await fetch(
      `${baseUrl}/transactions/${transactionId}`,
      {
        headers: {
          Authorization: `Bearer ${credentials.publicKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = (await response.json()) as {
      data: {
        status: WompiTransactionStatus;
        reference: string;
        amount_in_cents: number;
      };
    };

    return {
      status: data.data.status,
      reference: data.data.reference,
      amountInCents: data.data.amount_in_cents,
    };
  } catch (error) {
    console.error('Error obteniendo detalles de transacción:', error);
    return null;
  }
}

/**
 * Confirmar pago desde frontend (alternativa a webhook)
 * El frontend envía el transactionId después de que el usuario regresa del pago
 */
export async function confirmPaymentByTransaction(
  transactionId: string,
  orderNumber: string
): Promise<{ success: boolean; message: string; status?: WompiTransactionStatus }> {
  // Obtener detalles de la transacción
  const transaction = await getTransactionDetails(transactionId);

  if (!transaction) {
    return {
      success: false,
      message: 'No se pudo verificar la transacción con Wompi',
    };
  }

  // Verificar que la referencia coincide con el número de orden
  if (transaction.reference !== orderNumber) {
    console.warn(`⚠️ Referencia no coincide: ${transaction.reference} vs ${orderNumber}`);
    return {
      success: false,
      message: 'La transacción no corresponde a esta orden',
      status: transaction.status,
    };
  }

  // Obtener la orden
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      user: { select: { email: true, name: true } },
    },
  });

  if (!order) {
    return {
      success: false,
      message: 'Orden no encontrada',
    };
  }

  // Si ya está pagada, retornar éxito
  if (order.status === 'PAID') {
    return {
      success: true,
      message: 'El pedido ya está pagado',
      status: 'APPROVED',
    };
  }

  // Procesar según el estado
  switch (transaction.status) {
    case 'APPROVED':
      await handleApprovedTransaction(order, transactionId);
      return {
        success: true,
        message: 'Pago confirmado exitosamente',
        status: 'APPROVED',
      };

    case 'PENDING':
      return {
        success: false,
        message: 'El pago aún está pendiente',
        status: 'PENDING',
      };

    case 'DECLINED':
    case 'ERROR':
      await handleFailedTransaction(order, transaction.status, null);
      return {
        success: false,
        message: 'El pago fue rechazado',
        status: transaction.status,
      };

    case 'VOIDED':
      return {
        success: false,
        message: 'La transacción fue anulada',
        status: 'VOIDED',
      };

    default:
      return {
        success: false,
        message: `Estado desconocido: ${transaction.status}`,
        status: transaction.status,
      };
  }
}
