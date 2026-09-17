const prisma = require('./src/database/prisma.js');

async function fix() {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'asc' } });
  
  for (let i = 0; i < leads.length; i++) {
    await prisma.lead.update({
      where: { id: leads[i].id },
      data: { serialId: -(i+1) }
    });
  }

  for (let i = 0; i < leads.length; i++) {
    await prisma.lead.update({
      where: { id: leads[i].id },
      data: { serialId: (i+1) }
    });
  }

  await prisma.$executeRawUnsafe(`SELECT setval('leads_serialId_seq', (SELECT MAX("serialId") FROM leads))`);
}

fix()
  .then(() => {
    console.log('Done fixing serialIds');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
