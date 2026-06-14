const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Создаем папку для логов, если она не существует
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Создаем поток для записи логов в файл
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

// Кастомный формат логирования
morgan.token('user', (req) => {
  return req.user ? req.user.username : 'anonymous';
});

morgan.token('body', (req) => {
  // Не логируем пароли и другие чувствительные данные
  if (req.body && typeof req.body === 'object') {
    const sanitizedBody = { ...req.body };
    delete sanitizedBody.password;
    delete sanitizedBody.confirmPassword;
    return JSON.stringify(sanitizedBody);
  }
  return '';
});

// Формат для development
const devFormat = ':method :url :status :response-time ms - :res[content-length] - :user';

// Формат для production
const prodFormat = ':remote-addr - :user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

// Middleware для логирования в консоль (development)
const consoleLogger = morgan(devFormat, {
  skip: (req, res) => {
    // Пропускаем health check, статические файлы и спам-запросы на корень
    return req.url === '/health' || 
           req.url.startsWith('/uploads') ||
           (req.method === 'POST' && req.url === '/');
  }
});

// Middleware для логирования в файл (production)
const fileLogger = morgan(prodFormat, {
  stream: accessLogStream,
  skip: (req, res) => {
    // Пропускаем health check и спам-запросы на корень
    return req.url === '/health' ||
           (req.method === 'POST' && req.url === '/');
  }
});

// Middleware для логирования ошибок
const errorLogger = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const user = req.user ? req.user.username : 'anonymous';
  const errorLog = {
    timestamp,
    user,
    method: req.method,
    url: req.url,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack
    },
    body: req.body,
    params: req.params,
    query: req.query
  };

  // Удаляем чувствительные данные
  if (errorLog.body && errorLog.body.password) {
    errorLog.body.password = '[REDACTED]';
  }

  // Логируем в консоль в development
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', errorLog);
  }

  // Логируем в файл
  const errorLogStream = fs.createWriteStream(
    path.join(logsDir, 'error.log'),
    { flags: 'a' }
  );
  
  errorLogStream.write(JSON.stringify(errorLog) + '\n');
  errorLogStream.end();

  next(err);
};

// Middleware для логирования медленных запросов
const slowRequestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Логируем запросы, которые выполняются дольше 1 секунды
    if (duration > 1000) {
      const slowLog = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        user: req.user ? req.user.username : 'anonymous',
        userAgent: req.get('User-Agent')
      };
      
      console.warn('Slow request:', slowLog);
      
      // Записываем в файл медленных запросов
      const slowLogStream = fs.createWriteStream(
        path.join(logsDir, 'slow.log'),
        { flags: 'a' }
      );
      
      slowLogStream.write(JSON.stringify(slowLog) + '\n');
      slowLogStream.end();
    }
  });
  
  next();
};

// Middleware для логирования аутентификации
const authLogger = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Логируем попытки входа
    if (req.url === '/api/auth/login') {
      const authLog = {
        timestamp: new Date().toISOString(),
        email: req.body.email,
        success: res.statusCode === 200,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      };
      
      const authLogStream = fs.createWriteStream(
        path.join(logsDir, 'auth.log'),
        { flags: 'a' }
      );
      
      authLogStream.write(JSON.stringify(authLog) + '\n');
      authLogStream.end();
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = {
  consoleLogger,
  fileLogger,
  errorLogger,
  slowRequestLogger,
  authLogger
};