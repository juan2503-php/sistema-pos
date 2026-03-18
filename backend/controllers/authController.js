// ============================================
// Controlador de Autenticación
// ============================================
const authService = require('../services/authService');

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (error) {
    next(error.status ? error : { status: 500, message: error.message });
  }
};

const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json(user);
  } catch (error) {
    next(error.status ? error : { status: 500, message: error.message });
  }
};

const me = async (req, res) => {
  res.json(req.user);
};

module.exports = { login, register, me };
