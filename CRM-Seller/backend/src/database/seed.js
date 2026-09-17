const prisma = require('./prisma');

async function main() {
  console.log("Seeding database...");

  // Add the requested super-admin developer
  await prisma.employee.upsert({
    where: { email: 'admin@crm-platform.local' },
    update: {
      password: 'Admin@123',
      username: 'crm_owner',
      role: 'Admin',
      status: 'Active'
    },
    create: {
      name: 'CRM Owner',
      email: 'admin@crm-platform.local',
      username: 'crm_owner',
      password: 'Admin@123',
      role: 'Admin',
      phone: '8758309749',
      status: 'Active'
    }
  });

  // Seed sample Reviews (if the table exists in schema)
  if (prisma.review) {
    const reviewData = [
      { reviewerName: 'James Potter', rating: 5, comment: 'Excellent service and timely callbacks!', status: 'Approved' },
      { reviewerName: 'Lily Evans', rating: 4, comment: 'Very helpful staff, resolved my issue quickly.', status: 'Pending' },
      { reviewerName: 'Remus Lupin', rating: 5, comment: 'The dashboard is very intuitive and easy to use.', status: 'Approved' }
    ];

    for (let i = 0; i < reviewData.length; i++) {
      await prisma.review.upsert({
        where: { serialId: i + 1 },
        update: reviewData[i],
        create: reviewData[i]
      });
    }
  }

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
