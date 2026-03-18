// ============================================
// Controlador de Dashboard
// ============================================
const dashboardService = require('../services/dashboardService');

const getMetrics = async (req, res, next) => {
  try {
    const metrics = await dashboardService.getMetrics(req.query);
    res.json(metrics);
  } catch (error) { next(error); }
};

module.exports = { getMetrics };
