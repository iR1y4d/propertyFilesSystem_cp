require('dotenv').config();
const app = require('./app');
const { pool } = require('./config/db');

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

// Graceful shutdown helper (BP-09)
const shutdown = async (signal) => {
  console.log(`\n🔻 ${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await pool.end();
      console.log('✅ Database pool closed');
      process.exit(signal === 'UNCAUGHT_EXCEPTION' || signal === 'UNHANDLED_REJECTION' ? 1 : 0);
    } catch (err) {
      console.error('Error closing database pool:', err.message);
      process.exit(1);
    }
  });
  // Force exit after 10s
  setTimeout(() => {
    console.error('⚠️ Force exiting after timeout');
    process.exit(1);
  }, 10000);
};

// Handle uncaught exceptions (BP-02)
process.on('uncaughtException', (err) => {
  console.error(`❌ Uncaught Exception: ${err.message}`);
  console.error(err.stack);
  shutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  if (err.stack) console.error(err.stack);
  shutdown('UNHANDLED_REJECTION');
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
