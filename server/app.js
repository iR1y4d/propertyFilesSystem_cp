const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

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
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    console.warn(`⚠️ [CORS] Blocked request from origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true
}));
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON
app.use(cookieParser()); // Parse cookies

// Routes
app.use('/api/v1/auth', require('./routes/auth.routes.js'));
app.use('/api/v1', require('./routes/image.routes.js'));
app.use('/api/v1/properties', require('./routes/property.routes.js'));
app.use('/api/v1/requests', require('./routes/request.routes.js'));
app.use('/api/v1/logs', require('./routes/log.routes.js'));
app.use('/api/v1/users', require('./routes/user.routes.js'));
app.use('/api/v1/reports', require('./routes/report.routes.js'));

// Serve uploaded images (static files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve pending images (for admin review of employee uploads)
app.use('/uploads/pending', express.static(path.join(__dirname, 'uploads', 'pending')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date() });
});

// Error handling
app.use(errorHandler);

module.exports = app;
