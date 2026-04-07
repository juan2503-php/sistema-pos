// ============================================
// Servicio de Dashboard / Analíticas (Hardened)
// ============================================
const prisma = require('../lib/prisma');

/**
 * Obtener métricas del dashboard
 */
const getMetrics = async (dateRange = {}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Ventas del día
  const todayOrders = await prisma.order.findMany({
    where: {
      status: 'COMPLETED',
      createdAt: { gte: today, lt: tomorrow },
    },
  });

  const todayRevenue = todayOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);

  // Ventas del mes
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthOrders = await prisma.order.findMany({
    where: {
      status: 'COMPLETED',
      createdAt: { gte: monthStart },
    },
  });
  const monthRevenue = monthOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);

  // Mesas atendidas hoy
  const tablesServedToday = await prisma.order.count({
    where: {
      createdAt: { gte: today, lt: tomorrow },
      status: { not: 'CANCELLED' },
    },
  });

  // Órdenes activas
  const activeOrders = await prisma.order.count({
    where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
  });

  // Productos más vendidos (top 10)
  const topProducts = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true, subtotal: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 10,
  });

  // Enriquecer con nombres
  const topProductsWithNames = await Promise.all(
    topProducts.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { name: true, price: true },
      });
      return {
        productId: item.productId,
        name: product?.name || 'Desconocido',
        price: product?.price,
        totalSold: item._sum.quantity,
        totalRevenue: item._sum.subtotal,
      };
    })
  );

  // Ventas por día (últimos 7 días)
  const salesByDay = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(today);
    dayStart.setDate(today.getDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    const dayOrders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: dayStart, lt: dayEnd },
      },
    });

    salesByDay.push({
      date: dayStart.toISOString().split('T')[0],
      orders: dayOrders.length,
      revenue: dayOrders.reduce((sum, o) => sum + parseFloat(o.total), 0),
    });
  }

  // Productos con stock bajo
  const lowStockProducts = await prisma.product.findMany({
    where: { active: true },
    include: { category: { select: { name: true } } },
  });
  const lowStock = lowStockProducts.filter((p) => p.stock <= p.minStock);

  return {
    todayRevenue,
    todayOrders: todayOrders.length,
    monthRevenue,
    monthOrders: monthOrders.length,
    tablesServedToday,
    activeOrders,
    topProducts: topProductsWithNames,
    salesByDay,
    lowStockCount: lowStock.length,
  };
};

module.exports = { getMetrics };
