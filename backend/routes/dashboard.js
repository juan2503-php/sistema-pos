const router = require('express').Router();
const { getMetrics } = require('../controllers/dashboardController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, requireRole('ADMIN'), getMetrics);

module.exports = router;
