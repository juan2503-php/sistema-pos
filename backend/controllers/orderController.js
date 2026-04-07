// ============================================
// Controlador de Órdenes (Hardened)
// Eventos estandarizados con namespace:action
// ============================================
const orderService = require('../services/orderService');

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
    res.status(201).json(order);
  } catch (error) { next(error); }
};

const updateStatus = async (req, res, next) => {
  try {
    const order = await orderService.updateStatus(parseInt(req.params.id), req.body.status);
    res.json(order);
  } catch (error) { next(error); }
};

const cancel = async (req, res, next) => {
  try {
    const result = await orderService.cancel(parseInt(req.params.id));
    res.json(result);
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const order = await orderService.update(parseInt(req.params.id), req.body, req.user.id);
    res.json(order);
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, updateStatus, cancel, update };
