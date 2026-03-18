// ============================================
// Controlador de Mesas
// ============================================
const tableService = require('../services/tableService');

const getAll = async (req, res, next) => {
  try {
    const tables = await tableService.getAll();
    res.json(tables);
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const table = await tableService.getById(parseInt(req.params.id));
    res.json(table);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const table = await tableService.create(req.body);
    res.status(201).json(table);
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const table = await tableService.update(parseInt(req.params.id), req.body);
    res.json(table);
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    await tableService.remove(parseInt(req.params.id));
    res.json({ message: 'Mesa eliminada' });
  } catch (error) { next(error); }
};

const updateStatus = async (req, res, next) => {
  try {
    const table = await tableService.updateStatus(parseInt(req.params.id), req.body.status);
    res.json(table);
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, update, remove, updateStatus };
