// ============================================
// Servicio de Categorías (Hardened)
// ============================================
const prisma = require('../lib/prisma');

const getAll = async () => {
  return prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  });
};

const getById = async (id) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { products: true },
  });
  if (!category) throw { status: 404, message: 'Categoría no encontrada' };
  return category;
};

const create = async (data) => {
  // Whitelist de campos
  return prisma.category.create({
    data: {
      name: data.name,
      icon: data.icon || null,
    },
  });
};

const update = async (id, data) => {
  // Whitelist de campos
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.icon !== undefined) updateData.icon = data.icon;
  if (data.active !== undefined) updateData.active = data.active;

  return prisma.category.update({ where: { id }, data: updateData });
};

const remove = async (id) => {
  return prisma.category.update({
    where: { id },
    data: { active: false },
  });
};

module.exports = { getAll, getById, create, update, remove };
