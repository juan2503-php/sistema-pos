// Rutas de Usuarios
const router = require('express').Router();
const { getAll, getById, update, remove } = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('ADMIN'));

router.get('/', getAll);
router.get('/:id', getById);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
