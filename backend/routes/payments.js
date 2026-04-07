// Rutas de Pagos (Hardened)
const router = require('express').Router();
const { create, getByOrder, getAll } = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');
const { createPaymentValidation, idParamValidation } = require('../middleware/validators');

router.use(verifyToken);

router.get('/', getAll);
router.post('/', createPaymentValidation, create);
router.get('/order/:orderId', getByOrder);

module.exports = router;
