// ============================================
// Controlador de Inventario
// ============================================
const inventoryService = require('../services/inventoryService');

const getLowStock = async (req, res, next) => {
  try {
    const products = await inventoryService.getLowStock();
    res.json(products);
  } catch (error) { next(error); }
};

const addStock = async (req, res, next) => {
  try {
    const { productId, quantity, reason } = req.body;
    const product = await inventoryService.addStock(productId, quantity, reason);
    res.json(product);
  } catch (error) { next(error); }
};

const getMovements = async (req, res, next) => {
  try {
    const movements = await inventoryService.getMovements(req.query);
    res.json(movements);
  } catch (error) { next(error); }
};

const getSummary = async (req, res, next) => {
  try {
    const summary = await inventoryService.getSummary();
    res.json(summary);
  } catch (error) { next(error); }
};

module.exports = { getLowStock, addStock, getMovements, getSummary };
