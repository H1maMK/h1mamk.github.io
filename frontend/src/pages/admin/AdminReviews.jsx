import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import './AdminPanel.css';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  useEffect(() => {
    loadReviews();
  }, []);

  const normalizeReview = (review, fallbackProduct = {}) => ({
    ...review,
    productId: review.productId || fallbackProduct.productId,
    productName: review.productName || fallbackProduct.productName || 'Товар',
    productImage: review.productImage || fallbackProduct.productImage || ''
  });

  const sortReviewsByDate = (items = []) => {
    return [...items].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  };

  const buildStats = (items = []) => {
    return items.reduce(
      (acc, review) => {
        acc.total += 1;

        if (review.status === 'pending') {
          acc.pending += 1;
        } else if (review.status === 'approved') {
          acc.approved += 1;
        } else if (review.status === 'rejected') {
          acc.rejected += 1;
        }

        return acc;
      },
      { total: 0, pending: 0, approved: 0, rejected: 0 }
    );
  };

  const loadReviewsFromProducts = async () => {
    const productsResponse = await api.get('/products?limit=0');
    const products = productsResponse.data?.data || [];

    const allReviewsNested = await Promise.all(
      products.map(async (product) => {
        try {
          const response = await api.get(`/admin/products/${product._id}/reviews/all`);
          const productReviews = response.data?.data?.reviews || [];

          return productReviews.map((review) =>
            normalizeReview(review, {
              productId: product._id,
              productName: product.name,
              productImage: product.images?.[0] || ''
            })
          );
        } catch (productReviewError) {
          console.error('Error loading product reviews:', productReviewError);
          return [];
        }
      })
    );

    const flattenedReviews = sortReviewsByDate(allReviewsNested.flat());
    setReviews(flattenedReviews);
    setStats(buildStats(flattenedReviews));
  };

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/reviews');
      if (response.data.success) {
        setReviews(response.data.data.reviews || []);
        setStats(response.data.data.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
      } else {
        toast.error('Ошибка загрузки отзывов');
      }
    } catch (error) {
      if (error.response?.status === 404) {
        try {
          await loadReviewsFromProducts();
          return;
        } catch (fallbackError) {
          console.error('Fallback review loading failed:', fallbackError);
        }
      } else {
        console.error('Error loading reviews:', error);
      }

      toast.error('Ошибка загрузки отзывов');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId) => {
    try {
      const response = await api.post(`/admin/reviews/${reviewId}/moderate`, {
        action: 'approve'
      });
      
      if (response.data.success) {
        toast.success('Отзыв одобрен!');
        loadReviews();
      } else {
        toast.error(response.data.error?.message || 'Ошибка');
      }
    } catch (error) {
      console.error('Error approving review:', error);
      toast.error('Ошибка при одобрении отзыва');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Введите причину отклонения');
      return;
    }

    try {
      const response = await api.post(`/admin/reviews/${selectedReview}/moderate`, {
        action: 'reject',
        reason: rejectReason
      });
      
      if (response.data.success) {
        toast.success('Отзыв отклонен!');
        setShowRejectModal(false);
        setRejectReason('');
        setSelectedReview(null);
        loadReviews();
      } else {
        toast.error(response.data.error?.message || 'Ошибка');
      }
    } catch (error) {
      console.error('Error rejecting review:', error);
      toast.error('Ошибка при отклонении отзыва');
    }
  };

  const handleDelete = async (productId, reviewId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот отзыв?')) {
      return;
    }

    try {
      const response = await api.delete(`/products/${productId}/reviews/${reviewId}`);

      if (response.data.success) {
        toast.success('Отзыв удалён!');
        loadReviews();
      } else {
        toast.error(response.data.error?.message || 'Ошибка при удалении отзыва');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error(error.response?.data?.error?.message || 'Ошибка при удалении отзыва');
    }
  };

  const openRejectModal = (reviewId) => {
    setSelectedReview(reviewId);
    setShowRejectModal(true);
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div>Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="admin-reviews-page">
      <div className="page-header">
        <h1>Модерация отзывов</h1>
        <p className="subtitle">
          Всего отзывов: {stats.total} · Ожидают проверки: {stats.pending} · Одобрены: {stats.approved} · Отклонены: {stats.rejected}
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="empty-state">
          <p>Отзывов пока нет</p>
        </div>
      ) : (
        <div className="reviews-list">
          {reviews.map((review) => (
            <div key={review._id} className="review-card">
              <div className="review-header">
                <div className="review-product">
                  {review.productImage && (
                    <img 
                      src={review.productImage.startsWith('http') 
                        ? review.productImage 
                        : `http://localhost:3002${review.productImage}`} 
                      alt={review.productName}
                      className="product-thumb"
                    />
                  )}
                  <div>
                    <Link to={`/product/${review.productId}`} className="product-link">
                      {review.productName || 'Товар'}
                    </Link>
                  </div>
                </div>
                <div className="review-rating">
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  <span className="rating-number">({review.rating}/5)</span>
                </div>
              </div>
              
              <div className="review-user">
                <strong>Пользователь:</strong> {review.user?.username || 'Аноним'}
              </div>
              
              <div className="review-comment">
                <strong>Комментарий:</strong>
                <p>{review.comment}</p>
              </div>

              <div className="review-user">
                <strong>Статус:</strong>{' '}
                {review.status === 'pending'
                  ? 'Ожидает проверки'
                  : review.status === 'approved'
                    ? 'Одобрен'
                    : 'Отклонён'}
              </div>

              {review.status === 'rejected' && review.rejectedReason && (
                <div className="review-comment">
                  <strong>Причина отклонения:</strong>
                  <p>{review.rejectedReason}</p>
                </div>
              )}

              <div className="review-date">
                {new Date(review.createdAt).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              
              <div className="review-actions">
                <button 
                  className="btn-approve"
                  onClick={() => handleApprove(review._id)}
                  disabled={review.status === 'approved'}
                >
                  {review.status === 'approved' ? 'Уже одобрен' : 'Одобрить'}
                </button>
                <button 
                  className="btn-reject"
                  onClick={() => openRejectModal(review._id)}
                >
                  Отклонить
                </button>
                <button
                  className="action-button delete-button"
                  onClick={() => handleDelete(review.productId, review._id)}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for reject reason */}
      {showRejectModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Причина отклонения</h2>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Введите причину отклонения отзыва..."
              rows="4"
              maxLength={500}
            />
            <div className="modal-actions">
              <button 
                className="btn-cancel"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedReview(null);
                }}
              >
                Отмена
              </button>
              <button 
                className="btn-confirm-reject"
                onClick={handleReject}
              >
                Отклонить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
