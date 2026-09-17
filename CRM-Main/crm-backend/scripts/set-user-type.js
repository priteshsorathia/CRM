const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const usernameOrEmail = process.argv[2];
  const userType = String(process.argv[3] || "").trim().toLowerCase();

  if (!usernameOrEmail) {
    // eslint-disable-next-line no-console
    console.error("Usage: node scripts/set-user-type.js <username-or-email> <restaurants|retailers>");
    process.exitCode = 1;
    return;
  }

  if (userType !== "restaurants" && userType !== "retailers") {
    // eslint-disable-next-line no-console
    console.error('Invalid userType. Use "restaurants" or "retailers".');
    process.exitCode = 1;
    return;
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    },
    select: { id: true, username: true, email: true, userType: true },
  });

  if (!user) {
    // eslint-disable-next-line no-console
    console.error("User not found.");
    process.exitCode = 1;
    return;
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { userType },
    select: { id: true, username: true, email: true, userType: true },
  });

  // eslint-disable-next-line no-console
  console.log("Updated:", updated);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

