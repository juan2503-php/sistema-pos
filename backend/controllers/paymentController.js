// ============================================
// Controlador de Pagos (Hardened)
// ============================================
const paymentService = require('../services/paymentService');

const create = async (req, res, next) => {
  try {
    const payment = await paymentService.create(req.body);
    res.status(201).json(payment);
  } catch (error) { next(error); }
};

const getByOrder = async (req, res, next) => {
  try {
    const payments = await paymentService.getByOrder(req.params.orderId);
    res.json(payments);
  } catch (error) { next(error); }
};

const getAll = async (req, res, next) => {
  try {
    const payments = await paymentService.getAll(req.query);
    res.json(payments);
  } catch (error) { next(error); }
};

module.exports = { create, getByOrder, getAll };
