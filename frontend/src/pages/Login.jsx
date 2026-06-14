import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// Функция перевода английских ошибок на русский
const translateError = (message) => {
  const translations = {
    'Invalid email or password': 'Неверный email или пароль',
    'User not found': 'Пользователь не найден',
    'Wrong password': 'Неверный пароль',
    'Please provide a valid email address': 'Введите корректный email',
    'Password is required': 'Введите пароль',
    'Email is required': 'Введите email',
    'Login failed': 'Ошибка входа',
    'Unauthorized': 'Неавторизован',
  };

  if (translations[message]) {
    return translations[message];
  }

  for (const [eng, rus] of Object.entries(translations)) {
    if (message.includes(eng)) {
      return message.replace(eng, rus);
    }
  }

  return message;
};

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      
      let errorMessage = 'Ошибка входа';
      const data = err.response?.data;

      if (data) {
        // Формат: { error: { message: "..." } }
        if (data.error?.message) {
          errorMessage = data.error.message;
        }
        // Формат: { error: "string" }
        else if (typeof data.error === 'string') {
          errorMessage = data.error;
        }
        // Формат: { message: "..." }
        else if (data.message) {
          errorMessage = data.message;
        }
      }

      // Переводим на русский
      errorMessage = translateError(errorMessage);
      if (/парол/i.test(errorMessage) || /password/i.test(errorMessage)) {
        toast.error(errorMessage);
        setError('');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="main-auth">
        <div className="auth-container">
          <h1>Вход в аккаунт</h1>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Пароль</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button 
              type="submit" 
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <div className="switch-auth">
            <p>
              Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
