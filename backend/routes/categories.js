// Rutas de Categorías (Hardened)
const router = require('express').Router();
const { getAll, getById, create, update, remove } = require('../controllers/categoryController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { idParamValidation, createCategoryValidation, updateCategoryValidation } = require('../middleware/validators');

router.get('/', verifyToken, getAll);
router.get('/:id', verifyToken, idParamValidation, getById);
router.post('/', verifyToken, requireRole('ADMIN'), createCategoryValidation, create);
router.put('/:id', verifyToken, requireRole('ADMIN'), updateCategoryValidation, update);
router.delete('/:id', verifyToken, requireRole('ADMIN'), idParamValidation, remove);

module.exports = router;
