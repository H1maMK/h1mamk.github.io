import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { buildAssetUrl } from '../config/api';
import api from '../services/api';
import './Cart.css';

const DELIVERY_ADDRESS_TEMPLATE = 'Астрахань, ';
const ASTRAKHAN_ADDRESS_REGEX = /^\s*(г\.?\s*)?(город\s*)?астрахан(?:[ьи])?(?=\s|,|$)/i;

const ASTRAKHAN_ADDRESS_SUGGESTIONS = [
  'Астрахань, ул. Адмиралтейская',
  'Астрахань, ул. Боевая',
  'Астрахань, ул. Савушкина',
  'Астрахань, ул. Николая Островского',
  'Астрахань, ул. Кирова',
  'Астрахань, ул. Советская',
  'Астрахань, ул. Ленина',
  'Астрахань, ул. Ахшарумова',
  'Астрахань, ул. Яблочкова',
  'Астрахань, ул. Минусинская',
  'Астрахань, ул. Татищева',
  'Астрахань, ул. Победы',
  'Астрахань, ул. Бакинская',
  'Астрахань, ул. Куликова',
  'Астрахань, ул. Красная Набережная',
  'Астрахань, ул. Набережная Приволжского Затона',
  'Астрахань, пл. Ленина',
  'Астрахань, пл. Вокзальная',
  'Астрахань, пр-т Бумажников',
  'Астрахань, пр-т Губернатора Анатолия Гужвина',
  'Астрахань, пер. Смоляной',
  'Астрахань, 1-й проезд Рождественского',
  'Астрахань, мкр. Бабаевского',
  'Астрахань, мкр. Юго-Восток-2',
  'Астрахань, мкр. Казачий',
  'Астрахань, Трусовский район',
  'Астрахань, Кировский район',
  'Астрахань, Ленинский район',
  'Астрахань, Советский район'
];

const getAddressDetails = (address) => address
  .replace(ASTRAKHAN_ADDRESS_REGEX, '')
  .replace(/^\s*,\s*/, '')
  .trim();

const normalizeAddressSearch = (value) => getAddressDetails(value)
  .toLowerCase()
  .replace(/^ул\.?\s*/i, '')
  .replace(/^улица\s*/i, '')
  .replace(/^пр-?т\.?\s*/i, '')
  .replace(/^проспект\s*/i, '')
  .trim();

const getAddressSuggestions = (address) => {
  const query = normalizeAddressSearch(address);

  if (!query) {
    return ASTRAKHAN_ADDRESS_SUGGESTIONS.slice(0, 8);
  }

  return ASTRAKHAN_ADDRESS_SUGGESTIONS
    .filter((suggestion) => normalizeAddressSearch(suggestion).includes(query))
    .slice(0, 8);
};

const getAstrakhanAddressError = (address) => {
  const normalizedAddress = address.trim();

  if (!normalizedAddress) {
    return 'Пожалуйста, введите адрес доставки!';
  }

  if (normalizedAddress.length > 300) {
    return 'Адрес доставки не должен превышать 300 символов!';
  }

  if (!ASTRAKHAN_ADDRESS_REGEX.test(normalizedAddress)) {
    return 'Доставка доступна только по Астрахани. Начните адрес с "Астрахань,"';
  }

  const addressDetails = getAddressDetails(normalizedAddress);

  if (addressDetails.length < 5) {
    return 'Укажите улицу, дом и квартиру/офис после "Астрахань,"';
  }

  if (normalizedAddress.length < 15) {
    return 'Адрес доставки должен содержать минимум 15 символов!';
  }

  return '';
};

