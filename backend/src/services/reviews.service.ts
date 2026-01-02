import { Prisma, ReviewStatus, OrderStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import type {
  CreateReviewInput,
  UpdateReviewInput,
  ListReviewsQuery,
  ListAdminReviewsQuery,
  VoteHelpfulInput,
  ModerateReviewInput,
} from '../validators/reviews.validator';

// Tipos de respuesta
export interface ReviewResponse {
  id: number;
  userId: number;
  productId: number;
  rating: number;
  title: string | null;
  comment: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
  status: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: number;
    name: string;
    avatar: string | null;
  };
  userVote?: boolean | null; // null = no votó, true = útil, false = no útil
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface PaginatedReviews {
  data: ReviewResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: ReviewSummary;
}

// Verificar si el usuario compró el producto
export async function checkUserPurchased(userId: number, productId: number): Promise<boolean> {
  // Buscar en OrderItems de órdenes pagadas/entregadas del usuario
  const orderItem = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: {
        userId,
        status: {
          in: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
        },
      },
    },
  });

  return !!orderItem;
}

// Obtener productos compradores por el usuario que aún no tienen review
export async function getProductsAwaitingReview(userId: number): Promise<{
  productId: number;
  productName: string;
  productImage: string;
  orderId: number;
  orderNumber: string;
  purchaseDate: Date;
}[]> {
  // Obtener todos los productos de órdenes pagadas/entregadas
  const purchasedProducts = await prisma.orderItem.findMany({
    where: {
      order: {
        userId,
        status: {
          in: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
        },
      },
    },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          paidAt: true,
          createdAt: true,
        },
      },
    },
    distinct: ['productId'],
  });

  // Obtener reviews existentes del usuario
  const existingReviews = await prisma.review.findMany({
    where: { userId },
    select: { productId: true },
  });

  const reviewedProductIds = new Set(existingReviews.map(r => r.productId));

  // Filtrar productos sin review
  return purchasedProducts
    .filter(item => !reviewedProductIds.has(item.productId))
    .map(item => ({
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage,
      orderId: item.order.id,
      orderNumber: item.order.orderNumber,
      purchaseDate: item.order.paidAt || item.order.createdAt,
    }));
}

// Verificar si el usuario puede dejar review de un producto específico
export async function canUserReview(userId: number, productId: number): Promise<{
  canReview: boolean;
  reason?: string;
  existingReview?: ReviewResponse | null;
}> {
  // Verificar si ya tiene review
  const existingReview = await prisma.review.findUnique({
    where: {
      userId_productId: { userId, productId },
    },
    include: {
      user: {
        select: { id: true, name: true, avatar: true },
      },
    },
  });

  if (existingReview) {
    return {
      canReview: false,
      reason: 'Ya has dejado una reseña para este producto',
      existingReview: formatReviewResponse(existingReview),
    };
  }

  // Verificar si compró el producto
  const purchased = await checkUserPurchased(userId, productId);

  if (!purchased) {
    return {
      canReview: false,
      reason: 'Debes comprar este producto para poder dejar una reseña',
    };
  }

  return { canReview: true };
}

function formatReviewResponse(review: any, currentUserId?: number): ReviewResponse {
  const userVote = currentUserId && review.helpfulVotes
    ? review.helpfulVotes.find((v: any) => v.userId === currentUserId)?.isHelpful ?? null
    : null;

  return {
    id: review.id,
    userId: review.userId,
    productId: review.productId,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    verifiedPurchase: review.verifiedPurchase,
    helpfulCount: review.helpfulCount,
    status: review.status,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    user: {
      id: review.user.id,
      name: review.user.name,
      avatar: review.user.avatar,
    },
    userVote,
  };
}

// Calcular resumen de reviews de un producto
async function calculateReviewSummary(productId: number): Promise<ReviewSummary> {
  const reviews = await prisma.review.findMany({
    where: {
      productId,
      status: ReviewStatus.APPROVED,
    },
    select: { rating: true },
  });

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;

  for (const review of reviews) {
    distribution[review.rating as keyof typeof distribution]++;
    totalRating += review.rating;
  }

  return {
    averageRating: reviews.length > 0 ? Math.round((totalRating / reviews.length) * 10) / 10 : 0,
    totalReviews: reviews.length,
    ratingDistribution: distribution,
  };
}

