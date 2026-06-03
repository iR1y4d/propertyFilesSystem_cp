const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Sanity checks for essential environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ [Error] DATABASE_URL is not set! Database connection will fail.');
}
if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.warn('⚠️ [Warning] JWT secrets are not set! User authentication/login will fail.');
}

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});


// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
