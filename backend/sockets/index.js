// ============================================
// Socket.io - Eventos en Tiempo Real (Hardened)
// Con autenticación JWT
// ============================================
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const logger = require('../lib/logger');

let io;

/**
 * Inicializa Socket.io en el servidor HTTP con autenticación
 */
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Middleware de autenticación para Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Token no proporcionado'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, role: true, active: true },
      });

      if (!user || !user.active) return next(new Error('Usuario no válido'));

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.user.name} (${socket.user.role})`);
    
    // Auto-join basado en rol autenticado
    socket.join(socket.user.role);

    socket.on('join:role', (role) => {
      // Solo permitir unirse a su propio rol
      if (role === socket.user.role) {
        socket.join(role);
      }
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.user.name}`);
    });
  });

  return io;
};

/**
 * Obtener la instancia de Socket.io
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io no inicializado');
  }
  return io;
};

module.exports = { initSocket, getIO };
