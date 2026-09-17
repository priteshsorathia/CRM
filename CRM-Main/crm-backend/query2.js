const prisma = require('./src/lib/prisma');

async function main() {
  const today = new Date('2026-06-19T00:00:00.000Z');
  const end = new Date('2026-06-19T23:59:59.999Z');

  const orders = await prisma.restaurantOrder.findMany({
    where: {
      created_at: {
        gte: today,
        lte: end
      }
    },
    include: { items: true }
  });
  console.log('--- TODAY ORDERS ---');
  console.log(JSON.stringify(orders, null, 2));

  const invoices = await prisma.restaurantInvoice.findMany({
    where: {
      created_at: {
        gte: today,
        lte: end
      }
    },
    include: { items: true }
  });
  console.log('--- TODAY INVOICES ---');
  console.log(JSON.stringify(invoices, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
