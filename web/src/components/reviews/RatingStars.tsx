import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

export const RatingStars = ({
  rating,
  maxRating = 5,
  size = 'md',
  showValue = false,
  interactive = false,
  onChange,
  className = '',
}: RatingStarsProps) => {
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const handleClick = (index: number) => {
    if (interactive && onChange) {
      onChange(index + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (interactive && onChange && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onChange(index + 1);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex gap-0.5">
        {Array.from({ length: maxRating }).map((_, index) => {
          const isFilled = index < Math.floor(rating);
          const isHalf = index === Math.floor(rating) && rating % 1 >= 0.5;

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleClick(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              disabled={!interactive}
              className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} focus:outline-none`}
              aria-label={`${index + 1} de ${maxRating} estrellas`}
            >
              <Star
                className={`${sizeClasses[size]} ${
                  isFilled || isHalf
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-200'
                }`}
              />
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className={`${textSizeClasses[size]} text-gray-600 font-medium ml-1`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default RatingStars;
