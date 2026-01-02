// Tipos para el sistema de reviews

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Review {
  id: number;
  userId: number;
  productId: number;
  rating: number;
  title: string | null;
  comment: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    name: string;
    avatar: string | null;
  };
  userVote?: boolean | null; // null = no votó, true = útil, false = no útil
  // Incluido cuando se obtienen reviews del usuario
  product?: {
    id: number;
    name: string;
    image: string | null;
  };
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
  data: Review[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: ReviewSummary;
}

export interface CreateReviewInput {
  productId: number;
  rating: number;
  title?: string;
  comment: string;
}

export interface UpdateReviewInput {
  rating?: number;
  title?: string | null;
  comment?: string;
}

export interface CanReviewResponse {
  canReview: boolean;
  reason?: string;
  existingReview?: Review | null;
}

export interface ProductAwaitingReview {
  productId: number;
  productName: string;
  productImage: string;
  orderId: number;
  orderNumber: string;
  purchaseDate: string;
}

export interface ListReviewsParams {
  page?: number;
  limit?: number;
  rating?: number;
  sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful';
}
