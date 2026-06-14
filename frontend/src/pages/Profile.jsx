import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Profile.css';

const Profile = () => {
  const { user, logout, refreshUser, loading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    avatar: null
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        avatar: null
      });
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

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'avatar') {
      setFormData(prev => ({ ...prev, avatar: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const notices = [];

      // Сначала обновляем профиль (username, email)
      if (formData.username !== user.username || formData.email !== user.email) {
        const profileResponse = await fetch('http://localhost:3002/api/users/profile', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email
          })
        });

        const profileData = await profileResponse.json();
        if (!profileData.success) {
          throw new Error(profileData.message || 'Ошибка при обновлении профиля');
        }

        notices.push('Профиль успешно обновлен!');
      }

      // Затем загружаем аватар, если он выбран
      if (formData.avatar) {
        const avatarFormData = new FormData();
        avatarFormData.append('avatar', formData.avatar);

        const avatarResponse = await api.post('/users/avatar', avatarFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000
        });

        if (!avatarResponse.data.success) {
          throw new Error(avatarResponse.data.error?.message || 'Ошибка при загрузке аватара');
        }

        notices.push('Аватар обновлен!');
      }

      const { currentPassword, newPassword, confirmPassword } = passwordData;
      const hasPasswordInput = currentPassword || newPassword || confirmPassword;

      if (hasPasswordInput) {
        if (!currentPassword || !newPassword || !confirmPassword) {
          throw new Error('Заполните все поля для смены пароля');
        }

        if (newPassword.length < 8) {
          throw new Error('Новый пароль должен быть минимум 8 символов');
        }

        if (!/[A-Z]/.test(newPassword)) {
          throw new Error('Новый пароль должен содержать минимум одну заглавную букву');
        }

        if (newPassword !== confirmPassword) {
          throw new Error('Пароли не совпадают');
        }

        const passwordResponse = await api.put('/auth/change-password', {
          currentPassword,
          newPassword
        });

        if (!passwordResponse.data?.success) {
          throw new Error(passwordResponse.data?.error?.message || 'Ошибка при смене пароля');
        }

        notices.push('Пароль успешно обновлен!');
      }

      if (notices.length > 0) {
        setMessage(notices.join(' '));
      }
      setIsEditing(false);

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Обновляем данные пользователя
      await refreshUser();
    } catch (err) {
      const errorMessage = err.message || 'Ошибка при обновлении профиля';
      if (/парол/i.test(errorMessage) || /password/i.test(errorMessage)) {
        toast.error(errorMessage);
        setError('');
      } else {
        setError(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="page-wrapper">
      <main>
        <div className="profile-container">
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar">
                <img 
                  src={user.profile?.avatar ? `http://localhost:3002${user.profile.avatar}?t=${Date.now()}` : '/uploads/avatars/default.svg'} 
                  alt="Аватар пользователя"
                  onError={(e) => {
                    console.log('Avatar failed to load:', user.profile?.avatar);
                    e.target.src = '/uploads/avatars/default.svg';
                  }}
                />
              </div>
              <h1>{user.username}</h1>
              <p className="profile-email">{user.email}</p>
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit}>
                {error && <div className="error-message">{error}</div>}
                {message && <div className="success-message">{message}</div>}
                
                <div className="form-group">
                  <label htmlFor="username">Имя пользователя</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

              <div className="form-group">
                <label htmlFor="avatar">Аватар</label>
                <input
                  type="file"
                  id="avatar"
                  name="avatar"
                  accept="image/*"
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="currentPassword">Текущий пароль</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Введите текущий пароль"
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">Новый пароль</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Минимум 8 символов и 1 заглавная буква"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Подтвердите новый пароль</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Повторите новый пароль"
                />
              </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="auth-button"
                    onClick={() => setIsEditing(false)}
                    style={{ background: '#ccc' }}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="auth-button"
                    disabled={submitting}
                  >
                    {submitting ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="profile-menu">
                  <Link to="/orders" className="profile-menu-item">
                    <span>Мои заказы</span>
                    <span className="arrow">→</span>
                  </Link>
                  <Link to="/favorites" className="profile-menu-item">
                    <span>Избранное</span>
                    <span className="arrow">→</span>
                  </Link>
                  <button 
                    className="profile-menu-item"
                    onClick={() => setIsEditing(true)}
                    style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
                  >
                    <span>Редактировать профиль</span>
                    <span className="arrow">→</span>
                  </button>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="profile-menu-item admin-link">
                      <span>Админ-панель</span>
                      <span className="arrow">→</span>
                    </Link>
                  )}
                </div>

                <div className="profile-footer">
                  <button onClick={handleLogout} className="logout-button">
                    Выйти из аккаунта
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