// Recalcular y actualizar rating del producto
async function updateProductRating(productId: number): Promise<void> {
  const summary = await calculateReviewSummary(productId);

  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: summary.averageRating,
      reviewsCount: summary.totalReviews,
    },
  });
}

// ========== CRUD de Reviews ==========

// Listar reviews de un producto (público)
export async function listProductReviews(
  productId: number,
  query: ListReviewsQuery,
  currentUserId?: number
): Promise<PaginatedReviews> {
  const { page, limit, rating, sortBy } = query;
  const skip = (page - 1) * limit;

  // Verificar que el producto existe
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new NotFoundError('Producto no encontrado');
  }

  // Construir filtros
  const where: Prisma.ReviewWhereInput = {
    productId,
    status: ReviewStatus.APPROVED,
    ...(rating && { rating }),
  };

  // Ordenamiento
  let orderBy: Prisma.ReviewOrderByWithRelationInput;
  switch (sortBy) {
    case 'oldest':
      orderBy = { createdAt: 'asc' };
      break;
    case 'highest':
      orderBy = { rating: 'desc' };
      break;
    case 'lowest':
      orderBy = { rating: 'asc' };
      break;
    case 'helpful':
      orderBy = { helpfulCount: 'desc' };
      break;
    case 'newest':
    default:
      orderBy = { createdAt: 'desc' };
  }

  // Ejecutar consultas
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
        helpfulVotes: currentUserId ? {
          where: { userId: currentUserId },
          select: { isHelpful: true, userId: true },
        } : false,
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.review.count({ where }),
  ]);

  const summary = await calculateReviewSummary(productId);

  return {
    data: reviews.map(r => formatReviewResponse(r, currentUserId)),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    summary,
  };
}

// Obtener resumen de reviews de un producto
export async function getProductReviewSummary(productId: number): Promise<ReviewSummary> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new NotFoundError('Producto no encontrado');
  }

  return calculateReviewSummary(productId);
}

// Crear review
export async function createReview(
  userId: number,
  data: CreateReviewInput
): Promise<ReviewResponse> {
  const { productId, rating, title, comment } = data;

  // Verificar si puede dejar review
  const canReview = await canUserReview(userId, productId);
  if (!canReview.canReview) {
    throw new BadRequestError(canReview.reason || 'No puedes dejar una reseña');
  }

  // Crear review
  const review = await prisma.review.create({
    data: {
      userId,
      productId,
      rating,
      title: title || null,
      comment,
      verifiedPurchase: true, // Siempre es verificada porque ya validamos la compra
      status: ReviewStatus.APPROVED, // Se publica automáticamente
    },
    include: {
      user: {
        select: { id: true, name: true, avatar: true },
      },
    },
  });

  // Actualizar rating del producto
  await updateProductRating(productId);

  return formatReviewResponse(review);
}

// Obtener review por ID
export async function getReviewById(
  id: number,
  currentUserId?: number
): Promise<ReviewResponse> {
  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, avatar: true },
      },
      helpfulVotes: currentUserId ? {
        where: { userId: currentUserId },
        select: { isHelpful: true, userId: true },
      } : false,
    },
  });

  if (!review) {
    throw new NotFoundError('Review no encontrada');
  }

  return formatReviewResponse(review, currentUserId);
}

// Actualizar mi review
export async function updateReview(
  userId: number,
  reviewId: number,
  data: UpdateReviewInput
): Promise<ReviewResponse> {
  // Verificar que la review existe y pertenece al usuario
  const existing = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!existing) {
    throw new NotFoundError('Review no encontrada');
  }

  if (existing.userId !== userId) {
    throw new ForbiddenError('No puedes editar esta reseña');
  }

  // Actualizar
  const review = await prisma.review.update({
    where: { id: reviewId },
    data: {
      ...(data.rating !== undefined && { rating: data.rating }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.comment !== undefined && { comment: data.comment }),
    },
    include: {
      user: {
        select: { id: true, name: true, avatar: true },
      },
    },
  });

  // Recalcular rating del producto
  await updateProductRating(existing.productId);

  return formatReviewResponse(review);
}

// Eliminar mi review
export async function deleteReview(userId: number, reviewId: number): Promise<void> {
  const existing = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!existing) {
    throw new NotFoundError('Review no encontrada');
  }

  if (existing.userId !== userId) {
    throw new ForbiddenError('No puedes eliminar esta reseña');
  }

  await prisma.review.delete({ where: { id: reviewId } });

  // Recalcular rating del producto
  await updateProductRating(existing.productId);
}

