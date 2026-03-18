// Rutas de Pagos
const router = require('express').Router();
const { create, getByOrder, getAll } = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', getAll);
router.post('/', create);
router.get('/order/:orderId', getByOrder);

module.exports = router;
