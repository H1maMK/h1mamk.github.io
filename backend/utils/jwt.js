const jwt = require('jsonwebtoken');


const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRE || '7d',
      issuer: 'devicemaster-api',
      audience: 'devicemaster-client'
    }
  );
};


const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'devicemaster-api',
      audience: 'devicemaster-client'
    });
  } catch (error) {
    throw error;
  }
};


const decodeToken = (token) => {
  return jwt.decode(token, { complete: true });
};


const getTokenExpiration = (token) => {
  try {
    const decoded = jwt.decode(token);
    return decoded.exp ? new Date(decoded.exp * 1000) : null;
  } catch (error) {
    return null;
  }
};


const isTokenExpired = (token) => {
  const expiration = getTokenExpiration(token);
  return expiration ? expiration < new Date() : true;
};


const refreshTokenIfNeeded = (token) => {
  try {
    const decoded = jwt.decode(token);
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - now;
    

    if (timeUntilExpiry < 24 * 60 * 60) {
      return generateToken(decoded.userId);
    }
    
    return token;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  getTokenExpiration,
  isTokenExpired,
  refreshTokenIfNeeded
};