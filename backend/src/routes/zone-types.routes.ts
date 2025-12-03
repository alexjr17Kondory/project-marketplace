import { Router } from 'express';
import * as zoneTypesController from '../controllers/zone-types.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: ZoneTypes
 *   description: Gestión de tipos de zona para templates
 */

/**
 * @swagger
 * /zone-types:
 *   get:
 *     summary: Listar todos los tipos de zona (público para customizer)
 *     tags: [ZoneTypes]
 *     responses:
 *       200:
 *         description: Lista de tipos de zona
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
 *                     $ref: '#/components/schemas/ZoneType'
 */
router.get('/', zoneTypesController.getAllZoneTypes);

/**
 * @swagger
 * /zone-types/{id}:
 *   get:
 *     summary: Obtener tipo de zona por ID (público para customizer)
 *     tags: [ZoneTypes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tipo de zona encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ZoneType'
 *       404:
 *         description: Tipo de zona no encontrado
 */
router.get('/:id', zoneTypesController.getZoneTypeById);

/**
 * @swagger
 * /zone-types:
 *   post:
 *     summary: Crear nuevo tipo de zona (solo admin)
 *     tags: [ZoneTypes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - slug
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               sortOrder:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Tipo de zona creado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere admin)
 */
router.post('/', authenticate, requireAdmin, zoneTypesController.createZoneType);

/**
 * @swagger
 * /zone-types/{id}:
 *   put:
 *     summary: Actualizar tipo de zona (solo admin)
 *     tags: [ZoneTypes]
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
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               sortOrder:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tipo de zona actualizado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 */
router.put('/:id', authenticate, requireAdmin, zoneTypesController.updateZoneType);

/**
 * @swagger
 * /zone-types/{id}:
 *   delete:
 *     summary: Eliminar tipo de zona (solo admin)
 *     tags: [ZoneTypes]
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
 *         description: Si es true, elimina permanentemente. Si es false, hace soft delete
 *     responses:
 *       200:
 *         description: Tipo de zona eliminado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 */
router.delete('/:id', authenticate, requireAdmin, zoneTypesController.deleteZoneType);

export default router;

/**
 * @swagger
 * components:
 *   schemas:
 *     ZoneType:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         slug:
 *           type: string
 *         description:
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
 */
