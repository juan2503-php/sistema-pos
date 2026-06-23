// ============================================
// Rutas de Nómina
// Solo accesibles por ADMIN
// ============================================
const router = require('express').Router();
const {
  getWaiters,
  getAttendance,
  toggleAttendance,
  upsertSalaryConfig,
  getStats,
} = require('../controllers/nominaController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Todas las rutas de nómina requieren autenticación y rol ADMIN
router.use(verifyToken, requireRole('ADMIN'));

// GET /api/nomina/waiters?year=YYYY&month=M
router.get('/waiters', getWaiters);

// GET /api/nomina/stats?year=YYYY&month=M
router.get('/stats', getStats);

// GET /api/nomina/attendance/:userId?year=YYYY&month=M
router.get('/attendance/:userId', getAttendance);

// POST /api/nomina/attendance/toggle — Body: { userId, date }
router.post('/attendance/toggle', toggleAttendance);

// PUT /api/nomina/salary-config/:userId — Body: { dailyRate }
router.put('/salary-config/:userId', upsertSalaryConfig);

module.exports = router;
