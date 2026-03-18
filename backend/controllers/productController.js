// ============================================
// Controlador de Productos
// ============================================
const productService = require('../services/productService');

const getAll = async (req, res, next) => {
  try {
    const products = await productService.getAll(req.query);
    res.json(products);
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const product = await productService.getById(parseInt(req.params.id));
    res.json(product);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const product = await productService.create(req.body);
    res.status(201).json(product);
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const product = await productService.update(parseInt(req.params.id), req.body);
    res.json(product);
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    await productService.remove(parseInt(req.params.id));
    res.json({ message: 'Producto desactivado' });
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, update, remove };
