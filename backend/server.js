// ============================================
// POS Restaurant - Server Entry Point
// ============================================
const express = require('express');
const cors = require('cors');
const http = require('http');
const dotenv = require('dotenv');
const { initSocket } = require('./sockets');

dotenv.config();

const app = express();
const server = http.createServer(app);

// ── Middleware global ──
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// ── Manejo global de errores ──
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
  });
});

// ── Inicializar Socket.io ──
initSocket(server);

// ── Iniciar servidor ──
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 POS Server corriendo en http://localhost:${PORT}`);
  console.log(`📡 Socket.io listo`);
});
