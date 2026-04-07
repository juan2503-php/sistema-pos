// ============================================
// Rate Limiting - Protección contra fuerza bruta
// ============================================
const rateLimit = require('express-rate-limit');

// Rate limiter general para toda la API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones, intenta de nuevo más tarde' },
});

// Rate limiter estricto para login (anti brute force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de login. Intenta en 15 minutos.' },
});

module.exports = { apiLimiter, loginLimiter };
