// ============================================
// Servicio de Usuarios
// ============================================
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getAll = async () => {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
};

const getById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });
  if (!user) throw { status: 404, message: 'Usuario no encontrado' };
  return user;
};

const update = async (id, data) => {
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 12);
  }
  return prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, active: true },
  });
};

const remove = async (id) => {
  // Soft delete - solo desactivar
  return prisma.user.update({
    where: { id },
    data: { active: false },
  });
};

module.exports = { getAll, getById, update, remove };
