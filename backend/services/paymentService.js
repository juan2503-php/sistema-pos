// ============================================
// Servicio de Pagos (Hardened)
// Eventos estandarizados: order:updated, table:updated
// ============================================
const prisma = require('../lib/prisma');
const { getIO } = require('../sockets');
const logger = require('../lib/logger');

/**
 * Crear un pago para una orden
 */
const create = async (data) => {
  const { orderId, amount, method } = data;

  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
    include: { payments: true, table: true },
  });
  if (!order) throw { status: 404, message: 'Orden no encontrada' };

  const totalPaid = order.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const remaining = parseFloat(order.total) - totalPaid;

  if (parseFloat(amount) > remaining + 0.01) {
    throw { status: 400, message: `Monto excede el saldo pendiente: $${remaining.toFixed(2)}` };
  }

  const payment = await prisma.$transaction(async (tx) => {
    const newPayment = await tx.payment.create({
      data: {
        orderId: parseInt(orderId),
        amount: parseFloat(amount),
        method: method || 'CASH',
      },
    });

    const newTotalPaid = totalPaid + parseFloat(amount);
    const orderCompleted = newTotalPaid >= parseFloat(order.total) - 0.01;

    // Si se completó el pago, marcar orden como completada
    if (orderCompleted) {
      await tx.order.update({
        where: { id: parseInt(orderId) },
        data: { status: 'COMPLETED' },
      });

      // Verificar si la mesa tiene más órdenes activas
      const activeOrders = await tx.order.count({
        where: {
          tableId: order.tableId,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          id: { not: parseInt(orderId) },
        },
      });

      if (activeOrders === 0) {
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: 'FREE' },
        });
      }
    }

    return { payment: newPayment, orderCompleted };
  });

  // Emitir eventos solo si corresponde
  try {
    const io = getIO();
    if (payment.orderCompleted) {
      io.emit('order:updated', { id: parseInt(orderId), status: 'COMPLETED' });
      io.emit('table:updated', { id: order.tableId, status: 'FREE' });
    }
  } catch (e) { /* socket no listo */ }

  logger.info('Payment created', { orderId, amount, method: method || 'CASH' });

  return payment.payment;
};

/**
 * Obtener pagos de una orden
 */
const getByOrder = async (orderId) => {
  return prisma.payment.findMany({
    where: { orderId: parseInt(orderId) },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Obtener todos los pagos
 */
const getAll = async (filters = {}) => {
  const where = {};
  if (filters.method) where.method = filters.method;

  // Filtro por fecha
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt.gte = new Date(filters.from);
    if (filters.to) where.createdAt.lte = new Date(filters.to);
  }

  return prisma.payment.findMany({
    where,
    include: {
      order: {
        select: { id: true, tableId: true, total: true, table: { select: { number: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

module.exports = { create, getByOrder, getAll };
