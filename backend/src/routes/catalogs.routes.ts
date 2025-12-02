import { Router } from 'express';
import * as catalogsController from '../controllers/catalogs.controller';
import { validate, validateParams } from '../middleware/validate.middleware';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import {
  createSizeSchema,
  updateSizeSchema,
  createColorSchema,
  updateColorSchema,
  createCategorySchema,
  updateCategorySchema,
  createProductTypeSchema,
  updateProductTypeSchema,
  catalogIdSchema,
} from '../validators/catalogs.validator';

const router = Router();

// ==================== TALLAS ====================

/**
 * @swagger
 * /catalogs/sizes:
 *   get:
 *     summary: Listar tallas
 *     tags: [Catalogs]
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir tallas inactivas
 *     responses:
 *       200:
 *         description: Lista de tallas
 */
router.get('/sizes', catalogsController.listSizes);

/**
 * @swagger
 * /catalogs/sizes/{id}:
 *   get:
 *     summary: Obtener talla por ID
 *     tags: [Catalogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos de la talla
 *       404:
 *         description: Talla no encontrada
 */
router.get('/sizes/:id', validateParams(catalogIdSchema), catalogsController.getSizeById);

/**
 * @swagger
 * /catalogs/sizes:
 *   post:
 *     summary: Crear talla (Admin)
 *     tags: [Catalogs]
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
 *               - abbreviation
 *             properties:
 *               name:
 *                 type: string
 *                 example: Extra Grande
 *               abbreviation:
 *                 type: string
 *                 example: XL
 *               sortOrder:
 *                 type: integer
 *                 example: 4
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Talla creada
 *       409:
 *         description: Ya existe una talla con ese nombre
 */
router.post(
  '/sizes',
  authenticate,
  requireAdmin,
  validate(createSizeSchema),
  catalogsController.createSize
);

/**
 * @swagger
 * /catalogs/sizes/{id}:
 *   put:
 *     summary: Actualizar talla (Admin)
 *     tags: [Catalogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               abbreviation:
 *                 type: string
 *               sortOrder:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Talla actualizada
 */
router.put(
  '/sizes/:id',
  authenticate,
  requireAdmin,
  validateParams(catalogIdSchema),
  validate(updateSizeSchema),
  catalogsController.updateSize
);

/**
 * @swagger
 * /catalogs/sizes/{id}:
 *   delete:
 *     summary: Eliminar talla (Admin)
 *     tags: [Catalogs]
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
 *         description: Talla eliminada
 */
router.delete(
  '/sizes/:id',
  authenticate,
  requireAdmin,
  validateParams(catalogIdSchema),
  catalogsController.deleteSize
);

// ==================== COLORES ====================

/**
 * @swagger
 * /catalogs/colors:
 *   get:
 *     summary: Listar colores
 *     tags: [Catalogs]
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de colores
 */
router.get('/colors', catalogsController.listColors);

/**
 * @swagger
 * /catalogs/colors/{id}:
 *   get:
 *     summary: Obtener color por ID
 *     tags: [Catalogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del color
 */
router.get('/colors/:id', validateParams(catalogIdSchema), catalogsController.getColorById);

/**
 * @swagger
 * /catalogs/colors:
 *   post:
 *     summary: Crear color (Admin)
 *     tags: [Catalogs]
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
 *               - hexCode
 *             properties:
 *               name:
 *                 type: string
 *                 example: Rojo
 *               hexCode:
 *                 type: string
 *                 example: "#FF0000"
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Color creado
 */
router.post(
  '/colors',
  authenticate,
  requireAdmin,
  validate(createColorSchema),
  catalogsController.createColor
);

/**
 * @swagger
 * /catalogs/colors/{id}:
 *   put:
 *     summary: Actualizar color (Admin)
 *     tags: [Catalogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               hexCode:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Color actualizado
 */
router.put(
  '/colors/:id',
  authenticate,
  requireAdmin,
  validateParams(catalogIdSchema),
  validate(updateColorSchema),
  catalogsController.updateColor
);

/**
 * @swagger
 * /catalogs/colors/{id}:
 *   delete:
 *     summary: Eliminar color (Admin)
 *     tags: [Catalogs]
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
 *         description: Color eliminado
 */
router.delete(
  '/colors/:id',
  authenticate,
  requireAdmin,
  validateParams(catalogIdSchema),
  catalogsController.deleteColor
);

// ==================== CATEGORÍAS ====================

/**
 * @swagger
 * /catalogs/categories:
 *   get:
 *     summary: Listar categorías
 *     tags: [Catalogs]
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de categorías
 */
router.get('/categories', catalogsController.listCategories);

