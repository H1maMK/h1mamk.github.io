import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { buildApiUrl, buildAssetUrl, API_ENDPOINTS } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import RatingStars from '../components/RatingStars';
import './Catalog.css';

const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { items, addToCart, updateQuantity, removeFromCart } = useCart();
  const { toggleFavorite, isFavorite, adminFavoritesMessage } = useFavorites();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('loading');
  const [showFilters, setShowFilters] = useState(false);


  const [filters, setFilters] = useState({
    device_category: [],
    usage_type: [],
    manufacturer: [],
    connection_type: [],
    price_range: '',
    min_price: '',
    max_price: '',
    search: ''
  });


  const mockProducts = [
    {
      _id: '1',
      name: 'Мышь беспроводная Logitech G PRO X SUPERLIGHT 2 розовый',
      description: 'Беспроводная мышь Logitech G PRO X SUPERLIGHT 2 – это высококачественное игровое устройство, обеспечивающее максимальную точность и скорость.',
      price: 12990,
      images: ['/uploads/mouse1.jpg'],
      specifications: { "Цвет": "розовый", "Тип": "беспроводная", "DPI": "до 25600" },
      category: { _id: '1', name: 'Игровые Мышки', deviceType: 'Игровое' },
      stock: 10,
      isActive: true
    },
    {
      _id: '2',
      name: 'Мышь проводная Logitech M90 [910-001970] черный',
      description: 'Проводная мышь Logitech M90 – это простое и надежное устройство, идеально подходящее для офисного использования.',
      price: 599,
      images: ['/uploads/mouse2.jpg'],
      specifications: { "Цвет": "черный", "Тип": "проводная", "DPI": "до 1000" },
      category: { _id: '2', name: 'Офисные Мышки', deviceType: 'Офисное' },
      stock: 30,
      isActive: true
    },
    {
      _id: '3',
      name: 'Монитор ARDOR GAMING PORTAL AF24H1 черный',
      description: 'Монитор ARDOR GAMING PORTAL AF24H1 — это идеальный выбор для геймеров, стремящихся к высокому качеству изображения.',
      price: 19990,
      images: ['/uploads/monitor1.jpg'],
      specifications: { "Размер": "23.8 дюйма", "Разрешение": "1920 x 1080", "Частота": "144 Гц" },
      category: { _id: '3', name: 'Игровые Мониторы', deviceType: 'Игровое' },
      stock: 15,
      isActive: true
    },
    {
      _id: '4',
      name: 'Клавиатура проводная ARDOR GAMING Blade PRO',
      description: 'Клавиатура ARDOR GAMING Blade PRO — это высококачественное игровое устройство с механическими переключателями.',
      price: 4990,
      images: ['/uploads/keyboard1.jpg'],
      specifications: { "Тип": "проводная", "Переключатели": "механические", "Подсветка": "RGB" },
      category: { _id: '4', name: 'Игровые Клавиатуры', deviceType: 'Игровое' },
      stock: 30,
      isActive: true
    },
    {
      _id: '5',
      name: 'Беспроводные наушники Logitech G435 черный',
      description: 'Беспроводные наушники Logitech G435 — это легкие и удобные наушники, разработанные для геймеров.',
      price: 7990,
      images: ['/uploads/headphones1.jpg'],
      specifications: { "Тип": "беспроводные", "Время работы": "до 18 часов", "Вес": "165 г" },
      category: { _id: '5', name: 'Игровые Наушники', deviceType: 'Игровое' },
      stock: 40,
      isActive: true
    },
    {
      _id: '6',
      name: 'Микрофон Fifine AM8 черный',
      description: 'Микрофон Fifine AM8 — это высококачественный USB-микрофон, идеально подходящий для стриминга.',
      price: 3490,
      images: ['/uploads/microphone1.jpg'],
      specifications: { "Тип": "USB", "Направленность": "кардиоидная", "Частота": "20Hz - 20kHz" },
      category: { _id: '6', name: 'Игровые Микрофоны', deviceType: 'Игровое' },
      stock: 30,
      isActive: true
    }
  ];

  const mockCategories = [
    { _id: '1', name: 'Игровые Мышки', deviceType: 'Игровое' },
    { _id: '2', name: 'Офисные Мышки', deviceType: 'Офисное' },
    { _id: '3', name: 'Игровые Мониторы', deviceType: 'Игровое' },
    { _id: '4', name: 'Игровые Клавиатуры', deviceType: 'Игровое' },
    { _id: '5', name: 'Игровые Наушники', deviceType: 'Игровое' },
    { _id: '6', name: 'Игровые Микрофоны', deviceType: 'Игровое' }
  ];


  useEffect(() => {
    const loadData = async () => {
      await fetchProducts();
      await fetchCategories();
    };
    loadData();
  }, []);


  useEffect(() => {
    const newFilters = {
      device_category: searchParams.getAll('device_category') || [],
      usage_type: searchParams.getAll('usage_type') || [],
      manufacturer: searchParams.getAll('manufacturer') || [],
      connection_type: searchParams.getAll('connection_type') || [],
      price_range: searchParams.get('price_range') || '',
      min_price: searchParams.get('min_price') || '',
      max_price: searchParams.get('max_price') || '',
      search: searchParams.get('search') || ''
    };
    setFilters(newFilters);
    applyFilters(newFilters);
  }, [searchParams, products]);

  const fetchProducts = async () => {
    try {
      console.log('Загрузка товаров из API...');

      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.PRODUCTS}?limit=500`));
      
      console.log('Ответ получен, статус:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Данные получены:', data.success, 'Количество товаров:', data.data?.length);
      
      if (data.success && data.data && data.data.length > 0) {
        const apiProducts = data.data;
        console.log('✅ Загружено товаров из API:', apiProducts.length);
        setProducts(apiProducts);
        setFilteredProducts(apiProducts);
        

        const manufacturerSet = new Set();
        apiProducts.forEach(product => {
          const name = product.name.toLowerCase();
          if (name.includes('logitech')) manufacturerSet.add('Logitech');
          if (name.includes('razer')) manufacturerSet.add('Razer');
          if (name.includes('asus')) manufacturerSet.add('ASUS');
          if (name.includes('a4tech')) manufacturerSet.add('A4Tech');
          if (name.includes('dexp')) manufacturerSet.add('DEXP');
          if (name.includes('ardor gaming')) manufacturerSet.add('ARDOR GAMING');
          if (name.includes('lamzu')) manufacturerSet.add('LAMZU');
          if (name.includes('steel series')) manufacturerSet.add('Steel Series');
          if (name.includes('dark project')) manufacturerSet.add('Dark Project');
          if (name.includes('defender')) manufacturerSet.add('Defender');
          if (name.includes('sades')) manufacturerSet.add('SADES');
          if (name.includes('fifine')) manufacturerSet.add('Fifine');
          if (name.includes('aceline')) manufacturerSet.add('Aceline');
          if (name.includes('xiaomi')) manufacturerSet.add('Xiaomi');
          if (name.includes('samsung')) manufacturerSet.add('Samsung');
          if (name.includes('apple')) manufacturerSet.add('Apple');
          if (name.includes('sony')) manufacturerSet.add('Sony');
          if (name.includes('marshall')) manufacturerSet.add('Marshall');
          if (name.includes('msi')) manufacturerSet.add('MSI');
          if (name.includes('hyperx')) manufacturerSet.add('HyperX');
          if (name.includes('red square')) manufacturerSet.add('Red Square');
        });
        setManufacturers(Array.from(manufacturerSet));
        setDataSource('api');
      } else {
        console.warn('⚠️ API вернул пустой результат, используем mock данные');
        setProducts(mockProducts);
        setFilteredProducts(mockProducts);
        setDataSource('mock');
      }
      
    } catch (error) {
      console.error('❌ Ошибка загрузки товаров:', error);
      console.log('Используем mock данные как fallback');

      setProducts(mockProducts);
      setFilteredProducts(mockProducts);
      setDataSource('mock');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {

      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CATEGORIES}`));
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data.categories);
      } else {
        console.error('Ошибка API категорий:', data.message);

        setCategories(mockCategories);
      }
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);

      setCategories(mockCategories);
    }
  };

  const applyFilters = (currentFilters) => {
    let filtered = [...products];


    if (currentFilters.device_category.length > 0) {
      filtered = filtered.filter(product => {
        return currentFilters.device_category.some(category => {
          const productName = product.name.toLowerCase();
          const categoryName = product.category?.name?.toLowerCase() || '';
          
          switch (category) {
            case 'Мыши':
              return productName.includes('мыш') || categoryName.includes('мыш');
            case 'Клавиатуры':
              return productName.includes('клавиатур') || categoryName.includes('клавиатур');
            case 'Наушники':
              return productName.includes('наушник') || categoryName.includes('наушник');
            case 'Мониторы':
              return productName.includes('монитор') || categoryName.includes('монитор');
            case 'Микрофоны':
              return productName.includes('микрофон') || categoryName.includes('микрофон');
            case 'Веб-камеры':
              return productName.includes('веб-камер') || productName.includes('камер') || 
                     categoryName.includes('веб-камер') || categoryName.includes('камер');
            default:
              return productName.includes(category.toLowerCase()) || categoryName.includes(category.toLowerCase());
          }
        });
      });
    }
          

    if (currentFilters.usage_type.length > 0) {
      filtered = filtered.filter(product => {
        const deviceType = product.category?.deviceType?.toLowerCase() || '';
        const categoryName = product.category?.name?.toLowerCase() || '';
        

        return currentFilters.usage_type.some(usage => {
          if (usage === 'gaming') {

            return deviceType === 'игровое' || deviceType === 'gaming' || 
                   categoryName.includes('игров');
          } else if (usage === 'office') {

            return deviceType === 'офисное' || deviceType === 'office' || 
                   categoryName.includes('офис');
          }
          
          return false;
        });
      });
    }
        

    if (currentFilters.manufacturer.length > 0) {
      filtered = filtered.filter(product => {
        return currentFilters.manufacturer.some(manufacturer => {
          return product.name.toLowerCase().includes(manufacturer.toLowerCase());
        });
      });
    }


    if (currentFilters.connection_type.length > 0) {
      filtered = filtered.filter(product => {
        const specs = product.specifications || {};
        const specsText = JSON.stringify(specs).toLowerCase();
        const productName = product.name.toLowerCase();
        
        return currentFilters.connection_type.some(type => {
          if (type === 'wired') {
            return specsText.includes('проводн') || productName.includes('проводн');
          }
          if (type === 'wireless') {
            return specsText.includes('беспроводн') || productName.includes('беспроводн');
          }
          return false;
        });
      });
    }


    if (currentFilters.price_range) {
      filtered = filtered.filter(product => {
        const price = product.price;
        switch (currentFilters.price_range) {
          case 'under500':
            return price < 500;
          case '500-1000':
            return price >= 500 && price <= 1000;
          case '1001-2000':
            return price >= 1001 && price <= 2000;
          case '2001-5000':
            return price >= 2001 && price <= 5000;
          case '5001-10000':
            return price >= 5001 && price <= 10000;
          case 'over10000':
            return price > 10000;
          default:
            return true;
        }
      });
    }


    if (currentFilters.min_price) {
      filtered = filtered.filter(product => product.price >= parseInt(currentFilters.min_price));
    }
    if (currentFilters.max_price) {
      filtered = filtered.filter(product => product.price <= parseInt(currentFilters.max_price));
    }


    if (currentFilters.search) {
      const searchTerm = currentFilters.search.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredProducts(filtered);
  };

  const handleFilterChange = (filterType, value, checked) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (filterType === 'device_category' || filterType === 'usage_type' || 
        filterType === 'manufacturer' || filterType === 'connection_type') {
      
      const currentValues = newParams.getAll(filterType);
      
      if (checked) {
        if (!currentValues.includes(value)) {
          newParams.append(filterType, value);
        }
      } else {
        newParams.delete(filterType);
        currentValues.filter(v => v !== value).forEach(v => {
          newParams.append(filterType, v);
        });
      }
    } else {
      if (value) {
        newParams.set(filterType, value);
      } else {
        newParams.delete(filterType);
      }
    }
    
    setSearchParams(newParams);
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams());
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
    if (!user) {
      toast.error('Войдите в аккаунт, чтобы добавить товар в корзину');
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

    if (showCartResultError(result)) {
      return;
    }

    toast.error('Не удалось добавить товар в корзину');
  };

  const handleCartQuantityChange = (product, nextQuantity) => {
    if (!user) {
      toast.error('Войдите в аккаунт, чтобы добавить товар в корзину');
      return;
    }

    if (user.role === 'admin') {
      toast.error('Администраторы не могут добавлять товары в корзину');
      return;
    }

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
    return <div className="loading">Загрузка товаров...</div>;
  }

  const deviceCategories = ['Наушники', 'Клавиатуры', 'Микрофоны', 'Веб-камеры', 'Мыши', 'Мониторы'];

  return (
    <div className="page-wrapper catalog-page">
      <h1 className="page-title">Каталог товаров</h1>

      {dataSource === 'mock' && (
        <div style={{
          background: '#ff6b6b',
          color: 'white',
          padding: '10px',
          textAlign: 'center',
          marginBottom: '10px'
        }}>
          ⚠️ Отображаются тестовые данные. API недоступен.
        </div>
      )}
      
      <main className="catalog-main">
        <button 
          className="mobile-filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? '✕ Скрыть фильтры' : '☰ Показать фильтры'}
        </button>

        <aside className={`filters-sidebar ${showFilters ? 'show' : ''}`} id="filtersSidebar">
          <form id="filters-form">
            
            <div className="filter-section">
              <h3 className="filter-title">Тип устройства</h3>
              {deviceCategories.map(category => (
                <label key={category} className="checkbox-label">
                  <input
                    type="checkbox"
                    value={category}
                    checked={filters.device_category.includes(category)}
                    onChange={(e) => handleFilterChange('device_category', category, e.target.checked)}
                  />
                  {category}
                </label>
              ))}
            </div>

            <div className="filter-section">
              <h3 className="filter-title">Назначение</h3>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  value="gaming"
                  checked={filters.usage_type.includes('gaming')}
                  onChange={(e) => handleFilterChange('usage_type', 'gaming', e.target.checked)}
                />
                Игровые
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  value="office"
                  checked={filters.usage_type.includes('office')}
                  onChange={(e) => handleFilterChange('usage_type', 'office', e.target.checked)}
                />
                Офисные
              </label>
            </div>

            <div className="filter-section">
              <h3 className="filter-title">Производитель</h3>
              {manufacturers.map(manufacturer => (
                <label key={manufacturer} className="checkbox-label">
                  <input
                    type="checkbox"
                    value={manufacturer}
                    checked={filters.manufacturer.includes(manufacturer)}
                    onChange={(e) => handleFilterChange('manufacturer', manufacturer, e.target.checked)}
                  />
                  {manufacturer}
                </label>
              ))}
            </div>

            <div className="filter-section">
              <h3 className="filter-title">Тип подключения</h3>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  value="wired"
                  checked={filters.connection_type.includes('wired')}
                  onChange={(e) => handleFilterChange('connection_type', 'wired', e.target.checked)}
                />
                Проводной
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  value="wireless"
                  checked={filters.connection_type.includes('wireless')}
                  onChange={(e) => handleFilterChange('connection_type', 'wireless', e.target.checked)}
                />
                Беспроводной
              </label>
            </div>

            <div className="filter-section">
              <h3 className="filter-title">Диапазон цен</h3>
              {[
                { value: 'under500', label: 'До 500 ₽' },
                { value: '500-1000', label: '500 - 1000 ₽' },
                { value: '1001-2000', label: '1001 - 2000 ₽' },
                { value: '2001-5000', label: '2001 - 5000 ₽' },
                { value: '5001-10000', label: '5001 - 10000 ₽' },
                { value: 'over10000', label: 'Более 10000 ₽' }
              ].map(range => (
                <label key={range.value} className="radio-label">
                  <input
                    type="radio"
                    name="price_range"
                    value={range.value}
                    checked={filters.price_range === range.value}
                    onChange={(e) => handleFilterChange('price_range', e.target.value)}
                  />
                  {range.label}
                </label>
              ))}
            </div>

            <div className="filter-section">
              <h3 className="filter-title">Цена (ручной ввод)</h3>
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder="от"
                  className="price-input"
                  value={filters.min_price}
                  onChange={(e) => handleFilterChange('min_price', e.target.value)}
                />
                <input
                  type="number"
                  placeholder="до"
                  className="price-input"
                  value={filters.max_price}
                  onChange={(e) => handleFilterChange('max_price', e.target.value)}
                />
              </div>
            </div>

            <button type="button" className="reset-filters-btn" onClick={resetFilters}>
              Сбросить фильтры
            </button>
          </form>
        </aside>

        <div className="products-grid-container">
          <div id="productList" className="product-list-grid">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => {
                const displayPrice = new Intl.NumberFormat('ru-RU').format(product.price);
                const rawImageUrl = product.images && product.images.length > 0 
                  ? product.images[0] 
                  : '/uploads/default-product.png';
                const imageUrl = buildAssetUrl(rawImageUrl);
                const categoryName = product.category?.name || 'Прочее';
                const rating = product.averageRating ?? product.avgRating ?? product.rating ?? 0;
                const reviewCount = product.reviewCount ?? product.totalReviews ?? product.reviewsCount ?? 0;
                const stockCount = getStockCount(product);
                const isInStock = stockCount > 0;
                const cartQuantity = getCartQuantity(product._id);

                return (
                  <div key={product._id} className="product-card" data-price={product.price}>
                    <div className="product-image-container">
                      <Link to={`/product/${product._id}`} className="product-image-link">
                        <img src={imageUrl} alt={product.name} />
                      </Link>
                    </div>
                    <div className="product-info-container">
                      <h3>
                        <Link to={`/product/${product._id}`}>{product.name}</Link>
                      </h3>
                      <div className="product-details">
                        <div className="product-category-tag">{categoryName}</div>
                      </div>
                      <RatingStars rating={rating} reviewCount={reviewCount} className="product-card-rating" />
                      <div className={`product-card-stock ${isInStock ? 'in-stock' : 'out-of-stock'}`}>
                        {isInStock ? `На складе: ${stockCount} шт.` : 'Нет в наличии'}
                      </div>
                    </div>
                    <div className="product-purchase-container">
                      <div className="price-container">
                        <div className="price-main">{displayPrice} ₽</div>
                      </div>
                      <div className="product-actions">
                        {(!user || user.role !== 'admin') && (
                          <>
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
                              className={`favorite-button ${isFavorite(product._id) ? 'active' : ''}`}
                              onClick={() => toggleFavorite(product._id)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill={isFavorite(product._id) ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-products-found">
                <h3>Товары не найдены</h3>
                <p>Попробуйте изменить критерии фильтрации или сбросить их.</p>
                <button className="reset-filters-button" onClick={resetFilters}>
                  Сбросить все фильтры
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Catalog;