// Obtener mis reviews
export async function getMyReviews(
  userId: number,
  page: number = 1,
  limit: number = 10
): Promise<{
  data: ReviewResponse[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}> {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { userId },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
        product: {
          select: { id: true, name: true, images: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.review.count({ where: { userId } }),
  ]);

  return {
    data: reviews.map(r => ({
      ...formatReviewResponse(r),
      product: {
        id: (r as any).product.id,
        name: (r as any).product.name,
        image: Array.isArray((r as any).product.images) ? (r as any).product.images[0] : null,
      },
    })),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ========== Votos de Utilidad ==========

export async function voteHelpful(
  userId: number,
  reviewId: number,
  data: VoteHelpfulInput
): Promise<{ helpfulCount: number }> {
  // Verificar que la review existe
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) {
    throw new NotFoundError('Review no encontrada');
  }

  // No puedes votar tu propia review
  if (review.userId === userId) {
    throw new BadRequestError('No puedes votar tu propia reseña');
  }

  // Upsert del voto
  await prisma.reviewHelpfulVote.upsert({
    where: {
      reviewId_userId: { reviewId, userId },
    },
    create: {
      reviewId,
      userId,
      isHelpful: data.isHelpful,
    },
    update: {
      isHelpful: data.isHelpful,
    },
  });

  // Recalcular helpfulCount
  const helpfulCount = await prisma.reviewHelpfulVote.count({
    where: { reviewId, isHelpful: true },
  });

  await prisma.review.update({
    where: { id: reviewId },
    data: { helpfulCount },
  });

  return { helpfulCount };
}

// Eliminar voto
export async function removeVote(userId: number, reviewId: number): Promise<{ helpfulCount: number }> {
  await prisma.reviewHelpfulVote.deleteMany({
    where: { reviewId, userId },
  });

  // Recalcular helpfulCount
  const helpfulCount = await prisma.reviewHelpfulVote.count({
    where: { reviewId, isHelpful: true },
  });

  await prisma.review.update({
    where: { id: reviewId },
    data: { helpfulCount },
  });

  return { helpfulCount };
}

// ========== Admin ==========

// Listar todas las reviews (admin)
export async function listAllReviews(
  query: ListAdminReviewsQuery
): Promise<{
  data: (ReviewResponse & { product: { id: number; name: string } })[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}> {
  const { page, limit, status, productId, userId, rating, sortBy } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.ReviewWhereInput = {
    ...(status && { status }),
    ...(productId && { productId }),
    ...(userId && { userId }),
    ...(rating && { rating }),
  };

  let orderBy: Prisma.ReviewOrderByWithRelationInput;
  switch (sortBy) {
    case 'oldest':
      orderBy = { createdAt: 'asc' };
      break;
    case 'highest':
      orderBy = { rating: 'desc' };
      break;
    case 'lowest':
      orderBy = { rating: 'asc' };
      break;
    case 'helpful':
      orderBy = { helpfulCount: 'desc' };
      break;
    case 'newest':
    default:
      orderBy = { createdAt: 'desc' };
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
        product: {
          select: { id: true, name: true },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.review.count({ where }),
  ]);

  return {
    data: reviews.map(r => ({
      ...formatReviewResponse(r),
      product: {
        id: (r as any).product.id,
        name: (r as any).product.name,
      },
    })),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Moderar review (admin)
export async function moderateReview(
  reviewId: number,
  data: ModerateReviewInput
): Promise<ReviewResponse> {
  const existing = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!existing) {
    throw new NotFoundError('Review no encontrada');
  }

  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { status: data.status },
    include: {
      user: {
        select: { id: true, name: true, avatar: true },
      },
    },
  });

  // Recalcular rating del producto
  await updateProductRating(existing.productId);

  return formatReviewResponse(review);
}

// Eliminar review (admin)
export async function adminDeleteReview(reviewId: number): Promise<void> {
  const existing = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!existing) {
    throw new NotFoundError('Review no encontrada');
  }

  await prisma.review.delete({ where: { id: reviewId } });

  // Recalcular rating del producto
  await updateProductRating(existing.productId);
}
