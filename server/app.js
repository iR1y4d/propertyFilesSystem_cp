const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const authMiddleware = require('./middleware/auth');
const { query } = require('./config/db');

const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
})); // Security headers
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // In production, reject no-origin requests
    if (!origin && process.env.NODE_ENV === 'production') {
      return callback(new Error('CORS: Origin required'), false);
    }
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    console.warn(`⚠️ [CORS] Blocked request from origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true
}));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')); // Logging

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 10000 : 100, // 10000 in dev, 100 in prod
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

app.use(express.json({ limit: '1mb' })); // Parse JSON
app.use(cookieParser()); // Parse cookies

// Routes
app.use('/api/v1/auth', require('./routes/auth.routes.js'));
app.use('/api/v1', require('./routes/image.routes.js'));
app.use('/api/v1/properties', require('./routes/property.routes.js'));
app.use('/api/v1/requests', require('./routes/request.routes.js'));
app.use('/api/v1/logs', require('./routes/log.routes.js'));
app.use('/api/v1/users', require('./routes/user.routes.js'));
app.use('/api/v1/reports', require('./routes/report.routes.js'));

const staticAuth = require('./middleware/staticAuth');

// Serve uploaded images (static files) — require authentication (via Bearer token or HttpOnly cookie)
app.use('/uploads', staticAuth, express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'UP', database: 'connected', timestamp: new Date() });
  } catch (err) {
    res.status(503).json({ status: 'DOWN', database: 'disconnected', timestamp: new Date() });
  }
});

// Error handling
app.use(errorHandler);

module.exports = app;
