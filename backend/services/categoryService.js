// ============================================
// Servicio de Categorías
// ============================================
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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
  return prisma.category.create({ data });
};

const update = async (id, data) => {
  return prisma.category.update({ where: { id }, data });
};

const remove = async (id) => {
  return prisma.category.update({
    where: { id },
    data: { active: false },
  });
};

module.exports = { getAll, getById, create, update, remove };
