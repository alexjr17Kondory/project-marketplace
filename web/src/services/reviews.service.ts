import api from './api.service';
import type {
  Review,
  ReviewSummary,
  PaginatedReviews,
  CreateReviewInput,
  UpdateReviewInput,
  CanReviewResponse,
  ProductAwaitingReview,
  ListReviewsParams,
} from '../types/review';

// Listar reviews de un producto
export async function getProductReviews(
  productId: number,
  params?: ListReviewsParams
): Promise<PaginatedReviews> {
  const response = await api.get(`/reviews/product/${productId}`, params as Record<string, any>);
  // La API devuelve { success, data, meta, summary } - extraemos lo necesario
  const apiResponse = response as unknown as { data: Review[]; meta: PaginatedReviews['meta']; summary: ReviewSummary };
  return {
    data: apiResponse.data || [],
    meta: apiResponse.meta || { total: 0, page: 1, limit: 10, totalPages: 0 },
    summary: apiResponse.summary || { averageRating: 0, totalReviews: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
  };
}

// Obtener resumen de reviews de un producto
export async function getProductReviewSummary(productId: number): Promise<ReviewSummary> {
  const response = await api.get(`/reviews/product/${productId}/summary`);
  return (response as any).data || { averageRating: 0, totalReviews: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
}

// Obtener review por ID
export async function getReviewById(id: number): Promise<Review> {
  const response = await api.get(`/reviews/${id}`);
  return (response as any).data;
}

// Verificar si el usuario puede dejar review
export async function canUserReview(productId: number): Promise<CanReviewResponse> {
  const response = await api.get(`/reviews/can-review/${productId}`);
  return (response as any).data || { canReview: false, reason: 'Error verificando permisos' };
}

// Obtener productos pendientes de review
export async function getProductsAwaitingReview(): Promise<ProductAwaitingReview[]> {
  const response = await api.get('/reviews/pending/products');
  return (response as any).data || [];
}

// Obtener mis reviews
export async function getMyReviews(page: number = 1, limit: number = 10): Promise<{
  data: Review[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}> {
  const response = await api.get('/reviews/my/all', { page, limit });
  return {
    data: (response as any).data || [],
    meta: (response as any).meta || { total: 0, page: 1, limit: 10, totalPages: 0 },
  };
}

// Crear review
export async function createReview(data: CreateReviewInput): Promise<Review> {
  const response = await api.post('/reviews', data);
  return (response as any).data;
}

// Actualizar mi review
export async function updateReview(id: number, data: UpdateReviewInput): Promise<Review> {
  const response = await api.put(`/reviews/${id}`, data);
  return (response as any).data;
}

// Eliminar mi review
export async function deleteReview(id: number): Promise<void> {
  await api.delete(`/reviews/${id}`);
}

// Votar útil/no útil
export async function voteHelpful(reviewId: number, isHelpful: boolean): Promise<{ helpfulCount: number }> {
  const response = await api.post(`/reviews/${reviewId}/vote`, { isHelpful });
  return (response as any).data || { helpfulCount: 0 };
}

// Eliminar voto
export async function removeVote(reviewId: number): Promise<{ helpfulCount: number }> {
  const response = await api.delete(`/reviews/${reviewId}/vote`);
  return (response as any).data || { helpfulCount: 0 };
}

export default {
  getProductReviews,
  getProductReviewSummary,
  getReviewById,
  canUserReview,
  getProductsAwaitingReview,
  getMyReviews,
  createReview,
  updateReview,
  deleteReview,
  voteHelpful,
  removeVote,
};
