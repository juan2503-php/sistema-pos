// ============================================
// Controlador de Pagos
// ============================================
const paymentService = require('../services/paymentService');
const { getIO } = require('../sockets');

const create = async (req, res, next) => {
  try {
    const payment = await paymentService.create(req.body);
    getIO().emit('order_updated', payment);
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
