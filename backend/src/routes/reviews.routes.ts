import { Router } from 'express';
import * as reviewsController from '../controllers/reviews.controller';
import { validate, validateQuery, validateParams } from '../middleware/validate.middleware';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth.middleware';
import {
  createReviewSchema,
  updateReviewSchema,
  listReviewsQuerySchema,
  listAdminReviewsQuerySchema,
  voteHelpfulSchema,
  moderateReviewSchema,
  reviewIdSchema,
  productIdSchema,
} from '../validators/reviews.validator';

const router = Router();

// ==================== RUTAS PÚBLICAS ====================

// Listar reviews de un producto (con autenticación opcional para saber si votó)
router.get(
  '/product/:productId',
  optionalAuth,
  validateParams(productIdSchema),
  validateQuery(listReviewsQuerySchema),
  reviewsController.getProductReviews
);

// Obtener resumen de reviews de un producto
router.get(
  '/product/:productId/summary',
  validateParams(productIdSchema),
  reviewsController.getProductReviewSummary
);

// Obtener review por ID
router.get(
  '/:id',
  optionalAuth,
  validateParams(reviewIdSchema),
  reviewsController.getReviewById
);

// ==================== RUTAS DE USUARIO AUTENTICADO ====================

// Verificar si puede dejar review
router.get(
  '/can-review/:productId',
  authenticate,
  validateParams(productIdSchema),
  reviewsController.canReview
);

// Obtener productos pendientes de review
router.get(
  '/pending/products',
  authenticate,
  reviewsController.getProductsAwaitingReview
);

// Obtener mis reviews
router.get(
  '/my/all',
  authenticate,
  reviewsController.getMyReviews
);

// Crear review
router.post(
  '/',
  authenticate,
  validate(createReviewSchema),
  reviewsController.createReview
);

// Actualizar mi review
router.put(
  '/:id',
  authenticate,
  validateParams(reviewIdSchema),
  validate(updateReviewSchema),
  reviewsController.updateReview
);

// Eliminar mi review
router.delete(
  '/:id',
  authenticate,
  validateParams(reviewIdSchema),
  reviewsController.deleteReview
);

// Votar útil/no útil
router.post(
  '/:id/vote',
  authenticate,
  validateParams(reviewIdSchema),
  validate(voteHelpfulSchema),
  reviewsController.voteHelpful
);

// Eliminar voto
router.delete(
  '/:id/vote',
  authenticate,
  validateParams(reviewIdSchema),
  reviewsController.removeVote
);

// ==================== RUTAS DE ADMIN ====================

// Listar todas las reviews
router.get(
  '/admin/all',
  authenticate,
  requireAdmin,
  validateQuery(listAdminReviewsQuerySchema),
  reviewsController.adminListReviews
);

// Moderar review
router.patch(
  '/admin/:id/moderate',
  authenticate,
  requireAdmin,
  validateParams(reviewIdSchema),
  validate(moderateReviewSchema),
  reviewsController.moderateReview
);

// Eliminar review (admin)
router.delete(
  '/admin/:id',
  authenticate,
  requireAdmin,
  validateParams(reviewIdSchema),
  reviewsController.adminDeleteReview
);

export default router;
