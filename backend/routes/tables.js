// Rutas de Mesas
const router = require('express').Router();
const { getAll, getById, create, update, remove, updateStatus } = require('../controllers/tableController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, getAll);
router.get('/:id', verifyToken, getById);
router.post('/', verifyToken, requireRole('ADMIN'), create);
router.put('/:id', verifyToken, requireRole('ADMIN'), update);
router.patch('/:id/status', verifyToken, updateStatus);
router.delete('/:id', verifyToken, requireRole('ADMIN'), remove);

module.exports = router;
