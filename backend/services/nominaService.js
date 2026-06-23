// ============================================
// Servicio de Nómina
// Gestiona asistencias y configuración de sueldos
// ============================================
const prisma = require('../lib/prisma');

/**
 * Obtiene todos los meseros activos con el cálculo de nómina
 * para el mes/año especificado.
 */
const getWaitersWithPayroll = async (year, month) => {
  // Rango del mes completo
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Último día del mes

  // Traer todos los meseros activos
  const waiters = await prisma.user.findMany({
    where: { role: 'WAITER', active: true },
    select: {
      id: true,
      name: true,
      email: true,
      attendances: {
        where: {
          date: { gte: startDate, lte: endDate },
          attended: true,
        },
        select: { id: true, date: true, attended: true },
      },
      salaryConfig: {
        select: { dailyRate: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return waiters.map((w) => {
    const dailyRate = w.salaryConfig ? parseFloat(w.salaryConfig.dailyRate) : 70000;
    const daysWorked = w.attendances.length;
    const totalSalary = daysWorked * dailyRate;

    return {
      id: w.id,
      name: w.name,
      email: w.email,
      daysWorked,
      dailyRate,
      totalSalary,
    };
  });
};

/**
 * Devuelve el mapa de asistencias de un mesero para el mes/año dado.
 * Retorna un array de fechas (ISO strings) en las que asistió.
 */
const getAttendanceByMonth = async (userId, year, month) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const records = await prisma.attendance.findMany({
    where: {
      userId: parseInt(userId),
      date: { gte: startDate, lte: endDate },
      attended: true,
    },
    select: { date: true },
    orderBy: { date: 'asc' },
  });

  return records.map((r) => {
    const d = new Date(r.date);
    // Formatear a YYYY-MM-DD en UTC para consistencia
    return d.toISOString().split('T')[0];
  });
};

/**
 * Marca o desmarca la asistencia de un día.
 * Si el registro existe y ya está en `attended=true`, lo pone en false (toggle).
 * Si no existe o está en false, crea/activa el registro.
 */
const toggleAttendance = async (userId, dateStr) => {
  const parsedUserId = parseInt(userId);

  // Normalizar fecha a medianoche UTC para consistencia en DB
  const dateParts = dateStr.split('-');
  const date = new Date(
    Date.UTC(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]))
  );

  // Buscar registro existente
  const existing = await prisma.attendance.findUnique({
    where: { userId_date: { userId: parsedUserId, date } },
  });

  if (existing) {
    // Toggle: invertir el estado
    const updated = await prisma.attendance.update({
      where: { userId_date: { userId: parsedUserId, date } },
      data: { attended: !existing.attended },
    });
    return { attended: updated.attended, date: dateStr };
  } else {
    // Crear nuevo registro de asistencia
    const created = await prisma.attendance.create({
      data: { userId: parsedUserId, date, attended: true },
    });
    return { attended: created.attended, date: dateStr };
  }
};

/**
 * Crea o actualiza el valor diario (COP) para un mesero.
 */
const upsertSalaryConfig = async (userId, dailyRate) => {
  const parsedUserId = parseInt(userId);
  const parsedRate = parseFloat(dailyRate);

  if (isNaN(parsedRate) || parsedRate < 0) {
    throw { status: 400, message: 'El valor por día debe ser un número positivo' };
  }

  const config = await prisma.salaryConfig.upsert({
    where: { userId: parsedUserId },
    update: { dailyRate: parsedRate },
    create: { userId: parsedUserId, dailyRate: parsedRate },
  });

  return { userId: parsedUserId, dailyRate: parseFloat(config.dailyRate) };
};

/**
 * KPIs de nómina para el mes: total meseros, días totales, nómina total, promedio.
 */
const getDashboardStats = async (year, month) => {
  const waiters = await getWaitersWithPayroll(year, month);

  const totalWaiters = waiters.length;
  const totalDays = waiters.reduce((sum, w) => sum + w.daysWorked, 0);
  const totalPayroll = waiters.reduce((sum, w) => sum + w.totalSalary, 0);
  const avgSalary = totalWaiters > 0 ? totalPayroll / totalWaiters : 0;

  return { totalWaiters, totalDays, totalPayroll, avgSalary };
};

module.exports = {
  getWaitersWithPayroll,
  getAttendanceByMonth,
  toggleAttendance,
  upsertSalaryConfig,
  getDashboardStats,
};
