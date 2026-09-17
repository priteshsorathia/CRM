const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function extractToken(description) {
  if (!description) return null;
  const text = String(description);
  const m = text.match(/Created order\s+([^\s(]+)/i);
  return m?.[1] ? String(m[1]).trim() : null;
}

async function main() {
  const logs = await prisma.activityLog.findMany({
    where: {
      module: "Restaurant Orders",
      action: "Create Order",
      status: "Success",
    },
    select: {
      shopId: true,
      userId: true,
      description: true,
      user: { select: { name: true, username: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const tokenMap = new Map();
  for (const log of logs) {
    const token = extractToken(log.description);
    if (!token) continue;
    const key = `${log.shopId}:${token}`;
    if (tokenMap.has(key)) continue;
    const userName =
      log.user?.name || log.user?.username || log.user?.email || null;
    tokenMap.set(key, {
      shopId: log.shopId,
      token,
      userId: log.userId,
      userName: userName ? String(userName).trim() : null,
    });
  }

  const ordersToFix = await prisma.restaurantOrder.findMany({
    where: {
      OR: [{ taken_by_id: null }, { taken_by_name: null }],
    },
    select: { id: true, shopId: true, order_token: true },
  });

  let updated = 0;
  let skipped = 0;

  for (const order of ordersToFix) {
    const key = `${order.shopId}:${order.order_token}`;
    const match = tokenMap.get(key);
    if (!match) {
      skipped += 1;
      continue;
    }

    await prisma.restaurantOrder.update({
      where: { id: order.id },
      data: {
        taken_by_id: match.userId,
        taken_by_name: match.userName,
      },
    });
    updated += 1;
  }

  // eslint-disable-next-line no-console
  console.log(
    `Backfill complete. Updated: ${updated}. Skipped (no matching log): ${skipped}.`
  );
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Backfill failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

