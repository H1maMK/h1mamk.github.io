// Сервис для управления JWT токенами
// В production среде рекомендуется использовать Redis для хранения blacklist токенов

class TokenService {
  constructor() {
    // В памяти храним blacklist токенов (для development)
    // В production следует использовать Redis или другое внешнее хранилище
    this.blacklistedTokens = new Set();
    this.cleanupInterval = null;
    
    // Запускаем очистку только если не в тестовой среде
    if (process.env.NODE_ENV !== 'test') {
      this.startCleanupInterval();
    }
  }

  // Запуск интервала очистки
  startCleanupInterval() {
    // Очищаем истекшие токены каждый час
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredTokens();
    }, 60 * 60 * 1000); // 1 hour
  }

  // Остановка интервала очистки
  stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  // Добавить токен в blacklist
  blacklistToken(token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(token);
      
      if (decoded && decoded.exp) {
        // Сохраняем токен с временем истечения
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

  // Проверить, находится ли токен в blacklist
  isTokenBlacklisted(token) {
    try {
      // Ищем токен в blacklist
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

  // Очистить истекшие токены из blacklist
  cleanupExpiredTokens() {
    try {
      const now = Math.floor(Date.now() / 1000);
      const toRemove = [];
      
      for (const blacklistedItem of this.blacklistedTokens) {
        const parsed = JSON.parse(blacklistedItem);
        
        // Если токен истек, помечаем его для удаления
        if (parsed.exp < now) {
          toRemove.push(blacklistedItem);
        }
      }
      
      // Удаляем истекшие токены
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

  // Получить количество токенов в blacklist
  getBlacklistSize() {
    return this.blacklistedTokens.size;
  }

  // Очистить весь blacklist (для тестирования)
  clearBlacklist() {
    this.blacklistedTokens.clear();
    console.log('Token blacklist cleared');
  }

  // Уничтожить сервис (для тестирования)
  destroy() {
    this.stopCleanupInterval();
    this.clearBlacklist();
  }

  // Получить статистику токенов
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

// Создаем singleton instance
const tokenService = new TokenService();

module.exports = tokenService;