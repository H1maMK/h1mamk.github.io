import React, { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { getImageProps } from '../utils/imageUtils';
import RatingStars from '../components/RatingStars';
import './Favorites.css';

const Favorites = () => {
  const { user, loading: authLoading } = useAuth();
  const { items, addToCart, updateQuantity, removeFromCart } = useCart();
  const { favorites, loading, removeFromFavorites, loadFavorites } = useFavorites();

  useEffect(() => {
    if (!user) {
      return;
    }

    if (user.role === 'admin') {
      return;
    }

    loadFavorites();
  }, [user]);

  if (authLoading) {
    return (
      <div className="page-wrapper">
        <main>
          <div className="favorites-container">
            <div className="loading">Загрузка...</div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/profile" replace />;
  }

  const handleRemoveFromFavorites = async (productId) => {
    const success = await removeFromFavorites(productId);
    if (success) {
      // Контекст уже обновил список
    }
  };

  const getStockCount = (product) => {
    const stock = Number(product?.stock);
    return Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : 0;
  };

  const getCartQuantity = (productId) => {
    const cartItem = items.find((item) => (item.id || item._id) === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  const showCartResultError = (result) => {
    if (result?.reason === 'AUTH_REQUIRED') {
      toast.error('Требуется авторизация для добавления товара в корзину');
      return true;
    }

    if (result?.reason === 'ADMIN_FORBIDDEN') {
      toast.error('Администраторы не могут добавлять товары в корзину');
      return true;
    }

    if (result?.reason === 'INVALID_QUANTITY') {
      toast.error('Количество товара не может быть отрицательным или нулевым');
      return true;
    }

    if (result?.reason === 'OUT_OF_STOCK') {
      toast.error('Товара нет на складе');
      return true;
    }

    if (result?.reason === 'INSUFFICIENT_STOCK') {
      toast.error(`На складе доступно только ${result.availableStock} шт.`);
      return true;
    }

    return false;
  };

  const handleAddToCart = (product) => {
    const result = addToCart(product);

    if (result?.success) {
      toast.success('Товар добавлен в корзину!');
      return;
    }

    if (showCartResultError(result)) {
      return;
    }

    toast.error('Не удалось добавить товар в корзину');
  };

  const handleCartQuantityChange = (product, nextQuantity) => {
    if (nextQuantity < 1) {
      removeFromCart(product._id);
      return;
    }

    const stockCount = getStockCount(product);
    if (nextQuantity > stockCount) {
      toast.error(`На складе доступно только ${stockCount} шт.`);
      return;
    }

    const currentQuantity = getCartQuantity(product._id);
    const result = currentQuantity > 0
      ? updateQuantity(product._id, nextQuantity)
      : addToCart(product, nextQuantity);

    if (!result?.success && !showCartResultError(result)) {
      toast.error('Не удалось изменить количество товара');
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <main>
          <div className="favorites-container">
            <div className="loading">Загрузка избранного...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <main>
        <div className="favorites-page-container">
          <h1 className="page-title favorites-page-title">
            Избранные товары
          </h1>
          
          <div className="product-list-grid">
            {favorites.length === 0 ? (
              <div className="no-favorites">
                <h2>В избранном пока ничего нет</h2>
                <p>Вы можете добавить товары из нашего каталога.</p>
                <Link to="/catalog" className="catalog-button">
                  Перейти в каталог
                </Link>
              </div>
            ) : (
              favorites.map((product) => {
                const imageProps = getImageProps(
                  product.images?.[0] || product.image,
                  product.name
                );
                const rating = product.averageRating ?? product.avgRating ?? product.rating ?? 0;
                const reviewCount = product.reviewCount ?? product.totalReviews ?? product.reviewsCount ?? 0;
                const stockCount = getStockCount(product);
                const isInStock = stockCount > 0;
                const cartQuantity = getCartQuantity(product._id);
                
                return (
                <div key={product._id} className="product-card" data-price={product.price}>
                  <div className="product-image-container">
                    <Link to={`/product/${product._id}`} className="product-image-link">
                      <img {...imageProps} />
                    </Link>
                  </div>
                  
                  <div className="product-info-container">
                    <h3>
                      <Link to={`/product/${product._id}`}>
                        {product.name}
                      </Link>
                    </h3>
                    <div className="product-details">
                      <div className="product-category-tag">
                        {product.category?.name || 'Неизвестно'}
                      </div>
                    </div>
                    <RatingStars rating={rating} reviewCount={reviewCount} className="product-card-rating" />
                    <div className={`product-card-stock ${isInStock ? 'in-stock' : 'out-of-stock'}`}>
                      {isInStock ? `На складе: ${stockCount} шт.` : 'Нет в наличии'}
                    </div>
                  </div>
                  
                  <div className="product-purchase-container">
                    <div className="price-container">
                      <div className="price-main">
                        {product.price?.toLocaleString('ru-RU')} ₽
                      </div>
                    </div>
                    
                    <div className="product-actions">
                      {cartQuantity > 0 ? (
                        <div className="cart-quantity-control" aria-label="Количество товара в корзине">
                          <button
                            type="button"
                            onClick={() => handleCartQuantityChange(product, cartQuantity - 1)}
                            aria-label="Уменьшить количество"
                          >
                            −
                          </button>
                          <span>{cartQuantity}</span>
                          <button
                            type="button"
                            onClick={() => handleCartQuantityChange(product, cartQuantity + 1)}
                            disabled={cartQuantity >= stockCount}
                            aria-label="Увеличить количество"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button 
                          className="cart-button"
                          onClick={() => handleAddToCart(product)}
                          disabled={!isInStock}
                        >
                          {isInStock ? 'В корзину' : 'Нет в наличии'}
                        </button>
                      )}
                      
                      <button 
                        className="favorite-button remove-favorite"
                        onClick={() => handleRemoveFromFavorites(product._id)}
                        title="Удалить из избранного"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Favorites;
