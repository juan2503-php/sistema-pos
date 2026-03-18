// ============================================
// Controlador de Categorías
// ============================================
const categoryService = require('../services/categoryService');

const getAll = async (req, res, next) => {
  try {
    const categories = await categoryService.getAll();
    res.json(categories);
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const category = await categoryService.getById(parseInt(req.params.id));
    res.json(category);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const category = await categoryService.create(req.body);
    res.status(201).json(category);
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const category = await categoryService.update(parseInt(req.params.id), req.body);
    res.json(category);
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    await categoryService.remove(parseInt(req.params.id));
    res.json({ message: 'Categoría desactivada' });
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, update, remove };
