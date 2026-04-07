// ============================================
// Servicio de Autenticación (Hardened)
// Con Refresh Tokens y revocación
// ============================================
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const logger = require('../lib/logger');

/**
 * Registrar nuevo usuario (solo admin puede crear)
 */
const register = async ({ name, email, password, role }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw { status: 400, message: 'El email ya está registrado' };

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role: role || 'WAITER' },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return user;
};

/**
 * Login de usuario — retorna access token + refresh token
 */
const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw { status: 401, message: 'Credenciales incorrectas' };
  if (!user.active) throw { status: 401, message: 'Usuario desactivado' };

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw { status: 401, message: 'Credenciales incorrectas' };

  // Access token corto (1 hora)
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h' }
  );

  // Refresh token (7 días)
  const refreshToken = crypto.randomBytes(40).toString('hex');
  const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: refreshExpiry,
    },
  });

  // Limpiar refresh tokens expirados de este usuario
  await prisma.refreshToken.deleteMany({
    where: { userId: user.id, expiresAt: { lt: new Date() } },
  });

  logger.info('User logged in', { userId: user.id, email: user.email });

  return {
    token: accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
};

/**
 * Renovar access token usando refresh token
 */
const refresh = async (refreshToken) => {
  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: { select: { id: true, name: true, email: true, role: true, active: true } } },
  });

  if (!stored || stored.expiresAt < new Date()) {
    if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw { status: 401, message: 'Refresh token inválido o expirado' };
  }

  if (!stored.user.active) {
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw { status: 401, message: 'Usuario desactivado' };
  }

  const accessToken = jwt.sign(
    { userId: stored.user.id, role: stored.user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h' }
  );

  return {
    token: accessToken,
    user: stored.user,
  };
};

/**
 * Logout — invalidar refresh token
 */
const logout = async (refreshToken) => {
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }
};

module.exports = { register, login, refresh, logout };
