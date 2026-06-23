/**
 * ============================================================
 * reset-dashboard.js — Limpieza de datos de prueba
 * ============================================================
 * Borra SOLO los datos transaccionales:
 *   ✅  order_items   (items de órdenes)
 *   ✅  payments      (pagos)
 *   ✅  orders        (órdenes)
 *   ✅  inventory_movements (movimientos de inventario)
 *   ✅  audit_logs    (logs de auditoría)
 *   ✅  refresh_tokens (sesiones activas)
 *   ✅  Resetea todas las mesas a FREE
 *
 * NO toca: usuarios, productos, categorías, settings
 * IDs reseteados a 1 (TRUNCATE)
 * ============================================================
 */

const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const confirm = (question) =>
  new Promise((resolve) => rl.question(question, (ans) => resolve(ans)));

async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║        RESET DE DATOS DEL DASHBOARD POS          ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // Mostrar cuántos registros hay actualmente
  const [orders, payments, movements, logs, tokens] = await Promise.all([
    prisma.order.count(),
    prisma.payment.count(),
    prisma.inventoryMovement.count(),
    prisma.auditLog.count(),
    prisma.refreshToken.count(),
  ]);

  console.log('📊 Datos actuales en la base de datos:');
  console.log(`   • Órdenes:              ${orders}`);
  console.log(`   • Pagos:                ${payments}`);
  console.log(`   • Mov. de inventario:   ${movements}`);
  console.log(`   • Logs de auditoría:    ${logs}`);
  console.log(`   • Sesiones activas:     ${tokens}`);

  if (orders === 0 && payments === 0 && movements === 0) {
    console.log('\n✅ El dashboard ya está en cero. No hay nada que limpiar.\n');
    rl.close();
    await prisma.$disconnect();
    return;
  }

  console.log('\n⚠️  ADVERTENCIA: Esta acción es IRREVERSIBLE.');
  console.log('   Se eliminarán todas las órdenes, pagos y movimientos.');
  console.log('   Los IDs se resetearán a 1 (TRUNCATE).\n');

  const respuesta = await confirm('¿Estás seguro? Escribe "si" para continuar: ');

  if (respuesta.trim().toLowerCase() !== 'si') {
    console.log('\n❌ Operación cancelada. No se borró nada.\n');
    rl.close();
    await prisma.$disconnect();
    return;
  }

  console.log('\n🔄 Limpiando datos...\n');

  // Deshabilitar FK checks para poder truncar en cualquier orden
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');

  await prisma.$executeRawUnsafe('TRUNCATE TABLE `audit_logs`');
  console.log('   ✅ audit_logs limpiado (IDs reseteados)');

  await prisma.$executeRawUnsafe('TRUNCATE TABLE `refresh_tokens`');
  console.log('   ✅ refresh_tokens limpiado (IDs reseteados)');

  await prisma.$executeRawUnsafe('TRUNCATE TABLE `payments`');
  console.log('   ✅ payments limpiado (IDs reseteados)');

  await prisma.$executeRawUnsafe('TRUNCATE TABLE `order_items`');
  console.log('   ✅ order_items limpiado (IDs reseteados)');

  await prisma.$executeRawUnsafe('TRUNCATE TABLE `orders`');
  console.log('   ✅ orders limpiado (IDs reseteados)');

  await prisma.$executeRawUnsafe('TRUNCATE TABLE `inventory_movements`');
  console.log('   ✅ inventory_movements limpiado (IDs reseteados)');

  // Restaurar FK checks
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');

  // Resetear estado de todas las mesas a FREE
  await prisma.table.updateMany({
    data: { status: 'FREE' },
  });
  console.log('   ✅ Mesas reseteadas a FREE');

  console.log('\n🎉 ¡Listo! El dashboard está en cero.');
  console.log('   IDs reseteados a 1 en todas las tablas.');
  console.log('   Los productos, categorías y usuarios NO fueron afectados.\n');

  rl.close();
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('\n❌ Error:', e.message);
  prisma.$disconnect();
  rl.close();
  process.exit(1);
});
