// Rutas de Inventario (Hardened)
const router = require('express').Router();
const { getLowStock, addStock, getMovements, getSummary } = require('../controllers/inventoryController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { addStockValidation } = require('../middleware/validators');

router.use(verifyToken);

router.get('/summary', getSummary);
router.get('/low-stock', getLowStock);
router.get('/movements', getMovements);
router.post('/add-stock', requireRole('ADMIN'), addStockValidation, addStock);

module.exports = router;
