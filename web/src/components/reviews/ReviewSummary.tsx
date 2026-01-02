import { Star } from 'lucide-react';
import type { ReviewSummary as ReviewSummaryType } from '../../types/review';

interface ReviewSummaryProps {
  summary: ReviewSummaryType;
  className?: string;
}

export const ReviewSummary = ({ summary, className = '' }: ReviewSummaryProps) => {
  const { averageRating, totalReviews, ratingDistribution } = summary;

  // Calcular porcentajes
  const getPercentage = (count: number) => {
    if (totalReviews === 0) return 0;
    return Math.round((count / totalReviews) * 100);
  };

  return (
    <div className={`bg-gray-50 rounded-xl p-5 ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        {/* Rating grande */}
        <div className="text-center md:text-left md:min-w-[140px]">
          <div className="text-5xl font-bold text-gray-900 mb-1">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex justify-center md:justify-start gap-0.5 mb-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(averageRating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500">{totalReviews} reseñas</p>
        </div>

        {/* Barras de distribución */}
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = ratingDistribution[rating as keyof typeof ratingDistribution];
            const percentage = getPercentage(count);

            return (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-12 text-sm text-gray-600">
                  <span>{rating}</span>
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                </div>
                <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-10 text-right text-sm text-gray-500">
                  {percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReviewSummary;
