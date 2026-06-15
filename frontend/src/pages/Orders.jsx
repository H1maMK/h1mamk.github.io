import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { buildApiUrl, buildAssetUrl, API_ENDPOINTS } from '../config/api';
import './Orders.css';

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.ORDERS), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setOrders(data.data || []);
      } else {
        setError('Ошибка загрузки заказов');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Ошибка загрузки заказов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="page-wrapper">
        <main>
          <div className="profile-container">
            <div className="loading">Загрузка...</div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Вы уверены, что хотите отменить заказ?')) {
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.ORDERS}/${orderId}/cancel`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchOrders(); // Обновляем список заказов
      } else {
        alert('Ошибка при отмене заказа');
      }
    } catch (err) {
      console.error('Error canceling order:', err);
      alert('Ошибка при отмене заказа');
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'В обработке';
      case 'confirmed': return 'Подтвержден';
      case 'shipped': return 'Отправлен';
      case 'delivered': return 'Доставлен';
      case 'cancelled': return 'Отменен';
      default: return status;
    }
  };

  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'card': return 'Карта';
      case 'cash': return 'Наличные';
      case 'bank_transfer': return 'Банковский перевод';
      default: return method;
    }
  };

  const getProductImageUrl = (product) => {
    const image = product?.images?.[0];

    if (!image) {
      return '/placeholder-product.jpg';
    }

    return buildAssetUrl(image);
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <main>
          <div className="profile-container">
            <div className="loading">Загрузка заказов...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <main>
        <div className="profile-container" style={{ justifyContent: 'center', maxWidth: '1250px', margin: '0 auto', padding: '160px 20px 40px 20px', width: '100%', boxSizing: 'border-box' }}>
          <div className="orders-card">
            <h2>Мои заказы</h2>
            
            {error && <div className="error-message">{error}</div>}
            
            {orders.length === 0 ? (
              <div className="no-orders">
                <h3>У вас пока нет заказов</h3>
                <p>Перейдите в каталог, чтобы сделать первый заказ</p>
              </div>
            ) : (
              <div className="orders-table-container">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Дата</th>
                      <th>Статус</th>
                      <th>Адрес</th>
                      <th>Оплата</th>
                      <th>Сумма</th>
                      <th>Товары</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order._id}>
                        <td>{new Date(order.createdAt).toLocaleDateString('ru-RU')}</td>
                        <td>
                          <span className={`status-badge status-${order.status}`}>
                            {getStatusText(order.status)}
                          </span>
                        </td>
                        <td>{order.shippingAddress}</td>
                        <td>{getPaymentMethodText(order.paymentMethod)}</td>
                        <td className="price-cell">
                          {order.totalAmount ? `${order.totalAmount.toLocaleString('ru-RU')} ₽` : '—'}
                        </td>
                        <td className="order-products-cell">
                          {order.items && order.items.length > 0 ? (
                            <div className="order-items-list">
                              {order.items.map((item, index) => {
                                const productId = item.product?._id;
                                const productName = item.product?.name || 'Товар';
                                const imageUrl = getProductImageUrl(item.product);

                                return (
                                  <div key={index} className="order-item-row">
                                    {productId ? (
                                      <Link to={`/product/${productId}`} className="order-item-thumb-link">
                                        <img
                                          src={imageUrl}
                                          alt={productName}
                                          className="order-item-thumb"
                                        />
                                      </Link>
                                    ) : (
                                      <div className="order-item-thumb-link">
                                        <img
                                          src={imageUrl}
                                          alt={productName}
                                          className="order-item-thumb"
                                        />
                                      </div>
                                    )}

                                    <div className="order-item-details">
                                      {productId ? (
                                        <Link to={`/product/${productId}`} className="order-item-link">
                                          {productName}
                                        </Link>
                                      ) : (
                                        <span className="order-item-name">{productName}</span>
                                      )}
                                      <span className="order-item-qty">×{item.quantity}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Orders;
