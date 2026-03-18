// Rutas de Autenticación
const router = require('express').Router();
const { login, register, me } = require('../controllers/authController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.post('/login', login);
router.post('/register', verifyToken, requireRole('ADMIN'), register);
router.get('/me', verifyToken, me);

module.exports = router;
