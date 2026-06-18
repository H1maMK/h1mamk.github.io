import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { buildApiUrl, buildAssetUrl, API_ENDPOINTS } from '../config/api';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import RatingStars from '../components/RatingStars';
import './ProductPage.css';

const getApprovedReviewsFromProduct = (productInfo) => {
  if (!Array.isArray(productInfo?.reviews)) {
    return [];
  }

  return productInfo.reviews
    .filter((review) => review?.status === 'approved')
    .map((review) => ({
      ...review,
      _id: review._id || `${productInfo._id}-${review.createdAt}`,
      user: typeof review.user === 'object' ? review.user : { username: 'Пользователь' }
    }));
};

const getComparableUserId = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    if (typeof value._id === 'string') {
      return value._id;
    }

    if (typeof value.id === 'string') {
      return value.id;
    }

    if (typeof value.toString === 'function') {
      const stringValue = value.toString();
      if (stringValue && stringValue !== '[object Object]') {
        return stringValue;
      }
    }
  }

  return null;
};

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  });
  const [recommendedProducts, setRecommendedProducts] = useState([]);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError('');
      

      const productResponse = await fetch(buildApiUrl(`${API_ENDPOINTS.PRODUCTS}/${id}`));
      const productData = await productResponse.json();
      
      console.log('Product API response:', productData);
      
      if (productData.success && productData.data) {

        const productInfo = productData.data.product || productData.data;
        setProduct(productInfo);

        try {
          const [listResponse, reviewsResponse] = await Promise.all([
            fetch(buildApiUrl(`${API_ENDPOINTS.PRODUCTS}?limit=30`)),
            fetch(buildApiUrl(`${API_ENDPOINTS.PRODUCTS}/${id}/reviews`)),
          ]);

          const [listData, reviewsData] = await Promise.all([
            listResponse.json(),
            reviewsResponse.json(),
          ]);

          if (listData.success && Array.isArray(listData.data)) {
            const currentCategory = productInfo?.category?.name || '';
            const recommended = listData.data
              .filter((item) => item._id !== productInfo._id)
              .sort((a, b) => {
                const aSameCategory = (a?.category?.name || '') === currentCategory ? 1 : 0;
                const bSameCategory = (b?.category?.name || '') === currentCategory ? 1 : 0;
                return bSameCategory - aSameCategory;
              })
              .slice(0, 4);

            setRecommendedProducts(recommended);
          } else {
            setRecommendedProducts([]);
          }
          
          console.log('Reviews API response:', reviewsData);
          
          if (reviewsData.success && reviewsData.data) {
            const loadedReviews = reviewsData.data.reviews || [];
            const fallbackReviews = getApprovedReviewsFromProduct(productInfo);
            const finalReviews = loadedReviews.length > 0 ? loadedReviews : fallbackReviews;
            const fallbackAverageRating = fallbackReviews.length > 0
              ? Math.round((fallbackReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / fallbackReviews.length) * 100) / 100
              : 0;

            setReviews(finalReviews);
            setReviewStats(
              reviewsData.data.stats?.totalReviews > 0
                ? reviewsData.data.stats
                : { averageRating: fallbackAverageRating, totalReviews: fallbackReviews.length }
            );
          } else {
            const fallbackReviews = getApprovedReviewsFromProduct(productInfo);
            const fallbackAverageRating = fallbackReviews.length > 0
              ? Math.round((fallbackReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / fallbackReviews.length) * 100) / 100
              : 0;

            console.warn('No reviews data:', reviewsData);
            setReviews(fallbackReviews);
            setReviewStats({ averageRating: fallbackAverageRating, totalReviews: fallbackReviews.length });
          }

        } catch (reviewError) {
          const fallbackReviews = getApprovedReviewsFromProduct(productInfo);
          const fallbackAverageRating = fallbackReviews.length > 0
            ? Math.round((fallbackReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / fallbackReviews.length) * 100) / 100
            : 0;

          console.error('Error loading reviews:', reviewError);
          setReviews(fallbackReviews);
          setReviewStats({ averageRating: fallbackAverageRating, totalReviews: fallbackReviews.length });
        }
        
      } else {
        setError(productData.error?.message || 'Товар не найден');
      }
    } catch (err) {
      console.error('Error loading product:', err);
      setError('Ошибка загрузки товара');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (index) => {
    setSelectedImage(index);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Войдите, чтобы оставить отзыв');
      return;
    }


    if (user.role === 'admin') {
      toast.error('Администраторы не могут оставлять отзывы');
      return;
    }


    if (!reviewForm.comment.trim()) {
      toast.error('Пожалуйста, введите комментарий');
      return;
    }

    if (reviewForm.comment.trim().length < 10) {
      toast.error('Комментарий должен содержать минимум 10 символов');
      return;
    }

    if (reviewForm.comment.trim().length > 1000) {
      toast.error('Комментарий не должен превышать 1000 символов');
      return;
    }

    try {
      console.log('Отправляем отзыв:', {
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
        productId: id
      });

      const response = await api.post(`/products/${id}/reviews`, {
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim()
      });
      
      console.log('Ответ сервера на отзыв:', response.data);
      
      if (response.data.success) {

        await loadProduct();
        setReviewForm({ rating: 5, comment: '' });

        toast.success('Ваш отзыв отправлен на модерацию и будет опубликован после проверки администратором!');
      } else {

        if (response.data.error?.details) {
          const errorMessages = response.data.error.details.map(d => d.message).join(', ');
          toast.error(`Ошибка: ${errorMessages}`);
        } else {
          toast.error(response.data.error?.message || response.data.message || 'Ошибка при добавлении отзыва');
        }
      }
    } catch (error) {
      console.error('Ошибка добавления отзыва:', error);
      
      if (error.response?.status === 401) {
        toast.error('Не удалось отправить отзыв. Обновите страницу и повторите попытку после входа.');
        return;
      }

      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.error?.details) {
          const errorMessages = errorData.error.details.map(d => d.message).join(', ');
          toast.error(`Ошибка: ${errorMessages}`);
        } else {
          toast.error(errorData.error?.message || errorData.message || 'Ошибка при добавлении отзыва');
        }
      } else {
        toast.error('Ошибка сети. Проверьте подключение к интернету.');
      }
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Вы уверены, что хотите удалить свой отзыв?')) {
      return;
    }

    try {
      const response = await api.delete(`/products/${id}/reviews/${reviewId}`);
      
      if (response.data.success) {
        await loadProduct();
        toast.success('Отзыв удален!');
      } else {
        toast.error(response.data.error?.message || 'Ошибка при удалении отзыва');
      }
    } catch (error) {
      console.error('Ошибка удаления отзыва:', error);

      if (error.response?.status === 401) {
        toast.error('Не удалось удалить отзыв. Обновите страницу и повторите попытку после входа.');
        return;
      }

      toast.error('Ошибка при удалении отзыва');
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (!user) {
      toast.error('Войдите в аккаунт, чтобы добавить товар в корзину');
      navigate('/login');
      return;
    }
    

    if (user.role === 'admin') {
      toast.error('Администраторы не могут добавлять товары в корзину');
      return;
    }

    const result = addToCart(product);

    if (result?.success) {
      toast.success('Товар добавлен в корзину!');
      return;
    }

    if (result?.reason === 'AUTH_REQUIRED') {
      toast.error('Требуется авторизация для добавления товара в корзину');
      navigate('/login');
      return;
    }

    if (result?.reason === 'ADMIN_FORBIDDEN') {
      toast.error('Администраторы не могут добавлять товары в корзину');
      return;
    }

    if (result?.reason === 'INVALID_QUANTITY') {
      toast.error('Количество товара не может быть отрицательным или нулевым');
      return;
    }

    if (result?.reason === 'OUT_OF_STOCK') {
      toast.error('Товара нет на складе');
      return;
    }

    if (result?.reason === 'INSUFFICIENT_STOCK') {
      toast.error(`В корзине уже максимальное доступное количество. На складе: ${result.availableStock} шт.`);
      return;
    }

    toast.error('Не удалось добавить товар в корзину');
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <main>
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!product && error) {
    return (
      <div className="page-wrapper">
        <main>
          <div className="product-page-main-wrapper">
            <div className="product-container">
              <div style={{ width: '100%', textAlign: 'center', padding: '50px' }}>
                <h1>Произошла ошибка</h1>
                <p>{error}</p>
                <Link to="/catalog" className="buy-button" style={{ textDecoration: 'none' }}>
                  Вернуться в каталог
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const rawImages = product?.images && product.images.length > 0 ? product.images : ['/uploads/default-product.jpg'];
  const images = rawImages.map((img) => buildAssetUrl(img));
  const specifications = product?.specifications || {};
  const productRating = reviewStats.averageRating ?? product?.averageRating ?? 0;
  const productReviewCount = reviewStats.totalReviews ?? product?.reviewCount ?? 0;
  const currentUserId = getComparableUserId(user?._id || user?.id || user);

  return (
    <div className="page-wrapper">
      <main>
        <div className="product-page-main-wrapper">
          <div className="product-container">
            <div className="product-gallery">
              <div className="main-product-image-container">
                <img 
                  id="main-product-image-display" 
                  src={images[selectedImage] || images[0]} 
                  alt="Основное изображение товара"
                  fetchPriority="high"
                  decoding="async" 
                />
              </div>
              <div className="thumbnails-container">
                {images.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt="Миниатюра"
                    className={`thumbnail-image ${selectedImage === index ? 'active' : ''}`}
                    loading="lazy"
                    decoding="async"
                    onClick={() => handleImageSelect(index)}
                  />
                ))}
              </div>
            </div>

            <div className="product-info">
              <h1 className="product-title">{product?.name}</h1>
              <RatingStars rating={productRating} reviewCount={productReviewCount} className="product-page-rating" />
              <div className={`product-stock-status ${(product?.stock || 0) > 0 ? 'in-stock' : 'out-of-stock'}`}>
                {(product?.stock || 0) > 0 ? `На складе: ${product.stock} шт.` : 'Нет в наличии'}
              </div>
              <p className="product-price">
                {new Intl.NumberFormat('ru-RU').format(product?.price || 0)}₽
              </p>
              <p className="product-description">{product?.description}</p>
              <div className="product-buttons-row">
                <button className="buy-button" onClick={handleAddToCart} disabled={(product?.stock || 0) <= 0}>
                  {(product?.stock || 0) > 0 ? 'КУПИТЬ' : 'НЕТ В НАЛИЧИИ'}
                </button>
                {user && user.role !== 'admin' && (
                  <button 
                    className={`favorite-button-page ${isFavorite(product?._id) ? 'active' : ''}`}
                    onClick={() => toggleFavorite(product?._id)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill={isFavorite(product?._id) ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="details-section">
            <h2 className="section-title">Характеристики</h2>
            {Object.keys(specifications).length > 0 ? (
              <table className="properties-table">
                <tbody>
                  {Object.entries(specifications).map(([section, values]) => (
                    <React.Fragment key={section}>
                      <tr>
                        <th colSpan="2" className="section-header">{section}</th>
                      </tr>
                      {typeof values === 'object' && values !== null ? (
                        Object.entries(values).map(([key, value]) => (
                          <tr key={key}>
                            <td>{key}</td>
                            <td>{value}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="2">{values}</td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="properties-list">
                Характеристики не указаны
              </div>
            )}
          </div>

          <div className="reviews-section" id="reviews">
            <h2 className="section-title">Отзывы</h2>
            
            <h3>Оставить отзыв</h3>
            {user && user.role !== 'admin' ? (
              <form onSubmit={handleReviewSubmit} className="review-form">
                <div className="form-group">
                  <label htmlFor="rating">Оценка:</label>
                  <select
                    id="rating"
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                    required
                  >
                    <option value="5">5 ★★★★★</option>
                    <option value="4">4 ★★★★☆</option>
                    <option value="3">3 ★★★☆☆</option>
                    <option value="2">2 ★★☆☆☆</option>
                    <option value="1">1 ★☆☆☆☆</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="comment">Комментарий:</label>
                  <textarea
                    id="comment"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                    rows="4"
                    maxLength={1000}
                    placeholder="Поделитесь своим мнением о товаре (минимум 10 символов)"
                    required
                  />
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: reviewForm.comment.length < 10 ? '#ffa500' : reviewForm.comment.length > 1000 ? '#ff6b6b' : '#888',
                    marginTop: '5px',
                    textAlign: 'right'
                  }}>
                    {reviewForm.comment.length}/1000 символов
                    {reviewForm.comment.length < 10 && reviewForm.comment.length > 0 && (
                      <span style={{ color: '#ffa500', marginLeft: '10px' }}>
                        (минимум 10)
                      </span>
                    )}
                  </div>
                </div>
                <button type="submit" className="ready-reviews-btn">
                  Оставить отзыв
                </button>
              </form>
            ) : user && user.role === 'admin' ? (
              <div style={{ marginBottom: '20px', color: '#FFE6BB' }}>
                Администраторы не могут оставлять отзывы.
              </div>
            ) : (
              <div style={{ marginBottom: '20px', color: '#FFE6BB' }}>
                <Link to="/login">Войдите</Link>, чтобы оставить отзыв.
              </div>
            )}

            <h3 className="reviews-peoples-text">Все отзывы ({reviews.length})</h3>
            <div className="reviews-container">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review._id} className="reviews-peoples">
                    <RatingStars rating={review.rating} reviewCount={0} className="review-item-rating" showCount={false} />
                    <p className="user-name">{review.user?.username || 'Аноним'}</p>
                    <p className="comment">{review.comment}</p>
                    {(() => {
                      const reviewAuthorId = getComparableUserId(review.user?._id || review.user?.id || review.user);
                      return Boolean(currentUserId && reviewAuthorId && reviewAuthorId === currentUserId);
                    })() && (
                       <button 
                         onClick={() => handleDeleteReview(review._id)}
                         style={{
                          background: '#ff4444',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          marginTop: '10px'
                        }}
                      >
                        Удалить отзыв
                      </button>
                    )}

                  </div>
                ))
              ) : (
                <p>Отзывов пока нет. Будьте первым!</p>
              )}
            </div>
          </div>

          {recommendedProducts.length > 0 && (
            <div className="details-section recommended-products-section">
              <h2 className="section-title">Рекомендуемые товары</h2>
              <div className="recommended-products-row" style={{ marginTop: 20 }}>
                {recommendedProducts.map((item) => (
                  <ProductCard key={item._id} product={item} variant="home" />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProductPage;
