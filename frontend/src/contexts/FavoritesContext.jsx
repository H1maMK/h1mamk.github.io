import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';

const FavoritesContext = createContext();

const ADMIN_FAVORITES_MESSAGE = 'Администраторы не могут добавлять товары в избранное';

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  // Загружаем избранное при входе пользователя
  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      setFavorites([]);
    }
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl(API_ENDPOINTS.FAVORITES), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Если токен невалидный или истёк, просто очищаем избранное
      if (response.status === 401 || response.status === 404) {
        setFavorites([]);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setFavorites(data.data.favorites || []);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const addToFavorites = async (productId) => {
    if (!user) {
      toast.error('Войдите, чтобы добавить товар в избранное');
      return false;
    }

    if (user.role === 'admin') {
      toast.error(ADMIN_FAVORITES_MESSAGE);
      return false;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Войдите, чтобы добавить товар в избранное');
      return false;
    }

    // Извлекаем ID если передан объект
    const id = typeof productId === 'object' ? productId._id || productId.id : productId;
    
    if (!id) {
      console.error('Invalid productId:', productId);
      return false;
    }

    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.FAVORITES}/${id}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        toast.error('Сессия истекла. Войдите заново.');
        return false;
      }

      const data = await response.json();

      if (data.success) {
        await loadFavorites(); // Перезагружаем список
        toast.success('Товар добавлен в избранное');
        return true;
      } else {
        toast.error(data.message || 'Ошибка при добавлении в избранное');
        return false;
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
      toast.error('Ошибка при добавлении в избранное');
      return false;
    }
  };

  const removeFromFavorites = async (productId) => {
    if (!user) return false;

    if (user.role === 'admin') {
      toast.error(ADMIN_FAVORITES_MESSAGE);
      return false;
    }

    const token = localStorage.getItem('token');
    if (!token) return false;

    // Извлекаем ID если передан объект
    const id = typeof productId === 'object' ? productId._id || productId.id : productId;
    
    if (!id) {
      console.error('Invalid productId:', productId);
      return false;
    }

    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.FAVORITES}/${id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        toast.error('Сессия истекла. Войдите заново.');
        return false;
      }

      const data = await response.json();

      if (data.success) {
        // Перезагружаем список с сервера для синхронизации
        await loadFavorites();
        toast.success('Товар удалён из избранного');
        return true;
      } else {
        toast.error(data.message || 'Ошибка при удалении из избранного');
        return false;
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
      toast.error('Ошибка при удалении из избранного');
      return false;
    }
  };

  const toggleFavorite = async (productId) => {
    // Извлекаем ID если передан объект
    const id = typeof productId === 'object' ? productId._id || productId.id : productId;
    
    if (!id) {
      console.error('Invalid productId:', productId);
      return false;
    }
    
    const isInFavorites = favorites.some((item) => item._id === id);

    if (isInFavorites) {
      return await removeFromFavorites(id);
    } else {
      return await addToFavorites(id);
    }
  };

  const isFavorite = (productId) => {
    if (!productId) return false;
    // Извлекаем ID если передан объект
    const id = typeof productId === 'object' ? productId._id || productId.id : productId;
    if (!id) return false;
    // Проверяем по _id и id
    return favorites.some((item) => {
      const itemId = item._id || item.id;
      return itemId === id || String(itemId) === String(id);
    });
  };

  const value = {
    favorites,
    loading,
    adminFavoritesMessage: ADMIN_FAVORITES_MESSAGE,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    loadFavorites
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};
