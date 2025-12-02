import { Router } from 'express';
import * as productsController from '../controllers/products.controller';
import { validate, validateQuery, validateParams } from '../middleware/validate.middleware';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
  productIdSchema,
  updateStockSchema,
} from '../validators/products.validator';

const router = Router();

// ==================== RUTAS PÚBLICAS ====================

/**
 * @swagger
 * /products/featured:
 *   get:
 *     summary: Obtener productos destacados
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 8
 *         description: Cantidad de productos
 *     responses:
 *       200:
 *         description: Lista de productos destacados
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
 *                     $ref: '#/components/schemas/Product'
 */
router.get('/featured', productsController.getFeaturedProducts);

/**
 * @swagger
 * /products/categories:
 *   get:
 *     summary: Obtener lista de categorías
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Lista de categorías únicas
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
 *                   example: ["Camisetas", "Sudaderas", "Accesorios"]
 */
router.get('/categories', productsController.getCategories);

/**
 * @swagger
 * /products/types:
 *   get:
 *     summary: Obtener lista de tipos de producto
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Lista de tipos únicos
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
 *                   example: ["Camiseta", "Sudadera", "Gorra"]
 */
router.get('/types', productsController.getTypes);

/**
 * @swagger
 * /products/category/{category}:
 *   get:
 *     summary: Obtener productos por categoría
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre de la categoría
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Cantidad de productos
 *     responses:
 *       200:
 *         description: Lista de productos de la categoría
 */
router.get('/category/:category', productsController.getProductsByCategory);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Listar productos con filtros
 *     tags: [Products]
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
 *           default: 12
 *           maximum: 100
 *         description: Productos por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre o descripción
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por categoría
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filtrar por tipo
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Precio mínimo
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Precio máximo
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Solo destacados
 *       - in: query
 *         name: color
 *         schema:
 *           type: string
 *         description: Filtrar por color
 *       - in: query
 *         name: size
 *         schema:
 *           type: string
 *         description: Filtrar por talla
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, basePrice, createdAt, rating, stock]
 *           default: createdAt
 *         description: Campo para ordenar
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Orden
 *     responses:
 *       200:
 *         description: Lista de productos paginada
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
 *                     $ref: '#/components/schemas/Product'
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
 */
router.get(
  '/',
  validateQuery(listProductsQuerySchema),
  productsController.listProducts
);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Obtener producto por ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Datos del producto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Producto no encontrado
 */
router.get(
  '/:id',
  validateParams(productIdSchema),
  productsController.getProductById
);

// ==================== RUTAS DE ADMIN ====================

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Crear producto (Admin)
 *     tags: [Products]
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
 *               - description
 *               - type
 *               - category
 *               - basePrice
 *               - images
 *             properties:
 *               name:
 *                 type: string
 *                 example: Camiseta Personalizada
 *               description:
 *                 type: string
 *                 example: Camiseta 100% algodón con diseño personalizado
 *               type:
 *                 type: string
 *                 example: Camiseta
 *               category:
 *                 type: string
 *                 example: Ropa
 *               basePrice:
 *                 type: number
 *                 example: 45000
 *               stock:
 *                 type: integer
 *                 example: 100
 *               featured:
 *                 type: boolean
 *                 example: true
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["https://example.com/img1.jpg"]
 *               colors:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Negro", "Blanco", "Azul"]
 *               sizes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["S", "M", "L", "XL"]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["personalizado", "algodón"]
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate(createProductSchema),
  productsController.createProduct
);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Actualizar producto (Admin)
 *     tags: [Products]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *               category:
 *                 type: string
 *               basePrice:
 *                 type: number
 *               stock:
 *                 type: integer
 *               featured:
 *                 type: boolean
 *               isActive:
 *                 type: boolean
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               colors:
 *                 type: array
 *                 items:
 *                   type: string
 *               sizes:
 *                 type: array
 *                 items:
 *                   type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente
 *       404:
 *         description: Producto no encontrado
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validateParams(productIdSchema),
  validate(updateProductSchema),
  productsController.updateProduct
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Eliminar producto (Admin)
 *     tags: [Products]
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
 *         description: Producto eliminado exitosamente
 *       400:
 *         description: No se puede eliminar (tiene pedidos asociados)
 *       404:
 *         description: Producto no encontrado
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  validateParams(productIdSchema),
  productsController.deleteProduct
);

/**
 * @swagger
 * /products/{id}/stock:
 *   patch:
 *     summary: Actualizar stock del producto (Admin)
 *     tags: [Products]
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
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 example: 50
 *               operation:
 *                 type: string
 *                 enum: [set, add, subtract]
 *                 default: set
 *                 description: |
 *                   - set: Establece el stock al valor indicado
 *                   - add: Suma la cantidad al stock actual
 *                   - subtract: Resta la cantidad del stock actual
 *     responses:
 *       200:
 *         description: Stock actualizado exitosamente
 *       400:
 *         description: El stock no puede ser negativo
 *       404:
 *         description: Producto no encontrado
 */
router.patch(
  '/:id/stock',
  authenticate,
  requireAdmin,
  validateParams(productIdSchema),
  validate(updateStockSchema),
  productsController.updateStock
);

export default router;
