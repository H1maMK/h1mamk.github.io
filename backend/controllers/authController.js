const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { generateToken, verifyToken } = require('../utils/jwt');
const { success, error, unauthorized, conflict } = require('../utils/response');
const tokenService = require('../services/tokenService');


const register = async (req, res) => {
  try {
    const { username, email, password, yearbirth, gender } = req.body;


    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return conflict(res, 'Пользователь с таким email уже существует');
    }


    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
      return conflict(res, 'Пользователь с таким именем уже существует');
    }


    const newUser = new User({
      username,
      email,
      password,
      profile: {
        yearBirth: yearbirth || null,
        gender: gender || null
      },
      role: 'user'
    });


    const savedUser = await newUser.save();


    const token = generateToken(savedUser._id);


    const userResponse = {
      id: savedUser._id,
      username: savedUser.username,
      email: savedUser.email,
      profile: savedUser.profile,
      role: savedUser.role,
      createdAt: savedUser.createdAt
    };

    return success(res, {
      user: userResponse,
      token,
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }, 'Регистрация успешна', 201);

  } catch (err) {
    console.error('Registration error:', err);
    return error(res, 'Ошибка регистрации', 500, err.message);
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt for email:', email);


    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('User not found for email:', email);
      return unauthorized(res, 'Неверный email или пароль');
    }

    if (user.isBlocked) {
      return unauthorized(res, 'Ваш аккаунт заблокирован. Обратитесь к администратору');
    }

    console.log('User found:', user.email, 'Role:', user.role, 'Has password:', !!user.password);


    const isPasswordValid = await user.comparePassword(password);
    console.log('Password validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Invalid password for user:', email);
      return unauthorized(res, 'Неверный email или пароль');
    }


    user.updatedAt = new Date();
    await user.save();


    const token = generateToken(user._id);


    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      profile: user.profile,
      role: user.role,
      favorites: user.favorites,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    console.log('Login successful for user:', email);

    return success(res, {
      user: userResponse,
      token,
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }, 'Вход выполнен');

  } catch (err) {
    console.error('Login error:', err);
    return error(res, 'Ошибка входа', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};


const getMe = async (req, res) => {
  try {

    const user = req.user;

    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      profile: user.profile,
      role: user.role,
      favorites: user.favorites,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return success(res, { user: userResponse }, 'User data retrieved successfully');

  } catch (err) {
    console.error('Get user error:', err);
    return error(res, 'Failed to get user data', 500, err.message);
  }
};


const logout = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (req.user?._id) {

      await User.findByIdAndUpdate(req.user._id, {
        tokenInvalidBefore: new Date()
      });
    }

    if (token) {

      const blacklisted = tokenService.blacklistToken(token);
      
      if (blacklisted) {
        return success(res, null, 'Logout successful - token invalidated');
      } else {
        return success(res, null, 'Logout successful');
      }
    }
    
    return success(res, null, 'Logout successful');

  } catch (err) {
    console.error('Logout error:', err);
    return error(res, 'Logout failed', 500, err.message);
  }
};


const verifyTokenEndpoint = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return unauthorized(res, 'No token provided');
    }

    if (tokenService.isTokenBlacklisted(token)) {
      return unauthorized(res, 'Token has been invalidated');
    }


    const decoded = verifyToken(token);
    

    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return unauthorized(res, 'User not found');
    }

    if (user.isBlocked) {
      return unauthorized(res, 'Account is blocked');
    }

    if (user.tokenInvalidBefore && decoded.iat) {
      const tokenIssuedAtMs = decoded.iat * 1000;
      const invalidBeforeMs = new Date(user.tokenInvalidBefore).getTime();
      if (tokenIssuedAtMs <= invalidBeforeMs) {
        return unauthorized(res, 'Token has been invalidated');
      }
    }

    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      profile: user.profile,
      role: user.role,
      favorites: user.favorites,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return success(res, {
      valid: true,
      user: userResponse,
      expiresAt: new Date(decoded.exp * 1000)
    }, 'Token is valid');

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return unauthorized(res, 'Token expired');
    }
    
    if (err.name === 'JsonWebTokenError') {
      return unauthorized(res, 'Invalid token');
    }

    console.error('Token verification error:', err);
    return error(res, 'Token verification failed', 500, err.message);
  }
};


const refreshToken = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return unauthorized(res, 'No token provided');
    }


    if (tokenService.isTokenBlacklisted(token)) {
      return unauthorized(res, 'Token has been invalidated');
    }



    const jwt = require('jsonwebtoken');
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        ignoreExpiration: true,
        issuer: 'devicemaster-api',
        audience: 'devicemaster-client'
      });
    } catch (err) {
      return unauthorized(res, 'Invalid token');
    }

    if (!decoded?.userId) {
      return unauthorized(res, 'Invalid token payload');
    }


    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return unauthorized(res, 'User not found');
    }

    if (user.isBlocked) {
      return unauthorized(res, 'Account is blocked');
    }

    if (user.tokenInvalidBefore && decoded.iat) {
      const tokenIssuedAtMs = decoded.iat * 1000;
      const invalidBeforeMs = new Date(user.tokenInvalidBefore).getTime();
      if (tokenIssuedAtMs <= invalidBeforeMs) {
        return unauthorized(res, 'Token has been invalidated');
      }
    }


    const newToken = generateToken(user._id);

    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      profile: user.profile,
      role: user.role,
      favorites: user.favorites,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return success(res, {
      user: userResponse,
      token: newToken,
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }, 'Token refreshed successfully');

  } catch (err) {
    console.error('Token refresh error:', err);
    return error(res, 'Token refresh failed', 500, err.message);
  }
};


const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;


    const user = await User.findById(userId).select('+password').exec();
    if (!user) {
      return unauthorized(res, 'User not found');
    }

    if (!user.password || typeof user.password !== 'string') {
      return error(res, 'Password is not set for this user', 400);
    }

    if (!currentPassword || !newPassword) {
      return error(res, 'Current and new password are required', 400);
    }


    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return unauthorized(res, 'Current password is incorrect');
    }


    user.password = newPassword;
    user.updatedAt = new Date();
    await user.save();

    return success(res, null, 'Password changed successfully');

  } catch (err) {
    console.error('Change password error:', err);
    return error(res, 'Failed to change password', 500, process.env.NODE_ENV !== 'production' ? err.message : undefined);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  verifyTokenEndpoint,
  refreshToken,
  changePassword
};
