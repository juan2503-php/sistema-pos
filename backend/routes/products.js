// Rutas de Productos
const router = require('express').Router();
const { getAll, getById, create, update, remove } = require('../controllers/productController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, getAll);
router.get('/:id', verifyToken, getById);
router.post('/', verifyToken, requireRole('ADMIN'), create);
router.put('/:id', verifyToken, requireRole('ADMIN'), update);
router.delete('/:id', verifyToken, requireRole('ADMIN'), remove);

module.exports = router;
