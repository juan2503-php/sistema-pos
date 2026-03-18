// ============================================
// Servicio de Inventario
// ============================================
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Obtener productos con stock bajo (stock <= minStock)
 */
const getLowStock = async () => {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { category: { select: { name: true } } },
  });
  return products.filter((p) => p.stock <= p.minStock);
};

/**
 * Ajustar stock manualmente (entrada)
 */
const addStock = async (productId, quantity, reason) => {
  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.product.update({
      where: { id: parseInt(productId) },
      data: { stock: { increment: parseInt(quantity) } },
    });

    await tx.inventoryMovement.create({
      data: {
        productId: parseInt(productId),
        quantity: parseInt(quantity),
        type: 'IN',
        reason: reason || 'Entrada manual',
      },
    });

    return product;
  });
  return result;
};

/**
 * Historial de movimientos de inventario
 */
const getMovements = async (filters = {}) => {
  const where = {};
  if (filters.productId) where.productId = parseInt(filters.productId);
  if (filters.type) where.type = filters.type;

  return prisma.inventoryMovement.findMany({
    where,
    include: { product: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
    take: parseInt(filters.limit) || 100,
  });
};

/**
 * Obtener resumen de inventario
 */
const getSummary = async () => {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { category: { select: { name: true } } },
    orderBy: { stock: 'asc' },
  });

  const totalProducts = products.length;
  const lowStock = products.filter((p) => p.stock <= p.minStock);
  const outOfStock = products.filter((p) => p.stock === 0);

  return {
    totalProducts,
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,
    lowStockProducts: lowStock,
    outOfStockProducts: outOfStock,
    allProducts: products,
  };
};

module.exports = { getLowStock, addStock, getMovements, getSummary };
