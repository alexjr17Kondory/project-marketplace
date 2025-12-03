import { Router } from 'express';
import * as templateZonesController from '../controllers/template-zones.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: TemplateZones
 *   description: Gestión de zonas de templates (áreas personalizables)
 */

/**
 * @swagger
 * /template-zones/template/{templateId}:
 *   get:
 *     summary: Obtener todas las zonas de un template
 *     tags: [TemplateZones]
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de zonas del template
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TemplateZone'
 */
router.get('/template/:templateId', templateZonesController.getZonesByTemplateId);

/**
 * @swagger
 * /template-zones/{id}:
 *   get:
 *     summary: Obtener zona por ID
 *     tags: [TemplateZones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Zona encontrada
 *       404:
 *         description: Zona no encontrada
 */
router.get('/:id', templateZonesController.getZoneById);

/**
 * @swagger
 * /template-zones/template/{templateId}:
 *   post:
 *     summary: Crear nueva zona en un template
 *     tags: [TemplateZones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - zoneTypeId
 *               - name
 *               - positionX
 *               - positionY
 *               - width
 *               - height
 *             properties:
 *               zoneTypeId:
 *                 type: integer
 *               name:
 *                 type: string
 *               positionX:
 *                 type: number
 *               positionY:
 *                 type: number
 *               width:
 *                 type: number
 *               height:
 *                 type: number
 *               isRequired:
 *                 type: boolean
 *               maxCharacters:
 *                 type: integer
 *               allowedColors:
 *                 type: string
 *               sortOrder:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Zona creada exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 */
router.post('/template/:templateId', authenticate, requireAdmin, templateZonesController.createZone);

/**
 * @swagger
 * /template-zones/{id}:
 *   put:
 *     summary: Actualizar zona
 *     tags: [TemplateZones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               zoneTypeId:
 *                 type: integer
 *               name:
 *                 type: string
 *               positionX:
 *                 type: number
 *               positionY:
 *                 type: number
 *               width:
 *                 type: number
 *               height:
 *                 type: number
 *               isRequired:
 *                 type: boolean
 *               maxCharacters:
 *                 type: integer
 *               allowedColors:
 *                 type: string
 *               sortOrder:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Zona actualizada
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 */
router.put('/:id', authenticate, requireAdmin, templateZonesController.updateZone);

/**
 * @swagger
 * /template-zones/{id}:
 *   delete:
 *     summary: Eliminar zona
 *     tags: [TemplateZones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: permanent
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Zona eliminada
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 */
router.delete('/:id', authenticate, requireAdmin, templateZonesController.deleteZone);

/**
 * @swagger
 * /template-zones/{zoneId}/input:
 *   post:
 *     summary: Asignar o actualizar insumo a una zona
 *     tags: [TemplateZones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: zoneId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inputId
 *               - quantityPerUnit
 *             properties:
 *               inputId:
 *                 type: integer
 *                 description: ID del insumo
 *               quantityPerUnit:
 *                 type: number
 *                 description: Cantidad de insumo por unidad producida
 *     responses:
 *       200:
 *         description: Insumo asignado exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 */
router.post('/:zoneId/input', authenticate, requireAdmin, templateZonesController.upsertZoneInput);

/**
 * @swagger
 * /template-zones/{zoneId}/input:
 *   delete:
 *     summary: Eliminar insumo de una zona
 *     tags: [TemplateZones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: zoneId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Insumo eliminado de la zona
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 */
router.delete('/:zoneId/input', authenticate, requireAdmin, templateZonesController.deleteZoneInput);

export default router;

/**
 * @swagger
 * components:
 *   schemas:
 *     TemplateZone:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         templateId:
 *           type: integer
 *         zoneTypeId:
 *           type: integer
 *         name:
 *           type: string
 *         positionX:
 *           type: number
 *         positionY:
 *           type: number
 *         width:
 *           type: number
 *         height:
 *           type: number
 *         isRequired:
 *           type: boolean
 *         maxCharacters:
 *           type: integer
 *         allowedColors:
 *           type: string
 *         sortOrder:
 *           type: integer
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         zoneType:
 *           $ref: '#/components/schemas/ZoneType'
 *         zoneInput:
 *           $ref: '#/components/schemas/ZoneInput'
 *     ZoneInput:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         zoneId:
 *           type: integer
 *         inputId:
 *           type: integer
 *         quantityPerUnit:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
