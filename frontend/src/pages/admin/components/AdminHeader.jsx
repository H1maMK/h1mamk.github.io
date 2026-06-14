import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const AdminHeader = () => {
  const location = useLocation();
  
  const isActive = (path) => {
    if (path === '/admin' || path === '/admin/products') {
      return location.pathname === '/admin' || location.pathname === '/admin/products';
    }
    return location.pathname === path;
  };

  return (
    <header className="admin-header">
      <div className="admin-header-container">
        <Link to="/" className="admin-logo">
          <img src="/header/logo.png" alt="Logo" />
          <span>Админ-панель</span>
        </Link>
        <nav className="admin-nav">
          <Link 
            to="/admin/products" 
            className={`nav-item ${isActive('/admin/products') ? 'active' : ''}`}
          >
            Каталог товаров
          </Link>
          <Link 
            to="/admin/users" 
            className={`nav-item ${isActive('/admin/users') ? 'active' : ''}`}
          >
            Пользователи
          </Link>
          <Link 
            to="/admin/articles" 
            className={`nav-item ${isActive('/admin/articles') ? 'active' : ''}`}
          >
            Статьи
          </Link>
          <Link 
            to="/admin/orders" 
            className={`nav-item ${isActive('/admin/orders') ? 'active' : ''}`}
          >
            Заказы
          </Link>
          <Link 
            to="/admin/reviews" 
            className={`nav-item ${isActive('/admin/reviews') ? 'active' : ''}`}
          >
            Отзывы
          </Link>
          <Link to="/" className="nav-item">
            Вернуться на сайт
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default AdminHeader;
