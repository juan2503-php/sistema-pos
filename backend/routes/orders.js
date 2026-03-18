// Rutas de Órdenes
const router = require('express').Router();
const { getAll, getById, create, updateStatus, cancel, update } = require('../controllers/orderController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.patch('/:id/status', updateStatus);
router.patch('/:id/cancel', cancel);

module.exports = router;
