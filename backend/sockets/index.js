// ============================================
// Socket.io - Eventos en Tiempo Real
// ============================================
const { Server } = require('socket.io');

let io;

/**
 * Inicializa Socket.io en el servidor HTTP
 */
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    // Unirse a sala por rol
    socket.on('join:role', (role) => {
      socket.join(role);
      console.log(`👤 ${socket.id} se unió a sala: ${role}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Cliente desconectado: ${socket.id}`);
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
