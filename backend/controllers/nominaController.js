// ============================================
// Controlador de Nómina
// Thin controller — delega toda la lógica al service
// ============================================
const nominaService = require('../services/nominaService');

/**
 * GET /api/nomina/waiters?year=YYYY&month=M
 * Devuelve todos los meseros activos con cálculo de nómina del mes
 */
const getWaiters = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;

    if (month < 1 || month > 12) {
      return res.status(400).json({ error: 'Mes inválido (1-12)' });
    }

    const data = await nominaService.getWaitersWithPayroll(year, month);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/nomina/attendance/:userId?year=YYYY&month=M
 * Devuelve los días asistidos de un mesero en el mes
 */
const getAttendance = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;

    const days = await nominaService.getAttendanceByMonth(userId, year, month);
    res.json({ userId: parseInt(userId), year, month, attendedDays: days });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/nomina/attendance/toggle
 * Body: { userId, date: "YYYY-MM-DD" }
 * Marca o desmarca la asistencia de un día
 */
const toggleAttendance = async (req, res, next) => {
  try {
    const { userId, date } = req.body;

    if (!userId || !date) {
      return res.status(400).json({ error: 'userId y date son requeridos' });
    }

    // Validar formato de fecha
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Formato de fecha inválido. Use YYYY-MM-DD' });
    }

    const result = await nominaService.toggleAttendance(userId, date);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/nomina/salary-config/:userId
 * Body: { dailyRate: number }
 * Crea o actualiza el valor por día de un mesero
 */
const upsertSalaryConfig = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { dailyRate } = req.body;

    if (dailyRate === undefined || dailyRate === null) {
      return res.status(400).json({ error: 'dailyRate es requerido' });
    }

    const result = await nominaService.upsertSalaryConfig(userId, dailyRate);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/nomina/stats?year=YYYY&month=M
 * KPIs de nómina del mes
 */
const getStats = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;

    const stats = await nominaService.getDashboardStats(year, month);
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

module.exports = { getWaiters, getAttendance, toggleAttendance, upsertSalaryConfig, getStats };
