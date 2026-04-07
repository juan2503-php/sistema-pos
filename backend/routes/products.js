// Rutas de Productos (Hardened)
const router = require('express').Router();
const { getAll, getById, create, update, remove } = require('../controllers/productController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { idParamValidation, createProductValidation, updateProductValidation } = require('../middleware/validators');

router.get('/', verifyToken, getAll);
router.get('/:id', verifyToken, idParamValidation, getById);
router.post('/', verifyToken, requireRole('ADMIN'), createProductValidation, create);
router.put('/:id', verifyToken, requireRole('ADMIN'), updateProductValidation, update);
router.delete('/:id', verifyToken, requireRole('ADMIN'), idParamValidation, remove);

module.exports = router;
