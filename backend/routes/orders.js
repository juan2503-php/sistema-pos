// Rutas de Órdenes (Hardened)
const router = require('express').Router();
const { getAll, getById, create, updateStatus, cancel, update } = require('../controllers/orderController');
const { verifyToken } = require('../middleware/auth');
const { idParamValidation, createOrderValidation, updateOrderValidation, updateOrderStatusValidation } = require('../middleware/validators');

router.use(verifyToken);

router.get('/', getAll);
router.get('/:id', idParamValidation, getById);
router.post('/', createOrderValidation, create);
router.put('/:id', updateOrderValidation, update);
router.patch('/:id/status', updateOrderStatusValidation, updateStatus);
router.patch('/:id/cancel', idParamValidation, cancel);

module.exports = router;