const Cart = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, getTotalPrice, clearCart, validateCartItems, removeInvalidItems } = useCart();
  const [orderForm, setOrderForm] = useState({
    address: DELIVERY_ADDRESS_TEMPLATE,
    payment: 'card',
    delivery: 'courier'
  });
  const [invalidItems, setInvalidItems] = useState([]);
  const [isValidating, setIsValidating] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);


  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
  }, [user, authLoading, navigate]);


  useEffect(() => {
    const checkCartItems = async () => {
      if (items.length > 0) {
        setIsValidating(true);
        const { invalid, adjusted } = await validateCartItems();
        setInvalidItems(invalid);
        setIsValidating(false);

        if (adjusted?.length > 0) {
          toast.error('Количество некоторых товаров уменьшено до доступного остатка на складе');
        }
      }
    };
    
    checkCartItems();
  }, [items.length]);


  if (authLoading) {
    return (
      <div className="page-wrapper">
        <div className="cart-page-main-wrapper" style={{ paddingTop: '140px', textAlign: 'center' }}>
          <h1 className="korzina-text">Корзина</h1>
          <p style={{ color: '#888', fontSize: '1.2rem', marginTop: '40px' }}>Загрузка...</p>
        </div>
      </div>
    );
  }


  if (!user) {
    return null;
  }


  if (user.role === 'admin') {
    return (
      <div className="page-wrapper">
        <div className="cart-page-main-wrapper" style={{ paddingTop: '140px' }}>
<h1 className="korzina-text">Корзина</h1>
          <div className="basket-container">
            <div className="cart-items-column">
              <p className="empty-cart-message">Администратор не может пользоваться корзиной. Здесь пусто.</p>
            </div>
            <div className="cart-sidebar-column">
              <div className="order-summary">
                <div className="summary-total">
                  <p>Товары: 0₽</p>
                  <p>Доставка: 0₽</p>
                  <hr style={{ margin: '10px 0', border: '1px solid #444' }} />
                  <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                    Итого: <span className="total-price">0₽</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getDeliveryPrice = () => {
    return orderForm.delivery === 'courier' ? 500 : 0;
  };

  const getFinalPrice = () => {
    return getTotalPrice() + getDeliveryPrice();
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    if (!Number.isInteger(newQuantity) || newQuantity < 1) {
      toast.error('Количество товара не может быть отрицательным или нулевым');
      return;
    }

    const result = updateQuantity(itemId, newQuantity);

    if (result?.success) {
      return;
    }

    if (result?.reason === 'INSUFFICIENT_STOCK') {
      toast.error(`На складе доступно только ${result.availableStock} шт.`);
      return;
    }

    if (result?.reason === 'OUT_OF_STOCK') {
      toast.error('Товара нет на складе');
      return;
    }

    toast.error('Не удалось изменить количество товара');
  };

  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId);

    setInvalidItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleRemoveInvalidItems = () => {
    const invalidIds = invalidItems.map(item => item.id);
    removeInvalidItems(invalidIds);
    setInvalidItems([]);
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();

    const addressError = getAstrakhanAddressError(orderForm.address);
    if (addressError) {
      toast.error(addressError);
      return;
    }
    
    if (items.length === 0) {
      toast.error('Корзина пуста!');
      return;
    }

    setIsValidating(true);
    const { invalid, adjusted } = await validateCartItems();
    setInvalidItems(invalid);
    setIsValidating(false);

    if (invalid.length > 0) {
      toast.error('В корзине есть недоступные товары. Удалите их перед оформлением заказа.');
      return;
    }

    if (adjusted?.length > 0) {
      toast.error('Количество некоторых товаров было уменьшено до остатка на складе. Проверьте корзину и повторите оформление.');
      return;
    }

    try {
      const orderData = {
        items: items.map(item => ({
          product: item.id || item._id,
          quantity: item.quantity
        })),
        shippingAddress: orderForm.address.trim(),
        paymentMethod: orderForm.payment,
        deliveryMethod: orderForm.delivery
      };

      console.log('Отправляем заказ:', orderData);

      const response = await api.post('/orders', orderData);
      const data = response.data;
      console.log('Ответ сервера:', data);

      if (data.success) {
        toast.success('Оплата прошла успешно, заказ оформлен');
        clearCart();
        setOrderForm({
          address: DELIVERY_ADDRESS_TEMPLATE,
          payment: 'card',
          delivery: 'courier'
        });
      } else {

        if (data.error?.details) {
          const errorMessages = data.error.details.map(d => d.message).join('\n');
          toast.error(`Ошибка оформления заказа:\n${errorMessages}`);
        } else {
          toast.error(data.error?.message || data.message || 'Ошибка оформления заказа');
        }
        

        if (data.error?.message?.includes('Invalid product ID') || 
            data.error?.message?.includes('not found')) {
          if (confirm('Похоже, некоторые товары в корзине устарели. Очистить корзину и добавить товары заново?')) {
            clearCart();
          }
        }
      }
    } catch (error) {
      console.error('Ошибка оформления заказа:', error);

      if (error.response?.status === 401) {
        toast.error('Сессия истекла. Войдите в аккаунт повторно.');
        navigate('/login');
        return;
      }

      if (error.response?.data?.error?.details) {
        const errorMessages = error.response.data.error.details.map(d => d.message).join('\n');
        toast.error(`Ошибка оформления заказа:\n${errorMessages}`);
        return;
      }

      toast.error(error.response?.data?.error?.message || 'Ошибка оформления заказа. Попробуйте позже.');
    }
  };

  const currentAddressError = getAstrakhanAddressError(orderForm.address);
  const addressSuggestions = getAddressSuggestions(orderForm.address);

  const handleAddressSuggestionSelect = (suggestion) => {
    setOrderForm(prev => ({ ...prev, address: `${suggestion}, д. ` }));
    setShowAddressSuggestions(false);
  };

  return (
    <div className="page-wrapper">
        <div className="cart-page-main-wrapper" style={{ paddingTop: '140px' }}>
<h1 className="korzina-text">Корзина</h1>

        <div className="basket-container">
          {invalidItems.length > 0 && (
            <div style={{
              background: '#ff6b6b',
              color: 'white',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <strong>⚠️ Внимание!</strong> В корзине есть товары, которые больше не доступны ({invalidItems.length} шт.)
              </div>
              <button
                onClick={handleRemoveInvalidItems}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Удалить недоступные
              </button>
            </div>
          )}

          {isValidating && (
            <div style={{
              background: '#ffa500',
              color: 'white',
              padding: '10px',
              borderRadius: '8px',
              marginBottom: '15px',
              textAlign: 'center'
            }}>
              🔄 Проверяем доступность товаров...
            </div>
          )}

          <div className={`cart-items-column ${items.length === 0 ? 'empty-state' : ''}`}>
            {items.length > 0 ? (
              <ul className="cart-list">
                {items.map((item) => {
                  const rawImage = item.image || '/placeholder-product.jpg';
                  const itemImage = buildAssetUrl(rawImage);
                  const productId = item.id || item._id;
                  const isInvalid = invalidItems.some(invalid => (invalid.id || invalid._id) === productId);
                  const availableStock = Number.isFinite(Number(item.stock)) ? Math.max(0, Math.floor(Number(item.stock))) : null;
                  
                  return (
                    <li key={productId} className={`cart-item ${isInvalid ? 'invalid-item' : ''}`}>
                      <Link
                        to={`/product/${productId}`}
                        className="cart-item-link"
                        style={{ opacity: isInvalid ? 0.5 : 1 }}
                      >
                        <img 
                          className="item-image" 
                          src={itemImage} 
                          alt={item.name}
                        />
                        <div className="item-info">
                          <p className="item-name" style={{ color: isInvalid ? '#ff6b6b' : 'inherit' }}>
                            {item.name}
                            {isInvalid && <span style={{ fontSize: '0.8rem', marginLeft: '10px' }}>(недоступен)</span>}
                          </p>
                          <p className="item-price">
                            <strong>{new Intl.NumberFormat('ru-RU').format(item.price)}₽</strong>
                          </p>
                          {availableStock !== null && (
                            <p style={{ color: availableStock > 0 ? '#888' : '#ff6b6b', fontSize: '0.85rem', marginTop: '4px' }}>
                              На складе: {availableStock} шт.
                            </p>
                          )}
                        </div>
                      </Link>
                      <div className="item-quantity">
                        <input
                          type="number"
                          className="quantity-input"
                          value={item.quantity}
                          min="1"
                          max={availableStock ?? undefined}
                          disabled={isInvalid}
                          onChange={(e) => handleQuantityChange(productId, parseInt(e.target.value))}
                          style={{ opacity: isInvalid ? 0.5 : 1 }}
                        />
                      </div>
                      <button 
                        className="remove-item-btn" 
                        onClick={() => handleRemoveItem(productId)}
                      >
                        &times;
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="empty-cart-message">Ваша корзина пуста.</p>
            )}
          </div>

          <div className="cart-sidebar-column">
            <div className="order-summary">
              <div className="summary-total">
                <div>
                  <p>Товары: {new Intl.NumberFormat('ru-RU').format(getTotalPrice())}₽</p>
                  {orderForm.delivery === 'courier' && (
                    <p>Доставка: {new Intl.NumberFormat('ru-RU').format(getDeliveryPrice())}₽</p>
                  )}
                  <hr style={{ margin: '10px 0', border: '1px solid #444' }} />
                  <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                    Итого: <span className="total-price">{new Intl.NumberFormat('ru-RU').format(getFinalPrice())}₽</span>
                  </p>
                </div>
              </div>
              <button 
                className="order-button" 
                onClick={handleOrderSubmit}
                disabled={items.length === 0 || invalidItems.length > 0 || isValidating}
              >
                {invalidItems.length > 0 
                  ? 'Удалите недоступные товары' 
                  : isValidating 
                    ? 'Проверяем товары...'
                    : 'Оформить заказ'
                }
              </button>
            </div>

            <div className="payment-options">
              <div className="option-group">
                <label htmlFor="payment">Способ оплаты</label>
                <select
                  name="payment"
                  id="payment"
                  value={orderForm.payment}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, payment: e.target.value }))}
                >
                  <option value="card">Картой онлайн</option>
                </select>
              </div>
              <div className="option-group">
                <label htmlFor="delivery">Способ доставки</label>
                <select
                  name="delivery"
                  id="delivery"
                  value={orderForm.delivery}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, delivery: e.target.value }))}
                >
                  <option value="courier">Курьером (+500₽)</option>
                </select>
              </div>
            </div>

            <div className="delivery-address">
              <h2>Адрес доставки</h2>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Астрахань, ул. Ленина, д. 1, кв. 1"
                  className="adres"
                  value={orderForm.address}
                  maxLength={300}
                  onFocus={() => {
                    if (!orderForm.address.trim()) {
                      setOrderForm(prev => ({ ...prev, address: DELIVERY_ADDRESS_TEMPLATE }));
                    }
                    setShowAddressSuggestions(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowAddressSuggestions(false), 120);
                  }}
                  onChange={(e) => {
                    setOrderForm(prev => ({ ...prev, address: e.target.value }));
                    setShowAddressSuggestions(true);
                  }}
                />
                {showAddressSuggestions && addressSuggestions.length > 0 && (
                  <div className="address-suggestions">
                    {addressSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        className="address-suggestion-item"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleAddressSuggestionSelect(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: currentAddressError ? '#ffa500' : '#888',
                  marginTop: '5px',
                  textAlign: 'right'
                }}>
                  {orderForm.address.length}/300 символов
                  {currentAddressError && orderForm.address.length > 0 && (
                    <span style={{ color: '#ffa500', marginLeft: '10px' }}>
                      (только Астрахань)
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: '0.82rem',
                  color: '#888',
                  marginTop: '6px',
                  lineHeight: '1.35'
                }}>
                  Формат: <strong>Астрахань, ул. Название, д. 1, кв. 1</strong>. Доставка доступна только по Астрахани.
                </div>
              </div>
              <div className="map-container" style={{ marginTop: '15px' }}>
                <iframe
                  src="https://www.openstreetmap.org/export/embed.html?bbox=47.9320%2C46.3000%2C48.1600%2C46.4200&layer=mapnik&marker=46.3497%2C48.0408"
                  width="100%"
                  height="170"
                  style={{ border: 0, borderRadius: '8px' }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Карта доставки: Астрахань"
                />
                <a
                  href="https://www.openstreetmap.org/?mlat=46.3497&mlon=48.0408#map=12/46.3497/48.0408"
                  target="_blank"
                  rel="noreferrer"
                  className="map-open-link"
                >
                  Открыть карту Астрахани
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
