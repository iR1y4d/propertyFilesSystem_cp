const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON
app.use(cookieParser()); // Parse cookies

// Routes
app.use('/api/v1/auth', require('./routes/auth.routes.js'));
app.use('/api/v1/properties', require('./routes/property.routes.js'));
app.use('/api/v1/requests', require('./routes/request.routes.js'));
app.use('/api/v1/logs', require('./routes/log.routes.js'));
app.use('/api/v1/users', require('./routes/user.routes.js'));
app.use('/api/v1/reports', require('./routes/report.routes.js'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date() });
});

// Error handling
app.use(errorHandler);

module.exports = app;
