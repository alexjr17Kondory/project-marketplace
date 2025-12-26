import { Router } from 'express';
import * as suppliersController from '../controllers/suppliers.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permissions.middleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Supplier:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         code:
 *           type: string
 *           description: Código único del proveedor
 *         name:
 *           type: string
 *           description: Razón social
 *         taxId:
 *           type: string
 *           description: NIT/RUT/RUC
 *         taxIdType:
 *           type: string
 *         contactName:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         address:
 *           type: string
 *         city:
 *           type: string
 *         department:
 *           type: string
 *         country:
 *           type: string
 *         paymentTerms:
 *           type: string
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/suppliers:
 *   get:
 *     summary: Obtener todos los proveedores
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre, código, NIT, contacto o email
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filtrar por ciudad
 *     responses:
 *       200:
 *         description: Lista de proveedores
 */
router.get('/', authenticate, requirePermission('inventory.view'), suppliersController.getSuppliers);

/**
 * @swagger
 * /api/suppliers/stats:
 *   get:
 *     summary: Obtener estadísticas de proveedores
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de proveedores
 */
router.get('/stats', authenticate, requirePermission('inventory.view'), suppliersController.getSupplierStats);

/**
 * @swagger
 * /api/suppliers/generate-code:
 *   get:
 *     summary: Generar código único para proveedor
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Código generado
 */
router.get('/generate-code', authenticate, requirePermission('inventory.manage'), suppliersController.generateCode);

/**
 * @swagger
 * /api/suppliers/{id}:
 *   get:
 *     summary: Obtener un proveedor por ID
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Proveedor encontrado
 *       404:
 *         description: Proveedor no encontrado
 */
router.get('/:id', authenticate, requirePermission('inventory.view'), suppliersController.getSupplierById);

/**
 * @swagger
 * /api/suppliers:
 *   post:
 *     summary: Crear un nuevo proveedor
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Supplier'
 *     responses:
 *       201:
 *         description: Proveedor creado
 *       400:
 *         description: Error de validación
 */
router.post('/', authenticate, requirePermission('inventory.manage'), suppliersController.createSupplier);

/**
 * @swagger
 * /api/suppliers/{id}:
 *   put:
 *     summary: Actualizar un proveedor
 *     tags: [Suppliers]
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
 *             $ref: '#/components/schemas/Supplier'
 *     responses:
 *       200:
 *         description: Proveedor actualizado
 *       400:
 *         description: Error de validación
 */
router.put('/:id', authenticate, requirePermission('inventory.manage'), suppliersController.updateSupplier);

/**
 * @swagger
 * /api/suppliers/{id}:
 *   delete:
 *     summary: Eliminar un proveedor
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Proveedor eliminado
 *       400:
 *         description: Error (tiene órdenes asociadas)
 */
router.delete('/:id', authenticate, requirePermission('inventory.manage'), suppliersController.deleteSupplier);

export default router;
