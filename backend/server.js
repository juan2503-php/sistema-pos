// ============================================
// POS Restaurant - Server Entry Point (Hardened)
// ============================================
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const dotenv = require('dotenv');
const { apiLimiter } = require('./middleware/rateLimiter');
const { initSocket } = require('./sockets');
const logger = require('./lib/logger');

dotenv.config();

// ── Validar configuración crítica ──
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Variable de entorno ${envVar} no configurada. Abortando.`);
    process.exit(1);
  }
}

if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.length < 64) {
  logger.error('JWT_SECRET debe tener al menos 64 caracteres en producción');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

// ── Security Headers (Helmet) ──
app.use(helmet());
app.disable('x-powered-by');

// ── CORS ──
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsing con límite de tamaño ──
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Rate Limiting global ──
app.use('/api/', apiLimiter);

// ── Rutas API ──
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/products', require('./routes/products'));
app.use('/api/tables', require('./routes/tables'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/dashboard', require('./routes/dashboard'));

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ── Manejo global de errores (seguro) ──
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  });

  const isOperational = err.status && err.status < 500;

  res.status(err.status || 500).json({
    error: isOperational
      ? err.message
      : 'Error interno del servidor. Contacte al administrador.',
  });
});

// ── Manejo de excepciones no capturadas ──
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { message: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason });
  process.exit(1);
});

// ── Shutdown graceful ──
const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// ── Inicializar Socket.io ──
initSocket(server);

// ── Iniciar servidor ──
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  logger.info(`POS Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  logger.info('Socket.io ready');
});

module.exports = app;
