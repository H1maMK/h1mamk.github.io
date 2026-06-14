import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { buildAssetUrl } from '../../config/api';

const AdminProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showHidden, setShowHidden] = useState(false);
  const [movingProductId, setMovingProductId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const activeProducts = useMemo(
    () => products.filter(product => product.isActive !== false),
    [products]
  );

  const hiddenProducts = useMemo(
    () => products.filter(product => product.isActive === false),
    [products]
  );

  const currentProducts = showHidden ? hiddenProducts : activeProducts;

  const filteredProducts = useMemo(() => {
    if (searchQuery.trim() === '') {
      return currentProducts;
    }

    const query = searchQuery.toLowerCase();
    const normalizedQuery = query.replace(/ё/g, 'е').trim();
    const isWeeklySpecialQuery = normalizedQuery.includes('товар недели') || normalizedQuery.includes('товары недели');

    return currentProducts.filter(product => {
      if (isWeeklySpecialQuery) {
        return product.isWeeklySpecial;
      }

      return product.name.toLowerCase().includes(query) ||
        product.category?.name?.toLowerCase().includes(query) ||
        product.price?.toString().includes(query) ||
        (product.isWeeklySpecial ? 'да товар недели товары недели' : 'нет').includes(normalizedQuery);
    });
  }, [searchQuery, currentProducts]);

  const fetchProducts = async (withLoader = true) => {
    if (withLoader) {
      setLoading(true);
    }

    try {
      const allProducts = [];
      let page = 1;
      let hasNext = true;

      while (hasNext) {
        const response = await fetch(`/api/admin/products?status=all&limit=100&page=${page}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const data = await response.json();
        
        if (!data.success) {
          console.error('Error fetching products:', data.message || data.error?.message);
          setProducts([]);
          toast.error(data.message || data.error?.message || 'Ошибка загрузки товаров');
          return;
        }

        const productsPage = Array.isArray(data.data?.products)
          ? data.data.products
          : Array.isArray(data.data)
            ? data.data
            : [];

        allProducts.push(...productsPage);
        hasNext = Boolean(data.pagination?.hasNext);
        page += 1;
      }

      setProducts(allProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      toast.error('Ошибка загрузки товаров');
    } finally {
      if (withLoader) {
        setLoading(false);
      }
    }
  };

  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const handleVisibility = async (productId, shouldBeActive) => {
    const confirmText = shouldBeActive
      ? 'Вернуть этот товар в каталог?'
      : 'Скрыть этот товар? Он исчезнет с сайта и переместится в «Скрытое».';

    if (!window.confirm(confirmText)) {
      return;
    }

    setMovingProductId(productId);

    try {
      const response = await fetch(`/api/admin/products/${productId}/visibility`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: shouldBeActive })
      });

      const data = await response.json();

      if (data.success) {
        await wait(260);
        setProducts(prevProducts => prevProducts.map(product => (
          product._id === productId ? { ...product, isActive: shouldBeActive } : product
        )));
        toast.success(shouldBeActive ? 'Товар возвращён!' : 'Товар скрыт!');
      } else {
        toast.error(data.message || 'Ошибка при изменении видимости товара');
      }
    } catch (error) {
      console.error('Error toggling product visibility:', error);
      toast.error('Ошибка при изменении видимости товара');
    } finally {
      setMovingProductId(null);
    }
  };

  if (loading) {
    return <div className="admin-loading">Загрузка товаров...</div>;
  }

  return (
    <div className="content-wrapper full-width">
      <div className="table-container">
        <div className="table-header">
          <h2>{showHidden ? 'Скрытые товары' : 'Список товаров'} ({filteredProducts.length})</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div className="search-box">
              <input
                type="text"
                placeholder="Поиск товара..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input-admin"
              />
              {searchQuery && (
                <button 
                  className="clear-search"
                  onClick={() => setSearchQuery('')}
                >
                  ✕
                </button>
              )}
            </div>
            <button 
              className="action-button save-button"
              onClick={() => navigate('/admin/products/new')}
            >
              + Новый товар
            </button>
            <button
              className={`action-button ${showHidden ? 'save-button' : 'hide-button'} products-view-toggle`}
              onClick={() => {
                setShowHidden(prev => !prev);
                setSearchQuery('');
              }}
            >
              {showHidden ? `К товарам (${activeProducts.length})` : `Скрытое (${hiddenProducts.length})`}
            </button>
          </div>
        </div>
        {searchQuery && (
          <div className="search-results-info">
            Найдено: {filteredProducts.length} из {currentProducts.length}
          </div>
        )}
        <table className="admin-table">
          <thead>
            <tr>
              <th>Картинки</th>
              <th>Название</th>
              <th>Цена</th>
              <th>Кол-во</th>
              <th>Категория</th>
              <th>Товар недели</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <tr
                  key={product._id}
                  className={movingProductId === product._id ? 'product-row-moving' : ''}
                >
                  <td>
                    <div className="product-images-list">
                      {product.images?.slice(0, 3).map((img, index) => (
                        img && (
                          <img 
                            key={index}
                            src={buildAssetUrl(img)} 
                            alt="" 
                            className="product-image-thumbnail" 
                          />
                        )
                      ))}
                    </div>
                  </td>
                  <td>{product.name}</td>
                  <td>{product.price?.toLocaleString('ru-RU')} ₽</td>
                  <td>{product.stock}</td>
                  <td>{product.category?.name || 'Без категории'}</td>
                  <td>
                    {product.isWeeklySpecial ? (
                      <span className="status-badge status-confirmed">Да</span>
                    ) : (
                      <span className="status-badge status-pending">Нет</span>
                    )}
                  </td>
                  <td>
                    <button 
                      className="action-button edit-button"
                      onClick={() => navigate(`/admin/products/edit/${product._id}`)}
                    >
                      Редактировать
                    </button>
                    <button 
                      className={`action-button ${showHidden ? 'show-button' : 'hide-button'}`}
                      onClick={() => handleVisibility(product._id, showHidden)}
                      disabled={movingProductId === product._id}
                    >
                      {showHidden ? 'Показать' : 'Скрыть'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">{showHidden ? 'Скрытые товары не найдены.' : 'Товары не найдены.'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProducts;
