// Rutas de Mesas (Hardened)
const router = require('express').Router();
const { getAll, getById, create, update, remove, updateStatus } = require('../controllers/tableController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { idParamValidation, createTableValidation, updateTableValidation, updateTableStatusValidation } = require('../middleware/validators');

router.get('/', verifyToken, getAll);
router.get('/:id', verifyToken, idParamValidation, getById);
router.post('/', verifyToken, requireRole('ADMIN'), createTableValidation, create);
router.put('/:id', verifyToken, requireRole('ADMIN'), updateTableValidation, update);
router.patch('/:id/status', verifyToken, updateTableStatusValidation, updateStatus);
router.delete('/:id', verifyToken, requireRole('ADMIN'), idParamValidation, remove);

module.exports = router;
