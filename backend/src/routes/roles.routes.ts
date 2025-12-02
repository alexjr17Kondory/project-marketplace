import { Router } from 'express';
import * as rolesController from '../controllers/roles.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { validate, validateQuery } from '../middleware/validate.middleware';
import {
  createRoleSchema,
  updateRoleSchema,
  assignRoleSchema,
  listRolesSchema,
  roleIdSchema,
} from '../validators/roles.validator';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "SuperAdmin"
 *         description:
 *           type: string
 *           example: "Acceso total al sistema"
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *           example: ["dashboard.view", "products.view", "products.create"]
 *         isSystem:
 *           type: boolean
 *           example: true
 *         isActive:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CreateRole:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - permissions
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           example: "Vendedor"
 *         description:
 *           type: string
 *           minLength: 5
 *           maxLength: 200
 *           example: "Puede gestionar productos y ver pedidos"
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *           example: ["products.view", "products.create", "orders.view"]
 *         isActive:
 *           type: boolean
 *           default: true
 *
 *     UpdateRole:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *         description:
 *           type: string
 *           minLength: 5
 *           maxLength: 200
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *         isActive:
 *           type: boolean
 *
 *     Permission:
 *       type: string
 *       enum:
 *         - dashboard.view
 *         - products.view
 *         - products.create
 *         - products.edit
 *         - products.delete
 *         - orders.view
 *         - orders.create
 *         - orders.edit
 *         - orders.delete
 *         - users.view
 *         - users.create
 *         - users.edit
 *         - users.delete
 *         - roles.view
 *         - roles.create
 *         - roles.edit
 *         - roles.delete
 *         - settings.view
 *         - settings.edit
 *         - reports.view
 *         - reports.export
 *         - catalogs.view
 *         - catalogs.create
 *         - catalogs.edit
 *         - catalogs.delete
 */

// ==================== RUTAS PÚBLICAS (solo para admins) ====================

/**
 * @swagger
 * /roles/permissions:
 *   get:
 *     summary: Obtener lista de permisos disponibles
 *     description: Retorna todos los permisos disponibles agrupados por módulo
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de permisos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                     groups:
 *                       type: object
 *                       additionalProperties:
 *                         type: array
 *                         items:
 *                           type: string
 */
router.get('/permissions', authenticate, requireAdmin, rolesController.getAvailablePermissions);

/**
 * @swagger
 * /roles/stats:
 *   get:
 *     summary: Obtener estadísticas de roles
 *     description: Retorna estadísticas de roles y distribución de usuarios
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de roles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRoles:
 *                       type: integer
 *                     activeRoles:
 *                       type: integer
 *                     inactiveRoles:
 *                       type: integer
 *                     distribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           userCount:
 *                             type: integer
 */
router.get('/stats', authenticate, requireAdmin, rolesController.getRolesStats);

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Listar todos los roles
 *     description: Retorna lista paginada de roles con filtros opcionales
 *     tags: [Roles]
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
 *         description: Elementos por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre o descripción
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *       - in: query
 *         name: includeUsers
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir usuarios asignados
 *     responses:
 *       200:
 *         description: Lista de roles
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
 *                     $ref: '#/components/schemas/Role'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get(
  '/',
  authenticate,
  requireAdmin,
  validateQuery(listRolesSchema),
  rolesController.getAllRoles
);

/**
 * @swagger
 * /roles/{id}:
 *   get:
 *     summary: Obtener rol por ID
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol
 *       - in: query
 *         name: includeUsers
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir usuarios asignados
 *     responses:
 *       200:
 *         description: Rol encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       404:
 *         description: Rol no encontrado
 */
router.get('/:id', authenticate, requireAdmin, rolesController.getRoleById);

/**
 * @swagger
 * /roles/{id}/users:
 *   get:
 *     summary: Obtener usuarios de un rol
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Lista de usuarios con este rol
 *       404:
 *         description: Rol no encontrado
 */
router.get('/:id/users', authenticate, requireAdmin, rolesController.getUsersByRole);

/**
 * @swagger
 * /roles:
 *   post:
 *     summary: Crear nuevo rol
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRole'
 *     responses:
 *       201:
 *         description: Rol creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: Ya existe un rol con ese nombre
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate(createRoleSchema),
  rolesController.createRole
);

/**
 * @swagger
 * /roles/{id}:
 *   put:
 *     summary: Actualizar rol
 *     description: Actualiza un rol existente. Los roles del sistema no pueden modificar nombre ni permisos.
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRole'
 *     responses:
 *       200:
 *         description: Rol actualizado
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No se pueden modificar roles del sistema
 *       404:
 *         description: Rol no encontrado
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validate(updateRoleSchema),
  rolesController.updateRole
);

/**
 * @swagger
 * /roles/{id}:
 *   delete:
 *     summary: Eliminar rol
 *     description: Elimina un rol. No se pueden eliminar roles del sistema ni roles con usuarios asignados.
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol
 *     responses:
 *       200:
 *         description: Rol eliminado
 *       403:
 *         description: No se pueden eliminar roles del sistema
 *       404:
 *         description: Rol no encontrado
 *       409:
 *         description: El rol tiene usuarios asignados
 */
router.delete('/:id', authenticate, requireAdmin, rolesController.deleteRole);

/**
 * @swagger
 * /roles/assign:
 *   post:
 *     summary: Asignar rol a usuario
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - roleId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID del usuario
 *               roleId:
 *                 type: integer
 *                 description: ID del rol a asignar
 *     responses:
 *       200:
 *         description: Rol asignado exitosamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No se puede asignar un rol inactivo
 *       404:
 *         description: Usuario o rol no encontrado
 */
router.post(
  '/assign',
  authenticate,
  requireAdmin,
  validate(assignRoleSchema),
  rolesController.assignRoleToUser
);

export default router;
