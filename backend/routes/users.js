// Rutas de Usuarios (Hardened)
const router = require('express').Router();
const { getAll, getById, update, remove } = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { idParamValidation, updateUserValidation } = require('../middleware/validators');

router.use(verifyToken, requireRole('ADMIN'));

router.get('/', getAll);
router.get('/:id', idParamValidation, getById);
router.put('/:id', updateUserValidation, update);
router.delete('/:id', idParamValidation, remove);

module.exports = router;
