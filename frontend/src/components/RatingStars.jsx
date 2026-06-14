import React from 'react';

const clampRating = (value) => {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.min(5, Math.max(0, numeric));
};

const RatingStars = ({ rating = 0, reviewCount = 0, className = '', showCount = true }) => {
  const normalizedRating = clampRating(rating);
  const roundedRating = Math.round(normalizedRating);
  const formattedRating = Number.isInteger(normalizedRating)
    ? String(normalizedRating)
    : String(Math.round(normalizedRating * 100) / 100);
  const totalReviews = Number.isFinite(Number(reviewCount)) ? Number(reviewCount) : 0;

  return (
    <div
      className={`rating-stars ${className}`.trim()}
      aria-label={`Рейтинг ${formattedRating} из 5`}
      title={`Рейтинг ${formattedRating}/5`}
    >
      <span className="rating-stars-icons" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= roundedRating ? 'rating-star filled' : 'rating-star'}>
            ★
          </span>
        ))}
      </span>
      <span className="rating-stars-value">{formattedRating}/5</span>
      {showCount && (
        <span className="rating-stars-count">
          {totalReviews > 0 ? `${totalReviews} отзыв${totalReviews === 1 ? '' : totalReviews < 5 ? 'а' : 'ов'}` : 'нет отзывов'}
        </span>
      )}
    </div>
  );
};

export default RatingStars;
