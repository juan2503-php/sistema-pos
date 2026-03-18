// ============================================
// Servicio de Órdenes
// ============================================
const { PrismaClient } = require('@prisma/client');
const { getIO } = require('../sockets');
const inventoryService = require('./inventoryService');

const prisma = new PrismaClient();

/**
 * Obtener todas las órdenes con filtros opcionales
 */
const getAll = async (filters = {}) => {
  const where = {};
  if (filters.status) {
    where.status = Array.isArray(filters.status) ? { in: filters.status } : filters.status;
  }
  if (filters.tableId) where.tableId = parseInt(filters.tableId);
  if (filters.userId) where.userId = parseInt(filters.userId);

  return prisma.order.findMany({
    where,
    include: {
      table: { select: { id: true, number: true } },
      user: { select: { id: true, name: true } },
      items: {
        include: { product: { select: { id: true, name: true, price: true } } },
      },
      payments: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

const getById = async (id) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      table: true,
      user: { select: { id: true, name: true } },
      items: { include: { product: true } },
      payments: true,
    },
  });
  if (!order) throw { status: 404, message: 'Orden no encontrada' };
  return order;
};

/**
 * Crear nueva orden con items
 */
const create = async (data, userId) => {
  const { tableId, items, notes } = data;

  // Calcular totales y verificar productos
  let total = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: parseInt(item.productId) } });
    if (!product) throw { status: 404, message: `Producto ${item.productId} no encontrado` };
    if (!product.active) throw { status: 400, message: `Producto "${product.name}" no disponible` };
    if (product.stock < item.quantity) {
      throw { status: 400, message: `Stock insuficiente para "${product.name}". Disponible: ${product.stock}` };
    }

    const subtotal = parseFloat(product.price) * parseInt(item.quantity);
    total += subtotal;

    orderItems.push({
      productId: product.id,
      quantity: parseInt(item.quantity),
      unitPrice: parseFloat(product.price),
      subtotal,
      notes: item.notes || null,
    });
  }

  // Crear orden con items en una transacción
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        tableId: parseInt(tableId),
        userId,
        notes,
        total,
        items: { create: orderItems },
      },
      include: {
        table: { select: { id: true, number: true } },
        user: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, price: true } } } },
      },
    });

    // Actualizar mesa a OCCUPIED
    await tx.table.update({
      where: { id: parseInt(tableId) },
      data: { status: 'OCCUPIED' },
    });

    // Descontar inventario
    for (const item of orderItems) {
      const updatedProduct = await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          quantity: -item.quantity,
          type: 'OUT',
          reason: `Orden #${newOrder.id}`,
        },
      });
    }

    return newOrder;
  });

  // Emitir eventos en tiempo real
  try {
    const io = getIO();
    io.emit('order:created', order);
    io.emit('table:updated', { id: parseInt(tableId), status: 'OCCUPIED' });
  } catch (e) { /* socket no listo */ }

  return order;
};

/**
 * Actualizar estado de la orden
 */
const updateStatus = async (id, status) => {
  const order = await prisma.order.update({
    where: { id },
    data: { status },
    include: {
      table: { select: { id: true, number: true } },
      user: { select: { id: true, name: true } },
      items: { include: { product: { select: { id: true, name: true } } } },
    },
  });

  try {
    const io = getIO();
    io.emit('order:updated', order);
  } catch (e) { /* socket no listo */ }

  return order;
};

/**
 * Cancelar orden y restaurar stock
 */
const cancel = async (id) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) throw { status: 404, message: 'Orden no encontrada' };

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id }, data: { status: 'CANCELLED' } });

    // Restaurar stock
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          type: 'IN',
          reason: `Cancelación orden #${id}`,
        },
      });
    }
  });

  try {
    const io = getIO();
    io.emit('order:updated', { id, status: 'CANCELLED' });
  } catch (e) { /* socket no listo */ }

  return { message: 'Orden cancelada y stock restaurado' };
};

/**
 * Actualizar pedido (modificar items)
 */
const update = async (id, data, userId) => {
  const { items, notes } = data;
  
  const existingOrder = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!existingOrder) throw { status: 404, message: 'Orden no encontrada' };

  // Validar si la orden se puede editar
  if (existingOrder.status === 'COMPLETED' || existingOrder.status === 'CANCELLED') {
    throw { status: 400, message: 'No se puede editar una orden completada o cancelada' };
  }

  // Pre-verificar productos y calcular nuevo total
  let newTotal = 0;
  const newOrderItems = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: parseInt(item.productId) } });
    if (!product) throw { status: 404, message: `Producto ${item.productId} no encontrado` };
    if (!product.active) throw { status: 400, message: `Producto "${product.name}" inactivo` };

    // Determinar la diferencia de stock (si el item ya existía, considerar el stock que ya ocupaba)
    const existingItem = existingOrder.items.find(i => i.productId === product.id);
    const existingQuantity = existingItem ? existingItem.quantity : 0;
    const difference = parseInt(item.quantity) - existingQuantity;

    if (difference > 0 && product.stock < difference) {
      throw { status: 400, message: `Stock insuficiente para "${product.name}". Disp: ${product.stock}` };
    }

    const subtotal = parseFloat(product.price) * parseInt(item.quantity);
    newTotal += subtotal;

    newOrderItems.push({
      productId: product.id,
      quantity: parseInt(item.quantity),
      unitPrice: parseFloat(product.price),
      subtotal,
      notes: item.notes || null,
    });
  }

  // Realizar la transacción
  const updatedOrder = await prisma.$transaction(async (tx) => {
    // 1. Restaurar stock de los items viejos
    for (const oldItem of existingOrder.items) {
      await tx.product.update({
        where: { id: oldItem.productId },
        data: { stock: { increment: oldItem.quantity } },
      });
      await tx.inventoryMovement.create({
        data: {
           productId: oldItem.productId,
           quantity: oldItem.quantity,
           type: 'IN',
           reason: `Edición orden #${id} (Rollback temporal)`,
        }
      });
    }

    // 2. Eliminar los items viejos
    await tx.orderItem.deleteMany({
      where: { orderId: id }
    });

    // 3. Crear los nuevos items y actualizar orden
    const newOrder = await tx.order.update({
      where: { id },
      data: {
        total: newTotal,
        notes: notes !== undefined ? notes : existingOrder.notes,
        items: { create: newOrderItems },
      },
      include: {
        table: { select: { id: true, number: true } },
        user: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, price: true } } } },
      },
    });

    // 4. Descontar stock de los nuevos items reales
    for (const newItem of newOrderItems) {
      const updatedProduct = await tx.product.update({
        where: { id: newItem.productId },
        data: { stock: { decrement: newItem.quantity } },
      });
      await tx.inventoryMovement.create({
        data: {
           productId: newItem.productId,
           quantity: -newItem.quantity,
           type: 'OUT',
           reason: `Edición orden #${id} (Ajuste)`,
        }
      });
    }

    return newOrder;
  });

  return updatedOrder;
};

module.exports = { getAll, getById, create, updateStatus, cancel, update };
