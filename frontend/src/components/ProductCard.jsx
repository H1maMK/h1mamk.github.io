import React from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../contexts/FavoritesContext';
import { useAuth } from '../contexts/AuthContext';
import { buildAssetUrl } from '../config/api';
import RatingStars from './RatingStars';

const ProductCard = ({ product }) => {
  const { user } = useAuth();
  const { toggleFavorite, isFavorite, adminFavoritesMessage } = useFavorites();

  const handleToggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (user && user.role === 'admin') {
      alert(adminFavoritesMessage);
      return;
    }

    toggleFavorite(product._id);
  };

  const rawImage = product.images?.[0] || '/placeholder-product.jpg';
  const productImage = buildAssetUrl(rawImage);
  const productPrice = new Intl.NumberFormat('ru-RU').format(product.price);
  const isInFavorites = isFavorite(product._id);
  const rating = product.averageRating ?? product.avgRating ?? product.rating ?? 0;
  const reviewCount = product.reviewCount ?? product.totalReviews ?? product.reviewsCount ?? 0;
  const isInStock = (product.stock || 0) > 0;

  return (
    <div className="product-card" data-price={product.price}>
      <div className="product-image-container">
        <Link to={`/product/${product._id}`} className="product-image-link">
          <img src={productImage} alt={product.name} />
        </Link>
      </div>

      <div className="product-info-container">
        <h3>
          <Link to={`/product/${product._id}`}>{product.name}</Link>
        </h3>
        <div className="product-details">
          <div className="product-category-tag">
            {product.category?.name || 'Без категории'}
          </div>
        </div>
        <RatingStars rating={rating} reviewCount={reviewCount} className="product-card-rating" />
        <div className={`product-card-stock ${isInStock ? 'in-stock' : 'out-of-stock'}`}>
          {isInStock ? 'Есть в наличии' : 'Нет в наличии'}
        </div>
      </div>

      <div className="product-purchase-container">
        <div className="price-row">
          <div className="price-compact">{productPrice} ₽</div>
          <button 
            className={`favorite-button ${isInFavorites ? 'active' : ''}`}
            onClick={handleToggleFavorite}
            data-id={product._id}
            data-name={product.name}
            data-price={product.price}
            data-image={productImage}
            data-category={product.category?.name || ''}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill={isInFavorites ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
