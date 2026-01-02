import { Request, Response, NextFunction } from 'express';
import * as reviewsService from '../services/reviews.service';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';

// ==================== RUTAS PÚBLICAS ====================

// Listar reviews de un producto
export async function getProductReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const productId = Number(req.params.productId);
    const currentUserId = (req as AuthenticatedRequest).user?.userId;

    const result = await reviewsService.listProductReviews(productId, req.query as any, currentUserId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener resumen de reviews de un producto
export async function getProductReviewSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const productId = Number(req.params.productId);
    const summary = await reviewsService.getProductReviewSummary(productId);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener review por ID
export async function getReviewById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const currentUserId = (req as AuthenticatedRequest).user?.userId;

    const review = await reviewsService.getReviewById(id, currentUserId);

    res.json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
}

// ==================== RUTAS DE USUARIO AUTENTICADO ====================

// Verificar si puede dejar review
export async function canReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const productId = Number(req.params.productId);
    const result = await reviewsService.canUserReview(req.user!.userId, productId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener productos pendientes de review
export async function getProductsAwaitingReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const products = await reviewsService.getProductsAwaitingReview(req.user!.userId);

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
}

// Crear review
export async function createReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const review = await reviewsService.createReview(req.user!.userId, req.body);

    res.status(201).json({
      success: true,
      message: 'Reseña publicada exitosamente',
      data: review,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener mis reviews
export async function getMyReviews(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await reviewsService.getMyReviews(req.user!.userId, page, limit);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

// Actualizar mi review
export async function updateReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const review = await reviewsService.updateReview(req.user!.userId, id, req.body);

    res.json({
      success: true,
      message: 'Reseña actualizada exitosamente',
      data: review,
    });
  } catch (error) {
    next(error);
  }
}

// Eliminar mi review
export async function deleteReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    await reviewsService.deleteReview(req.user!.userId, id);

    res.json({
      success: true,
      message: 'Reseña eliminada exitosamente',
    });
  } catch (error) {
    next(error);
  }
}

// Votar útil/no útil
export async function voteHelpful(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await reviewsService.voteHelpful(req.user!.userId, id, req.body);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// Eliminar voto
export async function removeVote(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await reviewsService.removeVote(req.user!.userId, id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// ==================== RUTAS DE ADMIN ====================

// Listar todas las reviews
export async function adminListReviews(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await reviewsService.listAllReviews(req.query as any);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

// Moderar review
export async function moderateReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const review = await reviewsService.moderateReview(id, req.body);

    res.json({
      success: true,
      message: 'Review moderada exitosamente',
      data: review,
    });
  } catch (error) {
    next(error);
  }
}

// Eliminar review (admin)
export async function adminDeleteReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    await reviewsService.adminDeleteReview(id);

    res.json({
      success: true,
      message: 'Review eliminada exitosamente',
    });
  } catch (error) {
    next(error);
  }
}
