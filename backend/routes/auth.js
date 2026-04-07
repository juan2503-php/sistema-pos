// Rutas de Autenticación (Hardened)
const router = require('express').Router();
const { login, register, me, refresh, logout } = require('../controllers/authController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');
const { loginValidation, registerValidation, refreshTokenValidation } = require('../middleware/validators');

router.post('/login', loginLimiter, loginValidation, login);
router.post('/register', verifyToken, requireRole('ADMIN'), registerValidation, register);
router.post('/refresh', refreshTokenValidation, refresh);
router.post('/logout', logout);
router.get('/me', verifyToken, me);

module.exports = router;
