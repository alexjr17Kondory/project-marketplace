import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as templateRecipesController from '../controllers/template-recipes.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// POST /api/template-recipes - Crear/actualizar receta
router.post('/', templateRecipesController.createTemplateRecipe);

// GET /api/template-recipes/variant/:variantId - Obtener receta de variante
router.get('/variant/:variantId', templateRecipesController.getTemplateRecipe);

// GET /api/template-recipes/product/:productId - Obtener recetas de un template
router.get('/product/:productId', templateRecipesController.getTemplateRecipesByProduct);

// GET /api/template-recipes/product/:productId/stock - Obtener stock disponible
router.get('/product/:productId/stock', templateRecipesController.getAvailableStock);

// GET /api/template-recipes/variant-stock/:productId - Obtener stock de variante específica por color/talla
router.get('/variant-stock/:productId', templateRecipesController.getVariantStock);

// GET /api/template-recipes/product/:productId/inputs - Obtener IDs de insumos asociados
router.get('/product/:productId/inputs', templateRecipesController.getAssociatedInputIds);

// POST /api/template-recipes/product/:productId/associate - Asociar insumos al template
router.post('/product/:productId/associate', templateRecipesController.associateInputsToTemplate);

// DELETE /api/template-recipes/variant/:variantId/input/:inputVariantId - Eliminar receta específica
router.delete('/variant/:variantId/input/:inputVariantId', templateRecipesController.deleteSpecificTemplateRecipe);

// DELETE /api/template-recipes/variant/:variantId - Eliminar todas las recetas de una variante
router.delete('/variant/:variantId', templateRecipesController.deleteTemplateRecipe);

export default router;
