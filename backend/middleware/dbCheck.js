const mongoose = require('mongoose');

const DB_READY_STATE = 1;
const WAIT_FOR_DB_TIMEOUT_MS = parseInt(process.env.DB_READY_TIMEOUT_MS, 10) || 12000;

const waitForDbConnection = (timeoutMs = WAIT_FOR_DB_TIMEOUT_MS) => new Promise((resolve) => {
  if (mongoose.connection.readyState === DB_READY_STATE) {
    resolve(true);
    return;
  }

  let settled = false;

  const finish = (result) => {
    if (settled) return;
    settled = true;
    clearTimeout(timeoutId);
    mongoose.connection.off('connected', handleConnected);
    mongoose.connection.off('error', handleFailure);
    mongoose.connection.off('disconnected', handleFailure);
    resolve(result);
  };

  const handleConnected = () => finish(true);
  const handleFailure = () => finish(false);

  const timeoutId = setTimeout(() => finish(mongoose.connection.readyState === DB_READY_STATE), timeoutMs);

  mongoose.connection.on('connected', handleConnected);
  mongoose.connection.on('error', handleFailure);
  mongoose.connection.on('disconnected', handleFailure);
});

const checkDbConnection = async (req, res, next) => {
  if (req.path.includes('/auth/')) {
    return next();
  }

  if (mongoose.connection.readyState !== DB_READY_STATE) {
    console.log('⚠️ Request received while DB is not ready, waiting for connection...');

    const isConnected = await waitForDbConnection();
    if (isConnected) {
      return next();
    }

    if (req.path.includes('/products') && req.method === 'GET') {
      return res.status(200).json({
        success: true,
        message: 'Database connecting, please wait...',
        data: [],
        pagination: {
          page: 1,
          limit: 12,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false
        }
      });
    }

    if (req.path.includes('/categories') && req.method === 'GET') {
      return res.status(200).json({
        success: true,
        message: 'Database connecting, please wait...',
        data: { categories: [] }
      });
    }

    return res.status(503).json({
      success: false,
      message: 'Database is temporarily unavailable. Please try again in a few seconds.'
    });
  }

  next();
};

module.exports = { checkDbConnection };