/**
 * @swagger
 * /catalogs/categories/{id}:
 *   get:
 *     summary: Obtener categoría por ID
 *     tags: [Catalogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos de la categoría
 */
router.get('/categories/:id', validateParams(catalogIdSchema), catalogsController.getCategoryById);

/**
 * @swagger
 * /catalogs/categories:
 *   post:
 *     summary: Crear categoría (Admin)
 *     tags: [Catalogs]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: Accesorios
 *               description:
 *                 type: string
 *                 example: Accesorios personalizables
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Categoría creada
 */
router.post(
  '/categories',
  authenticate,
  requireAdmin,
  validate(createCategorySchema),
  catalogsController.createCategory
);

/**
 * @swagger
 * /catalogs/categories/{id}:
 *   put:
 *     summary: Actualizar categoría (Admin)
 *     tags: [Catalogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Categoría actualizada
 */
router.put(
  '/categories/:id',
  authenticate,
  requireAdmin,
  validateParams(catalogIdSchema),
  validate(updateCategorySchema),
  catalogsController.updateCategory
);

/**
 * @swagger
 * /catalogs/categories/{id}:
 *   delete:
 *     summary: Eliminar categoría (Admin)
 *     tags: [Catalogs]
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
 *         description: Categoría eliminada
 *       409:
 *         description: No se puede eliminar, hay productos usando esta categoría
 */
router.delete(
  '/categories/:id',
  authenticate,
  requireAdmin,
  validateParams(catalogIdSchema),
  catalogsController.deleteCategory
);

// ==================== TIPOS DE PRODUCTO ====================

/**
 * @swagger
 * /catalogs/product-types:
 *   get:
 *     summary: Listar tipos de producto
 *     tags: [Catalogs]
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de tipos de producto
 */
router.get('/product-types', catalogsController.listProductTypes);

/**
 * @swagger
 * /catalogs/product-types/{id}:
 *   get:
 *     summary: Obtener tipo de producto por ID
 *     tags: [Catalogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del tipo de producto
 */
router.get(
  '/product-types/:id',
  validateParams(catalogIdSchema),
  catalogsController.getProductTypeById
);

/**
 * @swagger
 * /catalogs/product-types:
 *   post:
 *     summary: Crear tipo de producto (Admin)
 *     tags: [Catalogs]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: Termo
 *               description:
 *                 type: string
 *                 example: Termos personalizables
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Tipo de producto creado
 */
router.post(
  '/product-types',
  authenticate,
  requireAdmin,
  validate(createProductTypeSchema),
  catalogsController.createProductType
);

/**
 * @swagger
 * /catalogs/product-types/{id}:
 *   put:
 *     summary: Actualizar tipo de producto (Admin)
 *     tags: [Catalogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tipo de producto actualizado
 */
router.put(
  '/product-types/:id',
  authenticate,
  requireAdmin,
  validateParams(catalogIdSchema),
  validate(updateProductTypeSchema),
  catalogsController.updateProductType
);

/**
 * @swagger
 * /catalogs/product-types/{id}:
 *   delete:
 *     summary: Eliminar tipo de producto (Admin)
 *     tags: [Catalogs]
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
 *         description: Tipo de producto eliminado
 *       409:
 *         description: No se puede eliminar, hay productos usando este tipo
 */
router.delete(
  '/product-types/:id',
  authenticate,
  requireAdmin,
  validateParams(catalogIdSchema),
  catalogsController.deleteProductType
);

// ==================== TALLAS POR TIPO DE PRODUCTO ====================

/**
 * @swagger
 * /catalogs/product-types/{productTypeId}/sizes:
 *   get:
 *     summary: Obtener tallas disponibles para un tipo de producto
 *     tags: [Catalogs]
 *     parameters:
 *       - in: path
 *         name: productTypeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de tallas del tipo de producto
 */
router.get(
  '/product-types/:productTypeId/sizes',
  validateParams(catalogIdSchema.extend({ productTypeId: catalogIdSchema.shape.id })),
  catalogsController.getSizesByProductType
);

/**
 * @swagger
 * /catalogs/product-types/{productTypeId}/sizes:
 *   put:
 *     summary: Asignar tallas a un tipo de producto (Admin)
 *     tags: [Catalogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productTypeId
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
 *               - sizeIds
 *             properties:
 *               sizeIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3, 4]
 *     responses:
 *       200:
 *         description: Tallas asignadas exitosamente
 */
router.put(
  '/product-types/:productTypeId/sizes',
  authenticate,
  requireAdmin,
  validateParams(catalogIdSchema.extend({ productTypeId: catalogIdSchema.shape.id })),
  catalogsController.assignSizesToProductType
);

export default router;
