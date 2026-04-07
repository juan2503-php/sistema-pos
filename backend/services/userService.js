// ============================================
// Servicio de Usuarios (Hardened)
// Whitelist de campos - previene mass assignment
// ============================================
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

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
  // ✅ WHITELIST — Solo permitir campos seguros (el rol NO se puede cambiar aquí)
  const allowedFields = ['name', 'email', 'password', 'active'];
  const updateData = {};

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 12);
  }

  return prisma.user.update({
    where: { id },
    data: updateData,
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
