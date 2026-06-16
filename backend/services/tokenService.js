


class TokenService {
  constructor() {


    this.blacklistedTokens = new Set();
    this.cleanupInterval = null;
    

    if (process.env.NODE_ENV !== 'test') {
      this.startCleanupInterval();
    }
  }


  startCleanupInterval() {

    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredTokens();
    }, 60 * 60 * 1000);
  }


  stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }


  blacklistToken(token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(token);
      
      if (decoded && decoded.exp) {

        this.blacklistedTokens.add(JSON.stringify({
          token: token,
          exp: decoded.exp
        }));
        
        console.log(`Token blacklisted for user ${decoded.userId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error blacklisting token:', error);
      return false;
    }
  }


  isTokenBlacklisted(token) {
    try {

      for (const blacklistedItem of this.blacklistedTokens) {
        const parsed = JSON.parse(blacklistedItem);
        if (parsed.token === token) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking blacklisted token:', error);
      return false;
    }
  }


  cleanupExpiredTokens() {
    try {
      const now = Math.floor(Date.now() / 1000);
      const toRemove = [];
      
      for (const blacklistedItem of this.blacklistedTokens) {
        const parsed = JSON.parse(blacklistedItem);
        

        if (parsed.exp < now) {
          toRemove.push(blacklistedItem);
        }
      }
      

      toRemove.forEach(item => {
        this.blacklistedTokens.delete(item);
      });
      
      if (toRemove.length > 0) {
        console.log(`Cleaned up ${toRemove.length} expired tokens from blacklist`);
      }
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
    }
  }


  getBlacklistSize() {
    return this.blacklistedTokens.size;
  }


  clearBlacklist() {
    this.blacklistedTokens.clear();
    console.log('Token blacklist cleared');
  }


  destroy() {
    this.stopCleanupInterval();
    this.clearBlacklist();
  }


  getTokenStats() {
    const now = Math.floor(Date.now() / 1000);
    let activeTokens = 0;
    let expiredTokens = 0;

    for (const blacklistedItem of this.blacklistedTokens) {
      try {
        const parsed = JSON.parse(blacklistedItem);
        if (parsed.exp > now) {
          activeTokens++;
        } else {
          expiredTokens++;
        }
      } catch (error) {
        expiredTokens++;
      }
    }

    return {
      total: this.blacklistedTokens.size,
      active: activeTokens,
      expired: expiredTokens
    };
  }
}


const tokenService = new TokenService();

module.exports = tokenService;