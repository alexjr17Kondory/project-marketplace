import { Router } from 'express';
import * as usersController from '../controllers/users.controller';
import { validate, validateQuery, validateParams } from '../middleware/validate.middleware';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import {
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
  listUsersQuerySchema,
  userIdSchema,
  addressSchema,
  addressIdSchema,
} from '../validators/users.validator';

const router = Router();

// ==================== RUTAS DE PERFIL (antes de /:id) ====================

/**
 * @swagger
 * /users/profile/me:
 *   get:
 *     summary: Obtener mi perfil
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del perfil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 */
router.get('/profile/me', authenticate, usersController.getProfile);

/**
 * @swagger
 * /users/profile/me:
 *   put:
 *     summary: Actualizar mi perfil
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Mi Nuevo Nombre
 *               phone:
 *                 type: string
 *                 example: "+57 300 123 4567"
 *               cedula:
 *                 type: string
 *                 example: "1234567890"
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 */
router.put(
  '/profile/me',
  authenticate,
  validate(updateProfileSchema),
  usersController.updateProfile
);

// ==================== RUTAS DE DIRECCIONES (antes de /:id) ====================

/**
 * @swagger
 * /users/addresses:
 *   get:
 *     summary: Obtener mis direcciones
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de direcciones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Address'
 */
router.get('/addresses', authenticate, usersController.getAddresses);

/**
 * @swagger
 * /users/addresses:
 *   post:
 *     summary: Crear nueva dirección
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - label
 *               - address
 *               - city
 *             properties:
 *               label:
 *                 type: string
 *                 example: Casa
 *               address:
 *                 type: string
 *                 example: Calle 123 # 45-67
 *               city:
 *                 type: string
 *                 example: Medellín
 *               department:
 *                 type: string
 *                 example: Antioquia
 *               postalCode:
 *                 type: string
 *                 example: "050001"
 *               country:
 *                 type: string
 *                 example: Colombia
 *               isDefault:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Dirección creada exitosamente
 */
router.post(
  '/addresses',
  authenticate,
  validate(addressSchema),
  usersController.createAddress
);

/**
 * @swagger
 * /users/addresses/{addressId}:
 *   put:
 *     summary: Actualizar dirección
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Address'
 *     responses:
 *       200:
 *         description: Dirección actualizada exitosamente
 *       404:
 *         description: Dirección no encontrada
 */
router.put(
  '/addresses/:addressId',
  authenticate,
  validateParams(addressIdSchema),
  validate(addressSchema),
  usersController.updateAddress
);

/**
 * @swagger
 * /users/addresses/{addressId}:
 *   delete:
 *     summary: Eliminar dirección
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dirección eliminada exitosamente
 *       404:
 *         description: Dirección no encontrada
 */
router.delete(
  '/addresses/:addressId',
  authenticate,
  validateParams(addressIdSchema),
  usersController.deleteAddress
);

/**
 * @swagger
 * /users/addresses/{addressId}/default:
 *   patch:
 *     summary: Establecer dirección predeterminada
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dirección predeterminada actualizada
 *       404:
 *         description: Dirección no encontrada
 */
router.patch(
  '/addresses/:addressId/default',
  authenticate,
  validateParams(addressIdSchema),
  usersController.setDefaultAddress
);

// ==================== RUTAS DE ADMIN ====================

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Listar usuarios (Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Usuarios por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre, email o cédula
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, SUSPENDED]
 *         description: Filtrar por estado
 *       - in: query
 *         name: roleId
 *         schema:
 *           type: integer
 *         description: Filtrar por rol
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, email, createdAt, updatedAt]
 *           default: createdAt
 *         description: Campo para ordenar
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Orden de clasificación
 *     responses:
 *       200:
 *         description: Lista de usuarios paginada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado
 */
router.get(
  '/',
  authenticate,
  requireAdmin,
  validateQuery(listUsersQuerySchema),
  usersController.listUsers
);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Crear usuario (Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - roleId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: nuevo@email.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: password123
 *               name:
 *                 type: string
 *                 example: Nuevo Usuario
 *               phone:
 *                 type: string
 *                 example: "+57 300 123 4567"
 *               cedula:
 *                 type: string
 *                 example: "1234567890"
 *               roleId:
 *                 type: integer
 *                 example: 2
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, SUSPENDED]
 *                 example: ACTIVE
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Usuario creado exitosamente
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       409:
 *         description: El email ya está registrado
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate(createUserSchema),
  usersController.createUser
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Obtener usuario por ID (Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Datos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: Usuario no encontrado
 */
router.get(
  '/:id',
  authenticate,
  requireAdmin,
  validateParams(userIdSchema),
  usersController.getUserById
);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Actualizar usuario (Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               cedula:
 *                 type: string
 *               roleId:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, SUSPENDED]
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *       404:
 *         description: Usuario no encontrado
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validateParams(userIdSchema),
  validate(updateUserSchema),
  usersController.updateUser
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Eliminar usuario (Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
 *       400:
 *         description: No se puede eliminar un superadmin
 *       404:
 *         description: Usuario no encontrado
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  validateParams(userIdSchema),
  usersController.deleteUser
);

export default router;
