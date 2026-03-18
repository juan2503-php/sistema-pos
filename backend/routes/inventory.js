// Rutas de Inventario
const router = require('express').Router();
const { getLowStock, addStock, getMovements, getSummary } = require('../controllers/inventoryController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/summary', getSummary);
router.get('/low-stock', getLowStock);
router.get('/movements', getMovements);
router.post('/add-stock', requireRole('ADMIN'), addStock);

module.exports = router;
