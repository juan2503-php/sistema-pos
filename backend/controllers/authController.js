// ============================================
// Controlador de Autenticación (Hardened)
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

const refresh = async (req, res, next) => {
  try {
    const result = await authService.refresh(req.body.refreshToken);
    res.json(result);
  } catch (error) {
    next(error.status ? error : { status: 500, message: error.message });
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.body.refreshToken);
    res.json({ message: 'Sesión cerrada correctamente' });
  } catch (error) {
    next(error.status ? error : { status: 500, message: error.message });
  }
};

module.exports = { login, register, me, refresh, logout };
