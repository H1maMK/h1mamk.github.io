const bcrypt = require('bcryptjs');


const hashPassword = async (password) => {
  try {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    throw new Error('Error hashing password');
  }
};


const comparePassword = async (password, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    throw new Error('Error comparing password');
  }
};


const generateRandomPassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
};


const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Пароль должен быть минимум ${minLength} символов`);
  }
  
  // Упрощённая валидация - только длина
  // Закомментированы строгие требования:
  if (!hasUpperCase) {
    errors.push('Пароль должен содержать минимум одну заглавную букву');
  }
  // if (!hasLowerCase) {
  //   errors.push('Пароль должен содержать хотя бы одну строчную букву');
  // }
  // if (!hasNumbers) {
  //   errors.push('Пароль должен содержать хотя бы одну цифру');
  // }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password)
  };
};

// Расчет силы пароля (0-100)
const calculatePasswordStrength = (password) => {
  let score = 0;
  
  // Длина
  if (password.length >= 8) score += 25;
  else if (password.length >= 6) score += 15;
  
  // Разнообразие символов
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/\d/.test(password)) score += 15;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15;
  

  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 5;
  
  return Math.min(score, 100);
};

module.exports = {
  hashPassword,
  comparePassword,
  generateRandomPassword,
  validatePasswordStrength,
  calculatePasswordStrength
};
