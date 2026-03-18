// ============================================
// Servicio de Productos
// ============================================
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getAll = async (filters = {}) => {
  const where = {};
  if (filters.categoryId) where.categoryId = parseInt(filters.categoryId);
  if (filters.active !== undefined) where.active = filters.active === 'true';

  return prisma.product.findMany({
    where,
    include: { category: { select: { id: true, name: true } } },
    orderBy: { name: 'asc' },
  });
};

const getById = async (id) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true } } },
  });
  if (!product) throw { status: 404, message: 'Producto no encontrado' };
  return product;
};

const create = async (data) => {
  return prisma.product.create({
    data: {
      name: data.name,
      description: data.description,
      price: parseFloat(data.price),
      stock: parseInt(data.stock) || 0,
      minStock: parseInt(data.minStock) || 5,
      image: data.image,
      categoryId: parseInt(data.categoryId),
    },
    include: { category: { select: { id: true, name: true } } },
  });
};

const update = async (id, data) => {
  const updateData = {};
  if (data.name) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.price) updateData.price = parseFloat(data.price);
  if (data.stock !== undefined) updateData.stock = parseInt(data.stock);
  if (data.minStock !== undefined) updateData.minStock = parseInt(data.minStock);
  if (data.image !== undefined) updateData.image = data.image;
  if (data.categoryId) updateData.categoryId = parseInt(data.categoryId);
  if (data.active !== undefined) updateData.active = data.active;

  return prisma.product.update({
    where: { id },
    data: updateData,
    include: { category: { select: { id: true, name: true } } },
  });
};

const remove = async (id) => {
  return prisma.product.update({
    where: { id },
    data: { active: false },
  });
};

/**
 * Productos con stock bajo
 */
const getLowStock = async () => {
  return prisma.product.findMany({
    where: {
      active: true,
      stock: { lte: prisma.product.fields?.minStock || 5 },
    },
    include: { category: { select: { id: true, name: true } } },
  });
};

module.exports = { getAll, getById, create, update, remove, getLowStock };
