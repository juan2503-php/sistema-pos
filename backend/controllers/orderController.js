// ============================================
// Controlador de Órdenes
// ============================================
const orderService = require('../services/orderService');
const { getIO } = require('../sockets');

const getAll = async (req, res, next) => {
  try {
    const orders = await orderService.getAll(req.query);
    res.json(orders);
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const order = await orderService.getById(parseInt(req.params.id));
    res.json(order);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const order = await orderService.create(req.body, req.user.id);
    getIO().emit('new_order', order);
    res.status(201).json(order);
  } catch (error) { next(error); }
};

const updateStatus = async (req, res, next) => {
  try {
    const order = await orderService.updateStatus(parseInt(req.params.id), req.body.status);
    getIO().emit('order_updated', order);
    res.json(order);
  } catch (error) { next(error); }
};

const cancel = async (req, res, next) => {
  try {
    const result = await orderService.cancel(parseInt(req.params.id));
    getIO().emit('order_updated', result);
    res.json(result);
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const order = await orderService.update(parseInt(req.params.id), req.body, req.user.id);
    getIO().emit('order:updated', order);
    res.json(order);
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, updateStatus, cancel, update };
