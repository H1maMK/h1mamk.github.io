const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const path = require('path');

// Import database connection
const connectDB = require('./config/database');

// Import custom middleware
const { consoleLogger, fileLogger, errorLogger, slowRequestLogger, authLogger } = require('./middleware/logger');
const { checkDbConnection } = require('./middleware/dbCheck');

const app = express();
const uploadsPath = path.join(__dirname, 'uploads');

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https:",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      frameSrc: ["'self'", "https://www.openstreetmap.org"],
      connectSrc: [
        "'self'",
        "https:",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
      ]
    }
  }
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  skip: (req) => req.path.startsWith('/api/image/'),
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api/', limiter);

// CORS configuration
const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
];

const configuredOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((url) => url.trim()).filter(Boolean)
  : [];

const allowedOrigins = [...new Set([...defaultOrigins, ...configuredOrigins])];

const isAllowedDevOrigin = (origin) => {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  try {
    const { protocol, hostname, port } = new URL(origin);
    const isHttp = protocol === 'http:' || protocol === 'https:';
    const isVitePort = port === '3000' || port === '3001' || port === '5173';
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isPrivateLan = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(hostname);

    return isHttp && isVitePort && (isLocalHost || isPrivateLan);
  } catch (err) {
    return false;
  }
};

app.use(cors({
  origin: function (origin, callback) {
    // Разрешаем запросы без origin (например, мобильные приложения, Postman или Vite proxy)
    if (!origin) return callback(null, true);
    
    // Разрешаем любой netlify.app домен
    if (origin.includes('netlify.app')) {
      return callback(null, true);
    }

    // Разрешаем localhost и настроенные origins
    if (allowedOrigins.includes(origin) || isAllowedDevOrigin(origin)) {
      return callback(null, true);
    }

    // В production разрешаем любой origin (чтобы не было CORS проблем)
    if (process.env.NODE_ENV === 'production') {
      return callback(null, true);
    }

    console.log('CORS blocked origin:', origin);
    return callback(null, false);
  },
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom logging middleware
app.use(slowRequestLogger);
app.use(authLogger);

// Проверка подключения к БД перед обработкой API запросов
app.use('/api', checkDbConnection);

// Logging middleware
if (process.env.NODE_ENV === 'production') {
  app.use(fileLogger);
} else {
  app.use(consoleLogger);
}

// Redirect /uploads/avatars/* → /api/image/avatars/* so the fallback to default.svg works
// (Uploaded files are ephemeral on Render, so they'll almost always be missing after restart)
// This MUST come before the generic /uploads static middleware
['avatars', 'products', 'articles'].forEach((type) => app.use(`/uploads/${type}`, (req, res, next) => {
  // Only redirect GET/HEAD — pass through other methods
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next();
  }

  // Extract the filename from the original URL and redirect to the image route
  const filename = req.path.replace(/^\//, '');
  if (filename) {
    return res.redirect(301, `/api/image/${type}/${filename}`);
  }
  next();
}));

// Legacy product/article images from JSON data were historically stored as `uploads/<file>`
// while the actual files now live in the frontend public root and are published as `/<file>`.
// On production these old URLs cause 404 in admin/product pages, so redirect flat legacy
// `/uploads/<file>` requests to the root static asset path. Nested paths like
// `/uploads/products/...` must keep working as-is and therefore are skipped here.
app.use('/uploads', (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next();
  }

  const requestedPath = req.path.replace(/^\//, '');
  if (!requestedPath || requestedPath.includes('/')) {
    return next();
  }

  return res.redirect(301, `/${encodeURIComponent(requestedPath)}`);
});

// Static files with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(uploadsPath));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: 'MongoDB'
  });
});

// Database status endpoint
app.get('/api/status', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    res.json({
      database: {
        status: states[dbState],
        name: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port
      },
      server: {
        status: 'running',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Unable to get status',
      message: error.message
    });
  }
});

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/image', require('./routes/image'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/sync', require('./routes/sync'));

// В production раздаём фронтенд как статику
if (process.env.NODE_ENV === 'production') {
  // Сначала пробуем dist в корне (если фронт собран вручную)
  const distPaths = [
    path.join(__dirname, '..', 'frontend', 'dist'),
    path.join(__dirname, '..', 'dist'),
  ];
  
  let distPath = null;
  for (const p of distPaths) {
    try {
      if (require('fs').existsSync(p)) {
        distPath = p;
        break;
      }
    } catch (e) {}
  }
  
  if (distPath) {
    console.log('📦 Раздаём фронтенд из:', distPath);
    app.use(express.static(distPath));
    
    // Все не-API запросы → index.html (SPA роутинг)
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/') || req.path.startsWith('/health')) {
        return res.status(404).json({ error: 'Route not found', path: req.originalUrl });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

// 404 handler (только для API путей, если фронтенд не нашёлся)
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Global error handler
app.use(errorLogger);
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.message
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID',
      message: 'Invalid resource ID format'
    });
  }
  
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      error: 'Duplicate Entry',
      message: `${field} already exists`
    });
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : err.message
  });
});

// Build frontend on first start (production)
const buildFrontend = async () => {
  if (process.env.NODE_ENV !== 'production') return;
  
  const { execSync } = require('child_process');
  const path = require('path');
  const fs = require('fs');
  
  const frontendDir = path.join(__dirname, '..', 'frontend');
  const distDir = path.join(frontendDir, 'dist');
  
  // Проверяем, есть ли уже собранный фронтенд
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    console.log('🏗️ Сборка фронтенда...');
    try {
      execSync('npm install && npm run build', {
        cwd: frontendDir,
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'production' }
      });
      console.log('✅ Фронтенд собран');
    } catch (err) {
      console.error('❌ Ошибка сборки фронтенда:', err.message);
    }
  }
};

// Start server
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  const startServer = async () => {
    // Сборка фронтенда (в production)
    await buildFrontend();
    
    // Запускаем сервер
    const server = app.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
      console.log(`📊 Режим: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Открой: http://localhost:${PORT}`);
    });

    // Подключаем MongoDB
    connectDB()
      .then(async () => {
        console.log('✅ MongoDB подключена успешно');
        const { autoInitDatabase } = require('./scripts/autoInit');
        await autoInitDatabase();
        console.log('✅ Сервер готов к работе');
      })
      .catch((err) => {
        console.error('⚠️ MongoDB недоступна:', err.message);
      });
  };
  
  startServer();
}

module.exports = app;
