


import { API_BASE_URL } from '../config/api';


export const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return '/uploads/default-product.png';
  }

  if (imagePath.startsWith('data:image/')) {
    return imagePath;
  }

  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  return `${API_BASE_URL}${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`;
};

// Обработчик ошибок загрузки изображений
export const handleImageError = (event, fallbackUrl = '/uploads/default-product.png') => {
  const img = event.target;
  
  // Предотвращаем бесконечный цикл
  if (img.dataset.fallbackTried) {
    img.src = fallbackUrl;
    return;
  }
  
  img.dataset.fallbackTried = 'true';
  
  // Пробуем с API_BASE_URL
  const originalSrc = img.src;
  if (!originalSrc.includes(API_BASE_URL)) {
    const newSrc = `${API_BASE_URL}${fallbackUrl}`;
    img.src = newSrc;
    return;
  }
  
  // Если ничего не помогло, показываем fallback
  img.src = fallbackUrl;
};

// React хук для получения правильного URL изображения
export const useImageUrl = (imagePath) => {
  return getImageUrl(imagePath);
};

// Простая функция для создания props изображения
export const getImageProps = (src, alt, additionalProps = {}) => {
  return {
    src: getImageUrl(src),
    alt: alt,
    onError: handleImageError,
    ...additionalProps
  };
};