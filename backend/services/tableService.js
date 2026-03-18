// ============================================
// Servicio de Mesas
// ============================================
const { PrismaClient } = require('@prisma/client');
const { getIO } = require('../sockets');

const prisma = new PrismaClient();

const getAll = async () => {
  return prisma.table.findMany({
    include: {
      orders: {
        where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
        include: {
          items: { include: { product: { select: { name: true, price: true } } } },
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { number: 'asc' },
  });
};

const getById = async (id) => {
  const table = await prisma.table.findUnique({
    where: { id },
    include: {
      orders: {
        where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
        include: {
          items: { include: { product: true } },
          user: { select: { name: true } },
        },
      },
    },
  });
  if (!table) throw { status: 404, message: 'Mesa no encontrada' };
  return table;
};

const create = async (data) => {
  return prisma.table.create({
    data: {
      number: parseInt(data.number),
      capacity: parseInt(data.capacity) || 4,
    },
  });
};

const update = async (id, data) => {
  const updateData = {};
  if (data.number) updateData.number = parseInt(data.number);
  if (data.capacity) updateData.capacity = parseInt(data.capacity);
  if (data.status) updateData.status = data.status;

  const table = await prisma.table.update({
    where: { id },
    data: updateData,
  });

  // Emitir evento en tiempo real
  try {
    const io = getIO();
    io.emit('table:updated', table);
  } catch (e) { /* socket no listo */ }

  return table;
};

const remove = async (id) => {
  return prisma.table.delete({ where: { id } });
};

const updateStatus = async (id, status) => {
  const table = await prisma.table.update({
    where: { id },
    data: { status },
  });

  try {
    const io = getIO();
    io.emit('table:updated', table);
  } catch (e) { /* socket no listo */ }

  return table;
};

module.exports = { getAll, getById, create, update, remove, updateStatus };
