import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getTotalItems } = useCart();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleFavoritesClick = (e) => {
    if (user?.role === 'admin') {
      e.preventDefault();
      toast.error('Администраторы не могут пользоваться избранным');
      setIsMenuOpen(false);
    }
  };

  const handleCartClick = (e) => {
    if (!user) {
      e.preventDefault();
      toast.error('Войдите в аккаунт, чтобы открыть корзину');
      setIsMenuOpen(false);
      navigate('/login');
      return;
    }

    if (user?.role === 'admin') {
      e.preventDefault();
      toast.error('Администраторы не могут пользоваться корзиной');
      setIsMenuOpen(false);
      return;
    }

    setIsMenuOpen(false);
  };

  const cartItemsCount = getTotalItems();

  return (
    <header className="header">
      <div className="container">
        <div className="logo-container">
          <Link to="/" className="logo-button">
            <img className="logo" src="/header/logo.png" alt="DSLK" />
          </Link>
        </div>
        
        <div className="search-container">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              className="search-input"
              placeholder="Поиск товаров..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button type="submit" className="search-button" aria-label="Поиск">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </button>
          </form>
        </div>
        
        <div className="buttons-container">
          <Link to="/catalog" className="button" title="Каталог">
            <img src="/header/catalog.svg" alt="Каталог" />
          </Link>
          <Link to="/favorites" className="button" title="Избранное" onClick={handleFavoritesClick}>
            <img src="/header/Star.svg" alt="Избранное" />
          </Link>
          <Link to="/cart" className="button cart-button-header" title="Корзина" onClick={handleCartClick}>
            <img src="/header/Basket.svg" alt="Корзина" />
            {cartItemsCount > 0 && (
              <span className="cart-badge">{cartItemsCount}</span>
            )}
          </Link>
          <Link to="/profile" className="button" title="Профиль">
            <img src="/header/Profile.svg" alt="Профиль" />
          </Link>
        </div>
        
        <div className={`burger-menu-container ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
          <div className="burger-line"></div>
          <div className="burger-line"></div>
          <div className="burger-line"></div>
        </div>
      </div>
      
      {isMenuOpen && (
        <div className="dropdown-menu">
          <Link to="/" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
            Главная
          </Link>
          <Link to="/catalog" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
            Каталог
          </Link>
          <Link to="/favorites" className="dropdown-item" onClick={handleFavoritesClick}>
            Избранное
          </Link>
          <Link to="/cart" className="dropdown-item" onClick={handleCartClick}>
            Корзина {cartItemsCount > 0 && `(${cartItemsCount})`}
          </Link>
          <Link to="/profile" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
            Профиль
          </Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className="dropdown-item admin-link" onClick={() => setIsMenuOpen(false)}>
              Админ-панель
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
