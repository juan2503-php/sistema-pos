// ============================================
// Controlador de Usuarios
// ============================================
const userService = require('../services/userService');

const getAll = async (req, res, next) => {
  try {
    const users = await userService.getAll();
    res.json(users);
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const user = await userService.getById(parseInt(req.params.id));
    res.json(user);
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const user = await userService.update(parseInt(req.params.id), req.body);
    res.json(user);
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    await userService.remove(parseInt(req.params.id));
    res.json({ message: 'Usuario desactivado correctamente' });
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, update, remove };
