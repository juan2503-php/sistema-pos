// ============================================
// Seed de datos iniciales
// ============================================
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos...');

  // ── Admin por defecto ──
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pos.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@pos.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin creado:', admin.email);

  // ── Mesero de ejemplo ──
  const waiterPassword = await bcrypt.hash('mesero123', 12);
  const waiter = await prisma.user.upsert({
    where: { email: 'mesero@pos.com' },
    update: {},
    create: {
      name: 'Carlos Mesero',
      email: 'mesero@pos.com',
      password: waiterPassword,
      role: 'WAITER',
    },
  });
  console.log('✅ Mesero creado:', waiter.email);

  // ── Categorías ──
  const categories = [
    { name: 'Entradas', icon: '🥗' },
    { name: 'Platos Fuertes', icon: '🍖' },
    { name: 'Bebidas', icon: '🥤' },
    { name: 'Postres', icon: '🍰' },
    { name: 'Cervezas', icon: '🍺' },
    { name: 'Vinos', icon: '🍷' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log('✅ Categorías creadas');

  // ── Obtener IDs de categorías ──
  const allCategories = await prisma.category.findMany();
  const catMap = {};
  allCategories.forEach((c) => (catMap[c.name] = c.id));

  // ── Productos ──
  const products = [
    { name: 'Ensalada César', description: 'Lechuga romana, crutones, parmesano', price: 85.00, stock: 50, categoryId: catMap['Entradas'] },
    { name: 'Sopa del Día', description: 'Sopa caliente de temporada', price: 65.00, stock: 30, categoryId: catMap['Entradas'] },
    { name: 'Nachos con Guacamole', description: 'Totopos crujientes con guacamole fresco', price: 95.00, stock: 40, categoryId: catMap['Entradas'] },
    { name: 'Hamburguesa Clásica', description: 'Res 200g, queso cheddar, lechuga, tomate', price: 145.00, stock: 25, categoryId: catMap['Platos Fuertes'] },
    { name: 'Pollo a la Parrilla', description: 'Pechuga de pollo con guarnición', price: 165.00, stock: 20, categoryId: catMap['Platos Fuertes'] },
    { name: 'Tacos al Pastor', description: '3 tacos de cerdo adobado con piña', price: 110.00, stock: 40, categoryId: catMap['Platos Fuertes'] },
    { name: 'Filete de Res', description: 'Corte premium 300g con papas', price: 285.00, stock: 15, categoryId: catMap['Platos Fuertes'] },
    { name: 'Pasta Alfredo', description: 'Fettuccine con salsa cremosa', price: 135.00, stock: 20, categoryId: catMap['Platos Fuertes'] },
    { name: 'Agua Natural', description: '600ml', price: 25.00, stock: 100, categoryId: catMap['Bebidas'] },
    { name: 'Refresco', description: 'Coca-Cola, Sprite, Fanta', price: 35.00, stock: 80, categoryId: catMap['Bebidas'] },
    { name: 'Jugo de Naranja', description: 'Jugo natural', price: 45.00, stock: 40, categoryId: catMap['Bebidas'] },
    { name: 'Limonada', description: 'Limonada fresca', price: 40.00, stock: 50, categoryId: catMap['Bebidas'] },
    { name: 'Flan Napolitano', description: 'Postre casero con caramelo', price: 55.00, stock: 20, categoryId: catMap['Postres'] },
    { name: 'Pastel de Chocolate', description: 'Rebanada de pastel triple chocolate', price: 75.00, stock: 15, categoryId: catMap['Postres'] },
    { name: 'Cerveza Nacional', description: 'Corona, Modelo, Victoria', price: 45.00, stock: 60, categoryId: catMap['Cervezas'] },
    { name: 'Cerveza Importada', description: 'Heineken, Stella Artois', price: 65.00, stock: 30, categoryId: catMap['Cervezas'] },
    { name: 'Vino Tinto Casa', description: 'Copa de vino tinto de la casa', price: 85.00, stock: 25, categoryId: catMap['Vinos'] },
    { name: 'Vino Blanco Casa', description: 'Copa de vino blanco de la casa', price: 85.00, stock: 25, categoryId: catMap['Vinos'] },
  ];

  for (const prod of products) {
    const existing = await prisma.product.findFirst({ where: { name: prod.name } });
    if (!existing) {
      await prisma.product.create({ data: prod });
    }
  }
  console.log('✅ Productos creados');

  // ── Mesas ──
  for (let i = 1; i <= 12; i++) {
    await prisma.table.upsert({
      where: { number: i },
      update: {},
      create: {
        number: i,
        capacity: i <= 4 ? 2 : i <= 8 ? 4 : 6,
      },
    });
  }
  console.log('✅ 12 mesas creadas');

  console.log('🎉 Seed completado exitosamente');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
