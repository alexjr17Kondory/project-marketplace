import { Request, Response, NextFunction } from 'express';
import * as wompiService from '../services/wompi.service';

/**
 * Webhook de Wompi para eventos de transacciones
 * POST /api/webhooks/wompi
 */
export async function handleWompiWebhook(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const event = req.body as wompiService.WompiEvent;

    console.log('📥 Webhook Wompi recibido:', event.event);

    // Validar firma
    if (!wompiService.validateWebhookSignature(event)) {
      console.warn('⚠️ Firma de webhook inválida');
      res.status(401).json({
        success: false,
        message: 'Firma inválida',
      });
      return;
    }

    // Procesar según el tipo de evento
    switch (event.event) {
      case 'transaction.updated':
        const result = await wompiService.processTransactionEvent(event);
        res.json({
          success: result.success,
          message: result.message,
        });
        break;

      case 'nequi_token.updated':
        // Token de Nequi actualizado
        console.log('ℹ️ Token Nequi actualizado');
        res.json({ success: true, message: 'Token Nequi procesado' });
        break;

      default:
        console.log(`ℹ️ Evento no manejado: ${event.event}`);
        res.json({ success: true, message: 'Evento recibido' });
    }
  } catch (error) {
    console.error('Error en webhook Wompi:', error);
    // Siempre responder 200 para que Wompi no reintente
    res.json({
      success: false,
      message: error instanceof Error ? error.message : 'Error procesando webhook',
    });
  }
}

/**
 * Verificar estado de transacción manualmente
 * GET /api/webhooks/wompi/verify/:transactionId
 */
export async function verifyWompiTransaction(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { transactionId } = req.params;

    if (!transactionId) {
      res.status(400).json({
        success: false,
        message: 'transactionId es requerido',
      });
      return;
    }

    const status = await wompiService.verifyTransaction(transactionId);

    if (!status) {
      res.status(404).json({
        success: false,
        message: 'No se pudo verificar la transacción',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        transactionId,
        status,
      },
    });
  } catch (error) {
    next(error);
  }
}
