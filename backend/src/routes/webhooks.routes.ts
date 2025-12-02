import { Router } from 'express';
import * as webhooksController from '../controllers/webhooks.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /webhooks/wompi:
 *   post:
 *     summary: Webhook para eventos de Wompi
 *     tags: [Webhooks]
 *     description: |
 *       Endpoint para recibir notificaciones de eventos de Wompi.
 *       No requiere autenticación pero valida la firma del evento.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 example: transaction.updated
 *               data:
 *                 type: object
 *                 properties:
 *                   transaction:
 *                     type: object
 *               signature:
 *                 type: object
 *               timestamp:
 *                 type: number
 *     responses:
 *       200:
 *         description: Evento procesado
 *       401:
 *         description: Firma inválida
 */
router.post('/wompi', webhooksController.handleWompiWebhook);

/**
 * @swagger
 * /webhooks/wompi/verify/{transactionId}:
 *   get:
 *     summary: Verificar estado de transacción en Wompi
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la transacción en Wompi
 *     responses:
 *       200:
 *         description: Estado de la transacción
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Transacción no encontrada
 */
router.get('/wompi/verify/:transactionId', authenticate, requireAdmin, webhooksController.verifyWompiTransaction);

export default router;
