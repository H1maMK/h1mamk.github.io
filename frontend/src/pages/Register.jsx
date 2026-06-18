import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const REGISTER_DRAFT_STORAGE_KEY = 'register-form-draft';


const translateError = (message) => {
  const translations = {
    'Password must contain at least one lowercase letter, one uppercase letter, and one number': 
      'Пароль должен содержать минимум одну строчную букву, одну заглавную букву и одну цифру',
    'Password must contain at least one lowercase letter': 
      'Пароль должен содержать минимум одну строчную букву',
    'Password must contain at least one uppercase letter': 
      'Пароль должен содержать минимум одну заглавную букву',
    'Password must contain at least one number': 
      'Пароль должен содержать минимум одну цифру',
    'Password must be at least 8 characters long':
      'Пароль должен быть минимум 8 символов',
    'Пароль должен быть минимум 8 символов':
      'Пароль должен быть минимум 8 символов',
    'Пароль должен содержать минимум одну заглавную букву':
      'Пароль должен содержать минимум одну заглавную букву',
    'Username must be between 3 and 30 characters': 
      'Имя пользователя должно быть от 3 до 30 символов',
    'Username can only contain letters, numbers, underscores, and hyphens': 
      'Имя пользователя может содержать только буквы, цифры, подчёркивания и дефисы',
    'Please provide a valid email address': 
      'Введите корректный email',
    'Please enter a valid email': 
      'Введите корректный email',
    'User with this email already exists': 
      'Пользователь с таким email уже существует',
    'User with this username already exists': 
      'Пользователь с таким именем уже существует',
    'Email is required': 
      'Введите email',
    'Password is required': 
      'Введите пароль',
    'Username is required': 
      'Введите имя пользователя',
    'Invalid email or password': 
      'Неверный email или пароль',
    'Registration failed': 
      'Ошибка регистрации',
    'Validation Error': 
      'Ошибка валидации',
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

const Register = () => {
  const [formData, setFormData] = useState(() => {
    try {
      const savedDraft = sessionStorage.getItem(REGISTER_DRAFT_STORAGE_KEY);

      if (savedDraft) {
        return JSON.parse(savedDraft);
      }
    } catch (error) {
      console.error('Failed to restore register draft:', error);
    }

    return {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToPrivacy: false,
      agreeToDataProcessing: false
    };
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextFormData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    };

    setFormData(nextFormData);

    try {
      sessionStorage.setItem(REGISTER_DRAFT_STORAGE_KEY, JSON.stringify(nextFormData));
    } catch (error) {
      console.error('Failed to save register draft:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');


    if (!formData.username.trim()) {
      setError('Введите имя пользователя');
      return;
    }

    if (formData.username.trim().length < 3) {
      setError('Имя пользователя должно содержать минимум 3 символа');
      return;
    }


    if (!formData.email.trim()) {
      setError('Введите email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Введите корректный email');
      return;
    }


    if (!formData.password) {
      toast.error('Введите пароль');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Пароль должен содержать минимум 8 символов');
      return;
    }

    if (!/[A-Z]/.test(formData.password)) {
      toast.error('Пароль должен содержать минимум одну заглавную букву');
      return;
    }


    if (!formData.confirmPassword) {
      toast.error('Подтвердите пароль');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }


    if (!formData.agreeToPrivacy) {
      setError('Необходимо принять политику конфиденциальности');
      return;
    }


    if (!formData.agreeToDataProcessing) {
      setError('Необходимо дать согласие на обработку персональных данных');
      return;
    }

    setLoading(true);

    try {
      await register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password
      });
      sessionStorage.removeItem(REGISTER_DRAFT_STORAGE_KEY);
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);
      console.log('Full error response:', err.response?.data);
      

      let errorMessage = 'Ошибка регистрации. Попробуйте позже.';
      
      const data = err.response?.data;
      
      if (data) {

        if (data.error?.message) {
          errorMessage = data.error.message;
        }

        if (data.error?.details && Array.isArray(data.error.details)) {
          errorMessage = data.error.details.map((d) => d.message).join('. ');
        }

        if (typeof data.error === 'string') {
          errorMessage = data.error;
        }

        if (data.message && !data.error) {
          errorMessage = data.message;
        }

        if (data.errors && Array.isArray(data.errors)) {
          errorMessage = data.errors.map((e) => e.msg || e.message).join('. ');
        }
      }
      

      errorMessage = translateError(errorMessage);

      if (/парол/i.test(errorMessage) || /password/i.test(errorMessage)) {
        toast.error(errorMessage);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="main-auth">
        <div className="auth-container">
          <h1>Регистрация</h1>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Имя пользователя</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
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

            <div className="form-group">
              <label htmlFor="confirmPassword">Подтвердите пароль</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group-checkbox privacy-checkbox">
              <input
                type="checkbox"
                id="agreeToPrivacy"
                name="agreeToPrivacy"
                checked={formData.agreeToPrivacy}
                onChange={handleChange}
              />
              <label htmlFor="agreeToPrivacy">
                Принимаю <Link to="/privacy" state={{ from: '/register' }}>политику конфиденциальности</Link>
              </label>
            </div>

            <div className="form-group-checkbox privacy-checkbox">
              <input
                type="checkbox"
                id="agreeToDataProcessing"
                name="agreeToDataProcessing"
                checked={formData.agreeToDataProcessing}
                onChange={handleChange}
              />
              <label htmlFor="agreeToDataProcessing">
                Согласен на <Link to="/personal-data" state={{ from: '/register' }}>обработку персональных данных</Link>
              </label>
            </div>

            <button 
              type="submit" 
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>

          <div className="switch-auth">
            <p>
              Уже есть аккаунт? <Link to="/login">Войти</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
