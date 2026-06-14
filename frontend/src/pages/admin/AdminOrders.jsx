import { useState, useEffect } from 'react';
import { buildAssetUrl } from '../../config/api';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders/all', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      console.log('Orders response:', data);
      
      if (data.success) {
        setOrders(data.data.orders || data.data || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProductImageUrl = (product) => {
    if (!product || !product.images || product.images.length === 0) {
      return null;
    }
    const img = product.images[0];
    // Если уже полный URL
    if (img.startsWith('http')) {
      return img;
    }
    // Если путь начинается с /
    if (img.startsWith('/')) {
      return buildAssetUrl(img);
    }
    // Если путь без /
    return buildAssetUrl(img);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    // Если статус "удаление", удаляем заказ
    if (newStatus === 'delete') {
      if (!window.confirm('Вы уверены, что хотите удалить этот заказ?')) {
        return;
      }
      
      try {
        console.log('Deleting order:', orderId);
        
        const response = await fetch(`/api/orders/${orderId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const data = await response.json();
        console.log('Delete response:', data);
        
        if (data.success) {
          fetchOrders(); // Обновляем список
          alert('Заказ удалён!');
        } else {
          alert(data.message || data.error?.message || 'Ошибка удаления заказа');
        }
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Ошибка удаления заказа');
      }
      return;
    }
    
    // Для остальных статусов - обычное обновление
    try {
      console.log('Updating order status:', orderId, newStatus);
      
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await response.json();
      console.log('Response:', data);
      
      if (data.success) {
        fetchOrders(); // Обновляем список
        alert('Статус заказа обновлён!');
      } else {
        console.log('Validation errors:', data.errors);
        alert(data.message || data.error?.message || 'Ошибка обновления статуса');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Ошибка обновления статуса');
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'В обработке';
      case 'confirmed': return 'Подтверждён';
      case 'shipped': return 'Отправлен';
      case 'delivered': return 'Доставлен';
      case 'cancelled': return 'Отменён';
      default: return status;
    }
  };

  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'card': return 'Карта';
      case 'cash': return 'Наличные';
      default: return method;
    }
  };

  const getDeliveryMethodText = (method) => {
    switch (method) {
      case 'courier': return 'Курьер';
      case 'pickup': return 'Самовывоз';
      default: return method;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="admin-loading">Загрузка заказов...</div>;
  }

  return (
    <div className="content-wrapper">
      <div className="table-container" style={{ flex: '1' }}>
        <h2>Заказы пользователей ({orders.length})</h2>
        <table className="admin-table orders-table">
          <thead>
            <tr>
              <th>Пользователь</th>
              <th>Дата</th>
              <th>Статус</th>
              <th>Адрес</th>
              <th>Оплата</th>
              <th>Доставка</th>
              <th>Сумма</th>
              <th>Товары</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order._id}>
                  <td>{order.user?.username || 'Неизвестно'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(order.createdAt)}</td>
                  <td>
                    <span className={`status-badge status-${order.status}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td>{order.shippingAddress}</td>
                  <td>{getPaymentMethodText(order.paymentMethod)}</td>
                  <td>{getDeliveryMethodText(order.deliveryMethod)}</td>
                  <td style={{ fontWeight: '600', color: '#FFE6BB', whiteSpace: 'nowrap' }}>
                    {order.totalAmount ? `${order.totalAmount.toLocaleString('ru-RU')} ₽` : '—'}
                  </td>
                  <td>
                    {order.items && order.items.length > 0 ? (
                      <div className="order-items-list">
                        {order.items.map((item, index) => {
                          const imageUrl = getProductImageUrl(item.product);
                          return (
                            <div key={index} className="order-item-row">
                              {imageUrl ? (
                                <img 
                                  src={imageUrl}
                                  alt={item.product?.name || 'Товар'}
                                  className="order-item-thumb"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div 
                                className="order-item-thumb order-item-no-image"
                                style={imageUrl ? { display: 'none' } : {}}
                              >
                                📦
                              </div>
                              <div className="order-item-details">
                                {item.product?._id ? (
                                  <a 
                                    href={`/product/${item.product._id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="order-item-link"
                                  >
                                    {item.product?.name || 'Товар'}
                                  </a>
                                ) : (
                                  <span className="order-item-name">{item.product?.name || 'Товар'}</span>
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
                  <td>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      className="order-status-select"
                    >
                      <option value="pending">В обработке</option>
                      <option value="confirmed">Подтверждён</option>
                      <option value="shipped">Отправлен</option>
                      <option value="delivered">Доставлен</option>
                      <option value="cancelled">Отменён</option>
                      <option value="delete" className="delete-option">Удалить</option>
                    </select>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '30px' }}>
                  Заказов пока нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrders;
