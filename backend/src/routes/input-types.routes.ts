import { Router } from 'express';
import * as inputTypesController from '../controllers/input-types.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: InputTypes
 *   description: Gestión de tipos de insumo (telas, hilos, botones, etc.)
 */

// Todas las rutas requieren autenticación de admin
router.use(authenticate, requireAdmin);

/**
 * @swagger
 * /input-types:
 *   get:
 *     summary: Listar tipos de insumo (solo admin)
 *     tags: [InputTypes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tipos de insumo
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere admin)
 *   post:
 *     summary: Crear tipo de insumo (solo admin)
 *     tags: [InputTypes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Tipo creado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere admin)
 * /input-types/{id}:
 *   get:
 *     summary: Obtener tipo por ID (solo admin)
 *     tags: [InputTypes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tipo encontrado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere admin)
 *   put:
 *     summary: Actualizar tipo (solo admin)
 *     tags: [InputTypes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tipo actualizado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere admin)
 *   delete:
 *     summary: Eliminar tipo (solo admin)
 *     tags: [InputTypes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tipo eliminado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (requiere admin)
 */
router.get('/', inputTypesController.getAllInputTypes);
router.get('/:id', inputTypesController.getInputTypeById);
router.post('/', inputTypesController.createInputType);
router.put('/:id', inputTypesController.updateInputType);
router.delete('/:id', inputTypesController.deleteInputType);

export default router;
