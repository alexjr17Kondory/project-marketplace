import { Router } from 'express';
import multer from 'multer';
import * as uploadsController from '../controllers/uploads.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { uploadFromUrlSchema, uploadBase64Schema } from '../validators/uploads.validator';

const router = Router();

// Configuración de Multer para memoria (buffer)
const storage = multer.memoryStorage();

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Validar tipo de archivo
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes (jpg, png, gif, webp, svg)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
    files: 10, // Máximo 10 archivos a la vez
  },
});

/**
 * @swagger
 * /uploads/image:
 *   post:
 *     summary: Subir una imagen
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Archivo de imagen
 *               folder:
 *                 type: string
 *                 enum: [products, designs, avatars, orders, general]
 *                 description: Carpeta destino
 *               publicId:
 *                 type: string
 *                 description: ID público personalizado
 *               width:
 *                 type: integer
 *                 description: Ancho deseado
 *               height:
 *                 type: integer
 *                 description: Alto deseado
 *     responses:
 *       201:
 *         description: Imagen subida exitosamente
 *       400:
 *         description: Error en la subida
 *       401:
 *         description: No autorizado
 */
router.post('/image', authenticate, upload.single('image'), uploadsController.uploadImage);

/**
 * @swagger
 * /uploads/images:
 *   post:
 *     summary: Subir múltiples imágenes
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               folder:
 *                 type: string
 *                 enum: [products, designs, avatars, orders, general]
 *     responses:
 *       201:
 *         description: Imágenes subidas exitosamente
 *       400:
 *         description: Error en la subida
 *       401:
 *         description: No autorizado
 */
router.post('/images', authenticate, upload.array('images', 10), uploadsController.uploadMultipleImages);

/**
 * @swagger
 * /uploads/from-url:
 *   post:
 *     summary: Subir imagen desde URL
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: URL de la imagen
 *               folder:
 *                 type: string
 *                 enum: [products, designs, avatars, orders, general]
 *               publicId:
 *                 type: string
 *               width:
 *                 type: integer
 *               height:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Imagen subida exitosamente
 *       400:
 *         description: Error en la subida
 *       401:
 *         description: No autorizado
 */
router.post('/from-url', authenticate, validate(uploadFromUrlSchema), uploadsController.uploadFromUrl);

/**
 * @swagger
 * /uploads/base64:
 *   post:
 *     summary: Subir imagen en base64
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 description: Imagen en base64
 *               folder:
 *                 type: string
 *                 enum: [products, designs, avatars, orders, general]
 *               publicId:
 *                 type: string
 *               width:
 *                 type: integer
 *               height:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Imagen subida exitosamente
 *       400:
 *         description: Error en la subida
 *       401:
 *         description: No autorizado
 */
router.post('/base64', authenticate, validate(uploadBase64Schema), uploadsController.uploadBase64);

/**
 * @swagger
 * /uploads/optimize:
 *   get:
 *     summary: Obtener URL optimizada de una imagen
 *     tags: [Uploads]
 *     parameters:
 *       - in: query
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: Public ID de la imagen
 *       - in: query
 *         name: width
 *         schema:
 *           type: integer
 *         description: Ancho deseado
 *       - in: query
 *         name: height
 *         schema:
 *           type: integer
 *         description: Alto deseado
 *       - in: query
 *         name: quality
 *         schema:
 *           type: string
 *           enum: [auto, '80', '90', '100']
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [auto, webp, jpg, png]
 *     responses:
 *       200:
 *         description: URL optimizada
 *       400:
 *         description: Parámetros inválidos
 */
router.get('/optimize', uploadsController.getOptimizedUrl);

/**
 * @swagger
 * /uploads/{publicId}:
 *   delete:
 *     summary: Eliminar una imagen
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: Public ID de la imagen (puede incluir carpeta)
 *     responses:
 *       200:
 *         description: Imagen eliminada
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Imagen no encontrada
 */
router.delete('/:publicId(*)', authenticate, requireAdmin, uploadsController.deleteImage);

export default router;
