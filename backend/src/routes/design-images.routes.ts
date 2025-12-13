import { Router } from 'express';
import * as designImagesController from '../controllers/design-images.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: DesignImages
 *   description: Catálogo de imágenes prediseñadas para el personalizador
 */

/**
 * @swagger
 * /design-images:
 *   get:
 *     summary: Listar todas las imágenes de diseño (público para customizer)
 *     tags: [DesignImages]
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por categoría
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre o descripción
 *     responses:
 *       200:
 *         description: Lista de imágenes de diseño
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
 *                     $ref: '#/components/schemas/DesignImage'
 */
router.get('/', designImagesController.getAllDesignImages);

/**
 * @swagger
 * /design-images/categories:
 *   get:
 *     summary: Obtener categorías únicas de imágenes
 *     tags: [DesignImages]
 *     responses:
 *       200:
 *         description: Lista de categorías
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
 *                     type: string
 */
router.get('/categories', designImagesController.getCategories);

/**
 * @swagger
 * /design-images/{id}:
 *   get:
 *     summary: Obtener imagen de diseño por ID
 *     tags: [DesignImages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Imagen de diseño encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DesignImage'
 *       404:
 *         description: Imagen no encontrada
 */
router.get('/:id', designImagesController.getDesignImageById);

/**
 * @swagger
 * /design-images:
 *   post:
 *     summary: Crear nueva imagen de diseño (solo admin)
 *     tags: [DesignImages]
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
 *               - thumbnailUrl
 *               - fullUrl
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               thumbnailUrl:
 *                 type: string
 *                 description: URL de imagen pequeña para preview
 *               fullUrl:
 *                 type: string
 *                 description: URL de imagen original/alta calidad
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               sortOrder:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Imagen de diseño creada
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere admin)
 */
router.post('/', authenticate, requireAdmin, designImagesController.createDesignImage);

/**
 * @swagger
 * /design-images/sort-order:
 *   put:
 *     summary: Actualizar orden de múltiples imágenes (solo admin)
 *     tags: [DesignImages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     sortOrder:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Orden actualizado
 *       401:
 *         description: No autenticado
 */
router.put('/sort-order', authenticate, requireAdmin, designImagesController.updateSortOrder);

/**
 * @swagger
 * /design-images/{id}:
 *   put:
 *     summary: Actualizar imagen de diseño (solo admin)
 *     tags: [DesignImages]
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
 *               description:
 *                 type: string
 *               thumbnailUrl:
 *                 type: string
 *               fullUrl:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               sortOrder:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Imagen actualizada
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 */
router.put('/:id', authenticate, requireAdmin, designImagesController.updateDesignImage);

/**
 * @swagger
 * /design-images/{id}:
 *   delete:
 *     summary: Eliminar imagen de diseño (solo admin)
 *     tags: [DesignImages]
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
 *         description: Si es true, elimina permanentemente
 *     responses:
 *       200:
 *         description: Imagen eliminada
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 */
router.delete('/:id', authenticate, requireAdmin, designImagesController.deleteDesignImage);

export default router;

/**
 * @swagger
 * components:
 *   schemas:
 *     DesignImage:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         thumbnailUrl:
 *           type: string
 *         fullUrl:
 *           type: string
 *         category:
 *           type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
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
